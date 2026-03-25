# TODO

## Execution Order

1. ~~Restore winding warnings so the behavior and tests match again.~~
2. Fix the broken GeoJSON matcher usage in `tests/lineString.test.js`.
3. Resolve the centroid contract mismatch between implementation and tests.
4. Add raw-geometry support and decouple the public API from Turf `Feature` assumptions.
5. Catch up with upstream changes after the suite is green.

## Fix Remaining Test Failures On `temp/20250427`

- `fix_polygon` still crashes on raw Polygon geometries in tests like the antimeridian-overlap and Z-coordinate cases because it assumes `polygon.geometry.coordinates` exists.
- Centroid tests still fail because `centroid()` returns a Turf `Point` feature, while the current tests expect `.x` / `.y` fields.
- `tests/lineString.test.js` still uses `toBeCloseTo` on GeoJSON objects and needs a geometry-aware matcher.
- Keep the normalized polygon/multipolygon comparisons from this branch, but do not use them to hide real behavioral regressions.

## Decouple Public API From Turf Feature Inputs

- Public entry points should accept raw GeoJSON geometries as well as `Feature` and `FeatureCollection` inputs where appropriate.
- Add small boundary helpers such as `getGeometry(shape)` and `asFeature(shape, properties?)` so internal code does not assume `.geometry.coordinates` is always present.
- Refactor algorithm code to operate on geometry objects or coordinate arrays, only wrapping in Turf features when calling Turf helpers such as `booleanContains`, `bbox`, or `centroid`.
- Add tests that cover both raw-geometry and `Feature` inputs for the same operations.

## Catch Up With Upstream After The Suite Is Green

- Treat upstream `0.4.6` as the parity target.
- Port the `v0.4.1` `reverse` option.
- Audit and port the `v0.4.2` multiple-interiors fix.
- Review `v0.4.3` through `0.4.6` for any additional behavior changes before declaring parity complete.
