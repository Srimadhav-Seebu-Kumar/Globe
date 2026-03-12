"use client";

import { useEffect, useMemo, useState } from "react";

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

interface CollectionResponse<T> {
  data: T[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const fetchCollection = async <T,>(path: string): Promise<T[]> => {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
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

  const loadAdminData = async (sourceStatus: "all" | SourceHealthDto["status"]) => {
    setIsLoading(true);
    setError(null);

    try {
      const sourcePath = sourceStatus === "all" ? "/v1/admin/sources" : `/v1/admin/sources?status=${sourceStatus}`;
      const [sourceRows, reviewRows] = await Promise.all([
        fetchCollection<SourceHealthDto>(sourcePath),
        fetchCollection<ReviewItemDto>("/v1/admin/reviews")
      ]);

      setSources(sourceRows);
      setReviews(reviewRows);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData(statusFilter);
  }, [statusFilter]);

  const pendingCount = useMemo(() => reviews.filter((review) => review.status === "pending").length, [reviews]);

  const applyDecision = async (reviewId: string, decision: "approve" | "reject") => {
    await fetch(`${API_BASE_URL}/v1/admin/reviews/${reviewId}/${decision}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    await loadAdminData(statusFilter);
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

          <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 14 }}>Manual review decisions sync immediately with API memory state.</p>
          {error ? <p style={{ color: "#fb7185", fontSize: 12 }}>{error}</p> : null}
        </aside>

        <div className="main">
          <article className="card" style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginTop: 0 }}>Source health</h3>
            {isLoading ? (
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
                          disabled={review.status !== "pending"}
                          onClick={() => void applyDecision(review.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="action-btn danger"
                          disabled={review.status !== "pending"}
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
