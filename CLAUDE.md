# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## DiagnosticPro AI Platform v1.0.0

✅ **PRODUCTION RELEASE** - Professional equipment diagnostic platform with proprietary 14-section AI analysis framework.

Customer-facing diagnostic service providing comprehensive 2000+ word PDF reports for vehicles, machinery, and equipment. $4.99 per diagnostic with Stripe payments, AI-powered analysis via Vertex AI Gemini 2.5 Flash, and instant PDF delivery.

## Architecture Overview

**Dual-Project Structure:**
- **Frontend**: React 18 + TypeScript + Vite → `02-src/frontend/`
- **Backend**: Node.js Express API → `02-src/backend/services/backend/`

**Production Environment:**
- **Frontend Hosting**: Firebase Hosting (`diagnosticpro.io`)
- **Backend Platform**: Google Cloud Run (`diagnosticpro-vertex-ai-backend`)
- **Database**: Firestore (3 collections: diagnosticSubmissions, orders, emailLogs)
- **AI Engine**: Vertex AI Gemini 2.5 Flash
- **Storage**: Cloud Storage with signed URLs
- **Payments**: Stripe webhooks ($4.99)
- **GCP Project**: `diagnostic-pro-prod`

## Core Business Flow

```
Customer Form → Firestore (diagnosticSubmissions)
     ↓
Stripe Payment ($4.99) → Firestore (orders)
     ↓
Webhook → Cloud Run Backend
     ↓
Vertex AI Gemini 2.5 Flash (14-section analysis)
     ↓
PDF Generation → Cloud Storage (signed URL)
     ↓
Customer Download (2000+ word report)
```

## Proprietary 14-Section AI Framework

🎯 **PRIMARY DIAGNOSIS** - Root cause with confidence percentage
🔍 **DIFFERENTIAL DIAGNOSIS** - Alternative causes ranked by likelihood
✅ **DIAGNOSTIC VERIFICATION** - Exact tests shops must perform
❓ **SHOP INTERROGATION** - 5 technical questions to expose incompetence
🗣️ **CONVERSATION SCRIPTING** - Word-for-word customer coaching
💸 **COST BREAKDOWN** - Fair pricing vs overcharge identification
🚩 **RIPOFF DETECTION** - Scam identification and protection
⚖️ **AUTHORIZATION GUIDE** - Approve/reject/second opinion recommendations
🔧 **TECHNICAL EDUCATION** - System operation and failure mechanisms
📦 **OEM PARTS STRATEGY** - Specific part numbers and sourcing
💬 **NEGOTIATION TACTICS** - Professional negotiation strategies
🔬 **LIKELY CAUSES** - Ranked confidence percentages
📊 **RECOMMENDATIONS** - Immediate actions and maintenance
🔗 **SOURCE VERIFICATION** - Authoritative links and TSB references

## Quick Commands

### Frontend Development (React + TypeScript + Vite)

```bash
# Navigate to frontend
cd 02-src/frontend

# Install and setup
npm install                     # Install dependencies
make install                    # Install with git hooks

# Development
npm run dev                     # Start Vite dev server (http://localhost:8080)
make dev                        # Alternative via Makefile

# Testing & Quality
npm test                        # Run Jest tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run lint                   # ESLint
npx tsc --noEmit              # Type checking
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"  # Format
make full-check                # Run ALL checks (required before commits)
make safe-commit               # Safety checks + commit instructions

# Build
npm run build                  # Production build
npm run build:dev              # Development build
npm run preview                # Preview production build
```

### Backend API (Cloud Run Service)

```bash
# Navigate to backend
cd 02-src/backend/services/backend

# Install dependencies
npm install

# Development
npm run dev                    # Nodemon with hot reload
npm start                      # Production mode

# Testing
npm test                       # Run tests

# Environment setup
cp .env.example .env          # Copy template
# Edit .env with Secret Manager values

# Deploy to Cloud Run
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source . \
  --region us-central1 \
  --project diagnostic-pro-prod \
  --allow-unauthenticated

# View logs
gcloud logging read "resource.type=\"cloud_run_revision\" \
  AND resource.labels.service_name=\"diagnosticpro-vertex-ai-backend\"" \
  --project diagnostic-pro-prod --limit 50
```

### Firebase Deployment (Production)

