#!/usr/bin/env bash
set -euo pipefail

echo "🚀 DiagnosticPro PDF Generator Bootstrap"
echo "Fixing: Module system, variable naming, paths, Taskwarrior setup"

# --- paths ---
mkdir -p scripts

# --- create setup_tasks.sh ---
cat > scripts/setup_tasks.sh <<'SETUP'
#!/usr/bin/env bash
set -euo pipefail
echo "Setting up Taskwarrior tasks for DiagnosticPro PDF Generator..."

task add project:diagnosticpro +SETUP priority:H "Verify environment (Node, pdfkit, fonts)"
task add project:diagnosticpro +SETUP priority:H "Fix variable naming: equipmentType vs equipment_type"
task add project:diagnosticpro +SETUP priority:H "Convert CommonJS to ES6 modules for verification"

# 14 build tasks
task add project:diagnosticpro +BUILD priority:M "Implement 🎯 PRIMARY DIAGNOSIS"
task add project:diagnosticpro +BUILD priority:M "Implement 🔍 DIFFERENTIAL DIAGNOSIS"
task add project:diagnosticpro +BUILD priority:M "Implement ✅ DIAGNOSTIC VERIFICATION"
task add project:diagnosticpro +BUILD priority:M "Implement ❓ SHOP INTERROGATION"
task add project:diagnosticpro +BUILD priority:M "Implement 🗣️ CONVERSATION SCRIPTING"
task add project:diagnosticpro +BUILD priority:M "Implement 💸 COST BREAKDOWN"
task add project:diagnosticpro +BUILD priority:M "Implement 🚩 RIPOFF DETECTION"
task add project:diagnosticpro +BUILD priority:M "Implement ⚖️ AUTHORIZATION GUIDE"
task add project:diagnosticpro +BUILD priority:M "Implement 🔧 TECHNICAL EDUCATION"
task add project:diagnosticpro +BUILD priority:M "Implement 📦 OEM PARTS STRATEGY"
task add project:diagnosticpro +BUILD priority:M "Implement 💬 NEGOTIATION TACTICS"
task add project:diagnosticpro +BUILD priority:M "Implement 🔬 LIKELY CAUSES (RANKED)"
task add project:diagnosticpro +BUILD priority:M "Implement 📊 RECOMMENDATIONS"
task add project:diagnosticpro +BUILD priority:M "Implement 🔗 SOURCE VERIFICATION"

# verify tasks
task add project:diagnosticpro +VERIFY priority:H "Run verification script and confirm report.pdf"
task add project:diagnosticpro +VERIFY priority:H "Check header/footer/disclaimer/contact info"

echo "✅ Taskwarrior tasks created. Use: task project:diagnosticpro list"
SETUP
chmod +x scripts/setup_tasks.sh

# --- create verify_pdf_generator.sh ---
cat > scripts/verify_pdf_generator.sh <<'VERIFIER'
#!/usr/bin/env bash
set -euo pipefail

# ===== CONFIG =====
GENERATOR_PATH="02-src/backend/services/backend/reportPdf.js"
FONT_REG="02-src/backend/services/backend/fonts/IBMPlexMono-Regular.ttf"
FONT_BOLD="02-src/backend/services/backend/fonts/IBMPlexMono-Bold.ttf"
OUT_PDF="/tmp/diagpro-test-report.pdf"
REQUIRED_STRINGS=(
  "DiagnosticPro AI Analysis Report"
  "Submission Summary"
  "Vehicle Information"
  "🎯 1. PRIMARY DIAGNOSIS"
  "🔍 2. DIFFERENTIAL DIAGNOSIS"
  "✅ 3. DIAGNOSTIC VERIFICATION"
  "❓ 4. SHOP INTERROGATION"
  "🗣️ 5. CONVERSATION SCRIPTING"
  "💸 6. COST BREAKDOWN"
  "🚩 7. RIPOFF DETECTION"
  "⚖️ 8. AUTHORIZATION GUIDE"
  "🔧 9. TECHNICAL EDUCATION"
  "📦 10. OEM PARTS STRATEGY"
  "💬 11. NEGOTIATION TACTICS"
  "🔬 12. LIKELY CAUSES (RANKED)"
  "📊 13. RECOMMENDATIONS"
  "🔗 14. SOURCE VERIFICATION"
  "Disclaimer & Legal Notice"
  "support@diagnsoticpro.io"
  "intentsolutions.io"
  "startaitools.com"
)

