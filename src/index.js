/**
 * Implementation module for the antimeridian package (JavaScript port).
 * This is a private module – downstream users should use the public API.
 *
 * Note: This skeleton uses Turf.js for geometry calculations.
 */

import * as turf from '@turf/turf';

/**
 * Test function - to be removed
 */
export function helloWorld() {
  return "Hello from my-npm-package!";
}

/**
 * Base class for all package-specific warnings.
 */
export class AntimeridianWarning extends Error {
  constructor(message) {
    super(message);
    this.name = 'AntimeridianWarning';
  }
}

/**
 * Warning for fixing winding order.
 */
export class FixWindingWarning extends AntimeridianWarning {
  static MESSAGE =
    'The exterior ring of this shape is wound clockwise. Since this is a common error in real-world geometries, this package is reversing the exterior coordinates of the input shape before running its algorithm. If you know that your input shape is correct (i.e. if your data encompasses both poles), pass fix_winding=false.';

  static warn() {
    console.warn(FixWindingWarning.MESSAGE);
  }
}

/**
 * Fixes a GeoJSON object that crosses the antimeridian.
 *
 * @param {Object} geojson - A GeoJSON object.
 * @param {Object} [options] - Options.
 * @param {boolean} [options.force_north_pole=false] - Force the joined segments to enclose the north pole.
 * @param {boolean} [options.force_south_pole=false] - Force the joined segments to enclose the south pole.
 * @param {boolean} [options.fix_winding=true] - Reverse the coordinates if wound clockwise.
 * @param {boolean} [options.great_circle=true] - Compute meridian crossings on the sphere.
 * @returns {Object} The fixed GeoJSON.
 */
export function fix_geojson(
  geojson,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  // TODO: Implement using Turf.js
  return geojson;
}

/**
 * Segments a GeoJSON object into a MultiLineString.
 *
 * @param {Object} geojson - A GeoJSON object.
 * @param {boolean} great_circle - Use great circle calculations.
 * @returns {Object} A MultiLineString of segments.
 */
export function segment_geojson(geojson, great_circle) {
  // TODO: Implement using Turf.js
  return null;
}

/**
 * Fixes a shape that crosses the antimeridian.
 *
 * @param {Object} shape - A GeoJSON geometry or an object with a __geo_interface__.
 * @param {Object} [options] - Options.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Object} The fixed shape.
 */
export function fix_shape(
  shape,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  // TODO: Implement using Turf.js
  return null;
}

/**
 * Segments a shape into a list of line segments.
 *
 * @param {Object} shape - A GeoJSON geometry or an object with a __geo_interface__.
 * @param {boolean} great_circle - Use great circle calculations.
 * @returns {Array} List of segments.
 */
export function segment_shape(shape, great_circle) {
  // TODO: Implement using Turf.js
  return [];
}

/**
 * Fixes a MultiPolygon.
 *
 * @param {Object} multiPolygon - A GeoJSON MultiPolygon.
 * @param {Object} [options] - Options.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Object} The fixed MultiPolygon.
 */
export function fix_multi_polygon(
  multiPolygon,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  // TODO: Implement using Turf.js
  return null;
}

/**
 * Fixes a Polygon.
 *
 * @param {Object} polygon - A GeoJSON Polygon.
 * @param {Object} [options] - Options.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Object} The fixed Polygon (or MultiPolygon if split).
 */
export function fix_polygon(
  polygon,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  // TODO: Implement using Turf.js
  return null;
}

/**
 * Fixes a LineString.
 *
 * @param {Object} lineString - A GeoJSON LineString.
 * @param {boolean} great_circle - Use great circle calculations.
 * @returns {Object} The fixed LineString (or MultiLineString if split).
 */
export function fix_line_string(lineString, great_circle) {
  // TODO: Implement using Turf.js
  return null;
}

/**
 * Fixes a MultiLineString.
 *
 * @param {Object} multiLineString - A GeoJSON MultiLineString.
 * @param {boolean} great_circle - Use great circle calculations.
 * @returns {Object} The fixed MultiLineString.
 */
export function fix_multi_line_string(multiLineString, great_circle) {
  // TODO: Implement using Turf.js
  return null;
}

/**
 * Segments a Polygon.
 *
 * @param {Object} polygon - A GeoJSON Polygon.
 * @param {boolean} great_circle - Use great circle calculations.
 * @returns {Array} List of segments.
 */
