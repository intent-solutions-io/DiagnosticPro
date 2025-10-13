# DiagnosticPro Terraform Migration Plan

**Date:** October 2, 2025
**Platform:** DiagnosticPro AI Equipment Diagnostics
**Migration Type:** Zero-Downtime Production Import
**Project:** diagnostic-pro-prod (298932670545)

---

## Migration Strategy Overview

### Approach: **Import-First, Zero-Recreation**
- Import all existing production resources
- Preserve current configurations exactly
- No resource recreation during migration
- Maintain 100% uptime for $4.99 payment processing

### Timeline: **3-Phase Approach (6-8 weeks)**
```
Phase 1: Foundation & Setup     [Week 1-2]
Phase 2: Resource Import        [Week 3-4]
Phase 3: Optimization & Docs    [Week 5-8]
```

---

## Phase 1: Foundation & Setup (Week 1-2)

### Week 1: Terraform Environment Setup

#### Day 1-2: Initial Setup
```bash
# Create Terraform state bucket
gsutil mb gs://diagnostic-pro-prod-terraform-state
gsutil versioning set on gs://diagnostic-pro-prod-terraform-state

# Set up local development environment
terraform --version  # Ensure >= 1.5.0
gcloud auth application-default login
```

#### Day 3-4: Directory Structure Creation
```
08-features/09-terraform-research/
├── backend.tf
├── providers.tf
├── versions.tf
├── variables.tf
├── main.tf
├── outputs.tf
├── modules/
│   ├── cloud-run/
│   ├── firestore/
│   ├── iam/
│   ├── api-gateway/
│   └── storage/
└── environments/
    └── prod/
```

#### Day 5-7: Basic Configuration Files

**✅ Deliverable: Working terraform init**

### Week 2: Module Development

#### Day 8-10: Core Modules
- IAM service account module
- Cloud Run service module
- Firestore database module

#### Day 11-14: Advanced Modules
- API Gateway module
- Cloud Storage module
- Vertex AI configuration module

**✅ Deliverable: All modules ready for import**

---

## Phase 2: Resource Import (Week 3-4)

### Week 3: Critical Infrastructure Import

#### Day 15-16: IAM Foundation
```bash
# Import service account
terraform import google_service_account.backend_sa \
  projects/diagnostic-pro-prod/serviceAccounts/diagnosticpro-vertex-ai-backend-sa@diagnostic-pro-prod.iam.gserviceaccount.com

# Import IAM bindings
terraform import google_project_iam_member.firestore_user \
  "diagnostic-pro-prod roles/datastore.user serviceAccount:diagnosticpro-vertex-ai-backend-sa@diagnostic-pro-prod.iam.gserviceaccount.com"
```

#### Day 17-18: Data Layer Import
```bash
# Import Firestore database
terraform import google_firestore_database.main \
  projects/diagnostic-pro-prod/databases/(default)

# Import Cloud Storage bucket
terraform import google_storage_bucket.reports \
  diagnostic-pro-prod.firebasestorage.app
```

#### Day 19-21: Application Layer Import
```bash
# Import Cloud Run service
terraform import google_cloud_run_service.backend \
  projects/diagnostic-pro-prod/locations/us-central1/services/diagnosticpro-vertex-ai-backend

# Import API Gateway
terraform import google_api_gateway_gateway.main \
  projects/diagnostic-pro-prod/locations/global/gateways/diagpro-gw-3tbssksx
```

**✅ Checkpoint: All resources imported, zero drift**

### Week 4: Validation & Testing

#### Day 22-24: Drift Detection
```bash
# Verify no unintended changes
terraform plan
# Expected output: "No changes. Infrastructure is up-to-date."

# Test small non-disruptive change
# Example: Add a label to Cloud Run service
terraform apply
```

#### Day 25-28: Integration Testing
- Verify $4.99 payment processing continues
- Test PDF report generation
- Validate Vertex AI diagnostic analysis
- Check Firestore data integrity

**✅ Checkpoint: Production system stable under Terraform**

---

## Phase 3: Optimization & Documentation (Week 5-8)

### Week 5-6: Enhanced Configuration

