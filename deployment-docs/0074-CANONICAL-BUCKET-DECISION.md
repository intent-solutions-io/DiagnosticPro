# 0074-CANONICAL-BUCKET-DECISION

**Date:** 2025-09-27T00:20:00Z
**Phase:** BUCKET CONSOLIDATION - CANONICAL DECISION
**Status:** ✅ COMPLETE

---

## Summary

Resolved canonical bucket conflict by choosing **regional** bucket over legacy multi-region bucket. All backend code, environment variables, and documentation now aligned to single canonical bucket: `diagnostic-pro-prod-reports-us-central1`.

---

## The Conflict

Previous work created **two** potential canonical buckets:

### Option A (NEW - Created in this session)
- **Name**: `diagnostic-pro-prod-reports-us-central1`
- **Location**: US-CENTRAL1 (regional)
- **Created**: 2025-09-26 during bucket consolidation
- **Configuration**: UBLA enabled, IAM configured, lifecycle rules set

### Option B (OLD - Existed before)
- **Name**: `diagnostic-pro-prod_diagnostic-reports`
- **Location**: US (multi-region)
- **Created**: Unknown (legacy infrastructure)
- **Configuration**: UBLA enabled

**Problem**: Backend was deployed with Option B, but documentation referenced Option A. This conflict would cause PDFs to land in wrong bucket during E2E testing.

---

## Decision: Option A (Regional Bucket)

**Canonical Bucket:** `diagnostic-pro-prod-reports-us-central1`

### Reasons for Regional Bucket

1. **Performance**: Regional bucket (US-CENTRAL1) matches Cloud Run region (us-central1)
   - Lower latency for PDF saves and signed URL generation
   - No cross-region network hops

2. **Cost**: Regional storage is more cost-effective than multi-region
   - Multi-region: $0.026/GB/month
   - Regional: $0.020/GB/month
   - 23% cost savings on storage

3. **Infrastructure Alignment**: Matches existing infrastructure pattern
   - Cloud Run: us-central1
   - Firestore: us-central1
   - Firebase Storage: us-central1
   - All infrastructure colocated in same region

4. **Best Practices**: Regional bucket appropriate for application data
   - Multi-region typically for disaster recovery or global content delivery
   - PDF reports are user-specific, not globally distributed content
   - 99.9% SLA sufficient for application use case

---

## Changes Made

### 1. Cloud Run Environment Variables ✅

**Updated:**
```bash
gcloud run services update diagnosticpro-vertex-ai-backend \
  --region us-central1 \
  --update-env-vars \
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1,\
FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app \
  --project diagnostic-pro-prod
```

**Result:** Revision `diagnosticpro-vertex-ai-backend-00017-ln2` deployed with correct environment variables.

### 2. IAM Verification ✅

**Confirmed:**
```bash
gcloud storage buckets add-iam-policy-binding \
  gs://diagnostic-pro-prod-reports-us-central1 \
  --member="serviceAccount:298932670545-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" \
  --project=diagnostic-pro-prod
```

**Result:** Service account `298932670545-compute@developer.gserviceaccount.com` has `roles/storage.objectAdmin` on regional bucket.

### 3. Backend Code ✅

**Already Correct:**
- Backend code (index.js:54-62) requires `REPORT_BUCKET` environment variable (no fallback)
- All PDF operations use `reportsBucket` instance
- Structured logging includes bucket name in saveReport and viewReport operations

**No Code Changes Required** - Backend is environment-driven.

### 4. Documentation Updates ✅

**Updated Files:**
- `0072-E2E-PROOF.md`: All references to `diagnostic-pro-prod_diagnostic-reports` → `diagnostic-pro-prod-reports-us-central1`
- `0073-BUCKET-CLEANUP.md`: Added legacy multi-region bucket to deletion list (now 4 buckets to delete)

---

## Cleanup Plan Updated

### Buckets to Delete (4 total)

1. **diagnostic-pro-prod_diagnostic-reports** (NEW - added to cleanup)
   - Legacy multi-region bucket
   - Replaced by regional bucket
   - Empty (0 B)
   - **Safe to delete after E2E verification**

2. **diagnostic-pro-prod-storage**
   - Empty (0 B)
   - Never used
   - **Safe to delete**

3. **diagnosticpro-website**
   - Empty (0 B)
   - Never used
   - **Safe to delete**

4. **diagnosticpro-frontend**
   - Stale assets (910 KiB)
   - Firebase Hosting serves from different source
   - **Safe to delete after frontend verification**

---

## Final Architecture

### Canonical Application Buckets (2)

1. **diagnostic-pro-prod-reports-us-central1** 📁
   - Purpose: PDF diagnostic reports
   - Location: US-CENTRAL1 (regional)
   - UBLA: Enabled
   - IAM: Cloud Run SA has objectAdmin
   - Lifecycle: Delete tmp/ after 30 days
   - **CANONICAL - ALL PDF SAVES GO HERE**

