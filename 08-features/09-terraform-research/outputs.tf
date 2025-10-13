output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = module.cloud_run.url
  sensitive   = false
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.gateway_url
  sensitive   = false
}

output "service_account_email" {
  description = "Backend service account email"
  value       = module.backend_service_account.email
  sensitive   = false
}

output "firestore_database" {
  description = "Firestore database name"
  value       = module.firestore.database_id
  sensitive   = false
}

output "storage_bucket" {
  description = "Cloud Storage bucket for PDF reports"
  value       = module.storage.bucket_name
  sensitive   = false
}