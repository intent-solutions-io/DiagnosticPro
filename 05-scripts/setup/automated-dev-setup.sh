#!/bin/bash

# DiagnosticPro Automated Development Setup
# Run this script once to set up both frontend and backend for development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 DiagnosticPro Automated Development Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# 1. Setup Frontend Environment
print_status "Setting up Frontend environment..."

FRONTEND_DIR="$PROJECT_ROOT/02-src/frontend"
if [ -d "$FRONTEND_DIR" ]; then
    cat > "$FRONTEND_DIR/.env" << 'EOF'
# Firebase Configuration (Production - diagnostic-pro-prod)
VITE_FIREBASE_API_KEY=AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg
VITE_FIREBASE_AUTH_DOMAIN=diagnostic-pro-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=diagnostic-pro-prod
VITE_FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=298932670545
VITE_FIREBASE_APP_ID=1:298932670545:web:d710527356371228556870
VITE_FIREBASE_MEASUREMENT_ID=G-VQW6LFYQPS

# API Configuration
VITE_API_GATEWAY_URL=https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev
VITE_API_KEY=REDACTED_API_KEY

# Enable AI Analysis Pipeline
VITE_USE_NEW_API=true
VITE_API_BASE=https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev
EOF
    print_success "Frontend .env created"

    # Install frontend dependencies
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        print_status "Installing frontend dependencies..."
        cd "$FRONTEND_DIR"
        npm install --silent
        print_success "Frontend dependencies installed"
    fi
else
    print_warning "Frontend directory not found: $FRONTEND_DIR"
fi

# 2. Setup Backend Environment
print_status "Setting up Backend environment..."

BACKEND_DIR="$PROJECT_ROOT/02-src/backend/services/backend"
if [ -d "$BACKEND_DIR" ]; then
    cat > "$BACKEND_DIR/.env" << 'EOF'
# Google Cloud Project
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod

# Storage Bucket (not a secret)
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1

# Local development settings
PORT=8080
NODE_ENV=development
EOF
    print_success "Backend .env created"

    # Update secrets.js to use correct project
    if [ -f "$BACKEND_DIR/secrets.js" ]; then
        print_status "Configuring Secret Manager for cross-project access..."
        sed -i "s/const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'diagnostic-pro-prod';/const PROJECT_ID = 'diagnostic-pro-prod'; \/\/ Secrets stored here/g" "$BACKEND_DIR/secrets.js"
        print_success "Secret Manager configured for diagnostic-pro-prod"
    fi

    # Install backend dependencies
    if [ -f "$BACKEND_DIR/package.json" ]; then
        print_status "Installing backend dependencies..."
        cd "$BACKEND_DIR"
        npm install --silent
        print_success "Backend dependencies installed"
    fi
else
    print_warning "Backend directory not found: $BACKEND_DIR"
fi

# 3. Verify Google Cloud Authentication
print_status "Verifying Google Cloud authentication..."

if gcloud auth application-default print-access-token &> /dev/null; then
    print_success "Google Cloud authenticated"
else
    print_warning "Not authenticated with Google Cloud"
    echo ""
    echo "Run this command to authenticate:"
    echo "  gcloud auth application-default login"
    echo ""
fi

# 4. Print summary
echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "📁 Frontend: $FRONTEND_DIR"
echo "   - .env configured with Firebase settings"
echo "   - Dependencies installed"
echo "   - Start with: npm run dev"
echo ""
echo "📁 Backend: $BACKEND_DIR"
echo "   - .env configured (no secrets in file)"
echo "   - Dependencies installed"
echo "   - Secrets loaded from Google Secret Manager"
echo "   - Start with: npm start"
echo ""
echo "🔐 Authentication:"
if gcloud auth application-default print-access-token &> /dev/null; then
    echo "   ✅ Authenticated with Google Cloud"
else
    echo "   ⚠️  Run: gcloud auth application-default login"
fi
echo ""
echo "🚀 Quick Start Commands:"
echo ""
echo "   # Start Frontend (in new terminal)"
echo "   cd $FRONTEND_DIR"
echo "   npm run dev"
echo ""
echo "   # Start Backend (in new terminal)"
echo "   cd $BACKEND_DIR"
echo "   npm start"
echo ""
echo "=============================================="
