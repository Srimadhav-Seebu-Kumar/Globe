import type { IncomingMessage, ServerResponse } from "node:http";

import { getClientKey } from "./auth.js";
import {
  health,
  listActivityEvents,
  listAlerts,
  listListings,
  listMarkets,
  listParcels,
  listReviewQueue,
  listSourceHealth,
  login,
  setReviewDecision
} from "./handlers.js";

type Method = "GET" | "POST" | "OPTIONS";

export interface RouteContext {
  request: IncomingMessage;
  url: URL;
  params: Record<string, string>;
  body: unknown;
}

export type RouteHandler = (context: RouteContext) => unknown;

interface RouteDefinition {
  method: Method;
  pattern: RegExp;
  description: string;
  handler: RouteHandler;
  requiresAuth?: boolean;
}

export const routes: RouteDefinition[] = [
  {
    method: "GET",
    pattern: /^\/health$/,
    description: "Liveness and readiness signal",
    handler: () => health()
  },
  {
    method: "GET",
    pattern: /^\/v1\/markets$/,
    description: "Market summaries with coverage and confidence filters",
    handler: ({ url }) => listMarkets(url)
  },
  {
    method: "GET",
    pattern: /^\/v1\/parcels$/,
    description: "Parcel retrieval for eligible markets",
    handler: ({ url }) => listParcels(url)
  },
  {
    method: "GET",
    pattern: /^\/v1\/listings$/,
    description: "Listings and pricing-state observations",
    handler: ({ url }) => listListings(url)
  },
  {
    method: "GET",
    pattern: /^\/v1\/alerts$/,
    description: "Alert subscriptions and trigger events",
    handler: ({ url }) => listAlerts(url)
  },
  {
    method: "GET",
    pattern: /^\/v1\/events$/,
    description: "Activity ticker events",
    handler: ({ url }) => listActivityEvents(url)
  },
  {
    method: "GET",
    pattern: /^\/v1\/admin\/sources$/,
    description: "Source health telemetry",
    handler: ({ url }) => listSourceHealth(url),
    requiresAuth: true
  },
  {
    method: "GET",
    pattern: /^\/v1\/admin\/reviews$/,
    description: "Review queue",
    handler: ({ url }) => listReviewQueue(url),
    requiresAuth: true
  },
  {
    method: "POST",
    pattern: /^\/v1\/admin\/reviews\/(?<id>[^/]+)\/(?<decision>approve|reject)$/,
    description: "Apply review decision",
    handler: ({ params }) => {
      if (!params.id || !params.decision) {
        return { ok: false, review: null };
      }

      const decision = params.decision === "approve" ? "approved" : "rejected";
      return setReviewDecision(params.id, decision);
    },
    requiresAuth: true
  },
  {
    method: "POST",
    pattern: /^\/v1\/auth\/login$/,
    description: "Local login endpoint",
    handler: ({ body, request }) => login(body, getClientKey(request))
  }
];

export interface ResolvedRoute {
  definition: RouteDefinition;
  params: Record<string, string>;
}

export const resolveRoute = (request: IncomingMessage): ResolvedRoute | undefined => {
  const method = request.method as Method | undefined;
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const match = pathname.match(route.pattern);
    if (!match) {
      continue;
    }

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(match.groups ?? {})) {
      params[key] = value;
    }

    return {
      definition: route,
      params
    };
  }

  return undefined;
};

const allowedOrigins = (process.env.APP_ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const setCorsHeaders = (request: IncomingMessage, response: ServerResponse): void => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "origin");
  }

  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization");
};

export const writeJson = (
  request: IncomingMessage,
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode;
  setCorsHeaders(request, response);
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const writeNoContent = (request: IncomingMessage, response: ServerResponse): void => {
  response.statusCode = 204;
  setCorsHeaders(request, response);
  response.end();
};
