from valuation.main import EstimateRequest, estimate_land_value


def test_estimate_defaults_to_usd() -> None:
    result = estimate_land_value(EstimateRequest(market_id="m1", parcel_id="p1"))
    assert result.currency_code == "USD"
    assert result.model_version == "bootstrap-v1"
