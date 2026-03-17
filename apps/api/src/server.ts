import { createServer, type IncomingMessage } from "node:http";

import { authorizeRequest, type AuthSession } from "./auth.js";
import { resolveRoute, writeJson, writeNoContent } from "./router.js";

const port = Number(process.env.PORT ?? 4000);
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

interface BodyParseResult {
  ok: boolean;
  value?: unknown;
  statusCode?: number;
  error?: string;
}

const readJsonBody = async (request: IncomingMessage): Promise<BodyParseResult> => {
  if (request.method !== "POST") {
    return { ok: true, value: undefined };
  }

  const declaredLength = Number(request.headers["content-length"] ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
    return {
      ok: false,
      statusCode: 413,
      error: "Payload too large"
    };
  }

  let receivedBytes = 0;
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += chunkBuffer.byteLength;

    if (receivedBytes > MAX_REQUEST_BODY_BYTES) {
      return {
        ok: false,
        statusCode: 413,
        error: "Payload too large"
      };
    }

    chunks.push(chunkBuffer);
  }

  if (chunks.length === 0) {
    return { ok: true, value: undefined };
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return { ok: true, value: undefined };
  }

  const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      statusCode: 415,
      error: "Content-Type must be application/json"
    };
  }

  try {
    return { ok: true, value: JSON.parse(rawBody) };
  } catch {
    return {
      ok: false,
      statusCode: 400,
      error: "Invalid JSON body"
    };
  }
};

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    writeNoContent(request, response);
    return;
  }

  const resolved = resolveRoute(request);
  if (!resolved) {
    writeJson(request, response, 404, {
      error: "Not Found",
      message: "Route is not defined"
    });
    return;
  }

  let authSession: AuthSession | undefined;
  if (resolved.definition.requiresAuth) {
    const authResult = authorizeRequest(request);
    if (!authResult.ok) {
      writeJson(request, response, 401, {
        error: "Unauthorized",
        errorCode: authResult.errorCode
      });
      return;
    }

    authSession = authResult.session;
    if (resolved.definition.requiredRole && authResult.session.role !== resolved.definition.requiredRole) {
      writeJson(request, response, 403, {
        error: "Forbidden",
        message: "Insufficient role"
      });
      return;
    }
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    writeJson(request, response, bodyResult.statusCode ?? 400, {
      error: bodyResult.error ?? "Invalid request"
    });
    return;
  }

  try {
    const url = new URL(request.url ?? "/", "http://localhost");

    const payload = resolved.definition.handler({
      request,
      url,
      params: resolved.params,
      body: bodyResult.value,
      ...(authSession ? { session: authSession } : {})
    });

    const statusCode = resolved.definition.statusResolver
      ? resolved.definition.statusResolver(payload)
      : 200;
    writeJson(request, response, statusCode, payload);
  } catch (error) {
    const isProd = process.env.NODE_ENV === "production";
    writeJson(request, response, 500, {
      error: "Internal server error",
      message: isProd ? "Unexpected server error" : error instanceof Error ? error.message : "Unknown error"
    });
  }
});

server.listen(port, () => {
  process.stdout.write(`[api] listening on http://localhost:${port}\n`);
});
