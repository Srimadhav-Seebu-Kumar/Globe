"""Tests for Taipei parcel land-value connector."""

from ingestion.connectors.tw_taipei_land import TwTaipeiLandPriceConnector
from ingestion.models import RawArtifact, utc_now_iso


TAIPEI_CSV = (
    "縣市別,行政區,段小段,地號,公告土地現值（新臺幣元每平方公尺）,公告地價（新臺幣元每平方公尺）\r\n"
    "臺北市, 士林區,天母段一小段,00010000,550000,145000\r\n"
    "臺北市, 大安區,復興段二小段,00020001,680000,170000\r\n"
)


def artifact(content: bytes, name: str = "taipei.csv") -> RawArtifact:
    return RawArtifact(name, content, "text/csv; charset=BIG-5", utc_now_iso(), "https://example.test/taipei")


def test_taipei_land_price_parser() -> None:
    encoded = TAIPEI_CSV.encode("big5")
    connector = TwTaipeiLandPriceConnector(resource_id="test-rid", max_rows=10, reference_year="115")
    records = connector.parse([artifact(encoded)])
    assert len(records) == 2
    assert records[0].value_per_sqm == 550000
    assert records[0].currency_code == "TWD"
    assert records[0].address["district"] == "士林區"
    assert records[0].attributes["announced_land_price_twd_per_sqm"] == 145000
    assert records[1].zone_name.startswith("大安區")


def test_taipei_respects_max_rows() -> None:
    encoded = TAIPEI_CSV.encode("big5")
    connector = TwTaipeiLandPriceConnector(resource_id="test-rid", max_rows=1, reference_year="115")
    records = connector.parse([artifact(encoded)])
    assert len(records) == 1
