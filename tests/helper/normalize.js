/**
 * Normalize GeoJSON coordinate ordering to approximate GEOS normalize()
 *
 * This canonicalizes:
 * - line direction for LineString / MultiLineString
 * - ring start point and ring orientation for Polygon / MultiPolygon
 * - part ordering for multipart geometry objects
 * so that serialization order does not affect test results.
 *
 * @param {object} geom - A GeoJSON geometry or Feature.
 * @returns {object} A new geometry with canonicalized coordinate ordering.
 */
function normalize(geom) {
  if (geom.type === 'Feature' && geom.geometry) {
    return {
      ...geom,
      geometry: normalize(geom.geometry),
    };
  }

  if (geom.type === 'LineString') {
    return {
      type: 'LineString',
      coordinates: normalizeLine(geom.coordinates),
    };
  }

  if (geom.type === 'MultiLineString') {
    const coordinates = geom.coordinates
      .map(normalizeLine)
      .sort(compareCoordinateArrays);
    return {
      type: 'MultiLineString',
      coordinates,
    };
  }

  if (geom.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: normalizePolygonCoordinates(geom.coordinates),
    };
  }

  if (geom.type === 'MultiPolygon') {
    const coordinates = geom.coordinates
      .map(normalizePolygonCoordinates)
      .sort(comparePolygonCoordinates);
    return {
      type: 'MultiPolygon',
      coordinates,
    };
  }

  return geom;
}

// Normalize Polygon
function normalizePolygonCoordinates(coordinates) {
  if (coordinates.length === 0) {
    return coordinates;
  }

  // Normalize the shell
  const shell = normalizeRing(coordinates[0], true);

  // Normalize holes
  const holes = coordinates
    .slice(1)
    .map((ring) => normalizeRing(ring, false))
    .sort(compareCoordinateArrays);

  return [shell, ...holes];
}

// Normalize LineString
function normalizeLine(line) {
  const coords = line.map(copyCoordinate);
  if (coords.length === 0) {
    return coords;
  }

  // Normalize line direction
  if (compareCoords(coords[0], coords[coords.length - 1]) > 0) {
    coords.reverse();
  }

  return coords;
}

// Normalize a ring
function normalizeRing(ring, clockwise) {
  const coords = closeRing(ring.map(copyCoordinate));
  const openRing = coords.slice(0, -1);

  if (openRing.length === 0) {
    return coords;
  }

  // Normalize the starting point
  let minIndex = 0;
  for (let i = 1; i < openRing.length; i++) {
    if (compareCoords(openRing[i], openRing[minIndex]) < 0) {
      minIndex = i;
    }
  }

  const rotated = rotate(openRing, minIndex);
  rotated.push(copyCoordinate(rotated[0]));

  // Enforce canonical orientation as directed by the param
  // CCW for exterior rings, CW for holes
  const shouldReverse = isCCW(rotated) === clockwise;
  if (shouldReverse) {
    rotated.reverse();
  }

  return closeRing(rotated);
}

// Rotate an open coordinate sequence so the chosen index becomes the start
function rotate(coords, startIndex) {
  return coords.slice(startIndex).concat(coords.slice(0, startIndex));
}

// Ensure a ring is closed
function closeRing(ring) {
  if (ring.length === 0) {
    return ring;
  }
  if (!areCoordsEqual(ring[0], ring[ring.length - 1])) {
    return ring.concat([copyCoordinate(ring[0])]);
  }
  return ring;
}

function isCCW(ring) {
  return signedArea(ring) > 0;
}

// Shoelace signed area, positive implies counterclockwise winding
function signedArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

// Sort order for normalized polygon parts
// Used for MultiPolygon sorting
function comparePolygonCoordinates(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const cmp = compareCoordinateArrays(a[i], b[i]);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return a.length - b.length;
}

// Lexicographic comparison for arrays of coordinates
// Each array should already be normalized
function compareCoordinateArrays(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const cmp = compareCoords(a[i], b[i]);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return a.length - b.length;
}

// Lexicographic coordinate comparison
function compareCoords(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return a.length - b.length;
}

function areCoordsEqual(a, b) {
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}

function copyCoordinate(coord) {
  return coord.slice();
}

module.exports = {
  normalize,
};
