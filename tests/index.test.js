import * as turf from '@turf/turf';

import {
  helloWorld,
  spherical_degrees_to_cartesian,
  crossing_latitude,
  crossing_latitude_great_circle,
  crossing_latitude_flat,
  normalize,
  segment,
  is_self_closing,
  build_polygons,
  extend_over_poles
} from "../src/index.js";

test("helloWorld function should return the expected greeting", () => {
  expect(helloWorld()).toBe("Hello from my-npm-package!");
});

describe('spherical_degrees_to_cartesian', () => {
  test('converts [0, 0] correctly', () => {
    const result = spherical_degrees_to_cartesian([0, 0]);
    expect(result[0]).toBeCloseTo(1);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);
  });

  test('converts [90, 0] correctly', () => {
    const result = spherical_degrees_to_cartesian([90, 0]);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(1);
    expect(result[2]).toBeCloseTo(0);
  });

  test('converts [0, 90] correctly', () => {
    const result = spherical_degrees_to_cartesian([0, 90]);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(1);
  });
});

describe('crossing_latitude_great_circle', () => {
  test('calculates crossing latitude for a typical antimeridian crossing', () => {
    const result = crossing_latitude_great_circle([170, 10], [-170, 20]);
    expect(result).toBeCloseTo(-15.339814499187973, 4);
  });
});

describe('crossing_latitude_flat', () => {
  test('calculates flat crossing latitude for a typical antimeridian crossing', () => {
    // For start = [170, 10] and end = [-170, 20]:
    // latitude_delta = 20 - 10 = 10;
    // Using the else branch: result = 10 + ((170 + 180) * 10) / (170 + 360 - (-170))
    //                                = 10 + (3500 / 700)
    //                                = 10 + 5 = 15.
    const result = crossing_latitude_flat([170, 10], [-170, 20]);
    expect(result).toBeCloseTo(15.0, 7);
  });
});

describe('crossing_latitude (wrapper)', () => {
  test('returns start latitude when start longitude is ±180', () => {
    expect(crossing_latitude([180, 10], [0, 20], true)).toBe(10);
    expect(crossing_latitude([-180, 15], [10, 25], true)).toBe(15);
  });

  test('returns end latitude when end longitude is ±180', () => {
    expect(crossing_latitude([10, 20], [180, 30], true)).toBe(30);
    expect(crossing_latitude([10, 20], [-180, 40], true)).toBe(40);
  });

  test('dispatches to great circle method when great_circle is true', () => {
    // For a right-crossing scenario: [170, 10] to [-170, 20]
    // Since neither endpoint is ±180, the wrapper calls crossing_latitude_great_circle.
    const expected = crossing_latitude_great_circle([170, 10], [-170, 20]);
    const result = crossing_latitude([170, 10], [-170, 20], true);
    expect(result).toBeCloseTo(expected, 7);
  });

  test('dispatches to flat method when great_circle is false', () => {
    const expected = crossing_latitude_flat([170, 10], [-170, 20]);
    const result = crossing_latitude([170, 10], [-170, 20], false);
    expect(result).toBeCloseTo(expected, 7);
  });
});

describe('normalize', () => {
  test('normalizes longitudes not equal to ±180', () => {
    const input = [[181, 10], [0, 0]];
    // 181 should normalize to -179
    const expected = [[-179, 10], [0, 0]];
    expect(normalize(input)).toEqual(expected);
  });

  test('handles points exactly at ±180 with adjacent points', () => {
    // When points are exactly 180 or -180, behavior depends on the previous point.
    const input = [[180, 10], [-180, 20]];
    // For index 0, previous is last point ([-180,20]) so condition applies → set to [-180, 10].
    // For index 1, previous is now [-180,10] (not 180) so remains as [-180,20].
    const expected = [[180, 10], [-180, 20]];
    // However, because all points are on the antimeridian, the original array is returned.
    expect(normalize(input)).toEqual(input);
  });

  test('preserves extra dimensions', () => {
    const input = [[181, 10, 5], [0, 0, 99]];
    const expected = [[-179, 10, 5], [0, 0, 99]];
    expect(normalize(input)).toEqual(expected);
  });
});

