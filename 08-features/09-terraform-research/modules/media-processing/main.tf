# Media Processing Pipeline for DiagnosticPro Features

# Pub/Sub topic for media processing events
resource "google_pubsub_topic" "media_processing" {
  name    = "media-processing"
  project = var.project_id
}

resource "google_pubsub_subscription" "media_processor" {
  name    = "media-processor"
  topic   = google_pubsub_topic.media_processing.name
  project = var.project_id

  ack_deadline_seconds = 600  # 10 minutes for processing

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }
}

# Cloud Function: File Upload Processor
resource "google_cloudfunctions2_function" "file_processor" {
  name     = "file-processor"
  location = var.region
  project  = var.project_id

  build_config {
    runtime     = "nodejs18"
    entry_point = "processUpload"

    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.file_processor_source.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "512M"
    timeout_seconds    = 300
    service_account_email = var.service_account_email

    environment_variables = {
      DATABASE_URL = var.database_connection
      UPLOADS_BUCKET = var.uploads_bucket_name
      PROCESSED_BUCKET = var.processed_bucket_name
      PUBSUB_TOPIC = google_pubsub_topic.media_processing.name
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.storage.object.v1.finalized"

    event_filters {
      attribute = "bucket"
      value     = var.uploads_bucket_name
    }
  }
}

# Cloud Function: Image Analysis (Feature 04-camera-capture)
resource "google_cloudfunctions2_function" "image_analyzer" {
  name     = "image-analyzer"
  location = var.region
  project  = var.project_id

  build_config {
    runtime     = "nodejs18"
    entry_point = "analyzeImage"

    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.image_analyzer_source.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    available_memory   = "1Gi"
    timeout_seconds    = 300
    service_account_email = var.service_account_email

    environment_variables = {
      DATABASE_URL = var.database_connection
      VISION_API_KEY = google_secret_manager_secret_version.vision_api_key.secret_data
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"

    event_filters {
      attribute = "type"
      value     = "image"
    }
  }
}

# Cloud Function: Audio Analysis (Feature 05-voice-audio-recording)
resource "google_cloudfunctions2_function" "audio_analyzer" {
  name     = "audio-analyzer"
  location = var.region
  project  = var.project_id

  build_config {
    runtime     = "nodejs18"
    entry_point = "analyzeAudio"

    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.audio_analyzer_source.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    available_memory   = "1Gi"
    timeout_seconds    = 600  # Longer for audio processing
    service_account_email = var.service_account_email

    environment_variables = {
      DATABASE_URL = var.database_connection
      SPEECH_API_KEY = google_secret_manager_secret_version.speech_api_key.secret_data
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"

    event_filters {
      attribute = "type"
      value     = "audio"
    }
  }
}

# Cloud Function: Video Analysis (Feature 06-video-audio-capture)
resource "google_cloudfunctions2_function" "video_analyzer" {
  name     = "video-analyzer"
  location = var.region
  project  = var.project_id

  build_config {
    runtime     = "nodejs18"
    entry_point = "analyzeVideo"

    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.video_analyzer_source.name
      }
    }
  }

  service_config {
    max_instance_count = 3
    available_memory   = "2Gi"
    timeout_seconds    = 1800  # 30 minutes for video processing
    service_account_email = var.service_account_email

    environment_variables = {
      DATABASE_URL = var.database_connection
      VIDEO_API_KEY = google_secret_manager_secret_version.video_api_key.secret_data
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"

    event_filters {
      attribute = "type"
      value     = "video"
    }
  }
}

# Storage bucket for Cloud Functions source code
resource "google_storage_bucket" "functions_source" {
  name     = "${var.project_id}-functions-source"
  location = "US"
  project  = var.project_id
}

# Placeholder source code objects (to be replaced with actual deployments)
resource "google_storage_bucket_object" "file_processor_source" {
  name   = "file-processor.zip"
  bucket = google_storage_bucket.functions_source.name
  source = "/dev/null"  # Placeholder - replace with actual zip
}

resource "google_storage_bucket_object" "image_analyzer_source" {
  name   = "image-analyzer.zip"
  bucket = google_storage_bucket.functions_source.name
  source = "/dev/null"  # Placeholder - replace with actual zip
}

resource "google_storage_bucket_object" "audio_analyzer_source" {
  name   = "audio-analyzer.zip"
  bucket = google_storage_bucket.functions_source.name
  source = "/dev/null"  # Placeholder - replace with actual zip
}

resource "google_storage_bucket_object" "video_analyzer_source" {
  name   = "video-analyzer.zip"
  bucket = google_storage_bucket.functions_source.name
  source = "/dev/null"  # Placeholder - replace with actual zip
}

# API Keys for Vision, Speech, and Video Intelligence
resource "google_secret_manager_secret" "vision_api_key" {
  secret_id = "vision-api-key"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "vision_api_key" {
  secret      = google_secret_manager_secret.vision_api_key.id
  secret_data = "placeholder-vision-api-key"  # Replace with actual key
}

resource "google_secret_manager_secret" "speech_api_key" {
  secret_id = "speech-api-key"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "speech_api_key" {
  secret      = google_secret_manager_secret.speech_api_key.id
  secret_data = "placeholder-speech-api-key"  # Replace with actual key
}

resource "google_secret_manager_secret" "video_api_key" {
  secret_id = "video-api-key"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "video_api_key" {
  secret      = google_secret_manager_secret.video_api_key.id
  secret_data = "placeholder-video-api-key"  # Replace with actual key
}