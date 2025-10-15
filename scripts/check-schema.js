#!/usr/bin/env node
const fs = require('fs');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const schema = JSON.parse(fs.readFileSync('DIAGPRO.REPORT.schema.json', 'utf-8'));
const report = JSON.parse(fs.readFileSync('tests/outputs/live-0002-vertex.json', 'utf-8'));

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateSchema: false,
  removeAdditional: 'all',
  useDefaults: true,
  coerceTypes: true
});
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(report);

if (!valid) {
  console.log('Schema validation errors:');
  validate.errors.forEach(err => {
    console.log('  -', err.instancePath || '/', ':', err.message);
  });
  process.exit(1);
} else {
  console.log('✅ Schema validation passed!');
  process.exit(0);
}
