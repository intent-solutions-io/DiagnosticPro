const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'diagnostic-pro-prod';

// Cache for secrets to avoid repeated API calls
const secretCache = new Map();

/**
 * Load a secret from Google Secret Manager
 * @param {string} secretName - Name of the secret in Secret Manager
 * @param {string} version - Version of the secret (default: 'latest')
 * @returns {Promise<string>} The secret value
 */
async function getSecret(secretName, version = 'latest') {
  const cacheKey = `${secretName}:${version}`;

  // Return cached value if available
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey);
  }

  try {
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/${version}`;
    const [accessResponse] = await client.accessSecretVersion({ name });
    const secretValue = accessResponse.payload.data.toString('utf8');

    // Cache the secret value
    secretCache.set(cacheKey, secretValue);

    console.log(`✅ Loaded secret: ${secretName}`);
    return secretValue;
  } catch (error) {
    console.error(`❌ Failed to load secret ${secretName}:`, error.message);
    throw error;
  }
}

/**
 * Load all required secrets for the application
 * @returns {Promise<Object>} Object containing all secrets
 */
async function loadAllSecrets() {
  console.log('🔐 Loading secrets from Google Secret Manager...');

  try {
    const [stripeSecret, stripeWebhookSecret] = await Promise.all([
      getSecret('stripe-secret'),
      getSecret('stripe-webhook-secret')
    ]);

    const secrets = {
      STRIPE_SECRET_KEY: stripeSecret,
      STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
      REPORT_BUCKET: process.env.REPORT_BUCKET || 'diagnostic-pro-prod-reports-us-central1',
      GOOGLE_CLOUD_PROJECT: PROJECT_ID
    };

    console.log('✅ All secrets loaded successfully');
    return secrets;
  } catch (error) {
    console.error('❌ Failed to load secrets:', error);
    throw error;
  }
}

module.exports = {
  getSecret,
  loadAllSecrets
};
