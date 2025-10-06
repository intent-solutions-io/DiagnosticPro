#!/bin/bash

# Setup environment variables from GitHub secrets
# Run this script from the DiagnosticPro root directory

echo "🔧 Setting up environment variables from GitHub secrets..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Installing..."
    sudo apt update && sudo apt install gh -y
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"

# Create .env file for frontend
echo "📝 Creating frontend .env file..."
cat > .env << EOF
# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY=$(gh secret get VITE_FIREBASE_API_KEY 2>/dev/null || echo "your_firebase_api_key_here")
VITE_FIREBASE_AUTH_DOMAIN=diagnostic-pro-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=diagnostic-pro-prod
VITE_FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=$(gh secret get VITE_FIREBASE_MESSAGING_SENDER_ID 2>/dev/null || echo "your_messaging_sender_id")
VITE_FIREBASE_APP_ID=$(gh secret get VITE_FIREBASE_APP_ID 2>/dev/null || echo "your_app_id")
VITE_FIREBASE_MEASUREMENT_ID=$(gh secret get VITE_FIREBASE_MEASUREMENT_ID 2>/dev/null || echo "your_measurement_id")

# Google Cloud
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod

# Stripe
STRIPE_SECRET_KEY=$(gh secret get STRIPE_SECRET_KEY 2>/dev/null || echo "sk_test_xxxxx")
STRIPE_WEBHOOK_SECRET=$(gh secret get STRIPE_WEBHOOK_SECRET 2>/dev/null || echo "whsec_xxxxx")

# Development flags
VITE_API_BASE=""
VITE_DISABLE_API="true"
EOF

# Create .env file for backend (if backend directory exists)
if [ -d "backend" ] || [ -d "02-src/backend" ] || [ -d "working-docs/backend" ]; then
    echo "📝 Creating backend .env file..."

    # Find the backend directory
    BACKEND_DIR=""
    if [ -d "backend" ]; then
        BACKEND_DIR="backend"
    elif [ -d "02-src/backend" ]; then
        BACKEND_DIR="02-src/backend"
    elif [ -d "working-docs/backend" ]; then
        BACKEND_DIR="working-docs/backend"
    fi

    if [ -n "$BACKEND_DIR" ]; then
        cat > "$BACKEND_DIR/.env" << EOF
# Google Cloud
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1

# Stripe
STRIPE_SECRET_KEY=$(gh secret get STRIPE_SECRET_KEY 2>/dev/null || echo "sk_test_xxxxx")
STRIPE_WEBHOOK_SECRET=$(gh secret get STRIPE_WEBHOOK_SECRET 2>/dev/null || echo "whsec_xxxxx")

# Firebase
FIREBASE_PROJECT_ID=diagnostic-pro-prod

# Vertex AI
VERTEX_AI_PROJECT=diagnostic-pro-prod
VERTEX_AI_REGION=us-central1
EOF
        echo "✅ Backend .env created in $BACKEND_DIR/"
    fi
fi

echo "✅ Frontend .env created in root directory"
echo ""
echo "🔐 Environment files created! Next steps:"
echo "1. Ask Jeremy to add missing secrets to GitHub if any show placeholder values"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' to start development server"
echo ""
echo "📍 Files created:"
echo "   - .env (frontend)"
if [ -n "$BACKEND_DIR" ]; then
    echo "   - $BACKEND_DIR/.env (backend)"
fi
echo ""
echo "⚠️  If you see placeholder values (like 'your_firebase_api_key_here'), those secrets need to be added to GitHub by Jeremy."