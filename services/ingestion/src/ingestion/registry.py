"""Source registry and licensing catalog (machine-enforced).

Every ingestible source is declared here with its license, required
attribution, expected cadence, and fallback chain. Nothing may be ingested
or displayed without a registry entry — this is the enforcement point the
master plan calls the "source registry and licensing catalog".

Fallback resolution walks a source's chain and returns the first entry that
(a) has an implemented connector and (b) is healthy per recorded job state.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from .models import CoverageTier, FreshnessTier
from .storage import ArtifactStore


@dataclass(slots=True, frozen=True)
class License:
    name: str
    url: str
    attribution: str
    commercial_use: bool
    notes: str = ""


@dataclass(slots=True, frozen=True)
class SourceDefinition:
    code: str
    name: str
    country_code: str
    market_code: str
    kind: str  # "transactions" | "benchmark" | "listings" | "value_zones"
    cadence: FreshnessTier
    max_lag_days: int  # staleness threshold before fallback kicks in
    coverage_tier: CoverageTier
    license: License
    connector_implemented: bool
    fallback_chain: tuple[str, ...] = field(default_factory=tuple)
    requires_env: tuple[str, ...] = field(default_factory=tuple)
    notes: str = ""


_OGL = License(
    name="Open Government Licence v3.0",
    url="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    attribution=(
        "Contains HM Land Registry data © Crown copyright and database right 2021. "
        "This data is licensed under the Open Government Licence v3.0."
    ),
    commercial_use=True,
    notes="Address data reuse beyond property-price display requires Royal Mail permission.",
)

_KOGL = License(
    name="Korea Open Government License (data.go.kr terms)",
    url="https://www.data.go.kr",
    attribution="Source: Ministry of Land, Infrastructure and Transport (MOLIT), via data.go.kr",
    commercial_use=True,
    notes="Free API key required; auto-approved. Per-key daily traffic quotas apply.",
)

_BIS = License(
    name="BIS terms of use (free statistics)",
    url="https://www.bis.org/terms_conditions.htm",
    attribution="Source: BIS residential property price statistics",
    commercial_use=True,
)

_FR_LO2 = License(
    name="Licence Ouverte / Open Licence 2.0 (Etalab)",
    url="https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
    attribution="Source: DGFiP, Demandes de valeurs foncières (DVF), via data.gouv.fr",
    commercial_use=True,
)

_IE_PSRA = License(
    name="PSRA Residential Property Price Register re-use terms",
    url="https://www.propertypriceregister.ie",
    attribution="Source: Property Services Regulatory Authority (PSRA), Residential Property Price Register",
    commercial_use=True,
    notes="Declarations-based; PSRA disclaims accuracy. Attribution required on re-publication.",
)

_TW_OGDL = License(
    name="Taiwan Open Government Data License v1.0",
    url="https://data.gov.tw/en/license",
    attribution="Source: Ministry of the Interior (Taiwan), Actual Price Registration of Real Estate",
    commercial_use=True,
)

_SG_ODL = License(
    name="Singapore Open Data Licence v1.0",
    url="https://data.gov.sg/open-data-licence",
    attribution="Source: Housing & Development Board / data.gov.sg",
    commercial_use=True,
)

_AU_NSW = License(
    name="NSW Valuer General Property Sales Information terms",
    url="https://valuation.property.nsw.gov.au",
    attribution="Source: NSW Valuer General, Property Sales Information",
    commercial_use=True,
)

_US_OPEN = License(
    name="US public records / open data terms (per publisher)",
    url="https://www.usa.gov/government-works",
    attribution="Source: cited US federal/state/city open-data publisher",
    commercial_use=True,
)

_JP_MLIT = License(
    name="Japan MLIT Real Estate Information Library terms",
    url="https://www.reinfolib.mlit.go.jp",
    attribution="Source: Ministry of Land, Infrastructure, Transport and Tourism (Japan)",
    commercial_use=True,
    notes="Free API key required (Ocp-Apim-Subscription-Key).",
)

_AE_DLD = License(
    name="Dubai Pulse open data terms (DLD)",
    url="https://www.dubaipulse.gov.ae",
    attribution="Source: Dubai Land Department, via Dubai Pulse",
    commercial_use=True,
    notes="Free account registration required for bulk CSV download.",
)

_DE_DL = License(
    name="Datenlizenz Deutschland 2.0 (NRW open geodata)",
    url="https://www.govdata.de/dl-de/zero-2-0",
    attribution="Source: Gutachterausschüsse NRW, BORIS Bodenrichtwerte, via opengeodata.nrw.de",
    commercial_use=True,
)

_IT_AE = License(
    name="Agenzia delle Entrate OMI re-use terms",
    url="https://www.agenziaentrate.gov.it",
    attribution="Source: Agenzia delle Entrate, Osservatorio del Mercato Immobiliare (OMI)",
    commercial_use=True,
    notes="Free registration required for bulk zone-value downloads.",
)

_CA_TNB = License(
    name="Teranet–National Bank HPI terms",
    url="https://housepriceindex.ca",
    attribution="Source: Teranet–National Bank House Price Index",
    commercial_use=False,
    notes="Free download; commercial redistribution requires permission.",
)

_EE_MA = License(
    name="Estonian Land Board open data terms",
    url="https://www.maaamet.ee",
    attribution="Source: Estonian Land and Spatial Development Board, transactions database",
    commercial_use=True,
)

_HK_GOV = License(
    name="Hong Kong government data terms",
    url="https://data.gov.hk/en/terms-and-conditions",
    attribution="Source: Rating and Valuation Department, HKSAR",
    commercial_use=True,
)

_JP_KSJ = License(
    name="National Land Numerical Information (CC BY 4.0 since 2019)",
    url="https://nlftp.mlit.go.jp/ksj/other/agreement.html",
    attribution="Source: MLIT, Land Price Publication (地価公示), via National Land Numerical Information",
    commercial_use=True,
)

_CH_OGD = License(
    name="Open Government Data Switzerland / cantonal terms",
    url="https://opendata.swiss/en/terms-of-use",
    attribution="Source: cantonal geodata portal (opendata.swiss)",
    commercial_use=True,
    notes="Varies slightly by canton; Bern LRW allows free download with attribution.",
)

_NL_RESTRICTED = License(
    name="WOZ — no open bulk license (lookup only)",
    url="https://data.overheid.nl/en/dataset/db72c52d-f3c8-4f2d-80fe-34268d9ddcf0",
    attribution="Source: Kadaster WOZ (restricted — wozwaardeloket.nl for lookup)",
    commercial_use=False,
    notes="Bulk WOZ requires authorized afnemer status via Kadaster; not freely redistributable.",
)

_PT_AT = License(
    name="Autoridade Tributária e Aduaneira terms",
    url="https://www.portaldasfinancas.gov.pt",
    attribution="Source: AT Portugal (simulator/reference only)",
    commercial_use=False,
    notes="No open bulk VPT dataset; simulator is per-property lookup only.",
)

_CZ_OPEN = License(
    name="Czech open data (not copyrighted)",
    url="https://data.gov.cz",
    attribution="Source: Czech Statistical Office / ČÚZK average property prices",
    commercial_use=True,
)

_NZ_LINZ = License(
    name="LINZ Data Service open licence (subset of councils)",
    url="https://data.linz.govt.nz",
    attribution="Source: Toitū Te Whenua LINZ / participating territorial authorities",
    commercial_use=True,
    notes="Full national DVR restricted; only councils that opted into open sharing.",
)

REGISTRY: dict[str, SourceDefinition] = {
    # ----- United Kingdom (England & Wales) -----------------------------
    "uk-hmlr-ppd": SourceDefinition(
        code="uk-hmlr-ppd",
        name="HM Land Registry Price Paid Data (monthly file)",
        country_code="GB",
        market_code="uk-england-wales",
        kind="transactions",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=45,  # published on the 20th working day each month
        coverage_tier=CoverageTier.TIER_B,
        license=_OGL,
        connector_implemented=True,
        fallback_chain=("uk-hmlr-hpi", "global-bis-rppi"),
        notes="All E&W residential sales lodged for registration, 1995→current.",
    ),
    "uk-hmlr-hpi": SourceDefinition(
        code="uk-hmlr-hpi",
        name="UK House Price Index (benchmark)",
        country_code="GB",
        market_code="uk-england-wales",
        kind="benchmark",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=60,
        coverage_tier=CoverageTier.TIER_A,
        license=_OGL,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
    ),
    # ----- South Korea ---------------------------------------------------
    "kr-molit-land": SourceDefinition(
        code="kr-molit-land",
        name="MOLIT land transaction actual prices (RTMS open API)",
        country_code="KR",
        market_code="kr-national",
        kind="transactions",
        cadence=FreshnessTier.DAILY,
        max_lag_days=7,
        coverage_tier=CoverageTier.TIER_B,
        license=_KOGL,
        connector_implemented=True,
        fallback_chain=("global-bis-rppi",),
        requires_env=("MOLIT_API_KEY",),
        notes="Raw land deals by district (LAWD_CD) and contract month; refreshed daily.",
    ),
    # ----- Verified, connector not yet implemented (probed 2026-06-12) ---
    "fr-dvf": SourceDefinition(
        code="fr-dvf",
        name="France DVF — all notarized sale prices (géolocalisé)",
        country_code="FR",
        market_code="fr-national",
        kind="transactions",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=240,
        coverage_tier=CoverageTier.TIER_B,
        license=_FR_LO2,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: files.data.gouv.fr/geo-dvf/latest/csv/<year>/full.csv.gz (HTTP 206, text/csv).",
    ),
    "ie-ppr": SourceDefinition(
        code="ie-ppr",
        name="Ireland Residential Property Price Register",
        country_code="IE",
        market_code="ie-national",
        kind="transactions",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=45,
        coverage_tier=CoverageTier.TIER_B,
        license=_IE_PSRA,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: PPR-ALL.zip direct download (HTTP 206, application/x-zip).",
    ),
    "tw-plvr": SourceDefinition(
        code="tw-plvr",
        name="Taiwan actual price registration (land + building, bulk CSV)",
        country_code="TW",
        market_code="tw-national",
        kind="transactions",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=45,
        coverage_tier=CoverageTier.TIER_B,
        license=_TW_OGDL,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: plvr.land.moi.gov.tw DownloadSeason zip (HTTP 200). Released 3x/month.",
    ),
    "sg-hdb-resale": SourceDefinition(
        code="sg-hdb-resale",
        name="Singapore HDB resale transactions (data.gov.sg API)",
        country_code="SG",
        market_code="sg-national",
        kind="transactions",
        cadence=FreshnessTier.DAILY,
        max_lag_days=7,
        coverage_tier=CoverageTier.TIER_B,
        license=_SG_ODL,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: datastore_search API keyless (JSON, resale_price field). URA private-market API needs free key.",
    ),
    "au-nsw-psi": SourceDefinition(
        code="au-nsw-psi",
        name="NSW Property Sales Information (weekly bulk)",
        country_code="AU",
        market_code="au-nsw",
        kind="transactions",
        cadence=FreshnessTier.WEEKLY,
        max_lag_days=14,
        coverage_tier=CoverageTier.TIER_B,
        license=_AU_NSW,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: valuergeneral.nsw.gov.au/__psi/weekly/<yyyymmdd>.zip and yearly zips (HTTP 206).",
    ),
    "jp-reinfolib": SourceDefinition(
        code="jp-reinfolib",
        name="Japan MLIT real-estate transaction prices (Reinfolib API)",
        country_code="JP",
        market_code="jp-national",
        kind="transactions",
        cadence=FreshnessTier.QUARTERLY,
        max_lag_days=120,
        coverage_tier=CoverageTier.TIER_B,
        license=_JP_MLIT,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        requires_env=("REINFOLIB_API_KEY",),
        notes="Verified: API answers (401 without key — auth wall only). Legacy webland API is retired.",
    ),
    "ae-dld-transactions": SourceDefinition(
        code="ae-dld-transactions",
        name="Dubai Land Department transactions (Dubai Pulse open data)",
        country_code="AE",
        market_code="ae-dubai",
        kind="transactions",
        cadence=FreshnessTier.DAILY,
        max_lag_days=7,
        coverage_tier=CoverageTier.TIER_B,
        license=_AE_DLD,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Portal verified (now data.dubai); bulk CSV needs a free Dubai Pulse account.",
    ),
    "us-ct-sales": SourceDefinition(
        code="us-ct-sales",
        name="Connecticut statewide real-estate sales (Socrata API)",
        country_code="US",
        market_code="us-ct",
        kind="transactions",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_US_OPEN,
        connector_implemented=False,
        fallback_chain=("us-fhfa-hpi", "global-bis-rppi"),
        notes="Verified: data.ct.gov/resource/5mzw-sjtu.json keyless (saleamount + geo point). Full refresh ~annual.",
    ),
    "us-nyc-rolling-sales": SourceDefinition(
        code="us-nyc-rolling-sales",
        name="NYC Department of Finance rolling sales",
        country_code="US",
        market_code="us-nyc",
        kind="transactions",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=45,
        coverage_tier=CoverageTier.TIER_B,
        license=_US_OPEN,
        connector_implemented=False,
        fallback_chain=("us-fhfa-hpi", "global-bis-rppi"),
        notes="Verified: nyc.gov rolling_sales XLSX per borough (HTTP 206).",
    ),
    "ee-maaamet": SourceDefinition(
        code="ee-maaamet",
        name="Estonia Land Board transactions database",
        country_code="EE",
        market_code="ee-national",
        kind="transactions",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=60,
        coverage_tier=CoverageTier.TIER_B,
        license=_EE_MA,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: query UI reachable; exports are form-driven (no stable bulk URL).",
    ),
    "de-nrw-boris": SourceDefinition(
        code="de-nrw-boris",
        name="Germany NRW BORIS official land-value zones (€/m²)",
        country_code="DE",
        market_code="de-nrw",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_DE_DL,
        connector_implemented=True,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: BRW_2025_EPSG25832_Shape.zip (HTTP 206, ~216MB). Zonal Bodenrichtwerte cover all NRW m².",
    ),
    "it-omi": SourceDefinition(
        code="it-omi",
        name="Italy OMI zone values (Agenzia delle Entrate)",
        country_code="IT",
        market_code="it-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=240,
        coverage_tier=CoverageTier.TIER_B,
        license=_IT_AE,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: portal reachable; bulk download needs free registration.",
    ),
    "us-fhfa-hpi": SourceDefinition(
        code="us-fhfa-hpi",
        name="US FHFA house price index (benchmark)",
        country_code="US",
        market_code="us-national",
        kind="benchmark",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=60,
        coverage_tier=CoverageTier.TIER_A,
        license=_US_OPEN,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: fhfa.gov hpi_master.csv (HTTP 206, text/csv).",
    ),
    "ca-teranet-hpi": SourceDefinition(
        code="ca-teranet-hpi",
        name="Canada Teranet–National Bank HPI (benchmark)",
        country_code="CA",
        market_code="ca-national",
        kind="benchmark",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=60,
        coverage_tier=CoverageTier.TIER_A,
        license=_CA_TNB,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: housepriceindex.ca House_Price_Index.csv (HTTP 206). Non-commercial license — legal review before display.",
    ),
    "hk-rvd-stats": SourceDefinition(
        code="hk-rvd-stats",
        name="Hong Kong RVD property market statistics (benchmark)",
        country_code="HK",
        market_code="hk-national",
        kind="benchmark",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=60,
        coverage_tier=CoverageTier.TIER_A,
        license=_HK_GOV,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: rvd.gov.hk stats page (HTTP 206). Aggregate indices; unit-level data is paid (EPRC).",
    ),
    # ----- Global benchmark fallback -------------------------------------
    "global-bis-rppi": SourceDefinition(
        code="global-bis-rppi",
        name="BIS residential property price index (global benchmark)",
        country_code="*",
        market_code="global",
        kind="benchmark",
        cadence=FreshnessTier.QUARTERLY,
        max_lag_days=180,
        coverage_tier=CoverageTier.TIER_A,
        license=_BIS,
        connector_implemented=True,
        fallback_chain=(),
        notes="Verified: data.bis.org WS_SPP_csv_col.zip (wide quarterly YoY % index). Terminal fallback.",
    ),
    # ----- Official value zones (researched 2026-06-16) -------------------
    "jp-mlit-koji": SourceDefinition(
        code="jp-mlit-koji",
        name="Japan MLIT official land price publication points (¥/m²)",
        country_code="JP",
        market_code="jp-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_B,
        license=_JP_KSJ,
        connector_implemented=True,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: nlftp.mlit.go.jp L01 GeoJSON in zip (Tokyo pref ~26k points). CC BY 4.0.",
    ),
    "tw-moi-land-stats": SourceDefinition(
        code="tw-moi-land-stats",
        name="Taiwan MOI county announced land value statistics",
        country_code="TW",
        market_code="tw-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=800,
        coverage_tier=CoverageTier.TIER_B,
        license=_TW_OGDL,
        connector_implemented=True,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: opdadm.moi.gov.tw county CSV (aggregate 公告地價/現值). Parcel CSV per city also exists.",
    ),
    "tw-taipei-land-price": SourceDefinition(
        code="tw-taipei-land-price",
        name="Taipei parcel announced land/current values (CSV)",
        country_code="TW",
        market_code="tw-taipei",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_C,
        license=_TW_OGDL,
        connector_implemented=True,
        fallback_chain=("tw-moi-land-stats", "global-bis-rppi"),
        notes="Verified: data.taipei resource.download?rid=7802c9b4… (BIG-5 CSV, parcel 公告現值/公告地價 per m²).",
    ),
    "de-bw-boris": SourceDefinition(
        code="de-bw-boris",
        name="Germany Baden-Württemberg BORIS-BW (portal)",
        country_code="DE",
        market_code="de-bw",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_DE_DL,
        connector_implemented=False,
        fallback_chain=("de-nrw-boris", "global-bis-rppi"),
        notes="Free online portal (gutachterausschuesse-bw.de); no stable bulk shapefile URL verified.",
    ),
    "de-by-boris": SourceDefinition(
        code="de-by-boris",
        name="Germany Bavaria Bodenrichtwerte (WMS/portal)",
        country_code="DE",
        market_code="de-by",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_DE_DL,
        connector_implemented=False,
        fallback_chain=("de-nrw-boris", "global-bis-rppi"),
        notes="bodenrichtwerte.bayern.de — mostly free viewing since 2024; bulk download via WMS not verified.",
    ),
    "de-he-boris": SourceDefinition(
        code="de-he-boris",
        name="Germany Hessen BORIS (Geoportal)",
        country_code="DE",
        market_code="de-he",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_DE_DL,
        connector_implemented=False,
        fallback_chain=("de-nrw-boris", "global-bis-rppi"),
        notes="Verified: hvbg.hessen.de geoportal (2026 values live). Map service only.",
    ),
    "de-bb-boris": SourceDefinition(
        code="de-bb-boris",
        name="Germany Brandenburg BORIS (county CSV/XML shop)",
        country_code="DE",
        market_code="de-bb",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_DE_DL,
        connector_implemented=False,
        fallback_chain=("de-nrw-boris", "global-bis-rppi"),
        notes="govdata.de: county CSV/XML via shop; full state shape on request (may incur fees).",
    ),
    "de-th-boris": SourceDefinition(
        code="de-th-boris",
        name="Germany Thüringen BORIS (WFS)",
        country_code="DE",
        market_code="de-th",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_DE_DL,
        connector_implemented=False,
        fallback_chain=("de-nrw-boris", "global-bis-rppi"),
        notes="Verified: geomis.geoportal-th.de WFS Bodenrichtwerte (dl-de/by-2-0).",
    ),
    "ch-be-lrw": SourceDefinition(
        code="ch-be-lrw",
        name="Switzerland Canton Bern Landrichtwerte (CHF/m²)",
        country_code="CH",
        market_code="ch-be",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_CH_OGD,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="geo2.apps.be.ch LRW shape/geopackage (403 on anonymous API — needs geoportal download).",
    ),
    "ch-lu-landwert": SourceDefinition(
        code="ch-lu-landwert",
        name="Switzerland Canton Lucerne official land values (CHF/m²)",
        country_code="CH",
        market_code="ch-lu",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=420,
        coverage_tier=CoverageTier.TIER_B,
        license=_CH_OGD,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Verified: daten.geo.lu.ch LANDWERT_DS (87k objects, CHF/m² by use type).",
    ),
    "nl-woz": SourceDefinition(
        code="nl-woz",
        name="Netherlands WOZ property values (restricted bulk)",
        country_code="NL",
        market_code="nl-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_C,
        license=_NL_RESTRICTED,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Not open data for bulk; wozwaardeloket.nl lookup only unless authorized afnemer.",
    ),
    "pt-vpt-zones": SourceDefinition(
        code="pt-vpt-zones",
        name="Portugal tax property reference values (simulator)",
        country_code="PT",
        market_code="pt-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_B,
        license=_PT_AT,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="zonamentopf.portaldasfinancas.gov.pt simulator — no open bulk zone dataset.",
    ),
    "cz-csu-avg-prices": SourceDefinition(
        code="cz-csu-avg-prices",
        name="Czech average property purchase prices by district (ČSÚ/ČÚZK)",
        country_code="CZ",
        market_code="cz-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_B,
        license=_CZ_OPEN,
        connector_implemented=True,
        fallback_chain=("global-bis-rppi",),
        notes="data.gov.cz NKOD district averages — set CZ_CSU_CSV_URL to distribution CSV (catalog URL varies).",
    ),
    "nz-linz-dvr-open": SourceDefinition(
        code="nz-linz-dvr-open",
        name="New Zealand open council rating valuation roll (subset)",
        country_code="NZ",
        market_code="nz-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_B,
        license=_NZ_LINZ,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="LINZ table 114085 — only TAs that opted into open sharing; full DVR is restricted.",
    ),
    "be-fl-cadgis": SourceDefinition(
        code="be-fl-cadgis",
        name="Belgium Flanders CadGIS fiscal parcel attributes",
        country_code="BE",
        market_code="be-flanders",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=500,
        coverage_tier=CoverageTier.TIER_C,
        license=_DE_DL,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="Geopunt WFS CadGIS — cadastral income (KI) per parcel; bulk WFS, not yet wired.",
    ),
    "hk-rvd-indices": SourceDefinition(
        code="hk-rvd-indices",
        name="Hong Kong RVD private domestic price/rent indices",
        country_code="HK",
        market_code="hk-hong-kong",
        kind="value_zones",
        cadence=FreshnessTier.MONTHLY,
        max_lag_days=90,
        coverage_tier=CoverageTier.TIER_A,
        license=_HK_GOV,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="rvd.gov.hk monthly indices — tier-A macro, not parcel zones.",
    ),
    "it-omi-zones": SourceDefinition(
        code="it-omi-zones",
        name="Italy Agenzia delle Entrate OMI zone quotations",
        country_code="IT",
        market_code="it-national",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_B,
        license=_IT_AE,
        connector_implemented=False,
        fallback_chain=("global-bis-rppi",),
        notes="OMI semestral zone min/max €/m² — PDF/portal; bulk open CSV not published.",
    ),
    "tw-taichung-land-price": SourceDefinition(
        code="tw-taichung-land-price",
        name="Taichung parcel announced land values (CSV)",
        country_code="TW",
        market_code="tw-taichung",
        kind="value_zones",
        cadence=FreshnessTier.SEMIANNUAL,
        max_lag_days=400,
        coverage_tier=CoverageTier.TIER_C,
        license=_TW_OGDL,
        connector_implemented=False,
        fallback_chain=("tw-moi-land-stats", "global-bis-rppi"),
        notes="opendata.taichung.gov.tw — ~1.6M parcel rows; host intermittently reachable from CI.",
    ),
}


def get_source(code: str) -> SourceDefinition:
    try:
        return REGISTRY[code]
    except KeyError as error:
        raise KeyError(f"source {code!r} is not in the registry — register it before ingesting") from error


def _is_healthy(definition: SourceDefinition, health: dict[str, Any], now: datetime) -> bool:
    entry = health.get(definition.code)
    if not entry:
        return False
    if entry.get("status") not in ("succeeded", "skipped_unchanged"):
        return False
    finished_raw = entry.get("finished_at")
    if not finished_raw:
        return False
    finished = datetime.fromisoformat(finished_raw)
    if finished.tzinfo is None:
        finished = finished.replace(tzinfo=timezone.utc)
    return (now - finished) <= timedelta(days=definition.max_lag_days)


def resolve_active_source(code: str, store: ArtifactStore, now: datetime | None = None) -> tuple[SourceDefinition, str]:
    """Walk the fallback chain; return (definition, reason).

    Preference order: primary if healthy → first healthy fallback → primary
    (degraded) if it at least has a connector → first registered fallback.
    The caller surfaces ``reason`` so degradation is never silent.
    """
    now = now or datetime.now(timezone.utc)
    primary = get_source(code)
    health = store.read_health()

    chain = (primary, *(get_source(c) for c in primary.fallback_chain))
    for definition in chain:
        if definition.connector_implemented and _is_healthy(definition, health, now):
            reason = "primary healthy" if definition.code == code else f"fallback: {code} unhealthy or stale"
            return definition, reason

    if primary.connector_implemented:
        return primary, "degraded: no healthy source in chain; retrying primary"
    for definition in chain[1:]:
        return definition, f"degraded: {code} has no connector; using first registered fallback"
    return primary, "degraded: no fallback registered"
