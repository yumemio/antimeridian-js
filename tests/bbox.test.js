const { readOutput } = require('./conftest');
const { bbox } = require('../src/index.js'); // Adjust the path as needed

describe('bbox', () => {
  test.each([
    ["simple", [90, 40, 100, 50]],
    ["split", [170, 40, -170, 50]],
    ["multi-no-antimeridian", [90, 10, 100, 50]],
    ["north-pole", [-180, 40, 180, 90]],
    ["ocean", [-180, -85.609, 180, 90]],
  ])("returns correct bbox for '%s'", (name, expected) => {
    const shape = readOutput(name);
    const result = bbox(shape);
    expect(result).toEqual(expected);
  });

  test('returns forced antimeridian bbox when requested', () => {
    const expected = [
      179.96779787822723,
      -19.044135782844712,
      -179.77058698198195,
      -18.555752850452095,
    ];
    const shape = readOutput("issues-134");
    const result = bbox(shape, true);
    expect(result).toEqual(expected);
  });
});