export function segment_polygon(polygon, great_circle) {
  // TODO: Implement using Turf.js
  return [];
}

/**
 * Fixes a Polygon into a list of Polygons.
 *
 * @param {Object} polygon - A GeoJSON Polygon.
 * @param {Object} options - Options including force_north_pole, force_south_pole, fix_winding, and great_circle.
 * @returns {Array} List of fixed Polygons.
 */
export function fix_polygon_to_list(
  polygon,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  // TODO: Implement using Turf.js
  return [];
}

/**
 * Normalizes an array of coordinates.
 *
 * Ensures that all longitudes are within [-180, 180] (with special handling
 * for values extremely close to ±180) and preserves extra dimensions.
 *
 * @param {Array.<[number, number, ...number]>} coords - Array of coordinates.
 * @returns {Array.<[number, number, ...number]>} Normalized coordinates.
 */
export function normalize(coords) {
  const original = coords.slice();
  let allAreOnAntimeridian = true;
  const normalized = [];

  for (let i = 0; i < coords.length; i++) {
    const point = coords[i];
    let newPoint;

    if (isClose(point[0], 180)) {
      const prevIndex = (i - 1 + coords.length) % coords.length;

      if (Math.abs(point[1]) !== 90 && isClose(coords[prevIndex][0], -180)) {
        newPoint = [-180, point[1]];
      } else {
        newPoint = [180, point[1]];
      }

    } else if (isClose(point[0], -180)) {
      const prevIndex = (i - 1 + coords.length) % coords.length;
      if (Math.abs(point[1]) !== 90 && isClose(coords[prevIndex][0], 180)) {
        newPoint = [180, point[1]];
      } else {
        newPoint = [-180, point[1]];
      }

    } else {
      // Normalize longitude into [-180, 180]
      const lon = point[0];
      const normalizedLon = (((lon + 180) % 360) + 360) % 360 - 180;
      newPoint = [normalizedLon, point[1]];
      allAreOnAntimeridian = false;
    }

    if (point.length > 2) {
      newPoint = newPoint.concat(point.slice(2));
    }

    normalized.push(newPoint);
  }
  return allAreOnAntimeridian ? original : normalized;
}

/**
 * Segments a list of coordinates into multiple segments at antimeridian crossings.
 *
 * Iterates over consecutive coordinate pairs. When a crossing is detected (based on the
 * difference in longitudes), the function calculates the crossing latitude and splits the
 * segment accordingly.
 *
 * @param {Array.<[number, number]>} coords - Array of coordinates.
 * @param {boolean} great_circle - Whether to use the great circle calculation.
 * @returns {Array.<Array.<[number, number]>>} An array of segmented coordinate arrays.
 */
export function segment(coords, great_circle) {
  let seg = [];
  const segments = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    seg.push(start);

    if ((end[0] - start[0] > 180) && ((end[0] - start[0]) !== 360)) {
      const lat = crossing_latitude(start, end, great_circle);
      seg.push([-180, lat]);
      segments.push(seg);
      seg = [[180, lat]];

    } else if ((start[0] - end[0] > 180) && ((start[0] - end[0]) !== 360)) {
      const lat = crossing_latitude(end, start, great_circle);
      seg.push([180, lat]);
      segments.push(seg);
      seg = [[-180, lat]];
    }
  }

  // If no crossing was detected, return an empty array.
  if (segments.length === 0) {
    return [];

  } else if (coordsEqual(coords[coords.length - 1], segments[0][0])) {
    // For closed (polygon) rings, join segments.
    segments[0] = seg.concat(segments[0]);

  } else {
    seg.push(coords[coords.length - 1]);
    segments.push(seg);
  }

  return segments;
}

/**
 * Helper function to convert spherical coordinates (in degrees) to Cartesian coordinates.
 * @param {[number, number]} point - [longitude, latitude] in degrees.
 * @returns {[number, number, number]} Cartesian coordinates [x, y, z].
 */
export function spherical_degrees_to_cartesian(point) {
  const [lon, lat] = point;
  const rad = Math.PI / 180;
  const lonRad = lon * rad;
  const latRad = lat * rad;
  return [
    Math.cos(lonRad) * Math.cos(latRad),
    Math.sin(lonRad) * Math.cos(latRad),
    Math.sin(latRad)
  ];
}

