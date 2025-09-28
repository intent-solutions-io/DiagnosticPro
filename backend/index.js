const express = require('express');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { GoogleAuth } = require('google-auth-library');
const stripe = require('stripe');
const crypto = require('crypto');

// Structured logging function
function logStructured(data) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'diagnosticpro-vertex-ai-backend',
    ...data
  }));
}

// Request ID middleware
function attachRequestId(req, res, next) {
  req.reqId = req.headers['x-request-id'] || crypto.randomUUID();
  next();
}

// Schema validation for /saveSubmission payload - FLEXIBLE VALIDATION
// Only validates required minimum fields, allows all other fields to pass through
function validateSubmissionPayload(payload) {
  const errors = [];

  // Required fields (minimum for AI analysis)
  const requiredFields = ['equipmentType', 'model', 'symptoms'];

  // Check for required fields only - allow all other fields to pass through
  for (const field of requiredFields) {
    if (!payload[field] || typeof payload[field] !== 'string' || payload[field].trim() === '') {
      errors.push(`Field '${field}' is required and must be a non-empty string`);
    }
  }

  // NO FIELD RESTRICTIONS - Accept any additional fields from UI
  // This allows for future UI fields without backend changes

  // Only validate contact structure if present (optional field)
  if (payload.contact && (typeof payload.contact !== 'object' || Array.isArray(payload.contact))) {
    errors.push('Field \'contact\' must be an object if provided');
  }

  return errors;
}

const app = express();
const PORT = process.env.PORT || 8080;

// Validate required environment variables
const REPORT_BUCKET = process.env.REPORT_BUCKET;
if (!REPORT_BUCKET) {
  throw new Error('REPORT_BUCKET environment variable is required');
}

// Initialize services
const firestore = new Firestore();
const storage = new Storage();
const reportsBucket = storage.bucket(REPORT_BUCKET);
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: ['https://diagnosticpro.io', 'https://diagnostic-pro-prod.web.app', 'https://diagpro-gw-3tbssksx.uc.gateway.dev'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'x-dp-reqid', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'diagnosticpro-vertex-ai-backend',
    version: '1.0.0'
  });
});

app.use(express.json({ limit: '10mb' }));
app.use(attachRequestId);

// ENDPOINT: Save submission BEFORE payment
app.post('/saveSubmission', async (req, res) => {
  const phase = 'saveSubmission';
  let submissionId = null;

  try {
    const { payload } = req.body;

    // Validate payload schema
    const validationErrors = validateSubmissionPayload(payload);
    if (validationErrors.length > 0) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        error: { code: 'VALIDATION_ERROR', message: validationErrors.join('; '), validationErrors }
      });
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Generate submission ID
    submissionId = `diag_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Prepare Firestore document - SAVE COMPLETE PAYLOAD
    // Store entire payload from UI to handle current and future fields
    const submissionData = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      priceCents: 499,
      payload: {
        ...payload, // Spread entire payload to capture ALL UI fields
        // Ensure empty strings for missing optional fields for consistency
        make: payload.make || '',
        year: payload.year || '',
        notes: payload.notes || ''
      },
      reqId: req.reqId,
      uiVersion: '1.0', // Track UI version for future compatibility
      payloadKeyCount: Object.keys(payload).length // Track number of fields for debugging
    };

    // Save to Firestore
    await firestore.collection('submissions').doc(submissionId).set(submissionData);

    // Success logging
    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId,
      payloadKeys: Object.keys(payload)
    });

    res.json({ submissionId });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to save submission',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ENDPOINT: Create Stripe checkout session for $4.99
app.post('/createCheckoutSession', async (req, res) => {
  const phase = 'createCheckoutSession';
  let submissionId = req.body.submissionId;

  try {
    if (!submissionId) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        error: { code: 'MISSING_SUBMISSION_ID', message: 'submissionId is required' }
      });
      return res.status(400).json({
        error: 'submissionId is required',
        code: 'MISSING_SUBMISSION_ID'
      });
    }

    // Verify submission exists and status is valid
    const submissionRef = await firestore.collection('submissions').doc(submissionId).get();
    if (!submissionRef.exists) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        submissionId,
        error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' }
      });
      return res.status(404).json({
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND'
      });
    }

    const submissionData = submissionRef.data();
    if (!['pending', 'failed'].includes(submissionData.status)) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        submissionId,
        error: { code: 'INVALID_STATUS', message: `Invalid submission status: ${submissionData.status}` }
      });
      return res.status(400).json({
        error: `Invalid submission status: ${submissionData.status}`,
        code: 'INVALID_STATUS'
      });
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DiagnosticPro — Universal Equipment Diagnostic Report',
            description: 'Professional diagnostic analysis and repair recommendations'
          },
          unit_amount: 499 // $4.99 USD = 499 cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `https://diagnosticpro.io/success?submission_id=${submissionId}`,
      cancel_url: `https://diagnosticpro.io/cancel?submission_id=${submissionId}`,
      metadata: {
        submissionId: submissionId
      }
    });

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId,
      sessionId: session.id
    });

    res.json({ url: session.url, sessionId: session.id });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: {
        code: 'STRIPE_ERROR',
        message: error.message,
        type: error.type,
        statusCode: error.statusCode,
        rawError: error.raw ? error.raw.message : null
      }
    });
    res.status(500).json({
      error: 'Failed to create checkout session',
      code: 'STRIPE_ERROR',
      details: error.message
    });
  }
});

