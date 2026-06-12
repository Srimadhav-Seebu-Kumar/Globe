"""HM Land Registry Price Paid Data connector (England & Wales).

Free under the Open Government Licence v3.0; updated on the 20th working day
of each month. The monthly file contains all transactions received in the
period plus changes/deletions to earlier releases.

Attribution (mandatory, surfaced via the source registry):
  "Contains HM Land Registry data © Crown copyright and database right 2021.
   This data is licensed under the Open Government Licence v3.0."

CSV layout (no header, 16 quoted columns):
  0 transaction id (GUID in braces)   8 SAON
  1 price (GBP, integer)              9 street
  2 date of transfer                 10 locality
  3 postcode                         11 town/city
  4 property type D/S/T/F/O          12 district
  5 old/new Y/N                      13 county
  6 duration F/L (tenure)            14 PPD category A/B
  7 PAON                             15 record status A/C/D (monthly file)
"""

from __future__ import annotations

import csv
import io
import os

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

SOURCE_CODE = "uk-hmlr-ppd"
MARKET_CODE = "uk-england-wales"

# Candidate URLs tried in order — connector-level fallback for the feed itself.
# Override with HMLR_PPD_URL to pin a specific file (e.g. a yearly file).
CANDIDATE_URLS: tuple[str, ...] = (
    "https://s3.eu-west-1.amazonaws.com/prod.publicdata.landregistry.gov.uk/pp-monthly-update-new-version.csv",
    "http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-monthly-update-new-version.csv",
)

_PROPERTY_TYPES = {"D": "detached", "S": "semi_detached", "T": "terraced", "F": "flat", "O": "other_or_land"}
_TENURES = {"F": "freehold", "L": "leasehold"}


class HmlrPricePaidConnector:
    source_code = SOURCE_CODE

    def __init__(self, url: str | None = None) -> None:
        self._url_override = url or os.environ.get("HMLR_PPD_URL")

    def fetch(self) -> list[RawArtifact]:
        urls = (self._url_override,) if self._url_override else CANDIDATE_URLS
        last_error: Exception | None = None
        for url in urls:
            try:
                content = http_get(url, timeout_s=300.0)
                return [
                    RawArtifact(
                        name="pp-monthly-update.csv",
                        content=content,
                        content_type="text/csv",
                        fetched_at=utc_now_iso(),
                        source_url=url,
                    )
                ]
            except Exception as error:  # try the next candidate URL
                last_error = error
        raise RuntimeError(f"all HMLR PPD URLs failed; last error: {last_error}")

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedTransaction]:
        ingested_at = utc_now_iso()
        records: list[NormalizedTransaction] = []
        for artifact in artifacts:
            text = artifact.content.decode("utf-8", errors="replace")
            for row in csv.reader(io.StringIO(text)):
                if len(row) < 15:
                    continue  # malformed line; QA reject-ratio gate catches systemic breaks
                record = self._normalize_row(row, ingested_at)
                if record is not None:
                    records.append(record)
        return records

    def _normalize_row(self, row: list[str], ingested_at: str) -> NormalizedTransaction | None:
        guid = row[0].strip("{}").strip()
        try:
            amount = int(float(row[1]))
        except ValueError:
            amount = 0  # flagged by QA price_sanity

        # "2026-04-17 00:00" → "2026-04-17"
        observed_at = row[2].strip().split(" ")[0]
        record_status = row[15].strip().upper() if len(row) > 15 else "A"
        if record_status == "D":
            return None  # deletion of a previously published record

        return NormalizedTransaction(
            record_id=f"{SOURCE_CODE}:{guid}",
            source_record_id=guid,
            market_code=MARKET_CODE,
            country_code="GB",
            price_state=PriceState.CLOSED,
            amount=amount,
            currency_code="GBP",
            observed_at=observed_at,
            freshness=FreshnessTier.MONTHLY,
            confidence=ConfidenceLabel.HIGH,
            provenance=ProvenanceStamp(
                source_id=SOURCE_CODE,
                observed_at=observed_at,
                ingested_at=ingested_at,
                transformation_version="hmlr-ppd-v1",
            ),
            address={
                "postcode": row[3].strip(),
                "paon": row[7].strip(),
                "saon": row[8].strip(),
                "street": row[9].strip(),
                "locality": row[10].strip(),
                "town": row[11].strip(),
                "district": row[12].strip(),
                "county": row[13].strip(),
            },
            attributes={
                "property_type": _PROPERTY_TYPES.get(row[4].strip().upper(), "unknown"),
                "new_build": row[5].strip().upper() == "Y",
                "tenure": _TENURES.get(row[6].strip().upper(), "unknown"),
                "ppd_category": row[14].strip().upper(),
                "record_status": record_status,
            },
        )
