"""Czech average property purchase prices by district (ČSÚ / ČÚZK via NKOD).

District-level average Kč/m² for flats and family houses. Not parcel zones,
but official open statistics usable as tier-B market depth context.
"""

from __future__ import annotations

import csv
import io
import json
import os

from ..framework import http_get
from ..models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedValueZone,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)

SOURCE_CODE = "cz-csu-avg-prices"
MARKET_CODE = "cz-national"

# Set CZ_CSU_CSV_URL to the NKOD distribution CSV (catalog page varies by revision).
DEFAULT_CSV_URL = ""


class CzCsuAvgPricesConnector:
    source_code = SOURCE_CODE

    def __init__(self, csv_url: str | None = None) -> None:
        self._csv_url = csv_url or os.environ.get("CZ_CSU_CSV_URL", DEFAULT_CSV_URL)

    def fetch(self) -> list[RawArtifact]:
        if not self._csv_url:
            raise RuntimeError("CZ_CSU_CSV_URL is required — set to the NKOD distribution CSV URL")
        content = http_get(self._csv_url, timeout_s=120.0)
        return [
            RawArtifact(
                name="cz-avg-property-prices.csv",
                content=content,
                content_type="text/csv",
                fetched_at=utc_now_iso(),
                source_url=self._csv_url,
            )
        ]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedValueZone]:
        ingested_at = utc_now_iso()
        records: list[NormalizedValueZone] = []

        for artifact in artifacts:
            text = artifact.content.decode("utf-8-sig", errors="replace")
            if text.lstrip().startswith("{"):
                payload = json.loads(text)
                rows = payload if isinstance(payload, list) else payload.get("data", [])
                if not rows:
                    continue
                fieldnames = list(rows[0].keys()) if rows else []
                reader = (dict(zip(fieldnames, [str(row.get(k, "")) for k in fieldnames])) for row in rows)
            else:
                reader = csv.DictReader(io.StringIO(text))

            for index, row in enumerate(reader):
                region = (row.get("uzemi") or row.get("region") or row.get("kraj") or row.get("okres") or "").strip()
                if not region:
                    continue

                price_raw = (
                    row.get("cena_bytu")
                    or row.get("prumer_cena_bytu")
                    or row.get("average_price_flat")
                    or row.get("cena")
                    or ""
                )
                try:
                    value_per_sqm = int(float(str(price_raw).replace(",", ".").replace(" ", "")))
                except ValueError:
                    continue
                if value_per_sqm <= 0:
                    continue

                period = (row.get("obdobi") or row.get("period") or row.get("rok") or "2024").strip()
                observed_at = f"{period[:4]}-01-01" if period[:4].isdigit() else "2024-01-01"
                digest = f"{region}:{period}:{value_per_sqm}:{index}"

                records.append(
                    NormalizedValueZone(
                        record_id=f"{SOURCE_CODE}:{digest}",
                        source_record_id=digest,
                        market_code=MARKET_CODE,
                        country_code="CZ",
                        value_per_sqm=value_per_sqm,
                        currency_code="CZK",
                        observed_at=observed_at,
                        freshness=FreshnessTier.SEMIANNUAL,
                        confidence=ConfidenceLabel.MEDIUM,
                        provenance=ProvenanceStamp(
                            source_id=SOURCE_CODE,
                            observed_at=observed_at,
                            ingested_at=ingested_at,
                            transformation_version="cz-csu-avg-v1",
                        ),
                        zone_name=region,
                        address={"region": region},
                        attributes={
                            "aggregation_level": "district",
                            "property_type": row.get("druh") or row.get("type") or "mixed",
                            "period": period,
                        },
                    )
                )
        return records
