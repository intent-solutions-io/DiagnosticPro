# ADR-061: AI Vision Implementation for DiagnosticPro

**Date**: 2025-10-13
**Status**: Proposed

## Context

DiagnosticPro currently accepts text-based diagnostic submissions where customers describe their equipment issues through form fields (symptoms, error codes, history, etc.). While the 14-section Vertex AI Gemini analysis is comprehensive, it relies entirely on customer-provided descriptions, which can be:

1. **Incomplete** - Customers may not know what details are important
2. **Inaccurate** - Technical terminology may be misunderstood
3. **Subjective** - Visual symptoms (leaks, wear, damage) are difficult to describe in words
4. **Limited** - Cannot convey spatial relationships, patterns, or contextual clues

Competitors offering video diagnostic services charge $29.99-$49.99 per analysis. Adding AI vision capabilities would:
- Dramatically improve diagnostic accuracy
- Reduce back-and-forth clarifications
- Enable analysis of visual-only symptoms (leaks, smoke color, physical damage)
- Justify premium pricing tiers ($14.99-$29.99 for video diagnostics)
- Differentiate from text-only competitors

The technical foundation is already in place:
- **Vertex AI Gemini 2.5 Flash** - Already integrated, natively supports images and video
- **Cloud Storage** - Infrastructure exists for file uploads (currently PDFs)
- **Firestore** - Metadata storage already implemented
- **Express backend** - Can handle multipart file uploads

## Decision

**We will implement AI Vision capabilities in DiagnosticPro using Vertex AI Gemini 2.5 Flash for photo and video analysis.**

### Phase 1: Photo Analysis (Priority 1)
- Accept 1-5 photos per diagnostic submission
- Integrate photos into existing 14-section analysis framework
- Store photos in Cloud Storage with diagnostic submission reference
- Pricing: Keep at $4.99 (value-add to increase conversions)

### Phase 2: Video Analysis (Priority 2)
- Accept single video uploads (up to 60 seconds, max 50MB)
- Support audio analysis for sound-based diagnostics (engine noises, rattles)
- Premium tier pricing: $14.99 for video diagnostics
- Automatic video transcription and audio pattern analysis

### Technical Approach
- **Model**: Vertex AI Gemini 2.5 Flash (already deployed) - supports multimodal input
- **Storage**: Google Cloud Storage with signed URLs for secure access
- **Processing**: Backend Express API handles uploads, passes to Gemini with existing prompt
- **Frontend**: React file upload component with preview and validation

## Consequences

### Positive

1. **Dramatically improved diagnostic accuracy** - Visual context eliminates ambiguity
2. **Competitive differentiation** - Most competitors are text-only or charge $29.99+
3. **Premium pricing opportunity** - Video tier at $14.99 vs current $4.99
4. **Reduced support burden** - Fewer clarification emails and revisions
5. **Market expansion** - Visual symptoms open automotive, HVAC, appliance markets
6. **Minimal infrastructure changes** - Leverages existing Vertex AI integration
7. **Low per-unit cost** - $0.0003 per 3 images, $0.50 per 60-second video
8. **Faster development** - No new AI platform integration required

### Negative

1. **Increased storage costs** - ~$0.02 per diagnostic for photos, ~$0.10 for video
2. **Upload UX complexity** - Need to handle file validation, previews, progress bars
3. **Processing time increase** - Photos add ~2-5 seconds, video adds ~30-60 seconds
4. **Bandwidth costs** - Customers uploading 10-50MB files
5. **Moderation concerns** - Need to prevent inappropriate content uploads
6. **Privacy considerations** - Photos may contain PII, license plates, faces
7. **Mobile optimization** - Large file uploads on cellular connections

## Alternatives Considered

### Option 1: Google Cloud Vision API (Legacy)
- **Pros**:
  - Specialized for image analysis
  - Lower per-image cost ($0.0001 vs $0.0003)
  - Mature, stable API