/**
 * Computes the crossing latitude using great circle (spherical) calculations.
 *
 * Given two points, it converts them to Cartesian coordinates, finds the plane
 * defined by the two points (via a cross product), and then computes the intersection
 * of that plane with the unit sphere (using another cross product).
 *
 * @param {[number, number]} start - Starting point [lon, lat] in degrees.
 * @param {[number, number]} end - Ending point [lon, lat] in degrees.
 * @returns {number} The crossing latitude in degrees, rounded to 7 decimals.
 */
export function crossing_latitude_great_circle(start, end) {
  const p1 = spherical_degrees_to_cartesian(start);
  const p2 = spherical_degrees_to_cartesian(end);
  const n1 = crossProduct(p1, p2);
  const n2 = [0, -1, 0]; // The unit vector in the negative Y direction.
  let intersection = crossProduct(n1, n2);
  intersection = normalizeVector(intersection);
  const latRad = Math.asin(intersection[2]);
  const latDeg = latRad * (180 / Math.PI);
  return roundTo7(latDeg);
}

/**
 * Computes the crossing latitude using a flat (2D) approximation.
 *
 * This function computes the latitude at which a segment crosses the antimeridian
 * using linear interpolation.
 *
 * @param {[number, number]} start - Starting point [lon, lat] in degrees.
 * @param {[number, number]} end - Ending point [lon, lat] in degrees.
 * @returns {number} The crossing latitude in degrees, rounded to 7 decimals.
 */
export function crossing_latitude_flat(start, end) {
  const latDelta = end[1] - start[1];
  let result;
  if (end[0] > 0) {
    result = start[1] + ((180 - start[0]) * latDelta) / (end[0] + 360 - start[0]);
  } else {
    result = start[1] + ((start[0] + 180) * latDelta) / (start[0] + 360 - end[0]);
  }
  return roundTo7(result);
}

/**
 * Computes the crossing latitude given a segment defined by start and end.
 * Acts as a wrapper choosing between great circle and flat calculations.
 *
 * @param {[number, number]} start - Starting point [lon, lat] in degrees.
 * @param {[number, number]} end - Ending point [lon, lat] in degrees.
 * @param {boolean} great_circle - If true, use the spherical method.
 * @returns {number} The crossing latitude (in degrees), rounded to 7 decimals.
 */
export function crossing_latitude(start, end, great_circle) {
  if (Math.abs(start[0]) === 180) {
    return start[1];
  } else if (Math.abs(end[0]) === 180) {
    return end[1];
  }
  if (great_circle) {
    return crossing_latitude_great_circle(start, end);
  }
  return crossing_latitude_flat(start, end);
}


/**
 * Extends segments over the poles if necessary.
 *
 * @param {Array} segments - List of segments.
 * @param {Object} options - Options including force_north_pole, force_south_pole, fix_winding.
 * @returns {Array} The updated segments.
 */
export function extend_over_poles(
  segments,
  { force_north_pole = false, force_south_pole = false, fix_winding = true } = {}
) {
  // TODO: Implement logic to extend segments over poles
  return segments;
}

/**
 * Builds polygons from an array of segments.
 *
 * This function attempts to join segments that share endpoints into closed polygon rings.
 * It works recursively: it pops a segment, looks for a candidate segment whose starting coordinate
 * has the same longitude as the current segment's ending coordinate (and meets additional latitude criteria),
 * and if found, joins the segments and recurses. When no join candidate is found, the current segment is assumed
 * to be self-contained (i.e. a complete polygon ring) and added to the result.
 *
 * @param {Array.<Array.<[number, number]>>} segments - Array of segments (each segment is an array of coordinates).
 * @returns {Array} An array of Turf.js Polygon features.
 */
