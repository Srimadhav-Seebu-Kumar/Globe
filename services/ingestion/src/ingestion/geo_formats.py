"""Lightweight geodata helpers (stdlib only — no GDAL/pyshp dependency).

Supports the ingestion connectors that consume official zone/value feeds
packaged as ZIP archives containing DBF (BORIS) or GeoJSON (Japan L01).
"""

from __future__ import annotations

import io
import json
import struct
import zipfile
from typing import Any, Iterator


def read_zip_member(content: bytes, member_suffix: str) -> bytes:
    """Return the first zip member whose name ends with ``member_suffix``."""
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        for name in archive.namelist():
            if name.lower().endswith(member_suffix.lower()):
                return archive.read(name)
    raise ValueError(f"no member ending with {member_suffix!r} in archive")


def iter_dbf_records(content: bytes) -> Iterator[dict[str, Any]]:
    """Parse a dBASE III/IV DBF file into dict records (field name → value)."""
    if len(content) < 32:
        raise ValueError("dbf file too small")
    header_len, record_len = struct.unpack_from("<HH", content, 8)
    num_records = struct.unpack_from("<I", content, 4)[0]

    fields: list[tuple[str, str, int]] = []
    pos = 32
    while pos < header_len - 1:
        name = content[pos : pos + 11].split(b"\x00", 1)[0].decode("ascii", errors="replace").strip()
        ftype = chr(content[pos + 11])
        flen = content[pos + 16]
        if not name:
            break
        fields.append((name, ftype, flen))
        pos += 32

    data_start = header_len
    for index in range(num_records):
        offset = data_start + index * record_len
        if content[offset] == 0x2A:  # deleted record
            continue
        row: dict[str, Any] = {}
        cursor = offset + 1
        for name, ftype, flen in fields:
            raw = content[cursor : cursor + flen]
            cursor += flen
            text = raw.decode("latin-1", errors="replace").strip()
            if ftype in ("N", "F") and text:
                try:
                    row[name] = int(float(text.replace(",", ".")))
                except ValueError:
                    row[name] = text
            else:
                row[name] = text
        yield row


def parse_geojson_features(content: bytes) -> list[dict[str, Any]]:
    payload = json.loads(content.decode("utf-8"))
    if payload.get("type") != "FeatureCollection":
        raise ValueError("expected GeoJSON FeatureCollection")
    features = payload.get("features")
    if not isinstance(features, list):
        raise ValueError("GeoJSON missing features array")
    return features


def pick_field(row: dict[str, Any], *candidates: str) -> Any:
    """Return the first present field from a list of candidate names (case-insensitive)."""
    lowered = {key.lower(): value for key, value in row.items()}
    for candidate in candidates:
        if candidate.lower() in lowered and lowered[candidate.lower()] not in ("", None, "_"):
            return lowered[candidate.lower()]
    return None