#### Monitoring & Alerting Setup
```hcl
# Add Cloud Monitoring
resource "google_monitoring_alert_policy" "cloud_run_errors" {
  display_name = "Cloud Run Error Rate"
  conditions {
    display_name = "Error rate too high"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\""
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.1
    }
  }
}

# Add uptime checks
resource "google_monitoring_uptime_check_config" "api_health" {
  display_name = "DiagnosticPro API Health"
  timeout      = "10s"
  period       = "300s"

  http_check {
    use_ssl = true
    path    = "/healthz"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = "simple-diagnosticpro-298932670545.us-central1.run.app"
    }
  }
}
```

#### Security Hardening
```hcl
# Add VPC Connector for enhanced security
resource "google_vpc_access_connector" "main" {
  name          = "diagnosticpro-connector"
  region        = "us-central1"
  ip_cidr_range = "10.8.0.0/28"
  network       = "default"
}

# Enhanced IAM with conditions
resource "google_project_iam_binding" "cloud_run_secure" {
  project = var.project_id
  role    = "roles/run.invoker"

  members = [
    "serviceAccount:${google_service_account.backend_sa.email}",
  ]

  condition {
    title       = "Time-based access"
    description = "Allow access during business hours"
    expression  = "request.time.getHours() >= 6 && request.time.getHours() < 22"
  }
}
```

### Week 7-8: Documentation & Training

#### Documentation Creation
- [ ] `README.md` with setup instructions
- [ ] `DEPLOYMENT.md` with deployment procedures
- [ ] `TROUBLESHOOTING.md` with common issues
- [ ] `ROLLBACK.md` with emergency procedures

#### Team Training
- [ ] Terraform basics workshop
- [ ] DiagnosticPro-specific procedures
- [ ] Emergency response training
- [ ] CI/CD integration planning

**✅ Final Deliverable: Production-ready Terraform infrastructure**

---

## Resource Import Order (Critical Path)

### 1. Foundation Layer (Day 15-16)
```bash
# Order matters - dependencies first
terraform import google_service_account.backend_sa [SA_EMAIL]
terraform import google_project_iam_member.firestore_user [MEMBER_ID]
terraform import google_project_iam_member.storage_admin [MEMBER_ID]
terraform import google_project_iam_member.vertex_ai_user [MEMBER_ID]
```

### 2. Data Layer (Day 17-18)
```bash
# Import data stores before applications
terraform import google_firestore_database.main [DATABASE_ID]
terraform import google_storage_bucket.reports [BUCKET_NAME]
terraform import google_storage_bucket_iam_member.reports_access [MEMBER_ID]
```

### 3. Application Layer (Day 19-21)
```bash
# Import compute and networking
terraform import google_cloud_run_service.backend [SERVICE_ID]
terraform import google_api_gateway_api.main [API_ID]
terraform import google_api_gateway_api_config.main [CONFIG_ID]
terraform import google_api_gateway_gateway.main [GATEWAY_ID]
```

### 4. Configuration Layer (Day 22-24)
```bash
# Import settings and policies
terraform import google_project_service.apis [API_NAME]
terraform import google_vertex_ai_endpoint.diagnostic [ENDPOINT_ID]
```

---

## Testing Checkpoints

### Checkpoint 1: After IAM Import
**Validation:**
```bash
# Test service account authentication
gcloud auth activate-service-account --key-file=sa-key.json
gcloud projects describe diagnostic-pro-prod
```
**Success Criteria:** Service account can access required APIs

### Checkpoint 2: After Data Layer Import
**Validation:**
```bash
# Test Firestore access
gcloud firestore collections list --project=diagnostic-pro-prod
# Test Storage access
gsutil ls gs://diagnostic-pro-prod.firebasestorage.app/
```
**Success Criteria:** All data accessible, no permission errors

### Checkpoint 3: After Application Import
**Validation:**
```bash
# Test Cloud Run health
curl https://simple-diagnosticpro-298932670545.us-central1.run.app/healthz
# Test API Gateway
curl https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/healthz
```
**Success Criteria:** All endpoints responding correctly

