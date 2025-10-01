# 0071-BUCKET-CONSOLIDATION-STATUS

**Date:** 2025-09-26T23:00:00Z  
**Phase:** BUCKET CONSOLIDATION  
**Status:** ⚠️ PARTIAL COMPLETE - AWAITING BACKEND UPDATE

---

## ✅ Completed Tasks

### 1. Bucket Inventory
- **File:** 0065-BUCKET-INVENTORY.txt (501 lines)
- **Buckets found:** 11 total
  - Application: 7
  - Infrastructure: 4

### 2. Environment Variables Captured
- **File:** 0066-CLOUDRUN-ENVS.txt
- **Current envs:** STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- **Missing:** REPORT_BUCKET, FIREBASE_STORAGE_BUCKET

### 3. Code Scan Completed
- **File:** 0067-CODE-BUCKET-REFS.txt
- **Finding:** No hardcoded bucket references in code
- **Implication:** Backend uses Firebase Admin SDK defaults

### 4. Write Logs Analyzed
- **File:** 0068-WRITE-LOGS.txt (262 lines)
- **Finding:** No recent bucket writes in logs

### 5. Bucket Classification Map
- **File:** 0069-BUCKET-MAP.md
- **Canonical buckets identified:**
  - diagnostic-pro-prod-reports-us-central1 (NEW - created)
  - diagnostic-pro-prod.firebasestorage.app (existing)
- **Buckets to delete:** 3 (diagnostic-pro-prod-storage, diagnosticpro-frontend, diagnosticpro-website)
- **Infrastructure buckets:** 6 (keep untouched)

### 6. New Canonical Reports Bucket Created ✅
```bash
gsutil mb -c STANDARD -l us-central1 -b on gs://diagnostic-pro-prod-reports-us-central1
# Result: Created successfully
```

**Configuration:**
- Location: US-CENTRAL1 ✅
- UBLA: Enabled ✅
- IAM: Cloud Run SA (298932670545-compute@developer.gserviceaccount.com) has objectAdmin ✅
- Lifecycle: Delete tmp/, staging/, scratch/ after 30 days ✅

### 7. Firebase Storage UBLA Enabled ✅
```bash
gsutil ubla set on gs://diagnostic-pro-prod.firebasestorage.app
# Result: Enabled
```

### 8. IAM Captured
- **File:** 0070-CANONICAL-IAM.json
- **Reports bucket IAM:**
  - Cloud Run SA: roles/storage.objectAdmin ✅
  - Project editors/owners: legacyBucketOwner, legacyObjectOwner
  - Project viewers: legacyBucketReader, legacyObjectReader
- **Firebase Storage IAM:**
  - Project-level permissions only (Firebase manages)

---

## ⚠️ Tasks Remaining

### CRITICAL: Backend Code Update Required

The backend needs to be updated to USE the new canonical bucket. Currently:
1. No `REPORT_BUCKET` environment variable exists
2. Code likely uses Firebase Admin SDK default bucket
3. Need to explicitly configure PDF generation to use `diagnostic-pro-prod-reports-us-central1`

**Required Changes:**

#### A. Backend Code (DiagnosticPro/backend/index.js)
Need to add storage bucket configuration at the top:

```javascript
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const REPORT_BUCKET = process.env.REPORT_BUCKET || 'diagnostic-pro-prod-reports-us-central1';
const reportsBucket = storage.bucket(REPORT_BUCKET);

// When generating PDFs, use:
const file = reportsBucket.file(`reports/${submissionId}.pdf`);
// NOT: storage.bucket().file(...)
```

#### B. Cloud Run Environment Variables
```bash
gcloud run services update diagnosticpro-vertex-ai-backend \
  --region us-central1 \
  --update-env-vars REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1,FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app \
  --project diagnostic-pro-prod
```

#### C. Backend Deployment
```bash
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro/backend
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source . \
  --region us-central1 \
  --project diagnostic-pro-prod
```

---

## Pending: E2E Test

After backend is updated and deployed, need to:

1. **Trigger full payment flow:**
   - Submit diagnostic form on https://diagnosticpro.io
   - Complete $4.99 Stripe payment
   - Wait for AI analysis
   - Check PDF generation

2. **Verify bucket usage:**
```bash
# Check if PDF was created in correct bucket
gsutil ls -l gs://diagnostic-pro-prod-reports-us-central1/reports/

# Get signed URL
curl -X POST https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/getDownloadUrl \
  -H "Content-Type: application/json" \
  -H "x-api-key: REDACTED_API_KEY" \
  -d '{"submissionId":"SUBMISSION_ID"}'

# Download and verify PDF
curl -o test-report.pdf "SIGNED_URL"
file test-report.pdf  # Should show: PDF document
```

