/**
 * Google Secret Manager Integration
 * Fetches secrets securely from Google Cloud Secret Manager
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Cache for secrets to avoid repeated API calls
const secretCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Fetch a secret from Google Secret Manager
 * @param {string} secretName - Name of the secret
 * @param {string} version - Version of the secret (default: 'latest')
 * @returns {Promise<string>} - Secret value
 */
async function getSecret(secretName, version = 'latest') {
  const cacheKey = `${secretName}:${version}`;

  // Check cache first
  const cached = secretCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'diagnostic-pro-prod';
    const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`;

    const [response] = await secretClient.accessSecretVersion({ name });
    const secretValue = response.payload.data.toString('utf8');

    // Cache the secret
    secretCache.set(cacheKey, {
      value: secretValue,
      timestamp: Date.now()
    });

    return secretValue;
  } catch (error) {
    console.error(`Failed to fetch secret ${secretName}:`, error.message);

    // Fallback to environment variable if Secret Manager fails
    const envVar = process.env[secretName];
    if (envVar) {
      console.warn(`Using fallback environment variable for ${secretName}`);
      return envVar;
    }

    throw new Error(`Secret ${secretName} not found in Secret Manager or environment`);
  }
}

/**
 * Load all required secrets at startup
 * @returns {Promise<Object>} - Object containing all secrets
 */
async function loadSecrets() {
  try {
    const secrets = await Promise.all([
      getSecret('STRIPE_SECRET_KEY'),
      getSecret('STRIPE_WEBHOOK_SECRET'),
      getSecret('FIREBASE_API_KEY'),
      getSecret('API_GATEWAY_KEY'),
      getSecret('WHOP_API_KEY').catch(() => null)
    ]);

    return {
      STRIPE_SECRET_KEY: secrets[0],
      STRIPE_WEBHOOK_SECRET: secrets[1],
      FIREBASE_API_KEY: secrets[2],
      API_GATEWAY_KEY: secrets[3],
      WHOP_API_KEY: secrets[4]
    };
  } catch (error) {
    console.error('Failed to load secrets:', error);
    throw error;
  }
}

/**
 * Clear the secret cache (useful for testing or forcing refresh)
 */
function clearCache() {
  secretCache.clear();
}

module.exports = {
  getSecret,
  loadSecrets,
  clearCache
};
