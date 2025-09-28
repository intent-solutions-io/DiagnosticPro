# WWW Subdomain Redirect Configuration - diagnosticpro.io

**Date:** 2025-09-25T22:35:00Z
**Status:** 🟡 PARTIAL COMPLETE - Firebase config deployed, domain addition required

---

## 🎯 **OBJECTIVE SUMMARY**

**TASK:** Configure Firebase Hosting so all traffic from https://www.diagnosticpro.io redirects permanently (301) to https://diagnosticpro.io

**USER REQUEST:** "configure Firebase Hosting so all traffic from https://www.diagnosticpro.io redirects permanently (301) to https://diagnosticpro.io"

---

## ✅ **COMPLETED ACTIONS**

### **1. Firebase Configuration Updated ✅**

**Modified:** `/home/jeremy/projects/diagnostic-platform/firebase.json`

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "redirects": [
      {
        "source": "https://www.diagnosticpro.io/**",
        "destination": "https://diagnosticpro.io/:splat",
        "type": 301
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Changes Made:**
- ✅ **Added redirects section** before rewrites
- ✅ **301 permanent redirect** configured
- ✅ **Wildcard pattern** `/**` captures all paths
- ✅ **:splat parameter** preserves original path in destination

### **2. Firebase Deployment Complete ✅**

```bash
firebase deploy --only hosting

Response:
=== Deploying to 'diagnostic-pro-prod'...
✔  Deploy complete!
Project Console: https://console.firebase.google.com/project/diagnostic-pro-prod/overview
Hosting URL: https://diagnostic-pro-prod.web.app
```

**Deployment Status:** ✅ Successfully deployed redirect configuration

---

## ⚠️ **CURRENT ISSUE: SSL CERTIFICATE**

### **Problem Identified:**
```bash
curl -I https://www.diagnosticpro.io

Response:
curl: (60) SSL: no alternative certificate subject name matches target host name 'www.diagnosticpro.io'
```

**Root Cause:** The current SSL certificate only covers `diagnosticpro.io`, not `www.diagnosticpro.io`

**Impact:** Users accessing www.diagnosticpro.io will see SSL errors before redirect can execute

---

## 🛠️ **REQUIRED MANUAL STEPS**

### **Step 1: Add www Domain in Firebase Console**

**Action Required:** Go to [Firebase Console](https://console.firebase.google.com/project/diagnostic-pro-prod/hosting/domains)

**Steps:**
1. Navigate to **Firebase Console** → **diagnostic-pro-prod** → **Hosting** → **Custom domains**
2. Click **"Add custom domain"**
3. Enter: `www.diagnosticpro.io`
4. Complete domain verification process
5. Firebase will automatically issue SSL certificate that includes www subdomain

### **Step 2: DNS Configuration**

**Required DNS Record:**
```
Type: CNAME
Name: www
Value: diagnostic-pro-prod.web.app.
TTL: 300 (or default)
```

**Action:** Add this CNAME record in your domain registrar's DNS settings

---

## 🧪 **VERIFICATION STEPS**

### **Once Domain is Added:**

**Test 1: SSL Certificate**
```bash
curl -I https://www.diagnosticpro.io
# Should return HTTP 301 with Location header
```

**Test 2: Redirect Functionality**
```bash
curl -I -L https://www.diagnosticpro.io/some/path
# Should redirect to https://diagnosticpro.io/some/path
```

**Test 3: Browser Test**
- Navigate to `https://www.diagnosticpro.io`
- Should automatically redirect to `https://diagnosticpro.io`
- URL bar should show `diagnosticpro.io` without www

---

## 📋 **REDIRECT CONFIGURATION DETAILS**

### **Firebase Hosting Redirect Rule:**
```json
{
  "source": "https://www.diagnosticpro.io/**",
  "destination": "https://diagnosticpro.io/:splat",
  "type": 301
}
```

**Configuration Explanation:**
- **source**: Matches all URLs on www subdomain
- **destination**: Redirects to root domain preserving path
- **type**: 301 = Permanent redirect (SEO-friendly)
- **:splat**: Preserves original path and query parameters

### **Path Preservation Examples:**
- `https://www.diagnosticpro.io/` → `https://diagnosticpro.io/`
- `https://www.diagnosticpro.io/about` → `https://diagnosticpro.io/about`
- `https://www.diagnosticpro.io/contact?ref=google` → `https://diagnosticpro.io/contact?ref=google`

---

## 🔄 **CURRENT STATUS SUMMARY**

### **✅ COMPLETED:**
1. **Firebase redirect configuration** - 301 redirect rule added
2. **Configuration deployment** - Changes pushed to Firebase Hosting
3. **Path preservation setup** - :splat parameter configured correctly

### **⏳ PENDING MANUAL ACTIONS:**
1. **Add www.diagnosticpro.io in Firebase Console** - Required for SSL certificate
2. **Configure DNS CNAME record** - Point www to Firebase Hosting
3. **Verify redirect functionality** - Test after SSL certificate is issued

---

## 🎯 **FINAL VERIFICATION COMMANDS**

**After completing manual steps, run these commands to verify:**

```bash
# Test SSL certificate includes www
openssl s_client -connect www.diagnosticpro.io:443 -servername www.diagnosticpro.io

# Test redirect headers
curl -I https://www.diagnosticpro.io

# Test redirect with path preservation
curl -I https://www.diagnosticpro.io/test/path

# Test in browser
echo "Navigate to https://www.diagnosticpro.io in browser"
```

---

## 📖 **TECHNICAL IMPLEMENTATION**

### **Firebase Hosting Redirect Features:**
- **Automatic SSL**: Firebase provisions SSL certificates for all custom domains
- **Global CDN**: Redirects served from edge locations worldwide
- **SEO-Friendly**: 301 redirects preserve search engine rankings
- **Path Preservation**: Query parameters and paths maintained in redirect

### **Why This Approach:**
1. **Native Firebase Feature**: Uses built-in redirect functionality
2. **Performance**: Redirects handled at CDN edge, not application level
3. **Reliability**: No server-side code needed for redirects
4. **Maintenance**: Configuration managed in firebase.json

---

**COMPLETION TIME:** 2025-09-25T22:35:00Z
**STATUS:** 🟡 PARTIAL - Configuration deployed, domain addition required
**NEXT STEP:** Add www.diagnosticpro.io domain in Firebase Console

---

## 🔗 **REFERENCES**

- **Firebase Console:** https://console.firebase.google.com/project/diagnostic-pro-prod/hosting/domains
- **Firebase Hosting Redirects:** https://firebase.google.com/docs/hosting/full-config#redirects
- **Domain Verification:** https://firebase.google.com/docs/hosting/custom-domain