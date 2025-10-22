#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_PATH="${ROOT_DIR}/DIAGPRO.REPORT.schema.json"
GOLDEN_DIR="${ROOT_DIR}/tests/golden"
BACKEND_DIR="${ROOT_DIR}/02-src/backend/services/backend"

(
  cd "${BACKEND_DIR}" && \
  ROOT_DIR="${ROOT_DIR}" SCHEMA_PATH="${SCHEMA_PATH}" GOLDEN_DIR="${GOLDEN_DIR}" node <<'NODE'
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const Ajv2020 = require('ajv/dist/2020');

const schemaPath = process.env.SCHEMA_PATH;
const goldenDir = process.env.GOLDEN_DIR;

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const files = glob.sync(path.join(goldenDir, '*.json'));
let hasError = false;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const valid = validate(data);
  if (!valid) {
    console.error(`Validation failed for ${path.basename(file)}:`);
    console.error(ajv.errorsText(validate.errors, { separator: '\n  ' }));
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}
NODE
)
