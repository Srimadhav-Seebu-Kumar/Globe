from pathlib import Path

from ingestion.framework import PipelineOptions, run_pipeline
from ingestion.models import (
    ConfidenceLabel,
    FreshnessTier,
    JobStatus,
    NormalizedTransaction,
    PriceState,
    ProvenanceStamp,
    RawArtifact,
    utc_now_iso,
)
from ingestion.storage import ArtifactStore


class FakeConnector:
    source_code = "fake-source"

    def __init__(self, payload: bytes = b"a,b,c", records: int = 3, fail_fetch: bool = False) -> None:
        self.payload = payload
        self.records = records
        self.fail_fetch = fail_fetch

    def fetch(self) -> list[RawArtifact]:
        if self.fail_fetch:
            raise RuntimeError("network down")
        return [RawArtifact("data.csv", self.payload, "text/csv", utc_now_iso(), "https://example.test/data.csv")]

    def parse(self, artifacts: list[RawArtifact]) -> list[NormalizedTransaction]:
        return [
            NormalizedTransaction(
                record_id=f"fake:{i}",
                source_record_id=str(i),
                market_code="fake-market",
                country_code="XX",
                price_state=PriceState.CLOSED,
                amount=100 + i,
                currency_code="USD",
                observed_at="2026-01-15",
                freshness=FreshnessTier.MONTHLY,
                confidence=ConfidenceLabel.MEDIUM,
                provenance=ProvenanceStamp("fake-source", "2026-01-15", utc_now_iso(), "v1"),
            )
            for i in range(self.records)
        ]


def make_store(tmp_path: Path) -> ArtifactStore:
    return ArtifactStore(root=tmp_path / "data")


def test_successful_run_publishes_silver_and_health(tmp_path: Path) -> None:
    store = make_store(tmp_path)
    result = run_pipeline(FakeConnector(), store)

    assert result.status is JobStatus.SUCCEEDED
    assert result.records_published == 3
    assert result.silver_path and Path(result.silver_path).exists()
    assert Path(result.silver_path).read_text().count("\n") == 3

    raw_dir = tmp_path / "data" / "raw" / "fake-source" / result.run_id
    assert (raw_dir / "data.csv").exists()
    assert (raw_dir / "manifest.json").exists()

    health = store.read_health()
    assert health["fake-source"]["status"] == "succeeded"


def test_unchanged_payload_is_skipped(tmp_path: Path) -> None:
    store = make_store(tmp_path)
    first = run_pipeline(FakeConnector(), store)
    second = run_pipeline(FakeConnector(), store)

    assert first.status is JobStatus.SUCCEEDED
    assert second.status is JobStatus.SKIPPED_UNCHANGED
    assert second.records_published == 0


def test_force_republishes_unchanged_payload(tmp_path: Path) -> None:
    store = make_store(tmp_path)
    run_pipeline(FakeConnector(), store)
    forced = run_pipeline(FakeConnector(), store, PipelineOptions(force=True))
    assert forced.status is JobStatus.SUCCEEDED


def test_changed_payload_republishes(tmp_path: Path) -> None:
    store = make_store(tmp_path)
    run_pipeline(FakeConnector(payload=b"v1"), store)
    result = run_pipeline(FakeConnector(payload=b"v2"), store)
    assert result.status is JobStatus.SUCCEEDED


def test_zero_records_blocked_by_qa(tmp_path: Path) -> None:
    store = make_store(tmp_path)
    result = run_pipeline(FakeConnector(records=0), store)
    assert result.status is JobStatus.BLOCKED_BY_QA
    assert result.records_published == 0
    # checksum must NOT be recorded so a fixed dataset re-runs cleanly
    assert store.last_checksum("fake-source") is None


def test_fetch_failure_records_failed_health(tmp_path: Path) -> None:
    store = make_store(tmp_path)
    result = run_pipeline(FakeConnector(fail_fetch=True), store)
    assert result.status is JobStatus.FAILED
    assert "network down" in (result.error or "")
    assert store.read_health()["fake-source"]["status"] == "failed"
