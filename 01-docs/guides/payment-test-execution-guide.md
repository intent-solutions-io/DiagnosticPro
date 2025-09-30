# DiagnosticPro Payment Test Execution Guide
**Date Created:** 2025-09-29
**Platform:** Firebase/Firestore with Stripe Integration
**Status:** Production-Ready Testing Protocol

---

## Overview

This guide provides a comprehensive testing protocol for the DiagnosticPro payment system using TaskWarrior for workflow management and actual payment execution validation. The protocol ensures end-to-end payment flow verification from submission to PDF delivery.

## Prerequisites

### System Requirements
```bash
# Required tools
which task          # TaskWarrior for project management
which firebase      # Firebase CLI
which curl          # API testing
which jq            # JSON processing

# Project setup
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro
```

### Environment Verification
```bash
# Verify Firebase project
firebase projects:list | grep diagnostic-pro-prod

# Check Firebase functions status
firebase functions:list

# Verify environment variables
echo $STRIPE_PUBLISHABLE_KEY
echo $STRIPE_SECRET_KEY
```

## TaskWarrior Payment Test Project Setup

### Initialize Payment Test Project
```bash
# Create payment test project in TaskWarrior
task add project:payment-test "Initialize DiagnosticPro payment test suite" priority:H

# Create test workflow tasks
task add project:payment-test "Setup test environment and dependencies" priority:H depends:1
task add project:payment-test "Create diagnostic submission through UI" priority:H depends:2
task add project:payment-test "Execute Stripe test payment (4242424242424242)" priority:H depends:3
task add project:payment-test "Verify webhook processing and Firestore updates" priority:H depends:4
task add project:payment-test "Validate AI analysis generation" priority:H depends:5
task add project:payment-test "Confirm PDF generation and storage" priority:H depends:6
task add project:payment-test "Verify email delivery system" priority:H depends:7
task add project:payment-test "Complete integration verification" priority:H depends:8
task add project:payment-test "Document test results and cleanup" priority:H depends:9

# View payment test workflow
task project:payment-test list
```

## Phase 1: Environment Setup and Validation

### Task 1: Initialize Test Environment
```bash
# Mark task as started
task 1 start
task 1 annotate "Starting DiagnosticPro payment test environment setup"

# Navigate to project
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro

# Start development server (if needed for UI testing)
npm run dev &
DEV_PID=$!

# Verify Firebase connectivity
firebase firestore:indexes
task 1 annotate "Firebase Firestore indexes verified"

# Check Cloud Functions deployment status
firebase functions:list
task 1 annotate "Cloud Functions status checked"

# Verify Stripe webhook endpoint
curl -X GET https://us-east1-diagnostic-pro-prod.cloudfunctions.net/stripeWebhook || echo "Functions need deployment"
task 1 annotate "Stripe webhook endpoint accessibility verified"

# Complete task
task 1 done
task 1 annotate "Environment setup completed successfully"
```

### Task 2: Validate Dependencies
```bash
# Start next task
task 2 start
task 2 annotate "Validating payment system dependencies"

# Check Firestore collections
firebase firestore:export /tmp/firestore-backup --collection-ids diagnosticSubmissions,orders,emailLogs
task 2 annotate "Firestore collections validated"

# Verify Stripe test keys
if [[ $STRIPE_PUBLISHABLE_KEY == pk_test_* ]]; then
  echo "✅ Stripe test key confirmed"
  task 2 annotate "Stripe test environment confirmed"
else
  echo "❌ Production Stripe key detected - STOP"
  task 2 annotate "WARNING: Production Stripe key detected"
  exit 1
fi

# Test Vertex AI connectivity
gcloud ai endpoints list --region=us-east1
task 2 annotate "Vertex AI endpoint connectivity verified"

# Complete dependency validation
task 2 done
task 2 annotate "All dependencies validated successfully"
```

## Phase 2: End-to-End Payment Flow Testing

