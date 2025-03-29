const fs = require('fs');
const path = require('path');
import * as turf from '@turf/turf';

// Define the directories relative to the current file.
const TEST_DATA_DIRECTORY = path.join(__dirname, 'data');
const INPUT_DATA_DIRECTORY = path.join(TEST_DATA_DIRECTORY, 'input');
const OUTPUT_DATA_DIRECTORY = path.join(TEST_DATA_DIRECTORY, 'output');

/**
 * Reads a JSON file from the given file path.
 * @param {string} filePath - Full path to the JSON file.
 * @returns {Object} Parsed JSON data.
 */
function readFile(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Reads input test data from the 'input' directory.
 * @param {string} name - Base name of the file (without extension).
 * @param {string|null} [subdirectory=null] - Optional subdirectory.
 * @returns {Object} The parsed JSON object.
 */
function readInput(name, subdirectory = null) {
  const filePath = subdirectory
    ? path.join(INPUT_DATA_DIRECTORY, subdirectory, `${name}.json`)
    : path.join(INPUT_DATA_DIRECTORY, `${name}.json`);
  const geometry = readFile(filePath);
  return turf.feature(geometry);
}

/**
 * Reads expected output test data from the 'output' directory.
 * By default, it looks in the 'flat' subdirectory.
 * @param {string} name - Base name of the file (without extension).
 * @param {string} [subdirectory='flat'] - Subdirectory (e.g., 'flat' or 'spherical').
 * @returns {Object} The parsed JSON object.
 */
function readOutput(name, subdirectory = 'flat') {
  const filePath = subdirectory
    ? path.join(OUTPUT_DATA_DIRECTORY, subdirectory, `${name}.json`)
    : path.join(OUTPUT_DATA_DIRECTORY, `${name}.json`);
  const geometry = readFile(filePath);
  return turf.feature(geometry)
}

/**
 * Constructs the full path for an input file.
 * @param {string} name - Base name of the file (without extension).
 * @returns {string} Full path to the JSON file in the input directory.
 */
function inputPath(name) {
  return path.join(INPUT_DATA_DIRECTORY, `${name}.json`);
}

module.exports = {
  readInput,
  readOutput,
  inputPath,
};

