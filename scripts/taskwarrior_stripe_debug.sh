#!/bin/bash

# COMPREHENSIVE STRIPE WORKFLOW AUDIT + TASK TRACKING
# Project: DiagnosticPro (diagpro)
# Issue: "Failed to retrieve checkout session details"

echo "Creating comprehensive TaskWarrior debugging tasks for DiagnosticPro Stripe workflow..."

# =============================================================================
# PHASE 1: INVESTIGATION TASKS
# =============================================================================

echo "Phase 1: Investigation Tasks"

task add project:diagpro +INVESTIGATE priority:H -- "Map complete payment workflow from code analysis"
task add project:diagpro +INVESTIGATE priority:H -- "Identify all Stripe API touchpoints in codebase"
task add project:diagpro +INVESTIGATE priority:H -- "Document data flow between frontend/backend architectures"
task add project:diagpro +INVESTIGATE priority:H -- "Find exact error origin in PaymentSuccess.tsx:82"

# ARCHITECTURE ANALYSIS
task add project:diagpro +ARCHITECTURE depends:1,2,3,4 priority:H -- "Analyze Architecture 1: Buy Button flow (PaymentSuccess expects)"
task add project:diagpro +ARCHITECTURE depends:5 -- "Analyze Architecture 2: Legacy direct form flow (payments.ts)"
task add project:diagpro +ARCHITECTURE depends:6 -- "Analyze Architecture 3: Firebase Functions flow (unused)"
task add project:diagpro +ARCHITECTURE depends:7 -- "Document pricing conflicts: $4.99 vs $29.99"

# =============================================================================
# PHASE 2: LOGGING & MONITORING
# =============================================================================

echo "Phase 2: Logging & Monitoring"

task add project:diagpro +LOGS depends:5,6,7,8 priority:H -- "Add console.log to PaymentSuccess.tsx fetchSubmissionIdFromSession()"
task add project:diagpro +LOGS depends:9 -- "Add logging to backend /checkout/session endpoint (index.js:408)"
task add project:diagpro +LOGS depends:10 -- "Add logging to /createCheckoutSession endpoint (index.js:164)"
task add project:diagpro +LOGS depends:11 -- "Check API Gateway logs for 500/404 errors"
task add project:diagpro +LOGS depends:12 -- "Check Stripe Dashboard webhook delivery status"

# =============================================================================
# PHASE 3: DIRECT TESTING
# =============================================================================

echo "Phase 3: Direct Testing"

task add project:diagpro +TEST depends:9,10,11,12,13 priority:H -- "Test /checkout/session endpoint with actual session_id"
task add project:diagpro +TEST depends:14 -- "Test /createCheckoutSession endpoint directly with curl"
task add project:diagpro +TEST depends:15 -- "Test session retrieval timing (immediate vs delayed)"
task add project:diagpro +TEST depends:16 -- "Verify session_id format in success page URL"
task add project:diagpro +TEST depends:17 -- "Test client_reference_id vs metadata.submissionId"

# =============================================================================
# PHASE 4: CONFIGURATION VERIFICATION
# =============================================================================

echo "Phase 4: Configuration Checks"

task add project:diagpro +CONFIG depends:14,15,16,17,18 -- "Verify Stripe API keys match (test vs live)"
task add project:diagpro +CONFIG depends:19 -- "Check API Gateway CORS configuration"
task add project:diagpro +CONFIG depends:20 -- "Verify webhook signing secret configuration"
task add project:diagpro +CONFIG depends:21 -- "Check API Gateway routing to backend endpoint"
task add project:diagpro +CONFIG depends:22 -- "Verify environment variables in Cloud Run"

# =============================================================================
# PHASE 5: CODE ANALYSIS
# =============================================================================

echo "Phase 5: Code Analysis"

task add project:diagpro +ANALYZE depends:19,20,21,22,23 -- "Check async/await patterns in all Stripe calls"
task add project:diagpro +ANALYZE depends:24 -- "Verify error handling in try/catch blocks"
task add project:diagpro +ANALYZE depends:25 -- "Check session ID extraction from URL params"
task add project:diagpro +ANALYZE depends:26 -- "Analyze request/response headers and CORS"
task add project:diagpro +ANALYZE depends:27 -- "Check for race conditions in session creation/retrieval"

# =============================================================================
# PHASE 6: ARCHITECTURE DEBUGGING
# =============================================================================

echo "Phase 6: Architecture-Specific Debugging"

# BUY BUTTON FLOW DEBUG
task add project:diagpro +DEBUG_BUYBUTTON depends:24,25,26,27,28 -- "Debug Buy Button flow: success_url format"
task add project:diagpro +DEBUG_BUYBUTTON depends:29 -- "Debug client_reference_id setting in Buy Button"
task add project:diagpro +DEBUG_BUYBUTTON depends:30 -- "Debug PaymentSuccess.tsx session_id extraction"

# LEGACY FLOW DEBUG
task add project:diagpro +DEBUG_LEGACY depends:29,30,31 -- "Debug legacy flow: submission_id parameter"
task add project:diagpro +DEBUG_LEGACY depends:32 -- "Debug payments.ts createCheckoutSession call"
task add project:diagpro +DEBUG_LEGACY depends:33 -- "Debug success URL routing differences"

# FIREBASE FUNCTIONS DEBUG
task add project:diagpro +DEBUG_FIREBASE depends:32,33,34 -- "Debug Firebase Functions deployment status"
task add project:diagpro +DEBUG_FIREBASE depends:35 -- "Debug Firebase vs Cloud Run API conflicts"

