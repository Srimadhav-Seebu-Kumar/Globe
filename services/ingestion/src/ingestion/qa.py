"""Quality gate for normalized records.

Hard failures block publication to the silver layer; soft warnings are
recorded but do not block. Thresholds are intentionally conservative —
a broken parse should never silently publish garbage records.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .models import NormalizedTransaction, NormalizedValueZone, QAIssue, QAReport, QASeverity, SilverRecord

SilverRecordType = NormalizedTransaction | NormalizedValueZone

# A land/property price of zero or below is always a parse error; values above
# this ceiling are treated as outliers to warn on (national-record territory).
MIN_VALID_AMOUNT = 1
SOFT_MAX_AMOUNT = 5_000_000_000

# If more than this fraction of records fail validation, the dataset itself is
# suspect (schema drift, encoding break) and publication is blocked.
MAX_REJECT_RATIO = 0.05

_REQUIRED_FIELDS = ("record_id", "source_record_id", "market_code", "currency_code", "observed_at")


def _is_valid_date(value: str) -> bool:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    now = datetime.now(timezone.utc)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return datetime(1900, 1, 1, tzinfo=timezone.utc) <= parsed <= now


def _record_amount(record: SilverRecord) -> int:
    if isinstance(record, NormalizedValueZone):
        return record.value_per_sqm
    return record.amount


def validate_records(records: list[SilverRecordType]) -> tuple[list[SilverRecordType], QAReport]:
    """Return (accepted_records, report). Caller must check report.has_hard_failures."""
    accepted: list[SilverRecordType] = []
    issues: list[QAIssue] = []

    if not records:
        report = QAReport(total_records=0, accepted_records=0, rejected_records=0)
        report.issues.append(
            QAIssue(rule="non_empty_dataset", severity=QASeverity.HARD_FAIL, message="source produced zero records")
        )
        return [], report

    for record in records:
        record_ok = True

        for field_name in _REQUIRED_FIELDS:
            if not getattr(record, field_name):
                issues.append(
                    QAIssue(
                        rule="required_field",
                        severity=QASeverity.SOFT_WARN,
                        message=f"missing {field_name}",
                        record_id=record.record_id or record.source_record_id,
                    )
                )
                record_ok = False

        amount = _record_amount(record)
        if amount < MIN_VALID_AMOUNT:
            issues.append(
                QAIssue(
                    rule="price_sanity",
                    severity=QASeverity.SOFT_WARN,
                    message=f"non-positive amount {amount}",
                    record_id=record.record_id,
                )
            )
            record_ok = False
        elif amount > SOFT_MAX_AMOUNT:
            issues.append(
                QAIssue(
                    rule="price_outlier",
                    severity=QASeverity.SOFT_WARN,
                    message=f"amount {amount} above outlier ceiling",
                    record_id=record.record_id,
                )
            )
            # outliers are kept — flagged, not dropped

        if not _is_valid_date(record.observed_at):
            issues.append(
                QAIssue(
                    rule="date_sanity",
                    severity=QASeverity.SOFT_WARN,
                    message=f"invalid observed_at {record.observed_at!r}",
                    record_id=record.record_id,
                )
            )
            record_ok = False

        if record_ok:
            accepted.append(record)

    rejected = len(records) - len(accepted)
    report = QAReport(total_records=len(records), accepted_records=len(accepted), rejected_records=rejected, issues=issues)

    if rejected / len(records) > MAX_REJECT_RATIO:
        report.issues.append(
            QAIssue(
                rule="reject_ratio",
                severity=QASeverity.HARD_FAIL,
                message=f"{rejected}/{len(records)} records rejected (> {MAX_REJECT_RATIO:.0%}) — dataset quarantined",
            )
        )

    return accepted, report
