import {
  helloWorld,
  spherical_degrees_to_cartesian,
  crossing_latitude_great_circle,
  crossing_latitude_flat
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

