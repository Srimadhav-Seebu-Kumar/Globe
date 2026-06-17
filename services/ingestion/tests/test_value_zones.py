import io
import json
import struct
import zipfile

import pytest

from ingestion.connectors.de_nrw_boris import DeNrwBorisConnector
from ingestion.connectors.global_bis_rppi import GlobalBisRppiConnector
from ingestion.connectors.jp_mlit_koji import MlitKojiConnector
from ingestion.connectors.tw_moi_land_stats import TwMoiLandStatsConnector
from ingestion.geo_formats import iter_dbf_records, parse_geojson_features, read_zip_member
from ingestion.models import RawArtifact, utc_now_iso


def artifact(content: bytes, name: str = "fixture") -> RawArtifact:
    return RawArtifact(name, content, "application/octet-stream", utc_now_iso(), "https://example.test/fixture")


def make_minimal_dbf(rows: list[dict[str, int | str]]) -> bytes:
    fields = [("BRW", "N", 8), ("BRW_ID", "C", 10), ("GEMEINDE", "C", 20)]
    header_len = 32 + len(fields) * 32 + 1
    record_len = 1 + sum(flen for _, _, flen in fields)
    num_records = len(rows)
    out = bytearray()
    out.extend(struct.pack("<BBBBLHH", 3, 24, 6, 16, num_records, header_len, record_len))
    out.extend(b"\x00" * 20)
    for name, ftype, flen in fields:
        out.extend(name.encode("ascii").ljust(11, b"\x00"))
        out.append(ord(ftype))
        out.extend(b"\x00" * 4)
        out.append(flen)
        out.extend(b"\x00" * 15)
    out.append(0x0D)
    for row in rows:
        out.append(0x20)
        for name, _, flen in fields:
            text = str(row.get(name, "")).ljust(flen)[:flen]
            out.extend(text.encode("latin-1"))
    return bytes(out)


def make_geojson_zip() -> bytes:
    feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [139.74, 35.69]},
        "properties": {
            "L01_001": "13101",
            "L01_002": "000",
            "L01_003": "001",
            "L01_004": "13101",
            "L01_005": "000",
            "L01_006": "001",
            "L01_008": 4410000,
            "L01_024": "Chiyoda",
            "L01_025": "Tokyo sample address",
        },
    }
    payload = json.dumps({"type": "FeatureCollection", "features": [feature]}).encode("utf-8")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("L01-26_13_GML/L01-26_13.geojson", payload)
    return buf.getvalue()


TW_CSV = (
    "CityCounty,CountyCode,LandNumberofRecord,LandArea_Ha,Announcement_of_Land_price_Thousand,Date,Providing_Agency\n"
    "Taipei_City,63000,419350,26051.87913,32352882037,20240101,MOI\n"
)


def test_dbf_reader_and_boris_parser() -> None:
    dbf = make_minimal_dbf([{"BRW": 850, "BRW_ID": "Z-1", "GEMEINDE": "Koeln"}])
    rows = list(iter_dbf_records(dbf))
    assert rows[0]["BRW"] == 850

    zip_bytes = io.BytesIO()
    with zipfile.ZipFile(zip_bytes, "w") as zf:
        zf.writestr("boris/brw.dbf", dbf)
    records = DeNrwBorisConnector().parse([artifact(zip_bytes.getvalue(), "brw.zip")])
    assert len(records) == 1
    assert records[0].value_per_sqm == 850
    assert records[0].currency_code == "EUR"
    assert records[0].country_code == "DE"


def test_jp_koji_parses_geojson_zip() -> None:
    records = MlitKojiConnector("26", "13").parse([artifact(make_geojson_zip(), "tokyo.zip")])
    assert len(records) == 1
    assert records[0].value_per_sqm == 4_410_000
    assert records[0].geometry["type"] == "Point"
    assert records[0].zone_name == "Chiyoda"


def test_tw_moi_land_stats_parser() -> None:
    records = TwMoiLandStatsConnector().parse([artifact(TW_CSV.encode("utf-8"))])
    assert len(records) == 1
    assert records[0].currency_code == "TWD"
    assert records[0].attributes["aggregation_level"] == "county"
    assert records[0].value_per_sqm > 0


def test_bis_rppi_parses_wide_csv() -> None:
    csv_text = (
        "FREQ,REF_AREA,VALUE,TITLE_TS,2024-Q3,2024-Q4,2025-Q1\n"
        "Q,GB,N,UK series,2.1,2.5,3.0\n"
    )
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w") as zf:
        zf.writestr("WS_SPP_csv_col.csv", csv_text.encode("utf-8"))
    records = GlobalBisRppiConnector().parse([artifact(zip_buf.getvalue())])
    assert len(records) == 1
    assert records[0].attributes["period"] == "2025-Q1"
    assert records[0].attributes["index_change_pct"] == 3.0


def test_read_zip_member_requires_suffix() -> None:
    empty_zip = io.BytesIO()
    with zipfile.ZipFile(empty_zip, "w"):
        pass
    with pytest.raises(ValueError, match="no member"):
        read_zip_member(empty_zip.getvalue(), ".geojson")


def test_geojson_requires_feature_collection() -> None:
    with pytest.raises(ValueError, match="FeatureCollection"):
        parse_geojson_features(b'{"type":"Point"}')
