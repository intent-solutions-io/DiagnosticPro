# Fix Secret Manager Access - Cross-Project Setup

**Issue**: You're working in `diagnosticpro-relay-1758728286` but secrets are stored in `diagnostic-pro-prod`.

**Solution**: Update the secrets.js file to use the correct project.

---

## Quick Fix (1 minute)

### Step 1: Edit secrets.js

Open this file:
```
/home/jeremy/projects/diagnostic-platform/DiagnosticPro/02-src/backend/services/backend/secrets.js
```

### Step 2: Change Line 4

**Find this line:**
```javascript
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'diagnostic-pro-prod';
```

**Replace with:**
```javascript
const PROJECT_ID = 'diagnostic-pro-prod'; // Secrets are stored here
```

### Step 3: Start the backend

```bash
npm start
```

---

## Why This Works

Your VM is in project: `diagnosticpro-relay-1758728286`
Secrets are in project: `diagnostic-pro-prod`

**Jeremy already granted your VM's service account permission to read secrets from diagnostic-pro-prod** (cross-project access).

By hardcoding `PROJECT_ID = 'diagnostic-pro-prod'`, the backend will fetch secrets from the correct project.

---

## Verification

When you run `npm start`, you should see:

```
🔐 Loading secrets from Google Secret Manager...
✅ Loaded secret: stripe-secret
✅ Loaded secret: stripe-webhook-secret
✅ All secrets loaded successfully
🚀 DiagnosticPro Backend running on port 8080
```

If you see this, it's working! ✅

---

## Alternative: Environment Variable

Instead of editing secrets.js, you can also set this in your .env file:

```bash
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1
PORT=8080
NODE_ENV=development
```

Then restart:
```bash
npm start
```

---

**That's it! The permissions are already configured. Just point to the right project.**
