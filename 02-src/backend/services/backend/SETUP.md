# Backend Setup Guide - Using Google Secret Manager

This backend uses **Google Secret Manager** to securely manage secrets like Stripe API keys. No manual secret management needed!

## ✅ Prerequisites

1. Google Cloud SDK installed and authenticated
2. Access to project: `diagnostic-pro-prod`
3. Node.js 18+ installed

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro/02-src/backend/services/backend
npm install
```

### 2. Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth application-default login

# Set the project
gcloud config set project diagnostic-pro-prod
```

### 3. Verify Secrets Exist

```bash
# List all secrets in Secret Manager
gcloud secrets list --project=diagnostic-pro-prod

# Should show:
# - stripe-secret
# - stripe-webhook-secret
```

### 4. Start the Backend

```bash
npm start
# or for development with auto-reload:
npm run dev
```

That's it! The backend will automatically load secrets from Secret Manager on startup.

## 🔐 How It Works

1. Backend starts and calls `loadAllSecrets()` from `secrets.js`
2. Secrets are fetched from Google Secret Manager:
   - `stripe-secret` → Stripe API key
   - `stripe-webhook-secret` → Webhook signature validation
3. Services are initialized with the loaded secrets
4. Server starts on port 8080

## 📝 Environment Variables

The `.env` file only contains non-secret configuration:

```bash
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1
PORT=8080
NODE_ENV=development
```

**No secrets in .env files!** All sensitive values come from Secret Manager.

## 🔧 Managing Secrets

### View a Secret

```bash
gcloud secrets versions access latest --secret="stripe-secret" --project=diagnostic-pro-prod
```

### Update a Secret

```bash
# Create new version of a secret
echo -n "new_secret_value" | gcloud secrets versions add stripe-secret --data-file=- --project=diagnostic-pro-prod
```

### Add a New Secret

```bash
# Create the secret
gcloud secrets create new-secret-name --replication-policy="automatic" --project=diagnostic-pro-prod

# Add the value
echo -n "secret_value" | gcloud secrets versions add new-secret-name --data-file=- --project=diagnostic-pro-prod
```

Then update `secrets.js` to include the new secret in `loadAllSecrets()`.

## 🚨 Troubleshooting

### Error: Permission Denied

```bash
# Grant yourself Secret Manager access
gcloud projects add-iam-policy-binding diagnostic-pro-prod \
  --member="user:your-email@gmail.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Error: Failed to load secrets

1. Check you're authenticated: `gcloud auth list`
2. Check project is set: `gcloud config get-value project`
3. Verify secrets exist: `gcloud secrets list`

## 🌐 Production Deployment

When deployed to Cloud Run, the service account automatically has access to Secret Manager. No additional configuration needed!

The Cloud Run service uses:
- Service Account: `diagnosticpro-vertex-ai-backend-sa`
- Secrets are loaded at container startup
- Secrets are cached in memory for performance

## 📚 Files

- `secrets.js` - Secret Manager integration
- `index.js` - Main application (uses secrets)
- `.env` - Non-secret configuration only
- `package.json` - Dependencies (includes @google-cloud/secret-manager)

## 🎯 Benefits

✅ **No manual secret files** - No service account JSON files to manage
✅ **Secure** - Secrets never stored in code or .env files
✅ **Centralized** - All secrets managed in Google Cloud Console
✅ **Versioned** - Secret Manager keeps version history
✅ **Audited** - Access logs for compliance
✅ **Easy rotation** - Update secrets without code changes

---

**Last Updated**: October 3, 2025
**Project**: DiagnosticPro v1.0.0
