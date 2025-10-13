# DiagnosticPro Production Infrastructure
# This configuration manages the live production system serving $4.99 diagnostics

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "apigateway.googleapis.com",
    "servicecontrol.googleapis.com",
    "servicemanagement.googleapis.com",
    "aiplatform.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "cloudbuild.googleapis.com",
    "monitoring.googleapis.com"
  ])

  project = var.project_id
  service = each.key

  disable_dependent_services = false
  disable_on_destroy         = false
}

# IAM Service Account for Cloud Run backend
module "backend_service_account" {
  source = "./modules/iam"

  project_id   = var.project_id
  service_name = var.service_name
  environment  = var.environment
}

# Firestore Database
module "firestore" {
  source = "./modules/firestore"

  project_id  = var.project_id
  location_id = var.region
  environment = var.environment

  depends_on = [google_project_service.apis]
}

# Cloud Storage for PDF reports
module "storage" {
  source = "./modules/storage"

  project_id    = var.project_id
  bucket_name   = "${var.project_id}.firebasestorage.app"
  location      = "US"
  force_destroy = false

  depends_on = [google_project_service.apis]
}

# Cloud Run service for backend API
module "cloud_run" {
  source = "./modules/cloud-run"

  project_id     = var.project_id
  service_name   = "${var.service_name}-vertex-ai-backend"
  location       = var.region
  image          = "gcr.io/${var.project_id}/${var.service_name}-backend:latest"
  service_account_email = module.backend_service_account.email

  environment_variables = {
    GOOGLE_CLOUD_PROJECT     = var.project_id
    VERTEX_AI_PROJECT        = var.project_id
    VERTEX_AI_REGION        = var.region
    FIRESTORE_PROJECT_ID    = var.project_id
  }

  depends_on = [
    google_project_service.apis,
    module.backend_service_account,
    module.firestore
  ]
}

# API Gateway for public webhook endpoint
module "api_gateway" {
  source = "./modules/api-gateway"

  project_id   = var.project_id
  gateway_id   = "diagpro-gw-3tbssksx"
  api_id       = "diagnosticpro-api"
  cloud_run_url = module.cloud_run.url

  depends_on = [
    google_project_service.apis,
    module.cloud_run
  ]
}