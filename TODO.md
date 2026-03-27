# TODO

## Test Suite Status

- `npm test -- --runInBand` is green on `temp/20250427`.
- Keep the normalized polygon/multipolygon comparisons from this branch, but do not use them to hide real behavioral regressions.

## 1. Stabilize The Public API

### Completed

- ~~Restore winding warnings so the behavior and tests match again.~~
- ~~Fix the broken GeoJSON matcher usage in `tests/lineString.test.js`.~~
- ~~Add the minimal raw-geometry boundary support needed to eliminate adapter failures from the test suite.~~
- ~~Resolve remaining implementation mismatches once the suite only reflects real geometry behavior.~~

### Next

- Align public function comments/signatures with the current implementation.
- Rename `fix_multipolygon` to upstream-compatible `fix_multi_polygon`.
- Privatize helpers that are not part of the upstream public API.
- Remove placeholder exports such as `helloWorld`.

## 2. Decouple Internal Code From Turf Feature Inputs

- Add small boundary helpers such as `getGeometry(shape)` and a shared helper for returning geometry vs `Feature`, so internal code does not repeat ad hoc shape handling.
- Refactor algorithm code to operate on geometry objects or coordinate arrays, only wrapping in Turf features when calling Turf helpers such as `booleanContains`, `bbox`, or `centerOfMass`.
- Standardize helper APIs like `bbox`, `centroid`, and `is_coincident_to_antimeridian` so they accept the same input shapes where appropriate.

## 3. Strengthen API Coverage

- Add tests that cover both raw-geometry and `Feature` inputs for the same operations across the public API.
- Keep the normalized polygon/multipolygon comparisons from this branch, but do not use them to hide real behavioral regressions.

## 4. Consider A TypeScript Migration

- Revisit a TypeScript migration after the public API surface and boundary helpers are stable.
- Use TypeScript to model `Geometry` vs `Feature` vs `FeatureCollection` contracts explicitly, instead of mixing the migration into the current API-shaping work.

## 5. Catch Up With Upstream

- Treat upstream `0.4.6` as the parity target.
- Port the `v0.4.1` `reverse` option.
- Audit and port the `v0.4.2` multiple-interiors fix.
- Review `v0.4.3` through `0.4.6` for any additional behavior changes before declaring parity complete.