// ENDPOINT: Check analysis status
app.post('/analysisStatus', async (req, res) => {
  try {
    const { submissionId } = req.body;

    const submissionRef = await firestore.collection('submissions').doc(submissionId).get();
    if (!submissionRef.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionRef.data();
    const status = submissionData.status || 'pending';

    res.json({ status });

  } catch (error) {
    console.error('❌ Analysis status error:', error);
    res.status(500).json({ error: 'Failed to get analysis status' });
  }
});

// ENDPOINT: Manual analyze diagnostic (idempotent)
app.post('/analyzeDiagnostic', async (req, res) => {
  try {
    const { submissionId } = req.body;

    const submissionRef = await firestore.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();

    // Check if already processing or ready
    if (submissionData.status === 'processing' || submissionData.status === 'ready') {
      return res.json({ status: submissionData.status, message: 'Already processed' });
    }

    // Start analysis
    await processAnalysis(submissionId, submissionData.payload);

    res.json({ status: 'processing', message: 'Analysis started' });

  } catch (error) {
    console.error('❌ Analyze diagnostic error:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// ENDPOINT: Stable view URL - streams PDF or redirects to signed URL
app.get('/view/:submissionId', async (req, res) => {
  const phase = 'stableViewUrl';
  const submissionId = req.params.submissionId;

  try {
    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    // Check if submission exists and is ready
    const submissionRef = await firestore.collection('submissions').doc(submissionId).get();
    if (!submissionRef.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionRef.data();
    if (submissionData.status !== 'ready') {
      return res.status(400).json({
        error: 'Report not ready yet',
        status: submissionData.status
      });
    }

    // Check if analysis record exists
    const analysisRef = await firestore.collection('analysis').doc(submissionId).get();
    if (!analysisRef.exists) {
      return res.status(404).json({ error: 'Analysis record not found' });
    }

    const analysisData = analysisRef.data();
    const reportPath = analysisData.reportPath;

    if (!reportPath) {
      return res.status(404).json({
        error: 'Report path not found',
        code: 'MISSING_REPORT_PATH'
      });
    }

    // Generate fresh signed URL and redirect
    const file = reportsBucket.file(reportPath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'application/pdf'
    });

    logStructured({
      phase: 'viewReport',
      status: 'ok',
      bucket: REPORT_BUCKET,
      reportPath,
      submissionId
    });

    // Update analysis record with stable view URL for tracking
    await firestore.collection('analysis').doc(submissionId).update({
      publicViewUrl: `/view/${submissionId}`,
      lastViewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId || 'anonymous',
      submissionId
    });

    // Redirect to signed URL for immediate viewing
    res.redirect(302, url);

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId || 'anonymous',
      submissionId,
      error: { code: 'STABLE_VIEW_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to load report view',
      code: 'STABLE_VIEW_ERROR'
    });
  }
});

// ENDPOINT: Get Checkout Session details (for Buy Button flow)
app.get('/checkout/session', async (req, res) => {
  const phase = 'getCheckoutSession';
  const sessionId = req.query.id;

  try {
    if (!sessionId) {
      return res.status(400).json({ error: 'session id query parameter required' });
    }

    if (!/^cs_/.test(sessionId)) {
      return res.status(400).json({ error: 'invalid session id' });
    }

    // Retrieve session from Stripe
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      sessionId: session.id,
      clientReferenceId: session.client_reference_id
    });

    // Return only what we need (with submissionId alias for clarity)
    const submissionId = session.client_reference_id || (session.metadata && session.metadata.submissionId) || null;

    res.json({
      id: session.id,
      status: session.status,
      submissionId,
      client_reference_id: submissionId  // Alias for backward compatibility
    });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      sessionId,
      error: { code: 'CHECKOUT_SESSION_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to retrieve checkout session',
      code: 'CHECKOUT_SESSION_ERROR'
    });
  }
});

// ENDPOINT: Get signed URLs (GET query param version for gateway)
app.get('/reports/signed-url', async (req, res) => {
  const phase = 'getSignedUrl';
  let submissionId = req.query.submissionId;

  try {
    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId query parameter is required' });
    }

    // Check if submission exists and is ready
    const submissionRef = await firestore.collection('submissions').doc(submissionId).get();
    if (!submissionRef.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionRef.data();
    if (submissionData.status !== 'ready') {
      return res.status(400).json({
        error: 'Report not ready yet',
        status: submissionData.status
      });
    }

    // Check if analysis record exists
    const analysisRef = await firestore.collection('analysis').doc(submissionId).get();
    if (!analysisRef.exists) {
      return res.status(404).json({ error: 'Analysis record not found' });
    }

    const analysisData = analysisRef.data();
    const reportPath = analysisData.reportPath;

    if (!reportPath) {
      return res.status(404).json({
        error: 'Report path not found',
        code: 'MISSING_REPORT_PATH'
      });
    }

    // Generate signed URLs (15 minutes)
    const file = reportsBucket.file(reportPath);

    const [downloadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `attachment; filename="${submissionId}.pdf"`,
      contentType: 'application/pdf'
    });

    const [viewUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `inline; filename="${submissionId}.pdf"`,
      contentType: 'application/pdf'
    });

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId
    });

    res.json({
      downloadUrl,
      viewUrl,
      expiresInSeconds: 900
    });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'SIGNED_URL_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to generate signed URLs',
      code: 'SIGNED_URL_ERROR'
    });
  }
});