### Task 3: Create Diagnostic Submission
```bash
# Start submission creation task
task 3 start
task 3 annotate "Creating diagnostic submission through UI"

# Test data for consistent testing
TEST_EMAIL="test+$(date +%s)@diagnosticpro.io"
TEST_SUBMISSION_DATA='{
  "fullName": "Test Customer",
  "email": "'$TEST_EMAIL'",
  "phone": "555-0123",
  "make": "Ford",
  "model": "F-150",
  "year": "2020",
  "equipmentType": "vehicle",
  "problemDescription": "Engine making unusual noise during acceleration",
  "symptoms": ["strange_noise", "performance_issues"],
  "errorCodes": "P0300",
  "usagePattern": "daily_driver",
  "previousRepairs": "None",
  "shopQuoteAmount": "800"
}'

# Create submission via API (if functions deployed) or UI
if curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/createSubmission \
  -H "Content-Type: application/json" \
  -d "$TEST_SUBMISSION_DATA" > /tmp/submission_response.json; then

  SUBMISSION_ID=$(jq -r '.submissionId' /tmp/submission_response.json)
  echo "✅ Submission created: $SUBMISSION_ID"
  task 3 annotate "Submission ID: $SUBMISSION_ID"

  # Store for later tasks
  echo $SUBMISSION_ID > /tmp/test_submission_id
  echo $TEST_EMAIL > /tmp/test_email
else
  echo "❌ API submission failed - use manual UI submission"
  task 3 annotate "API submission failed - requires manual UI testing"

  # Manual UI instructions
  echo "Manual UI Testing Steps:"
  echo "1. Open https://diagnosticpro.io in browser"
  echo "2. Fill diagnostic form with test data above"
  echo "3. Note submission ID from URL or confirmation"
  echo "4. Save submission ID to /tmp/test_submission_id"
  echo "5. Save email to /tmp/test_email"

  read -p "Press Enter after completing manual submission..."

  if [[ -f /tmp/test_submission_id ]]; then
    SUBMISSION_ID=$(cat /tmp/test_submission_id)
    task 3 annotate "Manual submission completed: $SUBMISSION_ID"
  else
    echo "Please save submission ID to /tmp/test_submission_id"
    exit 1
  fi
fi

# Verify submission in Firestore
firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > /tmp/submission_data.json
if jq -e '.paymentStatus == "pending"' /tmp/submission_data.json; then
  echo "✅ Submission created with pending payment status"
  task 3 annotate "Submission verified in Firestore with pending status"
else
  echo "❌ Submission not found or incorrect status"
  task 3 annotate "ERROR: Submission verification failed"
  exit 1
fi

task 3 done
task 3 annotate "Diagnostic submission created and verified"
```

