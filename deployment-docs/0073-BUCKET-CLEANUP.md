# 0073-BUCKET-CLEANUP

**Date:** 2025-09-26T23:20:00Z  
**Phase:** BUCKET CLEANUP  
**Status:** ⏳ PENDING E2E TEST

---

## Summary

Cleanup plan for unused GCS buckets after verifying canonical bucket works. Three empty/stale application buckets will be deleted while preserving infrastructure buckets.

---

## Bucket Inventory (Post-Consolidation)

### Keep - Canonical Application Buckets (2)
1. **diagnostic-pro-prod-reports-us-central1** ✅
   - Purpose: PDF diagnostic reports
   - Location: US-CENTRAL1 (regional)
   - UBLA: Enabled
   - Size: 0 B (will grow with usage)
   - Status: **CANONICAL - KEEP**

2. **diagnostic-pro-prod.firebasestorage.app** ✅
   - Purpose: Firebase Storage (user uploads)
   - Location: US-CENTRAL1
   - UBLA: Enabled
   - Size: 0 B
   - Status: **CANONICAL - KEEP**

### Keep - Infrastructure Buckets (6)
These are managed by GCP and required for Cloud Build, Cloud Functions, and Cloud Run:

1. **diagnostic-pro-prod_cloudbuild** (2.06 MiB)
2. **gcf-v2-sources-298932670545-us-central1** (190 KiB)
3. **gcf-v2-sources-298932670545-us-east1** (475 KiB)
4. **gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com** (0 B)
5. **gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com** (0 B)
6. **run-sources-diagnostic-pro-prod-us-central1** (1.18 MiB)

**Status:** **INFRASTRUCTURE - DON'T TOUCH**

### Delete - Unused Application Buckets (4)

1. **diagnostic-pro-prod_diagnostic-reports**
   - Location: US (multi-region)
   - Size: 0 B (empty)
   - Contents: None
   - Used by: Nobody (replaced by regional bucket)
   - Reason: Legacy multi-region bucket, replaced by regional us-central1 bucket
   - Status: **DELETE AFTER VERIFICATION** ❌

2. **diagnostic-pro-prod-storage**
   - Location: US-EAST1
   - Size: 0 B (empty)
   - Contents: None
   - Used by: Nobody
   - Reason: Legacy/unused bucket
   - Status: **DELETE** ❌

3. **diagnosticpro-frontend**
   - Location: US-CENTRAL1
   - Size: 910 KiB
   - Contents: 4 files (favicon.ico, index.html, placeholder.svg, robots.txt from 2025-09-22)
   - Used by: Nobody (Firebase Hosting serves from different source)
   - Reason: Stale frontend assets
   - Status: **DELETE AFTER VERIFICATION** ❌

4. **diagnosticpro-website**
   - Location: US-CENTRAL1
   - Size: 0 B (empty)
   - Contents: None
   - Used by: Nobody
   - Reason: Empty/unused
   - Status: **DELETE** ❌

---

## Cleanup Procedure

### Prerequisites
- ✅ E2E test passed (PDF in canonical bucket)
- ✅ Signed URL works
- ✅ Cloud Run logs show canonical bucket usage
- ✅ Frontend still accessible at https://diagnosticpro.io

### Step 1: Delete Empty Buckets (Safe)

```bash
# diagnostic-pro-prod-storage (0 B - empty)
gsutil du -sh gs://diagnostic-pro-prod-storage
# Output: 0 B
gsutil rm -r gs://diagnostic-pro-prod-storage
echo "✅ Deleted diagnostic-pro-prod-storage"

# diagnosticpro-website (0 B - empty)
gsutil du -sh gs://diagnosticpro-website
# Output: 0 B
gsutil rm -r gs://diagnosticpro-website
echo "✅ Deleted diagnosticpro-website"

# diagnostic-pro-prod_diagnostic-reports (0 B - replaced by regional bucket)
gsutil du -sh gs://diagnostic-pro-prod_diagnostic-reports
# Output: 0 B
gsutil rm -r gs://diagnostic-pro-prod_diagnostic-reports
echo "✅ Deleted diagnostic-pro-prod_diagnostic-reports (legacy multi-region)"
```

### Step 2: Verify Frontend Still Works

```bash
# Check https://diagnosticpro.io loads
curl -sI https://diagnosticpro.io | grep "HTTP/"
# Expected: HTTP/2 200

# Check Firebase Hosting serves correctly
curl -s https://diagnosticpro.io | grep "<title>"
# Expected: <title>DiagnosticPro</title>
```

### Step 3: Delete Stale Frontend Bucket (After Verification)

