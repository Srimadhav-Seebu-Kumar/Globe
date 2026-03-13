"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface SourceHealthDto {
  id: string;
  sourceCode: string;
  sourceName: string;
  marketId: string;
  marketName: string;
  status: "healthy" | "degraded" | "offline";
  freshnessLagMinutes: number;
  successRate30d: number;
  lastIngestedAt: string;
  licenseState: "active" | "renewal_due";
}

interface ReviewItemDto {
  id: string;
  marketId: string;
  marketName: string;
  category: "dedupe" | "geocoding" | "policy" | "broker_verification";
  severity: "high" | "medium" | "low";
  title: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

interface LoginResponseDto {
  ok: boolean;
  token: string | null;
  email: string | null;
  role: "operator" | null;
  errorCode?: string;
}

interface CollectionResponse<T> {
  data: T[];
}

class UnauthorizedError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const SESSION_STORAGE_KEY = "globe_admin_token";

const fetchCollection = async <T,>(path: string, token: string): Promise<T[]> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload = (await response.json()) as CollectionResponse<T>;
  return payload.data;
};

const statusColor = (status: SourceHealthDto["status"]): string => {
  if (status === "healthy") {
    return "#22c55e";
  }

  if (status === "degraded") {
    return "#f59e0b";
  }

  return "#ef4444";
};

export default function AdminPage() {
  const [sources, setSources] = useState<SourceHealthDto[]>([]);
  const [reviews, setReviews] = useState<ReviewItemDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | SourceHealthDto["status"]>("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [token, setToken] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setToken("");
    setSources([]);
    setReviews([]);
    globalThis.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const sessionToken = globalThis.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionToken) {
      setToken(sessionToken);
    }
  }, []);

  const loadAdminData = useCallback(
    async (sourceStatus: "all" | SourceHealthDto["status"], authToken: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const sourcePath = sourceStatus === "all" ? "/v1/admin/sources" : `/v1/admin/sources?status=${sourceStatus}`;
        const [sourceRows, reviewRows] = await Promise.all([
          fetchCollection<SourceHealthDto>(sourcePath, authToken),
          fetchCollection<ReviewItemDto>("/v1/admin/reviews", authToken)
        ]);

        setSources(sourceRows);
        setReviews(reviewRows);
      } catch (requestError) {
        if (requestError instanceof UnauthorizedError) {
          clearSession();
          setError("Session expired. Sign in again.");
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load admin data");
      } finally {
        setIsLoading(false);
      }
    },
    [clearSession]
  );

  useEffect(() => {
    if (!token) {
      setSources([]);
      setReviews([]);
      setIsLoading(false);
      return;
    }

    void loadAdminData(statusFilter, token);
  }, [loadAdminData, statusFilter, token]);

  const pendingCount = useMemo(() => reviews.filter((review) => review.status === "pending").length, [reviews]);

  const applyDecision = async (reviewId: string, decision: "approve" | "reject") => {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/admin/reviews/${reviewId}/${decision}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        throw new UnauthorizedError();
      }

      if (!response.ok) {
        throw new Error(`Decision update failed (${response.status})`);
      }

      await loadAdminData(statusFilter, token);
    } catch (requestError) {
      if (requestError instanceof UnauthorizedError) {
        clearSession();
        setError("Session expired. Sign in again.");
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "Decision update failed");
    }
  };

  const login = async () => {
    setAuthError(null);

    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      setAuthError(`Login request failed (${response.status})`);
      return;
    }

    const payload = (await response.json()) as LoginResponseDto;
    if (!payload.ok || !payload.token) {
      const message = payload.errorCode === "auth_unconfigured" ? "API auth is not configured. Set APP_OPERATOR_EMAIL and APP_OPERATOR_PASSWORD." : "Invalid credentials.";
      setAuthError(message);
      return;
    }

    setToken(payload.token);
    globalThis.sessionStorage.setItem(SESSION_STORAGE_KEY, payload.token);
    globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
    setPassword("");
    await loadAdminData(statusFilter, payload.token);
  };

  const logout = () => {
    clearSession();
    setError(null);
  };

  return (
    <main className="admin">
      <header className="topbar">
        <strong>Globe Admin Console</strong>
        <div className="kpis">
          <span className="kpi">Sources monitored: {sources.length}</span>
          <span className="kpi">Review queue: {pendingCount}</span>
          <span className="kpi">Healthy feeds: {sources.filter((source) => source.status === "healthy").length}</span>
        </div>
      </header>

      <section className="content">
        <aside className="sidebar">
          <h3 style={{ marginTop: 0 }}>Operations</h3>
          {!token ? (
            <>
              <label style={{ display: "block", marginTop: 8, fontSize: 12, color: "#9ca3af" }} htmlFor="admin-email">
                Operator email
              </label>
              <input
                id="admin-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "8px", borderRadius: 6, background: "#0b1222", color: "#e5e7eb", border: "1px solid #1f2937" }}
              />

              <label style={{ display: "block", marginTop: 8, fontSize: 12, color: "#9ca3af" }} htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "8px", borderRadius: 6, background: "#0b1222", color: "#e5e7eb", border: "1px solid #1f2937" }}
              />

              <button className="action-btn" style={{ marginTop: 10 }} onClick={() => void login()}>
                Sign in
              </button>
              {authError ? <p style={{ color: "#fb7185", fontSize: 12 }}>{authError}</p> : null}
            </>
          ) : (
            <>
              <label style={{ display: "block", marginTop: 8, fontSize: 12, color: "#9ca3af" }} htmlFor="status-filter">
                Source status filter
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | SourceHealthDto["status"])}
                style={{ width: "100%", marginTop: 6, padding: "8px", borderRadius: 6, background: "#0b1222", color: "#e5e7eb", border: "1px solid #1f2937" }}
              >
                <option value="all">all</option>
                <option value="healthy">healthy</option>
                <option value="degraded">degraded</option>
                <option value="offline">offline</option>
              </select>

              <button className="action-btn" style={{ marginTop: 10 }} onClick={logout}>
                Sign out
              </button>
              <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 14 }}>Manual review decisions are restricted to authenticated operator sessions.</p>
            </>
          )}

          {error ? <p style={{ color: "#fb7185", fontSize: 12 }}>{error}</p> : null}
        </aside>

        <div className="main">
          <article className="card" style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginTop: 0 }}>Source health</h3>
            {!token ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>Sign in to view source telemetry.</p>
            ) : isLoading ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading source telemetry...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Market</th>
                    <th>Status</th>
                    <th>Freshness lag</th>
                    <th>Success rate (30d)</th>
                    <th>License</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id}>
                      <td>
                        {source.sourceName}
                        <br />
                        <small>{source.sourceCode}</small>
                      </td>
                      <td>{source.marketName}</td>
                      <td>
                        <span style={{ color: statusColor(source.status), fontWeight: 600 }}>{source.status}</span>
                      </td>
                      <td>{source.freshnessLagMinutes} min</td>
                      <td>{source.successRate30d.toFixed(1)}%</td>
                      <td>{source.licenseState}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>

          <article className="card" style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginTop: 0 }}>Review queue</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td>{review.marketName}</td>
                    <td>{review.category}</td>
                    <td>{review.severity}</td>
                    <td>
                      {review.title}
                      <br />
                      <small>{new Date(review.createdAt).toLocaleString()}</small>
                    </td>
                    <td>{review.status}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="action-btn"
                          disabled={review.status !== "pending" || !token}
                          onClick={() => void applyDecision(review.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="action-btn danger"
                          disabled={review.status !== "pending" || !token}
                          onClick={() => void applyDecision(review.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      </section>
    </main>
  );
}