// ENDPOINT: Get report status (idempotent check)
app.get('/reports/status', async (req, res) => {
  const phase = 'reportStatus';
  const submissionId = String(req.query.submissionId || '');

  try {
    if (!submissionId || !submissionId.startsWith('diag_')) {
      return res.status(400).json({ error: 'Invalid submissionId', code: 'BAD_ID' });
    }

    // Check if PDF exists in storage
    const file = reportsBucket.file(`reports/${submissionId}.pdf`);
    const [exists] = await file.exists();

    if (exists) {
      // Generate signed URLs
      const [downloadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
        responseDisposition: `attachment; filename="${submissionId}.pdf"`,
        contentType: 'application/pdf'
      });

      const [viewUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
        responseDisposition: `inline; filename="${submissionId}.pdf"`,
        contentType: 'application/pdf'
      });

      logStructured({
        phase,
        status: 'ready',
        reqId: req.reqId,
        submissionId
      });

      return res.json({ status: 'ready', downloadUrl, viewUrl });
    }

    // Check submission status in Firestore
    const submissionRef = await firestore.collection('submissions').doc(submissionId).get();
    if (submissionRef.exists) {
      const submissionData = submissionRef.data();
      logStructured({
        phase,
        status: 'processing',
        reqId: req.reqId,
        submissionId,
        submissionStatus: submissionData.status
      });
      return res.status(202).json({ status: 'processing', submissionStatus: submissionData.status });
    }

    logStructured({
      phase,
      status: 'not_found',
      reqId: req.reqId,
      submissionId
    });

    return res.status(404).json({ status: 'not_found' });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'STATUS_CHECK_ERROR', message: error.message }
    });
    res.status(500).json({ error: 'Failed to check status', code: 'STATUS_CHECK_ERROR' });
  }
});

