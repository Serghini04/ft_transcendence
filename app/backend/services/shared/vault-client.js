// ============================================================================
// Vault Client for Node.js Services
// Handles authentication, secret retrieval, and token renewal
// ============================================================================

const vault = require('node-vault');
const fs = require('fs');
const path = require('path');

class VaultClient {
  constructor(options = {}) {
    this.credentialsPath = options.credentialsPath || '/app/vault-creds.json';
    this.vault = null;
    this.token = null;
    this.roleId = null;
    this.secretId = null;
    this.renewalInterval = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize and authenticate with Vault
   */
  async initialize() {
    try {
      console.log('🔐 Initializing Vault client...');
      
      // Load AppRole credentials
      const credentials = this.loadCredentials();
      
      // Create Vault client
      this.vault = vault({
        apiVersion: 'v1',
        endpoint: credentials.vault_addr || process.env.VAULT_ADDR,
        requestOptions: {
          // Only for development with self-signed certs
          rejectUnauthorized: process.env.VAULT_SKIP_VERIFY === 'true' ? false : true
        }
      });

      this.roleId = credentials.role_id;
      this.secretId = credentials.secret_id;

      // Authenticate
      await this.authenticate();
      
      console.log('✅ Vault client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Vault client:', error.message);
      throw error;
    }
  }

  /**
   * Load AppRole credentials from file
   */
  loadCredentials() {
    try {
      if (!fs.existsSync(this.credentialsPath)) {
        throw new Error(`Credentials file not found: ${this.credentialsPath}`);
      }

      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      
      if (!credentials.role_id || !credentials.secret_id) {
        throw new Error('Invalid credentials: missing role_id or secret_id');
      }

      return credentials;
    } catch (error) {
      console.error('Failed to load Vault credentials:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate with Vault using AppRole
   */
  async authenticate() {
    try {
      console.log('🔑 Authenticating with Vault...');
      
      const result = await this.vault.approleLogin({
        role_id: this.roleId,
        secret_id: this.secretId
      });

      this.token = result.auth.client_token;
      this.vault.token = this.token;
      this.isAuthenticated = true;

      console.log('✅ Successfully authenticated to Vault');
      console.log(`   Lease Duration: ${result.auth.lease_duration}s`);

      // Setup automatic token renewal
      this.setupTokenRenewal(result.auth.lease_duration);
      
      return result;
    } catch (error) {
      console.error('❌ Vault authentication failed:', error.message);
      this.isAuthenticated = false;
      throw error;
    }
  }

  /**
   * Setup automatic token renewal
   */
  setupTokenRenewal(leaseDuration) {
    // Clear existing interval if any
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
    }

    // Renew token at 80% of lease duration
    const renewalTime = (leaseDuration * 0.8) * 1000;
    
    console.log(`⏰ Token renewal scheduled in ${Math.floor(renewalTime / 1000)}s`);

    this.renewalInterval = setInterval(async () => {
      try {
        console.log('🔄 Renewing Vault token...');
        await this.vault.tokenRenewSelf();
        console.log('✅ Vault token renewed successfully');
      } catch (error) {
        console.error('❌ Token renewal failed:', error.message);
        console.log('🔄 Re-authenticating...');
        
        try {
          await this.authenticate();
        } catch (authError) {
          console.error('❌ Re-authentication failed:', authError.message);
          this.isAuthenticated = false;
        }
      }
    }, renewalTime);
  }

  /**
   * Get secret from Vault (KV v2)
   * @param {string} path - Secret path (e.g., 'secret/data/jwt/main')
   * @returns {Promise<object>} - Secret data
   */
  async getSecret(path) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated to Vault');
    }

    try {
      // Handle both KV v1 and v2 paths
      const secretPath = path.includes('/data/') ? path : path.replace('secret/', 'secret/data/');
      
      const result = await this.vault.read(secretPath);
      return result.data.data; // KV v2 returns data.data
    } catch (error) {
      console.error(`Failed to read secret from ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Put secret to Vault (KV v2)
   * @param {string} path - Secret path
   * @param {object} data - Secret data
   */
  async putSecret(path, data) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated to Vault');
    }

    try {
      const secretPath = path.includes('/data/') ? path : path.replace('secret/', 'secret/data/');
      await this.vault.write(secretPath, { data });
      console.log(`✅ Secret written to ${path}`);
    } catch (error) {
      console.error(`Failed to write secret to ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * List secrets at a path
   * @param {string} path - Path to list
   */
  async listSecrets(path) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated to Vault');
    }

    try {
      const metadataPath = path.replace('/data/', '/metadata/');
      const result = await this.vault.list(metadataPath);
      return result.data.keys;
    } catch (error) {
      console.error(`Failed to list secrets at ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Encrypt data using Transit engine
   * @param {string} plaintext - Data to encrypt
   * @param {string} context - Optional encryption context
   */
  async encrypt(plaintext, context = '') {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated to Vault');
    }

    try {
      const result = await this.vault.write('transit/encrypt/app-data', {
        plaintext: Buffer.from(plaintext).toString('base64'),
        context: context ? Buffer.from(context).toString('base64') : undefined
      });
      
      return result.data.ciphertext;
    } catch (error) {
      console.error('Encryption failed:', error.message);
      throw error;
    }
  }

  /**
   * Decrypt data using Transit engine
   * @param {string} ciphertext - Data to decrypt
   * @param {string} context - Optional encryption context (must match encryption)
   */
  async decrypt(ciphertext, context = '') {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated to Vault');
    }

    try {
      const result = await this.vault.write('transit/decrypt/app-data', {
        ciphertext: ciphertext,
        context: context ? Buffer.from(context).toString('base64') : undefined
      });
      
      return Buffer.from(result.data.plaintext, 'base64').toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error.message);
      throw error;
    }
  }

  /**
   * Check Vault health
   */
  async health() {
    try {
      const health = await this.vault.health();
      return {
        initialized: health.initialized,
        sealed: health.sealed,
        standby: health.standby,
        version: health.version
      };
    } catch (error) {
      console.error('Health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      this.renewalInterval = null;
    }
    
    this.isAuthenticated = false;
    this.token = null;
    
    console.log('🔒 Vault client destroyed');
  }
}

module.exports = VaultClient;
