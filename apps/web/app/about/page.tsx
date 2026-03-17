import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Globe Land Intelligence",
  description: "What Globe Land Intelligence is, who it is for, and how coverage tiers are used."
};

export default function AboutPage() {
  return (
    <main className="trust-page">
      <section className="trust-card">
        <p className="trust-eyebrow">Globe Land Intelligence</p>
        <h1>About</h1>
        <p>
          Globe Land Intelligence is a parcel-first land decision platform. We combine market observations, legal-display policy,
          confidence scoring, and map intelligence to help acquisition teams assess opportunities faster.
        </p>
        <p>
          Coverage is intentionally tiered and explicit:
          <br />
          <strong>Tier A</strong>: global visibility
          <br />
          <strong>Tier B</strong>: market depth
          <br />
          <strong>Tier C</strong>: parcel depth
        </p>
      </section>

      <section className="trust-card">
        <h2>Who It Serves</h2>
        <p>Developers, land investors, acquisition teams, brokers, and operators that need decision-grade parcel context.</p>
      </section>

      <section className="trust-card">
        <h2>Trust Principles</h2>
        <p>Every visible record is designed to carry source, observation timestamp, ingest timestamp, and confidence/freshness states.</p>
        <p>
          Review methodology: <Link href="/methodology">Methodology</Link>
          <br />
          Review source categories: <Link href="/data-sources">Data Sources</Link>
          <br />
          Review legal display policy: <Link href="/legal-display">Legal Display</Link>
        </p>
      </section>

      <section className="trust-card">
        <h2>Contact</h2>
        <p>
          Partnership, broker onboarding, and market rollout requests:
          <br />
          <a href="mailto:hello@globelandintelligence.com">hello@globelandintelligence.com</a>
        </p>
        <p>
          <Link href="/">Return to platform</Link>
        </p>
      </section>
    </main>
  );
}
