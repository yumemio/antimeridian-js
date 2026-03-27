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
 * Fixes a GeoJSON object that may cross the antimeridian.
 *
 * @param {Object} geojson - A GeoJSON geometry, Feature, or FeatureCollection.
 * @param {Object} options - Options.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Object} The fixed object in the same top-level container kind as the input.
 */
export function fix_geojson(
  geojson,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  if (!geojson || !geojson.type) {
    throw new Error("Invalid GeoJSON: missing type field.");
  }
  if (geojson.type === "Feature") {
    if (!geojson.geometry) {
      throw new Error("GeoJSON Feature missing geometry field.");
    }
    // Fix the feature (its geometry) and update it.
    const fixedFeature = fix_shape(geojson, { force_north_pole, force_south_pole, fix_winding, great_circle });
    geojson.geometry = fixedFeature.geometry;
    return geojson;
  } else if (geojson.type === "FeatureCollection") {
    if (!geojson.features) {
      throw new Error("GeoJSON FeatureCollection missing features field.");
    }
    geojson.features = geojson.features.map(feature =>
      fix_geojson(feature, { force_north_pole, force_south_pole, fix_winding, great_circle })
    );
    return geojson;
  } else {
    // Assume it's a raw geometry.
    return fix_shape(geojson, { force_north_pole, force_south_pole, fix_winding, great_circle });
  }
}

/**
 * Segments a GeoJSON object into a MultiLineString.
 *
 * If the object does not cross the antimeridian, its exterior and interior
 * line strings are returned unchanged.
 *
 * @param {Object} geojson - A GeoJSON object (Feature, FeatureCollection, or raw geometry).
 * @param {boolean} great_circle - Use great circle calculations if true.
 * @returns {Object} A Turf.js MultiLineString feature.
 * @throws {Error} if the input GeoJSON is missing a "type" field or required subfields.
 */
export function segment_geojson(geojson, great_circle) {
  if (!geojson || !geojson.type) {
    throw new Error("no 'type' field found in GeoJSON");
  } else if (geojson.type === "Feature") {
    if (!geojson.geometry) {
      throw new Error("no 'geometry' field found in GeoJSON Feature");
    }
    // Call segment_shape on the feature. It will return an array of segments.
    const segments = segment_shape(geojson, great_circle);
    return turf.multiLineString(segments, geojson.properties);
  } else if (geojson.type === "FeatureCollection") {
    if (!geojson.features) {
      throw new Error("no 'features' field found in GeoJSON FeatureCollection");
    }
    let segments = [];
    geojson.features.forEach(feature => {
      // Recursively segment each feature.
      const segsFeature = segment_geojson(feature, great_circle);
      // segsFeature is a MultiLineString feature; extract its coordinates.
      segments = segments.concat(segsFeature.geometry.coordinates);
    });
    return turf.multiLineString(segments);
  } else {
    // Assume it's a raw geometry.
    const segments = segment_shape(geojson, great_circle);
    return turf.multiLineString(segments);
  }
}

/**
 * Fixes a geometry or Feature that may cross the antimeridian.
 *
 * Depending on the geometry type (Polygon, MultiPolygon, LineString, or MultiLineString),
 * dispatches to the corresponding fix function.
 *
 * @param {Object} shape - A raw GeoJSON geometry or Feature.
 * @param {Object} options - Options.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Object} A fixed geometry or Feature matching the input container kind.
 */
export function fix_shape(
  shape,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  const returnGeometry = !isFeature(shape);
  const feature = asFeature(shape);
  if (!feature || !feature.geometry || !feature.geometry.type) {
    throw new Error("Invalid shape: missing geometry type.");
  }
  const type = feature.geometry.type;
  if (type === "Polygon") {
    const fixed = fix_polygon(feature, { force_north_pole, force_south_pole, fix_winding, great_circle });
    return returnGeometry ? fixed.geometry : fixed;
  } else if (type === "MultiPolygon") {
    const fixed = fix_multi_polygon(feature, { force_north_pole, force_south_pole, fix_winding, great_circle });
    return returnGeometry ? fixed.geometry : fixed;
  } else if (type === "LineString") {
    const fixed = fix_line_string(feature, great_circle);
    return returnGeometry ? fixed.geometry : fixed;
  } else if (type === "MultiLineString") {
    const fixed = fix_multi_line_string(feature, great_circle);
    return returnGeometry ? fixed.geometry : fixed;
  } else {
    throw new Error(`Unsupported geometry type: ${type}`);
  }
}

