# Infrastructure as Code

Google Cloud Platform infrastructure configuration.

## Structure

- `firebase/` - Firebase configuration (firebase.json, .firebaserc, hosting)
- `cloudrun/` - Cloud Run configuration (Dockerfile, service YAML)
- `firestore/` - Firestore configuration (rules, indexes)
- `api-gateway/` - API Gateway OpenAPI specifications
- `gcp/` - General GCP configuration
  - `iam/` - IAM roles and service accounts
  - `secrets/` - Secret Manager configuration
  - `storage/` - Cloud Storage bucket configuration

## GCP Services Used

- Firebase Hosting (Frontend)
- Cloud Run (Backend)
- Firestore (Database)
- Vertex AI (AI/ML)
- Cloud Storage (File storage)
- API Gateway (API management)
- Secret Manager (Secrets)
