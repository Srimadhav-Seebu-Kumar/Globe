import test from "node:test";
import assert from "node:assert/strict";

import {
  CONFIDENCE_LABELS,
  COVERAGE_TIERS,
  FRESHNESS_TIERS,
  PRICE_STATES
} from "../src/index";

test("domain enums include required canonical values", () => {
  assert.deepEqual(PRICE_STATES, ["ask", "closed", "estimate", "broker_verified"]);
  assert.deepEqual(FRESHNESS_TIERS, ["realtime", "daily", "weekly", "stale"]);
  assert.equal(CONFIDENCE_LABELS.includes("verified"), true);
  assert.equal(COVERAGE_TIERS.includes("tier_c_parcel_depth"), true);
});
