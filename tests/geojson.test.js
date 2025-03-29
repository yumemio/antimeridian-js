const { readInput, readOutput } = require('./conftest');
const { fix_geojson, segment_geojson } = require('../src/index.js');

describe('fix_geojson', () => {
  // Test for a single Feature.
  test.each([true, false])(
    'fixes a Feature preserving properties (great_circle=%s)',
    (great_circle) => {
      const feature = readInput("simple");
      feature.properties = { foo: "bar" };
      console.log(feature)
      const fixed = fix_geojson(feature, { great_circle });
      expect(fixed.properties.foo).toBe("bar");
    }
  );

  // Test for a FeatureCollection.
  test.each([true, false])(
    'fixes a FeatureCollection preserving properties (great_circle=%s)',
    (great_circle) => {
      const inputGeom = readInput("simple").geometry;
      // Create two features (clone the geometry for feature_a)
      const feature_a = {
        type: "Feature",
        geometry: JSON.parse(JSON.stringify(inputGeom)),
        properties: { foo: "bar" },
      };
      const feature_b = {
        type: "Feature",
        geometry: inputGeom,
        properties: { baz: "boz" },
      };
      const feature_collection = {
        type: "FeatureCollection",
        features: [feature_a, feature_b],
        another: "property",
      };
      const fixed = fix_geojson(feature_collection, { great_circle });
      expect(fixed.features[0].properties.foo).toBe("bar");
      expect(fixed.features[1].properties.baz).toBe("boz");
      expect(fixed.another).toBe("property");
    }
  );

  // Test for segmenting a Feature.
  test.each([true, false])(
    'segments a Feature (great_circle=%s)',
    (great_circle) => {
      const feature = readInput("split");
      const fixed = segment_geojson(feature, great_circle);
      // In our JavaScript port, segment_geojson returns a MultiLineString feature.
      // We expect its coordinates array to contain two segments.
      expect(fixed.geometry.type).toBe("MultiLineString");
      expect(fixed.geometry.coordinates.length).toBe(2);
    }
  );
});