```bash
# Navigate to Firebase infrastructure
cd 06-infrastructure/firebase

# Deploy frontend to diagnosticpro.io
firebase deploy --only hosting:diagnostic-pro-prod

# Deploy Firestore rules
firebase deploy --only firestore

# Deploy storage rules
firebase deploy --only storage

# Deploy everything
firebase deploy

# Local development with emulators
firebase emulators:start

# View function logs
firebase functions:log

# Deploy database indexes
firebase firestore:indexes
```

### Git Workflow (STRICTLY ENFORCED)

```bash
# ALWAYS create feature branches
git checkout -b feature/description
make create-branch

# Before ANY commit - REQUIRED
cd 02-src/frontend && make safe-commit

# Commit after checks pass
git add .
git commit -m "type(scope): description"

# Push to feature branch
git push origin feature/description

# NEVER commit directly to main
# NEVER use --no-verify flag
# Pre-commit hooks enforce this
```

## Project Structure

```
DiagnosticPro/
├── 01-docs/                    # Documentation with Makefile
├── 02-src/
│   ├── frontend/               # React 18 + TypeScript + Vite
│   │   ├── src/
│   │   │   ├── components/    # React components (shadcn/ui)
│   │   │   │   ├── ui/       # Base UI components (Radix UI)
│   │   │   │   └── __tests__/ # Component tests (Jest + RTL)
│   │   │   ├── pages/        # Route components
│   │   │   ├── services/     # API clients (Firestore, Cloud Storage)
│   │   │   ├── config/       # Configuration (Firebase, feature flags)
│   │   │   ├── utils/        # Utilities and helpers
│   │   │   ├── integrations/ # Firebase integration layer
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Shared utilities (cn, utils)
│   │   │   └── data/         # Static data (manufacturers list)
│   │   ├── package.json      # Frontend dependencies
│   │   └── vite.config.ts    # Vite configuration
│   └── backend/
│       └── services/
│           └── backend/       # Cloud Run API (Node.js Express)
│               ├── index.js   # Main Express server
│               ├── reportPdf.js # PDF generation (PDFKit + IBM Plex Mono)
│               ├── secrets.js # Secret Manager integration
│               ├── handlers/  # Request handlers
│               ├── templates/ # PDF templates
│               └── fonts/     # IBM Plex Mono fonts
├── 03-tests/                  # Integration tests
├── 04-assets/                 # Static assets and images
├── 05-scripts/                # Deployment and utility scripts
├── 06-infrastructure/
│   └── firebase/
│       ├── firebase.json      # Firebase configuration
│       ├── firestore.rules   # Database security rules
│       └── storage.rules     # Storage security rules
├── 07-releases/               # Release notes and versioning
├── 08-features/               # Feature research and planning
├── functions/                 # Firebase Cloud Functions (future)
├── cloudbuild.yaml           # Google Cloud Build CI/CD
└── CLAUDE.md                 # This file
```

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript 5.5
- **Build Tool**: Vite 5.4
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest 30 + React Testing Library 16
- **Database Client**: Firebase SDK (@google-cloud/firestore)

### Backend
- **Runtime**: Node.js 20 (LTS)
- **Framework**: Express 4.18
- **Database**: Firestore (@google-cloud/firestore)
- **Storage**: Cloud Storage (@google-cloud/storage)
- **AI**: Vertex AI SDK (@google-cloud/vertexai)
- **Payments**: Stripe SDK
- **PDF Generation**: PDFKit with IBM Plex Mono fonts
- **Secrets**: Secret Manager (@google-cloud/secret-manager)
- **Authentication**: google-auth-library

### Infrastructure
- **Hosting**: Firebase Hosting
- **Backend**: Cloud Run (containerized Node.js)
- **Database**: Firestore (NoSQL document store)
- **Storage**: Cloud Storage (PDF reports)
- **AI**: Vertex AI (Gemini 2.5 Flash)
- **CDN**: Firebase Hosting CDN (global)
- **CI/CD**: Cloud Build + GitHub workflows

## Key API Endpoints (Cloud Run Backend)

```
GET  /healthz              # Health check
POST /saveSubmission       # Save diagnostic form to Firestore
POST /createPaymentIntent  # Create Stripe payment intent
POST /webhook/stripe       # Process Stripe payment webhooks
GET  /submission/:id       # Retrieve submission by ID
POST /analyzeWithVertexAI  # Trigger Vertex AI analysis
GET  /report/:id           # Get signed URL for PDF report
```