/**
 * Segments a polygonal geometry or Feature into an array of line segments.
 *
 * If the input is a Polygon, segment_polygon() is called directly. For a MultiPolygon,
 * each constituent polygon is processed, and all segments are returned in a single array.
 *
 * @param {Object} shape - A Polygon or MultiPolygon geometry, or a Feature wrapping one.
 * @param {boolean} great_circle - If true, use great circle calculations for segmentation.
 * @returns {Array.<Array.<[number, number]>>} Array of segments.
 * @throws {Error} If the geometry type is unsupported.
 */
export function segment_shape(shape, great_circle) {
  const feature = asFeature(shape);
  if (!feature || !feature.geometry || !feature.geometry.type) {
    throw new Error("Invalid shape object: missing geometry type.");
  }
  if (feature.geometry.type === "Polygon") {
    return segment_polygon(feature, great_circle);
  } else if (feature.geometry.type === "MultiPolygon") {
    const segments = [];
    // Each polygon in a MultiPolygon is an array of rings.
    for (const polyCoords of feature.geometry.coordinates) {
      // Build a Turf.js Polygon feature from polyCoords.
      const polyFeature = turf.polygon(polyCoords, feature.properties);
      const segs = segment_polygon(polyFeature, great_circle);
      segments.push(...segs);
    }
    return segments;
  } else {
    throw new Error(`Unsupported geometry type: ${feature.geometry.type}`);
  }
}

/**
 * Fixes a MultiPolygon geometry or Feature that may cross the antimeridian.
 *
 * Each constituent polygon is fixed individually (via fix_polygon_to_list),
 * and then all results are combined into a single MultiPolygon.
 *
 * @param {Object} multiPolygon - A MultiPolygon geometry or Feature.
 * @param {Object} [options] - Options object.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Object} A MultiPolygon geometry or Feature matching the input container kind.
 */
export function fix_multi_polygon(
  multiPolygon,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  const returnGeometry = !isFeature(multiPolygon);
  const feature = asFeature(multiPolygon);
  // Process each polygon in the MultiPolygon.
  const allPolys = [];
  for (const polyCoords of feature.geometry.coordinates) {
    // Construct a Turf.js Polygon feature for each set of coordinates.
    const polyFeature = turf.polygon(polyCoords, feature.properties);
    const fixedParts = fix_polygon_to_list(polyFeature, { force_north_pole, force_south_pole, fix_winding, great_circle });
    allPolys.push(...fixedParts);
  }
  // Combine all fixed polygons into a MultiPolygon.
  const multiCoords = allPolys.map(p => p.geometry.coordinates);
  const fixed = turf.multiPolygon(multiCoords, feature.properties);
  return returnGeometry ? fixed.geometry : fixed;
}

/**
 * Fixes a Polygon geometry or Feature that may cross the antimeridian.
 *
 * If the fixed polygon (from fix_polygon_to_list) is single and its exterior ring
 * is not oriented counterclockwise, then a new polygon is created whose exterior
 * is a full-world ring and whose interior ring is the original polygon’s exterior.
 *
 * @param {Object} polygon - A Polygon geometry or Feature.
 * @param {Object} [options] - Options object.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Object} A Polygon or MultiPolygon geometry, or the corresponding Feature type,
 * matching the input container kind.
 */
export function fix_polygon(
  polygon,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  const returnGeometry = !isFeature(polygon);
  const feature = asFeature(polygon);
  // When forcing a pole, we disable winding fixes.
  if (force_north_pole || force_south_pole) {
    fix_winding = false;
  }
  const fixedPolys = fix_polygon_to_list(feature, { force_north_pole, force_south_pole, fix_winding, great_circle });
  if (fixedPolys.length === 1) {
    const poly = fixedPolys[0];
    // If the exterior ring is oriented counterclockwise, all is well.
    if (isCCW(poly.geometry.coordinates[0])) {
      return returnGeometry ? poly.geometry : poly;
    } else {
      // Otherwise, return a polygon whose exterior is the full world and whose hole is the original polygon.
      const worldRing = [
        [-180, 90],
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90]
      ];
      const fixed = turf.polygon([worldRing, poly.geometry.coordinates[0]], feature.properties);
      return returnGeometry ? fixed.geometry : fixed;
    }
  } else {
    // More than one fixed polygon: return a MultiPolygon feature.
    const multipolyCoords = fixedPolys.map(p => p.geometry.coordinates);
    const fixed = turf.multiPolygon(multipolyCoords, feature.properties);
    return returnGeometry ? fixed.geometry : fixed;
  }
}