// ENDPOINT: Ensure report generation (idempotent kick)
app.post('/reports/ensure', async (req, res) => {
  const phase = 'reportEnsure';
  const submissionId = String(req.body.submissionId || '');

  try {
    if (!submissionId || !submissionId.startsWith('diag_')) {
      return res.status(400).json({ error: 'Invalid submissionId', code: 'BAD_ID' });
    }

    // Check if PDF already exists
    const file = reportsBucket.file(`reports/${submissionId}.pdf`);
    const [exists] = await file.exists();

    if (exists) {
      logStructured({
        phase,
        status: 'already_ready',
        reqId: req.reqId,
        submissionId
      });
      return res.json({ status: 'ready' });
    }

    // Get submission data for reprocessing
    const submissionRef = firestore.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found', code: 'NOT_FOUND' });
    }

    const submissionData = submissionDoc.data();

    // Update status to requeued if failed
    if (submissionData.status === 'failed' || submissionData.status === 'error') {
      await submissionRef.update({
        status: 'requeued',
        updatedAt: new Date().toISOString(),
        retryCount: (submissionData.retryCount || 0) + 1
      });

      logStructured({
        phase,
        status: 'requeued',
        reqId: req.reqId,
        submissionId,
        retryCount: (submissionData.retryCount || 0) + 1
      });

      // Trigger analysis asynchronously
      processAnalysis(submissionId, submissionData.payload, req.reqId).catch(error => {
        logStructured({
          phase: 'ensureAnalyze',
          status: 'error',
          reqId: req.reqId,
          submissionId,
          error: { code: 'ENSURE_ERROR', message: error.message }
        });
      });
    } else {
      logStructured({
        phase,
        status: 'already_processing',
        reqId: req.reqId,
        submissionId,
        currentStatus: submissionData.status
      });
    }

    return res.status(202).json({ status: 'processing' });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'ENSURE_ERROR', message: error.message }
    });
    res.status(500).json({ error: 'Failed to ensure report', code: 'ENSURE_ERROR' });
  }
});

// ENDPOINT: Get signed download URL for completed PDF report (POST version for backward compat)
app.post('/getDownloadUrl', async (req, res) => {
  const phase = 'getDownloadUrl';
  let submissionId = req.body.submissionId;

  try {

    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    // Check if submission exists and is ready
    const submissionRef = await firestore.collection('submissions').doc(submissionId).get();
    if (!submissionRef.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionRef.data();
    if (submissionData.status !== 'ready') {
      return res.status(400).json({
        error: 'Report not ready yet',
        status: submissionData.status
      });
    }

    // Check if analysis record exists
    const analysisRef = await firestore.collection('analysis').doc(submissionId).get();
    if (!analysisRef.exists) {
      return res.status(404).json({ error: 'Analysis record not found' });
    }

    const analysisData = analysisRef.data();
    const reportPath = analysisData.reportPath; // Should be "reports/{submissionId}.pdf"

    if (!reportPath) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        submissionId,
        error: { code: 'MISSING_REPORT_PATH', message: 'Report path not found in analysis record' }
      });
      return res.status(404).json({
        error: 'Report path not found',
        code: 'MISSING_REPORT_PATH'
      });
    }

    // Generate signed URLs (15 minutes = 900 seconds)
    const file = reportsBucket.file(reportPath);

    const [downloadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `attachment; filename="${submissionId}.pdf"`,
      contentType: 'application/pdf'
    });

    const [viewUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `inline; filename="${submissionId}.pdf"`,
      contentType: 'application/pdf'
    });

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId
    });

    res.json({
      downloadUrl,
      viewUrl,
      expiresInSeconds: 900,
      submissionId,
      reportPath
    });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'DOWNLOAD_URL_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to generate download URL',
      code: 'DOWNLOAD_URL_ERROR'
    });
  }
});