## Environment Variables

### Frontend (02-src/frontend/.env)
```bash
# Firebase Configuration (Production)
VITE_FIREBASE_PROJECT_ID=diagnostic-pro-prod
VITE_FIREBASE_API_KEY=AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg
VITE_FIREBASE_AUTH_DOMAIN=diagnostic-pro-prod.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app

# API Configuration (Cloud Run backend)
VITE_API_BASE=https://diagnosticpro-vertex-ai-backend-xxxxx.run.app
VITE_DISABLE_API=false  # Set to true to disable API calls
```

### Backend (02-src/backend/services/backend/.env)
```bash
# Google Cloud Project
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod

# Secret Manager Secrets (loaded at runtime)
STRIPE_SECRET_KEY=<from-secret-manager>
STRIPE_WEBHOOK_SECRET=<from-secret-manager>
REPORT_BUCKET=<from-secret-manager>

# Firestore
FIRESTORE_PROJECT_ID=diagnostic-pro-prod

# Vertex AI
VERTEX_AI_PROJECT=diagnostic-pro-prod
VERTEX_AI_REGION=us-central1
VERTEX_AI_MODEL=gemini-2.5-flash-002
```

## Database Schema (Firestore)

### Collection: diagnosticSubmissions
```typescript
{
  id: string;                    // Auto-generated document ID
  equipmentType: string;         // "Vehicle", "Machinery", etc.
  manufacturer: string;          // Equipment manufacturer
  model: string;                 // Model name/number
  year?: string;                 // Manufacturing year (optional)
  symptoms: string;              // Customer-described symptoms
  additionalInfo?: string;       // Optional additional details
  contact: {
    email: string;
    name: string;
  };
  analysisStatus: string;        // "pending" | "processing" | "completed" | "failed"
  createdAt: Timestamp;          // Firestore timestamp
  updatedAt: Timestamp;
  orderId?: string;              // Reference to orders collection
  reportUrl?: string;            // Cloud Storage signed URL
}
```

### Collection: orders
```typescript
{
  id: string;                    // Stripe payment intent ID
  submissionId: string;          // Reference to diagnosticSubmissions
  amount: number;                // Amount in cents (499)
  currency: string;              // "usd"
  status: string;                // "pending" | "succeeded" | "failed"
  stripePaymentIntentId: string; // Stripe payment intent ID
  customerEmail: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: emailLogs
```typescript
{
  id: string;
  submissionId: string;          // Reference to diagnosticSubmissions
  recipientEmail: string;
  subject: string;
  status: string;                // "sent" | "failed" | "pending"
  errorMessage?: string;
  sentAt?: Timestamp;
  createdAt: Timestamp;
}
```

## Testing Strategy

### Frontend Tests (Jest + React Testing Library)
```bash
# Test files location
02-src/frontend/src/components/__tests__/Button.test.tsx
02-src/frontend/src/components/__tests__/DiagnosticForm.test.tsx
02-src/frontend/src/components/__tests__/Hero.test.tsx
02-src/frontend/src/utils/__tests__/validation.test.ts

# Run tests
cd 02-src/frontend
npm test                    # All tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm test Button.test.tsx   # Single file
```

### Backend Tests (Jest)
```bash
cd 02-src/backend/services/backend
npm test
```

## Development Guidelines

### Code Quality Enforcement
- **TypeScript**: Strict mode enabled, no `any` types without justification
- **ESLint**: Enforced via pre-commit hooks
- **Prettier**: Auto-formatting on save
- **Jest**: Minimum test coverage for critical paths
- **Git Hooks**: Pre-commit prevents direct main commits

### Required Checks Before Commit
```bash
cd 02-src/frontend
make safe-commit  # Runs: lint + type-check + format-check + tests
```

The Makefile enforces these checks:
1. **ESLint** - Code quality and best practices
2. **TypeScript** - Type safety verification
3. **Prettier** - Code formatting consistency
4. **Jest** - All tests must pass

### Branch Protection Rules
1. **NEVER** commit directly to `main` branch
2. **ALWAYS** create feature branches: `feature/description`
3. **MUST** pass all checks via `make safe-commit`
4. Pre-commit hooks prevent invalid commits
5. All PRs require passing CI checks

## PDF Report Generation

### Implementation Details
- **Library**: PDFKit
- **Font**: IBM Plex Mono (Regular + Bold)
- **Location**: `02-src/backend/services/backend/reportPdf.js`
- **Format**: Letter size (8.5" x 11"), 54pt margins
- **Features**: Headers/footers on every page, buffered page rendering
- **Output**: 2000+ words across 14 structured sections

### Font Requirements
```bash
# Fonts location
02-src/backend/services/backend/fonts/
├── IBMPlexMono-Regular.ttf
└── IBMPlexMono-Bold.ttf
```

## Monitoring & Debugging

### Cloud Run Backend Logs
```bash
# View recent logs
gcloud logging read "resource.type=\"cloud_run_revision\" \
  AND resource.labels.service_name=\"diagnosticpro-vertex-ai-backend\"" \
  --project diagnostic-pro-prod --limit 50

