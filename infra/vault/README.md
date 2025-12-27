# 🔐 HashiCorp Vault - Quick Start Guide

## What is Vault?

**HashiCorp Vault** is an identity-based secrets and encryption management system. It provides:

- 🔒 **Secure secret storage** - Encrypted at rest and in transit
- 🔑 **Dynamic secrets** - Generate credentials on-demand
- 🎫 **Access control** - Fine-grained policies
- 📝 **Audit logs** - Complete audit trail
- 🔐 **Encryption as a Service** - Encrypt/decrypt data without storing keys

---

## Setup (3 Steps)

### 1. Start Vault
```bash
docker-compose up -d vault
```

### 2. Run Setup Script
```bash
bash scripts/setup-vault.sh
```

This will:
- ✅ Generate TLS certificates
- ✅ Initialize Vault (5 unseal keys, threshold 3)
- ✅ Unseal Vault automatically
- ✅ Create policies and AppRoles
- ✅ Generate initial secrets
- ✅ Create service credentials

### 3. Save Important Information

**From the setup output, save:**
- ✅ Root Token
- ✅ 5 Unseal Keys (store in separate locations)
- ✅ Admin Password

---

## Quick Access

### Vault UI
```bash
open https://localhost:8200/ui
```
Login with root token from setup output.

### CLI Access
```bash
# Get root token
docker exec vault jq -r '.root_token' /vault/data/unseal-keys.json

# Login
docker exec -it vault vault login <root-token>
```

---

## Common Operations

### Using Helper Script

```bash
# View status
./scripts/vault-helper.sh status

# List all secrets
./scripts/vault-helper.sh secrets

# Get a secret
./scripts/vault-helper.sh get secret/jwt/main

# Add a secret
./scripts/vault-helper.sh put secret/myapp/key password=secret123 api_key=abc

# Get service credentials
./scripts/vault-helper.sh creds api-gateway

# View audit logs (live)
./scripts/vault-helper.sh logs

# Backup Vault data
./scripts/vault-helper.sh backup

# List all policies
./scripts/vault-helper.sh policies

# List AppRoles
./scripts/vault-helper.sh approles
```

---

## Secrets Structure

```
secret/
├── jwt/
│   ├── main           # JWT signing secret
│   └── refresh        # Refresh token secret
├── api-gateway/
│   └── config         # API Gateway configuration
├── services/
│   ├── api-gateway/   # Service-specific secrets
│   ├── chat-service/
│   ├── game-service/
│   ├── notification-service/
│   ├── user-auth/
│   └── tictac-game/
├── shared/
│   └── kafka          # Shared service configs (Kafka, etc.)
├── database/
│   └── api-gateway    # Database credentials
├── external-apis/
│   └── oauth          # External API keys
└── monitoring/
    ├── grafana
    └── prometheus
```

---

## Service Integration

### 1. Get Service Credentials

```bash
# View credentials
./scripts/vault-helper.sh creds api-gateway
```

Output:
```json
{
  "role_id": "abc123-def456-...",
  "secret_id": "xyz789-uvw012-...",
  "vault_addr": "https://vault:8200"
}
```

### 2. Add to Service

**Install Vault client:**
```bash
npm install node-vault
```

**vault-client.js:**
```javascript
const vault = require('node-vault');

const client = vault({
  apiVersion: 'v1',
  endpoint: 'https://vault:8200',
  requestOptions: { rejectUnauthorized: false }
});

// Authenticate
const result = await client.approleLogin({
  role_id: 'your-role-id',
  secret_id: 'your-secret-id'
});

client.token = result.auth.client_token;

// Get secrets
const secret = await client.read('secret/data/jwt/main');
const JWT_SECRET = secret.data.data.secret;
```

---

## Important Commands

### Vault Status
```bash
docker exec vault vault status
```

### Unseal Vault (after restart)
```bash
./scripts/vault-helper.sh unseal
```

### View Secrets
```bash
# List all secrets
docker exec vault vault kv list secret/

# Get specific secret
docker exec vault vault kv get secret/jwt/main
```

### Create New Secret
```bash
docker exec vault vault kv put secret/myapp/key \
  password=secret123 \
  api_key=abc123
```

