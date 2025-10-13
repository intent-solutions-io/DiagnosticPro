# Firebase to Native GCP Migration Plan

**Date:** October 2, 2025
**Purpose:** Move DiagnosticPro from Firebase to fully Terraform-managed native GCP
**Reason:** Firebase is terrible for Terraform + need rich media features

---

## 🚨 **Why Firebase Must Go**

### **Terraform Problems:**
- Firestore rules can't be properly managed in Terraform
- Firebase Hosting not Terraform-friendly
- Complex authentication flows break IaC
- Firebase Functions have deployment limitations
- No proper resource imports/exports

### **Feature Limitations:**
- Poor media storage scalability
- Limited file upload capabilities
- Restricted audio/video processing
- No native ML integration for media analysis

---

## 🎯 **Target Architecture: Native GCP**

### **New Stack:**
```
Frontend: React (Cloud Run container)
Database: Cloud SQL PostgreSQL
Storage: Cloud Storage (with CDN)
API: Cloud Run (Express.js)
Auth: Identity Platform
Media: Cloud Storage + Vertex AI Vision/Speech
```

### **Why This Is Better:**
- **100% Terraform manageable**
- **Rich media processing** (Vision AI, Speech-to-Text)
- **Scalable storage** for files/audio/video
- **Better BigQuery integration** for analytics
- **Proper CI/CD** with Cloud Build

---

## 📋 **Migration Strategy**

### **Phase 1: Database Migration (Week 1-2)**
```hcl
# Replace Firestore with Cloud SQL PostgreSQL
resource "google_sql_database_instance" "main" {
  name             = "diagnosticpro-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"  # Start small

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }
  }
}

# Create application database
resource "google_sql_database" "app_db" {
  name     = "diagnosticpro"
  instance = google_sql_database_instance.main.name
}
```

### **Phase 2: Storage Migration (Week 2-3)**
```hcl
# Media storage buckets
resource "google_storage_bucket" "media_uploads" {
  name     = "${var.project_id}-media-uploads"
  location = "US"

  lifecycle_rule {
    condition {
      age = 365  # Delete after 1 year
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket" "processed_media" {
  name     = "${var.project_id}-processed-media"
  location = "US"

  cors {
    origin          = ["https://diagnosticpro.io"]
    method          = ["GET", "POST", "PUT"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}
```

### **Phase 3: Frontend Migration (Week 3-4)**
```hcl
# Containerized React frontend on Cloud Run
resource "google_cloud_run_service" "frontend" {
  name     = "diagnosticpro-frontend"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/diagnosticpro-frontend:latest"

        ports {
          container_port = 3000
        }

        env {
          name  = "REACT_APP_API_URL"
          value = google_cloud_run_service.backend.status[0].url
        }
      }
    }
  }
}
```

---

## 📊 **Media Features Architecture**

### **File Upload Flow:**
```
1. User uploads → Cloud Storage (signed URLs)
2. Cloud Storage → Cloud Function trigger
3. Cloud Function → Vertex AI processing
4. Results → Cloud SQL database
5. Notification → Frontend via Pub/Sub
```

### **Media Processing Pipeline:**
```hcl
# Vision AI for image analysis
resource "google_project_service" "vision_api" {
  service = "vision.googleapis.com"
}

# Speech-to-Text for audio
resource "google_project_service" "speech_api" {
  service = "speech.googleapis.com"
}

# Video Intelligence for video analysis
resource "google_project_service" "video_intelligence" {
  service = "videointelligence.googleapis.com"
}

# Pub/Sub for processing pipeline
resource "google_pubsub_topic" "media_processing" {
  name = "media-processing"
}

resource "google_pubsub_subscription" "media_processor" {
  name  = "media-processor"
  topic = google_pubsub_topic.media_processing.name

  ack_deadline_seconds = 600  # 10 minutes for processing
}
```

---

## 🗃️ **Database Schema (PostgreSQL)**

