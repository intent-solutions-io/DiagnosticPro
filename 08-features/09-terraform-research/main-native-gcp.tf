# DiagnosticPro Native GCP Infrastructure (No Firebase)
# Fully Terraform-managed architecture for rich media features

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sql.googleapis.com",
    "storage.googleapis.com",
    "cloudfunctions.googleapis.com",
    "aiplatform.googleapis.com",
    "vision.googleapis.com",
    "speech.googleapis.com",
    "videointelligence.googleapis.com",
    "pubsub.googleapis.com",
    "secretmanager.googleapis.com",
    "bigquery.googleapis.com",
    "monitoring.googleapis.com"
  ])

  project = var.project_id
  service = each.key

  disable_dependent_services = false
  disable_on_destroy         = false
}

# IAM Service Account for applications
module "app_service_account" {
  source = "./modules/iam"

  project_id   = var.project_id
  service_name = "diagnosticpro-app"
  environment  = var.environment
}

# PostgreSQL Database (replaces Firestore)
module "database" {
  source = "./modules/database"

  project_id      = var.project_id
  instance_name   = "diagnosticpro-db"
  database_name   = "diagnosticpro"
  database_version = "POSTGRES_15"
  region          = var.region
  tier            = "db-f1-micro"  # Start small, can scale

  depends_on = [google_project_service.apis]
}

# Media Storage (replaces Firebase Storage)
module "media_storage" {
  source = "./modules/storage"

  project_id = var.project_id

  buckets = {
    media_uploads = {
      name          = "${var.project_id}-media-uploads"
      location      = "US"
      force_destroy = false
      lifecycle_rules = [
        {
          condition = { age = 365 }
          action    = { type = "Delete" }
        }
      ]
    }
    processed_media = {
      name          = "${var.project_id}-processed-media"
      location      = "US"
      force_destroy = false
      cors = [
        {
          origin          = ["https://diagnosticpro.io"]
          method          = ["GET", "POST", "PUT"]
          response_header = ["*"]
          max_age_seconds = 3600
        }
      ]
    }
    static_assets = {
      name          = "${var.project_id}-static-assets"
      location      = "US"
      force_destroy = false
    }
  }

  depends_on = [google_project_service.apis]
}

# Backend API (Cloud Run)
module "backend_api" {
  source = "./modules/cloud-run"

  project_id     = var.project_id
  service_name   = "diagnosticpro-backend"
  location       = var.region
  image          = "gcr.io/${var.project_id}/diagnosticpro-backend:latest"
  service_account_email = module.app_service_account.email

  environment_variables = {
    DATABASE_URL     = module.database.connection_string
    BUCKET_UPLOADS   = module.media_storage.bucket_names["media_uploads"]
    BUCKET_PROCESSED = module.media_storage.bucket_names["processed_media"]
    VERTEX_AI_PROJECT = var.project_id
    VERTEX_AI_REGION  = var.region
  }

  depends_on = [
    google_project_service.apis,
    module.app_service_account,
    module.database,
    module.media_storage
  ]
}

# Frontend (Cloud Run containerized React)
module "frontend_app" {
  source = "./modules/cloud-run"

  project_id     = var.project_id
  service_name   = "diagnosticpro-frontend"
  location       = var.region
  image          = "gcr.io/${var.project_id}/diagnosticpro-frontend:latest"
  service_account_email = module.app_service_account.email

  environment_variables = {
    REACT_APP_API_URL = module.backend_api.url
    REACT_APP_ENVIRONMENT = var.environment
  }

  depends_on = [
    google_project_service.apis,
    module.backend_api
  ]
}

# Media Processing Pipeline
module "media_processing" {
  source = "./modules/media-processing"

  project_id              = var.project_id
  region                  = var.region
  uploads_bucket_name     = module.media_storage.bucket_names["media_uploads"]
  processed_bucket_name   = module.media_storage.bucket_names["processed_media"]
  database_connection     = module.database.connection_string
  service_account_email   = module.app_service_account.email

  depends_on = [
    google_project_service.apis,
    module.media_storage,
    module.database
  ]
}

# BigQuery Analytics (integrates with other diagnostic platform project)
module "analytics" {
  source = "./modules/analytics"

  project_id = var.project_id
  dataset_id = "diagnostics_analytics"

  depends_on = [google_project_service.apis]
}

# Cloud DNS for custom domain
module "dns" {
  source = "./modules/dns"

  project_id   = var.project_id
  domain_name  = var.domain
  frontend_url = module.frontend_app.url
  backend_url  = module.backend_api.url

  depends_on = [
    module.frontend_app,
    module.backend_api
  ]
}

# Load Balancer (for custom domain + HTTPS)
module "load_balancer" {
  source = "./modules/load-balancer"

  project_id         = var.project_id
  domain_name        = var.domain
  frontend_service   = module.frontend_app.service_name
  backend_service    = module.backend_api.service_name
  region            = var.region

  depends_on = [
    module.frontend_app,
    module.backend_api
  ]
}