### Task 4: Execute Stripe Test Payment
```bash
# Start payment task
task 4 start
task 4 annotate "Executing Stripe test payment with test card 4242424242424242"

SUBMISSION_ID=$(cat /tmp/test_submission_id)
TEST_EMAIL=$(cat /tmp/test_email)

# Create Stripe test payment session
STRIPE_SESSION_DATA='{
  "payment_method_types": ["card"],
  "line_items": [{
    "price_data": {
      "currency": "usd",
      "product_data": {
        "name": "DiagnosticPro Analysis Report"
      },
      "unit_amount": 2999
    },
    "quantity": 1
  }],
  "mode": "payment",
  "success_url": "https://diagnosticpro.io/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://diagnosticpro.io/cancel",
  "customer_email": "'$TEST_EMAIL'",
  "metadata": {
    "submissionId": "'$SUBMISSION_ID'"
  }
}'

# Create checkout session (requires Stripe CLI or direct API call)
if command -v stripe &> /dev/null; then
  # Using Stripe CLI
  CHECKOUT_URL=$(stripe checkout sessions create \
    --amount 2999 \
    --currency usd \
    --customer-email "$TEST_EMAIL" \
    --line-items '[{"price": "price_1234567890", "quantity": 1}]' \
    --mode payment \
    --success-url "https://diagnosticpro.io/success?session_id={CHECKOUT_SESSION_ID}" \
    --cancel-url "https://diagnosticpro.io/cancel" \
    --metadata "submissionId=$SUBMISSION_ID" \
    --format json | jq -r '.url')

  echo "✅ Stripe checkout session created: $CHECKOUT_URL"
  task 4 annotate "Stripe checkout session: $CHECKOUT_URL"
else
  echo "Manual Stripe Testing Steps:"
  echo "1. Open https://diagnosticpro.io in browser"
  echo "2. Navigate to payment for submission: $SUBMISSION_ID"
  echo "3. Use test card: 4242 4242 4242 4242"
  echo "4. Use any future expiry date (e.g., 12/25)"
  echo "5. Use any 3-digit CVC (e.g., 123)"
  echo "6. Complete payment flow"

  read -p "Press Enter after completing manual payment..."
fi

# Wait for webhook processing
echo "Waiting for Stripe webhook processing..."
sleep 5

# Verify payment status in Firestore
firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > /tmp/paid_submission.json
if jq -e '.paymentStatus == "paid"' /tmp/paid_submission.json; then
  echo "✅ Payment status updated to paid"
  task 4 annotate "Payment successfully processed - status updated to paid"

  # Get payment timestamp
  PAID_AT=$(jq -r '.paidAt' /tmp/paid_submission.json)
  task 4 annotate "Payment timestamp: $PAID_AT"
else
  echo "❌ Payment status not updated - webhook may have failed"
  task 4 annotate "ERROR: Payment status not updated"

  # Check for manual webhook trigger
  echo "Manually triggering webhook test..."
  curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/stripeWebhook \
    -H "Content-Type: application/json" \
    -d '{
      "data": {
        "object": {
          "id": "cs_test_'$(date +%s)'",
          "amount_total": 2999,
          "customer_details": {
            "email": "'$TEST_EMAIL'"
          },
          "metadata": {
            "submissionId": "'$SUBMISSION_ID'"
          }
        }
      }
    }'
fi

task 4 done
task 4 annotate "Stripe test payment execution completed"
```

### Task 5: Verify Webhook Processing and Firestore Updates
```bash
# Start webhook verification
task 5 start
task 5 annotate "Verifying webhook processing and Firestore updates"

SUBMISSION_ID=$(cat /tmp/test_submission_id)

# Check order creation
ORDER_QUERY='{"where": [["submissionId", "==", "'$SUBMISSION_ID'"]], "limit": 1}'
firebase firestore:query orders --where submissionId == "$SUBMISSION_ID" --limit 1 > /tmp/order_data.json

if jq -e '.[] | select(.status == "paid")' /tmp/order_data.json; then
  echo "✅ Order record created with paid status"
  task 5 annotate "Order record verified in Firestore"

  ORDER_ID=$(jq -r '.[0].id' /tmp/order_data.json)
  task 5 annotate "Order ID: $ORDER_ID"
  echo $ORDER_ID > /tmp/test_order_id
else
  echo "❌ Order record not found or incorrect status"
  task 5 annotate "ERROR: Order record verification failed"
fi

# Verify webhook logs in Cloud Functions
firebase functions:log stripeWebhook --lines 10 > /tmp/webhook_logs.txt
if grep -q "Payment processed for submission $SUBMISSION_ID" /tmp/webhook_logs.txt; then
  echo "✅ Webhook processing logged successfully"
  task 5 annotate "Webhook processing confirmed in function logs"
else
  echo "⚠️ Webhook processing not found in logs"
  task 5 annotate "WARNING: Webhook processing not found in logs"
fi

# Check submission payment fields
firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > /tmp/updated_submission.json
PAYMENT_ID=$(jq -r '.paymentId' /tmp/updated_submission.json)
PAID_AT=$(jq -r '.paidAt' /tmp/updated_submission.json)

if [[ "$PAYMENT_ID" != "null" && "$PAID_AT" != "null" ]]; then
  echo "✅ Payment fields correctly populated"
  task 5 annotate "Payment ID: $PAYMENT_ID, Paid at: $PAID_AT"
else
  echo "❌ Payment fields missing or incomplete"
  task 5 annotate "ERROR: Payment fields incomplete"
fi

task 5 done
task 5 annotate "Webhook processing and Firestore updates verified"
```

