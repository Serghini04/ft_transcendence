#!/bin/bash
set -e

export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='dev-root-token'

# Wait for Vault to be ready
echo "⏳ Waiting for Vault..."
for i in {1..30}; do
    if vault status >/dev/null 2>&1; then
        echo "✓ Vault is ready"
        break
    fi
    sleep 1
done

# Enable KV v2 secrets engine
echo "📦 Setting up secrets..."
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "  Secret engine already enabled"

# Store application secrets
vault kv put secret/app \
    JWT_SECRET="breakingPong_123!@" \
    JWT_REFRESH="breakingPong_Refresh_123!@" \
    COOKIE_SECRET="superSecretCookieKey!@" \
    INTERNAL_SECRET_KEY="78d5369cb85b2a685fccd5ed93c7b78b4b500916f6accd45f6592678d3eba07e"

echo "✅ Secrets stored successfully"

# Create policies
echo "📋 Creating policies..."
cat > /tmp/app-policy.hcl <<EOF
path "secret/data/app" {
  capabilities = ["read"]
}
EOF

vault policy write app /tmp/app-policy.hcl
echo "✅ Policy created"

# Create app token
APP_TOKEN=$(vault token create -policy=app -ttl=8760h -format=json | jq -r .auth.client_token)
echo ""
echo "🔑 Application Token: $APP_TOKEN"
echo ""
echo "Add this to your .env files:"
echo "VAULT_TOKEN=$APP_TOKEN"
echo "VAULT_ADDR=http://vault:8200"