```bash
# diagnosticpro-frontend (910 KiB - stale assets)
gsutil du -sh gs://diagnosticpro-frontend
# Output: 910.57 KiB

# List contents before delete
gsutil ls -l gs://diagnosticpro-frontend

# Delete
gsutil rm -r gs://diagnosticpro-frontend
echo "✅ Deleted diagnosticpro-frontend"
```

---

## Verification Commands

### Before Cleanup
```bash
# Count total buckets
gcloud storage buckets list --format="value(name)" | wc -l
# Expected: 11 buckets
```

### After Cleanup
```bash
# Count remaining buckets
gcloud storage buckets list --format="value(name)" | wc -l
# Expected: 8 buckets (2 app + 6 infra)

# List remaining buckets
gcloud storage buckets list --format="table(name,location,storageClass)"
# Expected output:
# diagnostic-pro-prod-reports-us-central1       US-CENTRAL1
# diagnostic-pro-prod.firebasestorage.app       US-CENTRAL1
# diagnostic-pro-prod_cloudbuild                US
# gcf-v2-sources-298932670545-us-central1       US-CENTRAL1
# gcf-v2-sources-298932670545-us-east1          US-EAST1
# gcf-v2-uploads-298932670545.us-central1...    US-CENTRAL1
# gcf-v2-uploads-298932670545.us-east1...       US-EAST1
# run-sources-diagnostic-pro-prod-us-central1   US-CENTRAL1
```

### Verify No Orphaned Reports
```bash
# Check no PDFs exist in deleted buckets (before deletion)
for B in diagnostic-pro-prod-storage diagnosticpro-frontend diagnosticpro-website; do
  echo "=== Checking $B for reports ==="
  gsutil ls gs://$B/reports/ 2>&1 || echo "No reports folder"
  gsutil ls gs://$B/**/*.pdf 2>&1 || echo "No PDFs"
done

# Expected: No reports or PDFs found in any of these buckets
```

---

## Cleanup Summary

| Bucket | Size | Action | Reason | Risk |
|--------|------|--------|--------|------|
| diagnostic-pro-prod_diagnostic-reports | 0 B | Delete | Legacy multi-region, replaced by regional | None ✅ |
| diagnostic-pro-prod-storage | 0 B | Delete | Empty, unused | None ✅ |
| diagnosticpro-website | 0 B | Delete | Empty, unused | None ✅ |
| diagnosticpro-frontend | 910 KiB | Delete | Stale assets | Low (verify frontend works first) ⚠️ |

**Total Space Freed:** ~910 KiB
**Total Buckets Removed:** 4

---

## Final State

### Application Buckets (2)
```
diagnostic-pro-prod-reports-us-central1 → PDF reports (regional)
diagnostic-pro-prod.firebasestorage.app → Firebase Storage
```

### Infrastructure Buckets (6)
```
diagnostic-pro-prod_cloudbuild
gcf-v2-sources-298932670545-us-central1
gcf-v2-sources-298932670545-us-east1
gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com
gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com
run-sources-diagnostic-pro-prod-us-central1
```

---

## Rollback Plan

If frontend breaks after deleting `diagnosticpro-frontend`:

```bash
# Redeploy frontend to Firebase Hosting
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro
npm run build
firebase deploy --only hosting --project diagnostic-pro-prod
```

If reports are somehow missing:

```bash
# Check if accidentally deleted from wrong bucket
gsutil ls -r gs://diagnostic-pro-prod-reports-us-central1/reports/

# Restore from backup if needed (if backups were configured)
# gsutil cp gs://BACKUP_BUCKET/reports/* gs://diagnostic-pro-prod_diagnostic-reports/reports/
```

---

## Success Criteria

- ✅ 4 unused buckets deleted (including legacy multi-region)
- ✅ 8 total buckets remaining (2 app + 6 infra)
- ✅ Frontend still accessible at https://diagnosticpro.io
- ✅ PDF generation works with regional bucket
- ✅ Signed URLs work for regional bucket
- ✅ No orphaned reports
- ✅ No errors in Cloud Run logs

---

## Execution Timeline

**Step 1:** Delete empty buckets (diagnostic-pro-prod_diagnostic-reports, diagnostic-pro-prod-storage, diagnosticpro-website) - **SAFE**
**Step 2:** Verify frontend works at https://diagnosticpro.io
**Step 3:** Delete stale frontend bucket (diagnosticpro-frontend) - **LOW RISK**
**Step 4:** Final verification and documentation

**Estimated Time:** 5 minutes
**Risk Level:** Low (all buckets empty or unused, legacy multi-region bucket replaced by regional)

---

**Status:** ⏳ AWAITING E2E TEST COMPLETION  
**Next Action:** Run cleanup commands after verifying PDF generation works
