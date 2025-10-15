# Live Vertex AI Test Plan

**Document**: 050-tst-live-vertex-test-plan.md
**Date**: 2025-10-15
**Status**: ⏳ READY FOR MANUAL EXECUTION
**Test Case**: LIVE-0002 (HVAC Compressor)

---

## Test Execution Blocked

### Blocker
The live Vertex AI test requires the `@google-cloud/vertexai` npm package, which is not installed in the current environment. The test script `scripts/test_vertex_integration.sh` is ready, but dependencies must be installed first.

### Error Encountered
```
Error: Cannot find module '@google-cloud/vertexai'
Require stack:
- /home/jeremy/000-projects/diagnostic-platform/DiagnosticPro/scripts/production_vertex_client.js
```

---

## Manual Execution Steps

### Prerequisites
1. **Install Dependencies**:
   ```bash
   cd 02-src/backend/services/backend
   npm install @google-cloud/vertexai
   ```

2. **Set Environment Variables**:
   ```bash
   export GCP_PROJECT="diagnostic-pro-prod"
   export VAI_LOCATION="us-central1"
   export VAI_MODEL="gemini-2.0-flash-exp"
   ```

3. **Verify GCP Authentication**:
   ```bash
   gcloud auth list
   gcloud config set project diagnostic-pro-prod
   ```

### Test Execution
```bash
cd /home/jeremy/000-projects/diagnostic-platform/DiagnosticPro
bash scripts/test_vertex_integration.sh
```

---

## Test Case: LIVE-0002

### Input Data
**File**: `tests/live/LIVE-0002.json`

```json
{
  "submissionId": "LIVE-0002-HVAC-COMPRESSOR",
  "customer": {
    "email": "sarah.mitchell@example.com",
    "name": "Sarah Mitchell"
  },
  "equipment": {
    "type": "hvac",
    "make": "Carrier",
    "model": "Infinity 18",
    "year": "2019"
  },
  "symptoms": "Central AC not cooling properly. Unit runs continuously but house temperature won't drop below 78°F even when set to 72°F. Outside condenser unit is running but doesn't seem as loud as usual. No ice buildup on lines. System was serviced 6 months ago with refrigerant top-off. Energy bills have increased 30% over last 2 months despite no usage changes.",
  "codes": ["E1", "COMP_FAULT"],
  "notes": "Technician last visit said refrigerant was 'a bit low' but didn't explain why. No visible leaks found. Filter replaced monthly.",
  "confidence_threshold_pct": 85
}
```

### Expected Test Flow
1. **Vertex AI Call**: `scripts/production_vertex_client.js`
   - Input: `tests/live/LIVE-0002.json`
   - Output: `tests/outputs/live-0002-vertex.json`
   - Metrics: `tests/outputs/live-0002-vertex.metrics.json`

2. **Validation Guards**:
   - ✅ Schema validation (`tests/validate_schema.sh`)
   - ✅ Length guard (≤12,000 characters)
   - ✅ Page estimation (≤4 typical, ≤6 max)
   - ✅ Confidence gating (≥85% or uplift list)
   - ✅ Readiness check (verdict present)

3. **Report Rendering**:
   - Markdown: `docs/out/live-0002-report.md`
   - PDF: `docs/out/live-0002-report.pdf` (if pandoc available)

---

## Validation Criteria

### Schema Validation
- **Requirement**: Output must match `0.0.0.docs/010-sch-diagpro-report-schema.json`
- **Script**: `tests/validate_schema.sh`
- **Pass Criteria**: Valid JSON schema

### Length Guard
- **Requirement**: Total report length ≤ 12,000 characters
- **Script**: `tests/length_guard.sh`
- **Pass Criteria**: Character count within limit
- **Failure Action**: Truncate content, add warning banner

### Page Estimation
- **Requirement**: Estimated pages ≤ 4 (typical), ≤ 6 (max)
- **Script**: `tests/page_estimator.py`
- **Calculation**: ~500 words/page, ~5 chars/word
- **Pass Criteria**: Reasonable page count for customer consumption

### Confidence Guard
- **Requirement**: Primary diagnosis confidence ≥ 85% or uplift list present
- **Script**: `tests/confidence_guard.sh`
- **Pass Criteria**:
  - `confidence_pct >= 85` OR
  - `uplift_questions` array populated
