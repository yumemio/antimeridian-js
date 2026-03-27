import {expect} from '@jest/globals';

function toGeometricallyEqual(received, expected) {
  // Compare two points lexicographically.
  function comparePoints(a, b) {
    if (a[0] !== b[0]) return a[0] - b[0];
    if (a[1] !== b[1]) return a[1] - b[1];
    return 0;
  }

  // Compare two arrays of points (a ring).
  function compareRingArrays(a, b) {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const cmp = comparePoints(a[i], b[i]);
      if (cmp !== 0) return cmp;
    }
    return a.length - b.length;
  }

  // Normalize a single ring.
  function normalizeRing(ring) {
    // Remove duplicate closing coordinate if present.
    let coords = ring.slice();
    if (
      coords.length > 0 &&
      coords[0][0] === coords[coords.length - 1][0] &&
      coords[0][1] === coords[coords.length - 1][1]
    ) {
      coords = coords.slice(0, coords.length - 1);
    }
    let best = null;
    // Try all rotations, including the reversed order.
    for (let i = 0; i < coords.length; i++) {
      const direct = coords.slice(i).concat(coords.slice(0, i));
      const reversed = [...direct].reverse();
      if (best === null || compareRingArrays(direct, best) < 0) {
        best = direct;
      }
      if (compareRingArrays(reversed, best) < 0) {
        best = reversed;
      }
    }
    // Close the ring by appending the first coordinate.
    return best.concat([best[0]]);
  }

  // Normalize an array of rings (i.e. the coordinates for a Polygon).
  function normalizePolygonCoordinates(coordinates) {
    const normalizedRings = coordinates.map(normalizeRing);
    // Sort the rings to remove ordering differences.
    normalizedRings.sort(compareRingArrays);
    return normalizedRings;
  }

  // Normalize the entire geometry. Currently supports Polygon and MultiPolygon.
  function normalizeGeometry(geometry) {
    if (geometry.type === "Polygon") {
      return {
        type: geometry.type,
        coordinates: normalizePolygonCoordinates(geometry.coordinates),
      };
    } else if (geometry.type === "MultiPolygon") {
      const normalized = geometry.coordinates.map(normalizePolygonCoordinates);
      // Sort the polygons.
      normalized.sort((a, b) => {
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
          const cmp = compareRingArrays(a[i], b[i]);
          if (cmp !== 0) return cmp;
        }
        return a.length - b.length;
      });
      return {
        type: geometry.type,
        coordinates: normalized,
      };
    }
    // Fallback: return the geometry as is.
    return geometry;
  }

  const normReceived = normalizeGeometry(received);
  const normExpected = normalizeGeometry(expected);
  const pass = this.equals(normReceived, normExpected);
  if (pass) {
    return {
      message: () =>
        `expected geometries not to be equal, but they are equal when normalized`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected geometries to be equal after normalization.\n\nNormalized Received:\n${JSON.stringify(
          normReceived,
          null,
          2
        )}\n\nNormalized Expected:\n${JSON.stringify(normExpected, null, 2)}`,
      pass: false,
    };
  }
};

expect.extend({
  toGeometricallyEqual
});
