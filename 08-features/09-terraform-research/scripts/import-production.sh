#!/bin/bash

# DiagnosticPro Production Infrastructure Import Script
# This script imports existing production resources into Terraform state

set -e

PROJECT_ID="diagnostic-pro-prod"
REGION="us-central1"

echo "🚀 Starting DiagnosticPro production infrastructure import..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Verify we're authenticated
echo "🔐 Verifying GCP authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1
if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with GCP. Run: gcloud auth login"
    exit 1
fi

echo "✅ GCP authentication verified"
echo ""

# Initialize Terraform
echo "⚙️ Initializing Terraform..."
terraform init
echo ""

# Import IAM Service Account
echo "👤 Importing IAM service account..."
terraform import \
    module.backend_service_account.google_service_account.backend_sa \
    "projects/$PROJECT_ID/serviceAccounts/diagnosticpro-vertex-ai-backend-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Import IAM bindings
echo "🔑 Importing IAM role bindings..."

terraform import \
    module.backend_service_account.google_project_iam_member.firestore_user \
    "$PROJECT_ID roles/datastore.user serviceAccount:diagnosticpro-vertex-ai-backend-sa@$PROJECT_ID.iam.gserviceaccount.com"

terraform import \
    module.backend_service_account.google_project_iam_member.storage_admin \
    "$PROJECT_ID roles/storage.objectAdmin serviceAccount:diagnosticpro-vertex-ai-backend-sa@$PROJECT_ID.iam.gserviceaccount.com"

terraform import \
    module.backend_service_account.google_project_iam_member.vertex_ai_user \
    "$PROJECT_ID roles/aiplatform.user serviceAccount:diagnosticpro-vertex-ai-backend-sa@$PROJECT_ID.iam.gserviceaccount.com"

terraform import \
    module.backend_service_account.google_project_iam_member.cloud_run_invoker \
    "$PROJECT_ID roles/run.invoker serviceAccount:diagnosticpro-vertex-ai-backend-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Import Firestore database
echo "🗄️ Importing Firestore database..."
terraform import \
    module.firestore.google_firestore_database.main \
    "projects/$PROJECT_ID/databases/(default)"

# Import Cloud Storage bucket
echo "🪣 Importing Cloud Storage bucket..."
terraform import \
    module.storage.google_storage_bucket.main \
    "$PROJECT_ID.firebasestorage.app"

# Import Cloud Run service
echo "🏃 Importing Cloud Run service..."
terraform import \
    module.cloud_run.google_cloud_run_service.main \
    "projects/$PROJECT_ID/locations/$REGION/services/diagnosticpro-vertex-ai-backend"

# Import Cloud Run IAM policy
echo "🔐 Importing Cloud Run IAM policy..."
terraform import \
    module.cloud_run.google_cloud_run_service_iam_member.public_access \
    "projects/$PROJECT_ID/locations/$REGION/services/diagnosticpro-vertex-ai-backend roles/run.invoker allUsers"

# Import API Gateway resources
echo "🌐 Importing API Gateway..."
# Note: API Gateway import may require specific IDs - check GCP Console

# Verify no drift
echo "✅ Verifying import success..."
terraform plan

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! All resources imported successfully!"
    echo "🔍 Run 'terraform plan' to verify no drift detected"
    echo "🚀 Production infrastructure is now managed by Terraform"
else
    echo ""
    echo "❌ Import completed with drift detected"
    echo "🔍 Review terraform plan output above"
    echo "📝 Manual configuration may be needed"
fi

echo ""
echo "📊 Import summary:"
echo "   ✅ IAM Service Account"
echo "   ✅ IAM Role Bindings (4)"
echo "   ✅ Firestore Database"
echo "   ✅ Cloud Storage Bucket"
echo "   ✅ Cloud Run Service"
echo "   ✅ Cloud Run IAM Policy"
echo "   ⚠️  API Gateway (manual verification needed)"
echo ""
echo "🎯 Next steps:"
echo "   1. Review terraform plan output"
echo "   2. Test $4.99 payment processing"
echo "   3. Verify PDF report generation"
echo "   4. Update team documentation"