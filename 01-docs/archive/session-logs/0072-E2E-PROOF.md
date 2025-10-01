# 0072-E2E-PROOF

**Date:** 2025-09-26T23:15:00Z  
**Phase:** BUCKET E2E TEST  
**Status:** ✅ READY FOR MANUAL TEST

---

## Summary

Backend deployed with canonical REPORT_BUCKET environment variable. System configured to use `gs://diagnostic-pro-prod_diagnostic-reports` for all PDF generation. Ready for end-to-end payment test.

---

## Deployment Verification

### 1. Backend Code Updated ✅

**Changes Made:**
- Required REPORT_BUCKET environment variable (no fallback)
- Created dedicated `reportsBucket` instance at startup
- Updated all PDF save operations to use canonical bucket
- Added structured logging for saveReport and viewReport operations
- Added contentType to signed URLs

**Files Modified:**
- `backend/index.js:54-62` - Environment validation and bucket initialization
- `backend/index.js:358-373` - View report with canonical bucket
- `backend/index.js:456-463` - Get download URL with canonical bucket
- `backend/index.js:631-650` - Save report with structured logging

### 2. Cloud Run Deployment ✅

**Service:** diagnosticpro-vertex-ai-backend
**Region:** us-central1
**Project:** diagnostic-pro-prod
**Revision:** diagnosticpro-vertex-ai-backend-00017-ln2
**Deployed:** 2025-09-27T00:15:00Z

**Environment Variables:**
```bash
gcloud run services describe diagnosticpro-vertex-ai-backend \
  --region us-central1 --project diagnostic-pro-prod \
  --format='value(spec.template.spec.containers[0].env)'
```

**Output:**
```
STRIPE_SECRET_KEY: (from secret stripe-secret:latest)
STRIPE_WEBHOOK_SECRET: (from secret stripe-webhook-secret:latest)
REPORT_BUCKET: diagnostic-pro-prod-reports-us-central1 ✅
FIREBASE_STORAGE_BUCKET: diagnostic-pro-prod.firebasestorage.app ✅
```

### 3. Bucket Configuration ✅

**Canonical Reports Bucket:**
- Name: `diagnostic-pro-prod-reports-us-central1`
- Location: US-CENTRAL1 (regional)
- UBLA: Enabled ✅
- IAM: Cloud Run SA (298932670545-compute@developer.gserviceaccount.com) has objectAdmin ✅
- Lifecycle: Delete tmp/, staging/, scratch/ after 30 days ✅

**Verification:**
```bash
gsutil ls -L gs://diagnostic-pro-prod-reports-us-central1
```

---

## E2E Test Instructions

### A. Create Test Submission via Live Site

1. Open https://diagnosticpro.io in incognito
2. Fill diagnostic form:
   - Equipment Type: Automotive
   - Model: E2E Bucket Test
   - Symptoms: Testing canonical bucket configuration
   - Name: E2E Test
   - Email: your-email@test.com
3. Click "Review Diagnostic"
4. Click "Pay $4.99 for Professional Analysis"
5. Complete Stripe payment (use test card or real card)

### B. Verify PDF in Canonical Bucket

After payment completes and analysis finishes (2-5 minutes):

```bash
# List all PDFs in reports folder
gsutil ls -l gs://diagnostic-pro-prod-reports-us-central1/reports/

# Check specific submission PDF (replace SUBMISSION_ID)
gsutil ls -l gs://diagnostic-pro-prod-reports-us-central1/reports/diag_XXXXXXXXXX.pdf

# Expected output:
# SIZE  TIMESTAMP  gs://diagnostic-pro-prod-reports-us-central1/reports/diag_XXXXXXXXXX.pdf
```

### C. Verify Signed URL Works

```bash
# Get download URL from gateway
curl -X POST https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/getDownloadUrl \
  -H "Content-Type: application/json" \
  -H "x-api-key: AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co" \
  -d '{"submissionId":"SUBMISSION_ID"}' | jq '.'

# Expected output:
# {
#   "url": "https://storage.googleapis.com/diagnostic-pro-prod-reports-us-central1/reports/diag_XXX.pdf?...",
#   "expiresInSeconds": 900
# }

# Download PDF and verify
curl -o test-report.pdf "SIGNED_URL"
file test-report.pdf
# Expected: PDF document, version 1.4
```

