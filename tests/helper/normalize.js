/**
 * Normalize a GeoJSON Polygon or MultiPolygon by rotating each ring so that
 * the lexicographically smallest coordinate appears first. This ensures consistent ordering.
 *
 * @param {object} geom - A GeoJSON geometry or Feature with a Polygon or MultiPolygon.
 * @returns {object} A new geometry with normalized coordinate ordering.
 */
function normalize(geom) {
  // If geom is a Feature, normalize its geometry.
  if (geom.type === 'Feature' && geom.geometry) {
    return {
      ...geom,
      geometry: normalize(geom.geometry)
    };
  }

  // Normalize a Polygon geometry.
  if (geom.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geom.coordinates.map(normalizeRing)
    };
  }

  // Normalize a MultiPolygon geometry.
  if (geom.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geom.coordinates.map(polygon => polygon.map(normalizeRing))
    };
  }

  // For other types, return as is.
  return geom;
}

/**
 * Normalize a ring by ensuring it is closed and rotating its coordinates so that the
 * smallest (lexicographically) coordinate is first.
 *
 * @param {Array<Array<number>>} ring - An array of [lon, lat] coordinates.
 * @returns {Array<Array<number>>} The normalized ring.
 */
function normalizeRing(ring) {
  // Ensure the ring is closed: the first and last coordinates are identical.
  let coords = ring.slice();
  if (!areCoordsEqual(coords[0], coords[coords.length - 1])) {
    coords.push(coords[0]);
  }

  // Remove the duplicate closing coordinate for processing.
  const openRing = coords.slice(0, -1);

  // Find the index of the lexicographically smallest coordinate.
  let minIndex = 0;
  for (let i = 1; i < openRing.length; i++) {
    if (compareCoords(openRing[i], openRing[minIndex]) < 0) {
      minIndex = i;
    }
  }

  // Rotate the array so that the smallest coordinate comes first.
  const rotated = openRing.slice(minIndex).concat(openRing.slice(0, minIndex));
  // Re-close the ring.
  rotated.push(rotated[0]);
  return rotated;
}

/**
 * Compare two coordinates lexicographically.
 *
 * @param {Array<number>} a - The first coordinate.
 * @param {Array<number>} b - The second coordinate.
 * @returns {number} -1 if a < b, 1 if a > b, or 0 if equal.
 */
function compareCoords(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

/**
 * Check if two coordinates are equal.
 *
 * @param {Array<number>} a - The first coordinate.
 * @param {Array<number>} b - The second coordinate.
 * @returns {boolean} True if equal, otherwise false.
 */
function areCoordsEqual(a, b) {
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}

module.exports = {
  normalize
}
