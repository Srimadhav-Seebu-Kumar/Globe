import test from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage } from "node:http";

import { resolveRoute } from "../src/router.js";

const createRequest = (url: string): IncomingMessage =>
  ({
    method: "GET",
    url
  } as IncomingMessage);

test("resolveRoute matches defined skeleton routes", () => {
  const marketRoute = resolveRoute(createRequest("/v1/markets"));
  assert.equal(marketRoute?.path, "/v1/markets");

  const missingRoute = resolveRoute(createRequest("/v1/missing"));
  assert.equal(missingRoute, undefined);
});
