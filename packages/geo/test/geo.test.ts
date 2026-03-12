import test from "node:test";
import assert from "node:assert/strict";

import { normalizeLongitude, toGeoPoint } from "../src/index";

test("normalizeLongitude wraps values", () => {
  assert.equal(normalizeLongitude(181), -179);
  assert.equal(normalizeLongitude(-181), 179);
});

test("toGeoPoint formats valid points", () => {
  assert.equal(toGeoPoint({ lng: 55.27, lat: 25.2 }), "POINT(55.27 25.2)");
});
