# IAM Service Account Module
resource "google_service_account" "backend_sa" {
  account_id   = "${var.service_name}-vertex-ai-backend-sa"
  display_name = "DiagnosticPro Backend Service Account"
  description  = "Service account for DiagnosticPro Cloud Run backend with Vertex AI access"
  project      = var.project_id
}

# IAM roles for the service account
resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "cloud_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}