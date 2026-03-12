import test from "node:test";
import assert from "node:assert/strict";

import { API_PREFIX, DEFAULT_MARKET_ROLLOUT_RULES } from "../src/index";

test("config exports expected defaults", () => {
  assert.equal(API_PREFIX, "/v1");
  assert.equal(DEFAULT_MARKET_ROLLOUT_RULES.requireLegalDisplayPolicy, true);
});
