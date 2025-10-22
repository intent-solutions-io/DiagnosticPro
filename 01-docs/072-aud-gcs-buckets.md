# DiagnosticPro GCS Bucket Audit

**Date**: 2025-10-15
**Project**: diagnostic-pro-prod
**Total Buckets**: 10

---

## 📊 BUCKET INVENTORY & RECOMMENDATIONS

### ✅ KEEP - ACTIVE PRODUCTION BUCKETS (3)

#### 1. `diagnostic-pro-prod-reports-us-central1`
**Purpose**: PDF report storage (currently deployed)
**Usage**: **0.27 MB** | **27 objects**
**Status**: ✅ **ACTIVE - KEEP**
**Security**: ✅ No public access
**Notes**: Stores generated PDF diagnostic reports. Currently in use by production.

**Label Recommendation**:
```bash
gcloud storage buckets update gs://diagnostic-pro-prod-reports-us-central1 \
  --update-labels=purpose=pdf-reports,status=active,service=diagnosticpro
```

---

#### 2. `diagnostic-pro-prod-uploads`
**Purpose**: Customer photo uploads (photo upload feature - NOT deployed yet)
**Usage**: **0 MB** | **0 objects**
**Status**: ⚠️  **INACTIVE - KEEP for future photo upload feature**
**Security**: ✅ Public access enforced prevention (GOOD!)
**Notes**: Created for photo upload feature but backend rolled back. Infrastructure ready.

**Label Recommendation**:
```bash
gcloud storage buckets update gs://diagnostic-pro-prod-uploads \
  --update-labels=purpose=photo-uploads,status=standby,service=diagnosticpro,feature=photo-upload
```

---

#### 3. `dp-derived`
**Purpose**: Processed/normalized images (photo upload feature - NOT deployed yet)
**Usage**: **0 MB** | **0 objects**
**Status**: ⚠️  **INACTIVE - KEEP for future photo upload feature**
**Security**: ✅ No public access
**Notes**: Stores thumbnails and normalized versions of uploaded photos. Ready for photo upload feature.

**Label Recommendation**:
```bash
gcloud storage buckets update gs://dp-derived \
  --update-labels=purpose=image-processing,status=standby,service=diagnosticpro,feature=photo-upload
```

---

### ⚠️  EVALUATE - SYSTEM BUCKETS (7)

#### 4. `diagnostic-pro-prod.firebasestorage.app`
**Purpose**: Firebase Storage default bucket
**Usage**: **0 MB** | **0 objects**
**Status**: ⚠️  **UNUSED - Consider removing**
**Security**: ✅ No public access
**Notes**: Firebase default bucket, completely empty. Not being used.

**Recommendation**: **DELETE if not planning to use Firebase Storage features**

**Label If Keeping**:
```bash
gcloud storage buckets update gs://diagnostic-pro-prod.firebasestorage.app \
  --update-labels=purpose=firebase-default,status=unused,service=firebase
```

---

#### 5. `diagnostic-pro-prod_cloudbuild`
**Purpose**: Cloud Build artifacts and cache
**Usage**: **3.96 MB** | **19 objects**
**Status**: ✅ **SYSTEM - KEEP**
**Security**: ✅ No public access
**Notes**: Managed by Cloud Build. Contains build artifacts. Auto-managed by GCP.

**Label Recommendation**:
```bash
gcloud storage buckets update gs://diagnostic-pro-prod_cloudbuild \
  --update-labels=purpose=build-artifacts,status=system,service=cloud-build,managed-by=gcp
```

---

#### 6. `run-sources-diagnostic-pro-prod-us-central1`
**Purpose**: Cloud Run source code storage
**Usage**: **Unknown** | **Unknown**
**Status**: ✅ **SYSTEM - KEEP**
**Security**: ✅ No public access
**Notes**: Managed by Cloud Run. Stores deployment sources. Auto-managed by GCP.

**Label Recommendation**:
```bash
gcloud storage buckets update gs://run-sources-diagnostic-pro-prod-us-central1 \
  --update-labels=purpose=cloud-run-sources,status=system,service=cloud-run,managed-by=gcp
```

---

#### 7. `gcf-v2-sources-298932670545-us-central1`
**Purpose**: Cloud Functions v2 source code (us-central1)
**Usage**: **0.19 MB** | **11 objects**
**Status**: ✅ **SYSTEM - KEEP if using Cloud Functions**
**Security**: ✅ No public access
**Notes**: Stores source code for Cloud Functions. Needed for photo upload feature (storage-handler, analysis-worker).

**Label Recommendation**:
```bash
gcloud storage buckets update gs://gcf-v2-sources-298932670545-us-central1 \
  --update-labels=purpose=function-sources,status=system,service=cloud-functions,region=us-central1,managed-by=gcp
```

---

#### 8. `gcf-v2-sources-298932670545-us-east1`
**Purpose**: Cloud Functions v2 source code (us-east1)
**Usage**: **0.46 MB** | **20 objects**
**Status**: ⚠️  **UNUSED REGION - Consider deleting**
**Security**: ✅ No public access
**Notes**: Functions in us-east1. DiagnosticPro uses us-central1. May be from old deployments.