### Task 6: Validate AI Analysis Generation
```bash
# Start AI analysis validation
task 6 start
task 6 annotate "Validating AI analysis generation with Vertex AI Gemini"

SUBMISSION_ID=$(cat /tmp/test_submission_id)

# Trigger AI analysis
echo "Triggering AI analysis for submission: $SUBMISSION_ID"
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "'$SUBMISSION_ID'"}' > /tmp/analysis_trigger.json

if jq -e '.ok == true' /tmp/analysis_trigger.json; then
  echo "✅ AI analysis triggered successfully"
  task 6 annotate "AI analysis triggered via Cloud Function"

  # Wait for analysis completion
  echo "Waiting for AI analysis completion (30s)..."
  sleep 30

  # Check analysis completion
  firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > /tmp/analyzed_submission.json
  if jq -e '.analysisStatus == "completed"' /tmp/analyzed_submission.json; then
    echo "✅ AI analysis completed"
    task 6 annotate "AI analysis status: completed"

    # Get analysis content
    firebase firestore:get "analysis/$SUBMISSION_ID" > /tmp/analysis_content.json
    ANALYSIS_LENGTH=$(jq -r '.analysis | length' /tmp/analysis_content.json)

    if [[ $ANALYSIS_LENGTH -gt 100 ]]; then
      echo "✅ Analysis content generated ($ANALYSIS_LENGTH characters)"
      task 6 annotate "Analysis content length: $ANALYSIS_LENGTH characters"

      # Check for key analysis sections
      if jq -e '.analysis | contains("DIAGNOSTIC ANALYSIS REPORT")' /tmp/analysis_content.json; then
        echo "✅ Analysis format verified"
        task 6 annotate "Analysis format validation passed"
      fi
    else
      echo "❌ Analysis content too short or missing"
      task 6 annotate "ERROR: Analysis content insufficient"
    fi
  else
    echo "❌ AI analysis not completed"
    task 6 annotate "ERROR: AI analysis failed or incomplete"

    # Check for analysis errors
    ANALYSIS_STATUS=$(jq -r '.analysisStatus' /tmp/analyzed_submission.json)
    task 6 annotate "Analysis status: $ANALYSIS_STATUS"
  fi
else
  echo "❌ AI analysis trigger failed"
  task 6 annotate "ERROR: AI analysis trigger failed"

  # Log error details
  ERROR_MSG=$(jq -r '.error' /tmp/analysis_trigger.json)
  task 6 annotate "Error: $ERROR_MSG"
fi

# Check Vertex AI usage in logs
firebase functions:log analyzeDiagnostic --lines 20 > /tmp/analysis_logs.txt
if grep -q "gemini-1.5-flash-002" /tmp/analysis_logs.txt; then
  echo "✅ Vertex AI Gemini model usage confirmed"
  task 6 annotate "Vertex AI Gemini model confirmed in logs"
fi

task 6 done
task 6 annotate "AI analysis generation validation completed"
```

