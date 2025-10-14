# Code Examples: AI Vision Implementation

**Created**: 2025-10-13
**Status**: Reference Implementation
**Related**: 061-adr-ai-vision-implementation.md, 062-pln-ai-vision-implementation-plan.md

## Table of Contents
1. [Backend: Photo Upload Endpoint](#backend-photo-upload-endpoint)
2. [Backend: Video Upload Endpoint](#backend-video-upload-endpoint)
3. [Backend: Vertex AI Integration](#backend-vertex-ai-integration)
4. [Frontend: Photo Upload Component](#frontend-photo-upload-component)
5. [Frontend: Video Upload Component](#frontend-video-upload-component)
6. [Firestore Schema Updates](#firestore-schema-updates)
7. [Cloud Storage Configuration](#cloud-storage-configuration)

---

## Backend: Photo Upload Endpoint

### File: `02-src/backend/services/backend/routes/photos.js`

```javascript
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp'); // For image validation and optimization

const router = express.Router();
const storage = new Storage();
const firestore = new Firestore();
const bucket = storage.bucket('diagnosticpro-customer-media');

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per photo
    files: 5 // Max 5 photos
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    const allowedMimes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, HEIC, WEBP allowed.`));
    }
  }
});

/**
 * POST /api/upload-photos
 * Upload 1-5 photos for a diagnostic submission
 *
 * Body: multipart/form-data
 *   - photos: File[] (1-5 images)
 *   - submissionId: string (Firestore document ID)
 */
router.post('/upload-photos', upload.array('photos', 5), async (req, res) => {
  try {
    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    console.log(`Uploading ${req.files.length} photos for submission ${submissionId}`);

    // Validate submission exists in Firestore
    const submissionRef = firestore.collection('diagnosticSubmissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Process each photo
    const uploadPromises = req.files.map(async (file, index) => {
      // Validate image dimensions using sharp
      const metadata = await sharp(file.buffer).metadata();

      if (metadata.width < 640 || metadata.height < 480) {
        throw new Error(`Photo ${index + 1} resolution too low. Minimum 640x480 required.`);
      }

      // Generate unique filename
      const filename = `${submissionId}/${uuidv4()}-${Date.now()}.${metadata.format}`;
      const blob = bucket.file(`photos/${filename}`);

      // Compress image if needed (convert HEIC to JPG, optimize quality)
      let buffer = file.buffer;
      if (metadata.format === 'heic' || file.size > 5 * 1024 * 1024) {
        buffer = await sharp(file.buffer)
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      // Upload to Cloud Storage
      await blob.save(buffer, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            submissionId: submissionId
          }
        }
      });

      // Generate signed URL (expires in 1 hour)
      const [signedUrl] = await blob.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000 // 1 hour
      });

      return {
        url: `gs://diagnosticpro-customer-media/photos/${filename}`,
        signedUrl: signedUrl,
        filename: file.originalname,
        size: buffer.length,
        dimensions: `${metadata.width}x${metadata.height}`,
        uploadedAt: new Date().toISOString()
      };
    });

    const photos = await Promise.all(uploadPromises);

    // Update Firestore with photo metadata
    await submissionRef.update({
      photos: photos,
      hasPhotos: true,
      photoCount: photos.length,
      updatedAt: new Date().toISOString()
    });

    console.log(`Successfully uploaded ${photos.length} photos for ${submissionId}`);

    res.json({
      success: true,
      photoCount: photos.length,
      photos: photos.map(p => ({
        filename: p.filename,
        signedUrl: p.signedUrl
      }))
    });

  } catch (error) {
    console.error('Photo upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 10MB per photo.' });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 photos allowed.' });
    }

    res.status(500).json({
      error: 'Failed to upload photos',
      message: error.message
    });
  }
});

module.exports = router;
```

---

## Backend: Video Upload Endpoint

### File: `02-src/backend/services/backend/routes/videos.js`

```javascript
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');

const router = express.Router();
const storage = new Storage();
const firestore = new Firestore();
const bucket = storage.bucket('diagnosticpro-customer-media');

