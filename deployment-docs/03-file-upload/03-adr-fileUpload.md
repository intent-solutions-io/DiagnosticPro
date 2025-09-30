# ADR-003: File Upload Architecture for DiagnosticPro Platform

**Date**: 2025-09-29
**Status**: Approved
**Supersedes**: None
**Authors**: System Architecture Team

## Context

DiagnosticPro requires file upload capability to enhance the $4.99 diagnostic submission workflow. Users need to attach supporting documentation (images, videos, audio, documents) to provide comprehensive diagnostic context for AI analysis. This capability must integrate seamlessly with the existing Google Cloud Platform architecture while maintaining security, scalability, and cost-effectiveness.

## Current Architecture Context

### Existing System Components
- **Frontend**: React 18 + TypeScript + Vite (Firebase Hosting)
- **Backend**: Node.js Express (Cloud Run: `diagnosticpro-vertex-ai-backend`)
- **Database**: Firestore (`diagnosticSubmissions`, `orders`, `emailLogs`)
- **AI**: Vertex AI Gemini 2.5 Flash
- **Storage**: Google Cloud Storage (`diagnostic-pro-prod-reports-us-central1`)
- **API Gateway**: `diagpro-gw-3tbssksx-3tbssksx` (public endpoints)

### Integration Requirements
- Associate uploaded files with diagnostic submissions
- Process files through AI analysis pipeline
- Store file metadata in BigQuery filing system
- Maintain audit trail for compliance

## Decision

### Architecture Decision: Multi-Tier Cloud Storage with Streaming Upload

We will implement a **chunked streaming upload architecture** using Google Cloud Storage with Firebase client SDK integration, following these architectural principles:

## 1. Storage Architecture

### 1.1 Cloud Storage Bucket Structure
```
diagnostic-pro-prod-user-uploads/
├── staging/                    # Temporary upload area (24-hour retention)
│   └── {submissionId}/
│       ├── {fileId}_original.{ext}
│       └── {fileId}_metadata.json
├── processed/                  # Validated and scanned files
│   └── {submissionId}/
│       ├── images/            # Optimized images
│       ├── documents/         # Text-extracted documents
│       ├── audio/             # Transcribed audio files
│       └── video/             # Processed video files
└── quarantine/                # Failed security scans
    └── {submissionId}/
```

### 1.2 Firebase Storage Integration
```typescript
// Frontend upload configuration
const storageConfig = {
  bucket: 'diagnostic-pro-prod-user-uploads',
  uploadPath: (submissionId: string, fileId: string) =>
    `staging/${submissionId}/${fileId}_original`,
  chunkSize: 8 * 1024 * 1024, // 8MB chunks
  maxFileSize: 50 * 1024 * 1024, // 50MB limit
  allowedTypes: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};
```

## 2. Upload Flow Architecture

