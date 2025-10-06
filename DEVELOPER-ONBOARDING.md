# DiagnosticPro Developer Onboarding

**Welcome!** This guide will get you up and running in under 5 minutes.

---

## 🚀 Quick Start (2 Commands)

```bash
# 1. Run automated setup script
./scripts/automated-dev-setup.sh

# 2. Authenticate with Google Cloud
gcloud auth application-default login
```

**That's it!** Frontend and backend are ready to run.

---

## 📋 What the Setup Script Does

The `automated-dev-setup.sh` script automatically:

✅ **Frontend Setup:**
- Creates `.env` with all Firebase configuration
- Installs npm dependencies
- Ready to run with `npm run dev`

✅ **Backend Setup:**
- Creates `.env` with Google Cloud config
- Configures Secret Manager for cross-project access
- Installs npm dependencies
- Ready to run with `npm start`

✅ **Verification:**
- Checks Google Cloud authentication
- Confirms all configurations

---

## 🏗️ Architecture Overview

### Projects Structure

```
diagnosticpro-relay-1758728286  (Your VM/Dev Environment)
    ↓
    Accesses secrets from
    ↓
diagnostic-pro-prod  (Production - Secrets stored here)
    ├── Firebase (Frontend)
    ├── Secret Manager (Stripe keys)
    ├── Cloud Storage (Reports)
    └── Firestore (Database)
```

### Why Cross-Project?

- **Secrets centralized** in production project (`diagnostic-pro-prod`)
- **Development work** happens in relay project
- **IAM permissions** allow cross-project secret access
- **No secret duplication** needed

---

## 📁 Directory Structure

```
DiagnosticPro/
├── 02-src/
│   ├── frontend/               # React + TypeScript + Vite
│   │   ├── .env               # ✅ Auto-created by setup script
│   │   ├── package.json
│   │   └── src/
│   └── backend/
│       └── services/
│           └── backend/        # Node.js + Express + Vertex AI
│               ├── .env       # ✅ Auto-created by setup script
│               ├── secrets.js # Secret Manager integration
│               ├── index.js   # Main server
│               └── package.json
├── scripts/
│   └── automated-dev-setup.sh # ✅ Run this first!
└── DEVELOPER-ONBOARDING.md    # This file
```

---

## 🔐 Environment Variables (Already Configured!)

### Frontend (.env) - Already Created ✅

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg
VITE_FIREBASE_AUTH_DOMAIN=diagnostic-pro-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=diagnostic-pro-prod
VITE_FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=298932670545
VITE_FIREBASE_APP_ID=1:298932670545:web:d710527356371228556870
VITE_FIREBASE_MEASUREMENT_ID=G-VQW6LFYQPS

# API Configuration
VITE_API_GATEWAY_URL=https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev
VITE_USE_NEW_API=true
```

### Backend (.env) - Already Created ✅

```bash
# Google Cloud Project (where secrets are stored)
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod

# Storage Bucket
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1

# Local Development
PORT=8080
NODE_ENV=development
```

### Secrets (Loaded Automatically from Secret Manager) ✅

The backend automatically loads these from `diagnostic-pro-prod`:
- `stripe-secret` → Stripe API Key
- `stripe-webhook-secret` → Webhook Signature

**You don't manage these manually!** They're fetched automatically when the backend starts.

---

## 🚦 Running the Application

### Terminal 1: Frontend

```bash
cd 02-src/frontend
npm run dev
```

Frontend runs on: http://localhost:5173

### Terminal 2: Backend

```bash
cd 02-src/backend/services/backend
npm start
```

Backend runs on: http://localhost:8080

### Expected Output

**Frontend:**
```
VITE v5.x.x ready in xxx ms
➜ Local:   http://localhost:5173/
➜ Network: use --host to expose
```

**Backend:**
```
🔐 Loading secrets from Google Secret Manager...
✅ Loaded secret: stripe-secret
✅ Loaded secret: stripe-webhook-secret
✅ All secrets loaded successfully
🚀 DiagnosticPro Backend running on port 8080
📁 Storage: gs://diagnostic-pro-prod-reports-us-central1
```

---

## 🔧 How Secret Manager Works

### Flow Diagram

```
Backend Starts
    ↓
