import * as turf from '@turf/turf';

const { readInput, readOutput } = require('./conftest');
const { fix_line_string, fix_multi_line_string } = require('../src/index.js');

describe('fix_line_string', () => {
  test.each([true, false])(
    'fixes a LineString correctly (great_circle=%s)',
    (great_circle) => {
      const input = readInput("line");
      const expected = readOutput("line");
      const fixed = fix_line_string(input, great_circle);
      expect(fixed).toBeCloseTo(expected);
    }
  );
});

describe('fix_multi_line_string', () => {
  test.each([true, false])(
    'fixes a MultiLineString correctly (great_circle=%s)',
    (great_circle) => {
      const input = readInput("multi-line");
      const expected = readOutput("multi-line");
      const fixed = fix_multi_line_string(input, great_circle);
      expect(fixed).toEqual(expected);
    }
  );
});

