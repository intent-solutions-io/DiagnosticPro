variable "project_id" {
  description = "GCP Project ID for DiagnosticPro"
  type        = string
  default     = "diagnostic-pro-prod"
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Default GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "service_name" {
  description = "Base service name"
  type        = string
  default     = "diagnosticpro"
}

variable "domain" {
  description = "Primary domain for the service"
  type        = string
  default     = "diagnosticpro.io"
}