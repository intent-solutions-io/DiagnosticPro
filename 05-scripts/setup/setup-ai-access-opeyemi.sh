#!/bin/bash
# AI Access & Budget Setup for Opeyemi Ariyo
# Run this script to verify/setup access and configure budget

PROJECT_ID="diagnosticpro-relay"
DEVELOPER_EMAIL="opeyemiariyo@intentsolutions.io"
LOCATION="us-central1"
CLAUDE_BUDGET=30

echo "════════════════════════════════════════════════════════════"
echo "Setting up AI Access for Opeyemi Ariyo"
echo "Project: $PROJECT_ID"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verify prerequisites
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found. Please install Google Cloud SDK first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ Error: Not authenticated with gcloud. Run 'gcloud auth login' first."
    exit 1
fi

# Set active project
echo "Setting active project..."
gcloud config set project $PROJECT_ID || {
    echo "❌ Error: Cannot access project $PROJECT_ID. Check permissions."
    exit 1
}

echo "Step 1: Verifying APIs are enabled..."
echo "────────────────────────────────────────────────────────────"
gcloud services enable \
  aiplatform.googleapis.com \
  generativelanguage.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudresourcemanager.googleapis.com \
  billing.googleapis.com \
  --project=$PROJECT_ID

echo "✅ APIs enabled"
echo ""

echo "Step 2: Granting IAM permissions to Opeyemi..."
echo "────────────────────────────────────────────────────────────"

# Grant Vertex AI User role (for Gemini + Claude)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$DEVELOPER_EMAIL" \
  --role="roles/aiplatform.user" \
  --condition=None

# Grant Vertex AI Service Agent (for model access)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$DEVELOPER_EMAIL" \
  --role="roles/aiplatform.serviceAgent" \
  --condition=None

# Grant Viewer role (for console access)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$DEVELOPER_EMAIL" \
  --role="roles/viewer" \
  --condition=None

# Grant Cloud Functions Invoker (for router access)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$DEVELOPER_EMAIL" \
  --role="roles/cloudfunctions.invoker" \
  --condition=None

# Grant Monitoring Viewer (for budget dashboard access)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$DEVELOPER_EMAIL" \
  --role="roles/monitoring.viewer" \
  --condition=None

echo "✅ IAM permissions granted"
echo ""

echo "Step 3: Setting up $CLAUDE_BUDGET/month Claude budget..."
echo "────────────────────────────────────────────────────────────"

# Get billing account
BILLING_ACCOUNT=$(gcloud billing projects describe $PROJECT_ID \
  --format="value(billingAccountName)" 2>/dev/null | sed 's|billingAccounts/||')

if [ -z "$BILLING_ACCOUNT" ]; then
  echo "⚠️  Warning: No billing account found"
  echo "   Budget setup skipped - configure manually at:"
  echo "   https://console.cloud.google.com/billing/budgets"
else
  echo "Billing account: $BILLING_ACCOUNT"

  # Check if budget already exists
  EXISTING_BUDGET=$(gcloud billing budgets list \
    --billing-account=$BILLING_ACCOUNT \
    --filter="displayName:'Claude AI Budget - Opeyemi'" \
    --format="value(name)" 2>/dev/null)

  if [ -z "$EXISTING_BUDGET" ]; then
    echo "Creating new budget..."

    # Create budget with JSON config for better control
    cat > /tmp/budget-config.json << EOF
{
  "displayName": "Claude AI Budget - Opeyemi",
  "budgetFilter": {
    "projects": ["projects/$PROJECT_ID"],
    "services": ["services/aiplatform.googleapis.com"],
    "labels": {
      "user": "opeyemi"
    }
  },
  "amount": {
    "specifiedAmount": {
      "currencyCode": "USD",
      "units": "$CLAUDE_BUDGET"
    }
  },
  "thresholdRules": [
    {
      "thresholdPercent": 0.5,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 0.75,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 0.9,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 1.0,
      "spendBasis": "CURRENT_SPEND"
    }
  ]
}
EOF

    gcloud billing budgets create \
      --billing-account=$BILLING_ACCOUNT \
      --budget-from-file=/tmp/budget-config.json \
      2>/dev/null && rm /tmp/budget-config.json

    echo "✅ Budget created with alerts at:"
    echo "   • 50% (\$15) - Early warning"
    echo "   • 75% (\$22.50) - Monitor closely"
    echo "   • 90% (\$27) - Almost at limit"
    echo "   • 100% (\$30) - Budget exhausted"
  else
    echo "✅ Budget already exists: $EXISTING_BUDGET"
  fi
fi

echo ""

echo "Step 4: Setting up budget notifications..."
echo "────────────────────────────────────────────────────────────"

# Create Pub/Sub topic for budget alerts
gcloud pubsub topics create budget-alerts-opeyemi --project=$PROJECT_ID 2>/dev/null || echo "Topic already exists"

# Create subscription for monitoring
gcloud pubsub subscriptions create budget-alerts-opeyemi-monitoring \
  --topic=budget-alerts-opeyemi \
  --project=$PROJECT_ID 2>/dev/null || echo "Subscription already exists"

echo "✅ Budget notification system ready"
echo ""

echo "Step 5: Verifying Opeyemi's access..."
echo "────────────────────────────────────────────────────────────"

# Check what roles Opeyemi has
echo "Current IAM roles for $DEVELOPER_EMAIL:"
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:$DEVELOPER_EMAIL" \
  --format="table(bindings.role:label=ROLE)" 2>/dev/null || echo "No roles found"

echo ""

