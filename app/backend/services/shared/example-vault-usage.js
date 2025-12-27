// ============================================================================
// Example: Using Vault Client in a Service
// ============================================================================

const VaultClient = require('./shared/vault-client');

class ServiceWithVault {
  constructor() {
    this.vaultClient = new VaultClient({
      credentialsPath: '/app/vault-creds.json'
    });
    
    this.config = {};
  }

  /**
   * Initialize service with Vault secrets
   */
  async initialize() {
    try {
      console.log('🚀 Initializing service...');
      
      // Initialize Vault client
      await this.vaultClient.initialize();
      
      // Load all required secrets
      await this.loadSecrets();
      
      // Now use the secrets to configure your service
      this.configureService();
      
      console.log('✅ Service initialized successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Load all secrets from Vault
   */
  async loadSecrets() {
    try {
      console.log('🔑 Loading secrets from Vault...');
      
      // Load JWT secrets
      const jwtSecrets = await this.vaultClient.getSecret('secret/data/jwt/main');
      this.config.JWT_SECRET = jwtSecrets.secret;
      this.config.JWT_ALGORITHM = jwtSecrets.algorithm;
      this.config.JWT_EXPIRY = jwtSecrets.expiry;
      console.log('  ✓ JWT secrets loaded');

      // Load refresh token secrets
      const refreshSecrets = await this.vaultClient.getSecret('secret/data/jwt/refresh');
      this.config.JWT_REFRESH_SECRET = refreshSecrets.secret;
      this.config.JWT_REFRESH_EXPIRY = refreshSecrets.expiry;
      console.log('  ✓ Refresh token secrets loaded');

      // Load service-specific configuration
      const serviceName = process.env.SERVICE_NAME || 'api-gateway';
      const serviceConfig = await this.vaultClient.getSecret(`secret/data/services/${serviceName}/config`);
      this.config.ENCRYPTION_KEY = serviceConfig.encryption_key;
      this.config.LOG_LEVEL = serviceConfig.log_level;
      console.log(`  ✓ ${serviceName} configuration loaded`);

      // Load database credentials (if needed)
      try {
        const dbCreds = await this.vaultClient.getSecret(`secret/data/database/${serviceName}`);
        this.config.DB_HOST = dbCreds.host;
        this.config.DB_PORT = dbCreds.port;
        this.config.DB_USERNAME = dbCreds.username;
        this.config.DB_PASSWORD = dbCreds.password;
        this.config.DB_DATABASE = dbCreds.database;
        console.log('  ✓ Database credentials loaded');
      } catch (error) {
        console.log('  ℹ No database credentials found (may not be needed)');
      }

      // Load shared secrets (Kafka, etc.)
      const sharedKafka = await this.vaultClient.getSecret('secret/data/shared/kafka');
      this.config.KAFKA_BROKER = sharedKafka.broker;
      this.config.KAFKA_CLIENT_ID = sharedKafka.client_id;
      console.log('  ✓ Shared Kafka configuration loaded');

      console.log('✅ All secrets loaded successfully');
    } catch (error) {
      console.error('Failed to load secrets:', error);
      throw error;
    }
  }

  /**
   * Configure service with loaded secrets
   */
  configureService() {
    // Example: Setup JWT authentication
    if (this.config.JWT_SECRET) {
      console.log('✓ JWT authentication configured');
    }

    // Example: Setup database connection
    if (this.config.DB_HOST) {
      console.log('✓ Database connection configured');
    }

    // Example: Setup Kafka connection
    if (this.config.KAFKA_BROKER) {
      console.log('✓ Kafka connection configured');
    }
  }

  /**
   * Example: Encrypt sensitive data before storing
   */
  async encryptUserData(userData) {
    try {
      const plaintext = JSON.stringify(userData);
      const ciphertext = await this.vaultClient.encrypt(plaintext, 'user-data-context');
      return ciphertext;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Example: Decrypt sensitive data after retrieval
   */
  async decryptUserData(ciphertext) {
    try {
      const plaintext = await this.vaultClient.decrypt(ciphertext, 'user-data-context');
      return JSON.parse(plaintext);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Example: Rotate secrets (called periodically)
   */
  async rotateSecrets() {
    try {
      console.log('🔄 Rotating secrets...');
      
      // Re-load secrets from Vault
      await this.loadSecrets();
      
      // Re-configure service with new secrets
      this.configureService();
      
      console.log('✅ Secrets rotated successfully');
    } catch (error) {
      console.error('Secret rotation failed:', error);
      // Don't crash the service, just log the error
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down service...');
    this.vaultClient.destroy();
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  const service = new ServiceWithVault();
  
  // Initialize service with Vault
  await service.initialize();
  
  // Your service logic here...
  console.log('🎮 Service running...');
  console.log('Configuration:', {
    jwtConfigured: !!service.config.JWT_SECRET,
    dbConfigured: !!service.config.DB_HOST,
    kafkaConfigured: !!service.config.KAFKA_BROKER
  });

  // Example: Encrypt some data
  const encryptedData = await service.encryptUserData({
    userId: 123,
    email: 'user@example.com'
  });
  console.log('Encrypted:', encryptedData);

  // Example: Decrypt the data
  const decryptedData = await service.decryptUserData(encryptedData);
  console.log('Decrypted:', decryptedData);

  // Setup periodic secret rotation (every hour)
  setInterval(() => {
    service.rotateSecrets();
  }, 60 * 60 * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await service.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await service.shutdown();
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ServiceWithVault;
