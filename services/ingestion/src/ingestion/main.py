"""Ingestion service CLI.

Usage (from services/ingestion):
    python -m ingestion.main list                 # registry: sources, licenses, cadence
    python -m ingestion.main run uk-hmlr-ppd      # run one source through the pipeline
    python -m ingestion.main run kr-molit-land    # requires MOLIT_API_KEY
    python -m ingestion.main health               # last-run health + fallback resolution
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timezone

from .connectors import build_connector
from .framework import PipelineOptions, run_pipeline
from .registry import REGISTRY, get_source, resolve_active_source
from .storage import ArtifactStore


@dataclass(slots=True)
class IngestionRun:
    """Kept for backwards compatibility with the original scaffold API."""

    run_id: str
    source_code: str
    started_at: datetime


def start_ingestion(source_code: str) -> IngestionRun:
    started_at = datetime.now(timezone.utc)
    run_id = f"{source_code}-{started_at.strftime('%Y%m%d%H%M%S')}"
    return IngestionRun(run_id=run_id, source_code=source_code, started_at=started_at)


def _cmd_list() -> int:
    for definition in REGISTRY.values():
        connector = "connector: yes" if definition.connector_implemented else "connector: not yet"
        env_note = f" (requires {', '.join(definition.requires_env)})" if definition.requires_env else ""
        print(f"{definition.code:18s} {definition.kind:12s} {definition.cadence.value:10s} {connector}{env_note}")
        print(f"{'':18s} license: {definition.license.name}")
        if definition.fallback_chain:
            print(f"{'':18s} fallback: {' -> '.join(definition.fallback_chain)}")
    return 0


def _cmd_run(source_code: str, force: bool) -> int:
    definition = get_source(source_code)
    if not definition.connector_implemented:
        print(f"error: {source_code} is registered but has no connector yet", file=sys.stderr)
        return 2
    connector = build_connector(source_code)
    store = ArtifactStore()
    result = run_pipeline(connector, store, PipelineOptions(force=force))
    print(json.dumps(result.to_dict(), indent=2))
    print(f"\nattribution required: {definition.license.attribution}")
    return 0 if result.status.value in ("succeeded", "skipped_unchanged") else 1


def _cmd_health() -> int:
    store = ArtifactStore()
    health = store.read_health()
    for code, definition in REGISTRY.items():
        entry = health.get(code)
        status = entry.get("status") if entry else "never_run"
        finished = entry.get("finished_at") if entry else "-"
        print(f"{code:18s} {status:18s} last: {finished}")
        if definition.connector_implemented or definition.fallback_chain:
            active, reason = resolve_active_source(code, store)
            print(f"{'':18s} active source -> {active.code} ({reason})")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ingestion", description="Globe land-data ingestion service")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("list", help="list registered sources and licenses")

    run_parser = subparsers.add_parser("run", help="run one source through the pipeline")
    run_parser.add_argument("source_code", choices=sorted(REGISTRY.keys()))
    run_parser.add_argument("--force", action="store_true", help="re-publish even if the raw payload is unchanged")

    subparsers.add_parser("health", help="show last-run health and fallback resolution")

    args = parser.parse_args(argv)
    if args.command == "list":
        return _cmd_list()
    if args.command == "run":
        return _cmd_run(args.source_code, force=args.force)
    if args.command == "health":
        return _cmd_health()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