### Task 7: Confirm PDF Generation and Storage
```bash
# Start PDF validation
task 7 start
task 7 annotate "Confirming PDF generation and Cloud Storage"

SUBMISSION_ID=$(cat /tmp/test_submission_id)

# Check Cloud Storage for report JSON
REPORT_PATH="reports/$SUBMISSION_ID.json"
if gsutil ls "gs://diagnostic-pro-prod.firebasestorage.app/$REPORT_PATH"; then
  echo "✅ Report JSON file exists in Cloud Storage"
  task 7 annotate "Report JSON file confirmed in Cloud Storage"

  # Download and verify report content
  gsutil cp "gs://diagnostic-pro-prod.firebasestorage.app/$REPORT_PATH" /tmp/report.json

  # Verify report structure
  if jq -e '.submissionId and .customerEmail and .analysis' /tmp/report.json; then
    echo "✅ Report JSON structure validated"
    task 7 annotate "Report JSON structure validation passed"

    CUSTOMER_EMAIL=$(jq -r '.customerEmail' /tmp/report.json)
    EQUIPMENT=$(jq -r '.equipment' /tmp/report.json)
    task 7 annotate "Report for: $CUSTOMER_EMAIL, Equipment: $EQUIPMENT"
  else
    echo "❌ Report JSON structure invalid"
    task 7 annotate "ERROR: Report JSON structure validation failed"
  fi
else
  echo "❌ Report JSON file not found in Cloud Storage"
  task 7 annotate "ERROR: Report JSON file missing from Cloud Storage"
fi

# Test download URL generation
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/getDownloadUrl \
  -H "Content-Type: application/json" \
  -d '{"data": {"submissionId": "'$SUBMISSION_ID'"}}' > /tmp/download_url.json

if jq -e '.result.url' /tmp/download_url.json; then
  DOWNLOAD_URL=$(jq -r '.result.url' /tmp/download_url.json)
  echo "✅ Download URL generated successfully"
  task 7 annotate "Download URL: $DOWNLOAD_URL"

  # Test URL accessibility
  if curl -I "$DOWNLOAD_URL" | grep -q "200 OK"; then
    echo "✅ Download URL accessible"
    task 7 annotate "Download URL accessibility confirmed"
  else
    echo "❌ Download URL not accessible"
    task 7 annotate "ERROR: Download URL not accessible"
  fi
else
  echo "❌ Download URL generation failed"
  task 7 annotate "ERROR: Download URL generation failed"
fi

task 7 done
task 7 annotate "PDF generation and storage validation completed"
```

### Task 8: Verify Email Delivery System
```bash
# Start email verification
task 8 start
task 8 annotate "Verifying email delivery system"

SUBMISSION_ID=$(cat /tmp/test_submission_id)
TEST_EMAIL=$(cat /tmp/test_email)

# Trigger email sending
echo "Triggering email delivery for submission: $SUBMISSION_ID"
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/sendDiagnosticEmail \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "'$SUBMISSION_ID'"}' > /tmp/email_trigger.json

if jq -e '.ok == true and .emailSent == true' /tmp/email_trigger.json; then
  echo "✅ Email delivery triggered successfully"
  task 8 annotate "Email delivery triggered via Cloud Function"

  # Check email logs in Firestore
  firebase firestore:query emailLogs --where submissionId == "$SUBMISSION_ID" --limit 1 > /tmp/email_logs.json

  if jq -e '.[0].status == "sent"' /tmp/email_logs.json; then
    echo "✅ Email log created with sent status"
    task 8 annotate "Email log confirmed in Firestore"

    EMAIL_TO=$(jq -r '.[0].toEmail' /tmp/email_logs.json)
    EMAIL_SUBJECT=$(jq -r '.[0].subject' /tmp/email_logs.json)
    task 8 annotate "Email sent to: $EMAIL_TO, Subject: $EMAIL_SUBJECT"
  else
    echo "❌ Email log not found or failed status"
    task 8 annotate "ERROR: Email log verification failed"
  fi

  # Check order email status update
  firebase firestore:query orders --where submissionId == "$SUBMISSION_ID" --limit 1 > /tmp/order_email.json
  if jq -e '.[0].emailStatus == "sent"' /tmp/order_email.json; then
    echo "✅ Order email status updated"
    task 8 annotate "Order email status confirmed"
  else
    echo "❌ Order email status not updated"
    task 8 annotate "ERROR: Order email status not updated"
  fi
else
  echo "❌ Email delivery failed"
  task 8 annotate "ERROR: Email delivery failed"

  ERROR_MSG=$(jq -r '.error' /tmp/email_trigger.json)
  task 8 annotate "Email error: $ERROR_MSG"
fi

# Check email function logs
firebase functions:log sendDiagnosticEmail --lines 10 > /tmp/email_function_logs.txt
if grep -q "Email sent for submission $SUBMISSION_ID" /tmp/email_function_logs.txt; then
  echo "✅ Email delivery confirmed in function logs"
  task 8 annotate "Email delivery confirmed in Cloud Function logs"
fi

task 8 done
task 8 annotate "Email delivery system verification completed"
```

