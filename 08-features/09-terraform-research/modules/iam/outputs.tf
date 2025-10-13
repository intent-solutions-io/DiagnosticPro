output "service_account_id" {
  description = "Service account ID"
  value       = google_service_account.backend_sa.account_id
}

output "email" {
  description = "Service account email"
  value       = google_service_account.backend_sa.email
}

output "unique_id" {
  description = "Service account unique ID"
  value       = google_service_account.backend_sa.unique_id
}