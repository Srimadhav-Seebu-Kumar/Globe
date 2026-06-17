"""Japan MLIT official land price publication points (地価公示, L01).

National standard sites with official ¥/m² values published annually on 1 Jan.
GeoJSON is bundled inside the KSJ download ZIP (CC BY 4.0 since 2019).

Default scope: Tokyo prefecture (code 13) — override with JP_KOJI_PREF and
JP_KOJI_YEAR (two-digit, e.g. 26 for 2026).
"""

from __future__ import annotations

import os

from ..framework import http_get
from ..geo_formats import parse_geojson_features, pick_field, read_zip_member
from ..models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedValueZone,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)

SOURCE_CODE = "jp-mlit-koji"
MARKET_CODE = "jp-national"
BASE = "https://nlftp.mlit.go.jp/ksj/gml/data/L01"


class MlitKojiConnector:
    source_code = SOURCE_CODE

    def __init__(self, year_suffix: str, pref_code: str) -> None:
        self._year_suffix = year_suffix
        self._pref_code = pref_code.zfill(2)

    @classmethod
    def from_env(cls) -> "MlitKojiConnector":
        year = os.environ.get("JP_KOJI_YEAR", "26")
        pref = os.environ.get("JP_KOJI_PREF", "13")
        return cls(year_suffix=year, pref_code=pref)

    def _artifact_name(self) -> str:
        return f"L01-{self._year_suffix}_{self._pref_code}_GML.zip"

    def _source_url(self) -> str:
        year_dir = f"L01-{self._year_suffix}"
        name = self._artifact_name()
        return f"{BASE}/{year_dir}//{name}"

    def fetch(self) -> list[RawArtifact]:
        url = self._source_url()
        content = http_get(url, timeout_s=180.0)
        return [
            RawArtifact(
                name=self._artifact_name(),
                content=content,
                content_type="application/zip",
                fetched_at=utc_now_iso(),
                source_url=url,
            )
        ]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedValueZone]:
        ingested_at = utc_now_iso()
        observed_at = f"20{self._year_suffix}-01-01"
        records: list[NormalizedValueZone] = []

        for artifact in artifacts:
            geojson = read_zip_member(artifact.content, ".geojson")
            for feature in parse_geojson_features(geojson):
                props = feature.get("properties") or {}
                price = pick_field(props, "L01_008", "price", "公示価格")
                try:
                    value_per_sqm = int(float(price))
                except (TypeError, ValueError):
                    continue
                if value_per_sqm <= 0:
                    continue

                site_id = "-".join(
                    str(pick_field(props, key) or "")
                    for key in ("L01_001", "L01_002", "L01_003", "L01_004", "L01_005", "L01_006")
                ).strip("-")
                if not site_id:
                    site_id = str(len(records) + 1)

                geometry = feature.get("geometry") or {}
                address_text = str(pick_field(props, "L01_025", "address") or "")
                district = str(pick_field(props, "L01_024", "district") or "")

                records.append(
                    NormalizedValueZone(
                        record_id=f"{SOURCE_CODE}:{self._year_suffix}-{self._pref_code}:{site_id}",
                        source_record_id=site_id,
                        market_code=MARKET_CODE,
                        country_code="JP",
                        value_per_sqm=value_per_sqm,
                        currency_code="JPY",
                        observed_at=observed_at,
                        freshness=FreshnessTier.SEMIANNUAL,
                        confidence=ConfidenceLabel.HIGH,
                        provenance=ProvenanceStamp(
                            source_id=SOURCE_CODE,
                            observed_at=observed_at,
                            ingested_at=ingested_at,
                            transformation_version="mlit-koji-v1",
                        ),
                        zone_name=district,
                        geometry=geometry if isinstance(geometry, dict) else {},
                        address={"prefecture_code": self._pref_code, "district": district, "full": address_text},
                        attributes={
                            "land_area_sqm": pick_field(props, "L01_009"),
                            "land_use": pick_field(props, "L01_028"),
                            "zoning": pick_field(props, "L01_051"),
                            "year": int(f"20{self._year_suffix}"),
                            "prefecture_code": self._pref_code,
                        },
                    )
                )
        return records
