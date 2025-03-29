import * as turf from '@turf/turf';

const { readInput, readOutput } = require('./conftest');
const { fix_multipolygon, fix_shape } = require('../src/index.js'); // Adjust the path as needed

describe('fix_multipolygon', () => {
  // Parameterize over two test names and two subdirectories/great_circle settings.
  const names = ["multi-split", "multi-no-antimeridian"];
  const settings = [
    { subdirectory: "flat", great_circle: false },
    { subdirectory: "spherical", great_circle: true },
  ];
  names.forEach((name) => {
    settings.forEach(({ subdirectory, great_circle }) => {
      test(`fixes a MultiPolygon ${name} (subdirectory=${subdirectory}, great_circle=${great_circle})`, () => {
        const input = readInput(name);
        // In our port, we expect the input to be a MultiPolygon GeoJSON object.
        const expected = readOutput(name, subdirectory);
        const fixed = fix_multipolygon(input, { great_circle });
        // We assume our fixed MultiPolygon is valid and exactly matches the expected output.
        expect(fixed).toEqual(expected);
      });
    });
  });
});

// A smoke test for fix_shape.
describe('fix_shape (smoke test)', () => {
  test.each([true, false])(
    'fix_shape runs without error for a MultiPolygon (great_circle=%s)',
    (great_circle) => {
      const input = readInput("multi-split");
      // If fix_shape expects a raw geometry, we might call JSON.parse(JSON.stringify(input))
      // to simulate the mapping.
      const mapped = input; // assuming our input is already in GeoJSON format.
      // We simply check that the call does not throw.
      expect(() => fix_shape(mapped, { great_circle })).not.toThrow();
    }
  );
});

