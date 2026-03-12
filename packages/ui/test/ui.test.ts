import test from "node:test";
import assert from "node:assert/strict";

import { ShellPanel } from "../src/index";

test("ShellPanel is exported", () => {
  assert.equal(typeof ShellPanel, "function");
});