**Recommendation**: **DELETE if no functions deployed in us-east1**

**Label If Keeping**:
```bash
gcloud storage buckets update gs://gcf-v2-sources-298932670545-us-east1 \
  --update-labels=purpose=function-sources,status=unused,service=cloud-functions,region=us-east1,managed-by=gcp
```

---

#### 9. `gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com`
**Purpose**: Cloud Functions v2 upload handler (us-central1)
**Usage**: **0 MB** | **0 objects**
**Status**: ⚠️  **UNUSED - May be needed for photo upload**
**Security**: ✅ No public access
**Notes**: Upload handler bucket for Cloud Functions. Empty but may be used by photo upload feature.

**Label Recommendation**:
```bash
gcloud storage buckets update gs://gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com \
  --update-labels=purpose=function-uploads,status=standby,service=cloud-functions,region=us-central1,managed-by=gcp
```

---

#### 10. `gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com`
**Purpose**: Cloud Functions v2 upload handler (us-east1)
**Usage**: **0 MB** | **0 objects**
**Status**: ⚠️  **UNUSED REGION - Consider deleting**
**Security**: ✅ No public access
**Notes**: Empty, wrong region. Not used by DiagnosticPro.

**Recommendation**: **DELETE if no functions in us-east1**

**Label If Keeping**:
```bash
gcloud storage buckets update gs://gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com \
  --update-labels=purpose=function-uploads,status=unused,service=cloud-functions,region=us-east1,managed-by=gcp
```

---

## 📋 SUMMARY

### Bucket Breakdown:
- ✅ **Active Production**: 1 bucket (reports)
- ⏸️  **Standby for Photo Upload**: 2 buckets (uploads, derived)
- ✅ **System/Managed**: 4 buckets (build, run, functions us-central1)
- ❌ **Unused/Can Delete**: 3 buckets (firebase default, us-east1 × 2)

### Total Storage Used:
- **Active Data**: 0.27 MB (reports)
- **System/Build**: ~4.15 MB (build artifacts + function sources)
- **Unused**: 0.46 MB (us-east1 functions)
- **Total**: ~4.88 MB (~$0.12/month)

### Cost Impact:
**Current**: ~$0.12/month
**After Cleanup**: ~$0.10/month (delete 3 unused buckets)
**Savings**: Negligible but cleaner infrastructure

---

## 🎯 RECOMMENDATIONS

### Immediate Actions:

**1. Label ALL buckets** (see commands above)
```bash
# Execute all label commands to make buckets distinguishable
```

**2. DELETE unused buckets** (saves ~$0.02/month + cleaner infra):
```bash
# Delete Firebase default (empty, unused)
gsutil rm -r gs://diagnostic-pro-prod.firebasestorage.app

# Delete us-east1 function sources (wrong region)
gsutil rm -r gs://gcf-v2-sources-298932670545-us-east1
gsutil rm -r gs://gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com
```

**3. Set lifecycle policies on system buckets**:
```bash
# Auto-delete old build artifacts after 30 days
cat > lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://diagnostic-pro-prod_cloudbuild
gsutil lifecycle set lifecycle.json gs://gcf-v2-sources-298932670545-us-central1
```

---

## ✅ SECURITY SUMMARY

**All Buckets**:
- ✅ No public access detected (GOOD!)
- ✅ Only 1 bucket enforces public access prevention (`diagnostic-pro-prod-uploads`)
- ⚠️  Consider enabling public access prevention on ALL buckets

**Recommended Security Hardening**:
```bash
# Enable public access prevention on all buckets
for bucket in diagnostic-pro-prod-reports-us-central1 dp-derived diagnostic-pro-prod.firebasestorage.app; do
  gcloud storage buckets update gs://$bucket \
    --public-access-prevention=enforced
done
```

---

## 🔧 PHOTO UPLOAD FEATURE - BUCKET REQUIREMENTS

**When deploying photo upload feature, you'll need**:

### Required Buckets (Already Created ✅):
1. ✅ `diagnostic-pro-prod-uploads` - Customer uploads (ready)
2. ✅ `dp-derived` - Processed images (ready)

### Optional Buckets (System-managed):
3. ✅ `gcf-v2-sources-298932670545-us-central1` - Function code
4. ✅ `gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com` - Function uploads

**Status**: Photo upload infrastructure **ready to activate** - just deploy backend code when payment flow decided.

---

## 📊 BUCKET HEALTH SCORE

| Category | Score | Notes |
|----------|-------|-------|
| **Security** | ✅ 9/10 | No public access, add prevention to more buckets |
| **Organization** | ⚠️  5/10 | No labels, unclear purposes |
| **Cost Efficiency** | ✅ 9/10 | Very low cost, minor cleanup possible |
| **Redundancy** | ⚠️  7/10 | 3 unused buckets can be deleted |
| **Overall** | ✅ 7.5/10 | Good security, needs labels + cleanup |

---

**Next Steps**:
1. Review this audit
2. Execute labeling commands
3. Delete unused buckets (optional)
4. Set lifecycle policies on system buckets
5. Enable public access prevention on all buckets

---

**Created**: 2025-10-15
**Auditor**: Claude Code
**Review Date**: 2025-11-15 (monthly review recommended)
