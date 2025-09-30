# DiagnosticPro Payment Test Quick Reference
**Date:** 2025-09-29

## Quick Start Commands

### Initial Setup
```bash
# Navigate to project
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro

# Initialize TaskWarrior payment test project
./scripts/payment-test-runner.sh init

# View task workflow
./scripts/payment-test-runner.sh status
```

### Run Complete Test Suite
```bash
# Execute all 10 test tasks in sequence
./scripts/payment-test-runner.sh run

# Monitor progress
watch ./scripts/payment-test-runner.sh status
```

### Run Individual Tasks
```bash
# Run specific task (1-10)
./scripts/payment-test-runner.sh run 1    # Environment setup
./scripts/payment-test-runner.sh run 3    # Create submission
./scripts/payment-test-runner.sh run 4    # Execute payment
./scripts/payment-test-runner.sh run 9    # Integration verification
```

### Monitor and Report
```bash
# Check current status
./scripts/payment-test-runner.sh status

# View project summary
./scripts/payment-test-runner.sh summary

# Generate test report
./scripts/payment-test-runner.sh report

# Clean up after testing
./scripts/payment-test-runner.sh clean
```

## Test Flow Overview

| Task | Description | Duration | Key Validation |
|------|-------------|----------|----------------|
| 1 | Environment Setup | 30s | Firebase connectivity |
| 2 | Dependencies Check | 15s | Stripe test mode |
| 3 | Create Submission | 60s | Firestore record |
| 4 | Execute Payment | 120s | Stripe webhook |
| 5 | Verify Webhook | 30s | Order creation |
| 6 | AI Analysis | 45s | Vertex AI processing |
| 7 | PDF Storage | 30s | Cloud Storage |
| 8 | Email Delivery | 30s | Email logs |
| 9 | Integration Check | 15s | End-to-end status |
| 10 | Documentation | 30s | Report generation |

**Total Duration**: ~6-8 minutes

## Critical Test Data

### Stripe Test Card
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

### Test Customer Data
```json
{
  "fullName": "Test Customer Payment",
  "email": "test+[timestamp]@diagnosticpro.io",
  "make": "Ford",
  "model": "F-150",
  "year": "2020",
  "problemDescription": "Engine making unusual noise"
}
```

## Success Criteria

### Task-Level Success
- ✅ Task completes without errors
- ✅ TaskWarrior annotations show progress
- ✅ Firestore data validated
- ✅ Function logs show activity

### End-to-End Success
- ✅ Payment Status: "paid"
- ✅ Analysis Status: "completed"
- ✅ Processing Status: "completed"
- ✅ Email Status: "sent"
- ✅ Processing Time: < 60 seconds

## Manual Testing Steps (if API fails)

### 1. Create Submission
```
1. Open https://diagnosticpro.io
2. Fill form with test data above
3. Note submission ID
4. Save to: /tmp/diagnosticpro-payment-test/submission_id
```

### 2. Execute Payment
```
1. Navigate to payment page
2. Use Stripe test card: 4242 4242 4242 4242
3. Complete payment flow
4. Wait 10 seconds for webhook
```

### 3. Manual Webhook (if needed)
```bash
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/stripeWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "object": {
        "id": "cs_test_manual",
        "amount_total": 2999,
        "customer_details": {"email": "test@example.com"},
        "metadata": {"submissionId": "YOUR_SUBMISSION_ID"}
      }
    }
  }'
```

## Troubleshooting Quick Fixes

### Functions Not Deployed
```bash
firebase deploy --only functions
firebase functions:list
```

### Webhook Failures
```bash
# Check logs
firebase functions:log stripeWebhook --lines 20

# Manual trigger
./scripts/payment-test-runner.sh run 5
```

### AI Analysis Stuck
```bash
# Check Vertex AI
gcloud ai endpoints list --region=us-east1

# Manual trigger
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "YOUR_ID"}'
```

### Email Not Sent
```bash
# Check email logs
firebase firestore:query emailLogs --where status == "failed"

# Manual trigger
curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/sendDiagnosticEmail \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "YOUR_ID"}'
```

## TaskWarrior Commands

### Project Management
```bash
# List all payment test tasks
task project:payment-test list

# Show only pending tasks
task project:payment-test status:pending list

# Show completed tasks
task project:payment-test completed

# Add annotation to task
task [ID] annotate "Custom note"

# Start/stop task
task [ID] start
task [ID] stop
task [ID] done

# Reset stuck task
task [ID] modify status:pending
```

### Task Dependencies
```bash
# View task dependencies
task project:payment-test list dep

# Show task details
task [ID] info

# Export task data
task project:payment-test export
```

## File Locations

### Test Data Directory
```
/tmp/diagnosticpro-payment-test/
├── submission_id              # Current test submission
├── test_email                # Test customer email
├── order_id                  # Created order ID
├── submission_created.json   # Firestore submission data
├── paid_submission.json      # Payment verification
├── analysis_content.json     # AI analysis result
├── final_status.txt          # End-to-end status
└── payment_test_report.md    # Final test report
```

### Log Files
```
/tmp/diagnosticpro-payment-test/payment-test-[timestamp].log
```

### Archives
```
/tmp/payment-test-[timestamp].tar.gz
```

## Production Readiness Checklist

### Before Production Deployment
- [ ] All 10 tasks complete successfully
- [ ] Processing time < 60 seconds
- [ ] No failed webhook deliveries
- [ ] AI analysis quality acceptable
- [ ] Email delivery rate > 98%
- [ ] Error handling comprehensive
- [ ] Security rules properly configured

### Performance Benchmarks
- **Submission Creation**: < 2 seconds
- **Payment Processing**: < 5 seconds
- **AI Analysis**: < 30 seconds
- **Email Delivery**: < 10 seconds
- **End-to-End**: < 60 seconds

### Monitoring Setup
- [ ] Firebase performance monitoring
- [ ] Cloud Function error alerts
- [ ] Stripe webhook monitoring
- [ ] Customer satisfaction tracking

---

## Emergency Procedures

### Stop All Tests
```bash
# Kill any running tasks
task project:payment-test stop

# Clean up completely
./scripts/payment-test-runner.sh clean
```

### Production Key Protection
```bash
# Verify test environment
echo $STRIPE_PUBLISHABLE_KEY | grep "pk_test_" || echo "DANGER: Production keys!"
```

### Data Cleanup
```bash
# Remove test submissions (manual Firestore cleanup needed)
# Never run in production!
```

---

**Support**: For issues, check function logs and TaskWarrior annotations
**Last Updated**: 2025-09-29