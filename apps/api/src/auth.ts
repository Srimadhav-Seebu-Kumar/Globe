import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export type AuthRole = "operator" | "user";

export interface AuthSession {
  userId: string;
  email: string;
  role: AuthRole;
  name: string;
  createdAt: string;
  expiresAt: number;
}

interface LoginAttempt {
  count: number;
  windowStartedAt: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
let generatedTokenSecret: string | null = null;

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

const getConfiguredCredentials = (): { email: string; password: string } | null => {
  const email = process.env.APP_OPERATOR_EMAIL?.trim().toLowerCase();
  const password = process.env.APP_OPERATOR_PASSWORD?.trim();

  if (!email || !password) {
    return null;
  }

  return { email, password };
};

const getSessionTtlMs = (): number => {
  const configuredMinutes = Number(process.env.APP_SESSION_TTL_MINUTES ?? 120);
  if (!Number.isFinite(configuredMinutes) || configuredMinutes <= 0) {
    return 120 * 60 * 1000;
  }

  return Math.round(configuredMinutes) * 60 * 1000;
};

const getTokenSecret = (): string => {
  const configured = process.env.APP_AUTH_TOKEN_SECRET?.trim();
  if (configured) {
    return configured;
  }

  const fallback = process.env.APP_OPERATOR_PASSWORD?.trim();
  if (fallback) {
    return fallback;
  }

  if (!generatedTokenSecret) {
    generatedTokenSecret = randomBytes(24).toString("hex");
  }

  return generatedTokenSecret;
};

const safeEqual = (left: string, right: string): boolean => {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
};

const clearExpiredLoginAttempts = (now: number): void => {
  for (const [key, attempt] of loginAttempts) {
    if (now - attempt.windowStartedAt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
};

export const createSessionToken = (session: AuthSession): string => {
  const payload = {
    uid: session.userId,
    email: session.email,
    role: session.role,
    name: session.name,
    iat: session.createdAt,
    exp: session.expiresAt
  };
  const payloadEncoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getTokenSecret()).update(payloadEncoded).digest("base64url");
  return `${payloadEncoded}.${signature}`;
};

const decodeToken = (token: string): AuthSession | null => {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getTokenSecret()).update(payloadEncoded).digest("base64url");
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8")) as unknown;
  } catch {
    return null;
  }

  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const data = payload as {
    uid?: unknown;
    email?: unknown;
    role?: unknown;
    name?: unknown;
    iat?: unknown;
    exp?: unknown;
  };
  const validRole = data.role === "operator" || data.role === "user";
  if (typeof data.email !== "string" || !validRole || typeof data.exp !== "number") {
    return null;
  }

  if (data.exp <= Date.now()) {
    return null;
  }

  const createdAt = typeof data.iat === "string" ? data.iat : new Date().toISOString();
  const userId = typeof data.uid === "string" ? data.uid : `${data.role}:${data.email}`;
  const name =
    typeof data.name === "string" && data.name.trim().length > 0
      ? data.name.trim()
      : data.role === "operator"
        ? "Operator"
        : data.email.split("@")[0] ?? "User";

  return {
    userId,
    email: data.email,
    role: data.role as AuthRole,
    name,
    createdAt,
    expiresAt: data.exp
  };
};

export const getClientKey = (request: IncomingMessage): string => {
  const trustProxy = process.env.APP_TRUST_PROXY === "true";
  const forwardedFor = request.headers["x-forwarded-for"];
  if (trustProxy && typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.socket.remoteAddress ?? "unknown";
};

export const loginWithCredentials = (
  email: string,
  password: string,
  clientKey: string
):
  | { ok: true; token: string; email: string; role: "operator" }
  | { ok: false; errorCode: "auth_unconfigured" | "rate_limited" | "invalid_credentials" } => {
  const credentials = getConfiguredCredentials();
  if (!credentials) {
    return { ok: false, errorCode: "auth_unconfigured" };
  }

  const now = Date.now();
  clearExpiredLoginAttempts(now);
  const attempt = loginAttempts.get(clientKey);

  if (attempt) {
    const windowExpired = now - attempt.windowStartedAt > LOGIN_WINDOW_MS;
    if (windowExpired) {
      loginAttempts.delete(clientKey);
    } else if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      return { ok: false, errorCode: "rate_limited" };
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  const validEmail = safeEqual(normalizedEmail, credentials.email);
  const validPassword = safeEqual(password, credentials.password);

  if (!validEmail || !validPassword) {
    const previous = loginAttempts.get(clientKey);
    if (!previous || now - previous.windowStartedAt > LOGIN_WINDOW_MS) {
      loginAttempts.set(clientKey, { count: 1, windowStartedAt: now });
    } else {
      previous.count += 1;
      loginAttempts.set(clientKey, previous);
    }

    return { ok: false, errorCode: "invalid_credentials" };
  }

  loginAttempts.delete(clientKey);

  const nowIso = new Date(now).toISOString();
  const token = createSessionToken({
    userId: `operator:${credentials.email}`,
    email: credentials.email,
    role: "operator",
    name: "Operator",
    createdAt: nowIso,
    expiresAt: now + getSessionTtlMs()
  });

  return {
    ok: true,
    token,
    email: credentials.email,
    role: "operator"
  };
};

export const authorizeRequest = (
  request: IncomingMessage
): { ok: true; session: AuthSession } | { ok: false; errorCode: "missing_token" | "invalid_token" } => {
  const authorizationHeader = request.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return { ok: false, errorCode: "missing_token" };
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, errorCode: "missing_token" };
  }

  const session = decodeToken(token);
  if (!session) {
    return { ok: false, errorCode: "invalid_token" };
  }

  return { ok: true, session };
};