Loads secrets.js
    ↓
Calls: loadAllSecrets()
    ↓
Fetches from: diagnostic-pro-prod Secret Manager
    ↓
Uses VM Service Account: 861259673861-compute@developer.gserviceaccount.com
    ↓
Returns: { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET }
    ↓
Initializes: Stripe, Firestore, Storage
    ↓
Server Ready!
```

### Why This Is Secure

✅ **No secrets in code** - Never committed to git
✅ **Centralized storage** - One source of truth
✅ **IAM controlled** - Only authorized accounts can access
✅ **Audited** - All access logged in Google Cloud
✅ **Easy rotation** - Update in one place

---

## 🚨 Troubleshooting

### Error: "Could not load the default credentials"

**Solution:**
```bash
gcloud auth application-default login
```

### Error: "Permission denied accessing secret"

**Already Fixed!** Jeremy granted your VM service account these permissions:
- `roles/secretmanager.secretAccessor` ✅
- `roles/secretmanager.viewer` ✅

### Error: "Firebase not initialized"

**Solution:** Run the setup script:
```bash
./scripts/automated-dev-setup.sh
```

This creates the frontend `.env` file automatically.

### Backend starts but shows wrong project

**Solution:** The setup script already configured this, but verify:

In `02-src/backend/services/backend/secrets.js` line 4 should be:
```javascript
const PROJECT_ID = 'diagnostic-pro-prod'; // Secrets stored here
```

---

## 📚 Additional Documentation

- **Backend Setup**: `02-src/backend/services/backend/SECRET-MANAGER-SETUP.md`
- **Secret Manager Fix**: `02-src/backend/services/backend/FIX-SECRETS-ACCESS.md`
- **General Setup**: `02-src/backend/services/backend/SETUP.md`

---

## 🎯 Common Development Tasks

### Install New Package (Frontend)

```bash
cd 02-src/frontend
npm install package-name
```

### Install New Package (Backend)

```bash
cd 02-src/backend/services/backend
npm install package-name
```

### View Backend Logs

```bash
cd 02-src/backend/services/backend
npm start
# Logs appear in terminal
```

### Build for Production (Frontend)

```bash
cd 02-src/frontend
npm run build
```

### Run Tests

```bash
# Frontend
cd 02-src/frontend
npm test

# Backend
cd 02-src/backend/services/backend
npm test
```

---

## ✅ Verification Checklist

After running the setup script, verify:

- [ ] Frontend `.env` exists with Firebase config
- [ ] Backend `.env` exists with Google Cloud config
- [ ] `gcloud auth application-default login` completed
- [ ] Frontend starts: `cd 02-src/frontend && npm run dev`
- [ ] Backend starts: `cd 02-src/backend/services/backend && npm start`
- [ ] Backend logs show "✅ All secrets loaded successfully"

---

## 🆘 Getting Help

If you're still stuck after following this guide:

1. Check the troubleshooting section above
2. Review the additional documentation files
3. Contact Jeremy with:
   - Exact error message
   - Steps you've already tried
   - Output of: `gcloud auth application-default print-access-token`

---

## 🎉 You're Ready!

Once the checklist above is complete, you're ready to develop!

**Key Points to Remember:**

1. **Secrets are automatic** - Don't ask for Stripe keys, they load from Secret Manager
2. **Firebase config is in .env** - Already configured by setup script
3. **Cross-project access works** - Your VM can access diagnostic-pro-prod secrets
4. **Two terminals needed** - One for frontend, one for backend

**Happy coding!** 🚀

---

**Last Updated**: October 3, 2025
**Setup Time**: ~3 minutes
**Prerequisites**: Google Cloud SDK, Node.js 18+, npm
