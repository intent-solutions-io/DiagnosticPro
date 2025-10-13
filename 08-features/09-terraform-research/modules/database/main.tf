# Cloud SQL PostgreSQL Module (replaces Firestore)

resource "google_sql_database_instance" "main" {
  name             = var.instance_name
  database_version = var.database_version
  region           = var.region
  project          = var.project_id

  settings {
    tier              = var.tier
    availability_type = "ZONAL"  # Can upgrade to REGIONAL later
    disk_size         = 20      # GB - start small
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled    = true
      start_time = "03:00"  # 3 AM backup
      binary_log_enabled = true
    }

    ip_configuration {
      ipv4_enabled = true

      # Allow Cloud Run access
      authorized_networks {
        value = "0.0.0.0/0"  # TODO: Restrict to Cloud Run IPs
        name  = "cloud-run-access"
      }
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = true  # Protect production data
}

# Application database
resource "google_sql_database" "app_db" {
  name     = var.database_name
  instance = google_sql_database_instance.main.name
  project  = var.project_id
}

# Application user
resource "google_sql_user" "app_user" {
  name     = "${var.database_name}_user"
  instance = google_sql_database_instance.main.name
  password = random_password.app_user_password.result
  project  = var.project_id
}

# Secure password generation
resource "random_password" "app_user_password" {
  length  = 32
  special = true
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.instance_name}-password"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.app_user_password.result
}