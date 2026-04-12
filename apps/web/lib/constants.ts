// Shared numeric constants — named replacements for magic numbers
// referenced throughout the web app.

// ── Unit conversions ──────────────────────────────────────────────────────────
/** Square meters → square feet (1 m² = 10.7639 ft²). */
export const SQM_TO_SQFT = 10.7639;

// ── Grid blending / market influence (globe-canvas physics) ───────────────────
/** Baseline blend radius in kilometres at mid zoom — used by getBlendRadiusKm. */
export const GRID_BLEND_BASE_KM = 160;
/** Fractional falloff applied to grid blending outside the base radius. */
export const GRID_BLEND_FALLOFF = 0.15;
/** Maximum influence radius for a market center, in kilometres. */
export const MARKET_INFLUENCE_RADIUS_KM = 2200;
/** Base weight assigned to the nearest market when blending grid rates. */
export const MARKET_WEIGHT_BASE = 0.6;
/** Exponent controlling the decay of market influence with distance. */
export const GRID_DECAY_EXPONENT = 8.5;

// ── Zoom clamps (Esri World Imagery native max is 19) ─────────────────────────
/** Minimum map zoom used by grid step / blend calculations. */
export const GRID_MIN_ZOOM = 1;
/** Maximum map zoom honoured by grid step / blend calculations. */
export const GRID_MAX_ZOOM = 19;
