output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.main.name
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.app_db.name
}

output "connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${google_sql_user.app_user.name}:${random_password.app_user_password.result}@${google_sql_database_instance.main.connection_name}/${google_sql_database.app_db.name}"
  sensitive   = true
}

output "public_ip_address" {
  description = "Public IP address of the instance"
  value       = google_sql_database_instance.main.public_ip_address
}

output "password_secret_id" {
  description = "Secret Manager secret ID for database password"
  value       = google_secret_manager_secret.db_password.secret_id
}