# Security Quick Reference Card

## ⚠️ IMMEDIATE ACTIONS REQUIRED

### 1. Complete Git History Cleanup (5 minutes)

1. **Remove branch protection:**
   - Go to: https://github.com/jeremylongshore/DiagnosticPro/settings/branches
   - Click on `main` branch rule
   - Delete or disable protection

2. **Force push:**
   ```bash
   cd ~/000-projects/diagnostic-platform/DiagnosticPro
   git push origin --force --all
   git push origin --force --tags
   ```

3. **Re-enable branch protection**

### 2. Update Real Secret Values (2 minutes)

```bash
# Get your real Stripe keys from: https://dashboard.stripe.com/apikeys
echo "YOUR_REAL_STRIPE_SECRET_KEY" | gcloud secrets versions add STRIPE_SECRET_KEY --project=diagnostic-pro-prod --data-file=-

echo "YOUR_REAL_WEBHOOK_SECRET" | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --project=diagnostic-pro-prod --data-file=-

echo "YOUR_REAL_API_GATEWAY_KEY" | gcloud secrets versions add API_GATEWAY_KEY --project=diagnostic-pro-prod --data-file=-
```

### 3. Deploy with New Security (3 minutes)

```bash
cd ~/000-projects/diagnostic-platform/DiagnosticPro/02-src/backend/services/backend

# Install new dependency
npm install

# Test locally (optional)
npm run dev

# Deploy to Cloud Run
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source . \
  --region us-central1 \
  --project diagnostic-pro-prod \
  --set-secrets="STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,FIREBASE_API_KEY=FIREBASE_API_KEY:latest"
```

---

## 📋 Verification Commands

### Check Secrets
```bash
# List all secrets
gcloud secrets list --project=diagnostic-pro-prod

# View secret value (to verify it's correct)
gcloud secrets versions access latest --secret=STRIPE_SECRET_KEY --project=diagnostic-pro-prod
```

### Check Cloud Run Deployment
```bash
# View recent logs
gcloud logging read "resource.type=\"cloud_run_revision\" \
  AND resource.labels.service_name=\"diagnosticpro-vertex-ai-backend\"" \
  --project diagnostic-pro-prod \
  --limit 20

# Look for: "🔒 Using Google Secret Manager for sensitive credentials"
```

### Check GitHub Actions
- Visit: https://github.com/jeremylongshore/DiagnosticPro/actions
- Verify workflow runs successfully after push

---

## 🔒 What Changed

| Before | After |
|--------|-------|
| API keys in `.env` files | API keys in Secret Manager |
| Hardcoded credentials | Runtime secret fetching |
| Service account JSON keys | Workload Identity Federation |
| Manual rotation | Automatic version management |
| Exposed in Git history | Cleaned Git history |

---

## 🚨 Emergency Contacts

- **GCP Console:** https://console.cloud.google.com/run?project=diagnostic-pro-prod
- **Secret Manager:** https://console.cloud.google.com/security/secret-manager?project=diagnostic-pro-prod
- **GitHub Repo:** https://github.com/jeremylongshore/DiagnosticPro

---

## 📖 Full Documentation

See `SECURITY_SETUP.md` for complete details and troubleshooting.

**Status:** ✅ Infrastructure ready, awaiting final deployment