### Audit Logs
```bash
# View logs
docker exec vault tail -f /vault/logs/audit.log

# Or use helper
./scripts/vault-helper.sh logs
```

---

## Policies (Access Control)

### Admin Policy
**Full access** to everything. Use sparingly.

### API Gateway Policy
**Read access** to:
- `secret/jwt/*`
- `secret/api-gateway/*`
- `secret/external-apis/*`
- `secret/database/api-gateway`

### Services Policy
**Read access** to:
- `secret/services/{service-name}/*`
- `secret/shared/*`
- `secret/database/{service-name}`

### Monitoring Policy
**Read access** to:
- `secret/monitoring/*`
- System metrics

---

## Security Best Practices

### ✅ DO

1. **Store unseal keys separately** - Never all in one place
2. **Rotate root token** - Create admin user, revoke root
3. **Use policies** - Least privilege principle
4. **Enable audit logs** - Monitor all access
5. **Backup regularly** - Use `./scripts/vault-helper.sh backup`
6. **Use TLS** - Already configured
7. **Rotate secrets** - Regularly update secrets

### ❌ DON'T

1. **Don't commit unseal keys** - Already in .gitignore
2. **Don't use root token in services** - Use AppRole
3. **Don't disable audit logs** - Keep them enabled
4. **Don't share credentials** - Each service gets its own
5. **Don't expose Vault port** - Only internal access

---

## Troubleshooting

### Vault is Sealed
```bash
./scripts/vault-helper.sh unseal
```

### Can't Connect
```bash
# Check if running
docker ps | grep vault

# Check logs
docker logs vault

# Check status
docker exec vault vault status
```

### Service Can't Authenticate
1. Verify credentials exist:
   ```bash
   ./scripts/vault-helper.sh creds api-gateway
   ```

2. Test authentication:
   ```bash
   curl -k --request POST \
     --data '{"role_id":"xxx","secret_id":"yyy"}' \
     https://localhost:8200/v1/auth/approle/login
   ```

### Lost Root Token
```bash
# View saved token
docker exec vault jq -r '.root_token' /vault/data/unseal-keys.json
```

---

## Monitoring

### Health Check
```bash
curl -k https://localhost:8200/v1/sys/health
```

### Metrics (Prometheus)
```bash
curl -k https://localhost:8200/v1/sys/metrics?format=prometheus
```

### Audit Logs
```bash
docker exec vault tail -f /vault/logs/audit.log
```

---

## Backup & Restore

### Backup
```bash
./scripts/vault-helper.sh backup
```
Creates: `vault-backup-YYYYMMDD-HHMMSS.tar.gz`

### Restore
```bash
./scripts/vault-helper.sh restore vault-backup-20241224-120000.tar.gz
```

---

## Files Location

**Inside Container:**
```
/vault/data/                      # Vault data (encrypted)
/vault/data/unseal-keys.json      # Unseal keys + root token
/vault/data/approle-creds/        # Service credentials
/vault/logs/audit.log             # Audit log
/vault/config/tls/                # TLS certificates
```

**Host:**
```
infra/vault/                      # Vault configuration
scripts/setup-vault.sh            # Setup script
scripts/vault-helper.sh           # Helper commands
```

---

## Next Steps

1. ✅ **Integrate services** - Update each service to use Vault
2. ✅ **Remove hardcoded secrets** - Replace env vars with Vault
3. ✅ **Test authentication** - Verify services can connect
4. ✅ **Monitor logs** - Check audit logs regularly
5. ✅ **Backup** - Schedule regular backups
6. ✅ **Rotate secrets** - Plan rotation schedule

---

## Resources

- 📖 [Full Documentation](docs/vault-integration.md)
- 🔗 [Vault Documentation](https://www.vaultproject.io/docs)
- 🔗 [AppRole Auth](https://www.vaultproject.io/docs/auth/approle)
- 🔗 [KV Secrets Engine](https://www.vaultproject.io/docs/secrets/kv/kv-v2)

---

## Support

```bash
# View all helper commands
./scripts/vault-helper.sh

# View status
./scripts/vault-helper.sh status

# Get help
docker exec vault vault --help
```
