"""Taiwan MOI national announced land value statistics (county aggregates).

Free CSV from the Ministry of the Interior open-data portal. This is tier-B
coverage: county-level totals and aggregate announced land values (千元), not
parcel-level zone polygons. Parcel-level data exists per municipality (e.g.
Taipei, Taichung) and is registered separately.
"""

from __future__ import annotations

import csv
import io

from ..framework import http_get
from ..models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedValueZone,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)

SOURCE_CODE = "tw-moi-land-stats"
MARKET_CODE = "tw-national"
URL = (
    "https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/"
    "7F884D5B-9636-4367-B72C-BD7A10ADBDB9/resource/"
    "D4507A19-21F7-436F-BA81-A202DC8811FB/download"
)


class TwMoiLandStatsConnector:
    source_code = SOURCE_CODE

    def fetch(self) -> list[RawArtifact]:
        content = http_get(URL, timeout_s=60.0)
        return [
            RawArtifact(
                name="tw-county-land-stats.csv",
                content=content,
                content_type="text/csv",
                fetched_at=utc_now_iso(),
                source_url=URL,
            )
        ]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedValueZone]:
        ingested_at = utc_now_iso()
        records: list[NormalizedValueZone] = []

        for artifact in artifacts:
            reader = csv.DictReader(io.StringIO(artifact.content.decode("utf-8-sig")))
            for row in reader:
                county = (row.get("CityCounty") or row.get("County") or "").strip()
                if not county:
                    continue

                area_ha_raw = (row.get("LandArea_Ha") or "").strip()
                price_thousand_raw = (
                    row.get("Current_land_value_Thousand")
                    or row.get("Announcement_of_Land_price_Thousand")
                    or ""
                ).strip()
                date_raw = (row.get("Date") or "").strip()
                if not (area_ha_raw and price_thousand_raw and date_raw):
                    continue

                try:
                    area_ha = float(area_ha_raw)
                    total_thousand_twd = float(price_thousand_raw)
                except ValueError:
                    continue
                if area_ha <= 0 or total_thousand_twd <= 0:
                    continue

                # Convert aggregate 千元 over hectares → approximate TWD/m² for map context.
                area_sqm = area_ha * 10_000
                total_twd = int(total_thousand_twd * 1_000)
                value_per_sqm = max(1, int(total_twd / area_sqm))

                observed_at = f"{date_raw[0:4]}-{date_raw[4:6]}-{date_raw[6:8]}"
                county_code = (row.get("CountyCode") or "").strip()
                record_id = f"{SOURCE_CODE}:{county_code or county}:{observed_at}"

                records.append(
                    NormalizedValueZone(
                        record_id=record_id,
                        source_record_id=county_code or county,
                        market_code=MARKET_CODE,
                        country_code="TW",
                        value_per_sqm=value_per_sqm,
                        currency_code="TWD",
                        observed_at=observed_at,
                        freshness=FreshnessTier.SEMIANNUAL,
                        confidence=ConfidenceLabel.MEDIUM,
                        provenance=ProvenanceStamp(
                            source_id=SOURCE_CODE,
                            observed_at=observed_at,
                            ingested_at=ingested_at,
                            transformation_version="tw-moi-land-stats-v1",
                        ),
                        zone_name=county,
                        address={"county": county, "county_code": county_code},
                        attributes={
                            "land_area_ha": area_ha,
                            "announcement_total_thousand_twd": total_thousand_twd,
                            "aggregation_level": "county",
                            "provider": row.get("Providing_Agency", ""),
                        },
                    )
                )
        return records
