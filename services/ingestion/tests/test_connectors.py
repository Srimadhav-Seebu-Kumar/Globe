import pytest

from ingestion.connectors.hmlr_ppd import HmlrPricePaidConnector
from ingestion.connectors.molit_kr import MolitLandTradeConnector
from ingestion.models import PriceState, RawArtifact, utc_now_iso

HMLR_CSV = (
    '"{A1B2C3D4-1111-2222-3333-444455556666}","285000","2026-04-17 00:00","SW1A 1AA","F","N","L",'
    '"10","FLAT 2","DOWNING STREET","","LONDON","CITY OF WESTMINSTER","GREATER LONDON","A","A"\n'
    '"{B2C3D4E5-1111-2222-3333-444455556666}","1250000","2026-04-02 00:00","M1 2AB","O","N","F",'
    '"PLOT 7","","DEANSGATE","","MANCHESTER","MANCHESTER","GREATER MANCHESTER","B","A"\n'
    '"{C3D4E5F6-1111-2222-3333-444455556666}","99000","2026-03-30 00:00","LS1 4HT","T","Y","F",'
    '"4","","BRIGGATE","","LEEDS","LEEDS","WEST YORKSHIRE","A","D"\n'
)

MOLIT_XML_EN = """<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE.</resultMsg></header>
  <body>
    <items>
      <item>
        <dealAmount>45,000</dealAmount>
        <dealYear>2026</dealYear><dealMonth>5</dealMonth><dealDay>12</dealDay>
        <umdNm>Cheongun-dong</umdNm><sggCd>11110</sggCd>
        <dealArea>231.4</dealArea><jimok>대</jimok><landUse>제2종일반주거</landUse>
      </item>
      <item>
        <dealAmount>120,500</dealAmount>
        <dealYear>2026</dealYear><dealMonth>5</dealMonth><dealDay>3</dealDay>
        <umdNm>Sajik-dong</umdNm><sggCd>11110</sggCd>
        <dealArea>512.0</dealArea><jimok>전</jimok><landUse>자연녹지</landUse>
      </item>
    </items>
  </body>
</response>
""".encode("utf-8")

MOLIT_XML_KR = b"""<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>00</resultCode></header>
  <body><items><item>
    <\xea\xb1\xb0\xeb\x9e\x98\xea\xb8\x88\xec\x95\xa1>33,000</\xea\xb1\xb0\xeb\x9e\x98\xea\xb8\x88\xec\x95\xa1>
    <\xeb\x85\x84>2026</\xeb\x85\x84><\xec\x9b\x94>4</\xec\x9b\x94><\xec\x9d\xbc>21</\xec\x9d\xbc>
    <\xeb\xb2\x95\xec\xa0\x95\xeb\x8f\x99>\xec\x82\xac\xec\xa7\x81\xeb\x8f\x99</\xeb\xb2\x95\xec\xa0\x95\xeb\x8f\x99>
    <\xea\xb1\xb0\xeb\x9e\x98\xeb\xa9\xb4\xec\xa0\x81>100.5</\xea\xb1\xb0\xeb\x9e\x98\xeb\xa9\xb4\xec\xa0\x81>
  </item></items></body>
</response>
"""

MOLIT_XML_ERROR = b"""<?xml version="1.0" encoding="UTF-8"?>
<response><header>
  <resultCode>30</resultCode><resultMsg>SERVICE KEY IS NOT REGISTERED ERROR.</resultMsg>
</header></response>
"""


def artifact(content: bytes, name: str = "fixture") -> RawArtifact:
    return RawArtifact(name, content, "text/plain", utc_now_iso(), "https://example.test/fixture")


# ---------------------------------------------------------------- HMLR ----


def test_hmlr_parses_rows_and_skips_deletions() -> None:
    connector = HmlrPricePaidConnector()
    records = connector.parse([artifact(HMLR_CSV.encode("utf-8"))])

    # third row has record status D (deletion) and must be skipped
    assert len(records) == 2

    first = records[0]
    assert first.amount == 285_000
    assert first.currency_code == "GBP"
    assert first.price_state is PriceState.CLOSED
    assert first.observed_at == "2026-04-17"
    assert first.market_code == "uk-england-wales"
    assert first.address["postcode"] == "SW1A 1AA"
    assert first.address["town"] == "LONDON"
    assert first.attributes["property_type"] == "flat"
    assert first.attributes["tenure"] == "leasehold"
    assert first.record_id == "uk-hmlr-ppd:A1B2C3D4-1111-2222-3333-444455556666"
    assert first.provenance.source_id == "uk-hmlr-ppd"

    second = records[1]
    assert second.attributes["property_type"] == "other_or_land"
    assert second.attributes["ppd_category"] == "B"


def test_hmlr_malformed_lines_are_dropped_not_fatal() -> None:
    connector = HmlrPricePaidConnector()
    records = connector.parse([artifact(b'"garbage","line"\n' + HMLR_CSV.encode("utf-8"))])
    assert len(records) == 2


# ---------------------------------------------------------------- MOLIT ---


def make_molit() -> MolitLandTradeConnector:
    return MolitLandTradeConnector(api_key="test-key", lawd_cd="11110", deal_ymd="202605")


def test_molit_parses_english_tags() -> None:
    records = make_molit().parse([artifact(MOLIT_XML_EN)])
    assert len(records) == 2

    first = records[0]
    assert first.amount == 45_000 * 10_000  # 만원 → KRW
    assert first.currency_code == "KRW"
    assert first.price_state is PriceState.CLOSED
    assert first.observed_at == "2026-05-12"
    assert first.address["district"] == "Cheongun-dong"
    assert first.attributes["area_sqm"] == 231.4

    # deterministic ids: same input → same id
    again = make_molit().parse([artifact(MOLIT_XML_EN)])
    assert again[0].record_id == first.record_id


def test_molit_parses_korean_tags() -> None:
    records = make_molit().parse([artifact(MOLIT_XML_KR)])
    assert len(records) == 1
    assert records[0].amount == 33_000 * 10_000
    assert records[0].observed_at == "2026-04-21"


def test_molit_api_error_raises() -> None:
    with pytest.raises(RuntimeError, match="SERVICE KEY"):
        make_molit().parse([artifact(MOLIT_XML_ERROR)])


def test_molit_from_env_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("MOLIT_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="MOLIT_API_KEY"):
        MolitLandTradeConnector.from_env()