2. **diagnostic-pro-prod.firebasestorage.app** 📁
   - Purpose: Firebase Storage (user uploads)
   - Location: US-CENTRAL1
   - UBLA: Enabled
   - Managed by Firebase

### Infrastructure Buckets (6) - DON'T TOUCH

- diagnostic-pro-prod_cloudbuild
- gcf-v2-sources-298932670545-us-central1
- gcf-v2-sources-298932670545-us-east1
- gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com
- gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com
- run-sources-diagnostic-pro-prod-us-central1

**Total Buckets After Cleanup:** 8 (2 app + 6 infra)

---

## Verification Commands

### Check Backend Configuration
```bash
# Verify environment variable
gcloud run services describe diagnosticpro-vertex-ai-backend \
  --region us-central1 --project diagnostic-pro-prod \
  --format='value(spec.template.spec.containers[0].env)' | grep REPORT_BUCKET

# Expected output:
# {'name': 'REPORT_BUCKET', 'value': 'diagnostic-pro-prod-reports-us-central1'}
```

### Check IAM
```bash
# Verify service account has objectAdmin
gsutil iam get gs://diagnostic-pro-prod-reports-us-central1 | grep compute@

# Expected output:
# serviceAccount:298932670545-compute@developer.gserviceaccount.com
```

### Check Bucket Configuration
```bash
# Verify regional bucket exists and is configured
gcloud storage buckets describe gs://diagnostic-pro-prod-reports-us-central1 \
  --format="table(name,location,locationType,uniformBucketLevelAccess.enabled)"

# Expected output:
# NAME                                        LOCATION     LOCATION_TYPE  UBLA
# diagnostic-pro-prod-reports-us-central1     US-CENTRAL1  region         True
```

---

## E2E Test Criteria

After running E2E test, verify:

1. ✅ **PDF in regional bucket:**
   ```bash
   gsutil ls -l gs://diagnostic-pro-prod-reports-us-central1/reports/
   ```

2. ✅ **No PDF in legacy multi-region bucket:**
   ```bash
   gsutil ls -l gs://diagnostic-pro-prod_diagnostic-reports/reports/
   # Expected: CommandException (no objects)
   ```

3. ✅ **Cloud Run logs show regional bucket:**
   ```bash
   gcloud logging read \
     'resource.type="cloud_run_revision" AND textPayload:"diagnostic-pro-prod-reports-us-central1"' \
     --project=diagnostic-pro-prod --limit=20
   ```

4. ✅ **Signed URL works:**
   ```bash
   curl -X POST https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/getDownloadUrl \
     -H "Content-Type: application/json" \
     -H "x-api-key: AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co" \
     -d '{"submissionId":"SUBMISSION_ID"}'
   ```

---

## Risk Assessment

**Risk Level:** ✅ **LOW**

- Backend code environment-driven (no hardcoded bucket names)
- IAM properly configured on regional bucket
- All infrastructure colocated in us-central1
- Legacy multi-region bucket empty and unused
- No data migration required (both buckets empty)

**Rollback Plan:** If issues arise, simply change environment variable back to multi-region bucket and redeploy:

```bash
gcloud run services update diagnosticpro-vertex-ai-backend \
  --region us-central1 \
  --update-env-vars REPORT_BUCKET=diagnostic-pro-prod_diagnostic-reports \
  --project diagnostic-pro-prod
```

---

## Next Steps

1. ⏳ **Run E2E Test** (Manual - User Action Required)
   - Submit diagnostic form at https://diagnosticpro.io
   - Complete $4.99 Stripe payment
   - Wait for AI analysis (2-5 minutes)
   - Verify PDF in `gs://diagnostic-pro-prod-reports-us-central1/reports/`

2. ⏳ **Execute Bucket Cleanup** (After E2E Passes)
   - Delete 4 unused buckets per 0073-BUCKET-CLEANUP.md
   - Verify final state: 8 total buckets (2 app + 6 infra)

3. ⏳ **Update E2E Documentation** (After Test)
   - Add actual submission ID, PDF path, log entries to 0072-E2E-PROOF.md
   - Add screenshots of bucket contents

---

## Summary

**DECISION MADE:** Regional bucket (`diagnostic-pro-prod-reports-us-central1`) is canonical.

**ALIGNMENT COMPLETE:**
- ✅ Backend environment variables updated
- ✅ IAM verified
- ✅ Documentation updated
- ✅ Cleanup plan updated

**READY FOR E2E TEST:** Backend revision `00017-ln2` running with correct configuration.

**CLEANUP READY:** 4 buckets (including legacy multi-region) queued for deletion after E2E verification.

---

**Status:** ✅ CONFLICT RESOLVED - CANONICAL BUCKET ALIGNED
**Next Action:** Run E2E test to verify regional bucket works end-to-end
