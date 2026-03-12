import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export interface AuthSession {
  email: string;
  role: "operator";
  expiresAt: number;
}

interface LoginAttempt {
  count: number;
  windowStartedAt: number;
}

const sessions = new Map<string, AuthSession>();
const loginAttempts = new Map<string, LoginAttempt>();

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

const safeEqual = (left: string, right: string): boolean => {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
};

const clearExpiredSessions = (): void => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
};

const clearExpiredLoginAttempts = (now: number): void => {
  for (const [key, attempt] of loginAttempts) {
    if (now - attempt.windowStartedAt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
};

export const getClientKey = (request: IncomingMessage): string => {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
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

  const token = randomBytes(24).toString("hex");
  sessions.set(token, {
    email: credentials.email,
    role: "operator",
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
  clearExpiredSessions();

  const authorizationHeader = request.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return { ok: false, errorCode: "missing_token" };
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, errorCode: "missing_token" };
  }

  const session = sessions.get(token);
  if (!session) {
    return { ok: false, errorCode: "invalid_token" };
  }

  return { ok: true, session };
};
