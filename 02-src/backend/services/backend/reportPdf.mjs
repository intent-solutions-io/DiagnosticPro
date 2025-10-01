// ES6 wrapper for verification - imports CommonJS module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import CommonJS module
const { generateDiagnosticProPDF } = require('./reportPdf.js');

// Re-export as ES6 module for verification script
export { generateDiagnosticProPDF };