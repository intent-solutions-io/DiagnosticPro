# Terraform Learning Guide

**Purpose:** Comprehensive learning resource for Terraform infrastructure management
**Audience:** DevOps engineers and infrastructure practitioners
**Level:** Beginner to Advanced

---

## Table of Contents

1. [What is Terraform?](#what-is-terraform)
2. [Core Concepts](#core-concepts)
3. [Terraform Language (HCL)](#terraform-language-hcl)
4. [State Management](#state-management)
5. [Modules and Organization](#modules-and-organization)
6. [Best Practices](#best-practices)
7. [Advanced Topics](#advanced-topics)
8. [Real-World Examples](#real-world-examples)
9. [Common Pitfalls](#common-pitfalls)
10. [Learning Resources](#learning-resources)

---

## What is Terraform?

### Definition
Terraform is an **Infrastructure as Code (IaC)** tool that allows you to define and provision data center infrastructure using a high-level configuration language.

### Key Benefits
- **Declarative Configuration:** Describe what you want, not how to get there
- **Plan Before Apply:** See changes before they happen
- **Version Control:** Infrastructure changes tracked in Git
- **Multi-Cloud:** Works with AWS, GCP, Azure, and 100+ providers
- **Idempotent:** Safe to run multiple times

### How It Works
```
1. Write Configuration (.tf files)
   ↓
2. terraform init (Download providers)
   ↓
3. terraform plan (Preview changes)
   ↓
4. terraform apply (Execute changes)
   ↓
5. Infrastructure Created/Updated
```

---

## Core Concepts

### 1. Providers
Providers are plugins that interact with APIs of cloud platforms.

```hcl
# Configure the Google Cloud Provider
provider "google" {
  project = "my-project-id"
  region  = "us-central1"
}
```

### 2. Resources
Resources are the most important element. They describe infrastructure objects.

```hcl
# Create a Cloud Storage bucket
resource "google_storage_bucket" "example" {
  name     = "my-unique-bucket-name"
  location = "US"
}
```

### 3. Data Sources
Data sources allow you to fetch information from existing infrastructure.

```hcl
# Get information about existing project
data "google_project" "current" {}

# Use it in a resource
resource "google_storage_bucket" "example" {
  name     = "${data.google_project.current.project_id}-bucket"
  location = "US"
}
```

### 4. Variables
Variables make configurations reusable and flexible.

```hcl
# Define variable
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

# Use variable
resource "google_storage_bucket" "example" {
  name     = "${var.project_id}-bucket"
  location = "US"
}
```

### 5. Outputs
Outputs expose information about your infrastructure.

```hcl
# Output bucket URL
output "bucket_url" {
  value = google_storage_bucket.example.url
}
```

---

## Terraform Language (HCL)

### Basic Syntax

#### Resource Block
```hcl
resource "resource_type" "resource_name" {
  argument1 = "value1"
  argument2 = "value2"

  nested_block {
    nested_argument = "nested_value"
  }
}
```

#### Variable Types
```hcl
# String
variable "project_id" {
  type = string
}

# Number
variable "instance_count" {
  type = number
  default = 3
}

# Boolean
variable "enable_backup" {
  type = bool
  default = true
}

# List
variable "availability_zones" {
  type = list(string)
  default = ["us-central1-a", "us-central1-b"]
}

# Map
variable "labels" {
  type = map(string)
  default = {
    environment = "prod"
    team        = "platform"
  }
}

# Object
variable "database_config" {
  type = object({
    tier    = string
    size_gb = number
    backup  = bool
  })
  default = {
    tier    = "db-f1-micro"
    size_gb = 20
    backup  = true
  }
}
```

#### Functions
```hcl
# String functions
locals {
  bucket_name = lower("${var.project_id}-BUCKET")
  # Result: "my-project-bucket"
}

# Collection functions
locals {
  first_zone = element(var.availability_zones, 0)
  zone_count = length(var.availability_zones)
}

# Conditional expressions
locals {
  instance_type = var.environment == "prod" ? "n1-standard-4" : "n1-standard-1"
}
```

### Advanced HCL Features

#### For Expressions
```hcl
# Create multiple buckets
locals {
  environments = ["dev", "staging", "prod"]

  bucket_names = [
    for env in local.environments : "${var.project_id}-${env}-bucket"
  ]
}

# Create map from list
locals {
  bucket_map = {
    for env in local.environments : env => "${var.project_id}-${env}-bucket"
  }
}
```

#### Dynamic Blocks
```hcl
resource "google_compute_firewall" "web" {
  name    = "web-firewall"
  network = "default"

  dynamic "allow" {
    for_each = var.firewall_rules
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }
}
```

---

## State Management

### What is Terraform State?
Terraform state is a JSON file that maps your configuration to real-world resources.

### Local State (Development Only)
```bash
# State stored locally in terraform.tfstate
terraform init
terraform apply
```

### Remote State (Production)
```hcl
# backend.tf
terraform {
  backend "gcs" {
    bucket = "my-terraform-state-bucket"
    prefix = "terraform/state"
  }
}
```

### State Commands
```bash
# View state
terraform show

# List resources in state
terraform state list

# Show specific resource
terraform state show google_storage_bucket.example

# Import existing resource
terraform import google_storage_bucket.example my-existing-bucket

# Remove resource from state (doesn't destroy)
terraform state rm google_storage_bucket.example
```

### State Locking
State locking prevents multiple users from modifying state simultaneously.

```hcl
# GCS backend automatically provides locking
terraform {
  backend "gcs" {
    bucket = "my-terraform-state-bucket"
    prefix = "terraform/state"
  }
}
```

---

## Modules and Organization

### What are Modules?
Modules are reusable packages of Terraform configuration.

### Module Structure
```
modules/
├── vpc/
│   ├── main.tf      # Resources
│   ├── variables.tf # Input variables
│   ├── outputs.tf   # Output values
│   └── README.md    # Documentation
└── database/
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

### Creating a Module
```hcl
# modules/storage/main.tf
resource "google_storage_bucket" "main" {
  name     = var.bucket_name
  location = var.location

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_rules
    content {
      condition {
        age = lifecycle_rule.value.age
      }
      action {
        type = lifecycle_rule.value.action
      }
    }
  }
}

# modules/storage/variables.tf
variable "bucket_name" {
  description = "Name of the storage bucket"
  type        = string
}

variable "location" {
  description = "Bucket location"
  type        = string
  default     = "US"
}

variable "lifecycle_rules" {
  description = "Lifecycle rules for the bucket"
  type = list(object({
    age    = number
    action = string
  }))
  default = []
}

# modules/storage/outputs.tf
output "bucket_name" {
  value = google_storage_bucket.main.name
}

output "bucket_url" {
  value = google_storage_bucket.main.url
}
```

### Using a Module
```hcl
# main.tf
module "app_storage" {
  source = "./modules/storage"

  bucket_name = "${var.project_id}-app-storage"
  location    = "US"

  lifecycle_rules = [
    {
      age    = 30
      action = "Delete"
    }
  ]
}

# Reference module outputs
output "storage_bucket_url" {
  value = module.app_storage.bucket_url
}
```

### Module Sources
```hcl
# Local module
module "vpc" {
  source = "./modules/vpc"
}

# Git repository
module "vpc" {
  source = "git::https://github.com/company/terraform-modules.git//vpc?ref=v1.0.0"
}

# Terraform Registry
module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 4.0"
}
```

---

## Best Practices

### 1. Project Structure
```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
├── modules/
│   ├── compute/
│   ├── networking/
│   └── storage/
└── shared/
    ├── providers.tf
    └── versions.tf
```

### 2. Naming Conventions
```hcl
# Resource naming: project-environment-service-resource
resource "google_storage_bucket" "app_storage" {
  name = "${var.project_id}-${var.environment}-app-storage"
}

# Variable naming: descriptive and clear
variable "database_instance_tier" {
  description = "Machine tier for Cloud SQL instance"
  type        = string
  default     = "db-f1-micro"
}
```

### 3. Version Constraints
```hcl
# versions.tf
terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}
```

### 4. Variable Validation
```hcl
variable "environment" {
  description = "Environment name"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

### 5. Resource Tagging/Labeling
```hcl
# Consistent labeling
locals {
  common_labels = {
    environment = var.environment
    project     = var.project_name
    managed_by  = "terraform"
    team        = var.team_name
  }
}

resource "google_storage_bucket" "example" {
  name   = var.bucket_name
  labels = local.common_labels
}
```

### 6. Secrets Management
```hcl
# Don't store secrets in .tf files
# Use environment variables or secret management
variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Or use random provider
resource "random_password" "db_password" {
  length  = 16
  special = true
}
```

---

## Advanced Topics

### 1. Terraform Workspaces
```bash
# Create workspace
terraform workspace new staging

# List workspaces
terraform workspace list

# Switch workspace
terraform workspace select prod

# Use workspace in configuration
locals {
  environment = terraform.workspace
}
```

### 2. Data Sources and Dependencies
```hcl
# Implicit dependency (recommended)
resource "google_storage_bucket" "app_bucket" {
  name = var.bucket_name
}

resource "google_storage_bucket_object" "app_file" {
  bucket = google_storage_bucket.app_bucket.name  # Implicit dependency
  name   = "app.zip"
  source = "app.zip"
}

# Explicit dependency (when implicit isn't enough)
resource "google_compute_instance" "app_server" {
  name = "app-server"

  depends_on = [
    google_storage_bucket.app_bucket
  ]
}
```

### 3. Provisioners (Use Sparingly)
```hcl
resource "google_compute_instance" "web" {
  name = "web-server"

  # Local provisioner
  provisioner "local-exec" {
    command = "echo 'Instance created: ${self.name}'"
  }

  # Remote provisioner
  provisioner "remote-exec" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y nginx"
    ]

    connection {
      type = "ssh"
      user = "ubuntu"
      host = self.network_interface[0].access_config[0].nat_ip
    }
  }
}
```

### 4. Import Existing Infrastructure
```bash
# Import existing bucket
terraform import google_storage_bucket.existing_bucket my-existing-bucket-name

# Then write configuration to match
resource "google_storage_bucket" "existing_bucket" {
  name     = "my-existing-bucket-name"
  location = "US"
}
```

---

## Real-World Examples

### Example 1: Three-Tier Web Application
```hcl
# Network layer
module "vpc" {
  source = "./modules/vpc"

  project_id = var.project_id
  region     = var.region
}

# Database layer
module "database" {
  source = "./modules/database"

  project_id = var.project_id
  network    = module.vpc.network_self_link

  depends_on = [module.vpc]
}

# Application layer
module "app_servers" {
  source = "./modules/compute"

  project_id     = var.project_id
  subnet         = module.vpc.subnet_self_link
  database_host  = module.database.private_ip

  depends_on = [module.database]
}

# Load balancer
module "load_balancer" {
  source = "./modules/load_balancer"

  project_id      = var.project_id
  backend_service = module.app_servers.instance_group

  depends_on = [module.app_servers]
}
```

### Example 2: Multi-Environment Setup
```hcl
# environments/prod/main.tf
module "infrastructure" {
  source = "../../modules/infrastructure"

  project_id   = "my-prod-project"
  environment  = "prod"
  machine_type = "n1-standard-4"
  min_replicas = 3
  max_replicas = 10
}

# environments/dev/main.tf
module "infrastructure" {
  source = "../../modules/infrastructure"

  project_id   = "my-dev-project"
  environment  = "dev"
  machine_type = "n1-standard-1"
  min_replicas = 1
  max_replicas = 3
}
```

---

## Common Pitfalls

### 1. State File Issues
```bash
# Problem: State file conflicts
# Solution: Always use remote state for teams

# Problem: Lost state file
# Solution: Regular backups and version control for state bucket
```

### 2. Provider Version Conflicts
```hcl
# Problem: No version constraints
provider "google" {}

# Solution: Pin versions
provider "google" {
  version = "~> 4.0"
}
```

### 3. Circular Dependencies
```hcl
# Problem: Resources depend on each other
resource "google_storage_bucket" "a" {
  name = "bucket-a"
  # depends on bucket b somehow
}

resource "google_storage_bucket" "b" {
  name = "bucket-b"
  # depends on bucket a somehow
}

# Solution: Break the cycle or use data sources
```

### 4. Large State Files
```hcl
# Problem: Everything in one state file
# Solution: Split into multiple state files/workspaces

# networking.tf (separate state)
module "vpc" {
  source = "./modules/vpc"
}

# applications.tf (separate state)
data "terraform_remote_state" "vpc" {
  backend = "gcs"
  config = {
    bucket = "terraform-state"
    prefix = "vpc"
  }
}

module "app" {
  source     = "./modules/app"
  vpc_id     = data.terraform_remote_state.vpc.outputs.vpc_id
  subnet_ids = data.terraform_remote_state.vpc.outputs.subnet_ids
}
```

---

## Learning Resources

### Official Documentation
- [Terraform Documentation](https://www.terraform.io/docs)
- [Terraform Registry](https://registry.terraform.io/)
- [Learn Terraform](https://learn.hashicorp.com/terraform)

### Books
- "Terraform: Up and Running" by Yevgeniy Brikman
- "Terraform in Action" by Scott Winkler

### Practice
1. **Start Simple:** Create a single resource (storage bucket)
2. **Add Complexity:** Multiple resources with dependencies
3. **Modularize:** Extract common patterns into modules
4. **Scale:** Multi-environment setups
5. **Advanced:** Custom providers, complex workflows

### Community
- [Terraform GitHub](https://github.com/hashicorp/terraform)
- [r/Terraform](https://reddit.com/r/Terraform)
- [Terraform Community Forum](https://discuss.hashicorp.com/c/terraform-core/)

---

## Hands-On Exercises

### Exercise 1: Basic Infrastructure
Create a simple web server setup:
1. VPC with public subnet
2. Compute instance with web server
3. Firewall rule allowing HTTP traffic
4. Static IP address

### Exercise 2: Module Creation
Create a reusable database module:
1. Cloud SQL instance
2. Database and user creation
3. Configurable backup settings
4. Security group rules

### Exercise 3: Multi-Environment
Set up dev/staging/prod environments:
1. Shared modules
2. Environment-specific configurations
3. Remote state management
4. Variable files for each environment

---

## Conclusion

Terraform is a powerful tool for infrastructure management, but it requires understanding of:

1. **Core Concepts:** Resources, providers, state, modules
2. **Best Practices:** Organization, naming, versioning
3. **Advanced Features:** Workspaces, data sources, functions
4. **Real-World Patterns:** Multi-environment, team collaboration

Start simple, practice regularly, and gradually increase complexity. The key is to understand the fundamentals before moving to advanced topics.

**Remember:** Infrastructure as Code is not just about tools—it's about practices, collaboration, and treating infrastructure with the same discipline as application code.

---

*This guide provides a foundation for learning Terraform. Continue practicing with real projects and stay updated with the latest features and best practices.*