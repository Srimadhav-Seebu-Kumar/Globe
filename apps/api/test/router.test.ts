import test from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage } from "node:http";

import { resolveRoute } from "../src/router.js";

const createRequest = (method: "GET" | "POST", url: string): IncomingMessage =>
  ({
    method,
    url
  } as IncomingMessage);

test("resolveRoute matches GET routes", () => {
  const marketRoute = resolveRoute(createRequest("GET", "/v1/markets"));
  assert.equal(marketRoute?.definition.description.includes("Market summaries"), true);

  const missingRoute = resolveRoute(createRequest("GET", "/v1/missing"));
  assert.equal(missingRoute, undefined);
});

test("resolveRoute extracts params from POST review decision route", () => {
  const reviewRoute = resolveRoute(createRequest("POST", "/v1/admin/reviews/r-001/approve"));
  assert.equal(reviewRoute?.params.id, "r-001");
  assert.equal(reviewRoute?.params.decision, "approve");
});
