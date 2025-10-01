# 0078-BUY-BUTTON-INTEGRATION.md

**Date**: 2025-09-27
**Phase**: ENT
**Status**: ✅ COMPLETE

## Stripe Buy Button Integration with Session-Based Redirect

### Overview
Successfully replaced programmatic Stripe checkout session creation with Stripe Buy Button embed, implementing session-based redirect flow with submissionId retrieval.

---

## Implementation Summary

### Backend Changes ✅

**New Endpoint: GET /checkout/session**
- **Location**: `backend/index.js` lines 407-453
- **Purpose**: Retrieve Stripe checkout session details to extract `client_reference_id`
- **Functionality**:
  - Accepts `?id=<session_id>` query parameter
  - Validates session ID format (must start with `cs_`)
  - Calls `stripe.checkout.sessions.retrieve(sessionId)`
  - Returns: `{id, client_reference_id, payment_intent, status}`
  - Structured logging for debugging

**API Gateway Configuration**
- **Version**: `buy-button-20250927-2030`
- **New Route**: `/checkout/session` (GET + OPTIONS for CORS)
- **Backend Target**: `diagnosticpro-vertex-ai-backend-298932670545.us-central1.run.app`
- **Authentication**: API key (`x-api-key` header)
- **JWT Audience**: Service-to-service authentication

**Deployment**
- **Backend Revision**: `diagnosticpro-vertex-ai-backend-00019-hd6` ✅
- **API Gateway Config**: `cfg-buy-button-20250927-2030` ✅

---

### Frontend Changes ✅

#### PaymentSuccess.tsx (Success Page)
**Location**: `src/components/PaymentSuccess.tsx`

**Flow Logic**:
1. Read `session_id` from URL (instead of `submission_id`)
2. Call `/checkout/session?id=<session_id>` to get session details
3. Extract `client_reference_id` → use as `submissionId`
4. Start 30-second auto-retry for signed URLs
5. Auto-download PDF when ready

