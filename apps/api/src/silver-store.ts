/** Read normalized silver JSONL produced by services/ingestion. */

import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ConfidenceLabel, FreshnessTier, PriceState } from "@globe/types";

export interface SilverProvenance {
  source_id: string;
  observed_at: string;
  ingested_at: string;
  transformation_version: string;
}

export interface SilverTransactionRecord {
  record_kind?: "transaction";
  record_id: string;
  source_record_id: string;
  market_code: string;
  country_code: string;
  price_state: PriceState;
  amount: number;
  currency_code: string;
  observed_at: string;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
  provenance: SilverProvenance;
  address?: Record<string, string>;
  attributes?: Record<string, unknown>;
}

export interface SilverValueZoneRecord {
  record_kind: "value_zone";
  record_id: string;
  source_record_id: string;
  market_code: string;
  country_code: string;
  value_per_sqm: number;
  currency_code: string;
  price_state: "estimate";
  observed_at: string;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
  provenance: SilverProvenance;
  zone_name?: string;
  geometry?: { type?: string; coordinates?: number[] };
  address?: Record<string, string>;
  attributes?: Record<string, unknown>;
}

export type SilverRecord = SilverTransactionRecord | SilverValueZoneRecord;

export interface SilverSourceSnapshot {
  sourceCode: string;
  runId: string;
  filePath: string;
  records: SilverRecord[];
}

const SOURCE_TO_MARKET_ID: Record<string, string> = {
  "uk-hmlr-ppd": "m-uk-ew",
  "kr-molit-land": "m-seoul",
  "jp-mlit-koji": "m-tokyo",
  "tw-taipei-land-price": "m-taipei-tw",
  "tw-moi-land-stats": "m-taiwan-tw",
  "de-nrw-boris": "m-nrw-de",
  "global-bis-rppi": "m-global-benchmark",
  "cz-csu-avg-prices": "m-prague-cz"
};

export const marketIdForSilverSource = (sourceCode: string): string | undefined => SOURCE_TO_MARKET_ID[sourceCode];

const apiDir = path.dirname(fileURLToPath(import.meta.url));

export const resolveSilverRoot = (): string => {
  const envRoot = process.env.GLOBE_INGEST_DATA_DIR;
  if (envRoot) {
    return path.join(envRoot, "silver");
  }
  return path.resolve(apiDir, "../../../services/ingestion/data/silver");
};

export const resolveIngestStateRoot = (): string => {
  const envRoot = process.env.GLOBE_INGEST_DATA_DIR;
  if (envRoot) {
    return path.join(envRoot, "state");
  }
  return path.resolve(apiDir, "../../../services/ingestion/data/state");
};

const maxRecordsPerSource = (): number => {
  const raw = process.env.GLOBE_SILVER_MAX_RECORDS;
  if (!raw) {
    return 10_000;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10_000;
  }
  return Math.min(500_000, Math.round(parsed));
};

const latestJsonlForSource = (silverRoot: string, sourceCode: string): string | null => {
  const sourceDir = path.join(silverRoot, sourceCode);
  if (!existsSync(sourceDir)) {
    return null;
  }
  const files = readdirSync(sourceDir)
    .filter((name) => name.endsWith(".jsonl"))
    .map((name) => {
      const fullPath = path.join(sourceDir, name);
      return { fullPath, mtime: statSync(fullPath).mtimeMs, name };
    })
    .sort((left, right) => right.mtime - left.mtime);
  return files[0]?.fullPath ?? null;
};

const parseSilverLine = (line: string): SilverRecord | null => {
  try {
    const payload = JSON.parse(line) as SilverRecord;
    if (!payload?.record_id) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const readSilverSource = async (sourceCode: string): Promise<SilverSourceSnapshot | null> => {
  const silverRoot = resolveSilverRoot();
  const filePath = latestJsonlForSource(silverRoot, sourceCode);
  if (!filePath) {
    return null;
  }

  const records: SilverRecord[] = [];
  const maxRecords = maxRecordsPerSource();
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const reader = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of reader) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const record = parseSilverLine(trimmed);
    if (record) {
      records.push(record);
    }
    if (records.length >= maxRecords) {
      break;
    }
  }

  const runId = path.basename(filePath, ".jsonl");
  return { sourceCode, runId, filePath, records };
};

export const listAvailableSilverSources = (): string[] => {
  const silverRoot = resolveSilverRoot();
  if (!existsSync(silverRoot)) {
    return [];
  }
  return readdirSync(silverRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((sourceCode) => latestJsonlForSource(silverRoot, sourceCode) !== null);
};

export const readIngestHealth = (): Record<string, unknown> => {
  const healthPath = path.join(resolveIngestStateRoot(), "health.json");
  if (!existsSync(healthPath)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(healthPath, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export const loadAllSilverSnapshots = async (): Promise<SilverSourceSnapshot[]> => {
  const sources = listAvailableSilverSources();
  const snapshots: SilverSourceSnapshot[] = [];
  for (const sourceCode of sources) {
    const snapshot = await readSilverSource(sourceCode);
    if (snapshot && snapshot.records.length > 0) {
      snapshots.push(snapshot);
    }
  }
  return snapshots;
};

export const loadAllSilverSnapshotsSync = (): SilverSourceSnapshot[] => {
  const sources = listAvailableSilverSources();
  const snapshots: SilverSourceSnapshot[] = [];
  const maxRecords = maxRecordsPerSource();

  for (const sourceCode of sources) {
    const silverRoot = resolveSilverRoot();
    const filePath = latestJsonlForSource(silverRoot, sourceCode);
    if (!filePath) {
      continue;
    }
    const content = readFileSync(filePath, "utf8");
    const records: SilverRecord[] = [];
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      const record = parseSilverLine(trimmed);
      if (record) {
        records.push(record);
      }
      if (records.length >= maxRecords) {
        break;
      }
    }
    if (records.length > 0) {
      snapshots.push({
        sourceCode,
        runId: path.basename(filePath, ".jsonl"),
        filePath,
        records
      });
    }
  }
  return snapshots;
};
