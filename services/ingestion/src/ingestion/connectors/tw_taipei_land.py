"""Taipei City parcel announced land/current values (公告現值 / 公告地價).

Per-parcel official values in TWD/m² from the Taipei open-data platform.
Direct download via the frontstage resource API (BIG-5 CSV).

Override resource with TAIPEI_LAND_RID (default: latest 115-year file on the
dataset page). Set TAIPEI_LAND_MAX_ROWS to cap rows during dev/test.
"""

from __future__ import annotations

import csv
import io
import os
import re

from ..framework import http_get
from ..models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedValueZone,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)

SOURCE_CODE = "tw-taipei-land-price"
MARKET_CODE = "tw-taipei"

DEFAULT_RID = "7802c9b4-fc64-466c-82fc-ec5884bb6871"
DOWNLOAD_BASE = "https://data.taipei/api/frontstage/tpeod/dataset/resource.download"


def _download_url(rid: str) -> str:
    return f"{DOWNLOAD_BASE}?rid={rid}"


def _pick(row: dict[str, str], *names: str) -> str:
    for name in names:
        value = row.get(name)
        if value and value.strip():
            return value.strip()
    return ""


def _parse_int(value: str) -> int:
    digits = re.sub(r"[^\d]", "", value or "")
    return int(digits) if digits else 0


class TwTaipeiLandPriceConnector:
    source_code = SOURCE_CODE

    def __init__(self, resource_id: str, max_rows: int | None = None, reference_year: str = "115") -> None:
        self._resource_id = resource_id
        self._max_rows = max_rows
        self._reference_year = reference_year

    @classmethod
    def from_env(cls) -> "TwTaipeiLandPriceConnector":
        max_rows_raw = os.environ.get("TAIPEI_LAND_MAX_ROWS", "")
        max_rows = int(max_rows_raw) if max_rows_raw.isdigit() else None
        return cls(
            resource_id=os.environ.get("TAIPEI_LAND_RID", DEFAULT_RID),
            max_rows=max_rows,
            reference_year=os.environ.get("TAIPEI_LAND_YEAR", "115"),
        )

    def fetch(self) -> list[RawArtifact]:
        url = _download_url(self._resource_id)
        content = http_get(url, timeout_s=600.0)
        return [
            RawArtifact(
                name=f"taipei-land-price-{self._reference_year}.csv",
                content=content,
                content_type="text/csv; charset=BIG-5",
                fetched_at=utc_now_iso(),
                source_url=url,
            )
        ]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedValueZone]:
        ingested_at = utc_now_iso()
        observed_at = f"{int(self._reference_year) + 1911}-01-01"
        records: list[NormalizedValueZone] = []

        for artifact in artifacts:
            text = artifact.content.decode("big5", errors="replace")
            reader = csv.DictReader(io.StringIO(text))
            for index, row in enumerate(reader):
                if self._max_rows is not None and index >= self._max_rows:
                    break

                district = _pick(row, "行政區", "district")
                section = _pick(row, "段小段", "section")
                parcel_no = _pick(row, "地號", "parcel")
                if not parcel_no:
                    continue

                current_value = _parse_int(_pick(row, "公告土地現值（新臺幣元每平方公尺）", "current_value"))
                announced_land = _parse_int(_pick(row, "公告地價（新臺幣元每平方公尺）", "land_price"))
                value_per_sqm = current_value or announced_land
                if value_per_sqm <= 0:
                    continue

                parcel_id = f"{section}:{parcel_no}".replace(" ", "")
                record_id = f"{SOURCE_CODE}:{parcel_id}"

                records.append(
                    NormalizedValueZone(
                        record_id=record_id,
                        source_record_id=parcel_id,
                        market_code=MARKET_CODE,
                        country_code="TW",
                        value_per_sqm=value_per_sqm,
                        currency_code="TWD",
                        observed_at=observed_at,
                        freshness=FreshnessTier.SEMIANNUAL,
                        confidence=ConfidenceLabel.HIGH,
                        provenance=ProvenanceStamp(
                            source_id=SOURCE_CODE,
                            observed_at=observed_at,
                            ingested_at=ingested_at,
                            transformation_version="tw-taipei-land-v1",
                        ),
                        zone_name=f"{district} {section}".strip(),
                        address={
                            "city": "Taipei",
                            "district": district,
                            "section": section,
                            "parcel_no": parcel_no,
                        },
                        attributes={
                            "announced_land_price_twd_per_sqm": announced_land or None,
                            "current_land_value_twd_per_sqm": current_value or None,
                            "reference_year_roc": self._reference_year,
                            "aggregation_level": "parcel",
                        },
                    )
                )
        return records
