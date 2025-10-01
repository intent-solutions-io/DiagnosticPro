# Firebase Site Audit - DiagnosticPro Domain Fix
**Date:** September 25, 2025
**Session:** Firebase Hosting Domain Cleanup

## Current Firebase Hosting Sites

```
Sites for project diagnostic-pro-prod

┌────────────────────────┬────────────────────────────────────────┬───────────────────────────────────────────┐
│ Site ID                │ Default URL                            │ App ID (if set)                           │
├────────────────────────┼────────────────────────────────────────┼───────────────────────────────────────────┤
│ diagnostic-pro-prod    │ https://diagnostic-pro-prod.web.app    │ 1:298932670545:web:d710527356371228556870 │
├────────────────────────┼────────────────────────────────────────┼───────────────────────────────────────────┤
│ redirect-diagnosticpro │ https://redirect-diagnosticpro.web.app │ --                                        │
└────────────────────────┴────────────────────────────────────────┴───────────────────────────────────────────┘
```

## Site Analysis

### diagnostic-pro-prod
- **Status**: Main production site with App ID
- **Purpose**: Should be the primary site for diagnosticpro.io
- **Configuration**: Has proper App ID linking

### redirect-diagnosticpro
- **Status**: Secondary site (no App ID)
- **Purpose**: Created for www redirect functionality
- **Issue**: May be incorrectly configured with custom domains

## Issues Identified

1. **Dual Site Confusion**: Two sites exist when only one should serve the main domain
2. **Domain Mapping**: Need to verify which site owns diagnosticpro.io and www.diagnosticpro.io
3. **SSL Issues**: Previous SSL provisioning problems due to domain conflicts

## Next Steps

- Move all custom domains to diagnostic-pro-prod
- Configure redirect-diagnosticpro for 301 redirects only (or delete)
- Ensure clean domain ownership

---
**Status**: Phase 1 Complete - Moving to Domain Mapping Fix