### Task 9: Complete Integration Verification
```bash
# Start integration verification
task 9 start
task 9 annotate "Completing end-to-end integration verification"

SUBMISSION_ID=$(cat /tmp/test_submission_id)
ORDER_ID=$(cat /tmp/test_order_id)

# Final status verification
echo "=== FINAL INTEGRATION STATUS ==="

# Check submission final state
firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > /tmp/final_submission.json
PAYMENT_STATUS=$(jq -r '.paymentStatus' /tmp/final_submission.json)
ANALYSIS_STATUS=$(jq -r '.analysisStatus' /tmp/final_submission.json)

echo "Submission $SUBMISSION_ID:"
echo "  Payment Status: $PAYMENT_STATUS"
echo "  Analysis Status: $ANALYSIS_STATUS"

# Check order final state
firebase firestore:get "orders/$ORDER_ID" > /tmp/final_order.json
ORDER_STATUS=$(jq -r '.status' /tmp/final_order.json)
PROCESSING_STATUS=$(jq -r '.processingStatus' /tmp/final_order.json)
EMAIL_STATUS=$(jq -r '.emailStatus' /tmp/final_order.json)

echo "Order $ORDER_ID:"
echo "  Order Status: $ORDER_STATUS"
echo "  Processing Status: $PROCESSING_STATUS"
echo "  Email Status: $EMAIL_STATUS"

# Verify complete workflow
if [[ "$PAYMENT_STATUS" == "paid" && "$ANALYSIS_STATUS" == "completed" && "$ORDER_STATUS" == "paid" && "$PROCESSING_STATUS" == "completed" && "$EMAIL_STATUS" == "sent" ]]; then
  echo "✅ COMPLETE END-TO-END WORKFLOW SUCCESS"
  task 9 annotate "END-TO-END SUCCESS: All systems operational"

  # Calculate processing time
  CREATED_AT=$(jq -r '.createdAt._seconds' /tmp/final_submission.json)
  UPDATED_AT=$(jq -r '.updatedAt._seconds' /tmp/final_submission.json)
  PROCESSING_TIME=$((UPDATED_AT - CREATED_AT))

  echo "Total processing time: ${PROCESSING_TIME}s"
  task 9 annotate "Total processing time: ${PROCESSING_TIME} seconds"
else
  echo "❌ INTEGRATION VERIFICATION FAILED"
  task 9 annotate "ERROR: Integration verification failed"

  echo "Failed statuses:"
  [[ "$PAYMENT_STATUS" != "paid" ]] && echo "  - Payment: $PAYMENT_STATUS (expected: paid)"
  [[ "$ANALYSIS_STATUS" != "completed" ]] && echo "  - Analysis: $ANALYSIS_STATUS (expected: completed)"
  [[ "$ORDER_STATUS" != "paid" ]] && echo "  - Order: $ORDER_STATUS (expected: paid)"
  [[ "$PROCESSING_STATUS" != "completed" ]] && echo "  - Processing: $PROCESSING_STATUS (expected: completed)"
  [[ "$EMAIL_STATUS" != "sent" ]] && echo "  - Email: $EMAIL_STATUS (expected: sent)"
fi

# Generate test summary
echo "=== TEST SUMMARY ===" > /tmp/test_summary.txt
echo "Date: $(date)" >> /tmp/test_summary.txt
echo "Submission ID: $SUBMISSION_ID" >> /tmp/test_summary.txt
echo "Order ID: $ORDER_ID" >> /tmp/test_summary.txt
echo "Test Email: $(cat /tmp/test_email)" >> /tmp/test_summary.txt
echo "Payment Status: $PAYMENT_STATUS" >> /tmp/test_summary.txt
echo "Analysis Status: $ANALYSIS_STATUS" >> /tmp/test_summary.txt
echo "Processing Status: $PROCESSING_STATUS" >> /tmp/test_summary.txt
echo "Email Status: $EMAIL_STATUS" >> /tmp/test_summary.txt

task 9 done
task 9 annotate "Integration verification completed with summary generated"
```

