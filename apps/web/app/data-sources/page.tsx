import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Sources | Globe Land Intelligence",
  description: "Source categories used for market, parcel, listing, and activity intelligence."
};

export default function DataSourcesPage() {
  return (
    <main className="trust-page">
      <section className="trust-card">
        <p className="trust-eyebrow">Source Provenance</p>
        <h1>Data Sources</h1>
        <p>
          This platform combines multiple source categories and tracks provenance per observation. Coverage and availability vary by
          market.
        </p>
      </section>

      <section className="trust-card">
        <h2>Source Categories</h2>
        <p>
          Registry and transaction feeds
          <br />
          Broker and agency submissions
          <br />
          Valuation and benchmark engines
          <br />
          Planning and market-activity signals
          <br />
          Compliance and legal-display review workflows
        </p>
      </section>

      <section className="trust-card">
        <h2>Operational Expectations</h2>
        <p>
          Each source is monitored for ingest lag, success rate, and license state. Duplicates, stale records, and policy conflicts are
          queued for review before or during publication.
        </p>
      </section>

      <section className="trust-card">
        <h2>Related Policies</h2>
        <p>
          Methodology: <Link href="/methodology">Methodology</Link>
          <br />
          Legal controls: <Link href="/legal-display">Legal Display</Link>
          <br />
          <Link href="/">Return to platform</Link>
        </p>
      </section>
    </main>
  );
}