### Checkpoint 4: End-to-End Testing
**Validation:**
- Submit test diagnostic form
- Verify Stripe payment processing ($4.99)
- Confirm PDF report generation
- Check email delivery (if applicable)
- Validate Vertex AI analysis quality

**Success Criteria:** Complete customer workflow functional

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)
```bash
# If terraform apply fails
terraform rollback  # If supported
# OR
git checkout HEAD~1  # Revert to previous config
terraform apply     # Apply previous state
```

### Emergency Rollback (< 15 minutes)
```bash
# If infrastructure is broken
# 1. Identify failed resource
terraform show | grep "status = "

# 2. Remove from state (don't destroy)
terraform state rm google_cloud_run_service.backend

# 3. Revert to manual management temporarily
# 4. Fix issue in Terraform config
# 5. Re-import when ready
```

### Full Rollback (< 30 minutes)
```bash
# Complete rollback to pre-Terraform state
# 1. Export current state
terraform show > pre-rollback-state.txt

# 2. Remove all resources from Terraform state
terraform state list | xargs -I {} terraform state rm {}

# 3. Verify resources still exist in GCP Console
# 4. Resume manual management
# 5. Plan re-migration when ready
```

**☢️ CRITICAL:** Never run `terraform destroy` on production

---

## Risk Mitigation Strategies

### Revenue Protection
- **Payment Processing:** Test Stripe webhooks after each import
- **API Availability:** Monitor response times during migration
- **Data Integrity:** Backup Firestore before any changes
- **Customer Impact:** Schedule imports during low-traffic hours

### Technical Risk Mitigation
- **State Backup:** Automatic GCS versioning enabled
- **Configuration Backup:** Git version control for all configs
- **Resource Backup:** Manual exports before import
- **Team Communication:** Slack notifications for all changes

### Communication Plan
```
T-1 Week:    Announce migration to stakeholders
T-1 Day:     Final migration plan review
T-0:         Begin Phase 2 (resource import)
T+1 Hour:    Checkpoint 1 validation
T+4 Hours:   Checkpoint 2 validation
T+1 Day:     Complete Phase 2 validation
T+1 Week:    Migration success review
```

---

## Success Metrics

### Technical Metrics
- **Zero Drift:** `terraform plan` shows no changes
- **Import Success:** 100% of resources imported successfully
- **Performance:** No degradation in API response times
- **Reliability:** No increase in error rates

### Business Metrics
- **Revenue:** No loss in diagnostic sales during migration
- **Uptime:** 99.9%+ availability maintained
- **Customer Experience:** No customer-reported issues
- **Team Efficiency:** Faster deployments post-migration

---

## Post-Migration Enhancements

### Phase 4: Multi-Environment Setup (Month 2)
```hcl
# Add development environment
module "dev_environment" {
  source = "./modules/environment"

  project_id   = "diagnostic-pro-dev"
  environment  = "dev"
  domain       = "dev.diagnosticpro.io"
}

# Add staging environment
module "staging_environment" {
  source = "./modules/environment"

  project_id   = "diagnostic-pro-staging"
  environment  = "staging"
  domain       = "staging.diagnosticpro.io"
}
```

### Phase 5: CI/CD Integration (Month 3)
```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      - run: terraform init
      - run: terraform plan
      - run: terraform apply -auto-approve
        if: github.ref == 'refs/heads/main'
```

---

## Emergency Contacts

### Escalation Matrix
```
Level 1: DevOps Engineer (Primary)
Level 2: Platform Owner (Jeremy)
Level 3: GCP Support (if needed)

Emergency: Revenue impact detected
Response: < 15 minutes
Escalation: Immediate to Level 2
```

### Key Resources
- **GCP Console:** https://console.cloud.google.com/
- **Firebase Console:** https://console.firebase.google.com/
- **Terraform State:** gs://diagnostic-pro-prod-terraform-state
- **Documentation:** /08-features/09-terraform-research/

---

**Migration Plan Status:** ✅ READY FOR EXECUTION
**Next Step:** Begin Phase 1 - Foundation & Setup
**Estimated Start Date:** Upon approval
**Estimated Completion:** 6-8 weeks from start

---

*This migration plan prioritizes zero-downtime and revenue protection while establishing a foundation for scalable infrastructure management.*