**New Function: `fetchSubmissionIdFromSession`**
```typescript
const fetchSubmissionIdFromSession = async (sessionId: string) => {
  const API_BASE = 'https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev';
  const API_KEY = 'AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co';

  setStatus('checking');

  try {
    const response = await fetch(
      `${API_BASE}/checkout/session?id=${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        headers: { 'x-api-key': API_KEY }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to retrieve session: ${response.status}`);
    }

    const data = await response.json();

    if (!data.client_reference_id) {
      setStatus('error');
      setErrorMessage('No submission ID found in checkout session');
      return;
    }

    const submissionId = data.client_reference_id;
    setDiagnosticId(submissionId);

    // Now start auto-download with the retrieved submissionId
    startAutoDownload(submissionId);

  } catch (error) {
    console.error('Failed to fetch session:', error);
    setStatus('error');
    setErrorMessage('Failed to retrieve checkout session details');
  }
};
```

**Updated useEffect**:
- Handles both `session_id` (new) and `submission_id` (legacy) flows
- Prioritizes `session_id` if present

---

#### DiagnosticReview.tsx (Payment Page)
**Location**: `src/components/DiagnosticReview.tsx`

**Changes**:
- Removed `handleCreateCheckoutSession` function (no longer needed)
- Replaced custom button with Stripe Buy Button embed
- Removed state variable `paymentInitiated` (no longer needed)

**Buy Button Implementation**:
```tsx
<stripe-buy-button
  buy-button-id="buy_btn_1SC3ncJfyCDmId8X2Oir3Amy"
  publishable-key="pk_live_51RgbAkJfyCDmId8XfY0H7dLS8v2mjL6887WNfScroA9v6ggvcPbXSQUjrLkY2dVZh26QdbcS3nXegFKnf6C6RMEb00po2qC8Fg"
  client-reference-id={submissionId}
>
</stripe-buy-button>
```

**TypeScript Support**:
- **File**: `src/types/stripe-buy-button.d.ts`
- Declares JSX intrinsic element for `stripe-buy-button`

**Script Tag** (Already Present):
- **File**: `index.html` line 22-24
- `<script async src="https://js.stripe.com/v3/buy-button.js">`

---

### Stripe Dashboard Configuration (MANUAL)

**Required Stripe Dashboard Update**:
User must manually update Buy Button settings in Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/buy-buttons
2. Select button: `buy_btn_1SC3ncJfyCDmId8X2Oir3Amy`
3. Update success URL to: `https://diagnosticpro.io/success?session_id={CHECKOUT_SESSION_ID}`
4. Ensure "Collect customer reference ID" is enabled

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STRIPE BUY BUTTON FLOW                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Customer submits form                                       │
│     ↓                                                            │
│  2. Frontend saves to Firestore → submissionId generated        │
│     ↓                                                            │
│  3. Buy Button rendered with client-reference-id={submissionId} │
│     ↓                                                            │
│  4. Customer clicks Buy Button → Stripe Checkout opens          │
│     ↓                                                            │
│  5. Customer completes payment                                  │
│     ↓                                                            │
│  6. Stripe redirects to:                                        │
│     https://diagnosticpro.io/success?session_id=cs_xxx          │
│     ↓                                                            │
│  7. Success page calls:                                         │
│     GET /checkout/session?id=cs_xxx                             │
│     ↓                                                            │
│  8. Backend retrieves session from Stripe API                   │
│     ↓                                                            │
│  9. Returns client_reference_id (submissionId)                  │
│     ↓                                                            │
│ 10. Success page starts 30s auto-retry for signed URLs          │
│     ↓                                                            │
│ 11. PDF auto-downloads when ready                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Status

| Component | Status | Version/Revision |
|-----------|--------|------------------|
| **Backend** | ✅ DEPLOYED | `diagnosticpro-vertex-ai-backend-00019-hd6` |
| **API Gateway** | ✅ DEPLOYED | `cfg-buy-button-20250927-2030` |
| **Frontend** | ✅ DEPLOYED | Firebase Hosting (build 2025-09-27) |
| **Stripe Dashboard** | ⚠️ MANUAL | User must update Buy Button success URL |

---

## Testing Checklist

- [ ] **Stripe Dashboard**: Update Buy Button success URL
- [ ] **Frontend**: Verify Buy Button renders with `client-reference-id`
- [ ] **Payment Flow**: Test $4.99 payment through Buy Button
- [ ] **Redirect**: Confirm redirect to `/success?session_id=cs_xxx`
- [ ] **Session Retrieval**: Verify `/checkout/session` returns `client_reference_id`
- [ ] **Auto-Download**: Confirm 30s retry and auto-download works
- [ ] **Webhook Processing**: Ensure Stripe webhook triggers analysis

---

## Key Files Modified

### Backend
- `backend/index.js` - Added GET /checkout/session endpoint

### Frontend
- `src/components/PaymentSuccess.tsx` - Added session_id handling
- `src/components/DiagnosticReview.tsx` - Integrated Stripe Buy Button
- `src/types/stripe-buy-button.d.ts` - TypeScript declarations

### Configuration
- `/tmp/openapi-complete.yaml` - Updated API Gateway spec
- `index.html` - Stripe Buy Button script (already present)

---

## Environment Variables

**No changes required** - all existing configuration works:
```bash
VITE_API_GATEWAY_URL=https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev
VITE_API_KEY=AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co
```

---

## Stripe Configuration

**Buy Button**:
- ID: `buy_btn_1SC3ncJfyCDmId8X2Oir3Amy`
- Publishable Key: `pk_live_51RgbAkJfyCDmId8XfY0H7dLS8v2mjL6887WNfScroA9v6ggvcPbXSQUjrLkY2dVZh26QdbcS3nXegFKnf6C6RMEb00po2qC8Fg`
- Price: $4.99 (configured in Stripe Dashboard)

**Checkout Session**:
- Success URL: `https://diagnosticpro.io/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `https://diagnosticpro.io/cancel`
- client_reference_id: Passed from Buy Button embed

---

## Next Steps

1. **User Action Required**: Update Stripe Dashboard Buy Button settings
2. **Test Payment Flow**: Complete end-to-end test with real payment
3. **Monitor Logs**: Check Cloud Run logs for `/checkout/session` calls
4. **Verify Webhook**: Ensure Stripe webhook still triggers analysis correctly

---

## Updated Code for User Review

### PaymentSuccess.tsx (Session ID Flow)
```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const submissionId = urlParams.get('submission_id');

  if (sessionId) {
    // New Buy Button flow: session_id → /checkout/session → client_reference_id
    if (!pollingRef.current) {
      pollingRef.current = true;
      fetchSubmissionIdFromSession(sessionId);
    }
  } else if (submissionId) {
    // Legacy flow: submission_id directly
    setDiagnosticId(submissionId);
    if (!pollingRef.current) {
      pollingRef.current = true;
      startAutoDownload(submissionId);
    }
  } else {
    setStatus('error');
    setErrorMessage('No session ID or submission ID provided');
  }
}, []);

const fetchSubmissionIdFromSession = async (sessionId: string) => {
  const API_BASE = 'https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev';
  const API_KEY = 'AIzaSyBgoJITYrqOcMx69HKa1_CzCkQNlVm66Co';

  setStatus('checking');

  try {
    const response = await fetch(
      `${API_BASE}/checkout/session?id=${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to retrieve session: ${response.status}`);
    }

    const data = await response.json();

    if (!data.client_reference_id) {
      setStatus('error');
      setErrorMessage('No submission ID found in checkout session');
      return;
    }

    const submissionId = data.client_reference_id;
    setDiagnosticId(submissionId);

    // Now start auto-download with the retrieved submissionId
    startAutoDownload(submissionId);

  } catch (error) {
    console.error('Failed to fetch session:', error);
    setStatus('error');
    setErrorMessage('Failed to retrieve checkout session details');
  }
};
```

---

**Date**: 2025-09-27 20:45 UTC
**Status**: ✅ COMPLETE - Ready for user testing after Stripe Dashboard update