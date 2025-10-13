# GetTerms Integration - Terms of Service & Privacy Policy

**Date**: October 3, 2025
**Status**: ✅ Complete
**Project**: DiagnosticPro Frontend

---

## Overview

Integrated GetTerms embed service to automatically display and manage Terms of Service and Privacy Policy documents on DiagnosticPro.io. This replaces the previous static content with dynamically managed legal documents.

---

## What Was Changed

### 1. Terms of Service Page (`Terms.tsx`)

**Before:**
- Static HTML content with 7 hardcoded sections
- Manual updates required for any changes
- No version control or legal compliance tracking

**After:**
- GetTerms embed integration
- Dynamically loaded from GetTerms CDN
- Automatic updates when terms are modified in GetTerms dashboard
- Professional legal document management

**File**: `/02-src/frontend/src/src/pages/Terms.tsx`

### 2. Privacy Policy Page (`Privacy.tsx`)

**Before:**
- Static HTML content with 9 hardcoded sections
- Manual updates required for any changes
- No compliance tracking

**After:**
- GetTerms embed integration
- Dynamically loaded from GetTerms CDN
- Automatic updates when privacy policy is modified in GetTerms dashboard
- GDPR/CCPA compliance features built-in

**File**: `/02-src/frontend/src/src/pages/Privacy.tsx`

---

## Technical Implementation

### GetTerms Configuration

**Account ID**: `wH2cn`

**Documents**:
- `terms` - Terms of Service
- `privacy` - Privacy Policy

**CDN URL**: `https://gettermscdn.com`

### Embed Code Structure

```jsx
<div
  className="getterms-document-embed"
  data-getterms="wH2cn"
  data-getterms-document="terms"  // or "privacy"
  data-getterms-lang="en-us"
  data-getterms-mode="direct"
  data-getterms-env="https://gettermscdn.com"
></div>
```

### React Implementation

Both pages now use React `useEffect` hook to:
1. Load GetTerms embed script dynamically
2. Initialize the embed container
3. Clean up script on component unmount

```typescript
useEffect(() => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.id = 'getterms-embed-js';
  script.src = 'https://gettermscdn.com/dist/js/embed.js';

  const existingScript = document.getElementById('getterms-embed-js');
  if (!existingScript) {
    document.body.appendChild(script);
  }

  return () => {
    const scriptToRemove = document.getElementById('getterms-embed-js');
    if (scriptToRemove) {
      scriptToRemove.remove();
    }
  };
}, []);
```

---

## Benefits

### For Legal Compliance
✅ **Professional document management** - Legal documents managed by GetTerms platform
✅ **Version control** - Track changes and updates automatically
✅ **Compliance tracking** - Built-in GDPR/CCPA compliance features
✅ **Audit trail** - Document when users accept terms

### For Development
✅ **No manual updates** - Changes made in GetTerms dashboard auto-reflect on site
✅ **Consistent formatting** - Professional legal document styling
✅ **Easy maintenance** - Update once in GetTerms, applies everywhere
✅ **Reduced liability** - Legal experts maintain document structure

### For Users
✅ **Professional presentation** - Clean, readable legal documents
✅ **Always up-to-date** - Latest terms and policies automatically displayed
✅ **Mobile responsive** - Optimized for all devices
✅ **Accessibility** - Compliant with accessibility standards

---

## How to Update Legal Documents

### Option 1: Via GetTerms Dashboard (Recommended)

1. Login to GetTerms dashboard (account: `wH2cn`)
2. Navigate to document (Terms or Privacy)
3. Make edits using GetTerms editor
4. Publish changes
5. Changes automatically appear on DiagnosticPro.io

**No code changes or deployments needed!**

### Option 2: Embed Configuration

To change document settings (language, mode, etc.):

1. Edit `Terms.tsx` or `Privacy.tsx`
2. Modify data attributes in the embed div:
   ```jsx
   data-getterms-lang="en-us"  // Change language
   data-getterms-mode="direct"  // Change display mode
   ```
