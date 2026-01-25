# Automated Vault Setup

This setup automatically initializes HashiCorp Vault with your secrets when you start the containers.

## How It Works

1. **Secrets File**: Secrets are stored in `.env.vault` file
2. **Auto-Initialization**: When Vault container starts, it automatically:
   - Starts Vault in dev mode
   - Waits for Vault to be ready
   - Reads secrets from `.env.vault`
   - Pushes all secrets to `secret/app` path in Vault
3. **Service Dependencies**: Services that need Vault wait for it to be healthy before starting

## Setup Instructions

### 1. Create Your Secrets File

```bash
cp .env.vault.example .env.vault
```

Edit `.env.vault` with your actual secrets:

```env
JWT_SECRET=your_secret_here
JWT_REFRESH=your_refresh_secret_here
COOKIE_SECRET=your_cookie_secret_here
ELASTIC_PASSWORD=your_password
KIBANA_PASSWORD=your_password
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_app_password
```

### 2. Start the Containers

```bash
docker-compose up -d
```

That's it! The Vault will automatically:
- Start
- Initialize with dev token
- Load secrets from `.env.vault`
- Store them at `secret/app`
- Be ready for services to use

### 3. Verify Secrets Were Loaded

```bash
# Check Vault logs
docker logs vault

# Manually verify secrets (optional)
docker exec vault vault kv get secret/app
```

## How Services Access Secrets

Services can access secrets from Vault using the Vault API:

```javascript
// Example: Fetch secrets from Vault
const response = await fetch(`${VAULT_ADDR}/v1/secret/data/app`, {
  headers: {
    'X-Vault-Token': VAULT_TOKEN
  }
});
const secrets = await response.json();
const jwtSecret = secrets.data.data.JWT_SECRET;
```

## Architecture

```
┌──────────────┐
│  .env.vault  │  (Your secrets file - not in git)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│  Vault Container Startup         │
│  1. Start Vault server           │
│  2. Run auto-init-secrets.sh     │
│  3. Read .env.vault              │
│  4. Push to secret/app           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Vault Ready & Healthy           │
│  ✓ Secrets stored at secret/app │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Dependent Services Start        │
│  - api-gateway                   │
│  - user_auth                     │
│  (They wait for Vault health)    │
└──────────────────────────────────┘
```

## Files Involved

- `.env.vault` - Your actual secrets (gitignored)
- `.env.vault.example` - Template for secrets file
- `infra/vault/scripts/entrypoint.sh` - Container startup script
- `infra/vault/scripts/auto-init-secrets.sh` - Script that loads secrets
- `docker-compose.yml` - Updated with health checks and dependencies

## Troubleshooting

### Secrets not loading

```bash
# Check Vault logs
docker logs vault

# Check if .env.vault exists and is mounted
docker exec vault ls -la /vault/secrets/

# Manually run initialization script
docker exec vault /vault/scripts/auto-init-secrets.sh
```

### Service can't connect to Vault

```bash
# Check Vault health
docker exec vault vault status

# Verify Vault is accessible
curl http://localhost:8200/v1/sys/health
```

### Reset and Restart

```bash
# Stop and remove containers
docker-compose down

# Remove Vault data
docker volume rm ft_transcendence_vault-data

# Start again
docker-compose up -d
```

## Security Notes

⚠️ **Important**:
- `.env.vault` contains sensitive secrets - NEVER commit it to git
- This setup uses Vault in **dev mode** for development only
- For production, use proper Vault setup with TLS and unsealing
- Rotate your secrets regularly
- Use strong, unique passwords

## Production Considerations

For production deployments:
1. Use Vault in production mode (not dev mode)
2. Implement proper unsealing mechanism
3. Use TLS certificates
4. Set up Vault policies for least privilege
5. Use Vault's dynamic secrets where possible
6. Enable audit logging
7. Implement secret rotation