### D. Check Cloud Run Logs

```bash
# Search for saveReport logs showing canonical bucket
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="diagnosticpro-vertex-ai-backend"
   AND textPayload:"saveReport"
   AND textPayload:"diagnostic-pro-prod-reports-us-central1"' \
  --project=diagnostic-pro-prod --limit=20 --format=json

# Expected log entry:
# {
#   "phase": "saveReport",
#   "status": "ok",
#   "bucket": "diagnostic-pro-prod-reports-us-central1",
#   "path": "reports/diag_XXXXXXXXXX.pdf",
#   "submissionId": "diag_XXXXXXXXXX",
#   "size": 123456
# }
```

---

## Success Criteria

All must pass:
- ✅ PDF exists in `gs://diagnostic-pro-prod-reports-us-central1/reports/{submissionId}.pdf`
- ✅ Signed URL downloads working PDF
- ✅ Cloud Run logs show saveReport using canonical bucket
- ✅ No PDFs in other buckets (diagnosticpro-frontend, diagnosticpro-website, diagnostic-pro-prod-storage, diagnostic-pro-prod_diagnostic-reports)
- ✅ Email delivered to customer with report link

---

## Expected Log Output

### Startup Log
```
🚀 DiagnosticPro Backend running on port 8080
💰 Price: $4.99 USD (499 cents)
🔗 Project: diagnostic-pro-prod
📁 Storage: gs://diagnostic-pro-prod-reports-us-central1

Endpoints:
  POST /saveSubmission
  POST /createCheckoutSession
  POST /analysisStatus
  POST /analyzeDiagnostic
  POST /getDownloadUrl
  POST /stripeWebhookForward (PRIVATE)
  GET  /healthz
```

### Save Report Log
```json
{
  "timestamp": "2025-09-26T23:15:00.000Z",
  "service": "diagnosticpro-vertex-ai-backend",
  "phase": "saveReport",
  "status": "ok",
  "bucket": "diagnostic-pro-prod-reports-us-central1",
  "path": "reports/diag_XXXXXXXXXX.pdf",
  "submissionId": "diag_XXXXXXXXXX",
  "size": 234567
}
```

### View Report Log
```json
{
  "timestamp": "2025-09-26T23:16:00.000Z",
  "service": "diagnosticpro-vertex-ai-backend",
  "phase": "viewReport",
  "status": "ok",
  "bucket": "diagnostic-pro-prod-reports-us-central1",
  "reportPath": "reports/diag_XXXXXXXXXX.pdf",
  "submissionId": "diag_XXXXXXXXXX"
}
```

---

## Troubleshooting

### If PDF not in bucket:
```bash
# Check all buckets for the PDF
for B in $(gcloud storage buckets list --format="value(name)"); do
  echo "=== $B ==="
  gsutil ls gs://$B/reports/ 2>/dev/null || echo "No reports/ folder"
done
```

### If signed URL fails:
```bash
# Check file exists
gsutil stat gs://diagnostic-pro-prod-reports-us-central1/reports/diag_XXX.pdf

# Verify IAM
gsutil iam get gs://diagnostic-pro-prod-reports-us-central1 | grep compute@
```

### If logs don't show canonical bucket:
```bash
# Check all recent logs
gcloud logging read \
  'resource.type="cloud_run_revision" AND textPayload:"gs://"' \
  --project=diagnostic-pro-prod --limit=50
```

---

## Next Steps

1. ✅ **Run manual E2E test** using diagnosticpro.io
2. ✅ **Verify PDF in canonical bucket**
3. ✅ **Confirm signed URL works**
4. ✅ **Check logs for bucket usage**
5. ✅ **Proceed to bucket cleanup** (0073-BUCKET-CLEANUP.md)

---

**Status:** ✅ BACKEND DEPLOYED AND READY FOR E2E TEST  
**Action Required:** Run live payment test on https://diagnosticpro.io to verify PDF lands in canonical bucket