/**
 * Fixes a LineString geometry or Feature that may cross the antimeridian.
 *
 * If the line does not cross the antimeridian, returns the original LineString.
 * Otherwise, returns a MultiLineString built from the segmented parts.
 *
 * @param {Object} lineString - A LineString geometry or Feature.
 * @param {boolean} great_circle - Use great circle calculations if true.
 * @returns {Object} A LineString or MultiLineString geometry, or the corresponding
 * Feature type, matching the input container kind.
 */
export function fix_line_string(lineString, great_circle) {
  const returnGeometry = !isFeature(lineString);
  const feature = asFeature(lineString);
  const coords = feature.geometry.coordinates;
  const segments = segment(coords, great_circle);

  if (!segments || segments.length === 0) {
    return returnGeometry ? feature.geometry : feature;
  } else {
    const fixed = turf.multiLineString(segments, feature.properties);
    return returnGeometry ? fixed.geometry : fixed;
  }
}

/**
 * Fixes a MultiLineString geometry or Feature that may cross the antimeridian.
 *
 * Each constituent LineString is processed via fix_line_string. If the fixed result is a LineString,
 * its coordinates are added to the output array; if it is a MultiLineString, each of its line strings is added.
 * Finally, returns a new MultiLineString composed of all fixed line strings.
 *
 * @param {Object} multiLineString - A MultiLineString geometry or Feature.
 * @param {boolean} great_circle - Use great circle calculations if true.
 * @returns {Object} A MultiLineString geometry or Feature matching the input container kind.
 */
export function fix_multi_line_string(multiLineString, great_circle) {
  const returnGeometry = !isFeature(multiLineString);
  const feature = asFeature(multiLineString);
  const fixedLineStrings = [];
  // multiLineString.geometry.coordinates is an array of LineString coordinate arrays.
  for (const lineCoords of feature.geometry.coordinates) {
    const lineFeature = turf.lineString(lineCoords, feature.properties);
    const fixed = fix_line_string(lineFeature, great_circle);

    if (fixed.geometry.type === "LineString") {
      fixedLineStrings.push(fixed.geometry.coordinates);
    } else if (fixed.geometry.type === "MultiLineString") {
      for (const subLine of fixed.geometry.coordinates) {
        fixedLineStrings.push(subLine);
      }
    }
  }
  const fixed = turf.multiLineString(fixedLineStrings, feature.properties);
  return returnGeometry ? fixed.geometry : fixed;
}

/**
 * Segments a Turf.js Polygon feature into an array of segments.
 *
 * For the exterior ring, the function calls segment() on the coordinates. If no
 * segmentation is needed (i.e. no antimeridian crossing detected), the entire ring is returned.
 * Then, each interior ring is processed similarly.
 *
 * @param {Object} polygon - A Turf.js Polygon feature.
 * @param {boolean} great_circle - If true, use great circle calculations for segmentation.
 * @returns {Array.<Array.<[number, number]>>} Array of segments (each segment is an array of coordinates).
 */
export function segment_polygon(polygon, great_circle) {
  const segments = [];
  // Process exterior ring.
  const exterior = polygon.geometry.coordinates[0];
  let extSegments = segment(exterior, great_circle);
  if (!extSegments || extSegments.length === 0) {
    extSegments = [exterior];
  }
  segments.push(...extSegments);

  // Process each interior ring.
  const interiors = polygon.geometry.coordinates.slice(1);
  for (const ring of interiors) {
    let ringSegments = segment(ring, great_circle);
    if (!ringSegments || ringSegments.length === 0) {
      ringSegments = [ring];
    }
    segments.push(...ringSegments);
  }
  return segments;
}


/**
 * (fix_polygon_to_list)
 *
 * Fixes a polygon that crosses the antimeridian by:
 * 1. Normalizing the exterior ring (and interiors),
 * 2. Segmenting the exterior (and interior rings) if necessary,
 * 3. Extending segments over poles,
 * 4. Rebuilding polygon rings from segments (via build_polygons), and
 * 5. Assigning interior rings to the polygon that contains them.
 *
 * Returns an array of Turf.js Polygon features.
 *
 * @param {Object} polygon - A Turf.js Polygon feature.
 * @param {Object} options - Options.
 * @param {boolean} [options.force_north_pole=false]
 * @param {boolean} [options.force_south_pole=false]
 * @param {boolean} [options.fix_winding=true]
 * @param {boolean} [options.great_circle=true]
 * @returns {Array} Array of Turf.js Polygon features.
 */
