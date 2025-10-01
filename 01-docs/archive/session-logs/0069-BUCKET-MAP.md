# 0069-BUCKET-MAP

**Date:** 2025-09-26T22:50:00Z  
**Phase:** BUCKET AUDIT  
**Status:** ANALYSIS COMPLETE

---

## Bucket Inventory Analysis

### Summary
Total buckets found: 11
- Infrastructure (keep): 4
- Application (consolidate): 7

---

## Bucket Classification

| Bucket Name | Location | Size | Purpose | Who Writes/Reads | Decision |
|------------|----------|------|---------|------------------|----------|
| **diagnostic-pro-prod_diagnostic-reports** | US (multi-region) | 0 B | PDF reports | Backend (intended) | **CANONICAL - REPORTS** ✅ |
| **diagnostic-pro-prod.firebasestorage.app** | US-CENTRAL1 | 0 B | Firebase Storage | Frontend uploads | **CANONICAL - FIREBASE** ✅ |
| **diagnostic-pro-prod-storage** | US-EAST1 | 0 B | Legacy/unused | None | **DELETE** ❌ |
| **diagnosticpro-frontend** | US-CENTRAL1 | 910 KiB | Old frontend assets | Nobody (stale) | **DELETE** ❌ |
| **diagnosticpro-website** | US-CENTRAL1 | 0 B | Old website | Nobody (empty) | **DELETE** ❌ |
| **diagnostic-pro-prod_cloudbuild** | US | 2.06 MiB | Cloud Build artifacts | GCP (automatic) | **KEEP - INFRA** 🔧 |
| **gcf-v2-sources-298932670545-us-central1** | US-CENTRAL1 | 190 KiB | Cloud Functions sources | GCP (automatic) | **KEEP - INFRA** 🔧 |
| **gcf-v2-sources-298932670545-us-east1** | US-EAST1 | 475 KiB | Cloud Functions sources | GCP (automatic) | **KEEP - INFRA** 🔧 |
| **gcf-v2-uploads-298932670545.us-central1** | US-CENTRAL1 | 0 B | Cloud Functions uploads | GCP (automatic) | **KEEP - INFRA** 🔧 |
| **gcf-v2-uploads-298932670545.us-east1** | US-EAST1 | 0 B | Cloud Functions uploads | GCP (automatic) | **KEEP - INFRA** 🔧 |
| **run-sources-diagnostic-pro-prod-us-central1** | US-CENTRAL1 | 1.18 MiB | Cloud Run sources | GCP (automatic) | **KEEP - INFRA** 🔧 |

---

## Canonical Buckets (Post-Consolidation)

### 1. diagnostic-pro-prod_diagnostic-reports ✅
**Purpose:** All generated PDF diagnostic reports  
**Location:** US (multi-region)  
**⚠️ ISSUE:** Not in US-CENTRAL1 (target region)  
**Recommendation:** Migrate to US-CENTRAL1 for lower latency to Cloud Run  

**New bucket name:** `diagnostic-pro-prod-reports-us-central1`  
**Migration plan:**
1. Create new bucket in US-CENTRAL1
2. Set lifecycle rules (delete tmp/ after 30 days)
3. Configure UBLA + IAM
4. Update backend ENV to use new bucket
5. Retire old US multi-region bucket after verification

### 2. diagnostic-pro-prod.firebasestorage.app ✅
**Purpose:** Firebase Storage for app uploads (user images, attachments)  
**Location:** US-CENTRAL1 ✅  
**Status:** Correctly configured  

---

## Buckets to Delete

### diagnostic-pro-prod-storage (US-EAST1)
- **Size:** 0 B (empty)
- **Contents:** None
- **Used by:** Nobody
- **Action:** Safe to delete immediately

### diagnosticpro-frontend (US-CENTRAL1)
- **Size:** 910 KiB
- **Contents:** 4 files (favicon.ico, index.html, placeholder.svg, robots.txt from 2025-09-22)
- **Used by:** Nobody (Firebase Hosting now serves from different source)
- **Action:** Delete after verifying frontend works

### diagnosticpro-website (US-CENTRAL1)
- **Size:** 0 B (empty)
- **Contents:** None
- **Used by:** Nobody
- **Action:** Safe to delete immediately

---

## Code References

**Search Results:**
```
rg -n 'gs://|storage\.bucket|REPORT_BUCKET|firebasestorage' DiagnosticPro/backend DiagnosticPro/src
```

**Findings:** No hardcoded bucket references found in code  

**Implication:**  
- Backend likely uses default Firebase Admin SDK bucket
- No explicit REPORT_BUCKET environment variable set
- Need to add REPORT_BUCKET env var to Cloud Run

---

## Current Environment Configuration

**Cloud Run Service:** `diagnosticpro-vertex-ai-backend`  
**Environment Variables:**
```
STRIPE_SECRET_KEY: (from secret)
STRIPE_WEBHOOK_SECRET: (from secret)
```

**Missing:**
- `REPORT_BUCKET` environment variable
- `FIREBASE_STORAGE_BUCKET` explicit configuration

---

## Action Plan

### Phase 1: Create New Canonical Reports Bucket
1. Create `diagnostic-pro-prod-reports-us-central1` in US-CENTRAL1
2. Enable Uniform Bucket-Level Access
3. Configure IAM (Cloud Run SA only)
4. Set lifecycle rules (delete tmp/ after 30 days)

### Phase 2: Update Backend Code & Deploy
1. Add REPORT_BUCKET env var to Cloud Run
2. Update backend code to use REPORT_BUCKET for PDF generation
3. Deploy and verify

### Phase 3: Delete Unused Buckets
1. Delete `diagnostic-pro-prod-storage` (empty)
2. Delete `diagnosticpro-website` (empty)
3. Verify frontend still works, then delete `diagnosticpro-frontend`

### Phase 4: Retire Old Reports Bucket
1. Verify no PDFs in `diagnostic-pro-prod_diagnostic-reports`
2. Delete if empty
3. If not empty, migrate to new bucket first

---

## Expected Final State

**Application Buckets (2):**
1. `diagnostic-pro-prod-reports-us-central1` - PDF reports
2. `diagnostic-pro-prod.firebasestorage.app` - Firebase Storage

**Infrastructure Buckets (6):** (automatic, don't touch)
- diagnostic-pro-prod_cloudbuild
- gcf-v2-sources-298932670545-us-central1
- gcf-v2-sources-298932670545-us-east1
- gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com
- gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com
- run-sources-diagnostic-pro-prod-us-central1

**Deleted (3):**
- diagnostic-pro-prod-storage
- diagnosticpro-frontend
- diagnosticpro-website

---

**Analysis complete:** 2025-09-26T22:50:00Z
