# 🔐 CREDENTIALS TO ROTATE BEFORE GOING PUBLIC

**CRITICAL**: These credentials were exposed in git history and MUST be rotated before making this repository public.

## Status: ⚠️ REQUIRES ACTION

---

## 1. Firebase API Keys (HIGH PRIORITY)

### Exposed Credentials
- **Firebase API Key**: `AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg`
- **API Gateway Key**: `REDACTED_API_KEY`
- **App ID**: `1:298932670545:web:d710527356371228556870`
- **Measurement ID**: `G-VQW6LFYQPS`

### How to Rotate
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `diagnostic-pro-prod`
3. Go to **Project Settings** → **General**
4. Delete current web app and create new one
5. Update `.env` with new credentials
6. Redeploy frontend to Firebase Hosting

### Impact
- **Severity**: Medium (Firebase API keys are domain-restricted)
- **Risk**: Unauthorized API usage if domain restrictions removed
- **Timeline**: Rotate before public release

---

## 2. Service Account Keys (CRITICAL PRIORITY)

### Files Found in Git History
```
❌ firebase-deployer-key.json
❌ firebase-key.json
```

### How to Rotate
1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/serviceaccounts?project=diagnostic-pro-prod)
2. Find service accounts used for deployment
3. **Delete old keys** from the service account
4. Create **new keys** and download JSON
5. Store new keys in **Google Secret Manager** (never in git)
6. Update CI/CD secrets in GitHub Actions:
   - Repository Settings → Secrets → Actions
   - Update `GCP_SA_KEY` or equivalent

### Impact
- **Severity**: CRITICAL
- **Risk**: Full project access, can deploy, modify resources
- **Timeline**: ROTATE IMMEDIATELY

---

## 3. Stripe API Keys (HIGH PRIORITY)

### Likely Exposed (check git history)
- Test mode keys found in documentation files
- Production keys may exist in git history

### How to Rotate
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. **Roll** all API keys (test and live mode)
3. Update webhook secrets:
   - Dashboard → Developers → Webhooks
   - Delete old webhook endpoint
   - Create new webhook with new secret
4. Update environment variables:
   - `.env` local file
   - Cloud Run environment variables
   - GitHub Actions secrets

### Impact
- **Severity**: HIGH
- **Risk**: Unauthorized payment processing, refunds
- **Timeline**: Rotate before public release

---

## 4. API Gateway Keys

### Exposed in .env
- Gateway URL: `diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev`
- API Key: `REDACTED_API_KEY`

### How to Rotate
1. Go to [API Gateway Console](https://console.cloud.google.com/api-gateway/api)
2. Select gateway: `diagpro-gw-3tbssksx`
3. Create new API key in [API Credentials](https://console.cloud.google.com/apis/credentials)
4. Update gateway configuration with new key
5. Delete old API key

### Impact
- **Severity**: Medium
- **Risk**: Unauthorized API access
- **Timeline**: Rotate before public release

---

## 5. GitHub Actions Secrets (VERIFY)

### Secrets to Check/Rotate
```bash
# Check current secrets in GitHub repo
gh secret list
```

Required secrets:
- `GCP_SA_KEY` - Service account JSON (rotate per #2)
- `FIREBASE_TOKEN` - Firebase CI token (regenerate if exists)
- `STRIPE_SECRET_KEY` - Stripe API key (rotate per #3)

### How to Update
```bash
# Set new secret
gh secret set GCP_SA_KEY < new-service-account-key.json
gh secret set STRIPE_SECRET_KEY -b "sk_live_new_key_here"
```

---

## Git History Cleanup (After Rotation)

Once all credentials are rotated, clean git history:

### Option 1: BFG Repo-Cleaner (Recommended)
```bash
# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Backup first!
cp -r .git .git.backup

# Remove sensitive files
bfg --delete-files firebase-deployer-key.json
bfg --delete-files firebase-key.json
bfg --replace-text passwords.txt  # Create file with keys to redact

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Option 2: Fresh Start (Nuclear Option)
```bash
# If repo is small, start fresh:
# 1. Create new empty repo on GitHub
# 2. Copy only current working files
# 3. Make initial commit without history
```

---

## Verification Checklist

Before making repo public, verify:

- [ ] All Firebase keys rotated and tested
- [ ] Service account keys deleted from GCP console
- [ ] New service account keys stored in Secret Manager
- [ ] Stripe keys rolled and webhooks updated
- [ ] API Gateway keys regenerated
- [ ] GitHub Actions secrets updated
- [ ] Git history cleaned or fresh repo created
- [ ] Test deployment works with new credentials
- [ ] `.env` file is in `.gitignore`
- [ ] No `.env` or `.env.production` in git history
- [ ] `firebase-*-key.json` files not in git history
- [ ] Run final security scan (see PUBLIC_REPO_CHECKLIST.md)

---

## Resources

- [Firebase Key Restrictions](https://firebase.google.com/docs/projects/api-keys)
- [GCP Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Stripe Key Management](https://stripe.com/docs/keys)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Created**: 2025-11-20
**Status**: Pending rotation
**Next Action**: Rotate service account keys immediately