- **Failure Action**: Generate 5+ uplift questions

### Readiness Check
- **Requirement**: `customer_readiness_check.verdict` field present
- **Script**: `tests/readiness_guard.sh`
- **Options**: "AUTHORIZE", "REJECT", "SECOND_OPINION"
- **Pass Criteria**: Verdict field exists with valid value

---

## Expected Outputs

### Success Case
```bash
✅ Integration test complete!

Generated files:
  - tests/outputs/live-0002-vertex.json
  - tests/outputs/live-0002-vertex.metrics.json
  - docs/out/live-0002-report.md
  - docs/out/live-0002-report.pdf (if pandoc available)

Validation Results:
  1. Schema validation: ✅ PASS
  2. Length guard: ✅ PASS
  3. Page estimation: ✅ PASS (3.2 pages)
  4. Confidence guard: ✅ PASS (92% confidence)
  5. Readiness guard: ✅ PASS (AUTHORIZE)

Metrics:
  - Latency: ~4-8 seconds
  - Token usage: ~5,000-8,000 tokens
  - Cost: ~$0.015-0.025
```

### Failure Case
If any guard fails, the test will retry once. If retry fails:
- Restore to safety tag: `safety-20251015-174359`
- Print blocker details
- Halt release process

---

## Production Considerations

### Vertex AI Configuration
- **Project**: `diagnostic-pro-prod`
- **Location**: `us-central1`
- **Model**: `gemini-2.0-flash-exp` (or `gemini-2.5-flash-002`)
- **Timeout**: 30 seconds
- **Retry Strategy**: 3 attempts with exponential backoff

### Cost Estimate
- **Vertex AI**: ~$0.02 per test run
- **Storage**: Negligible
- **Network**: Negligible
- **Total**: ~$0.02 per execution

### Rate Limits
- **Vertex AI**: 60 requests/minute
- **Current Usage**: ~12 requests/day
- **Test Impact**: Minimal (adds 1 request)

---

## Rollback Plan

If the live test fails and cannot be recovered:

1. **Immediate Rollback**:
   ```bash
   git checkout safety-20251015-174359
   git tag -d v1.1.1
   git push origin :refs/tags/v1.1.1
   gh release delete v1.1.1
   ```

2. **Restore Safety State**:
   - All commits after `safety-20251015-174359` are on safety branch
   - Main branch protection requires PR (already blocked direct push)
   - No customer impact (production unchanged)

3. **Debug & Retry**:
   - Review Vertex AI logs
   - Check schema compatibility
   - Verify prompt templates
   - Test with LIVE-0001 instead
   - Re-run with corrected configuration

---

## Post-Test Actions

### If Test Passes
1. Document test results in release notes
2. Archive test outputs to `.github/audits/v1.1.1/`
3. Proceed with PHASE 7 (artifact archiving)
4. Complete PHASE 8 (final gate checks)
5. Print final SITREP

### If Test Fails (After Retry)
1. Rollback to safety tag
2. Document blocker in `0.0.0.docs/051-tst-live-test-failure.md`
3. Create GitHub issue for blocker resolution
4. Pause release process
5. Print failure SITREP

---

## Test Execution Checklist

- [ ] Install `@google-cloud/vertexai` package
- [ ] Set GCP environment variables
- [ ] Verify GCP authentication (jeremy@intentsolutions.io)
- [ ] Run `scripts/test_vertex_integration.sh`
- [ ] Verify all 5 validation guards pass
- [ ] Check output files generated
- [ ] Review Vertex AI metrics (latency, cost, tokens)
- [ ] Archive test outputs
- [ ] Document results in release notes
- [ ] Proceed to PHASE 7 or rollback if failed

---

**Manual Execution Required**: This test requires npm dependencies and GCP credentials. Execute manually after resolving blockers.

**Next Step**: Install dependencies and run test, or skip to PHASE 7 if dependencies cannot be resolved in current environment.

---

**Document Owner**: Jeremy Longshore
**Last Updated**: 2025-10-15
**Status**: ⏳ READY FOR MANUAL EXECUTION
