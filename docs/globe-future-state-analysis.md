# Globe — Future-State Analysis & Company Vision

**A 5–10 year strategy memo: from land-intelligence prototype to the Bloomberg Terminal for the physical world.**

Prepared June 2026 · Consolidated from the Globe future-state strategy canvases.

> **Note on figures.** Globe today is an early, high-fidelity prototype running on seeded mock data. Every market-size, revenue, ACV, and cost figure in this document is an illustrative founder/VC-grade projection for planning and fundraising — not a current platform metric.

---

## Table of contents

- [Executive Summary](#executive-summary)
- [1. Company Vision](#1-company-vision)
- [2. Problem Analysis](#2-problem-analysis)
- [3. Customer Segments](#3-customer-segments)
- [4. Product Evolution Roadmap](#4-product-evolution-roadmap)
- [5. Feature Universe](#5-feature-universe)
- [6. Data Strategy](#6-data-strategy)
- [7. AI Strategy](#7-ai-strategy)
- [8. Technical Architecture](#8-technical-architecture)
- [9. Business Model](#9-business-model)
- [10. Competitive Analysis](#10-competitive-analysis)
- [11. Moats & Defensibility](#11-moats--defensibility)
- [12. Globe in 2036 — The 10-Year Blueprint](#12-globe-in-2036--the-10-year-blueprint)
- [Risk Assessment](#risk-assessment)

---

## Executive Summary

Globe's thesis: **land is the world's largest, least legible asset class.** Global real estate is worth roughly **$380T** — more than all equities and debt securities combined — and the land component alone is estimated at **$100–130T**. Yet there is no global system of record for what land exists, who controls it, what it is worth, what can be built on it, and what risks it carries. CoStar built a $30B company on US commercial buildings. Bloomberg built a $13B/year business making financial markets legible. **Nobody has done this for land at planetary scale.** That is the company Globe is building.

| Metric | Value |
|---|---|
| Global real estate value (est.) | **$380T** |
| Annual land & dev-site transactions | **$3–5T** |
| RE data/analytics market, 2026 → 2035 | **$15B → $40B** |
| Global land systems of record today | **0** |

### Where Globe is now

Today Globe is a high-fidelity prototype: a finished 3D-globe frontend, a complete typed API surface, an admin moderation console, and a production-grade PostGIS schema — but running on seeded mock data, with no real ingestion, no valuation engine, and unresolved security debt. The honest framing: **the demo is 90% done; the company is 5% done.** That is normal and good — the prototype proves the product vision cheaply before the expensive part (data) begins.

### The five-act arc

| Act | Years | What Globe is | Revenue engine |
|---|---|---|---|
| V1 — Prototype | 2026 | Interactive demo with coverage-tier honesty built in | None (pre-revenue) |
| V2 — Commercial launch | 2026–27 | Real data in 2–3 launch markets; paid terminal | Pro subscriptions |
| V3 — National platform | 2028–29 | Full-country coverage; valuation engine; API | Teams + Enterprise + API |
| V4 — Global land OS | 2030–32 | 50+ countries; marketplace; risk suite; gov deals | Enterprise + data licensing + take rate |
| V5 — Autonomous network | 2033–36 | AI agents monitoring Earth's land continuously | Outcome-priced intelligence |

### ARR trajectory (modeled scenarios, $M year-end)

| Scenario | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Bull | 1 | 4 | 12 | 30 | 75 | 160 | 300 | 520 | 850 | 1,300 |
| Base | 0.5 | 2 | 6 | 15 | 35 | 70 | 130 | 220 | 350 | 520 |
| Bear | 0.2 | 0.8 | 2.5 | 6 | 14 | 28 | 50 | 85 | 130 | 190 |

Bull assumes successful government cadastral partnerships; bear assumes data-licensing friction slows market expansion.

> **The single strategic bet.** Every successful land-data company before Globe chose one country and one asset class (CoStar: US commercial; Zillow: US homes). Globe's contrarian bet is that a coverage-tiered global architecture — honest about data depth per market, built multi-market from day one — compounds into a moat no single-market incumbent can replicate without rebuilding from scratch. The existing codebase already enforces this (coverage tiers A/B/C, provenance on every object, legal display policy per market). **The architecture is the strategy.**

---

## 1. Company Vision

**Mission** — Make every square meter of Earth legible: priced, understood, and tradable.

**Long-term vision** — The default decision layer for anyone who buys, builds on, finances, insures, regulates, or studies land — the Bloomberg Terminal for the physical world.

### What Globe ultimately becomes

Globe matures from a discovery tool into infrastructure. The end state is a **planetary land graph**: every parcel, its geometry, ownership structure, zoning envelope, transaction history, valuation, development potential, and risk profile — versioned, provenanced, and queryable by humans and machines. On top of that graph sit four businesses: a **terminal** (workflow software for land professionals), a **data utility** (API and bulk licensing), a **marketplace** (verified listings and transaction infrastructure), and an **intelligence service** (AI agents that monitor, predict, and recommend).

### Category and positioning

| Dimension | Position |
|---|---|
| Category | Land Intelligence — a new category between PropTech data (CoStar), GIS (Esri), and financial terminals (Bloomberg) |
| Wedge | Global land-market discovery with honest coverage tiers — the only product that shows the whole world without lying about data depth |
| Anchor analogy | "Bloomberg for land" for investors; "Google Maps for what you can build and what it's worth" for developers |
| Price anchor | Bloomberg seat ≈ $30K/yr; CoStar seat ≈ $5–15K/yr; Globe spans $1.2K (Pro) to $250K+ (sovereign) |
| Unique advantage | Provenance-first architecture: every datum carries source, freshness, confidence, and legal display policy — built into the schema from day one |

### The four whys

**Why customers pay.** Land decisions are large (median deal $1M+), infrequent, and information-asymmetric. A 2% pricing error on a $10M site is $200K — Globe at $60K/yr pays for itself on one deal. Customers buy three things: deal-sourcing alpha (see opportunities first), risk avoidance (zoning, climate, title surprises), and time (weeks of manual research compressed to minutes).

**Why investors fund it.** Data businesses with workflow lock-in are the best business model in software: 80%+ gross margins, 120%+ net revenue retention, and terminal pricing power (Bloomberg has raised prices ~4%/yr for 30 years). The TAM is enormous and the incumbent (CoStar) is structurally single-country and building-centric, leaving land and rest-of-world open.

**Why governments need it.** Most governments cannot answer basic questions about their own land: what is vacant, what is informally occupied, what tax base is leaking. Globe becomes the analytical layer over fragmented cadastres — for land-administration modernization, tax-base discovery, infrastructure planning, and disaster response. The World Bank funds exactly this category of project ($1B+/yr in land-administration lending).

**Why banks, funds, and developers need it.** Lenders need collateral valuation at origination and continuous revaluation across portfolios. Funds need pipeline screening across hundreds of markets they cannot staff locally. Developers need feasibility (zoning envelope × construction cost × exit value) before optioning a site. All three currently stitch this from consultants, spreadsheets, and county websites.

> **Ultimate purpose.** Land is how humanity stores most of its wealth and where all physical development happens — housing, energy transition, logistics, food. Mispriced and illegible land markets misallocate trillions. Globe's purpose is to make land markets efficient the way market-data infrastructure made capital markets efficient.

---

## 2. Problem Analysis

Eight structural failures define the land market. Each exists for durable institutional reasons — which is exactly why solving them is defensible: these are not gaps a feature closes, they are gaps an infrastructure company closes.

### 2.1 Land information fragmentation
- **Why it exists:** Land records evolved nationally and sub-nationally over centuries: 190+ countries, thousands of county/municipal registries, paper deeds, incompatible formats, no shared identifiers. There was never an economic actor with incentive to unify them.
- **Who suffers:** Every cross-border investor, multinational developer, lender with multi-region collateral, and researcher.
- **Economic impact:** Cross-border land investment carries 2–6 months of due-diligence latency per deal; institutional capital simply skips markets it cannot read — starving emerging markets of development capital.
- **How Globe solves it:** One canonical parcel graph with stable global IDs, per-market adapters, and explicit coverage tiers — fragmentation becomes Globe's moat because each integrated registry compounds the graph.

### 2.2 Pricing opacity
- **Why it exists:** Asking prices live in broker silos; closed prices are unrecorded or lagged 6–18 months in registries; many markets have no MLS at all. Sellers benefit from opacity; no neutral party publishes truth.
- **Who suffers:** Buyers (overpay), sellers in thin markets (underprice), lenders (collateral error), tax authorities (assessment error).
- **Economic impact:** Bid-ask spreads in opaque land markets run 15–40% vs ~5% in transparent ones; the global mispricing dead-weight is measured in hundreds of billions annually.
- **How Globe solves it:** Four separated price states (ask / closed / estimate / broker-verified) with provenance and confidence on each — already enforced in Globe's type system — plus a valuation engine that triangulates them.

### 2.3 Transaction invisibility
- **Why it exists:** Most land deals are private treaties; registries record transfers slowly and often without price; off-market deals never surface anywhere.
- **Who suffers:** Appraisers (no comps), funds (no market-timing signal), governments (no tax enforcement), economists (no data).
- **Economic impact:** Valuations rest on 3–10 comps months stale; whole markets re-price invisibly until a crisis reveals it (e.g. land-banking collapses).
- **How Globe solves it:** Registry ingestion + broker-verified feeds + satellite-detected activity (construction starts as transaction proxies) + marketplace data exhaust once Globe processes deals itself.

### 2.4 Zoning and entitlement complexity
- **Why it exists:** Zoning is written in legal prose across tens of thousands of municipal ordinances, amended constantly, interpreted case-by-case. It was never designed to be machine-readable.
- **Who suffers:** Developers (feasibility risk), architects, small builders who cannot afford land-use counsel, and housing supply overall.
- **Economic impact:** Entitlement uncertainty adds 6–24 months and 5–15% cost to development; it is a primary driver of the global housing shortage.
- **How Globe solves it:** Zoning-interpretation AI — LLM extraction of ordinances into structured envelopes (use, FAR, height, setbacks) with citation back to source text, validated by local experts, attached to every parcel.

### 2.5 Development risk
- **Why it exists:** Feasibility depends on a dozen independent unknowns — soil, slope, utilities, access, permits, market depth at exit — each researched separately by consultants.
- **Who suffers:** Developers, their lenders, and equity partners; landowners who can't credibly market development potential.
- **Economic impact:** Failed or abandoned projects waste billions in pursuit costs annually; risk premiums inflate required returns and suppress building.
- **How Globe solves it:** A parcel-level feasibility model that composes zoning envelope, terrain, utility proximity, permit-probability, construction-cost indices, and exit-value forecasts into one underwriting view.

### 2.6 Infrastructure uncertainty
- **Why it exists:** Roads, transit, utilities, and data centers reshape land values years before completion, but plans are buried in agency PDFs, budget lines, and procurement portals.
- **Who suffers:** Investors (miss the appreciation), communities (displacement surprise), utilities and telecoms planning their own buildouts.
- **Economic impact:** Infrastructure-driven land appreciation (often 2–10× near new transit) is captured by insiders; public agencies leave value-capture revenue unrealized.
- **How Globe solves it:** An infrastructure-pipeline data layer (planned/funded/under-construction) fused with an impact model that prices expected value uplift per parcel — a signal no incumbent offers globally.

### 2.7 Climate and physical risk
- **Why it exists:** Historical risk maps no longer predict flood, fire, heat, or water stress; risk models are siloed in insurance and rarely parcel-resolution.
- **Who suffers:** Every long-hold owner, insurers (mispriced books), lenders (30-yr mortgages on 10-yr viable land), municipalities.
- **Economic impact:** Estimated $1T+ of coastal and fire-exposed real estate is mispriced vs forward-looking risk; insurance withdrawal is already repricing entire regions abruptly.
- **How Globe solves it:** Parcel-level forward climate scores (flood, fire, heat, water, subsidence) from fused satellite + climate-model data, integrated directly into valuations rather than sold as a separate report.

### 2.8 Investment discovery failure
- **Why it exists:** There is no global search engine for land. Opportunity discovery runs on local brokers, relationships, and chance — geographically capped attention.
- **Who suffers:** Capital allocators of every size; landowners in low-attention markets who face thin demand.
- **Economic impact:** Capital concentrates in a few legible gateway markets, inflating them while equivalent-quality land elsewhere trades at irrational discounts.
- **How Globe solves it:** Globe's core product — screeners, alerts, watchlists, and AI deal-sourcing over the global parcel graph — turning land discovery from relationship-bound to query-bound.

---

## 3. Customer Segments

Nineteen segments, three buying motions: **self-serve terminal** (long tail), **enterprise seats + API** (institutions), and **sovereign contracts** (governments). The strategic sequencing matters: start with land investors and developers (highest pain, fastest sales cycle), expand to institutions once data depth justifies six-figure ACVs, and pursue government deals opportunistically — they are slow but fund data acquisition that benefits everyone else.

| Segment | Key pain | Existing tools | Why Globe wins | ACV / yr |
|---|---|---|---|--:|
| Land investors & syndicators | Sourcing relationship-bound; comps scarce | LandWatch, MapRight, county GIS | Global screeners + alerts + valuation in one terminal | $2.5K–25K |
| Family offices | Thin teams, huge mandates, cross-border blindness | Consultants, CoStar (US), broker networks | One analyst covers what advisor networks did | $25K–75K |
| Sovereign wealth funds | $100M+ tickets into illegible markets | Big-4 diligence, Bloomberg (ex-land) | Portfolio monitoring + sovereign-grade provenance | $250K–1M |
| REITs | Land-bank valuation opacity; pipeline screening | CoStar, Altus ARGUS, internal models | Continuous mark-to-model + expansion-market screening | $100K–500K |
| Hedge funds & quant RE | No tradable land signal feed | Placer.ai, satellite vendors, scraped data | Clean, point-in-time-correct API; backtestable | $150K–750K |
| Residential developers | Site sourcing, zoning yield, entitlement risk | LandVision, local GIS, TestFit | Zoning-aware site screeners by buildable units | $25K–100K |
| Commercial & industrial developers | Power/fiber/freight access in utility silos | Esri, site-selection consultants, CoStar | Infrastructure-fused parcel search at global scale | $50K–250K |
| Logistics & data-center operators | Racing for scarce powered land | CBRE/JLL advisory, internal GIS | Monitoring for powered-land signals before brokers call | $100K–400K |
| Governments & land agencies | Incomplete cadastres, leaking tax base | Esri, Trimble Landfolio, paper | Analytical layer over records: vacancy, tax-gap, encroachment | $250K–5M |
| Urban planners & consultancies | Slow scenario analysis; data assembly | Esri ArcGIS, UrbanFootprint, Replica | Pre-assembled current land graph + scenario tools | $50K–200K |
| Infrastructure & construction majors | Right-of-way corridor acquisition risk | Esri, title companies, manual outreach | Corridor analytics: fragmentation, cost, holdout risk | $200K–1M |
| Utilities & grid operators | Siting transmission/renewables vs land cost | Esri, siting studies, LandGate | Parcel-level siting with ownership/easement/risk layers | $100K–500K |
| Banks & lenders | Slow collateral valuation; annual revaluation | Appraisal networks, ICE/Black Knight | Instant AVM + continuous mark-to-model + climate LTV | $250K–2M |
| Insurers & reinsurers | Stale hazard maps; quarterly exposure | Verisk, RMS (Moody's), CoreLogic | Parcel-resolution forward risk + live exposure monitoring | $300K–2M |
| Renewable energy developers | Buildable land with grid access at scale | LandGate, Anderson Optimization, Paces | Global buildable-land screener + owner outreach | $100K–500K |
| Agriculture & timberland funds | Soil/water/yield disconnected from listings | AcreValue, Tillable, internal models | Productivity-adjusted valuation across countries | $50K–250K |
| Mining & extractives | Surface vs mineral rights; permitting risk | S&P Global (mining), local cadastres | Surface-rights intelligence + permitting-risk scoring | $100K–400K |
| Telecom & tower companies | Repeated parcel research for towers/fiber | Internal systems, Esri | Bulk parcel + ownership + zoning API per lookup | $75K–300K |
| Data providers & platforms | Redundant land-data plumbing per vertical | ATTOM, CoreLogic, Regrid (upstream) | Globe as canonical upstream graph + valuation API | Rev-share / $100K+ |

*Mid-point ACVs (highest → lowest): land agencies $1.0M, insurers $0.9M, banks $0.75M, sovereign funds / infrastructure $0.5M, hedge funds $0.4M, utilities / data-center $0.3M / $0.25K… Source: comparable pricing from CoStar, Verisk, Placer.ai, LandGate public pricing and analyst estimates.*

---

## 4. Product Evolution Roadmap

### V1 — Prototype (now, 2026)
- **What it is:** Interactive 3D globe, market discovery, parcel exploration, asking-price view, transaction history, watchlists, alerts, comparison, admin moderation — on seeded data.
- **Data layers:** Mock markets, parcels, listings, alerts.
- **UX:** Beautiful demo that earns the right to raise money and sign design partners.
- **Revenue:** None (pre-revenue).
- **Team:** Founders + small core eng.
- **Tech:** Next.js web, raw-Node typed API, PostGIS schema (unused), file-based stores.
- **Exit criteria:** Replace mock data; close critical security debt (password hashing, export-policy bypass, durable stores, auth-secret hardening); sign 3–5 design partners.

### V2 — Commercial launch (2026–27)
- **What it is:** Real data in 2–3 launch markets (e.g. one US metro, London, one growth-market city); the first product someone pays for.
- **Data layers:** Live parcels/zoning/ownership for launch markets; real listings via broker partnerships; basic comps; first AVM v0.
- **UX:** Saved searches, exportable memos (policy-safe), shareable parcel reports, team workspaces.
- **Revenue:** Pro self-serve ($99–199/mo) + early enterprise pilots.
- **Team:** +data engineering, +GIS, +2 market-ops, +design partner success.
- **Tech:** Real ingestion pipeline (Python service), Postgres as canonical store, queue/worker for writes, observability, OpenAPI.
- **Exit criteria:** $1M ARR run-rate; <2% logo churn; valuation model beating broker error on closed comps.

### V3 — National intelligence platform (2028–29)
- **What it is:** Full-country coverage for the lead market; valuation engine in production; public API; risk v1.
- **Data layers:** National cadastre + zoning + transactions; climate/flood/fire scores; infrastructure pipeline; satellite-derived land-use change.
- **UX:** Underwriting workspace (feasibility, DCF, cap-rate), portfolio monitoring, alerting on parcel/market events, dashboards.
- **Revenue:** Teams ($1–3K/seat/mo), Enterprise ($100K–500K), metered API.
- **Team:** Dedicated ML, data partnerships, enterprise sales + solutions engineering, compliance/legal for data licensing.
- **Tech:** Multi-region read replicas, tile/vector serving at scale, feature store, model registry, search (Elastic/OpenSearch), event bus.
- **Exit criteria:** $15M ARR; one anchor enterprise per target vertical; reference government pilot.

### V4 — Global land operating system (2030–32)
- **What it is:** 50+ countries at coverage tiers A/B/C; verified-listing marketplace; full risk suite; first sovereign/government contracts.
- **Data layers:** Dozens of national cadastres, global satellite cadence, economic + infrastructure + climate layers, marketplace transaction exhaust.
- **UX:** Marketplace (list, discover, transact), cross-border portfolio cockpit, government analytics console, embeddable Globe widgets.
- **Revenue:** Enterprise expansion, bulk data licensing, marketplace take-rate, government/NGO contracts.
- **Team:** Regional GMs, global data-partnerships org, marketplace + payments, security/compliance for sovereign data.
- **Tech:** Data-lakehouse, multi-region active-active, per-market data-residency, lineage/governance, partner data-clean-rooms.
- **Exit criteria:** $70M+ ARR; multi-country net revenue retention >120%; marketplace GMV flywheel turning.

### V5 — Autonomous AI land-intelligence network (2033–36)
- **What it is:** AI agents continuously monitor Earth's land — detecting change, re-valuing parcels, surfacing deals, flagging risk — with humans supervising, not querying.
- **Data layers:** Real-time satellite + sensor + permit + market streams; a self-updating planetary land graph.
- **UX:** Conversational/agentic — "tell me when buildable powered land >50 acres appears within 20mi of a planned substation in these five countries" runs forever.
- **Revenue:** Outcome- and intelligence-priced (alpha feeds, monitoring-as-a-service), plus all prior lines.
- **Team:** Applied-research org, agent-safety/eval, large data-ops, global GTM.
- **Tech:** Streaming inference, continuous training, agent orchestration, vector + graph stores, planet-scale geospatial compute.
- **North star:** Globe answers any land question about anywhere on Earth, with provenance, in seconds.

---

## 5. Feature Universe

110+ features across ten intelligence domains. The discipline is sequencing: ship the domains that compound the data graph first (parcel, market) before the ones that depend on it (financial, AI copilot).

**Market Intelligence** — supply/demand forecasting · market heat maps · growth-corridor prediction · investment scoring · liquidity/absorption metrics · price-trend indices · market-cycle phase detection · rent/yield benchmarking · new-supply pipeline tracking · capital-flow heat maps · submarket clustering · gentrification signals.

**Parcel Intelligence** — ownership resolution & beneficial-owner graphs · encumbrance/lien tracking · easements & rights-of-way · legal-restriction extraction · historical transaction timeline · assessed-vs-market gap · split/assemblage detection · adjacent-owner mapping · parcel-shape/buildability scoring · access & frontage analysis · mineral/air/water rights separation.

**Development Intelligence** — zoning interpretation AI · buildable-envelope (FAR/height/setback) calc · permit-probability prediction · entitlement-timeline estimation · feasibility/highest-best-use modeling · construction-cost integration · density-bonus & incentive detection · environmental-constraint overlays · utility-capacity checks · site-plan auto-generation (massing).

**Financial Intelligence** — automated valuation (AVM) · cap-rate analysis · yield forecasting · ROI/IRR simulation · DCF modeling · sensitivity/scenario analysis · debt-sizing & LTV · land-residual valuation · tax-assessment appeal support · portfolio mark-to-model · comparable-sale auto-selection.

**Risk Intelligence** — flood risk · wildfire risk · heat & drought/water stress · coastal/sea-level · seismic/subsidence · political & regulatory risk · title/ownership risk · environmental-contamination flags · insurance-availability scoring · climate-adjusted valuation · forward (not historical) hazard scores.

**Satellite Intelligence** — construction-start detection · land-use change detection · encroachment/illegal-build monitoring · vegetation/agriculture monitoring · impervious-surface tracking · solar/renewable-suitability · nighttime-lights activity · post-disaster damage assessment · vacant-land detection · change-over-time imagery diffing.

**Infrastructure Intelligence** — transit/road pipeline tracking · utility & grid-capacity mapping · broadband/fiber coverage · data-center & power-availability mapping · port/freight access · planned-project impact modeling · proximity-uplift scoring · public-investment tracking · value-capture analysis.

**Market-Discovery & Search** — global parcel/market search · natural-language search · saved searches & screeners · real-time alerts · watchlists · multi-parcel comparison · off-market opportunity surfacing · similar-parcel recommendations · map-driven exploration · bulk list import/scoring.

**AI Copilot & Automation** — natural-language Q&A over the land graph · investment recommendations · automated market & parcel reports · deal-sourcing agents · diligence checklist automation · document/PDF extraction · memo & IC-deck generation · continuous-monitoring agents · anomaly explanation · multi-step research agents.

**Collaboration, Workflow & Platform** — team workspaces & sharing · deal-pipeline CRM · annotations & notes · audit trail & provenance viewer · exportable policy-safe memos · embeddable widgets/maps · public + bulk API · webhooks · data-licensing portal · marketplace listings & transactions · white-label deployments · role-based access & data-residency controls.

---

## 6. Data Strategy

Data is the company. The product is a wrapper around the graph. Strategy: lead with the cheap, legally-clean layers (open cadastres, satellite, economic) to make every market useful at tier C immediately; layer expensive proprietary depth (broker feeds, premium registries) only where revenue justifies it; and let the marketplace and usage generate proprietary exhaust no competitor can buy.

| Source | Acquisition strategy | Licensing challenge | Cost | Scalability |
|---|---|---|---|---|
| Government cadastral / registry | Direct agreements, open-data portals, FOI; gov-partnership deals that trade analytics for access | High & per-jurisdiction; redistribution and personal-data limits vary wildly | Low–High (often free data, high integration cost) | Hard (bespoke per country) but compounding |
| MLS / listing systems | Partnerships, syndication deals, licensed feeds | Restrictive US MLS rules; display & retention limits | Medium–High | Medium (fragmented by region) |
| Broker / agent feeds | Two-sided: give brokers free tools, get verified listings back | Exclusivity, data ownership disputes | Low (incentive-based) | High once flywheel turns |
| Satellite imagery | Commercial (Planet, Maxar, Airbus) + open (Sentinel, Landsat) | Commercial redistribution limits; resolution vs cost trade | Medium–High | Very high (global, uniform) |
| Drone / aerial | Partner networks; on-demand for high-value parcels | Airspace regulation; coverage gaps | High per area | Low (targeted only) |
| Economic & demographic | Open gov stats, World Bank/IMF, commercial enrichment | Mostly open; some commercial gating | Low | Very high |
| Infrastructure pipeline | Agency scraping, procurement portals, partnerships | Unstructured, multi-source | Medium | Medium (improves with NLP) |
| Climate & hazard models | Open climate models + commercial risk vendors | Commercial model licensing | Medium–High | Very high (global models) |
| Transaction / deeds | Registry ingestion + Globe's own marketplace exhaust | Price often omitted; lag | Medium | Improves as marketplace grows |
| Ownership / corporate registries | Corporate-registry APIs, beneficial-owner datasets | Privacy law (GDPR etc.), redaction duties | Medium | Medium |

**Provenance is non-negotiable.** Every observable object carries `source`, `observed_at`, `ingested_at`, `transform_version`, `confidence`, and a `legal_display_policy`. This is already encoded in Globe's domain types and schema. It is what lets Globe sell to regulated buyers (banks, insurers, governments) who cannot use un-sourced data — and what lets Globe show the whole globe honestly via coverage tiers A (parcel-grade), B (aggregate/market-grade), C (contextual) instead of faking parcel coverage everywhere.

---

## 7. AI Strategy

AI is the margin and the moat, not the product veneer. The sequence: deterministic, explainable models where money and liability are involved (valuation, risk), then probabilistic detection (satellite), then generative/agentic layers (copilot) on top of a trustworthy graph. Every model is provenance-aware and human-supervised where stakes are high.

| Model | Purpose | Training data | Feedback loop | Human review |
|---|---|---|---|---|
| AVM (automated valuation) | Price any parcel with confidence interval | Closed comps, listings, parcel attributes, spatial features | Realized sale vs prediction error retrains weekly | Appraiser override on high-value/low-confidence |
| Parcel-ranking / scoring | Rank opportunities to user thesis | User saves, clicks, watchlist, deal outcomes | Implicit + explicit feedback reweights features | Spot-checks for bias/quality |
| Recommendation engine | Surface similar & off-market deals | Behavioral graph + parcel embeddings | Click/convert signals; A/B tests | Editorial guardrails |
| Market forecasting | Predict price/absorption/cycle phase | Time-series of prices, supply, macro, infra | Backtest + rolling realized error | Economist review of regime shifts |
| Development feasibility | Highest-best-use & buildable yield | Zoning envelopes, costs, comps, permit outcomes | Permit/approval outcomes vs predicted | Land-use expert validation |
| Infrastructure-impact | Predict value uplift from projects | Historical project→price-change pairs | Post-completion price realization | Planner review |
| Zoning-interpretation LLM | Ordinance text → structured envelope | Municipal codes + expert-labeled extractions | Corrections feed fine-tuning; citations required | Mandatory local-expert sign-off per market |
| Satellite detection (CV) | Construction / land-use / encroachment | Labeled imagery, change pairs | Confirmed events relabel; active learning | Analyst verification of flags |
| Conversational copilot | NL Q&A, reports, deal-sourcing agents | Globe graph (RAG) + tool use; not trained on private data | Thumbs + outcome tracking; eval suite | Citations to source; no un-provenanced claims |

**Operating principles.** (1) Confidence over coverage — never emit an unqualified number; every output carries an interval and a provenance trail. (2) Humans-in-the-loop where liability lives (valuation, zoning, government). (3) Closed feedback loops — Globe's marketplace and user actions generate proprietary labels (realized prices, deal outcomes) that competitors cannot buy, so models compound. (4) Retrieval over recall — the copilot answers from the graph, never hallucinates parcels.

---

## 8. Technical Architecture

The architecture is designed to scale along three axes that move independently: **read traffic** (map tiles, searches), **write/ingest volume** (data pipelines), and **inference load** (AVM, CV, copilot). The current monorepo (typed API, PostGIS schema, Python services) is the seed of the 1M-user shape.

### Stage 1 — ~1M users
- **Data:** Single-primary PostgreSQL + PostGIS, read replicas; Redis cache.
- **GIS:** Pre-rendered vector tiles from CDN; PostGIS for spatial queries.
- **Search:** OpenSearch/Elastic for parcel/market text + geo filters.
- **AI:** Batch AVM precompute; a couple of GPU workers for on-demand.
- **Events/streaming:** A queue (SQS/Kafka-lite) for ingestion + async writes (fixes today's blocking `writeFileSync`).
- **Deploy:** Containers on App Runner/ECS, single region + CDN, IaC.
- **Security:** Argon2id/bcrypt passwords, enforced `APP_AUTH_TOKEN_SECRET`, per-route rate limits, durable Postgres stores (not `/tmp`), policy-enforced exports.

### Stage 2 — ~10M users
- **Data:** Partitioned/sharded Postgres by region; lakehouse (S3 + Iceberg/Delta) for analytics; CDC into the lake.
- **GIS:** Tile-generation pipeline, multi-zoom, on-the-fly vector tiles for dynamic layers.
- **Search:** Sharded search cluster + vector index for similarity/embeddings.
- **AI:** Feature store, model registry, scheduled retraining, autoscaling inference; streaming CV on satellite cadence.
- **Events/streaming:** Kafka backbone; stream processors for alerts and change detection.
- **Deploy:** Multi-region read, active-passive write; per-service autoscaling; service mesh.
- **Security:** Per-tenant isolation, data-residency tagging, full audit/lineage, SSO/SAML, SOC 2.

### Stage 3 — ~100M users / planetary
- **Data:** Multi-region active-active with data-residency partitions; planetary graph store (graph DB + geospatial index, H3 global grid); lakehouse as canonical analytical truth.
- **GIS:** Global distributed tile mesh; on-demand planetary raster/vector compute (Earth-Engine-class).
- **Search:** Federated search + vector + graph traversal at global scale.
- **AI:** Continuous training, streaming inference at the edge, agent-orchestration fleet, eval/guardrail platform.
- **Events/streaming:** Global event mesh ingesting satellite, sensor, permit, and market streams in near-real-time.
- **Deploy:** Edge presence per macro-region, sovereign/government isolated deployments, clean-rooms for partner data.
- **Security:** Per-jurisdiction compliance, confidential compute for sensitive cadastral data, zero-trust, key-per-tenant.

### Request flow (read path)
```
Client (3D globe / API)
        │
   CDN / Edge  ──► cached tiles & static
        │
   API gateway (authn, rate-limit, routing)
        │
   ┌────┴───────────────┬───────────────┐
 Search             Spatial/parcel     Inference
 (OpenSearch +      service            (AVM / risk /
  vector)          (PostGIS / graph)    copilot RAG)
        │                │                  │
        └──────►  Cache (Redis) ◄───────────┘
                         │
            Postgres (canonical) + Lakehouse (analytics)
                         ▲
            Ingestion & streaming (Kafka, CV/NLP workers)
                from registries, satellite, brokers, infra
```

**Guardrail (from `AGENTS.md`):** Postgres/PostGIS remains canonical truth; every derived index, tile set, search, and embedding must be reproducible from it. No derived store is allowed to become an un-rebuildable source of truth.

---

## 9. Business Model

Land-data economics are exceptional: ~80%+ gross margins once the graph exists (marginal cost of a query ≈ 0), strong workflow lock-in (the terminal becomes the analyst's desk), and terminal-style pricing power. The model is a classic land-and-expand: self-serve Pro funds awareness and feeds data; enterprise and government carry the ARR; data licensing and marketplace take-rate are the high-margin upside.

### Pricing tiers

| Tier | Who | Key features | Limits | Price |
|---|---|---|---|---|
| Free | Explorers, students, top-of-funnel | Globe view, basic market/parcel browse, limited comps | View-only, capped lookups, no export/API | $0 |
| Pro | Individual investors, brokers, small developers | Screeners, alerts, watchlists, valuations, policy-safe memo export | Single seat, fair-use API, 1 region depth | $99–199 / mo |
| Team | Funds, dev shops, advisory teams | Shared workspaces, pipeline CRM, multi-seat, deeper comps, dashboards | Seat-based, metered API, multi-region | $1–3K / seat / mo |
| Enterprise | REITs, banks, insurers, institutions | SSO, full API, portfolio monitoring, custom layers, SLAs, solutions eng. | Negotiated volume, data-residency | $100K–2M / yr |
| Government / Sovereign | Land agencies, planners, sovereign funds | Cadastral analytics console, tax-gap & vacancy, isolated deployment, provenance audit | Contract scope, on-prem/region options | $250K–5M / yr |

### Revenue build (illustrative ARR mix at scale, $M)

| Line | 2029 | 2032 | 2036 |
|---|--:|--:|--:|
| Self-serve (Pro/Team) | 3 | 18 | 70 |
| Enterprise seats | 2 | 32 | 230 |
| Data licensing / API | 1 | 12 | 110 |
| Marketplace take-rate | 0 | 5 | 70 |
| Government / sovereign | 0 | 3 | 40 |
| **Total ARR** | **6** | **70** | **520** |

### Unit economics (modeled, at scale)

| Metric | Self-serve | Enterprise | Government |
|---|---|---|---|
| Gross margin | ~85% | ~80% | ~70% (more services) |
| CAC | $300–1.5K | $30–120K | $150K+ (long cycle) |
| Payback | 3–9 mo | 9–18 mo | 18–36 mo |
| Net revenue retention | 105–115% | 120–140% | 110%+ |
| LTV : CAC target | >4:1 | >5:1 | >3:1 |

Pricing power is the long game: Bloomberg has raised seat prices ~4%/yr for three decades because the terminal is irreplaceable in the workflow. Globe's equivalent lock-in is the analyst's pipeline, saved theses, and the provenance audit trail regulated buyers depend on.

---

## 10. Competitive Analysis

No incumbent is "global land." Each is strong in one geography or one asset slice; Globe's whitespace is the **global, land-first, provenance-native** intersection none of them occupy. Globe should expect to partner with several (data exchange) before competing head-on.

| Competitor | Strengths | Weaknesses | Position | How Globe wins |
|---|---|---|---|---|
| CoStar | Dominant US CRE data; deep moats; $30B+ cap | US-centric; buildings not land; expensive; legacy UX | CRE data leader | Go global + land-first + modern, provenance-native UX |
| LoopNet (CoStar) | Largest CRE listings marketplace (US) | Listings only; US; no intelligence | CRE marketplace | Pair global discovery with valuation + risk, not just listings |
| Reonomy (Altus) | US property ownership/skip-tracing | US-only; ownership-centric; thin analytics | Ownership data | Global ownership graph + valuation + dev intelligence |
| Zillow | Consumer brand; Zestimate; huge traffic | US residential homes; not land/CRE/global | Consumer residential | Professional land/CRE + global + provenance for institutions |
| LandWatch / Land.com | Largest US rural-land listings | US; listings only; weak data/analytics | Rural-land listings | Global parcels + valuation + risk over raw listings |
| Bloomberg Terminal | Gold-standard financial data; pricing power | Almost no land/parcel data | Financial terminal | Be "Bloomberg for land" — the missing physical-asset terminal |
| ICE / Black Knight | US mortgage & property data scale | US mortgage-centric; not global land intel | Mortgage data | Forward-looking valuation + global collateral, not back-office |
| Esri (ArcGIS) | GIS standard; vast capability | Toolkit not answers; needs experts; not a data product | GIS platform | Pre-assembled land graph + answers, not a build-it-yourself toolkit |
| Google Earth / Maps | Best imagery & basemap; ubiquitous | No land economics/ownership/valuation | Geospatial consumer | Add the economic & ownership layer Google never will |
| Placer.ai | Foot-traffic/location analytics; clean API | Footfall niche; not land/ownership/valuation | Location analytics | Broader land graph; complementary signal, broader buyer |
| LandGate | US land/energy/resource value data | US; energy niche | Land-resource data | Global coverage + full asset classes beyond energy |

> **Scenario — "What if CoStar goes global?"** Their structural constraints make a fast pivot unlikely: their data model is building/lease-centric (not parcel/land), their moat is US-relationship-bound, and their pricing/UX are enterprise-legacy. Replicating Globe means rebuilding around parcels, provenance, and coverage tiers — a from-scratch effort that competes with their own cash-cow. The more likely path is acquisition interest, which validates the category. Globe's defense is to be multi-market and provenance-native *before* anyone notices the category is contestable.

---

## 11. Moats & Defensibility

Globe's defensibility is a **layered compounding system** — no single moat, but a stack where each layer makes the next harder to attack.

| Moat | Mechanism | Why it compounds |
|---|---|---|
| Data graph | Every integrated registry/feed adds parcels, comps, ownership | Coverage breadth × depth becomes prohibitively expensive to replicate |
| Provenance & trust | Source/freshness/confidence/legal-policy on every datum | Regulated buyers (banks, insurers, gov) can only use provenanced data — switching means re-auditing |
| Two-sided marketplace | Brokers get free tools → give verified listings → attract buyers | Classic network effect; liquidity begets liquidity |
| AI feedback loops | Realized prices & deal outcomes label models others can't buy | Prediction accuracy gap widens with usage |
| Workflow lock-in | Pipelines, theses, saved searches, audit trails live in Globe | High switching cost; terminal becomes the desk |
| Geographic coverage | Multi-market architecture (tiers A/B/C) from day one | Single-market incumbents must rebuild to follow |
| Government relationships | Cadastral partnerships + sovereign deployments | Exclusive data access + multi-year contracts + trust |

**Why Globe becomes hard to compete against:** a new entrant must simultaneously (1) acquire global data (years + capital + legal work per country), (2) earn regulated-buyer trust via provenance (can't be shortcut), (3) bootstrap marketplace liquidity (chicken-and-egg), and (4) accumulate the proprietary outcome labels that sharpen the AI (only earned through usage over time). Any one is hard; all four together, multi-market, is a decade-scale undertaking — which is the definition of a durable moat.

---

## 12. Globe in 2036 — The 10-Year Blueprint

| 2036 metric | Target |
|---|---|
| ARR (base case) | ~$520M |
| Countries with coverage | 60+ (tiers A/B/C) |
| Parcels in the graph | 1B+ |
| Paying accounts | 50K+ self-serve, 1,500+ enterprise, 40+ government |
| Marketplace GMV | $10B+ annual |

**Product suite.** A unified land-intelligence platform with five surfaces: the **Terminal** (professional workspace), the **API/Data utility** (the canonical land graph for the industry), the **Marketplace** (verified global listings + transaction infrastructure), the **Risk & Valuation engines** (embedded in bank/insurer workflows), and the **Agent network** (autonomous monitoring and deal-sourcing).

**Customer base.** Land investors and developers form the broad base; banks, insurers, REITs, and funds form the enterprise core; land agencies and sovereign funds form the strategic crown. Globe is embedded in underwriting at major lenders, exposure monitoring at insurers, and land-administration modernization at multiple governments.

**Revenue mix (2036).** Enterprise seats ~44%, data licensing/API ~21%, self-serve ~14%, marketplace take-rate ~13%, government ~8% — diversified across motions so no single channel dominates risk.

**Global footprint.** Edge presence per macro-region, sovereign isolated deployments where required, regional GMs and data-partnership teams, and clean-room arrangements with national registries.

**AI capabilities.** Continuously-trained valuation and risk models with industry-leading accuracy (sharpened by proprietary realized-outcome labels), planetary CV detecting change as it happens, and agentic copilots that run standing land theses across dozens of countries — all provenance-grounded and human-supervised where liability lives.

**Strategic acquisitions (illustrative).** A regional cadastral-data specialist (depth in a hard market), a climate-risk modeling team (vertical risk IP), a satellite-CV startup (detection talent), and a vertical workflow tool (e.g. development feasibility) to deepen lock-in.

**New business lines.** Land-backed lending/insurance data products, a developer feasibility marketplace, carbon/natural-capital land assessment, and an index/benchmark business (Globe Land Indices) licensed to funds — the "S&P for land."

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Data-licensing friction | High | Lead with open + satellite layers (every market useful at tier C without licenses); pursue gov partnerships that trade analytics for access; diversify so no single feed is load-bearing |
| Regulatory / privacy (ownership data) | High | Provenance + legal-display-policy enforced in schema; per-jurisdiction redaction; privacy-by-design; legal review before each market go-live |
| Capital intensity of data acquisition | High | Sequence markets by revenue; coverage tiers avoid boiling the ocean; marketplace exhaust + gov deals subsidize acquisition |
| Valuation accuracy & liability | High | Confidence intervals on every output; human-in-the-loop for high-value/regulated use; clear "estimate vs verified" separation; never emit unqualified numbers |
| Incumbent response (CoStar/Esri) | Medium | Move multi-market + provenance-native before the category is noticed; partner where possible; out-modernize on UX/API |
| Marketplace cold-start | Medium | Bootstrap supply by giving brokers free tools first; seed launch markets densely before expanding |
| Execution / scope (global is huge) | Medium | Architecture already enforces incremental rollout; resist single-market hardcoding; ship one market truly well before scaling |
| Security & data-durability debt (today) | High (now) | Close the known critical issues before real users: password hashing (Argon2id/bcrypt), enforced auth-token secret, durable Postgres stores (not `/tmp`), export legal-policy enforcement, user-login rate limiting |
| Talent (rare GIS + ML + RE blend) | Medium | Acqui-hire specialist teams; build applied-research org; partner with academic GIS labs |

---

*This document consolidates the two Globe future-state strategy canvases into a single report. Figures are illustrative founder/VC-grade projections for planning and fundraising, not current platform metrics. The platform today is an early prototype on seeded data; the strategy above describes the 5–10 year path from that prototype to a global land-intelligence company.*





