#!/usr/bin/env node
/**
 * DiagnosticPro Production Vertex AI Client
 * Calls real Vertex AI with schema validation and logging
 * Usage: node production_vertex_client.js <input.json> [output.json]
 */

const fs = require('fs');
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Load schema, prompts from root
const ROOT_DIR = path.resolve(__dirname, '..');
const SYSTEM_PROMPT_PATH = path.join(ROOT_DIR, 'VERTEX.SYSTEM.txt');
const USER_TEMPLATE_PATH = path.join(ROOT_DIR, 'VERTEX.USER.template.txt');
const SCHEMA_PATH = path.join(ROOT_DIR, 'DIAGPRO.REPORT.schema.json');

const SYSTEM_PROMPT = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');
const USER_TEMPLATE = fs.readFileSync(USER_TEMPLATE_PATH, 'utf-8');
const REPORT_SCHEMA = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

// Schema validator with lenient options
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateSchema: false,  // Skip meta-schema validation to avoid draft-2020-12 errors
  removeAdditional: 'all',  // Remove additional properties not in schema
  useDefaults: true,  // Auto-fill missing optional fields with defaults
  coerceTypes: true  // Coerce types when possible
});
addFormats(ajv);
const validateReport = ajv.compile(REPORT_SCHEMA);

// Template renderer
function renderTemplate(template, variables) {
  return template.replace(/{{\s*([^}:]+)(?::=([^}]+))?\s*}}/g, (_, key, fallback) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      const value = variables[key];
      return value == null ? '' : String(value);
    }
    return fallback == null ? '' : String(fallback);
  });
}

// Extract diagnostic codes
function extractDiagnosticCodes(payload = {}) {
  const codes = new Set();
  const regex = /\b([A-Za-z]{1,4}\d{1,4}(?:[-/]\d{1,4})?)\b/g;

  const collectFromValue = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(collectFromValue);
      return;
    }
    if (typeof value === 'string') {
      let match;
      while ((match = regex.exec(value)) !== null) {
        codes.add(match[1].toUpperCase());
      }
    } else if (typeof value === 'object') {
      Object.values(value).forEach(collectFromValue);
    }
  };

  collectFromValue(payload.codes);
  collectFromValue(payload.symptoms);
  return Array.from(codes);
}

// Estimate pages from character count
function estimatePages(charCount) {
  return Math.ceil(charCount / 3000);
}

