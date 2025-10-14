# Implementation Plan: AI Vision for DiagnosticPro

**Created**: 2025-10-13
**Status**: Draft for Review
**Related ADR**: 061-adr-ai-vision-implementation.md

## Executive Summary

This plan outlines the implementation of AI Vision capabilities (photo and video analysis) for DiagnosticPro using Vertex AI Gemini 2.5 Flash. The implementation is split into two phases:

- **Phase 1: Photo Analysis** (3 days) - Accept 1-5 photos per diagnostic, integrate into existing analysis
- **Phase 2: Video Analysis** (7 days) - Accept video uploads with audio analysis for sound-based diagnostics

**Total implementation time**: 10 days
**Cost per diagnostic**: +$0.0003 (photos) / +$0.50 (video)
**Revenue opportunity**: $14.99 premium tier for video (3x current $4.99 price)

## Phase 1: Photo Analysis (3 Days)

### Day 1: Backend Infrastructure & Storage

#### Morning (4 hours): Cloud Storage Setup
1. **Create storage bucket**
   ```bash
   gsutil mb -p diagnostic-pro-prod \
     -c STANDARD \
     -l us-central1 \
     -b on \
     gs://diagnosticpro-customer-media
   ```

2. **Configure lifecycle policy** (auto-delete after 90 days to save costs)
   ```json
   {
     "lifecycle": {
       "rule": [
         {
           "action": {"type": "Delete"},
           "condition": {"age": 90}
         }
       ]
     }
   }
   ```
   ```bash
   gsutil lifecycle set lifecycle.json gs://diagnosticpro-customer-media
   ```

3. **Set IAM permissions**
   ```bash
   # Backend service account needs write access
   gsutil iam ch serviceAccount:diagnosticpro-backend@diagnostic-pro-prod.iam.gserviceaccount.com:objectAdmin \
     gs://diagnosticpro-customer-media
   ```