3. **Check Cloud Run logs:**
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND textPayload:"gs://diagnostic-pro-prod-reports-us-central1"' \
  --project=diagnostic-pro-prod --limit=50
```

---

## Pending: Bucket Cleanup

**Only after E2E test passes**, delete unused buckets:

### 1. diagnostic-pro-prod-storage (SAFE - empty)
```bash
gsutil rm -r gs://diagnostic-pro-prod-storage
```

### 2. diagnosticpro-website (SAFE - empty)
```bash
gsutil rm -r gs://diagnosticpro-website
```

### 3. diagnosticpro-frontend (SAFE - stale)
First verify Firebase Hosting works, then:
```bash
gsutil rm -r gs://diagnosticpro-frontend
```

### 4. diagnostic-pro-prod_diagnostic-reports (OLD - multi-region)
After confirming new bucket works:
```bash
# Check if empty
gsutil ls gs://diagnostic-pro-prod_diagnostic-reports
# If empty, delete
gsutil rm -r gs://diagnostic-pro-prod_diagnostic-reports
```

---

## Expected Final State

### Application Buckets (2)
1. **diagnostic-pro-prod-reports-us-central1**
   - Location: US-CENTRAL1
   - Purpose: PDF diagnostic reports
   - Access: Cloud Run SA only
   - Lifecycle: Delete tmp/ after 30 days
   
2. **diagnostic-pro-prod.firebasestorage.app**
   - Location: US-CENTRAL1
   - Purpose: Firebase Storage (user uploads)
   - Access: Firebase manages
   - UBLA: Enabled

### Infrastructure Buckets (6) - DON'T TOUCH
- diagnostic-pro-prod_cloudbuild
- gcf-v2-sources-298932670545-us-central1
- gcf-v2-sources-298932670545-us-east1
- gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com
- gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com
- run-sources-diagnostic-pro-prod-us-central1

---

## Next Steps (In Order)

1. ✅ **UPDATE BACKEND CODE** - Add REPORT_BUCKET usage (CRITICAL)
2. ✅ **UPDATE CLOUD RUN ENV** - Add REPORT_BUCKET environment variable
3. ✅ **DEPLOY BACKEND** - Deploy updated code to Cloud Run
4. ✅ **RUN E2E TEST** - Verify PDF lands in new bucket
5. ✅ **CLEANUP BUCKETS** - Delete unused buckets after verification
6. ✅ **DOCUMENT** - Create final E2E proof report

---

## Files Created

| File | Purpose | Status |
|------|---------|--------|
| 0065-BUCKET-INVENTORY.txt | All buckets with sizes, contents, IAM | ✅ Complete |
| 0066-CLOUDRUN-ENVS.txt | Current Cloud Run environment variables | ✅ Complete |
| 0067-CODE-BUCKET-REFS.txt | Code scan for bucket references | ✅ Complete (empty - no refs) |
| 0068-WRITE-LOGS.txt | Historical bucket write logs | ✅ Complete |
| 0069-BUCKET-MAP.md | Bucket classification and action plan | ✅ Complete |
| 0070-CANONICAL-IAM.json | IAM for both canonical buckets | ✅ Complete |
| 0071-BUCKET-CONSOLIDATION-STATUS.md | This file | ✅ Complete |
| 0072-MIGRATION-REPORT.md | Data migration proof | ⏳ N/A (no data to migrate) |
| 0073-E2E-PROOF.md | End-to-end test with bucket usage | ❌ Pending backend update |
| 0074-BUCKET-CLEANUP.md | Cleanup actions and verification | ❌ Pending E2E test |

---

## Summary

**COMPLETED:**
- ✅ Bucket inventory and analysis
- ✅ New canonical reports bucket created and configured
- ✅ UBLA enabled on both canonical buckets
- ✅ IAM configured correctly
- ✅ Lifecycle rules set
- ✅ All documentation created

**BLOCKED ON:**
- ❌ Backend code update to use REPORT_BUCKET
- ❌ Cloud Run environment variable update
- ❌ Backend deployment
- ❌ E2E test to prove it works
- ❌ Cleanup of unused buckets

**ACTION REQUIRED:**
Update backend code to explicitly use `gs://diagnostic-pro-prod-reports-us-central1` for PDF generation, deploy, and test.

---

**Status updated:** 2025-09-26T23:00:00Z
