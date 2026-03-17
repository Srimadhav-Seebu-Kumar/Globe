import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology | Globe Land Intelligence",
  description: "How confidence, freshness, and blended grid rates are calculated and displayed."
};

export default function MethodologyPage() {
  return (
    <main className="trust-page">
      <section className="trust-card">
        <p className="trust-eyebrow">Model Transparency</p>
        <h1>Methodology</h1>
        <p>
          The map grid is an analytical visualization. It should be interpreted as a directional intelligence signal, not a guaranteed
          valuation.
        </p>
      </section>

      <section className="trust-card">
        <h2>Rate Model</h2>
        <p>
          Benchmark market rates are stored per square meter and normalized to per-square-foot values for consistent grid rendering.
          Distance-weighted blending is applied around each cell center.
        </p>
        <p>Grid density adapts by zoom level to balance detail and performance.</p>
      </section>

      <section className="trust-card">
        <h2>Confidence Levels</h2>
        <p>
          <strong>low</strong>: weak or sparse evidence
          <br />
          <strong>medium</strong>: partial validation
          <br />
          <strong>high</strong>: strong corroboration
          <br />
          <strong>verified</strong>: document-backed and/or trusted registry alignment
        </p>
      </section>

      <section className="trust-card">
        <h2>Freshness States</h2>
        <p>Realtime, daily, and weekly freshness tiers are tracked with stale/withdrawn suppression in review workflows.</p>
      </section>

      <section className="trust-card">
        <h2>Provenance Requirements</h2>
        <p>Published records are expected to retain source label, `observed_at`, `ingested_at`, and transform version lineage.</p>
        <p>
          Source catalogue: <Link href="/data-sources">Data Sources</Link>
          <br />
          Legal display controls: <Link href="/legal-display">Legal Display</Link>
          <br />
          <Link href="/">Return to platform</Link>
        </p>
      </section>
    </main>
  );
}
