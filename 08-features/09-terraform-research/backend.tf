terraform {
  backend "gcs" {
    bucket = "diagnostic-pro-prod-terraform-state"
    prefix = "terraform/state"
  }
}