# Globe — Product Requirements Document

**Date:** April 2026
**Version:** 1.0
**Status:** Planning

---

## 1. Executive Summary

Globe is a worldwide land-intelligence platform — a Bloomberg Terminal for global real estate land markets. It aggregates fragmented, unreliable, jurisdiction-specific land data into a single, trustworthy interface where investors, developers, funds, and institutions can explore, compare, and act on land opportunities anywhere in the world.

**Core promise:** know what land exists, what it costs, and how confident you should be in that number — anywhere on Earth.

---

## 2. The Problem

### 2.1 The Status Quo is Broken

Global land markets are informationally dark. The current experience for a serious land investor or developer looks like this:

- **Fragmentation** — Pricing data lives across hundreds of local brokers, government registries, private databases, and listing portals, each using different formats, currencies, and legal conventions.
- **False precision** — Platforms show a single price number with no indication of whether it's an asking price, a closed transaction, an algorithmic estimate, or a broker opinion of value. These are fundamentally different things.
- **Stale data passed off as live** — Most aggregators refresh data infrequently and don't surface that information to users. A "median price" could reflect 18-month-old transactions.
- **Jurisdiction blindness** — What you can legally display about a parcel varies enormously by country and even by municipality. Most platforms either ignore this (and get legally exposed) or simply don't operate internationally.
- **No provenance** — Where did this number come from? When was it collected? What transform was applied? These questions have no answers on any current platform.

### 2.2 Who Is Suffering

| Persona | Pain |
|---|---|
| Land investor (global) | Can't compare markets across borders on a level playing field |
| Real estate developer / fund | Can't underwrite acquisitions without trustworthy comparable data |
| Sovereign wealth fund / institution | Needs provenance and audit trails for regulatory compliance |
| Government / urban planner | Lacks high-fidelity spatial intelligence for policy decisions |
| Broker / agent | Has no structured way to contribute verified market knowledge |

---

## 3. What Globe Is Trying to Achieve

### 3.1 Mission

Make global land markets legible. Every parcel, every market, every price — with full transparency into data quality, freshness, and legal context.

### 3.2 Strategic Goals

1. **Unify** fragmented global land data into a single, comparable, normalized dataset.
2. **Expose uncertainty** — make confidence, freshness, and provenance first-class UI elements, not footnotes.
3. **Respect jurisdictions** — model legal display rules as a core system concern, not an afterthought.
4. **Enable comparison** — allow land in Portugal, Texas, and Bali to be compared on the same screen with full awareness of what that comparison actually means.
5. **Rollout credibly** — launch market-by-market with honest coverage tiers rather than claiming fake worldwide depth.

### 3.3 Non-Goals