// ENDPOINT: Stripe webhook forward (PRIVATE - called by webhook service)
app.post('/stripeWebhookForward', async (req, res) => {
  const phase = 'stripeWebhook';
  let submissionId = null;
  let eventId = null;

  try {
    // Stripe sends event directly in body, not wrapped in {event: ...}
    const event = req.body.event || req.body;

    if (!event || !event.id) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        error: { code: 'INVALID_EVENT', message: 'Missing event data' },
        bodyKeys: Object.keys(req.body || {})
      });
      return res.status(400).json({
        error: 'Invalid event data',
        code: 'INVALID_EVENT'
      });
    }

    eventId = event.id;

    logStructured({
      phase: 'stripeWebhook',
      status: 'received',
      reqId: req.reqId,
      eventId: event.id,
      eventType: event.type
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Check both metadata.submissionId and client_reference_id
      submissionId = session.metadata?.submissionId || session.client_reference_id;

      if (!submissionId) {
        logStructured({
          phase,
          status: 'error',
          reqId: req.reqId,
          eventId,
          error: { code: 'MISSING_SUBMISSION_ID', message: 'No submissionId in session metadata' }
        });
        return res.status(400).json({
          error: 'No submissionId in metadata',
          code: 'MISSING_SUBMISSION_ID'
        });
      }

      // Update submission to paid
      const submissionRef = firestore.collection('submissions').doc(submissionId);
      await submissionRef.update({
        status: 'paid',
        updatedAt: new Date().toISOString(),
        stripeSessionId: session.id,
        paidAt: new Date().toISOString(),
        amountPaidCents: 499
      });

      // Create analysis record
      await firestore.collection('analysis').doc(submissionId).set({
        updatedAt: new Date().toISOString(),
        status: 'queued',
        model: 'gemini-1.5-flash-002',
        reqId: req.reqId
      });

      logStructured({
        phase,
        status: 'ok',
        reqId: req.reqId,
        submissionId,
        eventId,
        sessionId: session.id
      });

      // Start analysis process (async)
      const submissionDoc = await submissionRef.get();
      if (submissionDoc.exists) {
        const submissionData = submissionDoc.data();
        processAnalysis(submissionId, submissionData.payload, req.reqId).catch(error => {
          logStructured({
            phase: 'queueAnalyze',
            status: 'error',
            reqId: req.reqId,
            submissionId,
            error: { code: 'ANALYSIS_QUEUE_ERROR', message: error.message }
          });
        });
      }
    } else {
      logStructured({
        phase,
        status: 'ignored',
        reqId: req.reqId,
        eventId,
        eventType: event.type,
        message: 'Event type not handled'
      });
    }

    res.json({ received: true });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      eventId,
      error: { code: 'WEBHOOK_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Webhook processing failed',
      code: 'WEBHOOK_ERROR'
    });
  }
});

// FUNCTION: Process AI analysis
async function processAnalysis(submissionId, payload, reqId) {
  try {
    logStructured({
      phase: 'runAnalyze',
      status: 'started',
      reqId,
      submissionId
    });

    // Update submission status to processing
    await firestore.collection('submissions').doc(submissionId).update({
      status: 'processing',
      updatedAt: new Date().toISOString(),
      processingStartedAt: new Date().toISOString()
    });

    // Update analysis status to running
    await firestore.collection('analysis').doc(submissionId).update({
      status: 'running',
      updatedAt: new Date().toISOString()
    });

    // Call Vertex AI Gemini
    const analysis = await callVertexAI(payload);

    // Generate PDF report
    const pdfContent = await generatePDFReport(submissionId, analysis, payload);

    // Upload to Cloud Storage
    const fileName = `reports/${submissionId}.pdf`;
    const file = reportsBucket.file(fileName);

    await file.save(pdfContent, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          submissionId: submissionId,
          createdAt: new Date().toISOString()
        }
      }
    });

    logStructured({
      phase: 'saveReport',
      status: 'ok',
      bucket: REPORT_BUCKET,
      path: fileName,
      submissionId,
      size: pdfContent.length
    });

    // Update analysis to ready
    await firestore.collection('analysis').doc(submissionId).update({
      status: 'ready',
      updatedAt: new Date().toISOString(),
      reportPath: fileName
    });

    // Update submission to ready
    await firestore.collection('submissions').doc(submissionId).update({
      status: 'ready',
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });

    logStructured({
      phase: 'runAnalyze',
      status: 'ok',
      reqId,
      submissionId
    });

    logStructured({
      phase: 'writeReport',
      status: 'ok',
      reqId,
      submissionId,
      reportPath: fileName,
      reportSize: pdfContent.length
    });

  } catch (error) {
    logStructured({
      phase: 'runAnalyze',
      status: 'error',
      reqId,
      submissionId,
      error: { code: 'ANALYSIS_ERROR', message: error.message }
    });

    // Update submission to failed
    await firestore.collection('submissions').doc(submissionId).update({
      status: 'failed',
      updatedAt: new Date().toISOString(),
      lastError: error.message,
      errorAt: new Date().toISOString()
    });

    // Update analysis to failed
    await firestore.collection('analysis').doc(submissionId).update({
      status: 'failed',
      updatedAt: new Date().toISOString(),
      lastError: error.message
    });

    throw error;
  }
}