# =============================================================================
# PHASE 7: SPECIFIC COMPONENT TESTING
# =============================================================================

echo "Phase 7: Component-Specific Testing"

# FRONTEND SUCCESS PAGE
task add project:diagpro +DEBUG_FRONTEND priority:H -- "Log window.location.search on PaymentSuccess page load"
task add project:diagpro +DEBUG_FRONTEND -- "Log extracted session_id value (line 20)"
task add project:diagpro +DEBUG_FRONTEND -- "Log API endpoint being called (line 50)"
task add project:diagpro +DEBUG_FRONTEND -- "Log response status and headers"
task add project:diagpro +DEBUG_FRONTEND -- "Log parsed response data (line 63)"
task add project:diagpro +DEBUG_FRONTEND -- "Check browser console for CORS errors"

# BACKEND RETRIEVAL FUNCTION
task add project:diagpro +DEBUG_BACKEND priority:H -- "Log incoming request params in /checkout/session"
task add project:diagpro +DEBUG_BACKEND -- "Log session_id before Stripe.checkout.sessions.retrieve"
task add project:diagpro +DEBUG_BACKEND -- "Log Stripe API response data"
task add project:diagpro +DEBUG_BACKEND -- "Log any catch block errors with full stack trace"
task add project:diagpro +DEBUG_BACKEND -- "Check Stripe secret key configuration"

# API GATEWAY
task add project:diagpro +DEBUG_GATEWAY priority:H -- "Check API Gateway request routing"
task add project:diagpro +DEBUG_GATEWAY -- "Verify API Gateway response transformation"
task add project:diagpro +DEBUG_GATEWAY -- "Check API Gateway timeout settings"
task add project:diagpro +DEBUG_GATEWAY -- "Verify API Gateway authentication"

# =============================================================================
# PHASE 8: TEST SCENARIOS
# =============================================================================

echo "Phase 8: Test Scenarios"

# TEST CASE 1: Direct API Testing
task add project:diagpro +TESTCASE -- "Create session via backend /createCheckoutSession"
task add project:diagpro +TESTCASE -- "Retrieve session immediately after creation"
task add project:diagpro +TESTCASE -- "Retrieve session after 5 second delay"
task add project:diagpro +TESTCASE -- "Test session retrieval with Stripe CLI"

# TEST CASE 2: Architecture Flow Testing
task add project:diagpro +ARCHTEST -- "Test Buy Button → success page flow end-to-end"
task add project:diagpro +ARCHTEST -- "Test Legacy form → success page flow"
task add project:diagpro +ARCHTEST -- "Test Firebase Functions webhook flow"
task add project:diagpro +ARCHTEST -- "Test pricing consistency across all flows"

# TEST CASE 3: Timing Tests
task add project:diagpro +TIMING -- "Add 2 second delay before session retrieval"
task add project:diagpro +TIMING -- "Add 5 second delay before session retrieval"
task add project:diagpro +TIMING -- "Poll for session availability with retry logic"
task add project:diagpro +TIMING -- "Check webhook processing timing"

# TEST CASE 4: Environment Tests
task add project:diagpro +ENV -- "Test in development environment with test keys"
task add project:diagpro +ENV -- "Test in production environment with live keys"
task add project:diagpro +ENV -- "Compare env variables dev vs prod"
task add project:diagpro +ENV -- "Test API Gateway vs direct Cloud Run access"

# =============================================================================
# PHASE 9: POTENTIAL FIXES
# =============================================================================

echo "Phase 9: Fix Implementation"

task add project:diagpro +FIX depends:37,43,47 -- "Fix 1: Align payment flow to use Buy Button architecture"
task add project:diagpro +FIX depends:61 -- "Fix 2: Update createCheckoutSession to set client_reference_id"
task add project:diagpro +FIX depends:62 -- "Fix 3: Add retry logic to session retrieval"
task add project:diagpro +FIX depends:63 -- "Fix 4: Implement fallback to legacy flow"
task add project:diagpro +FIX depends:64 -- "Fix 5: Consolidate pricing to single amount ($4.99)"

# =============================================================================
# PHASE 10: VERIFICATION
# =============================================================================

echo "Phase 10: Solution Verification"

task add project:diagpro +VERIFY depends:61,62,63,64,65 -- "Test complete payment flow end-to-end"
task add project:diagpro +VERIFY depends:66 -- "Verify in both test and production modes"
task add project:diagpro +VERIFY depends:67 -- "Test with multiple browsers and devices"
task add project:diagpro +VERIFY depends:68 -- "Load test for race conditions and timing"
task add project:diagpro +VERIFY depends:69 -- "Document the final solution and architecture"

# =============================================================================
# PRIORITY TASK IDENTIFICATION
# =============================================================================

echo ""
echo "PRIORITY TASKS TO START WITH:"
echo "1. task project:diagpro +DEBUG_FRONTEND"
echo "2. task project:diagpro +DEBUG_BACKEND"
echo "3. task project:diagpro +TESTCASE"
echo "4. task project:diagpro +FIX"

echo ""
echo "VIEW COMMANDS:"
echo "# View all DiagnosticPro tasks"
echo "task project:diagpro"
echo ""
echo "# See next priority task"
echo "task project:diagpro next"
echo ""
echo "# View investigation tasks"
echo "task project:diagpro +INVESTIGATE"
echo ""
echo "# Track progress"
echo "task burndown.daily project:diagpro"

echo ""
echo "TaskWarrior debugging tasks created successfully!"
echo "Total tasks created: 70+"
echo ""
echo "START WITH: task project:diagpro +DEBUG_FRONTEND priority:H"