- Globe is **not** a transaction platform (it doesn't facilitate sales).
- Globe is **not** a CRM for brokers.
- Globe is **not** trying to replace local listing portals.
- Globe does **not** fabricate confidence — if data is thin, it says so.

---

## 4. How Globe Helps

### 4.1 For Investors

- Discover land opportunity in markets they don't have local brokers in.
- Compare price per sqm/sqft across regions with full currency normalization.
- Set watchlist alerts on geographies, price bands, or activity spikes.
- Understand market momentum through closed-transaction velocity, not just listing counts.

### 4.2 For Developers and Funds

- Underwrite land acquisitions with broker-verified quotes and closed-sale comparables.
- Get confidence intervals on valuation model outputs, not point estimates.
- Export provenance-stamped reports for internal deal committees or LP reporting.

### 4.3 For Institutions and Government

- Access parcel-level spatial intelligence where legally permitted.
- Audit where data came from: source ID, ingestion timestamp, transform version.
- Integrate via API with their own underwriting or policy tools.

### 4.4 For Brokers

- Submit verified local knowledge (broker-verified price state) through an intake workflow.
- Build reputation within the platform through verified contributions.
- Receive attribution for sourced data where licensing allows.

---

## 5. How Globe Differs from the Current World

### 5.1 Competitive Landscape

| Platform | What They Do | What They Miss |
|---|---|---|
| **CoStar / Loopnet** | US commercial real estate database | US-only, minimal land focus, no international |
| **Zillow / Redfin** | US residential listings | Consumer-grade, no provenance, no uncertainty |
| **PropertyGuru / REA Group** | Regional APAC portals | Local only, no comparison framework |
| **Land.com / Lands of America** | US rural land listings | Domestic, listing aggregator only |
| **MSCI Real Estate** | Institutional performance data | Index-level, not parcel-level, expensive |
| **CoreLogic / Attom** | US data licensing | Data vendor not a product; US-centric |

### 5.2 Globe's Differentiators

**1. Price State Separation**
No competitor separates ask / closed / estimated / broker-verified prices at the UI level. They show a single number. Globe treats these as fundamentally different data classes with different visual treatments (blue / green / amber / purple respectively). A user immediately knows whether they're looking at what a seller wants vs. what a buyer actually paid.

**2. Provenance as a Core Feature**
Every data point carries: source ID, observed timestamp, ingested timestamp, transform version, confidence label. This is table stakes for institutional use — and no consumer or semi-pro platform provides it.

**3. Explicit Coverage Tiers**
Globe uses a 3-tier model (A: global summary, B: market depth, C: parcel detail) to be honest about data depth by geography. Users never see false data — they see accurate data with clearly communicated limitations. This builds trust and is the foundation for international expansion.

**4. Regulatory-Native Design**
Legal display policies (`legalDisplayAllowed`, per-market display rules) are modeled as first-class database records, not legal footnotes. Globe can operate in jurisdictions that other platforms simply cannot, because it knows what it can and cannot show per geography.

**5. Globe-First Spatial UX**
A 3D interactive globe with metric overlays is the entry point, not an afterthought. Users visualize land markets as spatial phenomena — density of activity, price gradients, coverage confidence — before drilling into individual parcels.

**6. International by Architecture**
Built from day one for multiple currencies, tenure models (freehold/leasehold/etc.), zoning systems, measurement units (sqm/sqft/tsubo), and legal jurisdictions. Competitors bolt on international as an afterthought; Globe was designed for it.

---

## 6. What Makes Globe Attractive

### 6.1 Immediate Attractors (Day One)

- **The 3D Globe UX** — Visually distinctive. A Bloomberg Terminal doesn't look like this. The globe canvas creates immediate emotional resonance with the "worldwide" brand promise.
- **Price state colors** — Instantly communicates data sophistication. Ask is blue, closed is green, estimate is amber. Power users recognize this immediately as a sign of rigor.
- **Freshness badges** — "Data from 14 days ago" next to a price. Simple, trust-building, no competitor does this.
- **Command Palette (Cmd+K)** — Fast global search for markets, parcels, brokers. Signals a product built for power users.
- **Dark market-monitor aesthetic** — Bloomberg meets Linear. Professional, dense, information-rich without being overwhelming.

### 6.2 Structural Attractors (Depth)

- **Data coverage network effects** — As more brokers contribute verified quotes, the data quality moat widens. Early broker relationships are defensible.
- **Provenance trail** — Institutions will pay meaningfully for auditable data. This is not replicable quickly by consumer portals.
- **API access** — Funds and institutions want to pipe Globe data into their own models. An API tier creates stickiness and ARR.
- **Watchlists and alerts** — Retention mechanism. Once users have saved geographies and price bands, they have a reason to return daily.
- **Market-by-market trust building** — Launching in Tier A markets with honest coverage before expanding earns long-term credibility over platforms that claim global coverage and deliver noise.

### 6.3 What Can Make It More Attractive

**Short term (0–6 months):**
- Launch with 3–5 well-covered markets where data depth is genuinely impressive. Better to be exceptional in Portugal and Austin than thin everywhere.
- Activate broker intake flow early — creates supply-side data quality loops and a compelling story ("powered by verified local experts").
- Mobile globe canvas with swipe-to-compare gesture creates viral share moments.
- Shareable parcel dossier links and branded PDF export — virality via professional sharing.

**Medium term (6–12 months):**
- **Portfolio view** — track multiple parcels/markets with P&L-style dashboards for funds managing land positions.
- **Price history timelines** — show how ask and closed prices evolved over 12/24/60 months. Trend data is extremely valuable.
- **Comparable engine** — "Find 5 parcels most similar to this one" using geo + zoning + size + tenure.
- **Notification center** — alerts when a watched market crosses a price threshold or new closed transactions appear.
- **Data marketplace** — allow licensed data providers to surface premium datasets within Globe's provenance framework.

---

## 7. Year-1 Product Vision (April 2027)

### 7.1 Where Globe Should Be

**Coverage:**
- Tier A (global summary heat map): worldwide
- Tier B (market depth: listings, trends, transactions): 25–40 markets across 15+ countries
- Tier C (parcel-level detail): 8–12 markets in 4–6 countries where legal/data permits

**Users:**
- 5,000–15,000 registered users
- 200–500 paying institutional/professional accounts
- 50–100 active broker contributors across Tier B/C markets

**Revenue:**
- 3 pricing tiers: Free (exploration), Pro (watchlists, alerts, exports), Institutional (API + provenance + SLA)
- Data licensing partnerships with 2–3 regional providers

### 7.2 Core Product Features (Year 1 Complete)

| Feature | Description |
|---|---|
| Globe Canvas | 3D interactive globe with price-state overlays, activity heat map, coverage confidence layer |
| Market View | Market-level drill-down with trend charts, transaction velocity, listing counts |
| Parcel Dossier | Full parcel detail: price history, provenance, comparables, zoning, tenure, legal display status |
| Compare Grid | Side-by-side comparison of 2–4 parcels across any markets |
| Portfolio Dashboard | Track owned/watched parcels with value estimates and confidence intervals |
| Price Timeline | 5-year ask + closed price history with trend lines for any market or parcel |
| Comparable Engine | AI-assisted "find similar parcels" using geo + attributes |
| Broker Intake | Verified local price contributions with attribution and review workflow |
| Watchlists + Alerts | Save geographies, set price/activity thresholds, receive email/push notifications |
| Export / Reports | Provenance-stamped PDF dossier and CSV export |
| Public API | Programmatic access to market + parcel data with provenance metadata |
| Admin Console | Source health monitoring, broker review, data quality operations |

### 7.3 Technical Milestones (Year 1)

| Milestone | Target |
|---|---|
| PostgreSQL/PostGIS fully connected to API | Month 1–2 |
| Security hardening (bcrypt, rate limiting, token validation) | Month 1 |
| 3 Tier B markets live with real data | Month 2–3 |
| Broker intake flow live | Month 3–4 |
| Pro tier with payments | Month 4–5 |
| Public API beta | Month 5–6 |
| Mobile-responsive globe canvas | Month 4–5 |
| Price history timelines | Month 6–8 |
| Comparable engine v1 | Month 8–10 |
| 25 Tier B markets | Month 10–12 |
| Portfolio dashboard | Month 10–12 |

### 7.4 The Year-1 Golden Path

A land investment fund can:

1. Open Globe, search "industrial land, Portugal, > 5 ha"
2. See a heat map of asking prices vs. closed transactions overlaid on a geographic view
3. Drill into a specific market zone and see 90-day price velocity
4. Open 3 parcel dossiers and compare them side-by-side with broker-verified quotes
5. Export a provenance-stamped report for their investment committee
6. Set a watchlist alert for when closed-sale prices in that zone cross €X/sqm
7. Do all of this without calling a single local broker to get started

**That workflow — end-to-end — does not exist anywhere today.**

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Data quality in new markets is poor | Coverage tier system — only surface what's genuinely Tier B or C ready |
| Legal liability for displaying restricted data | `legalDisplayAllowed` per-market flag in schema; legal review before each market launch |
| Broker data is self-reported and unreliable | Review workflow in admin console; confidence label distinguishes verified from submitted |
| Competition from well-funded incumbents | Defensible through provenance system, international-native architecture, broker network effects |
| Security issues block institutional sales | Fix critical issues (bcrypt, rate limiting, PostgreSQL migration) before any paid launch |
