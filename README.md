# DiagnosticPro

<div align="center">

[![Live Status](https://img.shields.io/badge/status-live-success.svg)](https://diagnosticpro.io)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28.svg)](https://firebase.google.com)
[![Vertex AI](https://img.shields.io/badge/Vertex%20AI-Gemini%202.5-4285F4.svg)](https://cloud.google.com/vertex-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AI-powered equipment diagnostic platform delivering professional repair analysis for $4.99**

From vehicles to heavy machinery to electronics, get comprehensive diagnostic analysis with conversation coaching, shop interrogation strategies, and scam protection.

[Live Demo](https://diagnosticpro.io) • [Features](#-key-features) • [How It Works](#%EF%B8%8F-how-it-works) • [Technology](#-technology-stack)

</div>

---

## What Is This?

DiagnosticPro is a production AI diagnostic platform that transforms customer equipment problems into professional diagnostic reports. Built on Firebase, Cloud Run, and Vertex AI Gemini 2.5 Flash with a proprietary 15-section analysis framework.

This repository contains:
- React + TypeScript frontend (Firebase Hosting)
- Node.js Express backend (Cloud Run)
- Vertex AI Gemini 2.5 Flash integration (15-section analysis)
- Stripe payment processing ($4.99 per diagnostic)
- Production-grade PDF generation system
- Firestore real-time database

**Built by [Intent Solutions IO](https://intentsolutions.io)** — We design and deploy custom AI systems for enterprise intelligence.

---

## 🎯 Key Features

### Proprietary 15-Section Analysis Framework

Every diagnostic includes comprehensive analysis across 15 specialized sections:

**1. PRIMARY DIAGNOSIS** - Root cause with confidence percentage
**2. DIFFERENTIAL DIAGNOSIS** - Alternative causes ranked by likelihood
**3. DIAGNOSTIC VERIFICATION** - Exact tests shops must perform
**4. SHOP INTERROGATION** - 5 technical questions to expose incompetence
**5. CONVERSATION SCRIPTING** - Word-for-word customer coaching
**6. COST BREAKDOWN** - Fair pricing vs overcharge identification
**7. RIPOFF DETECTION** - Scam identification and protection
**8. AUTHORIZATION GUIDE** - Approve/reject/second opinion recommendations
**9. TECHNICAL EDUCATION** - System operation and failure mechanisms
**10. OEM PARTS STRATEGY** - Specific part numbers and sourcing
**11. NEGOTIATION TACTICS** - Professional negotiation strategies
**12. LIKELY CAUSES** - Ranked confidence percentages
**13. RECOMMENDATIONS** - Immediate actions and maintenance
**14. SOURCE VERIFICATION** - Authoritative links and TSB references
**15. ROOT CAUSE ANALYSIS** - Critical diagnostic component (v2.0)

### Professional PDF Generation (v2.0)

- Production-grade typography with hanging indents
- Orphan/widow control (no stranded lines)
- Comprehensive validation system
- 12-15 pages of professional analysis
- Instant download via signed URLs

### Enterprise Security

- Firebase Authentication ready
- Stripe PCI-compliant payment processing
- Google Cloud Storage with signed URLs
- Comprehensive Cloud Logging

---

## ⚡ Quick Start

### Prerequisites

```bash
# Required
- Node.js 18+
- Google Cloud account (diagnostic-pro-prod project)
- Firebase CLI
- Stripe account

# Get started in 5 minutes
```

### 1. Clone & Install

```bash
git clone https://github.com/jeremylongshore/DiagnosticPro.git
cd DiagnosticPro

# Install frontend dependencies
cd 02-src/frontend
npm install

# Install backend dependencies
cd ../backend/services/backend
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - Firebase config (from console.firebase.google.com)
# - Stripe keys (from dashboard.stripe.com)
# - Google Cloud project ID
```

### 3. Run Locally

```bash
# Start frontend (Vite dev server)
cd 02-src/frontend
npm run dev
# Frontend at http://localhost:5173

# Start backend (Cloud Run local)
cd 02-src/backend/services/backend
npm run dev
# Backend at http://localhost:8080
```

### 4. Deploy to Production

```bash
# Deploy frontend to Firebase Hosting
firebase deploy --only hosting

# Deploy backend to Cloud Run
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source 02-src/backend/services/backend \
  --region us-central1 \
  --project diagnostic-pro-prod

# Update environment variables
gcloud run services update diagnosticpro-vertex-ai-backend \
  --update-env-vars STRIPE_SECRET_KEY=your_key \
  --region us-central1
```

**That's it.** Your diagnostic platform is live.

---

## 🏗️ Architecture

DiagnosticPro uses a clean 3-tier architecture on Google Cloud.

```
┌─────────────────────────────────────────────────────────────────┐
│                FIREBASE HOSTING (Frontend)                       │
│  • React 18 + TypeScript + Vite                                 │
│  • diagnosticpro.io domain                                      │
│  • shadcn/ui + Tailwind CSS                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│              CLOUD RUN (Backend API)                            │
│  • Node.js 18 Express server                                    │
│  • Stripe webhook integration                                   │
│  • PDF generation pipeline                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ↓                 ↓                 ↓
┌─────────────┐  ┌──────────────┐  ┌─────────────────┐
│  FIRESTORE  │  │  VERTEX AI   │  │  CLOUD STORAGE  │
│  Database   │  │  Gemini 2.5  │  │  PDF Reports    │
└─────────────┘  └──────────────┘  └─────────────────┘
```

### The Customer Flow

Every diagnostic follows this workflow:

```
Customer Form → Firestore (diagnosticSubmissions)
     ↓
Stripe Payment ($4.99) → Firestore (orders)
     ↓
Webhook → 15-Section AI Analysis → Vertex AI Gemini 2.5 Flash
     ↓
PDF Generation (production-grade) → Cloud Storage → Signed URL
     ↓
Email Delivery → Customer Download
```

---

## 🚀 Deployment

### Current Status: v2.0.0 (2025-10-20)

**What's Live:**
- ✅ **Frontend** - Firebase Hosting at `diagnosticpro.io`
- ✅ **Backend API** - Cloud Run (`diagnosticpro-vertex-ai-backend`)
- ✅ **AI Engine** - Vertex AI Gemini 2.5 Flash (15-section analysis)
- ✅ **Payment** - Stripe integration ($4.99 per diagnostic)
- ✅ **Database** - Firestore (diagnosticSubmissions, orders, emailLogs)
- ✅ **PDF System** - Production-grade with validation (v2.0)

**Recent Updates:**
- **v2.0.0 (Oct 2025)** - Complete PDF overhaul, fixed 2:1 page ratio bug
- **Photo Upload** - Infrastructure deployed, code on branch (payment flow pending)

### Deployment Commands

```bash
# Frontend deployment
cd 02-src/frontend
npm run build
firebase deploy --only hosting

# Backend deployment
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source 02-src/backend/services/backend \
  --region us-central1 \
  --project diagnostic-pro-prod \
  --update-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest

# Firestore rules
firebase deploy --only firestore

# Health check
curl https://simple-diagnosticpro-298932670545.us-central1.run.app/healthz
```

---

## 💰 Cost Reality

**Monthly operational costs** (based on ~100 diagnostics/month):

| Component | Monthly Cost |
|-----------|--------------|
| Firebase Hosting | **Free** (Spark plan) |
| Cloud Run Backend | ~$10 (scale-to-zero) |
| Vertex AI Gemini | ~$15 (per-use pricing) |
| Firestore | ~$5 |
| Cloud Storage | ~$2 |
| Stripe Fees | 2.9% + $0.30 per transaction |
| **Total** | **~$32/month + transaction fees** |

**Revenue Model:**
- $4.99 per diagnostic
- ~70% margin after costs
- Scalable to $500B+ equipment market

### Cost Optimization

- Firebase Hosting free tier
- Cloud Run scale-to-zero when idle
- Gemini 2.5 Flash (60% cheaper than GPT-4)
- Efficient PDF generation (no Imagen costs)

---

## 🛠️ Development

### Key Commands

```bash
# Frontend development
npm run dev              # Vite dev server
npm run build           # Production build
npm run preview         # Test production build
npm test               # Jest tests

# Backend development
npm run dev            # Nodemon with hot reload
npm start             # Production mode
npm test              # Run tests

# Firebase operations
firebase emulators:start    # Local emulators
firebase deploy            # Deploy everything
firebase functions:log    # View function logs

# Quality checks
npm run lint          # ESLint
npm run format        # Prettier
npx tsc --noEmit     # Type checking
```

### Testing

```bash
# Frontend tests
cd 02-src/frontend
npm test
npm run test:watch
npm run test:coverage

# Backend tests
cd 02-src/backend/services/backend
npm test

# E2E testing
# 1. Start emulators: firebase emulators:start
# 2. Run frontend: npm run dev
# 3. Test payment flow with Stripe test cards
```

---

## 📊 Production Workflow (v2.0)

### Complete Customer Journey

```
1. Customer visits diagnosticpro.io
2. Fills diagnostic form (equipment, symptoms, codes)
3. Reviews submission details
4. Makes $4.99 payment via Stripe
5. Stripe webhook triggers analysis
6. Vertex AI generates 15-section report
7. PDF generated and uploaded to Cloud Storage
8. Email sent with signed download URL
9. Customer downloads professional PDF report
```

### 15-Section Analysis Generation

```javascript
// Vertex AI Gemini 2.5 Flash processes:
const analysis = await generateDiagnosticAnalysis({
  equipment: submission.equipment_type,
  symptoms: submission.symptoms_description,
  dtcCodes: submission.dtc_codes,
  framework: '15-section-proprietary'
});

// Returns 2000+ words structured analysis
```

### PDF Validation System (v2.0)

```javascript
const validator = new PDFValidationSystem();
const validation = validator.validateAnalysis(analysis);

if (!validation.isValid) {
  // Auto-fix or use defaults
  analysis = validator.cleanAndDefaultMissing(analysis);
}
```

---

## 📚 Documentation

### Project Documentation
- **[CLAUDE.md](CLAUDE.md)** - Complete system architecture & commands
- **[CHANGELOG.md](CHANGELOG.md)** - Version history (v2.0.0, v1.0.0)
- **[SECURITY.md](SECURITY.md)** - Security policy & vulnerability reporting
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[01-docs/](01-docs/)** - All technical documentation

### Key Technical Docs
- **[PDF v2.0 Architecture](01-docs/*)** - Production PDF system
- **[Photo Upload Rollback](01-docs/067-log-photo-upload-rollback.md)** - Infrastructure status
- **[Payment Integration](01-docs/guides/payment-test-execution-guide.md)** - Stripe setup

### External Resources
- **[Firebase Docs](https://firebase.google.com/docs)** - Hosting & Firestore
- **[Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)** - Gemini integration
- **[Stripe Docs](https://stripe.com/docs)** - Payment processing

---

## 🔧 Configuration

### Environment Variables

Required in `.env`:

```bash
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=diagnostic-pro-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=diagnostic-pro-prod
VITE_FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Cloud (Backend)
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod
REPORT_BUCKET=diagnostic-pro-prod-reports-us-central1

# Stripe Payment Processing (Required)
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXX

# Vertex AI (Production AI Engine)
VERTEX_AI_PROJECT=diagnostic-pro-prod
VERTEX_AI_LOCATION=us-central1

# Development Settings
NODE_ENV=production
PORT=8080
```

See [.env.example](.env.example) for full template.

---

## 🐛 Troubleshooting

### "PDF has blank pages!"

**Fixed in v2.0.0.** If you see this on older versions:

```bash
# Upgrade to v2.0.0
git pull origin main
npm install
npm run build
```

### "Payment succeeded but no email"

```bash
# Check Cloud Run logs
gcloud logging read \
  "resource.type=\"cloud_run_revision\" \
  AND resource.labels.service_name=\"diagnosticpro-vertex-ai-backend\"" \
  --project diagnostic-pro-prod --limit 50

# Check Firestore orders collection
firebase firestore:get orders/{orderId}
```

### "Frontend build fails"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `Firebase config missing` | Check all `VITE_FIREBASE_*` vars in `.env` |
| `Stripe webhook fails` | Verify webhook secret matches dashboard |
| `PDF generation slow` | Normal - Gemini analysis takes 20-30s |
| `CORS errors` | Check Cloud Run allows Firebase domain |

---

## 🎓 Philosophy

DiagnosticPro isn't another chatbot wrapper. It combines:

- **Enterprise AI** - Vertex AI Gemini 2.5 Flash for production reliability
- **Clean Architecture** - Firebase frontend, Cloud Run backend, Firestore database
- **Production PDF** - Comprehensive validation, typography, and error handling
- **Real Revenue** - $4.99 per diagnostic with 70%+ margins

### The Rules

**Firebase Hosting** = Customer-facing frontend
**Cloud Run** = API and business logic
**Vertex AI** = AI analysis engine
**Firestore** = Real-time database
**Cloud Storage** = PDF file delivery

Simple. Scalable. Ships revenue.

---

## 📊 Status

**Version:** v2.0.0 (2025-10-20)

**What's Working:**
- ✅ **Live Production Site** at diagnosticpro.io
- ✅ **Complete Payment Flow** ($4.99 diagnostics)
- ✅ **15-Section AI Analysis** (Vertex AI Gemini 2.5 Flash)
- ✅ **Production PDF Generation** (v2.0 with validation)
- ✅ **Email Delivery** (>98% delivery rate)
- ✅ **Stripe Integration** (test & live modes)

**What's Pending:**
- ⏳ Photo upload feature (infrastructure deployed, payment flow needs design)
- ⏳ Multi-equipment support expansion
- ⏳ Firebase Authentication integration

**Next Phase:** Customer accounts and diagnostic history

---

## 🏆 Credits

Built on:
- [Firebase](https://firebase.google.com) - Hosting & database
- [Vertex AI](https://cloud.google.com/vertex-ai) - Gemini 2.5 Flash
- [Cloud Run](https://cloud.google.com/run) - Backend API
- [Stripe](https://stripe.com) - Payment processing
- [shadcn/ui](https://ui.shadcn.com) - UI components

---

## Who Is This For?

**Equipment Owners** who need professional diagnostic analysis without shop markup

**Service Shops** looking to verify diagnoses or provide customer education

**Fleet Managers** tracking maintenance costs and repair validity

**Engineering Teams** evaluating Vertex AI for production revenue-generating applications

**Entrepreneurs** exploring AI diagnostic platforms as business models

---

## 🤝 Contributing

This is a production revenue-generating platform. For custom deployments or white-label versions:

**[Contact Intent Solutions IO](https://intentsolutions.io)**

We build and deploy custom AI diagnostic systems for enterprise clients.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

You're free to:
- Study the code
- Use patterns in your own projects
- Fork for personal use

For commercial use, please contact Intent Solutions IO.

---

## About Intent Solutions IO

We design and deploy custom AI systems for organizations that need production-ready intelligence platforms.

**Specialties:**
- Vertex AI production deployments
- Firebase + Cloud Run architectures
- Revenue-generating AI applications
- Enterprise diagnostic platforms

**Learn More:** [intentsolutions.io](https://intentsolutions.io)

---

**Powered by Google Cloud Vertex AI** • © 2025 Intent Solutions IO
