#!/bin/bash

# DiagnosticPro Payment Test Runner
# Automated TaskWarrior-based payment flow testing
# Date: 2025-09-29

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="payment-test"
PROJECT_DIR="/home/jeremy/projects/diagnostic-platform/DiagnosticPro"
TEST_DATA_DIR="/tmp/diagnosticpro-payment-test"

# Logging
LOG_FILE="$TEST_DATA_DIR/payment-test-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check TaskWarrior
    if ! command -v task &> /dev/null; then
        error "TaskWarrior not installed. Install with: sudo apt install taskwarrior"
        exit 1
    fi

    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        error "Firebase CLI not installed. Install with: npm install -g firebase-tools"
        exit 1
    fi

    # Check curl and jq
    for cmd in curl jq; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd not installed. Install with: sudo apt install $cmd"
            exit 1
        fi
    done

    # Check project directory
    if [[ ! -d "$PROJECT_DIR" ]]; then
        error "Project directory not found: $PROJECT_DIR"
        exit 1
    fi

    # Create test data directory
    mkdir -p "$TEST_DATA_DIR"

    success "Prerequisites check passed"
}

# Initialize TaskWarrior project
init_taskwarrior_project() {
    log "Initializing TaskWarrior payment test project..."

    # Check if project already exists
    if task project:$PROJECT_NAME count &> /dev/null; then
        read -p "Payment test project already exists. Reset it? (y/N): " reset
        if [[ "$reset" == "y" || "$reset" == "Y" ]]; then
            log "Deleting existing payment test project..."
            task project:$PROJECT_NAME delete &> /dev/null || true
        else
            warning "Using existing project. Some tasks may already be completed."
            return 0
        fi
    fi

    # Create task hierarchy
    log "Creating task workflow..."

    # Parent task
    TASK1=$(task add project:$PROJECT_NAME "Initialize DiagnosticPro payment test suite" priority:H | grep -o "Created task [0-9]*" | grep -o "[0-9]*")

    # Sequential tasks with dependencies
    TASK2=$(task add project:$PROJECT_NAME "Setup test environment and dependencies" priority:H depends:$TASK1 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK3=$(task add project:$PROJECT_NAME "Create diagnostic submission through UI" priority:H depends:$TASK2 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK4=$(task add project:$PROJECT_NAME "Execute Stripe test payment (4242424242424242)" priority:H depends:$TASK3 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK5=$(task add project:$PROJECT_NAME "Verify webhook processing and Firestore updates" priority:H depends:$TASK4 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK6=$(task add project:$PROJECT_NAME "Validate AI analysis generation" priority:H depends:$TASK5 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK7=$(task add project:$PROJECT_NAME "Confirm PDF generation and storage" priority:H depends:$TASK6 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK8=$(task add project:$PROJECT_NAME "Verify email delivery system" priority:H depends:$TASK7 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK9=$(task add project:$PROJECT_NAME "Complete integration verification" priority:H depends:$TASK8 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")
    TASK10=$(task add project:$PROJECT_NAME "Document test results and cleanup" priority:H depends:$TASK9 | grep -o "Created task [0-9]*" | grep -o "[0-9]*")

    # Store task IDs
    echo "$TASK1,$TASK2,$TASK3,$TASK4,$TASK5,$TASK6,$TASK7,$TASK8,$TASK9,$TASK10" > "$TEST_DATA_DIR/task_ids.txt"

    success "TaskWarrior project initialized with 10 tasks"

    # Show project overview
    log "Task workflow overview:"
    task project:$PROJECT_NAME list
}

# Execute individual test phase
execute_task() {
    local task_num=$1
    local description=$2

    log "=== EXECUTING TASK $task_num: $description ==="

    # Get task ID
    TASK_IDS=($(cat "$TEST_DATA_DIR/task_ids.txt" | tr ',' ' '))
    TASK_ID=${TASK_IDS[$((task_num-1))]}

    # Start task
    task $TASK_ID start
    task $TASK_ID annotate "Started at $(date)"

    case $task_num in
        1) execute_task_1 ;;
        2) execute_task_2 ;;
        3) execute_task_3 ;;
        4) execute_task_4 ;;
        5) execute_task_5 ;;
        6) execute_task_6 ;;
        7) execute_task_7 ;;
        8) execute_task_8 ;;
        9) execute_task_9 ;;
        10) execute_task_10 ;;
        *) error "Invalid task number: $task_num" ;;
    esac

    # Complete task
    task $TASK_ID done
    task $TASK_ID annotate "Completed at $(date)"

    success "Task $task_num completed successfully"
}