### 2.1 Client-Side Implementation
```typescript
interface FileUploadService {
  uploadFile(
    file: File,
    submissionId: string,
    onProgress: (progress: number) => void
  ): Promise<FileUploadResult>;

  validateFile(file: File): FileValidationResult;
  generateFileId(): string;
  resumeUpload(uploadId: string): Promise<void>;
}

class FirebaseFileUploader implements FileUploadService {
  private storage = getStorage();

  async uploadFile(file: File, submissionId: string, onProgress: (progress: number) => void) {
    // Generate unique file ID
    const fileId = this.generateFileId();
    const storageRef = ref(this.storage, `staging/${submissionId}/${fileId}_original.${file.name.split('.').pop()}`);

    // Create resumable upload task
    const uploadTask = uploadBytesResumable(storageRef, file, {
      customMetadata: {
        submissionId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        contentType: file.type,
        size: file.size.toString()
      }
    });

    // Monitor progress
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }
    );

    // Wait for completion
    await uploadTask;

    // Trigger server-side processing
    await this.triggerFileProcessing(submissionId, fileId);

    return {
      fileId,
      path: `staging/${submissionId}/${fileId}_original`,
      status: 'uploaded'
    };
  }

  private async triggerFileProcessing(submissionId: string, fileId: string) {
    await fetch(`${API_BASE}/processUploadedFile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_API_KEY
      },
      body: JSON.stringify({ submissionId, fileId })
    });
  }
}
```

### 2.2 Backend Processing Pipeline
```javascript
// Cloud Run endpoint: /processUploadedFile
app.post('/processUploadedFile', async (req, res) => {
  const { submissionId, fileId } = req.body;

  try {
    // Step 1: Validate file exists in staging
    const stagingPath = `staging/${submissionId}/${fileId}_original`;
    const file = storage.bucket('diagnostic-pro-prod-user-uploads').file(stagingPath);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found in staging' });
    }

    // Step 2: Get file metadata
    const [metadata] = await file.getMetadata();
    const fileInfo = {
      submissionId,
      fileId,
      originalName: metadata.metadata.originalName,
      contentType: metadata.contentType,
      size: parseInt(metadata.size),
      uploadedAt: metadata.metadata.uploadedAt
    };

    // Step 3: Security scan
    const scanResult = await securityScanFile(file);
    if (!scanResult.safe) {
      await moveToQuarantine(file, submissionId, fileId, scanResult.threats);
      return res.status(400).json({ error: 'File failed security scan', threats: scanResult.threats });
    }

    // Step 4: Process based on file type
    const processedPath = await processFileByType(file, fileInfo);

    // Step 5: Update Firestore with file record
    await db.collection('fileUploads').doc(fileId).set({
      submissionId,
      fileId,
      originalName: fileInfo.originalName,
      contentType: fileInfo.contentType,
      size: fileInfo.size,
      uploadedAt: admin.firestore.Timestamp.fromDate(new Date(fileInfo.uploadedAt)),
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      stagingPath,
      processedPath,
      status: 'processed',
      securityScan: {
        scannedAt: admin.firestore.FieldValue.serverTimestamp(),
        safe: true,
        scanEngine: 'google-cloud-security'
      }
    });

    // Step 6: Link to submission
    await db.collection('diagnosticSubmissions').doc(submissionId).update({
      attachedFiles: admin.firestore.FieldValue.arrayUnion(fileId),
      fileProcessingStatus: 'completed',
      lastFileProcessedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Step 7: Schedule staging cleanup (24 hours)
    await scheduleFileCleanup(stagingPath, 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      fileId,
      processedPath,
      status: 'processed'
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});
```

## 3. File Processing Pipeline

### 3.1 Content-Type Based Processing
```javascript
async function processFileByType(file, fileInfo) {
  const { contentType, submissionId, fileId } = fileInfo;

  switch (true) {
    case contentType.startsWith('image/'):
      return await processImageFile(file, submissionId, fileId);

    case contentType.startsWith('video/'):
      return await processVideoFile(file, submissionId, fileId);

    case contentType.startsWith('audio/'):
      return await processAudioFile(file, submissionId, fileId);

    case contentType === 'application/pdf':
    case contentType.includes('document'):
      return await processDocumentFile(file, submissionId, fileId);

    default:
      // Store as-is for manual review
      return await moveToProcessed(file, submissionId, fileId, 'raw');
  }
}

async function processImageFile(file, submissionId, fileId) {
  // Create optimized versions for AI analysis
  const processedPath = `processed/${submissionId}/images/${fileId}`;

  // Use Cloud Functions or Cloud Run for image processing
  const processedFile = storage.bucket('diagnostic-pro-prod-user-uploads').file(processedPath);

  // Copy original to processed location
  await file.copy(processedFile);

  // Extract metadata for AI analysis
  const imageMetadata = await extractImageMetadata(file);

  // Store metadata for AI context
  await storage.bucket('diagnostic-pro-prod-user-uploads')
    .file(`${processedPath}_metadata.json`)
    .save(JSON.stringify({
      type: 'image',
      metadata: imageMetadata,
      processedAt: new Date().toISOString(),
      aiReadyFormat: true
    }));

  return processedPath;
}

async function processAudioFile(file, submissionId, fileId) {
  const processedPath = `processed/${submissionId}/audio/${fileId}`;

  // Transcribe audio using Speech-to-Text API
  const transcription = await transcribeAudio(file);

  // Store original audio
  const processedFile = storage.bucket('diagnostic-pro-prod-user-uploads').file(processedPath);
  await file.copy(processedFile);

  // Store transcription
  await storage.bucket('diagnostic-pro-prod-user-uploads')
    .file(`${processedPath}_transcription.txt`)
    .save(transcription.text);

  // Store metadata
  await storage.bucket('diagnostic-pro-prod-user-uploads')
    .file(`${processedPath}_metadata.json`)
    .save(JSON.stringify({
      type: 'audio',
      transcription: transcription.text,
      confidence: transcription.confidence,
      language: transcription.language,
      processedAt: new Date().toISOString()
    }));

  return processedPath;
}
```

### 3.2 Security Scanning Implementation
```javascript
async function securityScanFile(file) {
  try {
    // Use Google Cloud Security API for malware scanning
    const scanResult = await cloudSecurityClient.scanFile({
      file: file.cloudStorageUri,
      scanTypes: ['MALWARE', 'VIRUS', 'SUSPICIOUS_CONTENT']
    });

    return {
      safe: scanResult.threats.length === 0,
      threats: scanResult.threats,
      scanId: scanResult.scanId,
      scannedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Security scan failed:', error);
    // Fail secure: if scan fails, consider unsafe
    return {
      safe: false,
      threats: ['SCAN_FAILED'],
      error: error.message
    };
  }
}

async function moveToQuarantine(file, submissionId, fileId, threats) {
  const quarantinePath = `quarantine/${submissionId}/${fileId}_quarantined`;
  const quarantineFile = storage.bucket('diagnostic-pro-prod-user-uploads').file(quarantinePath);

  await file.copy(quarantineFile);

  // Log security incident
  await db.collection('securityIncidents').add({
    type: 'FILE_QUARANTINE',
    submissionId,
    fileId,
    threats,
    quarantinePath,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  // Delete from staging
  await file.delete();
}
```

## 4. AI Analysis Integration

### 4.1 Enhanced Prompt with File Context
```javascript
async function generateEnhancedPrompt(submission, attachedFiles) {
  let prompt = `You are an expert diagnostic technician. Analyze this ${submission.equipmentType}:

Vehicle Information:
- Make: ${submission.manufacturer}
- Model: ${submission.model}
- Year: ${submission.year}
- Mileage: ${submission.mileage}

Symptoms: ${submission.symptoms}
Additional Notes: ${submission.additionalNotes || 'None'}

`;

  // Add file context
  if (attachedFiles && attachedFiles.length > 0) {
    prompt += '\n--- ATTACHED SUPPORTING FILES ---\n';

    for (const fileId of attachedFiles) {
      const fileDoc = await db.collection('fileUploads').doc(fileId).get();
      if (fileDoc.exists) {
        const fileData = fileDoc.data();
        prompt += `\nFile: ${fileData.originalName} (${fileData.contentType})\n`;

        // Add processed content based on type
        if (fileData.contentType.startsWith('audio/')) {
          const transcriptionPath = fileData.processedPath + '_transcription.txt';
          const transcriptionFile = storage.bucket('diagnostic-pro-prod-user-uploads').file(transcriptionPath);
          const [transcriptionExists] = await transcriptionFile.exists();

          if (transcriptionExists) {
            const [transcription] = await transcriptionFile.download();
            prompt += `Audio Transcription: ${transcription.toString()}\n`;
          }
        }

        if (fileData.contentType.startsWith('image/')) {
          prompt += `Image Analysis: [Image of ${submission.equipmentType} showing visual symptoms - analyze for damage, wear patterns, fluid leaks, or other visible issues]\n`;
        }

        // Add metadata context
        const metadataPath = fileData.processedPath + '_metadata.json';
        const metadataFile = storage.bucket('diagnostic-pro-prod-user-uploads').file(metadataPath);
        const [metadataExists] = await metadataFile.exists();

        if (metadataExists) {
          const [metadata] = await metadataFile.download();
          const metadataObj = JSON.parse(metadata.toString());
          prompt += `Additional Context: ${JSON.stringify(metadataObj.metadata || {})}\n`;
        }
      }
    }
  }

  prompt += `\n--- ANALYSIS REQUIREMENTS ---
Please provide a comprehensive diagnostic analysis including:
1. Primary diagnosis with confidence level
2. Supporting evidence from attached files
3. Recommended diagnostic tests
4. Repair recommendations with cost estimates
5. Safety concerns and immediate actions needed
6. How the attached files support or modify your analysis

Format your response professionally for a customer report.`;

  return prompt;
}
```

## 5. BigQuery Integration

### 5.1 File Metadata Schema
```sql
CREATE TABLE `diagnostic-pro-start-up.diagnosticpro_prod.file_uploads` (
  submission_id STRING NOT NULL,
  file_id STRING NOT NULL,
  original_name STRING,
  content_type STRING,
  file_size INT64,
  uploaded_at TIMESTAMP,
  processed_at TIMESTAMP,
  processing_status STRING, -- uploaded, processing, processed, failed, quarantined
  storage_path STRING,
  security_scan_result STRUCT<
    safe BOOL,
    threats ARRAY<STRING>,
    scan_id STRING,
    scanned_at TIMESTAMP
  >,
  file_metadata JSON,
  ai_analysis_included BOOL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(uploaded_at)
CLUSTER BY submission_id, processing_status;
```

### 5.2 Data Pipeline Integration
```javascript
// Sync file metadata to BigQuery
async function syncFileToBigQuery(fileData) {
  const bigqueryClient = new BigQuery({ projectId: 'diagnostic-pro-start-up' });

  const row = {
    submission_id: fileData.submissionId,
    file_id: fileData.fileId,
    original_name: fileData.originalName,
    content_type: fileData.contentType,
    file_size: fileData.size,
    uploaded_at: fileData.uploadedAt,
    processed_at: fileData.processedAt,
    processing_status: fileData.status,
    storage_path: fileData.processedPath,
    security_scan_result: fileData.securityScan,
    file_metadata: fileData.metadata || {},
    ai_analysis_included: fileData.includedInAnalysis || false
  };

  await bigqueryClient
    .dataset('diagnosticpro_prod')
    .table('file_uploads')
    .insert([row]);
}
```

## 6. Cost Optimization

### 6.1 Storage Lifecycle Management
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["processed/"]
        }
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
        "condition": {
          "age": 90,
          "matchesPrefix": ["processed/"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 1,
          "matchesPrefix": ["staging/"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 365,
          "matchesPrefix": ["quarantine/"]
        }
      }
    ]
  }
}
```

### 6.2 Cost Monitoring
```javascript
// Cost tracking per submission
async function trackFileUploadCosts(submissionId, fileOperations) {
  const costData = {
    submissionId,
    storage_gb_hours: fileOperations.storageSize * 24, // GB-hours for 24h staging
    api_requests: fileOperations.apiCalls,
    data_processing_mb: fileOperations.processingSize,
    estimated_cost_usd: calculateEstimatedCost(fileOperations),
    date: new Date().toISOString().split('T')[0]
  };

  await db.collection('costTracking').add(costData);
}
```

## Rationale

### Why This Architecture?

1. **Scalability**: Firebase Storage handles chunked uploads automatically with client-side resumability
2. **Security**: Multi-layer security with client validation, server-side scanning, and quarantine capabilities
3. **Cost Efficiency**: Lifecycle management reduces long-term storage costs while maintaining accessibility
4. **Integration**: Seamless integration with existing Firestore and BigQuery infrastructure
5. **Performance**: Parallel processing pipeline with async file handling
6. **Compliance**: Audit trail and retention policies meet regulatory requirements

### Alternatives Considered

#### Alternative 1: Direct Cloud Storage Upload
- **Pros**: Simpler implementation, lower latency
- **Cons**: No security scanning, limited metadata processing, no chunked uploads
- **Rejected**: Security risks too high for user-generated content

#### Alternative 2: Firebase Realtime Database for Metadata
- **Pros**: Real-time updates
- **Cons**: No SQL queries, higher costs, doesn't integrate with BigQuery
- **Rejected**: Firestore provides better querying and BigQuery integration

#### Alternative 3: Cloud Functions for Processing
- **Pros**: Event-driven, automatic scaling
- **Cons**: Cold starts, timeout limitations (9 minutes), additional complexity
- **Rejected**: Cloud Run provides better control and longer processing time for large files

## Implementation Plan

### Phase 1: Core Upload Infrastructure (Week 1)
- [ ] Cloud Storage bucket configuration with lifecycle policies
- [ ] Firebase Storage client integration in React frontend
- [ ] Basic file validation and chunked upload
- [ ] Cloud Run endpoint for file processing triggers

### Phase 2: Security & Processing (Week 2)
- [ ] Security scanning integration
- [ ] File type-specific processing pipelines
- [ ] Quarantine and incident management
- [ ] Firestore schema updates

### Phase 3: AI Integration (Week 3)
- [ ] Enhanced AI prompt generation with file context
- [ ] Audio transcription pipeline
- [ ] Image metadata extraction
- [ ] Document text extraction

### Phase 4: Analytics & Monitoring (Week 4)
- [ ] BigQuery schema deployment
- [ ] Data pipeline integration
- [ ] Cost tracking and optimization
- [ ] Performance monitoring dashboards

## Success Metrics

1. **Upload Success Rate**: >98% (target from PRD)
2. **Security Scan Accuracy**: 100% malware detection, <1% false positives
3. **Processing Time**: <30 seconds for files under 10MB
4. **Storage Costs**: <$0.10 per diagnostic submission
5. **AI Analysis Enhancement**: >20% improvement in diagnostic accuracy with file context

## Monitoring & Alerting

```javascript
// Key metrics to monitor
const fileUploadMetrics = {
  upload_success_rate: 'rate(file_uploads_completed) / rate(file_uploads_started)',
  processing_latency: 'histogram_quantile(0.95, file_processing_duration_ms)',
  security_scan_failures: 'rate(security_scans_failed)',
  storage_costs_daily: 'sum(storage_usage_gb) * storage_price_per_gb',
  quarantine_rate: 'rate(files_quarantined) / rate(files_uploaded)'
};

// Alerts
const alertRules = [
  {
    metric: 'upload_success_rate',
    threshold: '< 0.98',
    severity: 'critical',
    action: 'page_oncall'
  },
  {
    metric: 'security_scan_failures',
    threshold: '> 0',
    severity: 'high',
    action: 'notify_security_team'
  },
  {
    metric: 'quarantine_rate',
    threshold: '> 0.05',
    severity: 'medium',
    action: 'investigate_trends'
  }
];
```

## Consequences

### Positive
- Enhanced diagnostic accuracy through multi-modal data input
- Improved customer satisfaction with comprehensive analysis
- Scalable architecture supporting future growth
- Strong security posture protecting customer data
- Cost-effective storage management

### Negative
- Increased complexity in the upload/processing pipeline
- Additional storage costs for file processing and retention
- Security scanning adds latency to file processing
- Requires monitoring and maintenance of file lifecycle policies

### Risks & Mitigations
- **Risk**: Large file uploads overwhelming system
  - **Mitigation**: 50MB file size limits, chunked uploads, rate limiting
- **Risk**: Malicious file uploads
  - **Mitigation**: Multi-layer security scanning, quarantine system, audit trails
- **Risk**: Storage costs spiraling
  - **Mitigation**: Aggressive lifecycle policies, cost monitoring, usage alerts

## Notes

This ADR establishes the foundation for file upload capabilities while maintaining the existing DiagnosticPro architecture principles. The implementation should be done incrementally with thorough testing at each phase to ensure system stability and security.

The architecture supports future enhancements like real-time processing notifications, advanced AI vision analysis, and integration with external diagnostic tools while maintaining backward compatibility with the current $4.99 diagnostic workflow.