describe('segment', () => {
  test('returns empty array when no antimeridian crossing is detected', () => {
    const coords = [[10, 0], [20, 0], [30, 0]];
    expect(segment(coords, true)).toEqual([]);
  });

  test('handles a right crossing', () => {
    // Right crossing: the jump is from a high positive longitude to a low (negative) one.
    // Example: from [170, 10] to [-170, 20]
    // Expected behavior:
    //  - For the segment from [170,10] to [-170,20]:
    //    * crossing_latitude is computed via crossing_latitude([-170,20],[170,10],true)
    //      which (due to reversal in right crossing) should yield approximately 15.3398145.
    //  - The first segment becomes: [[170,10], [180, ~15.3398145]]
    //  - The second segment becomes: [[-180, ~15.3398145], [-170,20]]
    const coords = [[170, 10], [-170, 20]];
    const lat = crossing_latitude([-170, 20], [170, 10], true);
    const expected = [
      [
        [170, 10],
        [180, lat]
      ],
      [
        [-180, lat],
        [-170, 20]
      ]
    ];
    const result = segment(coords, true);
    expect(result.length).toBe(2);
    expect(result[0][0]).toEqual([170, 10]);
    expect(result[0][1][0]).toBeCloseTo(180, 7);
    expect(result[1][0][0]).toBeCloseTo(-180, 7);
    expect(result[1][1]).toEqual([-170, 20]);
  });

  test('handles a left crossing', () => {
    // Left crossing: the jump is from a low negative longitude to a high positive one.
    // Example: from [-170, 20] to [170, 10]
    // Expected behavior:
    //  - crossing_latitude is computed via crossing_latitude([-170,20],[170,10],true)
    //    which should yield approximately 15.3398145.
    //  - The first segment becomes: [[-170,20], [-180, ~15.3398145]]
    //  - The second segment becomes: [[180, ~15.3398145], [170,10]]
    const coords = [[-170, 20], [170, 10]];
    const lat = crossing_latitude([-170, 20], [170, 10], true);
    const expected = [
      [
        [-170, 20],
        [-180, lat]
      ],
      [
        [180, lat],
        [170, 10]
      ]
    ];
    const result = segment(coords, true);
    expect(result.length).toBe(2);
    expect(result[0][0]).toEqual([-170, 20]);
    expect(result[0][1][0]).toBeCloseTo(-180, 7);
    expect(result[1][0][0]).toBeCloseTo(180, 7);
    expect(result[1][1]).toEqual([170, 10]);
  });
});

describe('is_self_closing', () => {
  test('returns true for a right segment with decreasing latitude', () => {
    // Right segment: ends at 180 and first latitude > last latitude.
    const segment = [[180, 20], [180, 10]];
    expect(is_self_closing(segment)).toBe(true);
  });

  test('returns true for a left segment with increasing latitude', () => {
    // Left segment: ends at -180 (not equal to 180) and first latitude < last latitude.
    const segment = [[-180, 10], [-180, 20]];
    expect(is_self_closing(segment)).toBe(true);
  });

  test('returns false when endpoints have different longitudes', () => {
    const segment = [[170, 10], [180, 15]];
    expect(is_self_closing(segment)).toBe(false);
  });

  test('returns false for degenerate segment (identical endpoints)', () => {
    const segment = [[180, 15], [180, 15]];
    expect(is_self_closing(segment)).toBe(false);
  });
});

