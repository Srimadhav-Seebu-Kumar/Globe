"""Local artifact store with bronze/silver zones and lineage manifests.

Layout (root defaults to ``GLOBE_INGEST_DATA_DIR`` or ``services/ingestion/data``):

    raw/<source_code>/<run_id>/<artifact_name>      immutable raw payloads (bronze input)
    raw/<source_code>/<run_id>/manifest.json        checksums + fetch metadata (lineage)
    silver/<source_code>/<run_id>.jsonl             normalized records (one JSON per line)
    state/health.json                               last-run health per source
    state/checksums.json                            last published checksum per source (idempotency)

S3/object storage later swaps in behind this same interface.
"""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
from pathlib import Path
from typing import Any, Iterable

from .models import JobResult, NormalizedTransaction, RawArtifact, utc_now_iso

DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def sha256_hex(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=".tmp-")
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(content)
        os.replace(tmp_name, path)
    except BaseException:
        try:
            os.unlink(tmp_name)
        except FileNotFoundError:
            pass
        raise


class ArtifactStore:
    def __init__(self, root: Path | None = None) -> None:
        env_root = os.environ.get("GLOBE_INGEST_DATA_DIR")
        self.root = Path(root) if root else (Path(env_root) if env_root else DEFAULT_DATA_DIR)

    # -- bronze ---------------------------------------------------------

    def save_raw(self, source_code: str, run_id: str, artifacts: Iterable[RawArtifact]) -> dict[str, str]:
        """Persist raw artifacts immutably; returns {artifact_name: sha256}."""
        run_dir = self.root / "raw" / source_code / run_id
        checksums: dict[str, str] = {}
        manifest: dict[str, Any] = {"run_id": run_id, "source_code": source_code, "artifacts": []}
        for artifact in artifacts:
            checksum = sha256_hex(artifact.content)
            checksums[artifact.name] = checksum
            _atomic_write(run_dir / artifact.name, artifact.content)
            manifest["artifacts"].append(
                {
                    "name": artifact.name,
                    "sha256": checksum,
                    "bytes": len(artifact.content),
                    "content_type": artifact.content_type,
                    "fetched_at": artifact.fetched_at,
                    "source_url": artifact.source_url,
                }
            )
        manifest["written_at"] = utc_now_iso()
        _atomic_write(run_dir / "manifest.json", json.dumps(manifest, indent=2).encode("utf-8"))
        return checksums

    # -- silver ---------------------------------------------------------

    def publish_silver(self, source_code: str, run_id: str, records: Iterable[NormalizedTransaction]) -> tuple[Path, int]:
        """Write normalized records as JSONL; returns (path, count)."""
        lines: list[str] = []
        for record in records:
            lines.append(json.dumps(record.to_dict(), ensure_ascii=False, separators=(",", ":")))
        path = self.root / "silver" / source_code / f"{run_id}.jsonl"
        _atomic_write(path, ("\n".join(lines) + ("\n" if lines else "")).encode("utf-8"))
        return path, len(lines)

    # -- state ----------------------------------------------------------

    def _read_state(self, name: str) -> dict[str, Any]:
        path = self.root / "state" / name
        if not path.exists():
            return {}
        return json.loads(path.read_text(encoding="utf-8"))

    def _write_state(self, name: str, payload: dict[str, Any]) -> None:
        _atomic_write(self.root / "state" / name, json.dumps(payload, indent=2).encode("utf-8"))

    def last_checksum(self, source_code: str) -> str | None:
        return self._read_state("checksums.json").get(source_code)

    def record_checksum(self, source_code: str, checksum: str) -> None:
        state = self._read_state("checksums.json")
        state[source_code] = checksum
        self._write_state("checksums.json", state)

    def record_health(self, result: JobResult) -> None:
        """Persist last-run health per source (consumed by source-health surfaces)."""
        state = self._read_state("health.json")
        state[result.source_code] = result.to_dict()
        self._write_state("health.json", state)

    def read_health(self) -> dict[str, Any]:
        return self._read_state("health.json")
