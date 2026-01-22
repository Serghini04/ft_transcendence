# HashiCorp Vault Integration

## Overview

This project integrates **HashiCorp Vault** for centralized secrets management, providing:

✅ **Secure secret storage** with encryption at rest
✅ **Dynamic secrets** with automatic rotation
✅ **Fine-grained access control** using policies
✅ **Audit logging** for compliance
✅ **AppRole authentication** for services
✅ **Transit encryption** for application data
✅ **TLS encryption** for all communications

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Vault Server                   │
│  ┌───────────────────────────────────────────┐  │
│  │  KV Secrets Engine (v2)                   │  │
│  │  - JWT secrets                            │  │
│  │  - API keys                               │  │
│  │  - Service configurations                 │  │
│  │  - Database credentials                   │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Transit Engine                           │  │
│  │  - Encryption as a Service                │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Auth Methods                             │  │
│  │  - AppRole (for services)                 │  │
│  │  - Userpass (for admins)                  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         ↑               ↑               ↑
         │               │               │
    ┌────────┐     ┌──────────┐    ┌──────────┐
    │   API  │     │ Services │    │  Admin   │
    │Gateway │     │   (All)  │    │  Users   │
    └────────┘     └──────────┘    └──────────┘
```

---

## Quick Start

### 1. Start Vault

```bash
# Start Vault container
docker-compose up -d vault

# Run automated setup
bash scripts/setup-vault.sh
```

The setup script will:
- Generate TLS certificates
- Initialize Vault with 5 unseal keys (3 required)
- Unseal Vault automatically
- Create policies and AppRoles
- Populate initial secrets
- Generate service credentials

### 2. Access Vault

**CLI:**
```bash
# Get root token
ROOT_TOKEN=$(docker exec vault jq -r '.root_token' /vault/data/unseal-keys.json)

# Login
docker exec -it vault vault login $ROOT_TOKEN
```

**UI:**
```bash
# Open browser
open https://localhost:8200/ui

# Login with root token (from setup output)
```

---

## Configuration

### Vault Configuration ([config.hcl](infra/vault/config.hcl))

```hcl
# Storage backend
storage "file" {
  path = "/vault/data"
}

# TLS listener
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = 0
  tls_cert_file = "/vault/config/tls/vault.crt"
  tls_key_file  = "/vault/config/tls/vault.key"
  tls_min_version = "tls12"
}

# UI and API
ui = true
api_addr = "https://vault:8200"

# Metrics for Prometheus
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
}
```

---

## Policies

### 1. Admin Policy
**Full access** for system administrators.

```hcl
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
```

### 2. API Gateway Policy
**Restricted access** to authentication secrets.

```hcl
path "secret/data/jwt/*" {
  capabilities = ["read", "list"]
}

path "secret/data/api-gateway/*" {
  capabilities = ["read", "list"]
}
```

### 3. Services Policy
**Service-specific access** using identity-based paths.

```hcl
path "secret/data/services/{{identity.entity.aliases.auth_approle_*.metadata.service_name}}/*" {
  capabilities = ["read", "list"]
}
```

---

## Service Integration

### AppRole Authentication

Each service gets an **AppRole** with:
- **Role ID**: Identifies the service
- **Secret ID**: Password for authentication
- **Policy**: Defines access permissions

**Example credentials** (inside container):
```bash
cat /vault/data/approle-creds/api-gateway.json
```

```json
{
  "role_id": "abc123...",
  "secret_id": "xyz789...",
  "vault_addr": "https://vault:8200"
}
```

### Integration Steps

#### 1. **Node.js Service Example**

Install Vault client:
```bash
npm install node-vault
```

**vault-client.js:**
```javascript
const vault = require('node-vault');
const fs = require('fs');

class VaultClient {
  constructor() {
    // Load AppRole credentials
    const creds = JSON.parse(
      fs.readFileSync('/app/vault-creds.json', 'utf8')
    );

    this.vault = vault({
      apiVersion: 'v1',
      endpoint: creds.vault_addr,
      requestOptions: {
        rejectUnauthorized: false // Only for self-signed certs
      }
    });

    this.roleId = creds.role_id;
    this.secretId = creds.secret_id;
    this.token = null;
  }

  async authenticate() {
    try {
      const result = await this.vault.approleLogin({
        role_id: this.roleId,
        secret_id: this.secretId
      });

      this.token = result.auth.client_token;
      this.vault.token = this.token;

      console.log('✓ Authenticated to Vault');
      
      // Setup token renewal
      this.setupTokenRenewal(result.auth.lease_duration);
      
      return true;
    } catch (error) {
      console.error('Vault authentication failed:', error);
      return false;
    }
  }

