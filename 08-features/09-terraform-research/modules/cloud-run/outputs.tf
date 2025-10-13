output "url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_service.main.status[0].url
}

output "service_name" {
  description = "Cloud Run service name"
  value       = google_cloud_run_service.main.name
}

output "location" {
  description = "Cloud Run service location"
  value       = google_cloud_run_service.main.location
}