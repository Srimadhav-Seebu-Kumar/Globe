"""Canonical ingestion domain models.

These mirror the shared TypeScript contracts in ``packages/types/src/domain.ts``
(PriceState, FreshnessTier, ConfidenceLabel, CoverageTier, ProvenanceStamp).
If an enum changes there, it must change here in the same commit.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class PriceState(str, Enum):
    ASK = "ask"
    CLOSED = "closed"
    ESTIMATE = "estimate"
    BROKER_VERIFIED = "broker_verified"


class FreshnessTier(str, Enum):
    REALTIME = "realtime"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMIANNUAL = "semiannual"
    STALE = "stale"


class ConfidenceLabel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERIFIED = "verified"


class CoverageTier(str, Enum):
    TIER_A = "tier_a_global_visibility"
    TIER_B = "tier_b_market_depth"
    TIER_C = "tier_c_parcel_depth"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(slots=True)
class ProvenanceStamp:
    source_id: str
    observed_at: str
    ingested_at: str
    transformation_version: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


@dataclass(slots=True)
class NormalizedTransaction:
    """A single closed/ask price observation in canonical form (silver layer)."""

    record_id: str
    source_record_id: str
    market_code: str
    country_code: str
    price_state: PriceState
    amount: int
    currency_code: str
    observed_at: str
    freshness: FreshnessTier
    confidence: ConfidenceLabel
    provenance: ProvenanceStamp
    address: dict[str, str] = field(default_factory=dict)
    attributes: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["price_state"] = self.price_state.value
        payload["freshness"] = self.freshness.value
        payload["confidence"] = self.confidence.value
        return payload


@dataclass(slots=True)
class RawArtifact:
    """One immutable raw payload pulled from a source (bronze layer input)."""

    name: str
    content: bytes
    content_type: str
    fetched_at: str
    source_url: str


class QASeverity(str, Enum):
    HARD_FAIL = "hard_fail"
    SOFT_WARN = "soft_warn"


@dataclass(slots=True)
class QAIssue:
    rule: str
    severity: QASeverity
    message: str
    record_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule": self.rule,
            "severity": self.severity.value,
            "message": self.message,
            "record_id": self.record_id,
        }


@dataclass(slots=True)
class QAReport:
    total_records: int
    accepted_records: int
    rejected_records: int
    issues: list[QAIssue] = field(default_factory=list)

    @property
    def has_hard_failures(self) -> bool:
        return any(issue.severity is QASeverity.HARD_FAIL for issue in self.issues)

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_records": self.total_records,
            "accepted_records": self.accepted_records,
            "rejected_records": self.rejected_records,
            "issues": [issue.to_dict() for issue in self.issues],
        }


class JobStatus(str, Enum):
    SUCCEEDED = "succeeded"
    SKIPPED_UNCHANGED = "skipped_unchanged"
    BLOCKED_BY_QA = "blocked_by_qa"
    FAILED = "failed"


@dataclass(slots=True)
class JobResult:
    run_id: str
    source_code: str
    status: JobStatus
    started_at: str
    finished_at: str
    raw_checksum: str | None = None
    records_published: int = 0
    qa: QAReport | None = None
    error: str | None = None
    silver_path: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "source_code": self.source_code,
            "status": self.status.value,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "raw_checksum": self.raw_checksum,
            "records_published": self.records_published,
            "qa": self.qa.to_dict() if self.qa else None,
            "error": self.error,
            "silver_path": self.silver_path,
        }