export function build_polygons(segments) {
  if (segments.length === 0) return [];

  // Remove one segment from the list.
  let seg = segments.pop();
  const isRight = seg[seg.length - 1][0] === 180;
  const candidates = [];

  // If the segment is self-closing, add a candidate with a null index.
  if (is_self_closing(seg)) {
    candidates.push([null, seg[0][1]]);
  }

  // Examine remaining segments for one that can join with the current segment.
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s[0][0] === seg[seg.length - 1][0]) {
      if (isRight) {
        if (
          s[0][1] > seg[seg.length - 1][1] &&
          (!is_self_closing(s) || s[s.length - 1][1] < seg[0][1])
        ) {
          candidates.push([i, s[0][1]]);
        }
      } else {
        if (
          s[0][1] < seg[seg.length - 1][1] &&
          (!is_self_closing(s) || s[s.length - 1][1] > seg[0][1])
        ) {
          candidates.push([i, s[0][1]]);
        }
      }
    }
  }

  // Sort candidates based on the candidate's starting latitude.
  // (Sort ascending if isRight; descending otherwise.)
  candidates.sort((a, b) => {
    return isRight ? a[1] - b[1] : b[1] - a[1];
  });

  const index = candidates.length > 0 ? candidates[0][0] : null;

  if (index !== null) {
    // Join the candidate segment with the current segment.
    const segToJoin = segments.splice(index, 1)[0];
    seg = seg.concat(segToJoin);
    segments.push(seg);
    // Recurse with the updated segments.
    return build_polygons(segments);
  } else {
    // No candidate found: assume this segment is a complete polygon.
    const polygons = build_polygons(segments);
    // Add the polygon only if it is not degenerate (i.e. not all points are the same).
    const allSame = seg.every(pt => coordsEqual(pt, seg[0]));
    if (!allSame) {
      const closedRing = closeRing(seg);
      const poly = turf.polygon([closedRing]);
      polygons.push(poly);
    }
    return polygons;
  }
}

/**
 * Checks if a segment is self-closing.
 *
 * A segment is considered self-closing if:
 *   - The first and last coordinate have the same longitude, and
 *   - For a "right" segment (i.e. ending with longitude 180) the first latitude is greater than the last latitude,
 *     or for a "left" segment (ending with -180) the first latitude is less than the last latitude.
 *
 * @param {Array.<[number, number]>} segment - An array of coordinates.
 * @returns {boolean} True if the segment is self-closing, false otherwise.
 */
export function is_self_closing(segment) {
  if (segment.length === 0) return false;
  const first = segment[0];
  const last = segment[segment.length - 1];
  const isRight = last[0] === 180;
  return (first[0] === last[0]) && (isRight ? (first[1] > last[1]) : (first[1] < last[1]));
}


/**
 * Calculates a GeoJSON-spec conforming bounding box for a shape.
 *
 * @param {Object} shape - A GeoJSON geometry or object with __geo_interface__.
 * @param {boolean} [force_over_antimeridian=false] - Force the bounding box over the antimeridian.
 * @returns {Array} The bounding box as [minX, minY, maxX, maxY].
 */
export function bbox(shape, force_over_antimeridian = false) {
  // TODO: Implement bbox calculation using Turf.js
  return [];
}

/**
 * Calculates the centroid for a polygon or multipolygon.
 *
 * @param {Object} shape - A GeoJSON Polygon or MultiPolygon.
 * @returns {Object} The centroid as a GeoJSON Point.
 */
export function centroid(shape) {
  // TODO: Implement centroid calculation using Turf.js
  return null;
}

/**
 * Checks if a polygon is coincident to the antimeridian.
 *
 * @param {Object} polygon - A GeoJSON Polygon.
 * @returns {boolean} True if coincident, false otherwise.
 */
export function is_coincident_to_antimeridian(polygon) {
  // TODO: Implement check for antimeridian coincidence
  return false;
}

/* Internal helper: cross product of two 3D vectors */
function crossProduct(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

/* Internal helper: Euclidean norm of a 3D vector */
function vectorNorm(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/* Internal helper: normalizes a 3D vector */
function normalizeVector(v) {
  const norm = vectorNorm(v);
  return v.map(val => val / norm);
}

/* Internal helper: rounds a number to 7 decimal places */
function roundTo7(num) {
  return parseFloat(num.toFixed(7));
}

/**
 * Determines if two numbers are close to each other within a tolerance.
 * @param {number} a 
 * @param {number} b 
 * @param {number} [tol=1e-7]
 * @returns {boolean}
 */
function isClose(a, b, tol = 1e-7) {
  return Math.abs(a - b) < tol;
}

/**
 * Compares two coordinate arrays for equality (with tolerance).
 * @param {number[]} a 
 * @param {number[]} b 
 * @param {number} [tol=1e-7]
 * @returns {boolean}
 */
function coordsEqual(a, b, tol = 1e-7) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!isClose(a[i], b[i], tol)) return false;
  }
  return true;
}

/**
 * Helper: Ensures that a ring is closed by appending the first coordinate to the end if needed.
 * @param {Array.<[number, number]>} ring
 * @returns {Array.<[number, number]>}
 */
function closeRing(ring) {
  if (!coordsEqual(ring[0], ring[ring.length - 1])) {
    return ring.concat([ring[0]]);
  }
  return ring;
}

