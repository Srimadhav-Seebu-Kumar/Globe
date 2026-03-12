import test from "node:test";
import assert from "node:assert/strict";

import { health, listAlerts, listListings, listMarkets, listParcels, login, setReviewDecision } from "../src/handlers.js";

const restoreEnv = (key: "APP_OPERATOR_EMAIL" | "APP_OPERATOR_PASSWORD", value: string | undefined): void => {
  if (typeof value === "undefined") {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

test("health response is shaped for probes", () => {
  const payload = health();
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "api");
  assert.equal(typeof payload.timestamp, "string");
});

test("listMarkets supports coverage and state filters", () => {
  const url = new URL(
    "http://localhost/v1/markets?coverageTier=tier_c_parcel_depth&state=ask&minConfidence=high"
  );

  const response = listMarkets(url);
  assert.equal(response.data.length > 0, true);
  assert.equal(response.data.every((market) => market.coverageTier === "tier_c_parcel_depth"), true);
});

test("listMarkets tolerates invalid minConfidence values", () => {
  const url = new URL("http://localhost/v1/markets?minConfidence=not-valid");
  const response = listMarkets(url);
  assert.equal(response.data.length > 0, true);
});

test("listListings filters by state and market", () => {
  const url = new URL("http://localhost/v1/listings?marketId=m-dubai&state=closed");
  const response = listListings(url);

  assert.equal(response.data.length > 0, true);
  assert.equal(response.data.every((item) => item.marketId === "m-dubai" && item.state === "closed"), true);
});

test("listMarkets state filter applies OR semantics and pagination metadata", () => {
  const url = new URL("http://localhost/v1/markets?state=ask&state=closed&limit=2");
  const response = listMarkets(url);

  assert.equal(response.data.length, 2);
  assert.equal(response.meta.limit, 2);
  assert.equal(typeof response.meta.hasMore, "boolean");
});

test("listParcels defaults to legal-display-only and masks restricted parcels when included", () => {
  const defaultUrl = new URL("http://localhost/v1/parcels?marketId=m-london");
  const defaultResponse = listParcels(defaultUrl);
  assert.equal(defaultResponse.data.length, 0);

  const inclusiveUrl = new URL("http://localhost/v1/parcels?marketId=m-london&legalDisplayOnly=false");
  const inclusiveResponse = listParcels(inclusiveUrl);
  assert.equal(inclusiveResponse.data.length, 1);
  assert.equal(inclusiveResponse.data[0]?.canonicalParcelId, "REDACTED");
  assert.equal(inclusiveResponse.data[0]?.title, "Restricted parcel");
});

test("listAlerts no longer exposes watchlist identifiers", () => {
  const url = new URL("http://localhost/v1/alerts?marketId=m-dubai");
  const response = listAlerts(url);
  assert.equal(response.data.length > 0, true);
  const keys = Object.keys(response.data[0] ?? {});
  assert.equal(keys.includes("watchlistId"), false);
});

test("setReviewDecision mutates queue status", () => {
  const result = setReviewDecision("r-001", "approved");
  assert.equal(result.ok, true);
  assert.equal(result.review?.status, "approved");
});

test("login requires configured credentials", () => {
  const previousEmail = process.env.APP_OPERATOR_EMAIL;
  const previousPassword = process.env.APP_OPERATOR_PASSWORD;

  delete process.env.APP_OPERATOR_EMAIL;
  delete process.env.APP_OPERATOR_PASSWORD;

  const result = login({ email: "x@example.com", password: "secret" }, "test-client");
  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "auth_unconfigured");

  restoreEnv("APP_OPERATOR_EMAIL", previousEmail);
  restoreEnv("APP_OPERATOR_PASSWORD", previousPassword);
});

test("login succeeds when credentials are configured", () => {
  const previousEmail = process.env.APP_OPERATOR_EMAIL;
  const previousPassword = process.env.APP_OPERATOR_PASSWORD;

  process.env.APP_OPERATOR_EMAIL = "operator@example.com";
  process.env.APP_OPERATOR_PASSWORD = "a-very-strong-password";

  const result = login({ email: "operator@example.com", password: "a-very-strong-password" }, "test-client");
  assert.equal(result.ok, true);
  assert.equal(typeof result.token, "string");

  restoreEnv("APP_OPERATOR_EMAIL", previousEmail);
  restoreEnv("APP_OPERATOR_PASSWORD", previousPassword);
});
