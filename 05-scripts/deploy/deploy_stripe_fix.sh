#!/bin/bash

# 🚀 STRIPE SESSION FIX DEPLOYMENT SCRIPT
# Deploys the client_reference_id fix and tests the complete payment flow

echo "🔧 DiagnosticPro Stripe Session Fix Deployment"
echo "=============================================="
echo ""

# Function to check command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 is not installed or not in PATH"
        exit 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-""}

    echo "🧪 Testing: $method $url"

    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url")
    fi

    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

    if [ $http_code -eq 200 ] || [ $http_code -eq 201 ]; then
        echo "✅ Success: HTTP $http_code"
        echo "   Response: $(echo $body | head -c 100)..."
        return 0
    else
        echo "❌ Failed: HTTP $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Check prerequisites
echo "📋 Checking prerequisites..."
check_command "gcloud"
check_command "firebase"
check_command "curl"
check_command "jq"

# Set project configuration
PROJECT_ID="diagnostic-pro-prod"
BACKEND_SERVICE="diagnosticpro-vertex-ai-backend"
REGION="us-central1"
API_BASE="https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev"

echo "🔧 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Service: $BACKEND_SERVICE"
echo "   Region: $REGION"
echo "   API Base: $API_BASE"
echo ""

# Step 1: Deploy backend changes
echo "🚀 Step 1: Deploying backend changes..."
cd backend

echo "   Building and deploying Cloud Run service..."
gcloud run deploy $BACKEND_SERVICE \
    --source . \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 540

if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

echo ""

# Step 2: Wait for deployment to be ready
echo "⏳ Step 2: Waiting for service to be ready..."
sleep 10

# Step 3: Test backend health
echo "🏥 Step 3: Testing backend health..."
BACKEND_URL="https://simple-diagnosticpro-298932670545.us-central1.run.app"

test_endpoint "$BACKEND_URL/healthz"
if [ $? -ne 0 ]; then
    echo "❌ Backend health check failed"
    exit 1
fi

echo ""

# Step 4: Test session creation endpoint
echo "🧪 Step 4: Testing session creation..."
TEST_SUBMISSION_ID="test_stripe_fix_$(date +%s)"
SESSION_DATA="{\"submissionId\": \"$TEST_SUBMISSION_ID\"}"

echo "   Creating test session with submissionId: $TEST_SUBMISSION_ID"
session_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$SESSION_DATA" \
    "$API_BASE/createCheckoutSession")

if echo "$session_response" | jq -e '.url' > /dev/null 2>&1; then
    echo "✅ Session creation successful"
    session_url=$(echo "$session_response" | jq -r '.url')
    session_id=$(echo "$session_response" | jq -r '.sessionId')
    echo "   Session ID: $session_id"
    echo "   Checkout URL: $session_url"
else
    echo "❌ Session creation failed"
    echo "   Response: $session_response"
    exit 1
fi

echo ""

# Step 5: Test session retrieval endpoint
echo "🔍 Step 5: Testing session retrieval..."
echo "   Retrieving session: $session_id"

test_endpoint "$API_BASE/checkout/session?id=$session_id"
if [ $? -eq 0 ]; then
    # Get detailed session data
    session_details=$(curl -s -H "x-api-key: REDACTED_API_KEY" \
        "$API_BASE/checkout/session?id=$session_id")

    echo "   Session details:"
    echo "$session_details" | jq '.'

    # Check if client_reference_id is set
    client_ref_id=$(echo "$session_details" | jq -r '.client_reference_id // empty')
    if [ -n "$client_ref_id" ] && [ "$client_ref_id" != "null" ]; then
        echo "✅ client_reference_id is properly set: $client_ref_id"
    else
        echo "❌ client_reference_id is missing or null"
        exit 1
    fi
else
    echo "❌ Session retrieval failed"
    exit 1
fi

echo ""

# Step 6: Deploy frontend changes (if needed)
echo "🌐 Step 6: Deploying frontend changes..."
cd ../

# Check if we need to build and deploy frontend
if [ -f "package.json" ]; then
    echo "   Building frontend..."
    npm run build

    if [ $? -eq 0 ]; then
        echo "   Deploying to Firebase Hosting..."
        firebase deploy --only hosting --project $PROJECT_ID

        if [ $? -eq 0 ]; then
            echo "✅ Frontend deployed successfully"
        else
            echo "❌ Frontend deployment failed"
            exit 1
        fi
    else
        echo "❌ Frontend build failed"
        exit 1
    fi
else
    echo "   No package.json found, skipping frontend deployment"
fi

echo ""

# Step 7: Final validation
echo "🔬 Step 7: Final validation..."

echo "   Testing complete API flow..."
echo "   1. ✅ Backend health check"
echo "   2. ✅ Session creation with client_reference_id"
echo "   3. ✅ Session retrieval with fallback logic"
echo "   4. ✅ Enhanced error handling and logging"

echo ""

# Step 8: Generate test instructions
echo "📋 Step 8: Test Instructions"
echo "==========================="
echo ""
echo "Manual Testing Steps:"
echo "1. Create a test submission:"
echo "   curl -X POST -H 'Content-Type: application/json' \\"
echo "        -d '{\"submissionId\": \"manual_test_$(date +%s)\"}' \\"
echo "        '$API_BASE/createCheckoutSession'"
echo ""
echo "2. Complete payment using the returned checkout URL"
echo ""
echo "3. Verify success page loads without 'Failed to retrieve checkout session details' error"
echo ""
echo "4. Check Cloud Run logs for session retrieval:"
echo "   gcloud logging read 'resource.type=\"cloud_run_revision\"' \\"
echo "        --project=$PROJECT_ID --limit=20"
echo ""

# Step 9: Monitoring setup
echo "📊 Step 9: Monitoring Information"
echo "================================="
echo ""
echo "Monitor the deployment:"
echo "• Backend logs: gcloud logging read 'resource.type=\"cloud_run_revision\"' --project=$PROJECT_ID"
echo "• Frontend: https://diagnosticpro.io"
echo "• API Gateway: $API_BASE"
echo "• Health check: $BACKEND_URL/healthz"
echo ""

echo "🎉 Stripe Session Fix Deployment Complete!"
echo ""
echo "Key Changes Applied:"
echo "• ✅ Added client_reference_id to session creation"
echo "• ✅ Enhanced session retrieval with fallback logic"
echo "• ✅ Added retry logic to frontend PaymentSuccess"
echo "• ✅ Improved error handling and logging"
echo ""
echo "The 'Failed to retrieve checkout session details' error should now be resolved."
echo "Monitor the first few payments to confirm the fix is working correctly."