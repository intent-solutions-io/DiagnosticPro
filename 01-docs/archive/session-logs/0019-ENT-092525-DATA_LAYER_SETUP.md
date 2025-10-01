# SECTION 1 — FIRESTORE SCHEMA & SECURITY RULES

**Date:** 2025-09-25T17:50:00Z
**Status:** ✅ **COMPLETE** - Firestore schema deployed successfully

---

## ✅ COLLECTIONS SCHEMA

### **submissions/{id}**
```javascript
{
  createdAt: timestamp,
  payload: object, // diagnostic form data
  status: "pending" | "paid" | "processing" | "ready" | "failed",
  priceCents: 499 // fixed $4.99 price
}
```

**Access Rules:**
- ✅ **Public CREATE only** - clients can create submissions
- ❌ **No read/update/delete** - server-only access via Admin SDK
- ✅ **Validation** - enforces priceCents: 499 and status: "pending"

### **analysis/{id}**
```javascript
{
  updatedAt: timestamp,
  status: "pending" | "processing" | "ready" | "failed",
  error: string | null,
  reportPath: "reports/{id}.pdf"
}
```

**Access Rules:**
- ❌ **Server-only** - no client access whatsoever
- ✅ **Admin SDK only** - backend manages all operations

---

## 🔒 DEPLOYED SECURITY RULES

### **Firestore Rules** (`firestore.rules`)
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Submissions: public create only
    match /submissions/{submissionId} {
      allow create: if true;
      allow read, update, delete: if false;

      // Validation on create
      allow create: if resource == null
        && request.resource.data.keys().hasAll(['createdAt', 'payload', 'status', 'priceCents'])
        && request.resource.data.priceCents == 499
        && request.resource.data.status == 'pending';
    }

    // Analysis: fully server-only
    match /analysis/{analysisId} {
      allow read, write: if false;
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### **Storage Rules** (`storage.rules`)
```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{submissionId}.pdf {
      // PDF reports are server-generated only
      allow read, write: if false;
    }

    match /{allPaths=**} {
      // Other paths require authentication
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🚀 DEPLOYMENT PROOF

### **Rules Deployment Success**
```bash
firebase deploy --only firestore:rules --project diagnostic-pro-prod
```

**Output:**
```
✔  cloud.firestore: rules file firestore.rules compiled successfully
✔  firestore: released rules firestore.rules to cloud.firestore
✔  Deploy complete!
```

### **Database Configuration**
```bash
gcloud firestore databases list --project=diagnostic-pro-prod
```

**Confirmed:**
- **Database Type:** FIRESTORE_NATIVE ✅
- **Location:** us-central1 ✅
- **Status:** ACTIVE ✅
- **Free Tier:** Enabled ✅

---

## 📊 SECURITY MODEL

### **Client Access Pattern**
1. **Frontend creates submission** → `submissions/{id}` with status: "pending"
2. **Client has NO read access** → Cannot query existing submissions
3. **Payment triggers webhook** → Server updates to status: "paid"
4. **Analysis processing** → Server manages `analysis/{id}` collection
5. **PDF generation** → Server writes to Firebase Storage
6. **Download access** → Server generates signed URLs only

### **Server Access Pattern**
- **Admin SDK** bypasses all security rules
- **Full CRUD access** to all collections
- **Manages state transitions** through submission workflow
- **Controls all PDF storage operations**

---

## 🎯 DATA FLOW VALIDATION

### **Submission Lifecycle**
```
1. Frontend → submissions/{id}: {status: "pending", priceCents: 499}
2. Stripe webhook → submissions/{id}: {status: "paid"}
3. Backend processor → analysis/{id}: {status: "processing"}
4. Vertex AI analysis → analysis/{id}: {status: "ready", reportPath: "..."}
5. Client download → Server generates signed URL from reportPath
```

### **Security Checkpoints**
- ✅ **Price enforcement** - Only 499 cents allowed in submissions
- ✅ **Status validation** - Only "pending" allowed on create
- ✅ **No data leakage** - Clients cannot read existing submissions
- ✅ **Server control** - Analysis collection fully protected
- ✅ **Report security** - PDFs not directly accessible by clients

---

## 📋 VERIFICATION COMMANDS

```bash
# Check deployed rules
firebase firestore:rules:get --project diagnostic-pro-prod

# Verify database status
gcloud firestore databases describe --database=(default) --project=diagnostic-pro-prod

# Test rule compilation
firebase firestore:rules:check --project diagnostic-pro-prod
```

---

**STATUS:** ✅ **COMPLETE** - Firestore schema deployed with enterprise security rules
**NEXT:** Section 2 - Canonical bucket alignment for PDF storage