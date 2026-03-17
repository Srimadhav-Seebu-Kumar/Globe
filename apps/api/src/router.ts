import type { IncomingMessage, ServerResponse } from "node:http";

import { getClientKey, type AuthRole, type AuthSession } from "./auth.js";
import {
  compareParcels,
  createInquiry,
  createSavedSearch,
  createWatchlistItem,
  currentUser,
  exportMemo,
  health,
  listActivityEvents,
  listAlerts,
  listBrokerProfiles,
  listInquiries,
  listListings,
  listMarkets,
  listParcels,
  listReviewQueue,
  listSavedSearches,
  listSourceHealth,
  listUserAlerts,
  listWatchlistItems,
  login,
  register,
  setReviewDecision
} from "./handlers.js";

type Method = "GET" | "POST" | "OPTIONS";

export interface RouteContext {
  request: IncomingMessage;
  url: URL;
  params: Record<string, string>;
  body: unknown;
  session?: AuthSession;
}

export type RouteHandler = (context: RouteContext) => unknown;
export type StatusResolver = (payload: unknown) => number;

interface RouteDefinition {
  method: Method;
  pattern: RegExp;
  description: string;
  handler: RouteHandler;
  statusResolver?: StatusResolver;
  requiresAuth?: boolean;
  requiredRole?: AuthRole;
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
    pattern: /^\/v1\/brokers$/,
    description: "Broker and agency profile summary",
    handler: ({ url }) => listBrokerProfiles(url)
  },
  {
    method: "GET",
    pattern: /^\/v1\/compare$/,
    description: "Compare selected parcels",
    handler: ({ url }) => compareParcels(url)
  },
  {
    method: "POST",
    pattern: /^\/v1\/export\/memo$/,
    description: "Export parcel comparison memo",
    handler: ({ body }) => exportMemo(body),
    statusResolver: (payload) => {
      if (typeof payload === "object" && payload && "error" in payload) {
        return 400;
      }
      return 200;
    },
    requiresAuth: true
  },
  {
    method: "POST",
    pattern: /^\/v1\/auth\/login$/,
    description: "User and operator login endpoint",
    handler: ({ body, request }) => login(body, getClientKey(request)),
    statusResolver: (payload) => {
      if (typeof payload !== "object" || !payload) {
        return 500;
      }

      const result = payload as { ok?: boolean; errorCode?: string };
      if (result.ok) {
        return 200;
      }

      if (result.errorCode === "rate_limited") {
        return 429;
      }

      if (result.errorCode === "auth_unconfigured") {
        return 503;
      }

      return 401;
    }
  },
  {
    method: "POST",
    pattern: /^\/v1\/auth\/register$/,
    description: "Register an end-user account",
    handler: ({ body }) => register(body),
    statusResolver: (payload) => {
      if (typeof payload !== "object" || !payload) {
        return 500;
      }

      const result = payload as { ok?: boolean; errorCode?: string };
      if (result.ok) {
        return 201;
      }

      if (result.errorCode === "email_taken") {
        return 409;
      }

      if (result.errorCode === "weak_password" || result.errorCode === "invalid_payload") {
        return 422;
      }

      return 400;
    }
  },
  {
    method: "GET",
    pattern: /^\/v1\/me$/,
    description: "Get current authenticated user",
    handler: ({ session }) => currentUser(session),
    requiresAuth: true
  },
  {
    method: "GET",
    pattern: /^\/v1\/saved-searches$/,
    description: "List user saved searches",
    handler: ({ url, session }) => listSavedSearches(url, session),
    requiresAuth: true
  },
  {
    method: "POST",
    pattern: /^\/v1\/saved-searches$/,
    description: "Create user saved search",
    handler: ({ body, session }) => createSavedSearch(body, session),
    statusResolver: (payload) => {
      if (typeof payload === "object" && payload && "ok" in payload) {
        const result = payload as { ok: boolean };
        return result.ok ? 201 : 400;
      }
      return 500;
    },
    requiresAuth: true
  },
  {
    method: "GET",
    pattern: /^\/v1\/watchlists$/,
    description: "List user watchlist items",
    handler: ({ url, session }) => listWatchlistItems(url, session),
    requiresAuth: true
  },
  {
    method: "POST",
    pattern: /^\/v1\/watchlists$/,
    description: "Create user watchlist item",
    handler: ({ body, session }) => createWatchlistItem(body, session),
    statusResolver: (payload) => {
      if (typeof payload === "object" && payload && "ok" in payload) {
        const result = payload as { ok: boolean };
        return result.ok ? 201 : 400;
      }
      return 500;
    },
    requiresAuth: true
  },
  {
    method: "GET",
    pattern: /^\/v1\/my\/alerts$/,
    description: "List alerts linked to user watchlist items",
    handler: ({ url, session }) => listUserAlerts(url, session),
    requiresAuth: true
  },
  {
    method: "GET",
    pattern: /^\/v1\/inquiries$/,
    description: "List user listing inquiries",
    handler: ({ url, session }) => listInquiries(url, session),
    requiresAuth: true
  },
  {
    method: "POST",
    pattern: /^\/v1\/inquiries$/,
    description: "Submit a listing inquiry",
    handler: ({ body, session }) => createInquiry(body, session),
    statusResolver: (payload) => {
      if (typeof payload === "object" && payload && "ok" in payload) {
        const result = payload as { ok: boolean };
        return result.ok ? 201 : 400;
      }
      return 500;
    },
    requiresAuth: true
  },
  {
    method: "GET",
    pattern: /^\/v1\/admin\/sources$/,
    description: "Source health telemetry",
    handler: ({ url }) => listSourceHealth(url),
    requiresAuth: true,
    requiredRole: "operator"
  },
  {
    method: "GET",
    pattern: /^\/v1\/admin\/reviews$/,
    description: "Review queue",
    handler: ({ url }) => listReviewQueue(url),
    requiresAuth: true,
    requiredRole: "operator"
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
    statusResolver: (payload) => {
      if (typeof payload !== "object" || !payload || !("ok" in payload)) {
        return 200;
      }

      const result = payload as { ok: boolean };
      return result.ok ? 200 : 404;
    },
    requiresAuth: true,
    requiredRole: "operator"
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

const setSecurityHeaders = (response: ServerResponse): void => {
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  response.setHeader("permissions-policy", "geolocation=(), microphone=(), camera=()");
  response.setHeader("cross-origin-opener-policy", "same-origin");
  response.setHeader("cross-origin-resource-policy", "same-site");
  response.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  response.setHeader("cache-control", "no-store");
};

export const writeJson = (
  request: IncomingMessage,
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode;
  setCorsHeaders(request, response);
  setSecurityHeaders(response);
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const writeNoContent = (request: IncomingMessage, response: ServerResponse): void => {
  response.statusCode = 204;
  setCorsHeaders(request, response);
  setSecurityHeaders(response);
  response.end();
};
