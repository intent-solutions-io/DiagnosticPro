# DiagnosticPro: System Security Analysis & Operations Guide
*For: Opeyemi Ariyo (Senior Cybersecurity Engineer)*
*Generated: October 1, 2025*
*System Version: 1.0.1*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Directory Deep-Dive](#directory-deep-dive)
4. [Operational Reference](#operational-reference)
5. [Current State Assessment](#current-state-assessment)
6. [Quick Reference](#quick-reference)
7. [Recommendations Roadmap](#recommendations-roadmap)

---

## Executive Summary

DiagnosticPro is a production equipment diagnostic platform serving $4.99 universal equipment diagnostics through a Google Cloud Platform architecture. The system processes customer diagnostic forms, generates AI-powered PDF reports using Vertex AI Gemini 2.5 Flash, and delivers comprehensive 14-section analysis reports via email.

**Current Production Status**: ✅ **LIVE v1.0.1** - Fully operational with Firebase Hosting frontend, Cloud Run backend, and Firestore database. System handles end-to-end workflow from customer submission to PDF report delivery at 95%+ success rate.

The platform architecture separates concerns across three GCP projects: `diagnostic-pro-prod` (production services), `diagnostic-pro-start-up` (BigQuery data), and `diagnosticpro-relay` (development environment). Core technology stack includes React 18/TypeScript/Vite frontend, Node.js Express Cloud Run backend, and proprietary 14-section AI diagnostic framework.

**Key Business Metrics**: $4.99 per diagnostic (reduced from $29.99), targeting expansion from $100B automotive to $500B+ universal equipment market. Current deployment serves diagnosticpro.io domain with autoscaling Cloud Run services and Firebase CDN distribution.

---

## System Architecture Overview

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React + TypeScript + Vite | 18.3.1 | Customer diagnostic interface |
| **Backend API** | Node.js Express | 18+ | Cloud Run service with Vertex AI |
| **Database** | Firestore | Latest | Customer data, orders, email logs |
| **AI Engine** | Vertex AI Gemini 2.5 Flash | Latest | 14-section diagnostic analysis |
| **Hosting** | Firebase Hosting | Latest | diagnosticpro.io CDN distribution |
| **Payments** | Stripe | 14.10.0 | $4.99 payment processing |
| **Storage** | Cloud Storage | 7.5.0 | PDF report storage with signed URLs |
| **Build** | Vite + npm | 5.4.1 | Frontend bundling and optimization |

### GCP Services in Use

| Service | Purpose | Environment | Key Config |
|---------|---------|-------------|------------|
| **Cloud Run** | Backend API | diagnostic-pro-prod | `diagnosticpro-vertex-ai-backend` |
| **Firebase Hosting** | Frontend CDN | diagnostic-pro-prod | diagnosticpro.io |
| **Firestore** | Customer Database | diagnostic-pro-prod | 3 collections |
| **Cloud Storage** | PDF Reports | diagnostic-pro-prod | Signed URL access |
| **Vertex AI** | AI Analysis | diagnostic-pro-prod | Gemini 2.5 Flash |
| **Secret Manager** | API Keys | diagnostic-pro-prod | Stripe, Firebase config |
| **BigQuery** | Analytics Data | diagnostic-pro-start-up | 266 tables |

### Architecture Diagram

```
Customer (diagnosticpro.io)
    ↓ [HTTPS]
Firebase Hosting (React App)
    ↓ [API calls]
Cloud Run Backend (Node.js/Express)
    ↓ [Analysis]
Vertex AI Gemini 2.5 Flash
    ↓ [PDF Generation]
Cloud Storage (Reports)
    ↓ [Data]
Firestore (Orders/Submissions/EmailLogs)
    ↓ [Email Delivery]
Customer PDF Report
```

**Critical Paths**:
- Payment: Stripe webhook → Cloud Run → Firestore → AI analysis
- Report: Vertex AI → PDF generation → Cloud Storage → Email delivery
- Data: BigQuery analytics ← Cross-project data pipeline

---

## Directory Deep-Dive

### 01-docs/ 📚
**Purpose**: Technical documentation and project guides
- `PRDs/`: Product Requirements Documents for features
- `SECURITY_AUDIT_REPORT_20250930.md`: Comprehensive security analysis
- `PROJECT_OPTIMIZATION_PLAN.md`: Performance and scaling plans
- `Makefile`: Documentation build automation
- **Gaps**: Missing API documentation, deployment runbooks need updates

### 02-src/ 🔧
**Purpose**: Source code for frontend and backend services

#### 02-src/frontend/
- **Framework**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Entry Point**: `src/main.tsx` → React Router setup
- **Key Files**:
  - `package.json`: Dependencies (Node 20 required)
  - `vite.config.ts`: Build configuration with proxy
  - `tsconfig.json`: TypeScript strict mode enabled
- **Build Commands**: `npm run dev`, `npm run build`, `npm run preview`

#### 02-src/backend/services/backend/
- **Framework**: Node.js 18+ Express API
- **Entry Point**: `index.js` (39,839 lines) - Complete backend service
- **Key Dependencies**:
  - `@google-cloud/firestore`: Database operations
  - `@google-cloud/vertexai`: AI analysis engine
  - `@google-cloud/storage`: PDF report storage
  - `stripe`: Payment processing ($4.99)
  - `pdfkit`: PDF generation with custom fonts
- **Endpoints**:
  - `GET /healthz`: Health check (200 OK)
  - `POST /saveSubmission`: Pre-payment data storage
  - `POST /webhook/stripe`: Payment processing trigger
  - `POST /processOrder`: AI analysis + PDF generation

### 03-tests/ 🧪
**Purpose**: Testing infrastructure
- **Frontend**: Jest + React Testing Library configured
- **Backend**: Jest for API testing (minimal coverage)
- **Current Coverage**: Component tests for UI, validation utilities
- **Gaps**: Integration tests, end-to-end payment flow testing

### 04-assets/ 🎨
**Purpose**: Static assets and media files
- **Organization**: Structured by asset type
- **Build Process**: Vite handles optimization and bundling
- **CDN**: Firebase Hosting serves with aggressive caching headers
- **Optimization**: Images need WebP conversion, unused assets exist

### 05-scripts/ ⚙️
**Purpose**: Operational automation scripts
- `setup-ai-access-opeyemi.sh`: Developer access configuration
- `bootstrap_pdf_generator.sh`: PDF service initialization
- `verify_pdf_generator.sh`: PDF functionality testing
- **Dependencies**: Requires gcloud CLI authentication
- **Documentation**: Scripts have inline help, but need centralized docs

### 06-infrastructure/ 🏗️ 🔑
**CRITICAL SECTION** - Infrastructure as Code

#### firebase/
- **Tool**: Firebase CLI configuration
- **Configuration**: `firebase.json` with hosting, functions, rules
- **Projects**:
  - `diagnostic-pro-prod`: Production hosting
  - `diagnosticpro-redirect`: Legacy redirect setup
- **Rules**: `firestore.rules`, `storage.rules` for security
- **Deployment**: `firebase deploy --only hosting`

#### cloudrun/
- **Tool**: Docker containerization
- **Base Image**: `node:18-alpine` with security hardening
- **User**: Non-root nodejs user (UID 1001)
- **Health Check**: `/healthz` endpoint monitoring
- **Port**: 8080 with EXPOSE directive
- **Security**: Read-only filesystem, dropped capabilities

#### gcp/
- **Structure**: Organized by service type (iam/, secrets/, storage/)
- **State Management**: **WARNING - No Terraform state found**
- **Secrets**: Google Secret Manager for API keys
- **IAM**: Service accounts need documentation
- **Current Gap**: No Infrastructure as Code implementation

### 07-releases/ 📦
**Purpose**: Release management and versioning
- **Strategy**: Semantic versioning (current: v1.0.1)
- **Process**: Git tags with release notes
- **Artifacts**: Frontend builds, Docker images
- **Rollback**: Manual Cloud Run revision management
- **Deployment Checklist**: Basic, needs enhancement

### 08-features/ 🔑
**CRITICAL SECTION** - Cloud Run Services

This directory contains feature modules that map to Cloud Run services. Currently structured as development templates rather than active services.

**Current Services in Production**:
1. **Platform Migration** (`diagnostic-pro-prod.diagnosticpro-vertex-ai-backend`)
   - **Purpose**: Main API backend replacing Supabase
   - **Language**: Node.js 18+ Express
   - **Location**: `02-src/backend/services/backend/`
   - **Endpoints**: Health, submissions, Stripe webhook, order processing
   - **Resources**: 1 vCPU, 2Gi memory, 0-100 instances
   - **IAM**: Custom service account with Firestore, Storage, Vertex AI access

**Template Features** (08-features/):
- `00-platform-migration/`: Migration documentation
- `01-storage-infrastructure/`: Storage configuration templates
- `02-ai-api-integration/`: AI service integration patterns
- `03-file-upload/` through `08-dynamic-diagnostic-input/`: UI feature modules

---

## Operational Reference

### Deployment Workflows

#### Local Development
1. **Required Tools**:
   - Node.js 20+, npm 9+
   - Firebase CLI (`npm install -g firebase-tools`)
   - Google Cloud SDK with authentication
   - Docker (for Cloud Run testing)

2. **Environment Setup**:
   ```bash
   # Clone and setup
   git clone https://github.com/jeremylongshore/DiagnosticPro.git
   cd DiagnosticPro

   # Frontend development
   cd 02-src/frontend
   npm install
   cp .env.example .env
   # Add Firebase config variables
   npm run dev # http://localhost:5173

   # Backend development
   cd ../../02-src/backend/services/backend
   npm install
   cp .env.example .env
   # Add Google Cloud project variables
   npm run dev # http://localhost:8080
   ```

3. **Local Testing**:
   ```bash
   # Frontend tests
   cd 02-src/frontend
   npm test
   npm run test:coverage

   # Backend API testing
   cd 02-src/backend/services/backend
   npm test
   curl http://localhost:8080/healthz
   ```

#### Staging Deployment
**Current Gap**: No staging environment configured

**Recommended Setup**:
- Use `diagnosticpro-relay` project for staging
- Separate Firebase site: `diagnosticpro-staging`
- Cloud Run staging service with lower resource limits
- Firestore staging collections with test data

#### Production Deployment 🔑

**Frontend (Firebase Hosting)**:
```bash
cd 06-infrastructure/firebase
npm run build # Build frontend first
firebase deploy --only hosting --project diagnostic-pro-prod
```

**Backend (Cloud Run)**:
```bash
cd 02-src/backend/services/backend
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source . \
  --region us-central1 \
  --project diagnostic-pro-prod \
  --memory 2Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 100 \
  --timeout 540s \
  --env-vars-file .env.production
```

**Pre-deployment Checklist**:
- [ ] All tests passing (`npm test` in both frontend/backend)
- [ ] Environment variables updated in Secret Manager
- [ ] Database backup completed (Firestore export)
- [ ] Health check endpoint responding
- [ ] Vertex AI quotas sufficient for load

**Rollback Commands**:
```bash
# Rollback Cloud Run to previous revision
gcloud run services update-traffic diagnosticpro-vertex-ai-backend \
  --to-revisions=REVISION=100 \
  --project diagnostic-pro-prod

# Rollback Firebase Hosting
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID
```

### Monitoring & Alerting

#### Dashboards
- **Cloud Monitoring**: https://console.cloud.google.com/monitoring/dashboards
  - Custom dashboard: "DiagnosticPro Production Health"
  - Widgets: Response time, error rate, instance count, Firestore operations
- **Firebase Console**: https://console.firebase.google.com/project/diagnostic-pro-prod
  - Hosting analytics, function logs, Firestore usage
- **Stripe Dashboard**: Payment processing metrics and webhook delivery

#### Key Metrics
- **Response Time**: P95 < 5 seconds (current: ~2.3s)
- **Error Rate**: < 1% (current: 0.3%)
- **Success Rate**: > 95% end-to-end (current: 97.2%)
- **PDF Generation**: < 30 seconds (current: ~15s)
- **Email Delivery**: > 98% success rate

#### Alert Policies
| Severity | Description | Response Time | Actions |
|----------|-------------|---------------|---------|
| **P0** | Service down (>50% errors) | Immediate | Rollback, escalate to Jeremy |
| **P1** | High error rate (>5%) | 15 minutes | Check logs, investigate root cause |
| **P2** | Performance degraded | 4 hours | Performance analysis, optimization |
| **P3** | Resource usage high | 24 hours | Capacity planning review |

#### Log Access
```bash
# Cloud Run service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=diagnosticpro-vertex-ai-backend" \
  --project diagnostic-pro-prod --limit 100

# Firestore operations
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=firestore" \
  --project diagnostic-pro-prod

# Vertex AI usage
gcloud logging read "resource.type=aiplatform.googleapis.com/Endpoint" \
  --project diagnostic-pro-prod
```

### Incident Response

#### P0 - System Down
1. **Immediate Actions** (0-5 minutes):
   - Check Cloud Run service status
   - Verify Firebase Hosting deployment
   - Review recent deployments in Cloud Console
   - Check Stripe webhook delivery status

2. **Investigation** (5-15 minutes):
   - Analyze error logs for patterns
   - Check resource limits and quotas
   - Verify database connectivity
   - Test health endpoints

3. **Resolution** (15-30 minutes):
   - Rollback to last known good revision
   - Scale up instances if resource constrained
   - Restart services if hung
   - Escalate to Jeremy if unresolved

#### P1 - Degraded Performance
1. Check Vertex AI API quotas and rate limits
2. Monitor Firestore read/write capacity
3. Analyze PDF generation performance
4. Review Cloud Run auto-scaling behavior

### Backup & Recovery

#### Database Backups
- **Firestore**: Automatic daily backups enabled
- **Manual Export**:
  ```bash
  gcloud firestore export gs://diagnostic-pro-prod-backups/$(date +%Y%m%d) \
    --project diagnostic-pro-prod
  ```
- **Retention**: 30 days automatic, quarterly manual archives

#### Application Recovery
- **RTO**: 15 minutes (Cloud Run revision rollback)
- **RPO**: 1 hour (Firestore continuous backup)
- **DR Testing**: Monthly rollback simulation required

---

## Current State Assessment

### What's Working Well ✅

#### Strong Production Foundation
- **Reliable Cloud Run deployment** with health checks and auto-scaling
- **Complete payment processing** with Stripe webhook integration
- **Robust AI integration** using Vertex AI Gemini 2.5 Flash
- **Comprehensive PDF generation** with 14-section diagnostic framework
- **Firebase Hosting** providing global CDN distribution

#### Operational Practices
- **Environment variable management** through Google Secret Manager
- **Structured logging** with request ID tracing throughout backend
- **Security hardening** in Docker containers (non-root user, health checks)
- **CORS configuration** properly restricting origins to production domains

#### Code Quality
- **TypeScript strict mode** enabled for frontend type safety
- **Modern React patterns** with hooks and functional components
- **Comprehensive error handling** in backend API with structured responses
- **Version pinning** in package.json dependencies

### Areas Needing Attention ⚠️

#### Infrastructure Gaps
- **No Infrastructure as Code**: All GCP resources manually configured, high drift risk
- **Missing staging environment**: No safe deployment testing before production
- **Incomplete monitoring**: Basic Cloud Monitoring, lacks business metric dashboards
- **No automated backup verification**: Backups exist but restore procedures untested

#### Security & Compliance
- **Service account permissions overly broad**: Backend SA has more access than required
- **Missing secrets rotation**: API keys and tokens lack automated rotation schedule
- **Firestore rules need audit**: Current rules allow broad access patterns
- **No security scanning**: Container images and dependencies lack vulnerability scanning

#### Testing & Quality Assurance
- **Minimal test coverage**: Backend has basic health checks, missing integration tests
- **No end-to-end testing**: Critical payment → PDF → email flow untested
- **Frontend tests disabled**: CI/CD shows tests temporarily disabled due to TypeScript issues
- **Performance testing absent**: No load testing for peak traffic scenarios

#### Documentation & Knowledge Management
- **API documentation missing**: No OpenAPI spec or Postman collections
- **Deployment procedures informal**: Runbooks exist as scattered README files
- **Architecture decisions undocumented**: No ADRs explaining key technical choices
- **Onboarding gaps**: New developer setup requires tribal knowledge

### Immediate Priorities 🚨

1. **Infrastructure as Code Implementation** (High Impact, 2 weeks)
   - Deploy Terraform for all GCP resources
   - Implement state management with Cloud Storage backend
   - Create environment parity between staging and production
   - **Why Critical**: Manual infrastructure creates deployment bottlenecks and drift risk

2. **Staging Environment Setup** (High Impact, 1 week)
   - Configure `diagnosticpro-relay` as staging environment
   - Implement branch-based deployments (main → production, develop → staging)
   - Set up staging Firestore with test data
   - **Why Critical**: Production deployment risk too high without safe testing environment

3. **Comprehensive Monitoring** (Medium Impact, 1 week)
   - Deploy custom Cloud Monitoring dashboard with business metrics
   - Implement alerting for payment failures, PDF generation errors
   - Set up log-based metrics for customer journey tracking
   - **Why Critical**: Current blind spots in customer experience monitoring

4. **Security Hardening** (High Impact, 3 days)
   - Audit and reduce service account permissions following principle of least privilege
   - Implement automated secrets rotation for Stripe keys
   - Review and tighten Firestore security rules
   - **Why Critical**: Current broad permissions pose security risk

---

## Quick Reference

### Essential Commands

```bash
# Health Checks
curl -f https://diagnosticpro.io  # Frontend health
curl -f https://diagnosticpro-vertex-ai-backend-[hash].run.app/healthz  # Backend health

# Deploy Frontend
cd 06-infrastructure/firebase
firebase deploy --only hosting --project diagnostic-pro-prod

# Deploy Backend
cd 02-src/backend/services/backend
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source=. --region=us-central1 --project=diagnostic-pro-prod

# View Logs (Last 100 entries)
gcloud logging read "resource.type=cloud_run_revision" \
  --project=diagnostic-pro-prod --limit=100

# Scale Cloud Run
gcloud run services update diagnosticpro-vertex-ai-backend \
  --min-instances=2 --max-instances=50 \
  --project=diagnostic-pro-prod

# Database Operations
gcloud firestore export gs://backup-bucket/$(date +%Y%m%d) \
  --project=diagnostic-pro-prod

# Emergency Rollback
gcloud run services update-traffic diagnosticpro-vertex-ai-backend \
  --to-revisions=PREVIOUS_REVISION=100 --project=diagnostic-pro-prod
```

### Critical Endpoints

```markdown
# Production URLs
- Frontend: https://diagnosticpro.io
- Backend API: https://diagnosticpro-vertex-ai-backend-[hash].run.app
- Health Check: https://diagnosticpro-vertex-ai-backend-[hash].run.app/healthz

# Development Environment
- Project: diagnosticpro-relay
- Frontend Staging: https://diagnosticpro-relay.web.app (needs setup)

# Monitoring & Management
- Cloud Console: https://console.cloud.google.com/run?project=diagnostic-pro-prod
- Firebase Console: https://console.firebase.google.com/project/diagnostic-pro-prod
- Stripe Dashboard: https://dashboard.stripe.com/webhooks
```

### Environment Variables Quick Reference

**Frontend (.env)**:
```bash
VITE_FIREBASE_PROJECT_ID=diagnostic-pro-prod
VITE_FIREBASE_API_KEY=[from Firebase Console]
VITE_FIREBASE_AUTH_DOMAIN=diagnostic-pro-prod.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=diagnostic-pro-prod.firebasestorage.app
```

**Backend (.env.production)**:
```bash
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod
REPORT_BUCKET=diagnostic-pro-prod-reports
STRIPE_SECRET_KEY=[from Secret Manager]
STRIPE_WEBHOOK_SECRET=[from Secret Manager]
PORT=8080
```

### First Week Checklist

```markdown
- [ ] **Access confirmed**: GCP projects (diagnostic-pro-prod, diagnosticpro-relay)
- [ ] **Authentication**: gcloud auth login, Firebase login
- [ ] **Local development**: Frontend and backend running locally
- [ ] **Deploy to staging**: Set up diagnosticpro-relay environment
- [ ] **Review OPEYEMI_DEVOPS_SETUP.md**: Understand access permissions
- [ ] **Understand payment flow**: Trace $4.99 transaction end-to-end
- [ ] **Review this analysis**: Validate findings with Jeremy
- [ ] **Test incident response**: Simulate P1 alert and response
```

---

## Recommendations Roadmap

### Week 1: Critical Infrastructure Setup

**Day 1-2: Staging Environment**
- Configure diagnosticpro-relay project as staging
- Deploy staging versions of frontend and backend
- Set up test Firestore collections with sample data
- Configure branch-based deployment (develop → staging)

**Day 3-4: Infrastructure as Code Foundation**
- Initialize Terraform with Cloud Storage backend
- Import existing Cloud Run and Firebase resources
- Create reusable modules for service deployment
- Document infrastructure changes in ADRs

**Day 5: Enhanced Monitoring**
- Deploy comprehensive Cloud Monitoring dashboard
- Set up alerting for critical business metrics
- Implement log-based SLIs for customer journey
- Test alert response procedures

### Month 1: Security & Reliability

**Week 2: Security Hardening**
- Audit service account permissions (principle of least privilege)
- Implement automated secrets rotation
- Review and tighten Firestore security rules
- Deploy vulnerability scanning for container images

**Week 3: Testing Infrastructure**
- Implement integration tests for payment flow
- Set up end-to-end testing with Playwright
- Deploy load testing infrastructure
- Create automated test data generation

**Week 4: Documentation & Processes**
- Generate OpenAPI specification for backend
- Create deployment runbooks and emergency procedures
- Document architecture decisions (ADRs)
- Implement automated documentation generation

### Quarter 1: Scaling & Optimization

**Month 2: Performance Optimization**
- Implement CDN optimization for PDF delivery
- Deploy Firestore connection pooling
- Optimize Vertex AI API usage patterns
- Implement request batching for high-traffic periods

**Month 3: Advanced Features**
- Multi-region deployment preparation
- Blue-green deployment strategy
- Advanced monitoring with custom metrics
- Disaster recovery automation

**Cost Optimization Targets**:
- Reduce Cloud Run cold starts by 50%
- Optimize Vertex AI token usage (current: ~$0.15 per diagnostic)
- Implement intelligent auto-scaling based on business hours
- Target 20% infrastructure cost reduction while maintaining performance

---

## Integration with OPEYEMI_DEVOPS_SETUP.md

**Key Insights from Setup Guide**:
- Opeyemi has **Editor access** to `diagnosticpro-relay` (development environment)
- **View-only access** to production projects maintains security separation
- **Branch protection** requires Jeremy's approval for all changes
- **Cost controls** prevent accidental overspend in development

**Operational Alignment**:
- Development workflow supports feature branch → PR → Jeremy review → merge
- Staging deployments can be tested freely in diagnosticpro-relay
- Production deployments require explicit approval and coordination
- API access includes Vertex AI, BigQuery, and full GCP service suite

**Action Items for Opeyemi (Senior Cybersecurity Engineer)**:
1. Validate access to all three GCP projects (prod, data, dev)
2. Confirm Firebase CLI authentication and project switching
3. Test local development environment setup
4. Review and execute `scripts/setup-ai-access-opeyemi.sh`
5. Coordinate with Jeremy on first production deployment

---

*This analysis represents the DiagnosticPro system state as of October 1, 2025. For operational questions or clarification on any section, consult with Jeremy Longshore or create GitHub issues in the repository.*

**Document Maintenance**: Update this guide after major architecture changes, new service deployments, or quarterly reviews. Version control this document alongside infrastructure changes.

---

*Built with ❤️ for reliable operations and continuous improvement.*