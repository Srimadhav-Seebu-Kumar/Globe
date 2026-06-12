from ingestion.models import (
    ConfidenceLabel,
    FreshnessTier,
    NormalizedTransaction,
    PriceState,
    ProvenanceStamp,
)
from ingestion.qa import validate_records


def make_record(record_id: str = "r1", amount: int = 100_000, observed_at: str = "2026-04-01") -> NormalizedTransaction:
    return NormalizedTransaction(
        record_id=record_id,
        source_record_id=record_id,
        market_code="test-market",
        country_code="GB",
        price_state=PriceState.CLOSED,
        amount=amount,
        currency_code="GBP",
        observed_at=observed_at,
        freshness=FreshnessTier.MONTHLY,
        confidence=ConfidenceLabel.HIGH,
        provenance=ProvenanceStamp("test", observed_at, "2026-06-12T00:00:00+00:00", "v1"),
    )


def test_valid_records_pass() -> None:
    accepted, report = validate_records([make_record()])
    assert len(accepted) == 1
    assert not report.has_hard_failures
    assert report.rejected_records == 0


def test_empty_dataset_is_hard_failure() -> None:
    accepted, report = validate_records([])
    assert accepted == []
    assert report.has_hard_failures


def test_non_positive_amount_rejected() -> None:
    accepted, report = validate_records([make_record(amount=0), make_record("r2")] + [make_record(f"ok{i}") for i in range(98)])
    assert len(accepted) == 99
    assert any(issue.rule == "price_sanity" for issue in report.issues)
    assert not report.has_hard_failures  # 1% rejects is under the quarantine threshold


def test_invalid_date_rejected() -> None:
    records = [make_record(observed_at="not-a-date")] + [make_record(f"ok{i}") for i in range(99)]
    accepted, report = validate_records(records)
    assert len(accepted) == 99
    assert any(issue.rule == "date_sanity" for issue in report.issues)


def test_future_date_rejected() -> None:
    accepted, _ = validate_records([make_record(observed_at="2199-01-01")] + [make_record(f"ok{i}") for i in range(99)])
    assert len(accepted) == 99


def test_outlier_amount_kept_but_flagged() -> None:
    accepted, report = validate_records([make_record(amount=10_000_000_000)])
    assert len(accepted) == 1
    assert any(issue.rule == "price_outlier" for issue in report.issues)


def test_high_reject_ratio_quarantines_dataset() -> None:
    records = [make_record(f"bad{i}", amount=0) for i in range(50)] + [make_record(f"ok{i}") for i in range(50)]
    _, report = validate_records(records)
    assert report.has_hard_failures
    assert any(issue.rule == "reject_ratio" for issue in report.issues)