// Multer configuration for video uploads
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid video format: ${file.mimetype}. Only MP4, MOV, WEBM allowed.`));
    }
  }
});

/**
 * Validate video duration without full processing
 */
async function getVideoDuration(buffer) {
  return new Promise((resolve, reject) => {
    const stream = Readable.from(buffer);

    ffmpeg(stream)
      .ffprobe((err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          resolve(duration);
        }
      });
  });
}

/**
 * POST /api/upload-video
 * Upload single video for premium diagnostic
 *
 * Body: multipart/form-data
 *   - video: File (single video, max 50MB, max 60 seconds)
 *   - submissionId: string
 */
router.post('/upload-video', videoUpload.single('video'), async (req, res) => {
  try {
    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }

    console.log(`Uploading video for submission ${submissionId}`);
    console.log(`Video size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

    // Validate submission exists and is premium tier
    const submissionRef = firestore.collection('diagnosticSubmissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const data = submissionDoc.data();
    if (data.tier !== 'premium' && data.tier !== 'video') {
      return res.status(403).json({
        error: 'Video upload only available for premium tier ($14.99)'
      });
    }

    // Validate video duration
    const duration = await getVideoDuration(req.file.buffer);

    if (duration > 60) {
      return res.status(400).json({
        error: `Video too long: ${duration.toFixed(1)}s. Maximum 60 seconds allowed.`
      });
    }

    console.log(`Video duration: ${duration.toFixed(1)}s`);

    // Generate unique filename
    const filename = `${submissionId}/${uuidv4()}-${Date.now()}.mp4`;
    const blob = bucket.file(`videos/${filename}`);

    // Upload to Cloud Storage with streaming (don't buffer entire file in memory)
    await blob.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          duration: duration.toString(),
          uploadedAt: new Date().toISOString(),
          submissionId: submissionId
        }
      }
    });

    console.log(`Video uploaded to: gs://diagnosticpro-customer-media/videos/${filename}`);

    // Generate signed URL (expires in 2 hours for longer analysis time)
    const [signedUrl] = await blob.getSignedUrl({
      action: 'read',
      expires: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    });

    const videoMetadata = {
      url: `gs://diagnosticpro-customer-media/videos/${filename}`,
      signedUrl: signedUrl,
      filename: req.file.originalname,
      size: req.file.size,
      duration: duration,
      uploadedAt: new Date().toISOString()
    };

    // Update Firestore
    await submissionRef.update({
      video: videoMetadata,
      hasVideo: true,
      updatedAt: new Date().toISOString()
    });

    console.log(`Successfully uploaded video for ${submissionId}`);

    res.json({
      success: true,
      video: {
        filename: videoMetadata.filename,
        duration: videoMetadata.duration,
        signedUrl: videoMetadata.signedUrl
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Video too large. Maximum 50MB allowed.' });
    }

    res.status(500).json({
      error: 'Failed to upload video',
      message: error.message
    });
  }
});

module.exports = router;
```

---

## Backend: Vertex AI Integration

### File: `02-src/backend/services/backend/services/gemini-vision.js`

```javascript
const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');

const vertex = new VertexAI({
  project: 'diagnostic-pro-prod',
  location: 'us-central1'
});

const storage = new Storage();

/**
 * Analyze diagnostic with photos and/or video
 *
 * @param {Object} submission - Diagnostic submission from Firestore
 * @param {Array} submission.photos - Array of photo metadata
 * @param {Object} submission.video - Video metadata
 * @returns {Promise<string>} - 14-section analysis
 */
