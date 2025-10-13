# DiagnosticPro Complete Setup - Send This to Your Developer

Hey,

I've created a **fully automated setup** so you don't need to ask for any more configuration values. Everything is pre-configured and ready to go.

---

## ✅ What I've Already Done For You

1. **Created frontend .env** with all Firebase config
2. **Created backend .env** with Google Cloud config
3. **Granted VM permissions** to access Secret Manager
4. **Created automated setup script** to handle everything

---

## 🚀 Your Setup (2 Commands - Takes 3 Minutes)

### Step 1: Run Automated Setup

```bash
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro
./scripts/automated-dev-setup.sh
```

This script:
- ✅ Creates all `.env` files with correct values
- ✅ Installs all npm dependencies
- ✅ Configures Secret Manager for cross-project access
- ✅ Verifies everything is ready

### Step 2: Authenticate with Google Cloud

```bash
gcloud auth application-default login
```

---

## 🏃 Running the Application

**Terminal 1 - Frontend:**
```bash
cd 02-src/frontend
npm run dev
```
Opens on: http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd 02-src/backend/services/backend
npm start
```
Runs on: http://localhost:8080

You should see:
```
🔐 Loading secrets from Google Secret Manager...
✅ Loaded secret: stripe-secret
✅ Loaded secret: stripe-webhook-secret
✅ All secrets loaded successfully
🚀 DiagnosticPro Backend running on port 8080
```

---

## 📋 Environment Variables (All Pre-Configured!)

### Frontend (.env) - Already Created ✅
```
VITE_FIREBASE_PROJECT_ID=diagnostic-pro-prod
VITE_FIREBASE_API_KEY=AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg
VITE_FIREBASE_AUTH_DOMAIN=diagnostic-pro-prod.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=298932670545
VITE_FIREBASE_APP_ID=1:298932670545:web:d710527356371228556870
VITE_FIREBASE_MEASUREMENT_ID=G-VQW6LFYQPS
```

### Backend (.env) - Already Created ✅
```
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1
PORT=8080
```

### Secrets - Loaded Automatically ✅
- Stripe keys load from Google Secret Manager
- No manual configuration needed
- Your VM has permission already

---

## 🔐 How It Works (Architecture)

```
Your VM (diagnosticpro-relay-1758728286)
    ↓
Service Account: 861259673861-compute@developer.gserviceaccount.com
    ↓ (has permission)
Reads Secrets From: diagnostic-pro-prod Secret Manager
    ↓
Loads: stripe-secret, stripe-webhook-secret
    ↓
Backend Starts Successfully
```

**Key Points:**
- Secrets stored in `diagnostic-pro-prod` (production project)
- Your VM in `diagnosticpro-relay-1758728286` has cross-project access
- Permissions already granted by Jeremy
- Everything automated - no manual steps!

---

## 📚 Complete Documentation

Read this for detailed information:
```
/home/jeremy/projects/diagnostic-platform/DiagnosticPro/DEVELOPER-ONBOARDING.md
```

It includes:
- Architecture overview
- How Secret Manager works
- Troubleshooting guide
- Common development tasks
- Verification checklist

---

## ✅ Quick Verification

After setup, check:

1. Frontend .env exists:
   ```bash
   cat 02-src/frontend/.env
   ```

2. Backend .env exists:
   ```bash
   cat 02-src/backend/services/backend/.env
   ```

3. Authentication works:
   ```bash
   gcloud auth application-default print-access-token
   ```

4. Frontend runs:
   ```bash
   cd 02-src/frontend && npm run dev
   ```

5. Backend runs:
   ```bash
   cd 02-src/backend/services/backend && npm start
   ```

---

## 🚨 If Something Breaks

**99% of issues are solved by:**

1. Running the setup script:
   ```bash
   ./scripts/automated-dev-setup.sh
   ```

2. Authenticating:
   ```bash
   gcloud auth application-default login
   ```

**If still stuck**, send Jeremy:
- Exact error message
- Output of the setup script
- What step failed

---

## 🎯 That's It!

No more asking for config values. Everything is automated and pre-configured.

Just run:
1. `./scripts/automated-dev-setup.sh`
2. `gcloud auth application-default login`
3. Start coding!

**Happy developing!** 🚀

---

**Setup Time**: 3 minutes
**Dependencies Installed**: Automatic
**Secrets Configured**: Automatic
**Ready to Code**: ✅
