"""Germany NRW BORIS Bodenrichtwerte (official €/m² land-value zones).

Free under Datenlizenz Deutschland – Zero – 2.0. The statewide shapefile covers
every m² of Nordrhein-Westfalen with zonally uniform reference values (not
market transaction prices).

Override download URL with DE_NRW_BRW_URL if needed.
"""

from __future__ import annotations

import os

from ..framework import http_get
from ..geo_formats import iter_dbf_records, pick_field, read_zip_member
from ..models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedValueZone,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)

SOURCE_CODE = "de-nrw-boris"
MARKET_CODE = "de-nrw"
DEFAULT_URL = (
    "https://www.opengeodata.nrw.de/produkte/infrastruktur_bauen_wohnen/boris/BRW/BRW_2025_EPSG25832_Shape.zip"
)


class DeNrwBorisConnector:
    source_code = SOURCE_CODE

    def __init__(self, url: str | None = None, reference_year: str = "2025") -> None:
        self._url = url or os.environ.get("DE_NRW_BRW_URL", DEFAULT_URL)
        self._reference_year = reference_year

    def fetch(self) -> list[RawArtifact]:
        content = http_get(self._url, timeout_s=600.0)
        return [
            RawArtifact(
                name="BRW_EPSG25832_Shape.zip",
                content=content,
                content_type="application/zip",
                fetched_at=utc_now_iso(),
                source_url=self._url,
            )
        ]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedValueZone]:
        ingested_at = utc_now_iso()
        observed_at = f"{self._reference_year}-01-01"
        records: list[NormalizedValueZone] = []

        for artifact in artifacts:
            dbf = read_zip_member(artifact.content, ".dbf")
            for index, row in enumerate(iter_dbf_records(dbf)):
                value_raw = pick_field(
                    row,
                    "BRW",
                    "BRW_EUR",
                    "BRW_EUR_QM",
                    "BODENRIC",
                    "BODENRICHTWERT",
                    "WERT",
                )
                try:
                    value_per_sqm = int(float(str(value_raw).replace(",", ".")))
                except (TypeError, ValueError):
                    continue
                if value_per_sqm <= 0:
                    continue

                zone_id = str(
                    pick_field(row, "BRW_ID", "GID", "OBJECTID", "ID", "BRW_ZONE") or f"row-{index}"
                )
                zone_name = str(pick_field(row, "BRW_ZONE", "ZONE", "ZONE_NAME", "NAME", "GEMEINDE") or "")
                municipality = str(pick_field(row, "GEMEINDE", "GEM", "GEMA", "MUNICIPAL") or "")

                records.append(
                    NormalizedValueZone(
                        record_id=f"{SOURCE_CODE}:{zone_id}",
                        source_record_id=zone_id,
                        market_code=MARKET_CODE,
                        country_code="DE",
                        value_per_sqm=value_per_sqm,
                        currency_code="EUR",
                        observed_at=observed_at,
                        freshness=FreshnessTier.SEMIANNUAL,
                        confidence=ConfidenceLabel.HIGH,
                        provenance=ProvenanceStamp(
                            source_id=SOURCE_CODE,
                            observed_at=observed_at,
                            ingested_at=ingested_at,
                            transformation_version="de-nrw-boris-v1",
                        ),
                        zone_name=zone_name or municipality,
                        address={"municipality": municipality, "state": "Nordrhein-Westfalen"},
                        attributes={
                            "land_use": pick_field(row, "ENTW", "NUTZUNG", "NUTZUNGSART"),
                            "reference_year": self._reference_year,
                            "crs": "EPSG:25832",
                        },
                    )
                )
        return records