// FUNCTION: Call Vertex AI Gemini
async function callVertexAI(payload) {
  const { VertexAI } = require('@google-cloud/vertexai');

  const vertex = new VertexAI({
    project: process.env.GCP_PROJECT || 'diagnostic-pro-prod',
    location: process.env.VAI_LOCATION || 'us-central1'
  });

  const model = vertex.getGenerativeModel({
    model: process.env.VAI_MODEL || 'gemini-2.0-flash-exp'
  });

  const prompt = `You are a professional diagnostic technician. Analyze this equipment diagnostic data and provide a comprehensive report.

Equipment Data:
${JSON.stringify(payload, null, 2)}

Provide analysis in this JSON format:
{
  "summary": "Brief overview of the issue",
  "root_causes": ["Primary cause", "Secondary cause"],
  "confidence": 0.85,
  "red_flags": ["Safety concern 1", "Critical issue 2"],
  "questions": ["Question to ask customer"],
  "cost_ranges": [{"repair": "Description", "min": 100, "max": 500}],
  "recommendations": ["Step 1", "Step 2"],
  "parts_needed": ["Part name", "Part number if applicable"],
  "labor_estimate": "2-4 hours",
  "difficulty": "Intermediate",
  "tools_required": ["Tool 1", "Tool 2"]
}`;

  const response = await model.generateContent(prompt);
  const text = response.response.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(text);
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return {
      summary: "Analysis completed with parsing issues",
      root_causes: ["Unable to parse detailed analysis"],
      confidence: 0.5,
      red_flags: [],
      questions: [],
      cost_ranges: [],
      recommendations: ["Contact technical support for detailed analysis"],
      parts_needed: [],
      labor_estimate: "Unknown",
      difficulty: "Unknown",
      tools_required: []
    };
  }
}