fail(){ echo "FAIL: $*" >&2; exit 1; }
warn(){ echo "WARN: $*" >&2; }
ok(){   echo "OK: $*"; }
need_cmd(){ command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"; }

# ===== PRECHECKS =====
need_cmd node
need_cmd npm
need_cmd grep
need_cmd file
[[ -f "$GENERATOR_PATH" ]] || fail "generator missing: $GENERATOR_PATH"
[[ -f "$FONT_REG"  ]] || fail "font missing: $FONT_REG"
[[ -f "$FONT_BOLD" ]] || fail "font missing: $FONT_BOLD"

# Check pdfkit in correct directory
cd 02-src/backend/services/backend
npm ls pdfkit >/dev/null 2>&1 || fail "pdfkit not installed. Run: npm i pdfkit"
cd - >/dev/null
ok "env ready"

# Optional tools
HAS_GSUTIL=0; command -v gsutil >/dev/null 2>&1 && HAS_GSUTIL=1
HAS_TASK=0;   command -v task   >/dev/null 2>&1 && HAS_TASK=1
HAS_TXT=0;    command -v pdftotext >/dev/null 2>&1 && HAS_TXT=1

# ===== TEMP RUNNER =====
TMP_RUNNER="$(mktemp -t genpdf.XXXXXX).mjs"
cat > "$TMP_RUNNER" <<'EOF'
import { generateDiagnosticProPDF } from './02-src/backend/services/backend/reportPdf.js';
const outPath = process.env.OUT_PDF || '/tmp/diagpro-test-report.pdf';

const submission = {
  id: "diag_test_001",
  make: "Volkswagen", model: "Atlas", year: "2018",
  equipment_type: "vehicle", serial_number: "SN-TEST-123", mileage_hours: "131000",
  full_name: "Test User", email: "test@example.com", phone: "555-000-1111",
  problem_description: "Airbag light intermittent.",
  symptoms: ["Airbag light on", "Intermittent alert chime"],
  error_codes: ["B1016", "U0151"],
  when_started: "2 weeks ago", frequency: "intermittent", urgency_level: "medium",
  location_environment: "urban", usage_pattern: "daily commute",
  previous_repairs: "none", modifications: "none", troubleshooting_steps: "battery reset",
  shop_quote_amount: "$350", shop_recommendation: "replace airbag control module"
};

const analysis = {
  primaryDiagnosis: "Likely failing airbag control module (75% confidence).",
  differentialDiagnosis: ["Clock spring wear (15%)","Harness connector corrosion (10%)"],
  diagnosticVerification: {
    text: "Perform scan tool full SRS readout; verify supply and ground.",
    tools: ["OEM scan tool","DVOM"],
    expectedReadings: ["SRS supply 12–14V","Ground < 0.1Ω"],
    costs: ["1.0 hr diag time"]
  },
  shopInterrogation: ["Show freeze-frame data/code history.","What tests confirm the module is faulty?"],
  conversationScripting: {
    opening: "I want to understand the testing you performed.",
    phrasing: "Can you walk me through the exact steps?",
    dialogue: "Which pins did you test for voltage and ground?",
    bodyLanguage: "Calm, direct eye contact.",
    responseHandling: "If defensive, restate curiosity.",
    exitStrategy: "Thank and request written estimate.",
    neverSay: ["My AI report says..."],
    alwaysSay: ["I've done some research and want to understand..."]
  },
  costBreakdown: ["Module $220–$420","Labor 1.0–1.5 hr"],
  ripoffDetection: ["No test data provided","Immediate module replacement without verification"],
  authorizationGuide: {
    approve: ["Full SRS scan and load test"],
    reject: ["Parts cannon replacement without proof"],
    secondOpinion: ["If no test results are shared"]
  },
  technicalEducation: ["SRS requires stable supply/ground","Intermittents often wiring or module"],
  oemPartsStrategy: ["Use OEM module; program as required"],
  negotiationTactics: ["Ask for test results and time on ticket"],
  likelyCausesRanked: ["Airbag control module (75%)","Clock spring (15%)","Connector corrosion (10%)"],
  recommendations: ["Run verification tests","Inspect connectors","Program new module if confirmed"],
  sourceVerification: ["OEM TSB if applicable","NHTSA complaints search"]
};

await generateDiagnosticProPDF(submission, analysis, outPath);
console.log("PDF_written", outPath);
EOF

# ===== GENERATE =====
export OUT_PDF="$OUT_PDF"
node "$TMP_RUNNER"
[[ -f "$OUT_PDF" ]] || fail "PDF not created: $OUT_PDF"
file "$OUT_PDF" | grep -qi 'PDF' || fail "not a PDF file?"
SHA=$(sha256sum "$OUT_PDF" | awk '{print $1}')
ok "pdf: $OUT_PDF"
ok "sha256: $SHA"

# ===== CONTENT CHECKS =====
if [[ $HAS_TXT -eq 1 ]]; then
  TXT="/tmp/diagpro-test-report.txt"
  pdftotext "$OUT_PDF" "$TXT" || warn "pdftotext failed"
  if [[ -f "$TXT" ]]; then
    for s in "${REQUIRED_STRINGS[@]}"; do
      grep -Fq "$s" "$TXT" || fail "missing text: $s"
    done
    ok "content checks passed"
  fi
else
  warn "pdftotext not installed; skipping text checks"
fi

# ===== OPTIONAL GCS UPLOAD =====
if [[ "${REPORT_BUCKET:-}" != "" && $HAS_GSUTIL -eq 1 ]]; then
  TARGET="gs://${REPORT_BUCKET}/test/diagpro-$(date +%s).pdf"
  gsutil cp "$OUT_PDF" "$TARGET"
  gsutil ls "$TARGET" >/dev/null 2>&1 || fail "upload verify failed: $TARGET"
  ok "uploaded: $TARGET"
else
  warn "GCS upload skipped (set REPORT_BUCKET and install gsutil)"
fi

# ===== TASKWARRIOR AUDIT =====
if [[ $HAS_TASK -eq 1 ]]; then
  echo "📋 Taskwarrior Status:"
  task project:diagnosticpro list 2>/dev/null || warn "No diagnosticpro tasks found"
else
  warn "Taskwarrior not found"
fi

echo "ALL CHECKS PASSED"
VERIFIER
chmod +x scripts/verify_pdf_generator.sh

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "📋 Next steps:"
echo "1) bash scripts/setup_tasks.sh                                    # Create Taskwarrior tasks"
echo "2) export REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1  # Optional GCS upload"
echo "3) scripts/verify_pdf_generator.sh                               # Test current system"
echo ""
echo "🔧 Critical issues identified:"
echo "   - Module system: CommonJS → ES6 needed for verification"
echo "   - Variable naming: equipmentType vs equipment_type mismatch"
echo "   - Path references: Updated for 02-src/backend/services/backend/"