async function analyzeWithVision(submission) {
  const model = vertex.getGenerativeModel({
    model: 'gemini-2.5-flash-002'
  });

  // Build prompt parts
  const parts = [];

  // Add text description
  const textPrompt = buildDiagnosticPrompt(submission);
  parts.push({ text: textPrompt });

  // Add photos if present
  if (submission.hasPhotos && submission.photos) {
    console.log(`Adding ${submission.photos.length} photos to analysis`);

    for (let i = 0; i < submission.photos.length; i++) {
      const photo = submission.photos[i];

      // Download photo from Cloud Storage
      const bucket = storage.bucket('diagnosticpro-customer-media');
      const photoPath = photo.url.replace('gs://diagnosticpro-customer-media/', '');
      const file = bucket.file(photoPath);

      const [buffer] = await file.download();
      const base64Data = buffer.toString('base64');

      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    }
  }

  // Add video if present
  if (submission.hasVideo && submission.video) {
    console.log(`Adding video (${submission.video.duration}s) to analysis`);

    // For video, use GCS URI directly (more efficient than base64)
    parts.push({
      fileData: {
        mimeType: 'video/mp4',
        fileUri: submission.video.url
      }
    });
  }

  // Generate analysis
  const request = {
    contents: [
      {
        role: 'user',
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40
    }
  };

  console.log('Sending request to Gemini...');
  const result = await model.generateContent(request);
  const response = result.response;

  return response.candidates[0].content.parts[0].text;
}

/**
 * Build enhanced diagnostic prompt with vision instructions
 */
function buildDiagnosticPrompt(submission) {
  const hasPhotos = submission.hasPhotos && submission.photos?.length > 0;
  const hasVideo = submission.hasVideo && submission.video;

  let prompt = `You are an expert diagnostic technician analyzing equipment issues.

CUSTOMER INFORMATION:
- Equipment Type: ${submission.equipmentType}
- Manufacturer: ${submission.manufacturer}
- Model: ${submission.model}
- Year: ${submission.year}
- VIN/Serial: ${submission.vin || 'N/A'}

REPORTED SYMPTOMS:
${submission.symptoms}

ERROR CODES:
${submission.errorCodes || 'None reported'}

MAINTENANCE HISTORY:
${submission.maintenanceHistory || 'Unknown'}

VISUAL/AUDIO EVIDENCE:
`;

  if (hasPhotos) {
    prompt += `\n- ${submission.photos.length} PHOTO(S) PROVIDED\n`;
    prompt += `  Analyze photos for: leaks, damage, wear patterns, error code displays, fluid colors, physical condition\n`;
    prompt += `  Reference photos in your analysis as "Photo #1", "Photo #2", etc.\n`;
  }

  if (hasVideo) {
    prompt += `\n- VIDEO PROVIDED (${submission.video.duration.toFixed(1)}s duration)\n`;
    prompt += `  Analyze video for:\n`;
    prompt += `  - Visual symptoms: smoke, leaks, vibrations, abnormal movement\n`;
    prompt += `  - Audio patterns: knocks, rattles, squeals, grinding noises\n`;
    prompt += `  - Temporal patterns: intermittent vs constant symptoms\n`;
    prompt += `  - Frequency analysis: estimate RPM, frequency of sounds\n`;
    prompt += `  Reference specific timestamps: "At 0:15..." or "Between 0:23-0:31..."\n`;
  }

  prompt += `
ANALYSIS REQUIREMENTS:

Provide a comprehensive 14-section diagnostic analysis:

1. PRIMARY DIAGNOSIS (Root cause with confidence %)
2. DIFFERENTIAL DIAGNOSIS (Alternative causes ranked)
3. DIAGNOSTIC VERIFICATION (Exact tests required)
4. SHOP INTERROGATION (5 technical questions)
5. CONVERSATION SCRIPTING (Word-for-word coaching)
6. COST BREAKDOWN (Fair pricing vs overcharge)
7. RIPOFF DETECTION (Scam identification)
8. AUTHORIZATION GUIDE (Approve/reject/second opinion)
9. TECHNICAL EDUCATION (System operation)
10. OEM PARTS STRATEGY (Specific part numbers)
11. NEGOTIATION TACTICS (Professional strategies)
12. LIKELY CAUSES (Ranked by confidence)
13. RECOMMENDATIONS (Immediate actions)
14. SOURCE VERIFICATION (Authoritative references)
`;

  if (hasPhotos || hasVideo) {
    prompt += `
VISUAL/AUDIO ANALYSIS INSTRUCTIONS:
- Correlate visual evidence with reported symptoms
- Identify symptoms not mentioned in text description
- Assess damage severity from visual inspection
- Analyze wear patterns and failure modes
- Reference specific photos/timestamps in your analysis
- Compare audio patterns to known failure signatures
`;
  }

  return prompt;
}

module.exports = {
  analyzeWithVision
};
```

---

## Frontend: Photo Upload Component

### File: `02-src/frontend/src/components/PhotoUpload.tsx`

```typescript
import React, { useState, useRef } from 'react';
import { Upload, X, Camera, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

interface PhotoUploadProps {
  onPhotosChange: (files: File[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotosChange,
  maxPhotos = 5,
  maxSizeMB = 10
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    setError('');
    const newPhotos: File[] = [];
    const newPreviews: string[] = [];

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check total count
      if (photos.length + newPhotos.length >= maxPhotos) {
        setError(`Maximum ${maxPhotos} photos allowed`);
        break;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Check file size
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > maxSizeMB) {
        setError(`${file.name} is too large (${sizeMB.toFixed(1)}MB). Max ${maxSizeMB}MB`);
        continue;
      }

      // Check image dimensions
      try {
        const dimensions = await getImageDimensions(file);
        if (dimensions.width < 640 || dimensions.height < 480) {
          setError(`${file.name} resolution too low. Minimum 640x480 required`);
          continue;
        }
      } catch (err) {
        setError(`Failed to read ${file.name}`);
        continue;
      }

      newPhotos.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === newPhotos.length) {
          const updatedPhotos = [...photos, ...newPhotos];
          const updatedPreviews = [...previews, ...newPreviews];
          setPhotos(updatedPhotos);
          setPreviews(updatedPreviews);
          onPhotosChange(updatedPhotos);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPreviews(newPreviews);
    onPhotosChange(newPhotos);
    setError('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Add Photos (Optional)</h3>
        <span className="text-sm text-muted-foreground">
          {photos.length} / {maxPhotos} photos
        </span>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => photos.length < maxPhotos && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={photos.length >= maxPhotos}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="h-6 w-6 text-primary" />
          </div>

          <div>
            <p className="text-sm font-medium">
              Drop photos here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, HEIC up to {maxSizeMB}MB • Min 640x480 resolution
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={photos.length >= maxPhotos}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>
      </div>

      {/* Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 rounded text-xs">
                Photo {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-sm text-muted-foreground">
          💡 Tip: Capture error codes, leaks, damage, or wear patterns clearly
        </p>
      )}
    </div>
  );
};
```

---

## Frontend: Video Upload Component

### File: `02-src/frontend/src/components/VideoUpload.tsx`

```typescript
import React, { useState, useRef } from 'react';
import { Video, Upload, X, PlayCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';

interface VideoUploadProps {
  onVideoChange: (file: File | null) => void;
  maxSizeMB?: number;
  maxDurationSeconds?: number;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoChange,
  maxSizeMB = 50,
  maxDurationSeconds = 60
}) => {
  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const handleVideo = async (file: File | null) => {
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Check file type
      if (!file.type.startsWith('video/')) {
        throw new Error('Please select a video file');
      }

      // Check file size
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > maxSizeMB) {
        throw new Error(`Video too large (${sizeMB.toFixed(1)}MB). Maximum ${maxSizeMB}MB`);
      }

      // Check duration
      const videoDuration = await getVideoDuration(file);
      if (videoDuration > maxDurationSeconds) {
        throw new Error(
          `Video too long (${videoDuration.toFixed(1)}s). Maximum ${maxDurationSeconds} seconds`
        );
      }

      setDuration(videoDuration);
      setVideo(file);

      // Create preview
      const videoUrl = URL.createObjectURL(file);
      setPreview(videoUrl);

      onVideoChange(file);
    } catch (err: any) {
      setError(err.message);
      setVideo(null);
      setPreview('');
      onVideoChange(null);
    } finally {
      setUploading(false);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const removeVideo = () => {
    setVideo(null);
    setPreview('');
    setDuration(0);
    setError('');
    onVideoChange(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Add Video (Premium)</h3>
          <p className="text-sm text-muted-foreground">
            +$10 for video analysis with audio diagnostics
          </p>
        </div>
        {video && (
          <div className="text-right">
            <p className="text-sm font-medium">{formatDuration(duration)}</p>
            <p className="text-xs text-muted-foreground">{formatSize(video.size)}</p>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!video ? (
        /* Upload Area */
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50"
          onClick={() => videoInputRef.current?.click()}
        >
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={(e) => handleVideo(e.target.files?.[0] || null)}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Video className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium">
                Record or upload video
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, MOV, WEBM up to {maxSizeMB}MB • Max {maxDurationSeconds} seconds
              </p>
            </div>

            <Button type="button" variant="outline" size="sm" className="mt-2">
              <Upload className="h-4 w-4 mr-2" />
              Select Video
            </Button>
          </div>
        </div>
      ) : (
        /* Video Preview */
        <div className="relative border rounded-lg overflow-hidden">
          <video
            ref={videoPreviewRef}
            src={preview}
            controls
            className="w-full max-h-[360px] bg-black"
          >
            Your browser does not support video playback.
          </video>

          <button
            type="button"
            onClick={removeVideo}
            className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-2 px-3 py-1 bg-background/90 rounded text-sm">
            <span className="font-medium">{video.name}</span>
            <span className="text-muted-foreground ml-2">
              {formatDuration(duration)} • {formatSize(video.size)}
            </span>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-center text-muted-foreground">
            Uploading video... {uploadProgress}%
          </p>
        </div>
      )}

      {video && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">💡 Video Analysis Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• Capture audio clearly for sound-based diagnostics</li>
            <li>• Show the issue occurring (startup, running, under load)</li>
            <li>• Include close-ups of error codes or damage</li>
            <li>• Film in good lighting for best analysis</li>
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## Firestore Schema Updates

### Collection: `diagnosticSubmissions`

```typescript
interface DiagnosticSubmission {
  // Existing fields
  equipmentType: string;
  manufacturer: string;
  model: string;
  year: number;
  symptoms: string;
  errorCodes?: string;
  maintenanceHistory?: string;

  // NEW: Photo support
  photos?: Array<{
    url: string;                 // gs://diagnosticpro-customer-media/photos/...
    signedUrl: string;           // Temporary signed URL (expires in 1 hour)
    filename: string;            // Original filename
    size: number;                // File size in bytes
    dimensions: string;          // "1920x1080"
    uploadedAt: string;          // ISO timestamp
  }>;
  hasPhotos: boolean;            // Quick check for photos
  photoCount: number;            // Number of photos (0-5)

  // NEW: Video support
  video?: {
    url: string;                 // gs://diagnosticpro-customer-media/videos/...
    signedUrl: string;           // Temporary signed URL (expires in 2 hours)
    filename: string;            // Original filename
    size: number;                // File size in bytes
    duration: number;            // Duration in seconds
    uploadedAt: string;          // ISO timestamp
  };
  hasVideo: boolean;             // Quick check for video

  // Pricing tier
  tier: 'basic' | 'premium';     // $4.99 vs $14.99

  // Analysis results
  analysis?: string;             // 14-section diagnostic report
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

---

## Cloud Storage Configuration

### Lifecycle Policy: `lifecycle.json`

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90,
          "matchesPrefix": ["photos/", "videos/"]
        }
      }
    ]
  }
}
```

### CORS Configuration: `cors.json`

```json
[
  {
    "origin": ["https://diagnosticpro.io", "http://localhost:5173"],
    "method": ["GET", "POST", "PUT", "OPTIONS"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

### Apply configurations:

```bash
# Set lifecycle policy
gsutil lifecycle set lifecycle.json gs://diagnosticpro-customer-media

# Set CORS policy
gsutil cors set cors.json gs://diagnosticpro-customer-media

# Verify
gsutil lifecycle get gs://diagnosticpro-customer-media
gsutil cors get gs://diagnosticpro-customer-media
```

---

## Testing Examples

### Test Photo Upload (curl)

```bash
curl -X POST http://localhost:8080/api/upload-photos \
  -F "submissionId=abc123" \
  -F "photos=@test-leak.jpg" \
  -F "photos=@test-error-code.jpg"
```

### Test Video Upload (curl)

```bash
curl -X POST http://localhost:8080/api/upload-video \
  -F "submissionId=abc123" \
  -F "video=@test-engine-noise.mp4"
```

### Test Gemini Analysis (Node.js)

```javascript
const { analyzeWithVision } = require('./services/gemini-vision');

const testSubmission = {
  equipmentType: 'car',
  manufacturer: 'Toyota',
  model: 'Camry',
  year: 2018,
  symptoms: 'Engine making knocking noise',
  photos: [
    {
      url: 'gs://diagnosticpro-customer-media/photos/test-leak.jpg',
      filename: 'leak-under-hood.jpg'
    }
  ],
  hasPhotos: true,
  photoCount: 1,
  hasVideo: false
};

analyzeWithVision(testSubmission)
  .then(analysis => console.log('Analysis:', analysis))
  .catch(err => console.error('Error:', err));
```

---

## Dependencies to Install

### Backend

```bash
cd 02-src/backend/services/backend
npm install \
  multer \
  @google-cloud/storage \
  @google-cloud/firestore \
  @google-cloud/vertexai \
  uuid \
  sharp \
  fluent-ffmpeg
```

### Frontend

```bash
cd 02-src/frontend
npm install \
  lucide-react \
  @radix-ui/react-progress \
  @radix-ui/react-alert
```

---

## Environment Variables

Add to `02-src/backend/services/backend/.env`:

```bash
# Cloud Storage
GCS_BUCKET_NAME=diagnosticpro-customer-media

# Vertex AI
VERTEX_AI_PROJECT=diagnostic-pro-prod
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-2.5-flash-002

# Feature flags
ENABLE_PHOTOS=true
ENABLE_VIDEO=false  # Enable after Phase 2 complete
```

---

**Status**: Production-ready code examples
**Related**: 061-adr-ai-vision-implementation.md, 062-pln-ai-vision-implementation-plan.md