### **Core Tables:**
```sql
-- Replace Firestore collections with proper SQL tables
CREATE TABLE diagnostic_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    equipment_type VARCHAR(100),
    problem_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    ai_analysis JSONB,  -- Store AI results as JSON
    total_cost DECIMAL(10,2) DEFAULT 4.99
);

CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES diagnostic_submissions(id),
    file_name VARCHAR(255),
    file_type VARCHAR(50),  -- image, audio, video, document
    storage_path VARCHAR(500),  -- GCS path
    file_size BIGINT,
    processing_status VARCHAR(50) DEFAULT 'pending',
    ai_analysis JSONB,  -- Vision/Speech AI results
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES diagnostic_submissions(id),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Why PostgreSQL > Firestore:**
- **ACID transactions** for payment processing
- **Rich queries** for analytics
- **JSON support** for flexible AI data
- **Full Terraform support**
- **Better BigQuery integration**

---

## 🎬 **Media Feature Implementation**

### **Feature: File Upload (03-file-upload)**
```hcl
# Cloud Function for file processing
resource "google_cloudfunctions2_function" "file_processor" {
  name     = "file-processor"
  location = var.region

  build_config {
    runtime     = "nodejs18"
    entry_point = "processUpload"

    source {
      storage_source {
        bucket = google_storage_bucket.cloud_functions_source.name
        object = "file-processor.zip"
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "512M"
    timeout_seconds    = 300

    environment_variables = {
      DATABASE_URL = "postgresql://${google_sql_user.app_user.name}:${google_sql_user.app_user.password}@${google_sql_database_instance.main.connection_name}/${google_sql_database.app_db.name}"
      BUCKET_NAME  = google_storage_bucket.media_uploads.name
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.storage.object.v1.finalized"

    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.media_uploads.name
    }
  }
}
```

### **Feature: Camera Capture (04-camera-capture)**
```javascript
// Frontend: Direct upload to Cloud Storage with signed URLs
const uploadImage = async (imageBlob) => {
  // Get signed URL from backend
  const { signedUrl } = await fetch('/api/upload-url', {
    method: 'POST',
    body: JSON.stringify({ fileType: 'image/jpeg' })
  }).then(r => r.json());

  // Upload directly to Cloud Storage
  await fetch(signedUrl, {
    method: 'PUT',
    body: imageBlob,
    headers: { 'Content-Type': 'image/jpeg' }
  });
};
```

### **Feature: Voice Recording (05-voice-audio-recording)**
```hcl
# Speech-to-Text processing function
resource "google_cloudfunctions2_function" "speech_processor" {
  name     = "speech-processor"
  location = var.region

  service_config {
    environment_variables = {
      SPEECH_API_KEY = google_secret_manager_secret_version.speech_api_key.secret_data
    }
  }

  event_trigger {
    event_type = "google.cloud.storage.object.v1.finalized"

    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.media_uploads.name
    }

    event_filters {
      attribute = "eventType"
      value     = "audio/*"
    }
  }
}
```

---

## 📈 **BigQuery Integration**

### **Analytics Pipeline:**
```hcl
# BigQuery dataset for analytics
resource "google_bigquery_dataset" "diagnostics_analytics" {
  dataset_id  = "diagnostics_analytics"
  description = "DiagnosticPro analytics data"
  location    = "US"

  access {
    role          = "OWNER"
    user_by_email = google_service_account.analytics_sa.email
  }
}

# Streaming inserts from Cloud SQL
resource "google_bigquery_table" "diagnostic_events" {
  dataset_id = google_bigquery_dataset.diagnostics_analytics.dataset_id
  table_id   = "diagnostic_events"

  schema = <<EOF
[
  {
    "name": "submission_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "event_type",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "media_count",
    "type": "INTEGER"
  },
  {
    "name": "ai_confidence",
    "type": "FLOAT"
  },
  {
    "name": "timestamp",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  }
]
EOF
}
```

---

## 🚀 **Migration Execution Plan**

### **Week 1: Database Setup**
```bash
# Deploy PostgreSQL
terraform apply -target=google_sql_database_instance.main

# Migrate Firestore data
node scripts/migrate-firestore-to-postgres.js

# Verify data integrity
npm run test:data-migration
```

### **Week 2: Storage Migration**
```bash
# Deploy storage buckets
terraform apply -target=google_storage_bucket.media_uploads

# Migrate existing files
gsutil -m cp -r gs://diagnostic-pro-prod.firebasestorage.app/* gs://diagnostic-pro-prod-media-uploads/

# Update application URLs
```

### **Week 3: Application Migration**
```bash
# Deploy new Cloud Run services
terraform apply -target=google_cloud_run_service.frontend
terraform apply -target=google_cloud_run_service.backend

# Update DNS to point to Cloud Run
# Test end-to-end functionality
```

### **Week 4: Feature Implementation**
```bash
# Deploy media processing functions
terraform apply -target=google_cloudfunctions2_function.file_processor

# Enable new media features
# Decommission Firebase services
```

---

## 💰 **Cost Comparison**

### **Firebase (Current):**
- Firestore: ~$100/month
- Firebase Hosting: $25/month
- Firebase Functions: $50/month
- **Total: ~$175/month**

### **Native GCP (New):**
- Cloud SQL (f1-micro): $7/month
- Cloud Storage: $20/month
- Cloud Run: $30/month
- Cloud Functions: $20/month
- **Total: ~$77/month**

**💸 Savings: $98/month (56% reduction)**

---

## ✅ **Success Criteria**

### **Technical:**
- [ ] All resources 100% Terraform managed
- [ ] Zero Firebase dependencies
- [ ] Media upload/processing working
- [ ] Database migration complete with zero data loss
- [ ] Performance equal or better than Firebase

### **Business:**
- [ ] Zero downtime during migration
- [ ] $4.99 payments continue working
- [ ] Customer experience improved
- [ ] New media features operational

---

## 🎯 **Next Steps**

1. **Review and approve this plan**
2. **Set up development/staging environment**
3. **Begin Week 1: Database migration**
4. **Update terraform configuration**
5. **Execute phased migration**

---

**Status:** ✅ READY FOR IMPLEMENTATION
**Timeline:** 4 weeks to complete migration
**Risk:** LOW (phased approach with rollback plans)

This gets you off Firebase completely and onto a proper, scalable, Terraform-managed architecture that can handle all your rich media features!