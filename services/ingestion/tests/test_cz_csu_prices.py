"""Tests for Czech average price connector (fixture-driven)."""

from ingestion.connectors.cz_csu_prices import CzCsuAvgPricesConnector
from ingestion.models import RawArtifact, utc_now_iso


CZ_CSV = """region,period,cena_bytu,druh
Praha,2024,125000,byt
Brno-město,2024,89000,byt
"""


def artifact(content: bytes) -> RawArtifact:
    return RawArtifact("cz.csv", content, "text/csv", utc_now_iso(), "https://example.test/cz")


def test_cz_csu_avg_prices_parser() -> None:
    connector = CzCsuAvgPricesConnector(csv_url="https://example.test/cz.csv")
    records = connector.parse([artifact(CZ_CSV.encode("utf-8"))])
    assert len(records) == 2
    assert records[0].value_per_sqm == 125000
    assert records[0].currency_code == "CZK"
    assert records[0].zone_name == "Praha"