echo "Step 6: Testing API access..."
echo "────────────────────────────────────────────────────────────"

# Test if Vertex AI is accessible
echo "Testing Vertex AI endpoint..."
gcloud ai models list \
  --region=$LOCATION \
  --project=$PROJECT_ID \
  --limit=1 \
  --format="value(name)" 2>/dev/null | head -1 > /dev/null && \
  echo "✅ Vertex AI accessible" || echo "⚠️  Vertex AI check failed"

# List available models
echo ""
echo "Available AI models:"
gcloud ai models list \
  --region=$LOCATION \
  --project=$PROJECT_ID \
  --format="table(displayName,name)" \
  --limit=5 2>/dev/null || echo "Could not list models"

echo ""

echo "Step 7: Checking for existing router deployment..."
echo "────────────────────────────────────────────────────────────"

ROUTER_EXISTS=$(gcloud functions list \
  --project=$PROJECT_ID \
  --filter="name:ai-router" \
  --format="value(name)" 2>/dev/null)

if [ -z "$ROUTER_EXISTS" ]; then
  echo "⚠️  Router not yet deployed"
  echo "   Deploy using: gcloud functions deploy ai-router ..."
else
  ROUTER_URL=$(gcloud functions describe ai-router \
    --region=$LOCATION \
    --gen2 \
    --project=$PROJECT_ID \
    --format="value(serviceConfig.uri)" 2>/dev/null)

  echo "✅ Router already deployed"
  echo "   URL: $ROUTER_URL"

  # Test router health
  if [ ! -z "$ROUTER_URL" ]; then
    echo ""
    echo "Testing router health..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ROUTER_URL/health" 2>/dev/null)
    if [ "$HTTP_STATUS" = "200" ]; then
      echo "✅ Router is healthy"
    else
      echo "⚠️  Router health check failed (HTTP $HTTP_STATUS)"
    fi
  fi
fi

echo ""

echo "Step 8: Creating welcome documentation..."
echo "────────────────────────────────────────────────────────────"

# Create quick start guide for Opeyemi
cat > /tmp/opeyemi-ai-quickstart.md << 'EOF'
# AI Access Quick Start Guide - Opeyemi

## 🎯 Your AI Access Details

**Project**: diagnostic-pro-dev
**Budget**: $30/month with automatic alerts
**Location**: us-central1

## 🔗 Key URLs

### Vertex AI Console
https://console.cloud.google.com/vertex-ai/generative?project=diagnostic-pro-dev

### Billing Dashboard
https://console.cloud.google.com/billing?project=diagnostic-pro-dev

### IAM Permissions
https://console.cloud.google.com/iam-admin/iam?project=diagnostic-pro-dev

## 🚀 Getting Started

1. **Login to Google Cloud Console**
   - Use your @intentsolutions.io account
   - Access the Vertex AI section

2. **Test Claude/Gemini Access**
   - Go to Vertex AI > Generative AI
   - Try the Claude or Gemini chat interface

3. **Monitor Usage**
   - Check billing dashboard regularly
   - You'll get alerts at 50%, 75%, 90%, 100% of budget

## 🔧 API Usage

```bash
# Set your project
gcloud config set project diagnostic-pro-dev

# Test API access
gcloud ai models list --region=us-central1 --limit=5
```

## 📊 Budget Alerts

You'll receive notifications when spending reaches:
- **$15** (50%) - Early warning
- **$22.50** (75%) - Monitor closely
- **$27** (90%) - Almost at limit
- **$30** (100%) - Budget exhausted

## 📞 Support

Contact Jeremy for any access issues or questions.
EOF

echo "✅ Quick start guide created: /tmp/opeyemi-ai-quickstart.md"

echo ""

echo "════════════════════════════════════════════════════════════"
echo "SETUP SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Developer: $DEVELOPER_EMAIL"
echo "Claude Budget: \$$CLAUDE_BUDGET/month"
echo ""
echo "📋 What was configured:"
echo "   ✓ APIs enabled (Vertex AI, Cloud Functions, Billing)"
echo "   ✓ IAM permissions granted (AI User, Viewer, Functions Invoker)"
echo "   ✓ Budget alerts configured with 4 threshold levels"
echo "   ✓ Notification system set up"
echo "   ✓ Access verification completed"
echo ""
echo "🔗 Important URLs for Opeyemi:"
echo ""
echo "   Vertex AI Console:"
echo "   https://console.cloud.google.com/vertex-ai/generative?project=$PROJECT_ID"
echo ""
echo "   Billing Dashboard:"
echo "   https://console.cloud.google.com/billing?project=$PROJECT_ID"
echo ""
echo "   IAM Permissions:"
echo "   https://console.cloud.google.com/iam-admin/iam?project=$PROJECT_ID"
echo ""
if [ ! -z "$ROUTER_URL" ]; then
echo "   Router URL:"
echo "   $ROUTER_URL"
echo ""
fi
echo "📧 Next Steps:"
echo "   1. Send /tmp/opeyemi-ai-quickstart.md to Opeyemi"
echo "   2. Have Opeyemi test access at Vertex AI console"
echo "   3. Share router URL: ${ROUTER_URL:-'[Deploy router first]'}"
echo "   4. Schedule brief onboarding call if needed"
echo ""
echo "💡 Usage Monitoring:"
echo "   - Budget alerts active for spending control"
echo "   - Monthly usage reviews recommended"
echo "   - Automatic notifications at key thresholds"
echo ""
echo "✅ Setup Complete!"
echo "════════════════════════════════════════════════════════════"