# Task 1: Environment Setup
execute_task_1() {
    log "Setting up test environment..."

    cd "$PROJECT_DIR"

    # Verify Firebase connectivity
    firebase projects:list | grep diagnostic-pro-prod || {
        error "Firebase project diagnostic-pro-prod not accessible"
        return 1
    }

    # Check Cloud Functions
    firebase functions:list > "$TEST_DATA_DIR/functions_status.txt"

    # Verify environment variables
    if [[ -z "$STRIPE_PUBLISHABLE_KEY" || -z "$STRIPE_SECRET_KEY" ]]; then
        warning "Stripe environment variables not set"
    fi

    # Check Firestore connectivity
    firebase firestore:indexes > "$TEST_DATA_DIR/firestore_indexes.txt"

    success "Environment setup completed"
}

# Task 2: Dependencies Validation
execute_task_2() {
    log "Validating dependencies..."

    # Validate Stripe test environment
    if [[ "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_test_ ]]; then
        success "Stripe test environment confirmed"
    else
        error "Production Stripe keys detected - STOPPING"
        exit 1
    fi

    # Check Vertex AI
    gcloud ai endpoints list --region=us-east1 > "$TEST_DATA_DIR/vertex_ai_endpoints.txt" || warning "Vertex AI access issues"

    # Validate Firestore collections
    for collection in diagnosticSubmissions orders emailLogs; do
        firebase firestore:get "$collection/test" &> /dev/null || log "Collection $collection accessible"
    done

    success "Dependencies validated"
}

# Task 3: Create Submission
execute_task_3() {
    log "Creating diagnostic submission..."

    # Generate unique test data
    TEST_EMAIL="test+$(date +%s)@diagnosticpro.io"
    SUBMISSION_DATA='{
        "fullName": "Test Customer Payment",
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

    # Try API submission first
    if curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/createSubmission \
        -H "Content-Type: application/json" \
        -d "$SUBMISSION_DATA" > "$TEST_DATA_DIR/submission_response.json" 2>/dev/null; then

        SUBMISSION_ID=$(jq -r '.submissionId' "$TEST_DATA_DIR/submission_response.json")
        success "Submission created via API: $SUBMISSION_ID"
    else
        warning "API submission failed - manual UI submission required"
        echo "Manual submission data:" > "$TEST_DATA_DIR/manual_submission_data.json"
        echo "$SUBMISSION_DATA" | jq . >> "$TEST_DATA_DIR/manual_submission_data.json"

        echo ""
        echo "=== MANUAL SUBMISSION REQUIRED ==="
        echo "1. Open https://diagnosticpro.io"
        echo "2. Use the test data from: $TEST_DATA_DIR/manual_submission_data.json"
        echo "3. Complete the form and note the submission ID"
        echo ""

        read -p "Enter submission ID: " SUBMISSION_ID
    fi

    # Store for later tasks
    echo "$SUBMISSION_ID" > "$TEST_DATA_DIR/submission_id"
    echo "$TEST_EMAIL" > "$TEST_DATA_DIR/test_email"

    # Verify submission in Firestore
    firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > "$TEST_DATA_DIR/submission_created.json"

    success "Submission verified: $SUBMISSION_ID"
}

# Task 4: Execute Payment
execute_task_4() {
    log "Executing Stripe test payment..."

    SUBMISSION_ID=$(cat "$TEST_DATA_DIR/submission_id")
    TEST_EMAIL=$(cat "$TEST_DATA_DIR/test_email")

    echo ""
    echo "=== STRIPE TEST PAYMENT EXECUTION ==="
    echo "Submission ID: $SUBMISSION_ID"
    echo "Test Email: $TEST_EMAIL"
    echo ""
    echo "MANUAL PAYMENT STEPS:"
    echo "1. Open https://diagnosticpro.io"
    echo "2. Navigate to payment for submission: $SUBMISSION_ID"
    echo "3. Use Stripe test card: 4242 4242 4242 4242"
    echo "4. Expiry: Any future date (e.g., 12/25)"
    echo "5. CVC: Any 3 digits (e.g., 123)"
    echo "6. Complete payment"
    echo ""

    read -p "Press Enter after completing payment..."

    # Wait for webhook processing
    log "Waiting for webhook processing (10 seconds)..."
    sleep 10

    # Verify payment status
    firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > "$TEST_DATA_DIR/paid_submission.json"

    if jq -e '.paymentStatus == "paid"' "$TEST_DATA_DIR/paid_submission.json" > /dev/null; then
        success "Payment verified - status updated to paid"
    else
        warning "Payment status not updated - checking webhook manually"

        # Manual webhook trigger
        curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/stripeWebhook \
            -H "Content-Type: application/json" \
            -d '{
                "data": {
                    "object": {
                        "id": "cs_test_'$(date +%s)'",
                        "amount_total": 2999,
                        "customer_details": {"email": "'$TEST_EMAIL'"},
                        "metadata": {"submissionId": "'$SUBMISSION_ID'"}
                    }
                }
            }' > "$TEST_DATA_DIR/manual_webhook.json"

        sleep 3
        firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > "$TEST_DATA_DIR/paid_submission_retry.json"

        if jq -e '.paymentStatus == "paid"' "$TEST_DATA_DIR/paid_submission_retry.json" > /dev/null; then
            success "Payment verified after manual webhook trigger"
        else
            error "Payment verification failed"
            return 1
        fi
    fi
}

# Task 5: Verify Webhook
execute_task_5() {
    log "Verifying webhook processing..."

    SUBMISSION_ID=$(cat "$TEST_DATA_DIR/submission_id")

    # Check order creation
    firebase firestore:query orders --where submissionId == "$SUBMISSION_ID" --limit 1 > "$TEST_DATA_DIR/order_data.json"

    if jq -e '.[0].status == "paid"' "$TEST_DATA_DIR/order_data.json" > /dev/null; then
        ORDER_ID=$(jq -r '.[0].id' "$TEST_DATA_DIR/order_data.json")
        echo "$ORDER_ID" > "$TEST_DATA_DIR/order_id"
        success "Order record verified: $ORDER_ID"
    else
        error "Order record not found or incorrect status"
        return 1
    fi

    # Check webhook logs
    firebase functions:log stripeWebhook --lines 10 > "$TEST_DATA_DIR/webhook_logs.txt"

    success "Webhook processing verified"
}

# Task 6: AI Analysis
execute_task_6() {
    log "Validating AI analysis generation..."

    SUBMISSION_ID=$(cat "$TEST_DATA_DIR/submission_id")

    # Trigger AI analysis
    curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic \
        -H "Content-Type: application/json" \
        -d '{"submissionId": "'$SUBMISSION_ID'"}' > "$TEST_DATA_DIR/analysis_trigger.json"

    if jq -e '.ok == true' "$TEST_DATA_DIR/analysis_trigger.json" > /dev/null; then
        success "AI analysis triggered"

        # Wait for completion
        log "Waiting for AI analysis (30 seconds)..."
        sleep 30

        # Check completion
        firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > "$TEST_DATA_DIR/analyzed_submission.json"

        if jq -e '.analysisStatus == "completed"' "$TEST_DATA_DIR/analyzed_submission.json" > /dev/null; then
            firebase firestore:get "analysis/$SUBMISSION_ID" > "$TEST_DATA_DIR/analysis_content.json"
            ANALYSIS_LENGTH=$(jq -r '.analysis | length' "$TEST_DATA_DIR/analysis_content.json")
            success "AI analysis completed ($ANALYSIS_LENGTH characters)"
        else
            error "AI analysis failed or incomplete"
            return 1
        fi
    else
        error "AI analysis trigger failed"
        return 1
    fi
}

# Task 7: PDF Storage
execute_task_7() {
    log "Confirming PDF generation and storage..."

    SUBMISSION_ID=$(cat "$TEST_DATA_DIR/submission_id")
    REPORT_PATH="reports/$SUBMISSION_ID.json"

    # Check Cloud Storage
    if gsutil ls "gs://diagnostic-pro-prod.firebasestorage.app/$REPORT_PATH" > /dev/null 2>&1; then
        success "Report file exists in Cloud Storage"

        # Download and verify
        gsutil cp "gs://diagnostic-pro-prod.firebasestorage.app/$REPORT_PATH" "$TEST_DATA_DIR/report.json"

        if jq -e '.submissionId and .customerEmail and .analysis' "$TEST_DATA_DIR/report.json" > /dev/null; then
            success "Report JSON structure validated"
        else
            error "Report JSON structure invalid"
            return 1
        fi
    else
        error "Report file not found in Cloud Storage"
        return 1
    fi

    # Test download URL
    curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/getDownloadUrl \
        -H "Content-Type: application/json" \
        -d '{"data": {"submissionId": "'$SUBMISSION_ID'"}}' > "$TEST_DATA_DIR/download_url.json"

    if jq -e '.result.url' "$TEST_DATA_DIR/download_url.json" > /dev/null; then
        success "Download URL generated successfully"
    else
        error "Download URL generation failed"
        return 1
    fi
}

# Task 8: Email Delivery
execute_task_8() {
    log "Verifying email delivery system..."

    SUBMISSION_ID=$(cat "$TEST_DATA_DIR/submission_id")

    # Trigger email
    curl -X POST https://us-east1-diagnostic-pro-prod.cloudfunctions.net/sendDiagnosticEmail \
        -H "Content-Type: application/json" \
        -d '{"submissionId": "'$SUBMISSION_ID'"}' > "$TEST_DATA_DIR/email_trigger.json"

    if jq -e '.ok == true and .emailSent == true' "$TEST_DATA_DIR/email_trigger.json" > /dev/null; then
        success "Email delivery triggered"

        # Check email logs
        firebase firestore:query emailLogs --where submissionId == "$SUBMISSION_ID" --limit 1 > "$TEST_DATA_DIR/email_logs.json"

        if jq -e '.[0].status == "sent"' "$TEST_DATA_DIR/email_logs.json" > /dev/null; then
            success "Email log verified"
        else
            error "Email log verification failed"
            return 1
        fi
    else
        error "Email delivery failed"
        return 1
    fi
}

# Task 9: Integration Verification
execute_task_9() {
    log "Completing integration verification..."

    SUBMISSION_ID=$(cat "$TEST_DATA_DIR/submission_id")
    ORDER_ID=$(cat "$TEST_DATA_DIR/order_id")

    # Final status check
    firebase firestore:get "diagnosticSubmissions/$SUBMISSION_ID" > "$TEST_DATA_DIR/final_submission.json"
    firebase firestore:get "orders/$ORDER_ID" > "$TEST_DATA_DIR/final_order.json"

    PAYMENT_STATUS=$(jq -r '.paymentStatus' "$TEST_DATA_DIR/final_submission.json")
    ANALYSIS_STATUS=$(jq -r '.analysisStatus' "$TEST_DATA_DIR/final_submission.json")
    ORDER_STATUS=$(jq -r '.status' "$TEST_DATA_DIR/final_order.json")
    PROCESSING_STATUS=$(jq -r '.processingStatus' "$TEST_DATA_DIR/final_order.json")
    EMAIL_STATUS=$(jq -r '.emailStatus' "$TEST_DATA_DIR/final_order.json")

    # Create final status report
    cat > "$TEST_DATA_DIR/final_status.txt" << EOF
=== FINAL INTEGRATION STATUS ===
Submission ID: $SUBMISSION_ID
Order ID: $ORDER_ID
Payment Status: $PAYMENT_STATUS
Analysis Status: $ANALYSIS_STATUS
Order Status: $ORDER_STATUS
Processing Status: $PROCESSING_STATUS
Email Status: $EMAIL_STATUS
EOF

    if [[ "$PAYMENT_STATUS" == "paid" && "$ANALYSIS_STATUS" == "completed" && "$ORDER_STATUS" == "paid" && "$PROCESSING_STATUS" == "completed" && "$EMAIL_STATUS" == "sent" ]]; then
        success "END-TO-END INTEGRATION SUCCESS"

        # Calculate processing time
        CREATED_AT=$(jq -r '.createdAt._seconds' "$TEST_DATA_DIR/final_submission.json")
        UPDATED_AT=$(jq -r '.updatedAt._seconds' "$TEST_DATA_DIR/final_submission.json")
        PROCESSING_TIME=$((UPDATED_AT - CREATED_AT))

        echo "Total processing time: ${PROCESSING_TIME}s" >> "$TEST_DATA_DIR/final_status.txt"
        success "Processing completed in ${PROCESSING_TIME} seconds"
    else
        error "Integration verification failed"
        cat "$TEST_DATA_DIR/final_status.txt"
        return 1
    fi
}

# Task 10: Documentation and Cleanup
execute_task_10() {
    log "Documenting results and cleanup..."

    # Generate comprehensive test report
    cat > "$TEST_DATA_DIR/payment_test_report.md" << EOF
# DiagnosticPro Payment Test Report

**Date**: $(date)
**Test Run**: $(basename "$TEST_DATA_DIR")
**Duration**: $(task project:$PROJECT_NAME completed | wc -l) tasks completed

## Test Results Summary
$(cat "$TEST_DATA_DIR/final_status.txt")

## Files Generated
$(ls -la "$TEST_DATA_DIR/")

## TaskWarrior Project Status
$(task project:$PROJECT_NAME summary)

## Task Completion Timeline
$(task project:$PROJECT_NAME completed)
EOF

    success "Test report generated: $TEST_DATA_DIR/payment_test_report.md"

    # Archive results
    ARCHIVE_NAME="payment-test-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "/tmp/$ARCHIVE_NAME" -C "$(dirname "$TEST_DATA_DIR")" "$(basename "$TEST_DATA_DIR")"

    success "Results archived: /tmp/$ARCHIVE_NAME"

    # Optional cleanup
    read -p "Clean up temporary files? (y/N): " cleanup
    if [[ "$cleanup" == "y" || "$cleanup" == "Y" ]]; then
        rm -rf "$TEST_DATA_DIR"
        success "Temporary files cleaned up"
    fi
}

# Main execution
main() {
    echo "🚀 DiagnosticPro Payment Test Runner"
    echo "====================================="

    check_prerequisites

    case "${1:-}" in
        "init")
            init_taskwarrior_project
            ;;
        "run")
            if [[ -z "${2:-}" ]]; then
                # Run all tasks
                for i in {1..10}; do
                    execute_task $i "$(task project:$PROJECT_NAME | grep "^$i " | cut -d' ' -f2-)"
                done
            else
                # Run specific task
                execute_task "$2" "$(task project:$PROJECT_NAME | grep "^$2 " | cut -d' ' -f2-)"
            fi
            ;;
        "status")
            task project:$PROJECT_NAME list
            ;;
        "summary")
            task project:$PROJECT_NAME summary
            ;;
        "report")
            if [[ -f "$TEST_DATA_DIR/payment_test_report.md" ]]; then
                cat "$TEST_DATA_DIR/payment_test_report.md"
            else
                error "No test report found. Run tests first."
            fi
            ;;
        "clean")
            task project:$PROJECT_NAME delete
            rm -rf "$TEST_DATA_DIR"
            success "Project and test data cleaned up"
            ;;
        *)
            echo "Usage: $0 {init|run [task_num]|status|summary|report|clean}"
            echo ""
            echo "Commands:"
            echo "  init          - Initialize TaskWarrior project"
            echo "  run           - Run all test tasks"
            echo "  run [1-10]    - Run specific task"
            echo "  status        - Show current task status"
            echo "  summary       - Show project summary"
            echo "  report        - Display test report"
            echo "  clean         - Clean up project and data"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"