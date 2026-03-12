import { COVERAGE_TIERS, PRICE_STATES } from "@globe/types";
import { ShellPanel } from "@globe/ui";

import { GlobeCanvas } from "../components/globe-canvas";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <strong>Globe Land Intelligence</strong>
          <span className="badge">Coverage-aware</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="badge">Globe</span>
          <span className="badge">Market</span>
          <span className="badge">Parcel</span>
        </div>
      </header>

      <aside className="left">
        <h2 className="section-title">Filters</h2>
        <div className="placeholder-block">Market selector placeholder</div>
        <div className="placeholder-block">Coverage tier selector placeholder</div>
        <div className="placeholder-block">Price-state selector placeholder</div>
      </aside>

      <section className="map">
        <GlobeCanvas />
      </section>

      <aside className="right">
        <ShellPanel title="Detail Drawer">
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
            Market and parcel detail drawer placeholder for drill-down, provenance, and confidence timelines.
          </p>
        </ShellPanel>
      </aside>

      <section className="legend">
        <h2 className="section-title">Legend and Time Rail</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COVERAGE_TIERS.map((tier) => (
            <span className="badge" key={tier}>
              {tier}
            </span>
          ))}
          {PRICE_STATES.map((state) => (
            <span className="badge" key={state}>
              {state}
            </span>
          ))}
        </div>
      </section>

      <footer className="ticker">
        Ticker placeholder: market deltas, ingest freshness, verification events, and notable zoning signals.
      </footer>
    </main>
  );
}
