# 🚀 HashiCorp Vault - Complete Implementation Guide

This guide will take you from zero to fully integrated Vault in your microservices.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Vault](#setup-vault)
3. [Verify Installation](#verify-installation)
4. [Integrate with Services](#integrate-with-services)
5. [Testing](#testing)
6. [Production Checklist](#production-checklist)

---

## Prerequisites

✅ Docker and Docker Compose installed
✅ Services running: `docker-compose up -d`
✅ Node.js services (api-gateway, chat-service, etc.)

---

## Setup Vault (5 Minutes)

### Step 1: Start Vault Container

```bash
# Start Vault
docker-compose up -d vault

# Check status
docker ps | grep vault
```

### Step 2: Run Automated Setup

```bash
# Make scripts executable (if not done already)
chmod +x scripts/setup-vault.sh scripts/vault-helper.sh

# Run complete setup
bash scripts/setup-vault.sh
```

**This will:**
- ✅ Generate TLS certificates
- ✅ Initialize Vault
- ✅ Create 5 unseal keys (needs 3 to unseal)
- ✅ Unseal Vault automatically
- ✅ Create security policies
- ✅ Setup AppRole authentication
- ✅ Generate secrets for all services
- ✅ Create service credentials

### Step 3: Save Important Information

**From the output, save these securely:**

```bash
# Root Token (save this!)
Root Token: hvs.xxxxxxxxxxxxx

# Unseal Keys (save these in SEPARATE locations!)
Key 1: xxxxx
Key 2: xxxxx
Key 3: xxxxx
Key 4: xxxxx
Key 5: xxxxx

# Admin Password
Admin Password: xxxxx
```

⚠️ **CRITICAL:** Store these securely! You'll need them after server restarts.

---

## Verify Installation

### Check Vault Status

```bash
# Using Makefile
make vault-status

# Or directly
./scripts/vault-helper.sh status
```

**Expected output:**
```
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false  ← Should be false
Total Shares    5
Threshold       3
Version         1.15.0
```

### Access Vault UI

```bash
# Open in browser
make vault-ui

# Or manually
open https://localhost:8200/ui
```

**Login with root token** from setup output.

### List Available Secrets

```bash
# Using Makefile
make vault-secrets

# Or using helper script
./scripts/vault-helper.sh secrets
```

**Expected output:**
```
🔑 Listing all secrets...
database/
external-apis/
jwt/
monitoring/
services/
shared/
```

### Get Service Credentials

```bash
# List all service credentials
make vault-creds

# Get specific service credentials
make vault-creds-service SERVICE=api-gateway

# Or using helper
./scripts/vault-helper.sh creds api-gateway
```

**Output:**
```json
{
  "role_id": "abc123-def456-...",
  "secret_id": "xyz789-uvw012-...",
  "vault_addr": "https://vault:8200"
}
```

---

## Integrate with Services

### Step 1: Install Vault Client

**For each Node.js service:**

```bash
cd app/backend/api_gateway
npm install node-vault
```

### Step 2: Copy Vault Client

**The Vault client is already created at:**
```
app/backend/services/shared/vault-client.js
```

### Step 3: Get Service Credentials

```bash
# Extract credentials for your service
docker exec vault cat /vault/data/approle-creds/api-gateway.json > vault-creds-api-gateway.json
```

### Step 4: Update Docker Compose

**Edit docker-compose.yml:**

```yaml
api-gateway:
  build: ./app/backend/api_gateway
  volumes:
    # Mount credentials (read-only)
    - ./vault-creds-api-gateway.json:/app/vault-creds.json:ro
  environment:
    - VAULT_ADDR=https://vault:8200
    - VAULT_SKIP_VERIFY=true
    - SERVICE_NAME=api-gateway
  depends_on:
    - vault
```

### Step 5: Update Service Code

**Example for API Gateway (server.ts or index.js):**

```javascript
const VaultClient = require('./shared/vault-client');

async function initializeService() {
  // Create Vault client
  const vaultClient = new VaultClient({
    credentialsPath: '/app/vault-creds.json'
  });

  // Initialize and authenticate
  await vaultClient.initialize();

  // Load JWT secrets
  const jwtSecrets = await vaultClient.getSecret('secret/data/jwt/main');
  const JWT_SECRET = jwtSecrets.secret;

  // Load refresh token secrets
  const refreshSecrets = await vaultClient.getSecret('secret/data/jwt/refresh');
  const JWT_REFRESH_SECRET = refreshSecrets.secret;

  // Load API Gateway config
  const apiConfig = await vaultClient.getSecret('secret/data/api-gateway/config');
  const COOKIE_SECRET = apiConfig.cookie_secret;

  // Load Kafka config
  const kafkaConfig = await vaultClient.getSecret('secret/data/shared/kafka');
  const KAFKA_BROKER = kafkaConfig.broker;

  // Now use these secrets in your application
  console.log('✅ All secrets loaded from Vault');
  
  // Return config object
  return {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    COOKIE_SECRET,
    KAFKA_BROKER
  };
}

// Use in your Express/Fastify/etc setup
async function startServer() {
  const config = await initializeService();
  
  // Setup JWT middleware with config.JWT_SECRET
  // Setup Kafka with config.KAFKA_BROKER
  // etc...
  
  app.listen(8080, () => {
    console.log('🚀 API Gateway running on port 8080');
  });
}

startServer().catch(console.error);
```

### Step 6: Remove Hardcoded Secrets

**Before (INSECURE):**
```yaml
environment:
  - JWT_SECRET=hardcoded-secret-key  ❌
  - DATABASE_PASSWORD=admin123       ❌
```

**After (SECURE):**
```javascript
// Load from Vault at runtime
const secrets = await vaultClient.getSecret('secret/data/jwt/main');
const JWT_SECRET = secrets.secret;  ✅
```

---

## Testing

### Test Vault Connection

```bash
# Health check
curl -k https://localhost:8200/v1/sys/health | jq
```

**Expected:**
```json
{
  "initialized": true,
  "sealed": false,
  "standby": false
}
```

### Test Authentication

```bash
# Get service credentials
ROLE_ID=$(docker exec vault jq -r '.role_id' /vault/data/approle-creds/api-gateway.json)
SECRET_ID=$(docker exec vault jq -r '.secret_id' /vault/data/approle-creds/api-gateway.json)

# Authenticate
curl -k --request POST \
  --data "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \
  https://localhost:8200/v1/auth/approle/login | jq
```

**Should return a token:**
```json
{
  "auth": {
    "client_token": "hvs.xxxxxx",
    "lease_duration": 3600
  }
}
```

### Test Secret Retrieval

```bash
# Get token from above
TOKEN="hvs.xxxxxx"

# Read secret
curl -k -H "X-Vault-Token: $TOKEN" \
  https://localhost:8200/v1/secret/data/jwt/main | jq
```

**Expected:**
```json
{
  "data": {
    "data": {
      "secret": "your-jwt-secret",
      "algorithm": "HS256",
      "expiry": "1h"
    }
  }
}
```

### Test Service Integration

```bash
# Rebuild and restart your service
docker-compose build api-gateway
docker-compose up -d api-gateway

# Check logs
docker-compose logs -f api-gateway
```

**Look for:**
```
🔐 Initializing Vault client...
✅ Vault client initialized successfully
🔑 Loading secrets from Vault...
  ✓ JWT secrets loaded
  ✓ API Gateway configuration loaded
✅ All secrets loaded successfully
🚀 API Gateway running on port 8080
```

---

## Common Operations

### View All Secrets

```bash
make vault-secrets
```

### Get Specific Secret

```bash
# Using helper
./scripts/vault-helper.sh get secret/jwt/main

# Or directly
docker exec -e VAULT_TOKEN=$(docker exec vault jq -r '.root_token' /vault/data/unseal-keys.json) \
  vault vault kv get secret/jwt/main
```

### Add New Secret

```bash
# Using helper
./scripts/vault-helper.sh put secret/myapp/api-key key=abc123 env=production

# Or directly
docker exec -e VAULT_TOKEN=xxx vault vault kv put secret/myapp/api-key key=abc123
```

### Backup Vault Data

```bash
make vault-backup

# Creates: vault-backup-YYYYMMDD-HHMMSS.tar.gz
```

### Unseal After Restart

If Vault container restarts, it will be sealed:

```bash
make vault-unseal

# Or manually
docker exec vault sh /vault/scripts/unseal-vault.sh
```

---

## Production Checklist

### Before Going to Production

- [ ] **Replace self-signed certificates** with proper CA certificates
- [ ] **Store unseal keys separately** (5 different secure locations)
- [ ] **Revoke root token** after creating admin users
- [ ] **Enable auto-unseal** with cloud KMS (AWS, Azure, GCP)
- [ ] **Setup High Availability** with Consul or cloud storage
- [ ] **External audit logging** to SIEM or log aggregation
- [ ] **Regular backups** automated and encrypted
- [ ] **Secret rotation** policies implemented
- [ ] **Network isolation** - Vault in private network only
- [ ] **Monitoring** - Add Vault metrics to Prometheus
- [ ] **Disaster recovery** plan tested
- [ ] **Security audit** completed

### Security Best Practices

✅ **DO:**
- Use AppRole for service authentication
- Implement least privilege policies
- Rotate secrets regularly
- Monitor audit logs
- Backup frequently
- Test disaster recovery

❌ **DON'T:**
- Use root token in services
- Commit credentials to Git
- Share unseal keys
- Disable audit logging
- Expose Vault publicly
- Use same passwords

---

## Troubleshooting

### Vault is Sealed

**Symptom:** Services can't connect to Vault

```bash
# Check status
make vault-status

# If sealed, unseal it
make vault-unseal
```

### Service Can't Authenticate

**Check credentials exist:**
```bash
docker exec vault ls /vault/data/approle-creds/
```

**Verify credentials are mounted:**
```bash
docker exec api-gateway cat /app/vault-creds.json
```

**Test authentication manually:**
```bash
# Get credentials
ROLE_ID=$(docker exec vault jq -r '.role_id' /vault/data/approle-creds/api-gateway.json)
SECRET_ID=$(docker exec vault jq -r '.secret_id' /vault/data/approle-creds/api-gateway.json)

# Test login
curl -k --request POST \
  --data "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \
  https://localhost:8200/v1/auth/approle/login
```

### Lost Root Token

```bash
# View saved token
docker exec vault jq -r '.root_token' /vault/data/unseal-keys.json
```

### Vault Container Won't Start

```bash
# Check logs
docker logs vault

# Common issues:
# - TLS certificates missing
# - Port 8200 already in use
# - Volume permission issues
```

---

## Quick Reference

### Makefile Commands

```bash
make vault-setup         # Complete setup
make vault-status        # Check status
make vault-unseal        # Unseal Vault
make vault-secrets       # List secrets
make vault-token         # Show root token
make vault-logs          # View audit logs
make vault-backup        # Backup data
make vault-ui            # Open UI
make vault-creds         # List service creds
make vault-help          # Show help
```

### Helper Script Commands

```bash
./scripts/vault-helper.sh status
./scripts/vault-helper.sh secrets
./scripts/vault-helper.sh get secret/path
./scripts/vault-helper.sh put secret/path key=value
./scripts/vault-helper.sh creds service-name
./scripts/vault-helper.sh logs
./scripts/vault-helper.sh backup
```

---

## Next Steps

1. ✅ **Complete this guide**
2. ✅ **Integrate all services** with Vault
3. ✅ **Remove hardcoded secrets** from env vars
4. ✅ **Test thoroughly** in development
5. ✅ **Implement auto-unseal** for production
6. ✅ **Setup monitoring** and alerts
7. ✅ **Document** your secret paths
8. ✅ **Train team** on Vault usage

---

## Support & Resources

### Documentation
- [Quick Start](../infra/vault/README.md)
- [Full Documentation](./vault-integration.md)
- [Security Checklist](./security-checklist.md)

### Official Resources
- [Vault Documentation](https://www.vaultproject.io/docs)
- [Best Practices](https://learn.hashicorp.com/vault)
- [API Reference](https://www.vaultproject.io/api-docs)

### Get Help

```bash
# View Vault help
docker exec vault vault --help

# View helper options
./scripts/vault-helper.sh

# Check logs
make vault-logs
```

---

## Success Criteria

You've successfully integrated Vault when:

✅ All services authenticate with Vault using AppRole
✅ No hardcoded secrets in environment variables
✅ All secrets loaded from Vault at runtime
✅ Token renewal working automatically
✅ Audit logs capturing all access
✅ Regular backups automated
✅ Vault unseals automatically on restart

**Congratulations! Your secrets are now securely managed! 🎉**
