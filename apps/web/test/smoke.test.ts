import test from "node:test";
import assert from "node:assert/strict";

import { COVERAGE_TIERS } from "@globe/types";

test("coverage tiers are available to web shell", () => {
  assert.equal(COVERAGE_TIERS.length, 3);
});
