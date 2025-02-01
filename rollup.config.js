import terser from '@rollup/plugin-terser';

export default [
  // ESM Build
  {
    input: "src/index.js",
    output: {
      file: "dist/index.esm.js",
      format: "esm"
    },
    plugins: [terser()]
  },
  // CommonJS Build
  {
    input: "src/index.js",
    output: {
      file: "dist/index.cjs.js",
      format: "cjs"
    },
    plugins: [terser()]
  }
];
