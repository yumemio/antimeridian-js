import * as turf from '@turf/turf';

const { readInput, readOutput } = require('./conftest');
require('./jestExtensions/toBeCloseGeoJSON');
const { fix_polygon, fix_shape, centroid } = require('../src/index.js');
const { normalize } = require('./helper/normalize');

// Helper function to translate a GeoJSON geometry by (dx, dy)
function translate(geom, dx, dy) {
  if (geom.type === "Polygon") {
    return {
      ...geom,
      coordinates: geom.coordinates.map(ring =>
        ring.map(coord => {
          const [x, y, ...rest] = coord;
          return [x + dx, y + dy, ...rest];
        })
      )
    };
  } else if (geom.type === "MultiPolygon") {
    return {
      ...geom,
      coordinates: geom.coordinates.map(polygon =>
        polygon.map(ring =>
          ring.map(coord => {
            const [x, y, ...rest] = coord;
            return [x + dx, y + dy, ...rest];
          })
        )
      )
    };
  }
  return geom;
}

// Helper function to determine if a ring is counterclockwise using the shoelace formula
function isCCW(ring) {
  let area = 0;
  // Assumes the ring is closed (first point equals last)
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += (x1 * y2 - x2 * y1);
  }
  return area > 0;
}

describe('fix_polygon', () => {
  const names = [
    "almost-180", "complex-split", "crossing-latitude", "extra-crossing", "issues-81",
    "latitude-band", "north-pole", "one-hole", "over-180", "overlap", "point-on-antimeridian",
    "simple", "south-pole", "split", "two-holes"
  ];
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  names.forEach(name => {
    settings.forEach(({ subdirectory, great_circle }) => {
      test(`fix_polygon for ${name} (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
        const input = readInput(name);
        // Expect input to be a Polygon
        expect(input.geometry.type).toBe("Polygon");
        const expected = readOutput(name, subdirectory);
        const fixed = fix_polygon(input, { great_circle });
        expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
      });
    });
  });
});

describe('both poles', () => {
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  settings.forEach(({ subdirectory, great_circle }) => {
    test(`both poles (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
      const input = readInput("both-poles");
      expect(input.geometry.type).toBe("Polygon");
      const expected = readOutput("both-poles", subdirectory);
      const fixed = fix_polygon(input, { fix_winding: false, great_circle });
      expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
    });
  });
});

describe('fix_shape (smoke test)', () => {
  test('fix_shape runs without error for a Polygon', () => {
    const input = readInput("simple");
    const mapped = input; // assuming input is already a valid GeoJSON object
    expect(() => fix_shape(mapped)).not.toThrow();
  });
});

describe('double fix', () => {
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  settings.forEach(({ subdirectory, great_circle }) => {
    test(`double fix (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
      const input = readInput("north-pole");
      const expected = readOutput("north-pole", subdirectory);
      let fixed = fix_polygon(input, { great_circle });
      fixed = fix_polygon(fixed, { great_circle });
      expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
    });
  });
});

describe('force north pole', () => {
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  settings.forEach(({ subdirectory, great_circle }) => {
    test(`force north pole (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
      const input = readInput("force-north-pole");
      const expected = readOutput("force-north-pole", subdirectory);
      const fixed = fix_polygon(input, { force_north_pole: true, great_circle });
      expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
    });
  });
});

describe('dont segment antimeridian overlap', () => {
  const boxes = [
    { minx: -180, maxx: -170 },
    { minx: 170, maxx: 180 },
  ];
  boxes.forEach(({ minx, maxx }) => {
    test(`box with minx=${minx} and maxx=${maxx}`, () => {
      const box = {
        type: "Polygon",
        coordinates: [[
          [minx, -10],
          [maxx, -10],
          [maxx, 10],
          [minx, 10],
          [minx, -10]
        ]]
      };
      const fixed = fix_polygon(box);
      expect(fixed.type).toBe("Polygon");
    });
  });
});

describe('fix winding', () => {
  const names = ["cw-only", "cw-split"];
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  names.forEach(name => {
    settings.forEach(({ subdirectory, great_circle }) => {
      test(`fix winding for ${name} (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
        const input = readInput(name);
        const expected = readOutput(name, subdirectory);
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const fixed = fix_polygon(input, { great_circle });
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
        expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
      });
    });
  });
});

describe('no fix winding', () => {
  const names = ["cw-only", "cw-split"];
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  names.forEach(name => {
    settings.forEach(({ subdirectory, great_circle }) => {
      test(`no fix winding for ${name} (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
        const input = readInput(name);
        const expected = readOutput(`${name}-no-fix`, subdirectory);
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const fixed = fix_polygon(input, { fix_winding: false, great_circle });
        expect(warnSpy).not.toHaveBeenCalled();
        warnSpy.mockRestore();
        expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
      });
    });
  });
});

describe('no fix winding when forcing poles', () => {
  const names = ["cw-only", "cw-split"];
  const poleSettings = [
    { force_north_pole: true, force_south_pole: false },
    { force_north_pole: false, force_south_pole: true },
    { force_north_pole: true, force_south_pole: true },
  ];
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  names.forEach(name => {
    poleSettings.forEach(({ force_north_pole, force_south_pole }) => {
      settings.forEach(({ subdirectory, great_circle }) => {
        test(`no fix winding when forcing poles for ${name} (force_north_pole=${force_north_pole}, force_south_pole=${force_south_pole}, subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
          const input = readInput(name);
          const expected = readOutput(`${name}-no-fix`, subdirectory);
          const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
          const fixed = fix_polygon(input, { force_north_pole, force_south_pole, great_circle });
          expect(warnSpy).not.toHaveBeenCalled();
          warnSpy.mockRestore();
          expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
        });
      });
    });
  });
});

describe('fix winding interior no segments', () => {
  test('all interior rings are not counterclockwise', () => {
    const input = readInput("simple-with-ccw-hole");
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fixed = fix_polygon(input);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    if (fixed.type === "Polygon") {
      const interiors = fixed.coordinates.slice(1);
      interiors.forEach(ring => {
        expect(isCCW(ring)).toBe(false);
      });
    }
  });
});

describe('fix winding interior segments', () => {
  test('fixes interior segments correctly', () => {
    const input = readInput("one-ccw-hole");
    const expected = readOutput("one-hole", "spherical");
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fixed = fix_polygon(input);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
  });
});

describe('centroid', () => {
  test('centroid simple', () => {
    const input = readInput("simple");
    const c = centroid(input);
    expect(c.x).toBe(95);
    expect(c.y).toBe(45);
  });

  test('centroid split', () => {
    const input = readOutput("split");
    const c = centroid(input);
    expect(c.x).toBe(180);
    expect(c.y).toBe(45);
  });

  test('centroid split with shift', () => {
    let input = readInput("split");
    input = translate(input, 1, 0);
    input = fix_polygon(input, { great_circle: false });
    const c = centroid(input);
    expect(c.x).toBe(-179);
    expect(c.y).toBe(45);
  });
});

describe('z coordinates', () => {
  test('preserves Z coordinates', () => {
    const polygon = {
      type: "Polygon",
      coordinates: [[
        [0, 0, 1],
        [10, 0, 2],
        [10, 10, 3],
        [0, 10, 4],
        [0, 0, 1]
      ]]
    };
    const fixed = fix_polygon(polygon);
    // Check that a Z coordinate is present in at least one point
    expect(fixed.coordinates[0][0].length).toBeGreaterThanOrEqual(3);
  });
});

describe('force south pole', () => {
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  settings.forEach(({ subdirectory, great_circle }) => {
    test(`force south pole (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
      const input = readInput("issues-124");
      const expected = readOutput("issues-124", subdirectory);
      const fixed = fix_polygon(input, { force_south_pole: true, great_circle });
      expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
    });
  });
});

describe('great circle', () => {
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  settings.forEach(({ subdirectory, great_circle }) => {
    test(`great circle (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
      const input = readInput("great-circle");
      const expected = readOutput("great-circle", subdirectory);
      const fixed = fix_polygon(input, { great_circle });
      expect(normalize(fixed)).toBeCloseGeoJSON(normalize(expected));
    });
  });
});