  setupTokenRenewal(leaseDuration) {
    // Renew token before it expires (80% of lease duration)
    const renewInterval = (leaseDuration * 0.8) * 1000;
    
    setInterval(async () => {
      try {
        await this.vault.tokenRenewSelf();
        console.log('✓ Vault token renewed');
      } catch (error) {
        console.error('Token renewal failed:', error);
        // Re-authenticate if renewal fails
        await this.authenticate();
      }
    }, renewInterval);
  }

  async getSecret(path) {
    try {
      const result = await this.vault.read(path);
      return result.data.data; // KV v2 returns data.data
    } catch (error) {
      console.error(`Failed to read secret ${path}:`, error);
      throw error;
    }
  }

  async encrypt(plaintext, context = '') {
    const result = await this.vault.write('transit/encrypt/app-data', {
      plaintext: Buffer.from(plaintext).toString('base64'),
      context: Buffer.from(context).toString('base64')
    });
    return result.data.ciphertext;
  }

  async decrypt(ciphertext, context = '') {
    const result = await this.vault.write('transit/decrypt/app-data', {
      ciphertext: ciphertext,
      context: Buffer.from(context).toString('base64')
    });
    return Buffer.from(result.data.plaintext, 'base64').toString('utf8');
  }
}

module.exports = VaultClient;
```

**Usage in your service:**
```javascript
const VaultClient = require('./vault-client');

async function initializeService() {
  const vaultClient = new VaultClient();
  
  // Authenticate
  await vaultClient.authenticate();
  
  // Get JWT secrets
  const jwtSecrets = await vaultClient.getSecret('secret/data/jwt/main');
  const JWT_SECRET = jwtSecrets.secret;
  
  // Get database credentials
  const dbCreds = await vaultClient.getSecret('secret/data/database/api-gateway');
  const DB_HOST = dbCreds.host;
  const DB_PASSWORD = dbCreds.password;
  
  // Use secrets...
  console.log('✓ Secrets loaded from Vault');
}
```

#### 2. **Update Docker Compose**

Mount AppRole credentials:
```yaml
api-gateway:
  build: ./app/backend/api_gateway
  volumes:
    - ./vault-creds/api-gateway.json:/app/vault-creds.json:ro
  environment:
    - VAULT_ADDR=https://vault:8200
    - VAULT_SKIP_VERIFY=true
  depends_on:
    - vault
```

---

## Common Operations

### Using Helper Script

```bash
# Make executable
chmod +x scripts/vault-helper.sh

# View status
./scripts/vault-helper.sh status

# List all secrets
./scripts/vault-helper.sh secrets

# Get a secret
./scripts/vault-helper.sh get secret/jwt/main

# Put a secret
./scripts/vault-helper.sh put secret/test/key password=secret123

# Get service credentials
./scripts/vault-helper.sh creds api-gateway

# View audit logs
./scripts/vault-helper.sh logs

# Backup Vault data
./scripts/vault-helper.sh backup

# Open UI
./scripts/vault-helper.sh ui
```

### Using Vault CLI Directly

```bash
# Get root token
ROOT_TOKEN=$(docker exec vault jq -r '.root_token' /vault/data/unseal-keys.json)

# List secrets
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault kv list secret/

# Get secret
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault kv get secret/jwt/main

# Put secret
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault kv put secret/test/key value=secret

# Create new AppRole
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault write auth/approle/role/new-service \
  token_ttl=1h \
  token_policies=services

# Get RoleID
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault read -field=role_id \
  auth/approle/role/new-service/role-id

# Generate SecretID
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault write -f \
  -field=secret_id auth/approle/role/new-service/secret-id
