import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { resetDataLayerCache, markets, listings } from "../src/data-layer.js";
import { buildGoldFromSilver } from "../src/silver-gold.js";
import type { SilverSourceSnapshot } from "../src/silver-store.js";

const sampleSnapshot: SilverSourceSnapshot = {
  sourceCode: "tw-taipei-land-price",
  runId: "test-run",
  filePath: "/tmp/test.jsonl",
  records: [
    {
      record_kind: "value_zone",
      record_id: "tw-taipei-land-price:section:001",
      source_record_id: "section:001",
      market_code: "tw-taipei",
      country_code: "TW",
      value_per_sqm: 550000,
      currency_code: "TWD",
      price_state: "estimate",
      observed_at: "2026-01-01",
      freshness: "weekly",
      confidence: "high",
      provenance: {
        source_id: "tw-taipei-land-price",
        observed_at: "2026-01-01",
        ingested_at: "2026-06-16T00:00:00.000Z",
        transformation_version: "tw-taipei-land-v1"
      },
      zone_name: "Shilin",
      address: { district: "Shilin" }
    }
  ]
};

test("buildGoldFromSilver maps value zones to parcels and estimate listings", () => {
  const gold = buildGoldFromSilver([sampleSnapshot]);
  assert.equal(gold.markets.length, 1);
  assert.equal(gold.markets[0]?.id, "m-taipei-tw");
  assert.equal(gold.parcels.length, 1);
  assert.equal(gold.listings.length, 1);
  assert.equal(gold.listings[0]?.state, "estimate");
  assert.equal(gold.listings[0]?.amount, 550000);
});

test("data-layer merges silver when GLOBE_INGEST_DATA_DIR is set", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "globe-silver-"));
  const silverDir = path.join(tempRoot, "silver", "tw-taipei-land-price");
  mkdirSync(silverDir, { recursive: true });
  writeFileSync(
    path.join(silverDir, "run-1.jsonl"),
    `${JSON.stringify(sampleSnapshot.records[0])}\n`,
    "utf8"
  );

  const previous = process.env.GLOBE_INGEST_DATA_DIR;
  process.env.GLOBE_INGEST_DATA_DIR = tempRoot;
  resetDataLayerCache();

  const mergedMarkets = markets();
  assert.equal(mergedMarkets.some((market) => market.id === "m-taipei-tw"), true);
  const ingestedListing = listings().find((item) => item.reference.startsWith("tw-taipei-land-price:"));
  assert.ok(ingestedListing);
  assert.equal(ingestedListing.state, "estimate");

  if (previous) {
    process.env.GLOBE_INGEST_DATA_DIR = previous;
  } else {
    delete process.env.GLOBE_INGEST_DATA_DIR;
  }
  resetDataLayerCache();
});
