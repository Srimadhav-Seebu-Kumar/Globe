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
  assert.equal(reviewRoute?.definition.requiresAuth, true);
  assert.equal(reviewRoute?.definition.requiredRole, "operator");
});

test("resolveRoute includes authenticated user workspace endpoints", () => {
  const meRoute = resolveRoute(createRequest("GET", "/v1/me"));
  assert.equal(meRoute?.definition.requiresAuth, true);

  const savedSearchesRoute = resolveRoute(createRequest("POST", "/v1/saved-searches"));
  assert.equal(savedSearchesRoute?.definition.requiresAuth, true);

  const compareRoute = resolveRoute(createRequest("GET", "/v1/compare?parcelId=p-dxb-001"));
  assert.equal(compareRoute?.definition.description.includes("Compare selected parcels"), true);
});
