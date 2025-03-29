import {expect} from '@jest/globals';

function toBeCloseGeoJSON(received, expected, precision = 8) {
  function roundCoords(coords) {
    return Array.isArray(coords[0]) 
      ? coords.map(roundCoords) 
      : coords.map(num => Number(num.toFixed(precision)));
  }

  const roundedReceived = {
    ...received,
    geometry: {
      ...received.geometry,
      coordinates: roundCoords(received.geometry.coordinates),
    },
  };

  const roundedExpected = {
    ...expected,
    geometry: {
      ...expected.geometry,
      coordinates: roundCoords(expected.geometry.coordinates),
    },
  };

  const pass = this.equals(roundedReceived, roundedExpected);

  if (pass) {
    return {
      message: () => `Expected GeoJSON objects not to be approximately equal`,
      pass: true,
    };
  } else {
    return {
      message: () => 
        `GeoJSON coordinates mismatch:\n\n` +
        this.utils.diff(roundedExpected, roundedReceived),
      pass: false,
    };
  }
}

expect.extend({
  toBeCloseGeoJSON
});