export function fix_polygon_to_list(
  polygon,
  { force_north_pole = false, force_south_pole = false, fix_winding = true, great_circle = true } = {}
) {
  // Process the exterior ring.
  const exterior = normalize(polygon.geometry.coordinates[0]);
  const segs = segment(exterior, great_circle);

  if (segs.length === 0) {
    let poly = turf.polygon([exterior, ...polygon.geometry.coordinates.slice(1)], polygon.properties);
    if (
      fix_winding &&
      (!isCCW(poly.geometry.coordinates[0]) ||
       polygon.geometry.coordinates.slice(1).some(ring => isCCW(ring)))
    ) {
      FixWindingWarning.warn();
      poly = orientPolygon(poly);
    }
    return [poly];
  } else {
    const interiors = [];
    for (let i = 1; i < polygon.geometry.coordinates.length; i++) {
      const interior = polygon.geometry.coordinates[i];
      const interiorSegs = segment(interior, great_circle);
      if (interiorSegs.length > 0) {
        if (fix_winding) {
          const unwrapped = interior.map(([x, y, ...rest]) => [(((x % 360) + 360) % 360), y, ...rest]);
          if (isCCW(unwrapped)) {
            FixWindingWarning.warn();
            const reversed = interior.slice().reverse();
            const newInteriorSegs = segment(reversed, great_circle);
            segs.push(...newInteriorSegs);
          } else {
            segs.push(...interiorSegs);
          }
        } else {
          segs.push(...interiorSegs);
        }
      } else {
        interiors.push(interior);
      }
    }
    const extended = extend_over_poles(segs, { force_north_pole, force_south_pole, fix_winding });
    const polys = build_polygons(extended);
    if (polys.length === 0) {
      throw new Error("No valid polygon could be constructed from segments.");
    }
    for (let i = 0; i < polys.length; i++) {
      let poly = polys[i];
      const polyCoords = poly.geometry.coordinates[0];
      for (let j = interiors.length - 1; j >= 0; j--) {
        const interiorRing = interiors[j];
        const interiorPoly = turf.polygon([interiorRing]);
        if (turf.booleanContains(poly, interiorPoly)) {
          const currentHoles = poly.geometry.coordinates.slice(1);
          currentHoles.push(interiorRing);
          poly = turf.polygon([polyCoords, ...currentHoles], polygon.properties);
          polys[i] = poly;
          interiors.splice(j, 1);
        }
      }
    }
    if (interiors.length > 0) {
      throw new Error("Some interior rings could not be assigned to any polygon.");
    }
    return polys;
  }
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
 * For segments whose endpoints lie on the antimeridian (longitude ±180),
 * this function inspects the “start” and “end” of each segment. Depending on
 * the provided flags (force_north_pole, force_south_pole) and the relative latitudes
 * of segment endpoints, the function appends polar points to “extend” the segment.
 *
 * If both poles are extended and fix_winding is true, the function issues a warning
 * and reverses the original segments.
 *
 * @param {Array.<Array.<[number, number]>>} segments - Array of segments (each segment is an array of coordinates).
 * @param {Object} [options={}] - Options object.
 * @param {boolean} [options.force_north_pole=false] - Force joining segments over the north pole.
 * @param {boolean} [options.force_south_pole=false] - Force joining segments over the south pole.
 * @param {boolean} [options.fix_winding=true] - If true and both poles are extended, reverse segment winding.
 * @returns {Array.<Array.<[number, number]>>} The updated segments.
 */
export function extend_over_poles(
  segments,
  { force_north_pole = false, force_south_pole = false, fix_winding = true } = {}
) {
  // These variables will hold the index and latitude for the earliest/latest points.
  let left_start = null;
  let right_start = null;
  let left_end = null;
  let right_end = null;

  // Inspect each segment's starting and ending coordinates.
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const start = seg[0];
    const end = seg[seg.length - 1];

    // Check starting coordinate.
    if (start[0] === -180) {
      if (!left_start || start[1] < left_start.latitude) {
        left_start = { index: i, latitude: start[1] };
      }
    } else if (start[0] === 180) {
      if (!right_start || start[1] > right_start.latitude) {
        right_start = { index: i, latitude: start[1] };
      }
    }

    // Check ending coordinate.
    if (end[0] === -180) {
      if (!left_end || end[1] < left_end.latitude) {
        left_end = { index: i, latitude: end[1] };
      }
    } else if (end[0] === 180) {
      if (!right_end || end[1] > right_end.latitude) {
        right_end = { index: i, latitude: end[1] };
      }
    }
  }

  let is_over_north_pole = false;
  let is_over_south_pole = false;
  // Make a deep copy of the original segments.
  const originalSegments = JSON.parse(JSON.stringify(segments));

  // Process left-side (longitude -180) endpoints.
  if (left_end) {
    if (
      force_north_pole &&
      !force_south_pole &&
      !right_end &&
      (!left_start || left_end.latitude > left_start.latitude)
    ) {
      is_over_north_pole = true;
      segments[left_end.index].push([-180, 90], [180, 90]);
      segments[left_end.index].reverse();
    } else if (
      force_south_pole ||
      !left_start ||
      left_end.latitude < left_start.latitude
    ) {
      is_over_south_pole = true;
      segments[left_end.index].push([-180, -90], [180, -90]);
    }
  }

  // Process right-side (longitude 180) endpoints.
  if (right_end) {
    if (
      force_south_pole &&
      !force_north_pole &&
      (!right_start || right_end.latitude < right_start.latitude)
    ) {
      is_over_south_pole = true;
      segments[right_end.index].push([180, -90], [-180, -90]);
      segments[right_end.index].reverse();
    } else if (
      force_north_pole ||
      !right_start ||
      right_end.latitude > right_start.latitude
    ) {
      is_over_north_pole = true;
      segments[right_end.index].push([180, 90], [-180, 90]);
    }
  }

  // If both poles were extended and fix_winding is true, reverse all original segments.
  if (fix_winding && is_over_north_pole && is_over_south_pole) {
    if (force_north_pole || force_south_pole) {
      throw new Error(
        'Invalid state: fix_winding cannot be true when force_north_pole or force_south_pole are set and both poles are extended.'
      );
    }
    console.warn(
      'FixWindingWarning: Reversing segments due to over both poles.'
    );
    for (let seg of originalSegments) {
      seg.reverse();
    }
    return originalSegments;
  } else {
    return segments;
  }
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
 * If the shape is a MultiPolygon and it crosses the antimeridian (or if force_over_antimeridian is true),
 * the bounding box is returned as [max(xmins), ymin, min(xmaxs), ymax]. Otherwise, [min(xmins), ymin, max(xmaxs), ymax].
 *
 * @param {Object} shape - A Polygon or MultiPolygon geometry, or a Feature wrapping one.
 * @param {boolean} [force_over_antimeridian=false] - If true, force the bounding box to be over the antimeridian.
 * @returns {Array<number>} The bounding box as [minX, minY, maxX, maxY] (or the antimeridian version).
 * @throws {Error} if the geometry type is not Polygon or MultiPolygon.
 */
export function bbox(shape, force_over_antimeridian = false) {
  // If input is a Feature, use its geometry.
  let geom = shape;
  if (shape.type === "Feature") {
    geom = shape.geometry;
  }
  if (geom.type === "Polygon") {
    // Use Turf's bbox for a simple polygon.
    return turf.bbox({ type: "Feature", geometry: geom });
  } else if (geom.type === "MultiPolygon") {
    let crossesAntimeridian = false;
    const xmins = [];
    const xmaxs = [];
    let ymin = 90;
    let ymax = -90;
    // Iterate through each component polygon.
    geom.coordinates.forEach(polygonCoords => {
      const polyFeature = turf.polygon(polygonCoords);
      const bounds = turf.bbox(polyFeature); // [minX, minY, maxX, maxY]
      xmins.push(bounds[0]);
      xmaxs.push(bounds[2]);
      if (bounds[1] < ymin) ymin = bounds[1];
      if (bounds[3] > ymax) ymax = bounds[3];
      // If this polygon is coincident to the antimeridian (and not exactly spanning -180 to 180)
      if (is_coincident_to_antimeridian(polyFeature) && !(bounds[0] === -180 && bounds[2] === 180)) {
        crossesAntimeridian = true;
      }
    });
    if (crossesAntimeridian || force_over_antimeridian) {
      return [Math.max(...xmins), ymin, Math.min(...xmaxs), ymax];
    } else {
      return [Math.min(...xmins), ymin, Math.max(...xmaxs), ymax];
    }
  } else {
    throw new Error("unsupported geom_type for bbox calculation: " + geom.type);
  }
}

/**
 * Calculates the centroid for a Polygon or MultiPolygon.
 * For a MultiPolygon, components with any negative longitudes are translated by +360,
 * the centroid is computed from the resulting MultiPolygon, and then adjusted back if needed.
 *
 * @param {Object} shape - A Polygon or MultiPolygon geometry, or a Feature wrapping one.
 * @returns {Object} A Point Feature representing the centroid.
 * @throws {Error} if the geometry type is not supported.
 */
export function centroid(shape) {
  // If input is a Feature, use its geometry.
  let geom = shape;
  if (shape.type === "Feature") {
    geom = shape.geometry;
  }
  if (geom.type === "Polygon") {
    return turf.centerOfMass({ type: "Feature", geometry: geom });
  } else if (geom.type === "MultiPolygon") {
    const newPolys = [];
    geom.coordinates.forEach(polygonCoords => {
      const exterior = polygonCoords[0];
      // Check if any coordinate has a negative longitude.
      const hasNegative = exterior.some(coord => coord[0] < 0);
      let newCoords;
      if (hasNegative) {
        // Translate each coordinate in all rings by +360.
        newCoords = polygonCoords.map(ring =>
          ring.map(([lon, lat, ...rest]) => [lon + 360, lat, ...rest])
        );
      } else {
        newCoords = polygonCoords;
      }
      newPolys.push(newCoords);
    });
    // Build a new MultiPolygon with the translated components.
    const mp = turf.multiPolygon(newPolys);
    let cent = turf.centerOfMass(mp);
    // If the computed centroid's longitude is greater than 180, adjust it.
    if (cent.geometry.coordinates[0] > 180) {
      cent.geometry.coordinates[0] -= 360;
    }
    return cent;
  } else {
    throw new Error("unsupported geom_type for centroid calculation: " + geom.type);
  }
}

/**
 * Checks if a Polygon Feature is coincident to the antimeridian.
 *
 * Iterates over each consecutive pair of points in the exterior ring.
 * If a pair is found where the absolute value of the longitude is 180
 * (and both points share that same longitude), the function returns true.
 *
 * @param {Object} polygon - A Polygon Feature.
 * @returns {boolean} True if the polygon is coincident to the antimeridian, false otherwise.
 * @throws {Error} if the input is not a valid Polygon Feature.
 */
export function is_coincident_to_antimeridian(polygon) {
  if (!polygon || !polygon.geometry || polygon.geometry.type !== "Polygon") {
    throw new Error("Input must be a Turf.js Polygon feature");
  }
  const coords = polygon.geometry.coordinates[0];
  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    if (Math.abs(start[0]) === 180 && start[0] === end[0]) {
      return true;
    }
  }
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

/**
 * Computes the signed area of a linear ring using the shoelace formula.
 * Assumes the ring is closed.
 * @param {Array.<[number, number]>} ring 
 * @returns {number}
 */
function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/**
 * Returns true if the ring is oriented counterclockwise.
 * (Positive area means counterclockwise.)
 * @param {Array.<[number, number]>} ring 
 * @returns {boolean}
 */
export function isCCW(ring) {
  return ringArea(ring) > 0;
}

/**
 * Orients a ring as desired.
 * @param {Array.<[number, number]>} ring 
 * @param {boolean} ccwDesired - True if the desired orientation is counterclockwise.
 * @returns {Array.<[number, number]>}
 */
function orientRing(ring, ccwDesired) {
  if (isCCW(ring) !== ccwDesired) {
    return ring.slice().reverse();
  }
  return ring;
}

/**
 * Returns a new Turf.js Polygon feature whose exterior ring is counterclockwise and interiors clockwise.
 * Preserves the original properties.
 * @param {Object} polygon - A Turf.js Polygon feature.
 * @returns {Object} A reoriented Turf.js Polygon feature.
 */
function orientPolygon(polygon) {
  const exterior = orientRing(polygon.geometry.coordinates[0], true);
  const interiors = [];
  for (let i = 1; i < polygon.geometry.coordinates.length; i++) {
    interiors.push(orientRing(polygon.geometry.coordinates[i], false));
  }
  return turf.polygon([exterior, ...interiors], polygon.properties);
}

function isFeature(shape) {
  return !!shape && shape.type === "Feature";
}

function asFeature(shape) {
  if (isFeature(shape)) {
    return shape;
  }
  if (shape && shape.geometry && shape.geometry.type) {
    return {
      type: "Feature",
      geometry: shape.geometry,
      properties: shape.properties || {}
    };
  }
  if (!shape || !shape.type) {
    throw new Error("Invalid shape: missing type.");
  }
  return turf.feature(shape, shape.properties || {});
}
