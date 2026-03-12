import test from "node:test";
import assert from "node:assert/strict";

import { health, listListings, listMarkets, setReviewDecision } from "../src/handlers.js";

test("health response is shaped for probes", () => {
  const payload = health();
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "api");
  assert.equal(typeof payload.timestamp, "string");
});

test("listMarkets supports coverage and state filters", () => {
  const url = new URL(
    "http://localhost/v1/markets?coverageTier=tier_c_parcel_depth&state=ask&minConfidence=high"
  );

  const response = listMarkets(url);
  assert.equal(response.data.length > 0, true);
  assert.equal(response.data.every((market) => market.coverageTier === "tier_c_parcel_depth"), true);
});

test("listListings filters by state and market", () => {
  const url = new URL("http://localhost/v1/listings?marketId=m-dubai&state=closed");
  const response = listListings(url);

  assert.equal(response.data.length > 0, true);
  assert.equal(response.data.every((item) => item.marketId === "m-dubai" && item.state === "closed"), true);
});

test("setReviewDecision mutates queue status", () => {
  const result = setReviewDecision("r-001", "approved");
  assert.equal(result.ok, true);
  assert.equal(result.review?.status, "approved");
});
