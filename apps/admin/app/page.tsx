import { CONFIDENCE_LABELS } from "@globe/types";

export default function AdminPage() {
  return (
    <main className="admin">
      <header className="topbar">
        <strong>Globe Admin Console</strong>
        <div className="kpis">
          <span className="kpi">Sources monitored: 0</span>
          <span className="kpi">Review queue: 0</span>
          <span className="kpi">Verifications pending: 0</span>
        </div>
      </header>

      <section className="content">
        <aside className="sidebar">
          <h3 style={{ marginTop: 0 }}>Admin Navigation</h3>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Source health</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Ingestion review queue</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Broker verification</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Coverage snapshots</p>
        </aside>

        <div className="main">
          <article className="card">
            <h3 style={{ marginTop: 0 }}>Source Health Placeholder</h3>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Per-source freshness lag, ingestion success rates, and licensing status will render here.
            </p>
          </article>

          <article className="card">
            <h3 style={{ marginTop: 0 }}>Review Queue Placeholder</h3>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Dedupe conflicts, geocoding exceptions, and policy conflicts will be triaged here.
            </p>
          </article>

          <article className="card">
            <h3 style={{ marginTop: 0 }}>Verification Rules Placeholder</h3>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Confidence ladder: {CONFIDENCE_LABELS.join(" -> ")}.
            </p>
          </article>

          <article className="card">
            <h3 style={{ marginTop: 0 }}>Operations Feed Placeholder</h3>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Audit events for approval/rejection and source policy changes will appear here.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
