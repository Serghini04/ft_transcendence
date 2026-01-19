# Vault Simple Setup - Development Mode

## Overview
Vault is now configured to run in **development mode** for easy local development. When you run `make up`, Vault automatically starts with your application secrets pre-configured.

## What's Configured

### Auto-Initialized Secrets
All your application secrets are automatically stored in Vault at `secret/app`:
- `JWT_SECRET`: breakingPong_123!@
- `JWT_REFRESH`: breakingPong_Refresh_123!@  
- `COOKIE_SECRET`: superSecretCookieKey!@
- `INTERNAL_SECRET_KEY`: 78d5369cb85b2a685fccd5ed93c7b78b4b500916f6accd45f6592678d3eba07e

### Access Details
- **Vault Address**: http://vault:8200 (from containers) or http://localhost:8200 (from host)
- **Root Token**: dev-root-token
- **App Token**: hvs.CAESIGgc9F58LIqj7DtQFv_vKfNKG6KJhvRx2ObBv2ovRkv-Gh4KHGh2cy50Y2xPeU51bEdoWHB1R1BBRHZDakpkZlo

## Quick Commands

### Start Everything
```bash
make up
```

### View Secrets
```bash
docker exec vault vault kv get secret/app
```

### Add New Secrets
```bash
docker exec vault vault kv put secret/app \
  NEW_SECRET="value"
```

### Access Vault UI
Open http://localhost:8200 in your browser and login with token: `dev-root-token`

## Development Mode Notes

⚠️ **Development mode features**:
- Vault runs entirely in memory (no persistence across restarts)
- Auto-unsealed and initialized
- TLS disabled for simplicity  
- Single unseal key
- Root token is pre-defined

⚠️ **DO NOT use development mode in production!**

## Accessing Secrets from Your Application

### From Environment Variables
The secrets are available in your `.env` file at `app/backend/api_gateway/.env`

### From Vault API (TypeScript example)
```typescript
import axios from 'axios';

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN;

async function getSecrets() {
  const response = await axios.get(`${VAULT_ADDR}/v1/secret/data/app`, {
    headers: { 'X-Vault-Token': VAULT_TOKEN }
  });
  return response.data.data.data;
}

// Usage
const secrets = await getSecrets();
console.log(secrets.JWT_SECRET);
```

## Troubleshooting

### Check Vault Status
```bash
docker logs vault
docker exec vault vault status
```

### Reinitialize Secrets
```bash
docker exec vault /vault/scripts/init-dev.sh
```

### Restart Vault
```bash
docker-compose restart vault
docker exec vault /vault/scripts/init-dev.sh
```
