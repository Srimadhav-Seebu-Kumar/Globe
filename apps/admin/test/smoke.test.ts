import test from "node:test";
import assert from "node:assert/strict";

import { CONFIDENCE_LABELS } from "@globe/types";

test("admin can consume shared confidence labels", () => {
  assert.equal(CONFIDENCE_LABELS[0], "low");
});
