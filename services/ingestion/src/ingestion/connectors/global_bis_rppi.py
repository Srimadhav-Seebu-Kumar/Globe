"""BIS residential property price index (global benchmark fallback).

Free quarterly indices for ~60 countries/regions. Not per-m² zone data — this
is the terminal fallback when market-specific zone sources are stale or absent.
"""

from __future__ import annotations

import csv
import io
import re
import zipfile

from ..framework import http_get
from ..models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedValueZone,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)

SOURCE_CODE = "global-bis-rppi"
MARKET_CODE = "global"
URL = "https://data.bis.org/static/bulk/WS_SPP_csv_col.zip"
_PERIOD = re.compile(r"^\d{4}-Q[1-4]$")


class GlobalBisRppiConnector:
    source_code = SOURCE_CODE

    def fetch(self) -> list[RawArtifact]:
        content = http_get(URL, timeout_s=120.0)
        return [
            RawArtifact(
                name="WS_SPP_csv_col.zip",
                content=content,
                content_type="application/zip",
                fetched_at=utc_now_iso(),
                source_url=URL,
            )
        ]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedValueZone]:
        ingested_at = utc_now_iso()
        records: list[NormalizedValueZone] = []

        for artifact in artifacts:
            with zipfile.ZipFile(io.BytesIO(artifact.content)) as archive:
                csv_name = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
                text = archive.read(csv_name).decode("utf-8-sig", errors="replace")

            reader = csv.DictReader(io.StringIO(text))
            period_columns = [col for col in (reader.fieldnames or []) if _PERIOD.match(col)]

            for row in reader:
                country = (row.get("REF_AREA") or "").strip()
                if not country:
                    continue

                latest_period = ""
                latest_value: float | None = None
                for period in period_columns:
                    raw = (row.get(period) or "").strip()
                    if not raw:
                        continue
                    try:
                        value = float(raw)
                    except ValueError:
                        continue
                    latest_period = period
                    latest_value = value

                if latest_period == "" or latest_value is None:
                    continue

                year, quarter = latest_period.split("-Q")
                month = {"1": "01", "2": "04", "3": "07", "4": "10"}[quarter]
                observed_at = f"{year}-{month}-01"
                record_id = f"{SOURCE_CODE}:{country}:{latest_period}"

                records.append(
                    NormalizedValueZone(
                        record_id=record_id,
                        source_record_id=f"{country}:{latest_period}",
                        market_code=MARKET_CODE,
                        country_code=country if len(country) <= 3 else "*",
                        value_per_sqm=max(1, int(abs(latest_value) * 100)),
                        currency_code="INDEX",
                        observed_at=observed_at,
                        freshness=FreshnessTier.QUARTERLY,
                        confidence=ConfidenceLabel.MEDIUM,
                        provenance=ProvenanceStamp(
                            source_id=SOURCE_CODE,
                            observed_at=observed_at,
                            ingested_at=ingested_at,
                            transformation_version="bis-rppi-v1",
                        ),
                        zone_name=country,
                        attributes={
                            "index_change_pct": latest_value,
                            "unit": "year_on_year_pct_change",
                            "frequency": row.get("FREQ", ""),
                            "value_type": row.get("VALUE", ""),
                            "period": latest_period,
                            "series_title": row.get("TITLE_TS", ""),
                        },
                    )
                )
        return records
