const express = require('express');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { GoogleAuth } = require('google-auth-library');
const stripe = require('stripe');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { generateDiagnosticProPDF } = require('./reportPdf.js');
const { loadAllSecrets } = require('./secrets.js');

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

// Global variables for services (initialized after secrets are loaded)
let firestore;
let storage;
let reportsBucket;
let stripeClient;
let REPORT_BUCKET;
let STRIPE_WEBHOOK_SECRET;

// Initialize services with secrets from Secret Manager
async function initializeServices() {
  try {
    // Load secrets from Google Secret Manager
    const secrets = await loadAllSecrets();

    // Set global variables
    REPORT_BUCKET = secrets.REPORT_BUCKET;
    STRIPE_WEBHOOK_SECRET = secrets.STRIPE_WEBHOOK_SECRET;

    // Initialize services
    firestore = new Firestore();
    storage = new Storage();
    reportsBucket = storage.bucket(REPORT_BUCKET);
    stripeClient = stripe(secrets.STRIPE_SECRET_KEY);

    logStructured({
      level: 'info',
      message: 'Services initialized successfully',
      bucket: REPORT_BUCKET
    });

    return true;
  } catch (error) {
    logStructured({
      level: 'error',
      message: 'Failed to initialize services',
      error: error.message
    });
    throw error;
  }
}

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
    await firestore.collection('diagnosticSubmissions').doc(submissionId).set(submissionData);

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
    const submissionRef = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
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
      client_reference_id: submissionId,
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

    const submissionRef = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
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

    const submissionRef = await firestore.collection('diagnosticSubmissions').doc(submissionId);
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
    const submissionRef = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
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
      // No contentType for read URLs
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

    // Multiple fallback sources for submissionId
    const submissionId = session.client_reference_id ||
                        (session.metadata && session.metadata.submissionId) ||
                        null;

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      sessionId: session.id,
      clientReferenceId: session.client_reference_id,
      metadataSubmissionId: session.metadata?.submissionId,
      resolvedSubmissionId: submissionId
    });

    if (!submissionId) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        sessionId,
        error: { code: 'NO_SUBMISSION_ID', message: 'No submission ID found in session' }
      });
      return res.status(400).json({
        error: 'No submission ID associated with this session',
        code: 'NO_SUBMISSION_ID'
      });
    }

    // Return consistent response structure
    res.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      submissionId: submissionId,
      client_reference_id: submissionId,  // Alias for backward compatibility
      amount_total: session.amount_total,
      customer_email: session.customer_details?.email
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
      code: 'CHECKOUT_SESSION_ERROR',
      message: error.message
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
    const submissionRef = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
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
      // No contentType for read URLs
    });

    const [viewUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `inline; filename="${submissionId}.pdf"`,
      // No contentType for read URLs
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
    const submissionRef = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
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
    const submissionRef = firestore.collection('diagnosticSubmissions').doc(submissionId);
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
    const submissionRef = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
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
      // No contentType for read URLs
    });

    const [viewUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `inline; filename="${submissionId}.pdf"`,
      // No contentType for read URLs
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
      const submissionRef = firestore.collection('diagnosticSubmissions').doc(submissionId);
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
    await firestore.collection('diagnosticSubmissions').doc(submissionId).update({
      status: 'processing',
      updatedAt: new Date().toISOString(),
      processingStartedAt: new Date().toISOString()
    });

    // Create analysis record with running status
    await firestore.collection('analysis').doc(submissionId).set({
      status: 'running',
      submissionId: submissionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Call Vertex AI Gemini
    const analysis = await callVertexAI(payload);

    // Generate PDF report AND upload to Cloud Storage (all in one)
    const reportData = await generatePDFReport(submissionId, analysis, payload);

    logStructured({
      phase: 'saveReport',
      status: 'ok',
      bucket: REPORT_BUCKET,
      path: reportData.fileName,
      submissionId,
      size: reportData.buffer.length
    });

    // Update analysis to ready
    await firestore.collection('analysis').doc(submissionId).update({
      status: 'ready',
      updatedAt: new Date().toISOString(),
      reportPath: reportData.fileName
    });

    // Update submission to ready with report URL
    await firestore.collection('diagnosticSubmissions').doc(submissionId).update({
      status: 'ready',
      reportUrl: reportData.publicUrl,
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
      reportPath: reportData.fileName,
      reportSize: reportData.buffer.length
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
    await firestore.collection('diagnosticSubmissions').doc(submissionId).update({
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

  // DiagnosticPro Proprietary 14-Section Analysis Framework v1.3
  const prompt = `You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided to give the most accurate analysis possible. Reference specific error codes, mileage patterns, and equipment type in your diagnosis.

CUSTOMER DATA PROVIDED:
- Vehicle: ${payload.make || 'N/A'} ${payload.model || 'N/A'} ${payload.year || 'N/A'}
- Equipment Type: ${payload.equipmentType || 'N/A'}
- Mileage/Hours: ${payload.mileageHours || 'N/A'}
- Serial Number: ${payload.serialNumber || 'N/A'}
- Problem: ${payload.problemDescription || 'N/A'}
- Symptoms: ${payload.symptoms || 'N/A'}
- Error Codes: ${payload.errorCodes || 'N/A'}
- When Started: ${payload.whenStarted || 'N/A'}
- Frequency: ${payload.frequency || 'N/A'}
- Urgency Level: ${payload.urgencyLevel || 'N/A'}
- Location/Environment: ${payload.locationEnvironment || 'N/A'}
- Usage Pattern: ${payload.usagePattern || 'N/A'}
- Previous Repairs: ${payload.previousRepairs || 'N/A'}
- Modifications: ${payload.modifications || 'N/A'}
- Troubleshooting Done: ${payload.troubleshootingSteps || 'N/A'}
- Shop Quote: ${payload.shopQuoteAmount || 'N/A'}
- Shop Recommendation: ${payload.shopRecommendation || 'N/A'}

Provide your analysis using the following EXACT 14-section structure. Each section must be comprehensive and detailed (target 2000-2500 words total):

1. PRIMARY DIAGNOSIS
- Root cause with confidence percentage
- Reference specific error codes if provided
- Component failure analysis
- Age/mileage considerations

2. DIFFERENTIAL DIAGNOSIS
- Alternative causes ranked by likelihood
- Why each cause is ruled in or out
- Equipment-specific failure patterns

3. DIAGNOSTIC VERIFICATION
- Exact tests the shop MUST perform
- Tools needed and expected readings
- Cost estimates for testing procedures

4. SHOP INTERROGATION
- 5 technical questions to expose incompetence
- Specific data they must show you
- Red flag responses to watch for

5. CONVERSATION SCRIPTING
- Opening: How to present yourself as informed (not confrontational)
- Phrasing: Frame questions as "curiosity" not accusations
- Example dialogue: Word-for-word scripts for each question
- Body language: Professional demeanor tips
- Response handling: What to say when they get defensive
- Exit strategy: Polite ways to decline and leave
- NEVER say: "My AI report says..." or "I got a second opinion online"
- ALWAYS say: "I've done some research and want to understand..."

6. COST BREAKDOWN
- Fair parts pricing analysis
- Labor hour estimates
- Total price range
- Overcharge identification markers

7. RIPOFF DETECTION
- Parts cannon indicators
- Diagnostic shortcuts to watch for
- Price gouging red flags

8. AUTHORIZATION GUIDE
- What to approve immediately
- What to reject outright
- When to get a second opinion

9. TECHNICAL EDUCATION
- System operation explanation
- Failure mechanism details
- Prevention tips for future

10. OEM PARTS STRATEGY
- Specific part numbers when possible
- Why OEM is critical for this repair
- Pricing sources and alternatives

11. NEGOTIATION TACTICS
- Price comparison strategies
- Labor justification questions
- Walk-away points and leverage

12. LIKELY CAUSES (RANKED)
- Primary cause: X% confidence with reasoning
- Secondary cause: X% confidence with reasoning
- Tertiary cause: X% confidence with reasoning

13. RECOMMENDATIONS
- Immediate actions required
- Future maintenance schedule
- Warning signs to monitor

14. SOURCE VERIFICATION
- 2-3 authoritative links confirming diagnosis (OEM TSBs, NHTSA, repair forums)
- Specific manufacturer technical service bulletins if applicable
- Independent verification sources (not sponsored content)
- NO generic links - must be directly relevant to this specific diagnosis

Return your response as a comprehensive diagnostic report following this structure exactly. Be specific, technical, and reference the customer's provided data throughout your analysis.`;

  const response = await model.generateContent(prompt);
  const text = response.response.candidates[0].content.parts[0].text;

  // Debug logging to see what Vertex AI actually returns
  console.log(`Vertex AI raw response for analysis:`, text);

  // The new proprietary prompt returns a comprehensive text report, not JSON
  console.log(`Vertex AI comprehensive analysis length: ${text.length} characters`);

  // Return the full analysis text for PDF generation
  return {
    fullAnalysis: text,
    summary: "Comprehensive 14-section diagnostic analysis completed",
    confidence: 0.95,
    root_causes: ["Detailed analysis provided in full report"],
    recommendations: ["See comprehensive analysis for all recommendations"],
    cost_ranges: [],
    red_flags: [],
    questions: [],
    parts_needed: [],
    labor_estimate: "See analysis",
    difficulty: "See analysis",
    tools_required: []
  };
}

// FUNCTION: Generate PDF report using new clean PDF generator
async function generatePDFReport(submissionId, analysis, payload) {
  console.log(`Generating PDF for: ${submissionId} using new clean PDF generator`);

  // This function will now buffer the PDF in memory using the new generator
  const generatePdfBuffer = () => {
    return new Promise((resolve, reject) => {
      try {
        const tempPath = `/tmp/report_${submissionId}.pdf`;

        // Transform payload to match new generator's expected format
        const submission = {
          id: submissionId,
          make: payload.make,
          model: payload.model,
          year: payload.year,
          equipment_type: payload.equipmentType,
          serial_number: payload.serialNumber,
          mileage_hours: payload.mileageHours,
          full_name: payload.fullName || 'Anonymous',
          email: payload.email || 'Not provided',
          phone: payload.phone || 'Not provided',
          problem_description: payload.problemDescription,
          symptoms: Array.isArray(payload.symptoms) ? payload.symptoms : (payload.symptoms ? [payload.symptoms] : []),
          error_codes: Array.isArray(payload.errorCodes) ? payload.errorCodes : (payload.errorCodes ? [payload.errorCodes] : []),
          when_started: payload.whenStarted,
          frequency: payload.frequency,
          urgency_level: payload.urgencyLevel,
          location_environment: payload.locationEnvironment,
          usage_pattern: payload.usagePattern,
          previous_repairs: payload.previousRepairs,
          modifications: payload.modifications,
          troubleshooting_steps: payload.troubleshootingSteps,
          shop_quote_amount: payload.shopQuoteAmount,
          shop_recommendation: payload.shopRecommendation
        };

        // Use the new clean PDF generator
        const stream = generateDiagnosticProPDF(submission, analysis, tempPath);

        stream.on('finish', () => {
          // Read the generated file and return as buffer
          const fs = require('fs');
          const pdfData = fs.readFileSync(tempPath);
          // Clean up temp file
          fs.unlinkSync(tempPath);
          resolve(pdfData);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  };

  try {
    // 1. Generate the PDF into a buffer
    const pdfBuffer = await generatePdfBuffer();
    console.log(`PDF buffered successfully for: ${submissionId}`);

    // 2. Upload the buffer to Cloud Storage
    const fileName = `reports/${submissionId}.pdf`;
    const file = reportsBucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          submissionId: submissionId
        }
      }
    });
    console.log(`PDF uploaded to Cloud Storage: ${fileName}`);

    // 3. Generate signed URL for file access (compatible with uniform bucket-level access)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      // No contentType for read URLs to avoid header mismatch
    });
    const publicUrl = signedUrl;

    return {
      buffer: pdfBuffer,
      publicUrl: publicUrl,
      fileName: fileName
    };

  } catch (error) {
    console.error(`PDF generation or upload failed for ${submissionId}:`, error);
    throw error;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server with async initialization
async function startServer() {
  try {
    // Initialize services (load secrets from Secret Manager)
    await initializeServices();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 DiagnosticPro Backend running on port ${PORT}`);
      console.log(`💰 Price: $4.99 USD (499 cents)`);
      console.log(`🔗 Project: diagnostic-pro-prod`);
      console.log(`📁 Storage: gs://${REPORT_BUCKET}`);
      console.log('🔐 Secrets loaded from Google Secret Manager');
      console.log('\nEndpoints:');
      console.log('  POST /saveSubmission');
      console.log('  POST /createCheckoutSession');
      console.log('  POST /analysisStatus');
      console.log('  POST /analyzeDiagnostic');
      console.log('  POST /getDownloadUrl');
      console.log('  POST /stripeWebhookForward (PRIVATE)');
      console.log('  GET  /healthz');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if running directly (not imported)
if (require.main === module) {
  startServer();
}

module.exports = app;