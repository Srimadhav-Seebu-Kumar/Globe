from datetime import datetime, timedelta, timezone
from pathlib import Path

from ingestion.models import JobResult, JobStatus
from ingestion.registry import REGISTRY, get_source, resolve_active_source
from ingestion.storage import ArtifactStore


def test_every_source_has_license_and_attribution() -> None:
    for definition in REGISTRY.values():
        assert definition.license.name, definition.code
        assert definition.license.attribution, definition.code
        assert definition.license.url, definition.code


def test_every_fallback_target_is_registered() -> None:
    for definition in REGISTRY.values():
        for fallback_code in definition.fallback_chain:
            assert fallback_code in REGISTRY, f"{definition.code} falls back to unregistered {fallback_code}"
            assert fallback_code != definition.code


def test_transaction_sources_have_fallbacks() -> None:
    for definition in REGISTRY.values():
        if definition.kind in ("transactions", "value_zones"):
            assert definition.fallback_chain, f"{definition.code} has no fallback chain"


def _record_run(store: ArtifactStore, source_code: str, status: JobStatus, finished_at: datetime) -> None:
    store.record_health(
        JobResult(
            run_id=f"{source_code}-test",
            source_code=source_code,
            status=status,
            started_at=finished_at.isoformat(),
            finished_at=finished_at.isoformat(),
        )
    )


def test_healthy_primary_is_selected(tmp_path: Path) -> None:
    store = ArtifactStore(root=tmp_path)
    now = datetime.now(timezone.utc)
    _record_run(store, "uk-hmlr-ppd", JobStatus.SUCCEEDED, now - timedelta(days=3))

    active, reason = resolve_active_source("uk-hmlr-ppd", store, now)
    assert active.code == "uk-hmlr-ppd"
    assert reason == "primary healthy"


def test_stale_primary_degrades_with_explicit_reason(tmp_path: Path) -> None:
    store = ArtifactStore(root=tmp_path)
    now = datetime.now(timezone.utc)
    # last success far beyond the 45-day max lag
    _record_run(store, "uk-hmlr-ppd", JobStatus.SUCCEEDED, now - timedelta(days=90))

    active, reason = resolve_active_source("uk-hmlr-ppd", store, now)
    # fallbacks have no connectors yet, so the chain degrades back to primary — loudly
    assert active.code == "uk-hmlr-ppd"
    assert reason.startswith("degraded")


def test_failed_primary_degrades(tmp_path: Path) -> None:
    store = ArtifactStore(root=tmp_path)
    now = datetime.now(timezone.utc)
    _record_run(store, "kr-molit-land", JobStatus.FAILED, now)

    active, reason = resolve_active_source("kr-molit-land", store, now)
    assert active.code == "kr-molit-land"
    assert reason.startswith("degraded")


def test_skipped_unchanged_counts_as_healthy(tmp_path: Path) -> None:
    store = ArtifactStore(root=tmp_path)
    now = datetime.now(timezone.utc)
    _record_run(store, "uk-hmlr-ppd", JobStatus.SKIPPED_UNCHANGED, now - timedelta(days=1))

    active, reason = resolve_active_source("uk-hmlr-ppd", store, now)
    assert active.code == "uk-hmlr-ppd"
    assert reason == "primary healthy"


def test_value_zone_sources_registered() -> None:
    zones = [d for d in REGISTRY.values() if d.kind == "value_zones"]
    assert len(zones) >= 10
    implemented = [d.code for d in zones if d.connector_implemented]
    assert "jp-mlit-koji" in implemented
    assert "de-nrw-boris" in implemented
    assert "tw-moi-land-stats" in implemented


def test_unknown_source_raises() -> None:
    try:
        get_source("not-a-source")
    except KeyError as error:
        assert "not in the registry" in str(error)
    else:  # pragma: no cover
        raise AssertionError("expected KeyError")