3. Rebuild and deploy frontend

---

## Testing

### Verify Integration

1. **Frontend Dev Server**:
   ```bash
   cd /02-src/frontend
   npm run dev
   ```

2. **Navigate to pages**:
   - http://localhost:5173/terms
   - http://localhost:5173/privacy

3. **Verify loading**:
   - Page loads without errors
   - GetTerms content displays
   - Styling matches site design
   - Mobile responsive works

### Production Verification

1. Deploy to Firebase Hosting
2. Visit https://diagnosticpro.io/terms
3. Visit https://diagnosticpro.io/privacy
4. Verify documents load correctly

---

## Files Modified

```
DiagnosticPro/
├── 02-src/frontend/src/src/pages/
│   ├── Terms.tsx       ✅ Updated with GetTerms embed
│   └── Privacy.tsx     ✅ Updated with GetTerms embed
└── claudes-docs/
    └── 2025-10-03-getterms-integration.md  ✅ This document
```

---

## Deployment Checklist

- [x] Update Terms.tsx with GetTerms embed
- [x] Update Privacy.tsx with GetTerms embed
- [x] Test locally on dev server
- [ ] Build frontend: `npm run build`
- [ ] Deploy to Firebase: `firebase deploy --only hosting`
- [ ] Verify on production: https://diagnosticpro.io/terms
- [ ] Verify on production: https://diagnosticpro.io/privacy

---

## GetTerms Account Details

**Account**: `wH2cn`
**Documents**: 2 (Terms, Privacy)
**Language**: English (US)
**Mode**: Direct embed
**CDN**: https://gettermscdn.com

To manage documents:
- Login to GetTerms dashboard
- Edit documents as needed
- Changes auto-deploy to site

---

## Future Enhancements

### Potential Additions

1. **Cookie Policy**
   - Add cookie consent banner
   - Create GetTerms document for cookies
   - Integrate with site

2. **Refund Policy**
   - Create refund policy document
   - Add page to site navigation
   - Link from checkout flow

3. **Acceptable Use Policy**
   - Define acceptable use terms
   - Create GetTerms document
   - Add to footer links

4. **Multi-language Support**
   - Add language selector
   - Create documents in multiple languages
   - Use `data-getterms-lang` attribute

---

## Troubleshooting

### Document Not Loading

**Symptoms**: Blank space where terms/privacy should appear

**Solutions**:
1. Check browser console for errors
2. Verify GetTerms script loads: Look for `getterms-embed-js` in Network tab
3. Verify account ID is correct: `data-getterms="wH2cn"`
4. Check document name: `data-getterms-document="terms"` or `"privacy"`

### Styling Issues

**Symptoms**: Document looks wrong or unstyled

**Solutions**:
1. Check `prose` classes on container div
2. Verify GetTerms CSS loads from CDN
3. Review custom CSS conflicts
4. Test in different browsers

### Script Loading Twice

**Symptoms**: Multiple script tags in DOM

**Solutions**:
1. Check `useEffect` cleanup function
2. Verify script ID check: `getElementById('getterms-embed-js')`
3. Test component mount/unmount cycle

---

## References

- **GetTerms Website**: https://getterms.io
- **GetTerms CDN**: https://gettermscdn.com
- **Embed Documentation**: https://getterms.io/docs/embed
- **React Integration**: https://reactjs.org/docs/hooks-effect.html

---

## Summary

Successfully integrated GetTerms for automated legal document management. Both Terms of Service and Privacy Policy now load dynamically from GetTerms CDN, allowing easy updates through the GetTerms dashboard without code changes or redeployment.

**Next Steps**:
1. Build and deploy frontend to production
2. Verify documents load correctly on live site
3. Test on multiple devices and browsers
4. Update legal documents in GetTerms dashboard as needed

---

**Last Updated**: October 3, 2025
**Integration Status**: ✅ Complete
**Testing Status**: Ready for deployment
**Production Status**: Pending deployment