- **Cons**:
  - No reasoning capability (label detection only)
  - No multimodal analysis (can't combine text + images)
  - No video support
  - Requires separate integration
  - Cannot leverage existing 14-section framework
- **Reason for rejection**: Cannot provide diagnostic reasoning, only image labels

### Option 2: Gemini 1.5 Pro
- **Pros**:
  - More accurate vision analysis
  - Better reasoning for complex diagnostics
  - Larger context window (2M tokens)
- **Cons**:
  - 20x more expensive ($0.006 per 3 images vs $0.0003)
  - Adds $10+ to cost per diagnostic
  - Slower processing (8-12 seconds vs 2-3 seconds)
  - Overkill for most diagnostic use cases
- **Reason for rejection**: Cost prohibitive, kills profitability at $4.99 price point

### Option 3: Gemini 2.0 Flash (Experimental)
- **Pros**:
  - Latest model with improved vision
  - Native video understanding
  - Better spatial reasoning
- **Cons**:
  - Experimental status (not production-ready)
  - Unstable API, breaking changes expected
  - Limited documentation
  - No SLA or uptime guarantees
  - Pricing model not finalized
- **Reason for rejection**: Too risky for production revenue-generating feature

### Option 4: External Video Analysis Service (Mux, Cloudinary)
- **Pros**:
  - Purpose-built for video processing
  - Automatic transcoding and optimization
  - CDN delivery for playback
- **Cons**:
  - Additional vendor dependency
  - Higher complexity (3rd party + Vertex AI)
  - Still need Vertex AI for analysis
  - Additional costs ($0.10-0.30 per video)
  - No diagnostic reasoning capability
- **Reason for rejection**: Adds complexity without solving core analysis problem

### Option 5: Delay AI Vision, Migrate to Terraform First
- **Pros**:
  - Infrastructure as Code improves long-term maintainability
  - Easier multi-environment management
  - Better disaster recovery
- **Cons**:
  - Zero customer value, zero revenue impact
  - 2-3 weeks of engineering time
  - Current infrastructure is stable
  - Distracts from revenue-generating features
  - No competitive pressure to migrate
- **Reason for rejection**: AI Vision generates revenue immediately, Terraform is internal improvement

## Implementation

### Phase 1: Photo Analysis (3 days - MVP)

#### Day 1: Backend Infrastructure
1. **Cloud Storage bucket setup**
   ```bash
   gsutil mb -p diagnostic-pro-prod -l us-central1 gs://diagnosticpro-customer-media
   gsutil lifecycle set lifecycle.json gs://diagnosticpro-customer-media
   ```

2. **Express upload endpoint**
   ```javascript
   // Add to 02-src/backend/services/backend/index.js
   const multer = require('multer');
   const storage = multer.memoryStorage();
   const upload = multer({
     storage,
     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per photo
     fileFilter: (req, file, cb) => {
       if (file.mimetype.startsWith('image/')) {
         cb(null, true);
       } else {
         cb(new Error('Only image files allowed'));
       }
     }
   });

   app.post('/api/upload-photos', upload.array('photos', 5), async (req, res) => {
     // See 063-ref-ai-vision-code-examples.md for full implementation
   });
   ```

3. **Firestore schema update**
   ```javascript
   // Add to diagnosticSubmissions document
   {
     photoUrls: [], // Array of signed Cloud Storage URLs
     photoMetadata: [], // Original filenames, sizes, upload timestamps
     hasPhotos: false
   }
   ```

#### Day 2: Frontend Photo Upload
1. **React component** - File input with drag-and-drop, preview thumbnails
2. **Validation** - Check file types, sizes, count limits
3. **Progress UI** - Upload progress bars, success/error states
4. **Mobile optimization** - Camera capture on mobile devices

#### Day 3: Vertex AI Integration
1. **Modify existing Gemini prompt** to accept image inputs
2. **Update 14-section framework** to reference visual observations
3. **Testing** - 50 test diagnostics with photos
4. **Deploy** to production

### Phase 2: Video Analysis (7 days total)

#### Days 1-2: Video Upload Infrastructure
1. **Cloud Storage bucket** with video-optimized lifecycle policies
2. **Backend endpoint** for video uploads (50MB limit, 60 second max)
3. **Firestore schema** for video metadata

#### Days 3-4: Frontend Video Upload
1. **Video upload component** with preview player
2. **Validation** - Duration check, file size, format validation
3. **Mobile camera integration** - Record directly from device

#### Days 5-6: Vertex AI Video Analysis
1. **Gemini video processing** - Audio + visual analysis
2. **Enhanced prompts** - Audio pattern recognition for engine noises
3. **Premium tier logic** - $14.99 pricing for video submissions

#### Day 7: Testing & Deployment
1. **End-to-end testing** with real videos
2. **Performance optimization** - Parallel processing, caching
3. **Production deployment** with monitoring

### Rollback Plan
If AI Vision causes issues:
1. **Feature flag** - Disable uploads without redeploying
2. **Graceful degradation** - Fall back to text-only analysis
3. **Data retention** - Keep photos/videos for 30 days, then auto-delete

## References

- [Vertex AI Gemini Vision Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/image-understanding)
- [Vertex AI Gemini Video Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/video-understanding)
- [Vertex AI Pricing](https://cloud.google.com/vertex-ai/pricing)
- Related: 062-pln-ai-vision-implementation-plan.md (detailed timeline)
- Related: 063-ref-ai-vision-code-examples.md (complete code)
- Related: 064-anl-ai-vision-cost-benefit.md (financial analysis)
- Current system: CLAUDE.md - 14-section Vertex AI Gemini framework