# Tail logs in real-time
gcloud logging tail "resource.type=\"cloud_run_revision\" \
  AND resource.labels.service_name=\"diagnosticpro-vertex-ai-backend\"" \
  --project diagnostic-pro-prod

# Health check
curl https://diagnosticpro-vertex-ai-backend-xxxxx.run.app/healthz
```

### Firestore Operations
```bash
# Query data
gcloud firestore collections list --project diagnostic-pro-prod

# View indexes
firebase firestore:indexes

# Export data
gcloud firestore export gs://backup-bucket/ --project diagnostic-pro-prod
```

### Vertex AI Monitoring
```bash
# List AI endpoints
gcloud ai endpoints list --project diagnostic-pro-prod --region us-central1

# View AI model predictions
gcloud ai model-monitoring-jobs list --project diagnostic-pro-prod
```

## Performance Targets

- **End-to-end Success Rate**: >95%
- **Email Delivery Rate**: >98%
- **Response Time**: <10 minutes (form submission to PDF delivery)
- **Frontend Load Time**: <2 seconds (diagnosticpro.io)
- **API Latency**: <500ms (Cloud Run)
- **Firestore Queries**: <100ms
- **Vertex AI Analysis**: <30 seconds
- **Customer Satisfaction**: >4.5/5

## CI/CD Pipeline

### GitHub Actions (.github/workflows/ci.yml)
- **Trigger**: Push to feature branches or main
- **Steps**: Install → Lint → Type Check → Test → Build
- **Status**: Required passing for PR merge

### Cloud Build (cloudbuild.yaml)
```yaml
Steps:
1. Install frontend dependencies (02-src/frontend)
2. Build production bundle (npm run build)
3. Copy dist/ to Firebase deployment directory
4. Deploy to Firebase Hosting (diagnosticpro.io)
```

### Manual Deployment
```bash
# Frontend deployment
cd 02-src/frontend
npm run build
cd ../../06-infrastructure/firebase
firebase deploy --only hosting:diagnostic-pro-prod

# Backend deployment
cd 02-src/backend/services/backend
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source . \
  --region us-central1 \
  --project diagnostic-pro-prod
```

## Security Considerations

### Firestore Security Rules
- Anonymous read: DENIED
- Authenticated write: User-specific only
- Service account: Full access (backend API)
- Public read: DENIED on all collections

### Cloud Storage Security
- Reports bucket: Private by default
- Signed URLs: 1-hour expiration
- CORS: Restricted to diagnosticpro.io
- Public access: DISABLED

### API Security
- CORS: Whitelisted domains only
- Rate limiting: Implemented via Cloud Run
- Webhook verification: Stripe signature validation
- Environment variables: Secret Manager only

### Payment Security
- PCI compliance: Stripe handles card data
- Webhook secrets: Stored in Secret Manager
- Amount validation: Server-side only
- No client-side price manipulation

## Project Context

Part of the larger DiagnosticPro platform ecosystem:
- **Parent Directory**: `/home/jeremy/projects/diagnostic-platform/`
- **Related Projects**:
  - `bigq and scrapers/schema/` - BigQuery schemas (266 tables)
  - `bigq and scrapers/scraper/` - Data collection systems
  - `bigq and scrapers/rss_feeds/` - RSS feed curation (226 feeds)

This customer-facing service integrates with the broader platform's data analytics infrastructure for market research and product improvement.

## Support & Documentation

- **Production URL**: https://diagnosticpro.io
- **Support Email**: support@diagnosticpro.io
- **Developer Onboarding**: `/DEVELOPER-ONBOARDING.md`
- **Release Notes**: `/07-releases/`
- **Feature Planning**: `/08-features/`
