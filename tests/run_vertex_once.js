#!/usr/bin/env node
/**
 * Helper to execute a single Vertex AI request using the new schema-driven prompts.
 * Usage: node tests/run_vertex_once.js mocks/mock_A_vehicle_high_confidence.json output.json
 */

const fs = require('fs');
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || null;

  if (!inputPath) {
    console.error('Usage: node tests/run_vertex_once.js <input.json> [output.json]');
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, '..');
  const systemPath = path.join(rootDir, 'VERTEX.SYSTEM.txt');
  const templatePath = path.join(rootDir, 'VERTEX.USER.template.txt');
  const schemaPath = path.join(rootDir, 'DIAGPRO.REPORT.schema.json');

  const systemInstruction = fs.readFileSync(systemPath, 'utf-8');
  const template = fs.readFileSync(templatePath, 'utf-8');
  const payload = JSON.parse(fs.readFileSync(path.resolve(rootDir, inputPath), 'utf-8'));

  const variables = {
    submissionId: payload.submissionId,
    customer_json: JSON.stringify(payload.customer || {}, null, 2),
    equipment_json: JSON.stringify(payload.equipment || {}, null, 2),
    symptoms_text: payload.symptoms || '',
    codes_json: JSON.stringify(payload.codes || [], null, 2),
    notes_text: payload.notes || '',
    confidence_threshold_pct: 85
  };

  const userPrompt = renderTemplate(template, variables);

  const vertex = new VertexAI({
    project: process.env.GCP_PROJECT,
    location: process.env.VAI_LOCATION || 'us-central1'
  });

  const model = vertex.getGenerativeModel({
    model: process.env.VAI_MODEL || 'gemini-2.0-flash-exp',
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
  });

  const text = (result.response?.candidates?.[0]?.content?.parts || [])
    .map(part => part.text || '')
    .join('')
    .trim();

  if (!text.startsWith('{')) {
    throw new Error(`Vertex response is not JSON:\n${text}`);
  }

  const parsed = JSON.parse(text);
  if (outputPath) {
    fs.writeFileSync(path.resolve(rootDir, outputPath), JSON.stringify(parsed, null, 2));
    console.log(`Saved Vertex output to ${outputPath}`);
  } else {
    console.log(JSON.stringify(parsed, null, 2));
  }
}

function renderTemplate(tpl, vars) {
  return tpl.replace(/{{\s*([^}:]+)(?::=([^}]+))?\s*}}/g, (_, key, fallback) => {
    const value = Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : fallback;
    return value != null ? String(value) : '';
  });
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
