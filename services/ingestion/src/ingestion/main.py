from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(slots=True)
class IngestionRun:
    run_id: str
    source_code: str
    started_at: datetime


def start_ingestion(source_code: str) -> IngestionRun:
    started_at = datetime.now(timezone.utc)
    run_id = f"{source_code}-{started_at.strftime('%Y%m%d%H%M%S')}"
    return IngestionRun(run_id=run_id, source_code=source_code, started_at=started_at)


def main() -> None:
    run = start_ingestion("bootstrap")
    print(f"[ingestion] started run={run.run_id}")


if __name__ == "__main__":
    main()