describe('build_polygons', () => {
  test('builds a polygon from a single closed segment', () => {
    // A simple closed ring (assumed to have been extended over the antimeridian).
    const seg = [
      [170, 10],
      [180, 20],
      [180, 40],
      [-180, 40],
      [-180, 20],
      [170, 10]
    ];
    const result = build_polygons([seg]);
    expect(result.length).toBe(1);
    // Check that the outer ring of the returned Turf.js polygon matches the input segment.
    expect(result[0].geometry.coordinates[0]).toEqual(seg);
  });

  test('returns three polygon rings for segments with at least three points each', () => {
    // These segments mimic the ones in the original Python example.
    const segments = [
      [[130, 10], [170, 10], [180, 20]],
      [[-180, 20], [-170, 20], [-180, 10]],
      [[180, 10], [170, 10], [130, 10]]
    ];

    const result = build_polygons(segments);
    expect(result.length).toBe(3);

    // For each returned polygon, verify that the linear ring is closed.
    result.forEach((polygon) => {
      const ring = polygon.geometry.coordinates[0];
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    });

    // And verify that the individual rings are as expected.
    expect(result[0].geometry.coordinates[0]).toEqual([[130, 10], [170, 10], [180, 20], [130, 10]]);
    expect(result[1].geometry.coordinates[0]).toEqual([[-180, 20], [-170, 20], [-180, 10], [-180, 20]]);
    expect(result[2].geometry.coordinates[0]).toEqual([[180, 10], [170, 10], [130, 10], [180, 10]]);
  });

  test('throws an error if any segment has fewer than three unique points', () => {
    // For example, a segment with only two points cannot form a valid linear ring.
    const badSegments = [
      [[130, 10], [170, 10]],  // Only two points.
      [[180, 10], [170, 10], [130, 10]]
    ];

    expect(() => build_polygons(badSegments)).toThrow();
  });
});

describe('extend_over_poles', () => {
  test('extends a left-end segment over the north pole when force_north_pole is true', () => {
    // This segment ends at -180.
    const segments = [
      [[-170, 10], [-180, 15]]
    ];
    // With force_north_pole true and no right endpoint, we expect the segment
    // to be extended over the north pole. The extension appends [-180, 90] and [180, 90],
    // then the segment is reversed.
    const result = extend_over_poles(
      JSON.parse(JSON.stringify(segments)),
      { force_north_pole: true, force_south_pole: false, fix_winding: false }
    );
    // Expected process:
    // Original: [[-170, 10], [-180, 15]]
    // After extension: [[-170, 10], [-180, 15], [-180, 90], [180, 90]]
    // Then reversed: [[180, 90], [-180, 90], [-180, 15], [-170, 10]]
    expect(result[0][0]).toEqual([180, 90]);
    expect(result[0][result[0].length - 1]).toEqual([-170, 10]);
  });

  test('extends a right-end segment over the south pole when force_south_pole is true', () => {
    // This segment ends at 180.
    const segments = [
      [[170, 10], [180, 15]]
    ];
    // With force_south_pole true and no left endpoint for this segment,
    // the segment should be extended over the south pole.
    const result = extend_over_poles(
      JSON.parse(JSON.stringify(segments)),
      { force_south_pole: true, force_north_pole: false, fix_winding: false }
    );
    // Expected process:
    // Original: [[170, 10], [180, 15]]
    // After extension: [[170, 10], [180, 15], [180, -90], [-180, -90]]
    // Then reversed: [[-180, -90], [180, -90], [180, 15], [170, 10]]
    expect(result[0][0]).toEqual([-180, -90]);
    expect(result[0][result[0].length - 1]).toEqual([170, 10]);
  });

  test('returns reversed original segments when both poles are extended and fix_winding is true', () => {
    // Create two segments: one with a left-end and one with a right-end.
    const segments = [
      [[-170, 10], [-180, 5]],  // left-end segment
      [[170, 20], [180, 25]]    // right-end segment
    ];
    // With no force flags and fix_winding true, both conditions will be met:
    // left_end branch (due to !left_start) sets is_over_south_pole,
    // right_end branch (due to !right_start) sets is_over_north_pole.
    // Thus, the function should trigger fix_winding and return the original segments reversed.
    const original = JSON.parse(JSON.stringify(segments));
    const result = extend_over_poles(
      JSON.parse(JSON.stringify(segments)),
      { force_north_pole: false, force_south_pole: false, fix_winding: true }
    );
    // Each segment in result should equal the corresponding original segment reversed.
    for (let i = 0; i < original.length; i++) {
      const reversedOriginal = [...original[i]].reverse();
      expect(result[i]).toEqual(reversedOriginal);
    }
  });

  test('returns segments unchanged when no endpoint is at the pole', () => {
    // Segments with endpoints not on ±180 should remain unchanged.
    const segments = [
      [[100, 10], [120, 20]],
      [[-50, 30], [-40, 40]]
    ];
    const result = extend_over_poles(
      JSON.parse(JSON.stringify(segments)),
      { force_north_pole: false, force_south_pole: false, fix_winding: true }
    );
    expect(result).toEqual(segments);
  });
});