```

---

## Security Best Practices

### ✅ Implemented

1. **TLS Encryption**: All communication encrypted
2. **AppRole Authentication**: Services use AppRole, not root token
3. **Policy-Based Access**: Least privilege principle
4. **Audit Logging**: All operations logged
5. **Secret Rotation**: Supports dynamic secrets
6. **Token Renewal**: Automatic token refresh
7. **Encryption at Rest**: Vault data encrypted

### ⚠️ Production Recommendations

1. **Auto-Unseal**: Use cloud KMS for automatic unsealing
   ```hcl
   seal "awskms" {
     region     = "us-west-2"
     kms_key_id = "alias/vault-unseal"
   }
   ```

2. **High Availability**: Use Consul or cloud storage
   ```hcl
   storage "consul" {
     address = "consul:8500"
     path    = "vault/"
   }
   ```

3. **Proper TLS**: Use certificates from trusted CA
4. **Unseal Key Management**: Store keys in separate secure locations
5. **Root Token**: Revoke after setup, use admin users instead
6. **Secret Rotation**: Implement automatic rotation policies
7. **Monitoring**: Export metrics to Prometheus
8. **Backup**: Regular automated backups
9. **Network Isolation**: Vault in private network
10. **Rate Limiting**: Configure request rate limits

---

## Monitoring

### Health Check

```bash
curl -k https://localhost:8200/v1/sys/health
```

**Response:**
```json
{
  "initialized": true,
  "sealed": false,
  "standby": false,
  "performance_standby": false,
  "replication_performance_mode": "disabled",
  "replication_dr_mode": "disabled",
  "server_time_utc": 1703462400,
  "version": "1.15.0"
}
```

### Metrics (Prometheus)

```bash
curl -k https://localhost:8200/v1/sys/metrics?format=prometheus
```

Add to Prometheus config:
```yaml
scrape_configs:
  - job_name: 'vault'
    metrics_path: '/v1/sys/metrics'
    params:
      format: ['prometheus']
    scheme: https
    tls_config:
      insecure_skip_verify: true
    static_configs:
      - targets: ['vault:8200']
```

---

## Troubleshooting

### Vault is Sealed

```bash
# Unseal using script
docker exec vault sh /vault/scripts/unseal-vault.sh

# Or manually
docker exec -it vault vault operator unseal
```

### Lost Root Token

```bash
# Generate new root token (requires quorum of unseal keys)
docker exec -it vault vault operator generate-root -init
```

### Service Can't Connect

1. Check Vault is unsealed: `docker exec vault vault status`
2. Verify credentials exist: `docker exec vault ls /vault/data/approle-creds/`
3. Test authentication: 
   ```bash
   curl -k --request POST \
     --data @api-gateway-creds.json \
     https://localhost:8200/v1/auth/approle/login
   ```

### Audit Log Full

```bash
# Rotate logs
docker exec vault sh -c 'mv /vault/logs/audit.log /vault/logs/audit.log.old'
```

---

## Migration from Environment Variables

**Before (insecure):**
```yaml
environment:
  - JWT_SECRET=hardcoded-secret
  - DATABASE_PASSWORD=admin123
```

**After (secure with Vault):**
```javascript
// Load from Vault at runtime
const vaultClient = new VaultClient();
await vaultClient.authenticate();

const JWT_SECRET = await vaultClient.getSecret('secret/data/jwt/main');
const DB_CREDS = await vaultClient.getSecret('secret/data/database/api-gateway');
```

---

## Files Reference

```
infra/vault/
├── Dockerfile                      # Vault container image
├── config.hcl                      # Main Vault configuration
├── policies/                       # Access control policies
│   ├── admin-policy.hcl           # Full admin access
│   ├── api-gateway-policy.hcl     # API Gateway specific
│   ├── services-policy.hcl        # Microservices access
│   ├── monitoring-policy.hcl      # Monitoring tools
│   └── readonly-policy.hcl        # Read-only access
└── scripts/                        # Automation scripts
    ├── init-vault.sh              # Initialize Vault
    ├── configure-vault.sh         # Configure secrets/policies
    ├── unseal-vault.sh            # Unseal helper
    └── generate-tls-certs.sh      # TLS certificate generation

scripts/
├── setup-vault.sh                  # Complete automated setup
└── vault-helper.sh                 # Common operations helper
```

---

## Next Steps

1. **Integrate services**: Update each service to use Vault client
2. **Remove hardcoded secrets**: Replace all env vars with Vault
3. **Setup auto-unseal**: Configure cloud KMS for production
4. **Enable HA**: Use Consul backend for high availability
5. **Monitoring**: Add Vault metrics to Grafana
6. **Backup automation**: Schedule regular Vault backups
7. **Secret rotation**: Implement automatic rotation policies
8. **Audit review**: Regular audit log analysis

---

## Resources

- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [Vault Best Practices](https://www.vaultproject.io/docs/internals/security)
- [AppRole Auth Method](https://www.vaultproject.io/docs/auth/approle)
- [KV Secrets Engine](https://www.vaultproject.io/docs/secrets/kv/kv-v2)
- [Transit Secrets Engine](https://www.vaultproject.io/docs/secrets/transit)