4. **Configure CORS** for frontend uploads
   ```json
   [
     {
       "origin": ["https://diagnosticpro.io", "http://localhost:5173"],
       "method": ["GET", "POST", "PUT"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

#### Afternoon (4 hours): Backend Upload Endpoint

1. **Install dependencies**
   ```bash
   cd 02-src/backend/services/backend
   npm install multer @google-cloud/storage uuid
   ```

2. **Create upload endpoint** (see 063-ref-ai-vision-code-examples.md for full code)
   - File validation (type, size, count)
   - Upload to Cloud Storage
   - Generate signed URLs (1 hour expiry)
   - Store metadata in Firestore

3. **Update Firestore schema**
   ```javascript
   // Add to diagnosticSubmissions document
   {
     photos: [
       {
         url: 'https://storage.googleapis.com/...',
         filename: 'leak-under-hood.jpg',
         size: 2048576,
         uploadedAt: Timestamp,
         signedUrl: 'https://storage.googleapis.com/...?expires=...'
       }
     ],
     hasPhotos: true,
     photoCount: 3
   }
   ```

4. **Testing**
   - Unit tests for upload validation
   - Integration tests for Cloud Storage
   - Error handling (file too large, wrong format, storage failure)

**Deliverables**:
- ✅ Cloud Storage bucket configured
- ✅ Backend upload endpoint working
- ✅ Firestore schema updated
- ✅ Unit tests passing

---

### Day 2: Frontend Photo Upload UI

#### Morning (4 hours): Upload Component

1. **Create PhotoUpload component**
   Location: `02-src/frontend/src/components/PhotoUpload.tsx`

   Features:
   - Drag-and-drop zone
   - File browser button
   - Preview thumbnails (max 5 photos)
   - Remove individual photos
   - Progress indicators during upload
   - Error messages

2. **Validation logic**
   - Max 5 photos
   - Max 10MB per photo
   - Allowed formats: JPG, PNG, HEIC
   - Minimum resolution: 640x480

3. **Mobile camera integration**
   ```typescript
   // Use HTML5 capture attribute
   <input
     type="file"
     accept="image/*"
     capture="environment"  // Use rear camera
     multiple
   />
   ```

#### Afternoon (4 hours): DiagnosticForm Integration

1. **Add PhotoUpload to DiagnosticForm**
   - Place after equipment type selection
   - Optional field (not required)
   - Show helpful tips: "Upload photos of error codes, leaks, or damage"

2. **State management**
   ```typescript
   const [photos, setPhotos] = useState<File[]>([]);
   const [photoUrls, setPhotoUrls] = useState<string[]>([]);
   const [uploadProgress, setUploadProgress] = useState<number>(0);
   ```

3. **Upload flow**
   - Validate photos on selection
   - Preview locally before upload
   - Upload on form submission (before Stripe payment)
   - Show progress bar
   - Store URLs in submission

4. **Responsive design**
   - Desktop: 5 columns of thumbnails
   - Tablet: 3 columns
   - Mobile: 2 columns
   - Touch-friendly drag targets (min 44x44px)

**Deliverables**:
- ✅ PhotoUpload component completed
- ✅ Integrated into DiagnosticForm
- ✅ Mobile-responsive and touch-optimized
- ✅ Error handling and user feedback

---

### Day 3: Vertex AI Integration & Testing

#### Morning (4 hours): Gemini Vision Integration

1. **Update Gemini prompt** to accept images
   ```javascript
   // Modify 02-src/backend/services/backend/index.js
   const imageParts = photos.map(photo => ({
     inlineData: {
       mimeType: photo.mimeType,
       data: photo.base64Data
     }
   }));

   const prompt = {
     contents: [
       {
         role: 'user',
         parts: [
           { text: existingPromptText },
           ...imageParts  // Add images to prompt
         ]
       }
     ]
   };
   ```

2. **Enhance 14-section analysis** to reference photos
   - Add "VISUAL OBSERVATIONS" section
   - Reference photo numbers: "In photo #1, I observe..."
   - Correlate visual symptoms with described issues

3. **Update cost tracking**
   ```javascript
   // Vertex AI pricing
   const photoCost = photoCount * 0.0001; // $0.0003 per 3 images
   const textCost = 0.003; // Existing text analysis cost
   const totalCost = photoCost + textCost;
   ```

#### Afternoon (4 hours): End-to-End Testing

1. **Functional testing** (20 test cases)
   - Upload 1 photo
   - Upload 5 photos (max)
   - Try to upload 6 photos (should reject)
   - Upload oversized photo (should reject)
   - Upload wrong format (should reject)
   - Upload without photos (should work as before)
   - Test on mobile device
   - Test with slow network (3G simulation)

2. **AI analysis quality testing** (10 test diagnostics)
   - Engine leak photo
   - Error code screenshot
   - Damaged component
   - Wear pattern on tires
   - Fluid color comparison
   - Physical damage assessment

3. **Performance testing**
   - Upload latency: <5 seconds for 5 photos
   - Analysis time increase: <3 seconds
   - Total end-to-end: <12 minutes (existing target: <10 min)

4. **Error handling testing**
   - Storage quota exceeded
   - Network timeout during upload
   - Gemini API timeout
   - Invalid signed URL

**Deliverables**:
- ✅ Vertex AI integrated with photo support
- ✅ 14-section analysis enhanced with visual observations
- ✅ 20 functional tests passing
- ✅ 10 AI quality tests validated
- ✅ Performance targets met

---

### Phase 1 Deployment Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual QA completed (20 test cases)
- [ ] AI quality validated (10 diagnostics)
- [ ] Performance benchmarks met
- [ ] Error handling verified
- [ ] Mobile testing completed (iOS + Android)
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Firebase Hosting
- [ ] Monitoring dashboards updated
- [ ] Cost tracking enabled
- [ ] Rollback plan documented

**Phase 1 Go-Live**: After checklist completed

---

## Phase 2: Video Analysis (7 Days)

### Day 1: Video Infrastructure Setup

#### Morning (4 hours): Cloud Storage Video Configuration

1. **Update bucket lifecycle** for larger files
   ```json
   {
     "lifecycle": {
       "rule": [
         {
           "action": {"type": "Delete"},
           "condition": {
             "age": 90,
             "matchesPrefix": ["videos/"]
           }
         }
       ]
     }
   }
   ```

2. **Configure bucket for video**
   - Enable signed URL generation (1 hour expiry)
   - Set up separate /videos prefix
   - Configure automatic compression

3. **Cost optimization**
   - Store in Standard storage class (frequent access during analysis)
   - Auto-delete after 90 days
   - Estimated cost: $0.02 per GB-month

#### Afternoon (4 hours): Backend Video Upload

1. **Update upload endpoint** for video
   ```javascript
   const videoUpload = multer({
     storage: multer.memoryStorage(),
     limits: {
       fileSize: 50 * 1024 * 1024, // 50MB max
     },
     fileFilter: (req, file, cb) => {
       if (file.mimetype.startsWith('video/')) {
         cb(null, true);
       } else {
         cb(new Error('Only video files allowed'));
       }
     }
   });
   ```

2. **Video validation**
   - Max 50MB file size
   - Max 60 seconds duration
   - Allowed formats: MP4, MOV, WEBM
   - Check duration without full download (ffprobe)

3. **Metadata extraction**
   ```javascript
   const metadata = {
     duration: 45.3, // seconds
     resolution: '1920x1080',
     fps: 30,
     codec: 'h264',
     fileSize: 25165824
   };
   ```

**Deliverables**:
- ✅ Video storage configured
- ✅ Backend video endpoint working
- ✅ Duration validation implemented
- ✅ Metadata extraction working

---

### Day 2: Video Upload UI

#### Morning (4 hours): VideoUpload Component

1. **Create VideoUpload component**
   Location: `02-src/frontend/src/components/VideoUpload.tsx`

   Features:
   - Single video upload (not multiple)
   - Preview player with controls
   - Duration indicator
   - File size indicator
   - Replace/remove video
   - Progress bar during upload

2. **Mobile video capture**
   ```typescript
   <input
     type="file"
     accept="video/*"
     capture="environment"  // Use rear camera
   />
   ```

3. **Client-side validation**
   - Check duration before upload (use HTML5 video element)
   - Check file size
   - Show warning if >50MB or >60 seconds

#### Afternoon (4 hours): Premium Tier UI

1. **Update DiagnosticForm** for video option
   - Add toggle: "Include Video Analysis (+$10)"
   - Show video upload when enabled
   - Update price display: $4.99 → $14.99
   - Disable text-only submit when video selected

2. **Pricing logic**
   ```typescript
   const price = hasVideo ? 14.99 : 4.99;
   const priceId = hasVideo
     ? 'price_video_diagnostic'
     : 'price_text_diagnostic';
   ```

3. **Responsive design**
   - Desktop: Video player 640x360
   - Mobile: Full-width player
   - Show duration countdown: "45s / 60s max"

**Deliverables**:
- ✅ VideoUpload component completed
- ✅ Premium tier pricing integrated
- ✅ Mobile video capture working
- ✅ Client-side validation implemented

---

### Day 3-4: Vertex AI Video Analysis

#### Day 3 Morning (4 hours): Gemini Video Integration

1. **Update Gemini prompt** for video
   ```javascript
   const videoPart = {
     fileData: {
       mimeType: 'video/mp4',
       fileUri: `gs://diagnosticpro-customer-media/${videoPath}`
     }
   };

   const prompt = {
     contents: [
       {
         role: 'user',
         parts: [
           { text: enhancedPromptWithAudio },
           videoPart
         ]
       }
     ]
   };
   ```

2. **Audio analysis prompt enhancement**
   ```
   Analyze this video for:
   1. Visual symptoms (leaks, smoke, damage, wear patterns)
   2. Audio patterns (rattles, knocks, squeals, grinding)
   3. Temporal patterns (intermittent vs constant)
   4. Correlation between visual and audio symptoms

   For audio:
   - Identify engine knocks, bearing noise, belt squeals
   - Estimate frequency and rhythm
   - Compare to known failure patterns
   ```

#### Day 3 Afternoon (4 hours): Enhanced Analysis Framework

1. **Add video-specific sections** to 14-section framework
   - AUDIO ANALYSIS - Sound patterns and frequencies
   - VISUAL TIMELINE - Symptoms over video duration
   - MOTION ANALYSIS - Vibration, fluid movement, smoke behavior

2. **Transcription integration**
   - Gemini auto-transcribes audio
   - Include customer verbal description in analysis
   - Cross-reference with form fields

#### Day 4 Morning (4 hours): Batch Processing

1. **Parallel processing** for photos + video
   ```javascript
   const [photoAnalysis, videoAnalysis] = await Promise.all([
     analyzePhotos(photos),
     analyzeVideo(video)
   ]);

   const combinedAnalysis = mergeAnalyses(photoAnalysis, videoAnalysis);
   ```

2. **Timeout handling**
   - Video analysis can take 30-60 seconds
   - Set Cloud Run timeout to 540 seconds (max)
   - Show progress updates to customer

#### Day 4 Afternoon (4 hours): Premium Features

1. **Enhanced report for video diagnostics**
   - Timestamp references: "At 0:23, I observe..."
   - Audio waveform visualization
   - Frame-by-frame breakdown of key moments

2. **Cost tracking**
   ```javascript
   const videoCost = 0.50; // Per 60s video
   const photoCost = photoCount * 0.0001;
   const textCost = 0.003;
   const totalCost = videoCost + photoCost + textCost;
   const revenue = 14.99;
   const profit = revenue - totalCost - 0.75; // Stripe fees
   // Profit: $13.71
   ```

**Deliverables**:
- ✅ Gemini video analysis working
- ✅ Audio pattern recognition implemented
- ✅ Enhanced 14-section framework
- ✅ Premium features completed

---

### Day 5-6: Testing & Optimization

#### Day 5: Functional Testing

1. **Upload testing** (15 test cases)
   - Upload valid video
   - Upload oversized video (>50MB)
   - Upload too-long video (>60s)
   - Upload wrong format
   - Upload with slow network
   - Upload on mobile device
   - Cancel upload mid-stream

2. **Analysis testing** (10 test videos)
   - Engine knock audio
   - Transmission slip
   - Exhaust smoke color
   - Fluid leak location
   - Bearing noise frequency
   - Belt squeal pattern
   - Vibration analysis
   - Intermittent symptoms
   - Combined audio + visual issues

3. **Payment testing**
   - Stripe test mode: $14.99 charge
   - Verify webhook triggers analysis
   - Test refund scenario
   - Test failed payment

#### Day 6: Performance & Optimization

1. **Performance benchmarks**
   - Upload time: <30 seconds for 50MB
   - Analysis time: <60 seconds
   - Total end-to-end: <15 minutes (vs 10 min for text)

2. **Optimization**
   - Compress video on upload (reduce bandwidth)
   - Stream uploads to Cloud Storage (don't buffer in memory)
   - Cache video frames for faster analysis
   - Parallel processing where possible

3. **Load testing**
   - Simulate 10 concurrent video uploads
   - Monitor Cloud Run scaling
   - Verify no memory issues
   - Check for timeout errors

**Deliverables**:
- ✅ 15 upload tests passing
- ✅ 10 analysis tests validated
- ✅ Payment flow tested
- ✅ Performance optimized
- ✅ Load testing completed

---

### Day 7: Deployment & Monitoring

#### Morning (4 hours): Production Deployment

1. **Deploy backend**
   ```bash
   cd 02-src/backend/services/backend
   gcloud run deploy diagnosticpro-vertex-ai-backend \
     --source . \
     --region us-central1 \
     --project diagnostic-pro-prod \
     --memory 2Gi \
     --timeout 540s \
     --max-instances 10
   ```

2. **Deploy frontend**
   ```bash
   cd 02-src/frontend
   npm run build
   firebase deploy --only hosting
   ```

3. **Update Stripe products**
   - Create new price ID: `price_video_diagnostic` ($14.99)
   - Update webhook to handle both tiers

#### Afternoon (4 hours): Monitoring & Rollback Plan

1. **Set up monitoring**
   - Cloud Run metrics: upload success rate, analysis duration
   - Storage metrics: upload size, storage costs
   - Vertex AI metrics: API calls, tokens used, costs
   - Firestore metrics: write operations, read operations

2. **Alerting**
   - Upload failure rate >5%
   - Analysis timeout >10%
   - Storage costs >$50/day
   - Vertex AI costs >$100/day

3. **Feature flag**
   ```typescript
   const ENABLE_VIDEO = process.env.ENABLE_VIDEO === 'true';

   if (!ENABLE_VIDEO) {
     return res.status(503).json({
       error: 'Video uploads temporarily disabled'
     });
   }
   ```

4. **Rollback plan**
   - Disable feature flag (no redeployment needed)
   - Fall back to text + photo analysis
   - Refund video tier customers if analysis fails
   - Restore from previous Cloud Run revision

**Deliverables**:
- ✅ Backend deployed
- ✅ Frontend deployed
- ✅ Monitoring configured
- ✅ Alerts set up
- ✅ Rollback plan tested

---

## Post-Launch Plan

### Week 1: Monitoring & Iteration
- Monitor upload success rate (target: >95%)
- Track analysis quality (customer satisfaction surveys)
- Analyze cost per diagnostic (target: <$1.00)
- Gather customer feedback on video feature

### Week 2: Optimization
- Optimize video compression
- Tune Gemini prompts based on real results
- Add batch processing for multiple videos
- Implement video caching for faster repeat analysis

### Week 3: Marketing
- Update website copy to highlight video analysis
- Create demo videos showing video diagnostic process
- Email existing customers about new premium tier
- Run A/B test: $14.99 vs $19.99 pricing

### Month 2: Feature Expansion
- Support multiple videos (e.g., startup + running + under load)
- Add sound library comparison (e.g., "sounds like known bearing failure")
- Implement video trimming (customers send only relevant 10 seconds)
- Add slow-motion analysis for rapid events

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Video analysis timeout | High | Medium | Increase Cloud Run timeout to 540s, show progress updates |
| Storage costs exceed budget | Medium | Low | Auto-delete after 90 days, compress videos |
| Vertex AI rate limits | High | Low | Implement queue system, retry logic |
| Upload failures on mobile | Medium | Medium | Add network quality detection, suggest WiFi |
| Large video files crash browser | Medium | Low | Stream uploads, don't load entire file in memory |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption of $14.99 tier | High | Medium | A/B test pricing, offer $9.99 intro price |
| Video quality too poor for analysis | Medium | Medium | Add quality check, suggest better lighting/angle |
| Customers abuse unlimited revisions | Low | Low | Limit to 1 video per diagnostic submission |
| Competitors copy feature | Low | High | Focus on analysis quality, not just video acceptance |

---

## Success Metrics

### Phase 1: Photo Analysis (Target: Month 1)
- ✅ 50% of diagnostics include photos
- ✅ Upload success rate >95%
- ✅ Customer satisfaction >4.5/5
- ✅ Cost per diagnostic <$0.01 (photos only)

### Phase 2: Video Analysis (Target: Month 2)
- ✅ 10% of diagnostics upgrade to video tier
- ✅ Video upload success rate >90%
- ✅ Analysis completion rate >95%
- ✅ Cost per video diagnostic <$1.00
- ✅ Profit per video diagnostic >$12.00

### Revenue Impact (Target: Month 3)
- ✅ 100 diagnostics/month → 10 video tiers = +$100 revenue
- ✅ 500 diagnostics/month → 50 video tiers = +$500 revenue
- ✅ 1000 diagnostics/month → 100 video tiers = +$1000 revenue

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 Day 1 | 1 day | Backend infrastructure, Cloud Storage, upload endpoint |
| Phase 1 Day 2 | 1 day | Frontend photo upload UI, mobile camera integration |
| Phase 1 Day 3 | 1 day | Vertex AI integration, testing, deployment |
| **Phase 1 Total** | **3 days** | **Photo analysis live in production** |
| Phase 2 Day 1 | 1 day | Video infrastructure, backend video upload |
| Phase 2 Day 2 | 1 day | Video upload UI, premium tier pricing |
| Phase 2 Days 3-4 | 2 days | Vertex AI video analysis, audio patterns |
| Phase 2 Days 5-6 | 2 days | Testing, optimization, load testing |
| Phase 2 Day 7 | 1 day | Production deployment, monitoring |
| **Phase 2 Total** | **7 days** | **Video analysis live in production** |
| **Grand Total** | **10 days** | **Complete AI Vision implementation** |

---

## Next Steps

1. **Review this plan** - Confirm approach, timeline, and costs
2. **Review ADR** - 061-adr-ai-vision-implementation.md
3. **Review code examples** - 063-ref-ai-vision-code-examples.md
4. **Review cost analysis** - 064-anl-ai-vision-cost-benefit.md
5. **Approve implementation** - Greenlight Phase 1 start
6. **Schedule kick-off** - Set start date for Day 1

---

**Status**: Awaiting approval
**Owner**: Development Team
**Reviewer**: Jeremy (Product Owner)