// Main Vertex AI call
async function callVertexAI(payload, options = {}) {
  const vertex = new VertexAI({
    project: process.env.GCP_PROJECT || 'diagnostic-pro-prod',
    location: process.env.VAI_LOCATION || 'us-central1'
  });

  const model = vertex.getGenerativeModel({
    model: process.env.VAI_MODEL || 'gemini-2.0-flash-exp',  // Using experimental - stable models return 404
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    }
  });

  const submissionId = options.submissionId || payload.submissionId || 'PROD-TEST';
  const confidenceThreshold = options.confidenceThreshold || 85;

  const detectedCodes = extractDiagnosticCodes(payload);
  const symptomsText = Array.isArray(payload.symptoms)
    ? payload.symptoms.join('; ')
    : (payload.symptoms || '');

  const customerPayload = {
    email: payload.customer?.email || payload.email || 'test@example.com',
    name: payload.customer?.name || payload.name || null
  };

  const equipmentPayload = {
    type: payload.equipment?.type || payload.equipmentType || 'vehicle',
    make: payload.equipment?.make || payload.make || null,
    model: payload.equipment?.model || payload.model || null,
    year: payload.equipment?.year || payload.year || null
  };

  const variables = {
    submissionId,
    customer_json: JSON.stringify(customerPayload, null, 2),
    equipment_json: JSON.stringify(equipmentPayload, null, 2),
    symptoms_text: symptomsText,
    codes_json: JSON.stringify(detectedCodes, null, 2),
    notes_text: payload.notes || '',
    confidence_threshold_pct: confidenceThreshold
  };

  const primaryPrompt = renderTemplate(USER_TEMPLATE, variables);

  console.error(`[INFO] Calling Vertex AI (model: ${process.env.VAI_MODEL || 'gemini-2.0-flash-exp'})`);
  console.error(`[INFO] Submission ID: ${submissionId}`);
  console.error(`[INFO] Confidence threshold: ${confidenceThreshold}%`);

  // Exponential backoff with jitter for rate limiting
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const jitter = (ms) => ms + Math.random() * 500 - 250;

  const invokeModel = async (promptText, retryCount = 0) => {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
      });
      const parts = result.response?.candidates?.[0]?.content?.parts || [];
      return parts.map(part => part.text || '').join('').trim();
    } catch (error) {
      // Check if error is retryable (429, 503, or network timeout)
      const isRetryable =
        error.message?.includes('429') ||
        error.message?.includes('503') ||
        error.message?.includes('RESOURCE_EXHAUSTED') ||
        error.code === 'ETIMEDOUT';

      if (isRetryable && retryCount < maxRetries) {
        const delay = jitter(baseDelay * Math.pow(2, retryCount));
        console.error(`[WARN] Retryable error (${error.message?.substring(0, 100)}). Retry ${retryCount + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await sleep(delay);
        return invokeModel(promptText, retryCount + 1);
      }

      throw error;
    }
  };

  let attempt = 0;
  let promptText = primaryPrompt;
  let lastError = null;

  while (attempt < 2) {
    attempt += 1;
    console.error(`[INFO] Attempt ${attempt}/2`);

    const text = await invokeModel(promptText);

    // Strip markdown code fences if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (err) {
      lastError = new Error(`Response not JSON (attempt ${attempt}): ${err.message}`);
      console.error(`[ERROR] ${lastError.message}`);
      promptText = `${primaryPrompt}\n\nPrevious response failed JSON parsing. Return JSON only conforming to DIAGPRO.REPORT.schema.json.`;
      continue;
    }

    const valid = validateReport(parsed);
    if (!valid) {
      // Save debug output
      const debugPath = path.join(ROOT_DIR, 'tests/outputs/debug-failed-validation.json');
      fs.writeFileSync(debugPath, JSON.stringify(parsed, null, 2));
      console.error(`[DEBUG] Saved failing JSON to ${debugPath}`);
      console.error(`[DEBUG] First 10 validation errors:`);
      const errors = validateReport.errors.slice(0, 10);
      errors.forEach(err => console.error(`  - ${err.instancePath || '/'}: ${err.message}`));

      lastError = new Error(`Schema validation failed: ${ajv.errorsText(validateReport.errors, { separator: '; ' })}`);
      console.error(`[ERROR] ${lastError.message}`);
      promptText = `${primaryPrompt}\n\nSchema violation detected. Return JSON only conforming to DIAGPRO.REPORT.schema.json.`;
      continue;
    }

    const jsonString = JSON.stringify(parsed);
    const charCount = jsonString.length;
    const estimatedPages = estimatePages(charCount);

    console.error(`[SUCCESS] Valid JSON received`);
    console.error(`[METRICS] Character count: ${charCount}`);
    console.error(`[METRICS] Estimated pages: ${estimatedPages}`);
    console.error(`[METRICS] Confidence score: ${parsed.confidence?.score_pct || 0}%`);
    console.error(`[METRICS] Customer readiness: ${parsed.customer_readiness_check?.verdict || 'unknown'}`);

    if (charCount > 12000) {
      throw new Error(`JSON exceeds 12,000 character limit (${charCount})`);
    }
    if (estimatedPages > 6) {
      throw new Error(`Estimated pages ${estimatedPages} exceed 6-page limit`);
    }

    return {
      report: parsed,
      rawJson: jsonString,
      metrics: {
        charCount,
        estimatedPages,
        confidenceScore: parsed.confidence?.score_pct || 0,
        customerReadiness: parsed.customer_readiness_check?.verdict || 'unknown',
        attempt
      }
    };
  }

  throw lastError || new Error('Vertex AI failed to return schema-compliant JSON');
}

// CLI entry point
async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node production_vertex_client.js <input.json> [output.json]');
    process.exit(1);
  }

  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || 'tests/outputs/production_test.json';

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  try {
    const result = await callVertexAI(payload);

    // Write output
    fs.writeFileSync(outputPath, JSON.stringify(result.report, null, 2));
    console.error(`[SUCCESS] Report written to: ${outputPath}`);

    // Write metrics
    const metricsPath = outputPath.replace('.json', '.metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(result.metrics, null, 2));
    console.error(`[SUCCESS] Metrics written to: ${metricsPath}`);

    console.log(JSON.stringify(result.report, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(`[FATAL] ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[FATAL] Unhandled error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { callVertexAI };