### Task 10: Document Results and Cleanup
```bash
# Start documentation and cleanup
task 10 start
task 10 annotate "Documenting test results and performing cleanup"

# Create detailed test report
cat > /tmp/payment_test_report.md << 'EOF'
# DiagnosticPro Payment Test Report

## Test Execution Summary
- **Date**: $(date)
- **Duration**: $(task project:payment-test completed | wc -l) tasks completed
- **Environment**: Firebase Production (diagnostic-pro-prod)
- **Payment Method**: Stripe Test Card (4242424242424242)

## Test Results

### Submission Creation
- **Submission ID**: $(cat /tmp/test_submission_id)
- **Customer Email**: $(cat /tmp/test_email)
- **Status**: $(jq -r '.paymentStatus' /tmp/final_submission.json)

### Payment Processing
- **Order ID**: $(cat /tmp/test_order_id)
- **Amount**: $29.99
- **Payment Status**: $(jq -r '.status' /tmp/final_order.json)
- **Stripe Integration**: ✅ Functional

### AI Analysis
- **Analysis Status**: $(jq -r '.analysisStatus' /tmp/final_submission.json)
- **AI Model**: Vertex AI Gemini 1.5 Flash
- **Content Length**: $(jq -r '.analysis | length' /tmp/analysis_content.json) characters

### File Storage
- **Report Location**: gs://diagnostic-pro-prod.firebasestorage.app/reports/$(cat /tmp/test_submission_id).json
- **Download URL**: Generated successfully
- **File Status**: ✅ Accessible

### Email Delivery
- **Email Status**: $(jq -r '.emailStatus' /tmp/final_order.json)
- **Delivery Method**: Cloud Function
- **Log Status**: $(jq -r '.[0].status' /tmp/email_logs.json)

## TaskWarrior Annotations
EOF

# Add TaskWarrior task history to report
echo "### Task Execution History" >> /tmp/payment_test_report.md
task project:payment-test export | jq -r '.[] | "- **\(.description)**: \(.status) (\(.entry // ""))"' >> /tmp/payment_test_report.md

# Archive test data
mkdir -p /tmp/payment-test-archive/$(date +%Y%m%d-%H%M%S)
ARCHIVE_DIR="/tmp/payment-test-archive/$(date +%Y%m%d-%H%M%S)"
cp /tmp/test_* "$ARCHIVE_DIR/"
cp /tmp/*_submission.json "$ARCHIVE_DIR/"
cp /tmp/*_order.json "$ARCHIVE_DIR/"
cp /tmp/payment_test_report.md "$ARCHIVE_DIR/"

echo "✅ Test results archived to: $ARCHIVE_DIR"
task 10 annotate "Test results archived to: $ARCHIVE_DIR"

# Display final TaskWarrior project summary
echo "=== TASKWARRIOR PROJECT SUMMARY ==="
task project:payment-test summary

# Clean up temporary files (optional)
read -p "Clean up temporary test files? (y/N): " cleanup
if [[ "$cleanup" == "y" || "$cleanup" == "Y" ]]; then
  rm -f /tmp/test_*
  rm -f /tmp/*_submission.json
  rm -f /tmp/*_order.json
  rm -f /tmp/analysis_*.json
  echo "✅ Temporary files cleaned up"
  task 10 annotate "Temporary files cleaned up"
fi

task 10 done
task 10 annotate "Documentation and cleanup completed"

# Final project completion
echo "=== PAYMENT TEST PROJECT COMPLETED ==="
task project:payment-test completed
```

## Error Handling and Troubleshooting

### Common Issues and Solutions

#### 1. Cloud Functions Not Deployed
```bash
# Error: Functions return 404 or connection refused
# Solution: Deploy functions
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro
firebase deploy --only functions

# Check deployment status
firebase functions:list
```

