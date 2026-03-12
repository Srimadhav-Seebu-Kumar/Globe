import test from "node:test";
import assert from "node:assert/strict";

import { health } from "../src/handlers.js";

test("health response is shaped for probes", () => {
  const payload = health();
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "api");
  assert.equal(typeof payload.timestamp, "string");
});
