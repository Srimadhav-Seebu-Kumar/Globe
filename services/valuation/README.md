# Valuation Service

First-pass Python service scaffold for valuation and benchmark modeling.

## Responsibilities
- Build market-level baseline land value curves from closed transactions.
- Produce parcel-level `estimate` price state where coverage and policy allow.
- Attach explainability metadata (input comps, feature weights, confidence interval).
- Persist model versioning for reproducible valuations.

## Next build targets
1. Define feature-store inputs from canonical transaction/listing layers.
2. Implement confidence interval generation and fallback hierarchy.
3. Expose internal batch and on-demand valuation entry points.
