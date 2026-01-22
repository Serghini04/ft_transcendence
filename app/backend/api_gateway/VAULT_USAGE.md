# Using Vault Secrets in API Gateway

## Overview
The API Gateway now reads secrets from HashiCorp Vault instead of environment variables.

## How It Works

### 1. Vault Client
The `vault.client.ts` utility handles all Vault communication:

```typescript
import { vaultClient } from './utils/vault.client';

// Load secrets from Vault
const secrets = await vaultClient.loadSecrets();

// Access individual secrets
console.log(secrets.JWT_SECRET);
console.log(secrets.COOKIE_SECRET);
```

### 2. Server Initialization
The server now loads secrets from Vault on startup:

```typescript
// server.ts
import { vaultClient } from "./utils/vault.client";

// Secrets are loaded before the server starts
async function initializeApp() {
  secrets = await vaultClient.loadSecrets();
  // Configure app with secrets...
}
```

### 3. Using Secrets in Your Code

**Before (Environment Variables):**
```typescript
const token = jwt.sign(payload, process.env.JWT_SECRET);
```

**After (Vault Secrets):**
```typescript
import { secrets } from '../server';

const token = jwt.sign(payload, secrets.JWT_SECRET);
```

## Files Updated

All files now use Vault secrets instead of `process.env`:

1. **[src/server.ts](../src/server.ts)** - Main server initialization with Vault
2. **[src/utils/vault.client.ts](../src/utils/vault.client.ts)** - Vault client utility
3. **[src/middleware/auth.middleware.ts](../src/middleware/auth.middleware.ts)** - JWT authentication
4. **[src/utils/socket.gateway.ts](../src/utils/socket.gateway.ts)** - Socket.IO gateway
5. **[src/utils/socket.game.gateway.ts](../src/utils/socket.game.gateway.ts)** - Game socket gateway

## Configuration

The Vault client uses these environment variables (from `.env`):

```env
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=hvs.CAESIGgc9F58LIqj7DtQFv_vKfNKG6KJhvRx2ObBv2ovRkv-Gh4KHGh2cy50Y2xPeU51bEdoWHB1R1BBRHZDakpkZlo
```

## Fallback Mechanism

If Vault is unavailable, the application automatically falls back to environment variables:

```typescript
try {
  secrets = await vaultClient.loadSecrets();
  console.log('✅ Secrets loaded from Vault');
} catch (error) {
  console.warn('⚠️  Falling back to environment variables');
  secrets = {
    JWT_SECRET: process.env.JWT_SECRET || '',
    // ... other secrets
  };
}
```

## Testing

### 1. Verify Vault Connection
```bash
docker exec vault vault status
```

### 2. View Secrets in Vault
```bash
docker exec vault vault kv get secret/app
```

### 3. Start API Gateway
```bash
cd app/backend/api_gateway
npm run dev
```

You should see in logs:
```
🔐 Loading secrets from Vault...
✅ Secrets loaded from Vault
🔐 Secrets loaded from Vault
```

## Adding New Secrets

### 1. Add to Vault
```bash
docker exec vault vault kv put secret/app \
  JWT_SECRET="..." \
  JWT_REFRESH="..." \
  COOKIE_SECRET="..." \
  INTERNAL_SECRET_KEY="..." \
  NEW_SECRET="new_value"
```

### 2. Update TypeScript Interface
Edit `src/utils/vault.client.ts`:

```typescript
interface VaultSecrets {
  JWT_SECRET: string;
  JWT_REFRESH: string;
  COOKIE_SECRET: string;
  INTERNAL_SECRET_KEY: string;
  NEW_SECRET: string;  // Add this
}
```

### 3. Use in Your Code
```typescript
import { secrets } from '../server';

const mySecret = secrets.NEW_SECRET;
```

## Benefits

✅ **Centralized Secret Management** - All secrets in one place  
✅ **No Hardcoded Secrets** - Secrets never committed to git  
✅ **Easy Rotation** - Update secrets in Vault without code changes  
✅ **Audit Trail** - Vault logs all secret access  
✅ **Development Mode** - Works seamlessly with docker-compose
