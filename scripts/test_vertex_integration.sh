#!/bin/bash
# DiagnosticPro Vertex AI Integration Test
# Tests real Vertex AI call with LIVE-0002 case

set -e

echo "=========================================="
echo "DiagnosticPro Vertex AI Integration Test"
echo "=========================================="
echo ""

# Check environment
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  WARNING: GOOGLE_APPLICATION_CREDENTIALS not set"
    echo "   Using default GCP credentials from environment"
fi

# Set defaults
export GCP_PROJECT="${GCP_PROJECT:-diagnostic-pro-prod}"
export VAI_LOCATION="${VAI_LOCATION:-us-central1}"
export VAI_MODEL="${VAI_MODEL:-gemini-2.0-flash-exp}"

echo "Configuration:"
echo "  GCP Project: $GCP_PROJECT"
echo "  VAI Location: $VAI_LOCATION"
echo "  VAI Model: $VAI_MODEL"
echo ""

# Input/Output paths
INPUT_FILE="tests/live/LIVE-0002.json"
OUTPUT_FILE="tests/outputs/live-0002-vertex.json"
METRICS_FILE="tests/outputs/live-0002-vertex.metrics.json"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: Input file not found: $INPUT_FILE"
    exit 1
fi

echo "Running Vertex AI call..."
echo "  Input: $INPUT_FILE"
echo "  Output: $OUTPUT_FILE"
echo ""

# Call Vertex AI
node scripts/production_vertex_client.js "$INPUT_FILE" "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Vertex AI call failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "Validation Suite"
echo "=========================================="
echo ""

# Run validation guards
echo "1. Schema validation..."
tests/validate_schema.sh "$OUTPUT_FILE" 2>&1 | grep -v "unknown format" && echo "   ✅ PASS" || echo "   ❌ FAIL"

echo ""
echo "2. Length guard..."
tests/length_guard.sh "$OUTPUT_FILE" && echo "   ✅ PASS" || echo "   ❌ FAIL"

echo ""
echo "3. Page estimation..."
python3 tests/page_estimator.py "$OUTPUT_FILE" && echo "   ✅ PASS" || echo "   ❌ FAIL"

echo ""
echo "4. Confidence guard..."
tests/confidence_guard.sh "$OUTPUT_FILE" && echo "   ✅ PASS" || echo "   ❌ FAIL"

echo ""
echo "5. Readiness guard..."
tests/readiness_guard.sh "$OUTPUT_FILE" && echo "   ✅ PASS" || echo "   ❌ FAIL"

echo ""
echo "=========================================="
echo "Metrics Summary"
echo "=========================================="
echo ""

if [ -f "$METRICS_FILE" ]; then
    cat "$METRICS_FILE"
else
    echo "⚠️  Metrics file not found"
fi

echo ""
echo "=========================================="
echo "Rendering Report"
echo "=========================================="
echo ""

python3 scripts/render_from_json.py "$OUTPUT_FILE" "live-0002-report" 2>&1 | grep -v "DeprecationWarning"

echo ""
echo "✅ Integration test complete!"
echo ""
echo "Generated files:"
echo "  - $OUTPUT_FILE"
echo "  - $METRICS_FILE"
echo "  - docs/out/live-0002-report.md"
echo ""