// FUNCTION: Generate PDF report using pdfkit
async function generatePDFReport(submissionId, analysis, payload) {
  const PDFDocument = require('pdfkit');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Buffer to collect PDF data
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
         .text('DIAGNOSTICPRO UNIVERSAL EQUIPMENT DIAGNOSTIC REPORT', { align: 'center' });

      doc.moveDown();
      doc.fontSize(10).font('Helvetica')
         .text('═'.repeat(80), { align: 'center' });

      // Report metadata
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold')
         .text(`Submission ID: ${submissionId}`)
         .text(`Date: ${new Date().toLocaleDateString()}`)
         .text(`Price: $4.99 USD`)
         .text(`Report Generated: ${new Date().toLocaleString()}`);

      doc.moveDown();

      // Equipment Information - DYNAMIC FIELD RENDERING
      doc.fontSize(14).font('Helvetica-Bold')
         .text('EQUIPMENT INFORMATION', { underline: true });
      doc.moveDown(0.5);

      // Render all payload fields dynamically
      const fieldOrder = ['equipmentType', 'make', 'model', 'year', 'symptoms', 'notes'];
      const fieldLabels = {
        equipmentType: 'Equipment Type',
        make: 'Make',
        model: 'Model',
        year: 'Year',
        symptoms: 'Symptoms/Issues',
        notes: 'Additional Notes'
      };

      // Render ordered fields first
      fieldOrder.forEach(field => {
        if (payload[field] && payload[field].toString().trim()) {
          const label = fieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1);
          doc.fontSize(11).font('Helvetica')
             .text(`${label}: ${payload[field]}`);
        }
      });

      // Render any additional fields not in the ordered list
      Object.keys(payload).forEach(field => {
        if (!fieldOrder.includes(field) && payload[field] &&
            payload[field].toString().trim() &&
            typeof payload[field] !== 'object') {
          const label = field.charAt(0).toUpperCase() + field.slice(1);
          doc.fontSize(11).font('Helvetica')
             .text(`${label}: ${payload[field]}`);
        }
      });

      doc.moveDown();

      // Analysis Summary
      doc.fontSize(14).font('Helvetica-Bold')
         .text('DIAGNOSTIC ANALYSIS', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica')
         .text(`Summary: ${analysis.summary || 'Analysis completed successfully'}`);

      if (analysis.confidence) {
        doc.text(`Confidence Level: ${Math.round(analysis.confidence * 100)}%`);
      }

      doc.moveDown();

      // Root Causes
      if (analysis.root_causes && analysis.root_causes.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text('ROOT CAUSES');
        doc.moveDown(0.5);

        analysis.root_causes.forEach((cause, index) => {
          doc.fontSize(11).font('Helvetica')
             .text(`${index + 1}. ${cause}`);
        });
        doc.moveDown();
      }

      // Red Flags (Safety Concerns)
      if (analysis.red_flags && analysis.red_flags.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('red')
           .text('⚠ SAFETY CONCERNS');
        doc.fillColor('black').moveDown(0.5);

        analysis.red_flags.forEach((flag, index) => {
          doc.fontSize(11).font('Helvetica')
             .text(`${index + 1}. ${flag}`);
        });
        doc.moveDown();
      }

      // Recommendations
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text('RECOMMENDED ACTIONS');
        doc.moveDown(0.5);

        analysis.recommendations.forEach((rec, index) => {
          doc.fontSize(11).font('Helvetica')
             .text(`${index + 1}. ${rec}`);
        });
        doc.moveDown();
      }

      // Cost Estimates
      if (analysis.cost_ranges && analysis.cost_ranges.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text('ESTIMATED REPAIR COSTS');
        doc.moveDown(0.5);

        analysis.cost_ranges.forEach(cost => {
          doc.fontSize(11).font('Helvetica')
             .text(`${cost.repair}: $${cost.min} - $${cost.max}`);
        });
        doc.moveDown();
      }

      // Parts and Tools
      if (analysis.parts_needed && analysis.parts_needed.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text('PARTS NEEDED');
        doc.moveDown(0.5);

        analysis.parts_needed.forEach((part, index) => {
          doc.fontSize(11).font('Helvetica')
             .text(`• ${part}`);
        });
        doc.moveDown();
      }

      if (analysis.tools_required && analysis.tools_required.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text('TOOLS REQUIRED');
        doc.moveDown(0.5);

        analysis.tools_required.forEach((tool, index) => {
          doc.fontSize(11).font('Helvetica')
             .text(`• ${tool}`);
        });
        doc.moveDown();
      }

      // Labor Estimate and Difficulty
      if (analysis.labor_estimate || analysis.difficulty) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text('WORK DETAILS');
        doc.moveDown(0.5);

        if (analysis.labor_estimate) {
          doc.fontSize(11).font('Helvetica')
             .text(`Estimated Labor: ${analysis.labor_estimate}`);
        }
        if (analysis.difficulty) {
          doc.text(`Difficulty Level: ${analysis.difficulty}`);
        }
        doc.moveDown();
      }

      // Questions for Customer
      if (analysis.questions && analysis.questions.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text('FOLLOW-UP QUESTIONS');
        doc.moveDown(0.5);

        analysis.questions.forEach((question, index) => {
          doc.fontSize(11).font('Helvetica')
             .text(`${index + 1}. ${question}`);
        });
        doc.moveDown();
      }

      // Footer
      doc.moveDown();
      doc.fontSize(10).font('Helvetica')
         .text('─'.repeat(80), { align: 'center' });

      doc.moveDown();
      doc.fontSize(9).font('Helvetica')
         .text('Generated by DiagnosticPro AI System', { align: 'center' })
         .text(`Report ID: ${submissionId}`, { align: 'center' })
         .text('© 2025 Intent Solutions Inc. All rights reserved.', { align: 'center' });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DiagnosticPro Backend running on port ${PORT}`);
  console.log(`💰 Price: $4.99 USD (499 cents)`);
  console.log(`🔗 Project: diagnostic-pro-prod`);
  console.log(`📁 Storage: gs://${REPORT_BUCKET}`);
  console.log('\nEndpoints:');
  console.log('  POST /saveSubmission');
  console.log('  POST /createCheckoutSession');
  console.log('  POST /analysisStatus');
  console.log('  POST /analyzeDiagnostic');
  console.log('  POST /getDownloadUrl');
  console.log('  POST /stripeWebhookForward (PRIVATE)');
  console.log('  GET  /healthz');
});

module.exports = app;