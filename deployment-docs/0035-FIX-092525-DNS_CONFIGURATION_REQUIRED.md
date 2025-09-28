# DNS Configuration Required - DiagnosticPro Domain Fix
**Date:** September 25, 2025
**Status:** Phase 3 - DNS Update Required

## Current DNS Status (INCORRECT)

```bash
# Apex domain - NO A record configured
dig +short diagnosticpro.io A
# (no output - not configured)

# www subdomain - Points to DELETED site
dig +short www.diagnosticpro.io CNAME
redirect-diagnosticpro.web.app.  # ❌ This site was just deleted!
```

## Required DNS Changes at Porkbun

### 1. Apex Domain (diagnosticpro.io)
```
Type: A
Name: @
Value: 199.36.158.100
TTL: 600 (or default)
```

### 2. www Subdomain (www.diagnosticpro.io)
```
Type: CNAME
Name: www
Value: ghs.googlehosted.com
TTL: 600 (or default)
```

### 3. Delete Current Record
- **Remove**: `www.diagnosticpro.io CNAME redirect-diagnosticpro.web.app`

## Firebase Configuration Status
- ✅ Single site: `diagnostic-pro-prod`
- ✅ Frontend deployed: React app serving correctly
- ✅ firebase.json: Configured for single-site with www→apex redirect
- ⏳ Custom domains: Need to be added via Firebase Console after DNS

## Next Steps
1. **Update DNS** at Porkbun with above records
2. **Wait 5-15 minutes** for DNS propagation
3. **Add custom domains** in Firebase Console
4. **Verify SSL** provisioning

---
**Current Blocker**: DNS records still pointing to deleted redirect site