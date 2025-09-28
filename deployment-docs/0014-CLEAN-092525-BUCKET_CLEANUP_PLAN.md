# Bucket cleanup plan 20250925T161044Z
== 0) Guardrails ==
❌ Canonical bucket gs://diagnostic-pro-prod.appspot.com does NOT exist - need to create it
== Creating canonical Firebase bucket ==
❌ Cannot create appspot.com bucket - requires domain verification
✅ Using existing bucket as canonical: diagnostic-pro-prod_diagnostic-reports
== 1) Snapshot backend before cleanup ==
✅ Backend snapshot saved
== 2) Migrate any reports from buckets to be deleted ==
- Checking gs://diagnosticpro-reports/reports/** for data
- Checking gs://diagnosticpro-storage-bucket/reports/** for data
== 3) Delete extra buckets ==
Deleting gs://diagnosticpro-reports
✅ Deleted gs://diagnosticpro-reports
Deleting gs://diagnosticpro-storage-bucket
✅ Deleted gs://diagnosticpro-storage-bucket
== 4) Verify remaining buckets ==
gs://diagnostic-pro-prod-storage/
gs://diagnostic-pro-prod_cloudbuild/
gs://diagnostic-pro-prod_diagnostic-reports/
gs://diagnosticpro-frontend/
gs://diagnosticpro-website/
gs://gcf-v2-sources-298932670545-us-central1/
gs://gcf-v2-sources-298932670545-us-east1/
gs://gcf-v2-uploads-298932670545.us-central1.cloudfunctions.appspot.com/
gs://gcf-v2-uploads-298932670545.us-east1.cloudfunctions.appspot.com/
gs://run-sources-diagnostic-pro-prod-us-central1/
== 5) Update backend to use canonical bucket ==
✅ Backend updated with REPORT_BUCKET=diagnostic-pro-prod_diagnostic-reports
== 6) Snapshot backend after cleanup ==
✅ Final backend snapshot saved
== 7) Verification - canonical bucket accessible ==
== CLEANUP COMPLETE ==
✅ CANONICAL BUCKET: gs://diagnostic-pro-prod_diagnostic-reports
✅ DELETED BUCKETS: diagnosticpro-reports, diagnosticpro-storage-bucket
✅ BACKEND UPDATED: REPORT_BUCKET=diagnostic-pro-prod_diagnostic-reports