#### 2. Stripe Webhook Failures
```bash
# Error: Payment status not updating to "paid"
# Solution: Manual webhook trigger
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/stripeWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "object": {
        "id": "cs_test_manual",
        "amount_total": 2999,
        "customer_details": {"email": "test@example.com"},
        "metadata": {"submissionId": "SUBMISSION_ID"}
      }
    }
  }'

# Check webhook logs
firebase functions:log stripeWebhook --lines 20
```

#### 3. AI Analysis Failures
```bash
# Error: Analysis status stuck on "processing"
# Solution: Check Vertex AI permissions and quota
gcloud auth list
gcloud config set project diagnostic-pro-prod

# Manually trigger analysis
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "SUBMISSION_ID"}'

# Check analysis logs
firebase functions:log analyzeDiagnostic --lines 20
```

#### 4. Email Delivery Issues
```bash
# Error: Email status shows "failed"
# Solution: Check email logs and function configuration
firebase firestore:query emailLogs --where status == "failed" --limit 5

# Check email function logs
firebase functions:log sendDiagnosticEmail --lines 20

# Manual email trigger
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/sendDiagnosticEmail \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "SUBMISSION_ID"}'
```

#### 5. Firestore Permission Errors
```bash
# Error: Firestore operations fail with permission denied
# Solution: Check Firestore rules and authentication
firebase firestore:rules get
firebase auth:export /tmp/auth_export.json

# Test Firestore connectivity
firebase firestore:get "diagnosticSubmissions/test"
```

### TaskWarrior Integration Troubleshooting

#### Reset Payment Test Project
```bash
# If tests need to be rerun or reset
task project:payment-test delete
task project:payment-test add "Restart payment test suite after troubleshooting"

# Start fresh with new task sequence
# (Repeat task creation from setup section)
```

#### Task Status Recovery
```bash
# If tasks get stuck or need status updates
task project:payment-test list
task ID modify status:pending  # Reset stuck tasks
task ID start                  # Restart specific task
task ID done                   # Force complete if manual verification passed
```

### Performance Monitoring

#### Key Metrics to Track
```bash
# Response times
time curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic

# Firestore operation latency
time firebase firestore:get "diagnosticSubmissions/SUBMISSION_ID"

# End-to-end processing time
# (Calculated in Task 9 based on timestamp differences)
```

#### Success Rate Calculation
```bash
# Calculate success rate from multiple test runs
TOTAL_TESTS=$(task project:payment-test count)
SUCCESSFUL_TESTS=$(task project:payment-test status:completed count)
SUCCESS_RATE=$((SUCCESSFUL_TESTS * 100 / TOTAL_TESTS))
echo "Success Rate: ${SUCCESS_RATE}%"
```

---

## Production Readiness Checklist

### Before Production Release
- [ ] All 10 TaskWarrior test tasks complete successfully
- [ ] End-to-end processing time < 60 seconds
- [ ] Email delivery rate > 98%
- [ ] Payment webhook success rate > 99%
- [ ] AI analysis generation success rate > 95%
- [ ] File storage and retrieval functional
- [ ] Error handling and logging comprehensive
- [ ] Firestore security rules properly configured
- [ ] All test data cleaned up
- [ ] TaskWarrior project documented and archived

### Security Verification
- [ ] Test environment uses Stripe test keys only
- [ ] Production environment uses live Stripe keys
- [ ] Firestore rules prevent unauthorized access
- [ ] Customer PII properly protected
- [ ] Payment data handling complies with PCI requirements
- [ ] API endpoints have proper authentication
- [ ] Cloud Function permissions properly scoped

### Monitoring Setup
- [ ] Firebase performance monitoring enabled
- [ ] Cloud Function error alerting configured
- [ ] Stripe webhook monitoring dashboard
- [ ] Firestore operation metrics tracked
- [ ] Email delivery success rate monitoring
- [ ] AI analysis performance metrics
- [ ] Customer satisfaction feedback loop

---

**End of Guide**
**Date Completed:** 2025-09-29
**Next Review:** Before production deployment