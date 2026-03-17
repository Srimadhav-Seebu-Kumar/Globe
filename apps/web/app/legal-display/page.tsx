import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Display Policy | Globe Land Intelligence",
  description: "How restricted records are masked and how legal-display controls are applied."
};

export default function LegalDisplayPage() {
  return (
    <main className="trust-page">
      <section className="trust-card">
        <p className="trust-eyebrow">Compliance</p>
        <h1>Legal Display Policy</h1>
        <p>
          Legal-display controls are mandatory. Records can be published, partially masked, or restricted based on source licensing and
          market policy.
        </p>
      </section>

      <section className="trust-card">
        <h2>Display States</h2>
        <p>
          Allowed: parcel and listing details are shown
          <br />
          Restricted: sensitive identifiers and geometry details are masked
          <br />
          Blocked: records are withheld from public views
        </p>
      </section>

      <section className="trust-card">
        <h2>User Controls</h2>
        <p>
          The &quot;Only legal-display parcels&quot; filter enforces strict public-safe output. Inclusive views may include records that still
          require masking or internal review.
        </p>
      </section>

      <section className="trust-card">
        <h2>Questions or Disputes</h2>
        <p>
          Report policy concerns or stale/incorrect records:
          <br />
          <a href="mailto:compliance@globelandintelligence.com">compliance@globelandintelligence.com</a>
        </p>
        <p>
          <Link href="/about">About</Link>
          <br />
          <Link href="/">Return to platform</Link>
        </p>
      </section>
    </main>
  );
}
