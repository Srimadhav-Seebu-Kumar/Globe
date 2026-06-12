"""Korea MOLIT land-transaction connector (RTMS open API via data.go.kr).

Free with an auto-approved API key from https://www.data.go.kr — set it as
``MOLIT_API_KEY``. The feed is refreshed daily; deals are reported within
~30 days of contract under the Real Estate Transaction Reporting Act.

Query unit: one legal district (5-digit LAWD_CD) × one contract month
(DEAL_YMD, YYYYMM). Responses are XML; tag names vary between API
generations (English camelCase vs Korean), so parsing checks both.
"""

from __future__ import annotations

import hashlib
import os
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from ..framework import http_get
from ..models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedTransaction,
    PriceState,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)

SOURCE_CODE = "kr-molit-land"
MARKET_CODE = "kr-national"

# The legacy openapi.molit.go.kr host is retired (connection refused, verified
# 2026-06-12); the API now lives on the unified data.go.kr gateway.
ENDPOINT = "https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade"

# Amounts are reported in units of 10,000 KRW (만원).
_KRW_UNIT = 10_000


def _previous_month_yyyymm(now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    year, month = (now.year, now.month - 1) if now.month > 1 else (now.year - 1, 12)
    return f"{year:04d}{month:02d}"


def _text(item: ET.Element, *tag_names: str) -> str:
    """Read the first present tag from a list of candidates (EN/KR API variants)."""
    for tag in tag_names:
        node = item.find(tag)
        if node is not None and node.text:
            return node.text.strip()
    return ""


class MolitLandTradeConnector:
    source_code = SOURCE_CODE

    def __init__(self, api_key: str, lawd_cd: str, deal_ymd: str, rows: int = 1000) -> None:
        self._api_key = api_key
        self._lawd_cd = lawd_cd
        self._deal_ymd = deal_ymd
        self._rows = rows

    @classmethod
    def from_env(cls) -> "MolitLandTradeConnector":
        api_key = os.environ.get("MOLIT_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "MOLIT_API_KEY is not set. Get a free auto-approved key at https://www.data.go.kr "
                "(국토교통부 토지 매매 실거래가) and export MOLIT_API_KEY."
            )
        return cls(
            api_key=api_key,
            lawd_cd=os.environ.get("MOLIT_LAWD_CD", "11110"),  # default: Seoul Jongno-gu
            deal_ymd=os.environ.get("MOLIT_DEAL_YMD", _previous_month_yyyymm()),
        )

    def fetch(self) -> list[RawArtifact]:
        query = urllib.parse.urlencode(
            {
                "serviceKey": self._api_key,
                "LAWD_CD": self._lawd_cd,
                "DEAL_YMD": self._deal_ymd,
                "numOfRows": str(self._rows),
                "pageNo": "1",
            },
            safe="%",  # data.go.kr keys are pre-encoded; do not double-encode
        )
        url = f"{ENDPOINT}?{query}"
        content = http_get(url, timeout_s=60.0)
        return [
            RawArtifact(
                name=f"land-trade-{self._lawd_cd}-{self._deal_ymd}.xml",
                content=content,
                content_type="application/xml",
                fetched_at=utc_now_iso(),
                # Never persist the API key into lineage.
                source_url=f"{ENDPOINT}?LAWD_CD={self._lawd_cd}&DEAL_YMD={self._deal_ymd}",
            )
        ]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedTransaction]:
        ingested_at = utc_now_iso()
        records: list[NormalizedTransaction] = []
        for artifact in artifacts:
            root = ET.fromstring(artifact.content)

            result_code = root.findtext(".//resultCode", default="00").strip()
            if result_code not in ("00", "000"):
                message = root.findtext(".//resultMsg", default="unknown error")
                raise RuntimeError(f"MOLIT API error {result_code}: {message}")

            for item in root.iter("item"):
                record = self._normalize_item(item, ingested_at)
                if record is not None:
                    records.append(record)
        return records

    def _normalize_item(self, item: ET.Element, ingested_at: str) -> NormalizedTransaction | None:
        amount_raw = _text(item, "dealAmount", "거래금액").replace(",", "")
        try:
            amount = int(amount_raw) * _KRW_UNIT
        except ValueError:
            amount = 0  # flagged by QA price_sanity

        year = _text(item, "dealYear", "년")
        month = _text(item, "dealMonth", "월")
        day = _text(item, "dealDay", "일") or "1"
        if not (year and month):
            return None
        observed_at = f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

        district = _text(item, "umdNm", "법정동")
        region_code = _text(item, "sggCd", "지역코드") or self._lawd_cd
        area_sqm = _text(item, "dealArea", "거래면적")
        land_use = _text(item, "jimok", "지목")
        zone = _text(item, "landUse", "용도지역")

        # The API exposes no stable transaction id — derive a deterministic one.
        digest_basis = "|".join((region_code, district, observed_at, amount_raw, area_sqm, land_use))
        digest = hashlib.sha256(digest_basis.encode("utf-8")).hexdigest()[:20]

        return NormalizedTransaction(
            record_id=f"{SOURCE_CODE}:{digest}",
            source_record_id=digest,
            market_code=MARKET_CODE,
            country_code="KR",
            price_state=PriceState.CLOSED,
            amount=amount,
            currency_code="KRW",
            observed_at=observed_at,
            freshness=FreshnessTier.DAILY,
            confidence=ConfidenceLabel.HIGH,
            provenance=ProvenanceStamp(
                source_id=SOURCE_CODE,
                observed_at=observed_at,
                ingested_at=ingested_at,
                transformation_version="molit-land-v1",
            ),
            address={"region_code": region_code, "district": district},
            attributes={
                "area_sqm": float(area_sqm) if area_sqm else None,
                "land_category": land_use,
                "zoning": zone,
                "deal_ymd": self._deal_ymd,
            },
        )
