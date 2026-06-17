"""Reusable ingestion pipeline.

Every source runs through the same stages — connectors only implement
``fetch`` (network) and ``parse`` (bytes → normalized records):

    pull → raw snapshot + checksum → parse → normalize → QA gate → publish

Guarantees:
- idempotency: identical raw checksum ⇒ run is skipped (no duplicate publish)
- lineage: every silver file traces to an immutable raw artifact + manifest
- safety: QA hard-failures quarantine the dataset instead of publishing
- retries: transient network errors retry with exponential backoff
"""

from __future__ import annotations

import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Protocol

from .models import (
    JobResult,
    JobStatus,
    NormalizedTransaction,
    NormalizedValueZone,
    RawArtifact,
    SilverRecord,
    utc_now_iso,
)
from .qa import validate_records
from .storage import ArtifactStore

USER_AGENT = "GlobeLandIntelligence-Ingestion/0.1 (data pipeline; respects robots and licenses)"
TRANSFORMATION_VERSION = "ingest-v1"


class Connector(Protocol):
    """Contract every source connector implements."""

    source_code: str

    def fetch(self) -> list[RawArtifact]:
        """Pull raw payload(s) from the source. Network happens only here."""
        ...

    def parse(self, artifacts: list[RawArtifact]) -> list[SilverRecord]:
        """Turn raw bytes into normalized records. Must be pure (no network)."""
        ...


def http_get(
    url: str,
    *,
    timeout_s: float = 120.0,
    max_attempts: int = 3,
    backoff_s: float = 2.0,
    sleep: Callable[[float], None] = time.sleep,
) -> bytes:
    """GET with retry/backoff on transient failures (5xx, timeouts, resets)."""
    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=timeout_s) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            # 4xx is permanent (bad URL / auth) — do not retry.
            if 400 <= error.code < 500:
                raise
            last_error = error
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as error:
            last_error = error
        if attempt < max_attempts:
            sleep(backoff_s * (2 ** (attempt - 1)))
    raise RuntimeError(f"GET {url} failed after {max_attempts} attempts: {last_error}")


def _make_run_id(source_code: str, now: datetime | None = None) -> str:
    stamp = (now or datetime.now(timezone.utc)).strftime("%Y%m%dT%H%M%SZ")
    return f"{source_code}-{stamp}"


@dataclass(slots=True)
class PipelineOptions:
    force: bool = False  # re-publish even when the raw checksum is unchanged


def run_pipeline(connector: Connector, store: ArtifactStore, options: PipelineOptions | None = None) -> JobResult:
    """Execute the full pipeline for one connector and record health state."""
    options = options or PipelineOptions()
    started_at = utc_now_iso()
    run_id = _make_run_id(connector.source_code)

    def finish(result: JobResult) -> JobResult:
        store.record_health(result)
        return result

    try:
        artifacts = connector.fetch()
        if not artifacts:
            raise RuntimeError("connector returned no artifacts")

        checksums = store.save_raw(connector.source_code, run_id, artifacts)
        combined_checksum = "+".join(checksums[a.name] for a in artifacts)

        if not options.force and store.last_checksum(connector.source_code) == combined_checksum:
            return finish(
                JobResult(
                    run_id=run_id,
                    source_code=connector.source_code,
                    status=JobStatus.SKIPPED_UNCHANGED,
                    started_at=started_at,
                    finished_at=utc_now_iso(),
                    raw_checksum=combined_checksum,
                )
            )

        records = connector.parse(artifacts)
        accepted, qa_report = validate_records(records)

        if qa_report.has_hard_failures:
            return finish(
                JobResult(
                    run_id=run_id,
                    source_code=connector.source_code,
                    status=JobStatus.BLOCKED_BY_QA,
                    started_at=started_at,
                    finished_at=utc_now_iso(),
                    raw_checksum=combined_checksum,
                    qa=qa_report,
                )
            )

        silver_path, published = store.publish_silver(connector.source_code, run_id, accepted)
        store.record_checksum(connector.source_code, combined_checksum)

        return finish(
            JobResult(
                run_id=run_id,
                source_code=connector.source_code,
                status=JobStatus.SUCCEEDED,
                started_at=started_at,
                finished_at=utc_now_iso(),
                raw_checksum=combined_checksum,
                records_published=published,
                qa=qa_report,
                silver_path=str(silver_path),
            )
        )
    except Exception as error:  # noqa: BLE001 — pipeline boundary: convert to job state
        return finish(
            JobResult(
                run_id=run_id,
                source_code=connector.source_code,
                status=JobStatus.FAILED,
                started_at=started_at,
                finished_at=utc_now_iso(),
                error=f"{type(error).__name__}: {error}",
            )
        )
