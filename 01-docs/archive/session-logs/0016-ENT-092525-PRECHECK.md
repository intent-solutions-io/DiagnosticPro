# SECTION 0 — SYSTEM INVARIANTS PRECHECK

**Date:** 2025-09-25T17:40:00Z
**Status:** ⚠️ **MOSTLY READY** - Firebase default bucket requires manual initialization

---

## ✅ CONFIRMED INVARIANTS

### **Project Configuration**
- **Project ID:** diagnostic-pro-prod ✅
- **Project Number:** 298932670545 ✅
- **Project Type:** GCP with Firebase enabled ✅

### **API Gateway Configuration**
- **Gateway Host:** https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev ✅
- **Gateway Status:** Deployed and operational ✅
- **Target Webhook URL:** https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/webhook/stripe ✅

### **Backend Configuration**
- **Service Name:** simple-diagnosticpro ✅
- **Backend URL:** https://simple-diagnosticpro-qonjb7tvha-uc.a.run.app ✅
- **Health Endpoint Test:** Returns 403 (expected - no auth) ✅
- **Location:** us-central1 ✅
- **Status:** Private, protected behind API Gateway ✅

### **Environment Variables**
- **STRIPE_SECRET_KEY:** Present ✅
- **STRIPE_WEBHOOK_SECRET:** Present ✅ (not displayed for security)
- **REPORT_BUCKET:** Present ✅

---

## ❌ BLOCKING ISSUE

### **Firebase Default Bucket Missing**
- **Expected Bucket:** gs://diagnostic-pro-prod.appspot.com
- **Status:** ❌ **DOES NOT EXIST**
- **Required Action:** Manual initialization through Firebase Console

#### **Resolution Steps:**
1. Go to [Firebase Console Storage](https://console.firebase.google.com/project/diagnostic-pro-prod/storage)
2. Click "Get Started" to initialize Firebase Storage
3. Choose production mode
4. Select us-central1 location
5. This will create the default bucket: `gs://diagnostic-pro-prod.appspot.com`

---

## 🎯 ARCHITECTURE CONFIRMATION

### **Target Enterprise Pattern:**
```
Frontend (Firebase Hosting)
    ↓
diagnosticpro.io → API Gateway (Public)
    ↓
https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/webhook/stripe
    ↓
Cloud Run Backend (Private) → simple-diagnosticpro
    ↓
Firestore (submissions, analysis) + Firebase Storage (reports)
    ↓
gs://diagnostic-pro-prod.appspot.com/reports/{submissionId}.pdf
```

### **Pricing Configuration:**
- **Target Price:** $4.99 (499 cents) ✅
- **Signed Download Duration:** 15 minutes (900 seconds) ✅
- **Single Canonical Bucket:** gs://diagnostic-pro-prod.appspot.com (pending creation)

---

## 📋 SYSTEM READINESS CHECKLIST

- [x] **GCP Project:** diagnostic-pro-prod configured
- [x] **API Gateway:** diagpro-gw-3tbssksx deployed and operational
- [x] **Cloud Run Backend:** simple-diagnosticpro deployed and private
- [x] **Environment Variables:** All Stripe secrets configured
- [x] **Network Security:** Backend protected, only accessible via gateway
- [ ] **Firebase Storage:** Default bucket requires manual initialization
- [x] **Webhook Endpoint:** Target URL configured and ready

---

## 🚨 CRITICAL NEXT STEP

**MANUAL ACTION REQUIRED:** Initialize Firebase Storage to create default bucket

**Why Manual:** Firebase Storage requires console initialization to create the default `*.appspot.com` bucket with proper Firebase integration.

**Impact:** Cannot proceed to production until default bucket exists for PDF report storage.

---

## ✅ VERIFICATION COMMANDS

```bash
# Project verification
gcloud projects describe diagnostic-pro-prod --format="value(projectNumber)"
# Expected: 298932670545

# Gateway verification
gcloud api-gateway gateways describe diagpro-gw-3tbssksx --location=us-central1 --project=diagnostic-pro-prod
# Expected: ACTIVE status

# Backend verification
curl -s -o /dev/null -w "%{http_code}" https://simple-diagnosticpro-qonjb7tvha-uc.a.run.app/health
# Expected: 403 (protected)

# Bucket verification (after manual creation)
gsutil ls gs://diagnostic-pro-prod.appspot.com
# Expected: Success (empty bucket)
```

---

**STATUS:** ⚠️ System 95% ready - Firebase Storage initialization required to proceed
**NEXT:** Manual bucket creation → Continue with Section 1 (Firestore schema)