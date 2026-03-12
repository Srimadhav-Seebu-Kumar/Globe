import type { IncomingMessage, ServerResponse } from "node:http";

import { health, listAlerts, listListings, listMarkets, listParcels } from "./handlers.js";

type Method = "GET";

interface RouteDefinition {
  method: Method;
  path: string;
  description: string;
  handler: () => unknown;
}

export const routes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/health",
    description: "Liveness and readiness signal",
    handler: health
  },
  {
    method: "GET",
    path: "/v1/markets",
    description: "Market summaries with coverage and confidence",
    handler: listMarkets
  },
  {
    method: "GET",
    path: "/v1/parcels",
    description: "Parcel list skeleton for eligible markets",
    handler: listParcels
  },
  {
    method: "GET",
    path: "/v1/listings",
    description: "Listing skeleton with separated pricing states",
    handler: listListings
  },
  {
    method: "GET",
    path: "/v1/alerts",
    description: "User alert skeleton",
    handler: listAlerts
  }
];

export const resolveRoute = (request: IncomingMessage): RouteDefinition | undefined => {
  const method = request.method as Method | undefined;
  const url = new URL(request.url ?? "/", "http://localhost");

  return routes.find((candidate) => candidate.method === method && candidate.path === url.pathname);
};

export const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};
