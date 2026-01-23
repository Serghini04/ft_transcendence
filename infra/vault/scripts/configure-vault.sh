#!/bin/bash

# ============================================================================
# Vault Configuration Script
# Sets up secret engines, policies, and authentication methods
# Run this after init-vault.sh
# ============================================================================

set -e

VAULT_ADDR="${VAULT_ADDR:-https://vault:8200}"
VAULT_SKIP_VERIFY="${VAULT_SKIP_VERIFY:-true}"

export VAULT_ADDR
export VAULT_SKIP_VERIFY

echo "==================================================================="
echo "  Vault Configuration Script"
echo "==================================================================="

# Check if logged in
if ! vault token lookup &>/dev/null; then
  echo "❌ Not logged in to Vault. Please set VAULT_TOKEN or run 'vault login'"
  exit 1
fi

echo "✓ Authenticated to Vault"

# ============================================================================
# 1. Enable Secret Engines
# ============================================================================
echo ""
echo "📦 Configuring Secret Engines..."

# Enable KV v2 secrets engine
if ! vault secrets list | grep -q "^secret/"; then
  vault secrets enable -path=secret -version=2 kv
  echo "  ✓ Enabled KV v2 secrets engine at 'secret/'"
else
  echo "  ✓ KV v2 secrets engine already enabled"
fi

# Enable database secrets engine (dynamic credentials)
if ! vault secrets list | grep -q "^database/"; then
  vault secrets enable database
  echo "  ✓ Enabled database secrets engine"
else
  echo "  ✓ Database secrets engine already enabled"
fi

# Enable transit engine (encryption as a service)
if ! vault secrets list | grep -q "^transit/"; then
  vault secrets enable transit
  echo "  ✓ Enabled transit encryption engine"
else
  echo "  ✓ Transit encryption engine already enabled"
fi

# ============================================================================
# 2. Create Encryption Keys
# ============================================================================
echo ""
echo "🔑 Creating Encryption Keys..."

# Create encryption key for application data
if ! vault list transit/keys 2>/dev/null | grep -q "^app-data$"; then
  vault write -f transit/keys/app-data \
    type=aes256-gcm96 \
    derived=false \
    exportable=false
  echo "  ✓ Created 'app-data' encryption key"
else
  echo "  ✓ Encryption key 'app-data' already exists"
fi

# Create key for sensitive user data
if ! vault list transit/keys 2>/dev/null | grep -q "^user-data$"; then
  vault write -f transit/keys/user-data \
    type=aes256-gcm96 \
    derived=true \
    exportable=false
  echo "  ✓ Created 'user-data' encryption key"
else
  echo "  ✓ Encryption key 'user-data' already exists"
fi

# ============================================================================
# 3. Create Policies
# ============================================================================
echo ""
echo "📋 Creating Policies..."

POLICIES=(
  "admin:/vault/policies/admin-policy.hcl"
  "api-gateway:/vault/policies/api-gateway-policy.hcl"
  "services:/vault/policies/services-policy.hcl"
  "monitoring:/vault/policies/monitoring-policy.hcl"
  "readonly:/vault/policies/readonly-policy.hcl"
)

for policy_pair in "${POLICIES[@]}"; do
  policy_name="${policy_pair%%:*}"
  policy_file="${policy_pair#*:}"
  
  if [ -f "$policy_file" ]; then
    vault policy write "$policy_name" "$policy_file"
    echo "  ✓ Created policy: $policy_name"
  else
    echo "  ⚠ Policy file not found: $policy_file"
  fi
done

# ============================================================================
# 4. Enable Authentication Methods
# ============================================================================
echo ""
echo "🔐 Configuring Authentication Methods..."

# Enable AppRole for service authentication
if ! vault auth list | grep -q "^approle/"; then
  vault auth enable approle
  echo "  ✓ Enabled AppRole authentication"
else
  echo "  ✓ AppRole authentication already enabled"
fi

# Enable userpass for human users (optional)
if ! vault auth list | grep -q "^userpass/"; then
  vault auth enable userpass
  echo "  ✓ Enabled userpass authentication"
else
  echo "  ✓ Userpass authentication already enabled"
fi

# ============================================================================
# 5. Create AppRoles for Services
# ============================================================================
echo ""
echo "🤖 Creating AppRoles for Services..."

SERVICES=("api-gateway" "chat-service" "game-service" "notification-service" "user-auth" "tictac-game")

for service in "${SERVICES[@]}"; do
  # Create AppRole
  vault write "auth/approle/role/${service}" \
    token_ttl=1h \
    token_max_ttl=24h \
    token_policies="services" \
    bind_secret_id=true \
    secret_id_ttl=0 \
    secret_id_num_uses=0 \
    token_num_uses=0 \
    metadata="service_name=${service}"
  
  echo "  ✓ Created AppRole: $service"
done

# Create AppRole for API Gateway with specific policy
vault write auth/approle/role/api-gateway \
  token_ttl=1h \
  token_max_ttl=24h \
  token_policies="api-gateway" \
  bind_secret_id=true \
  secret_id_ttl=0

echo "  ✓ Updated api-gateway with specific policy"

# ============================================================================
# 6. Populate Initial Secrets
# ============================================================================
echo ""
echo "🔒 Creating Initial Secrets..."

# Generate secure random secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# JWT Secrets
vault kv put secret/jwt/main \
  secret="$JWT_SECRET" \
  algorithm="HS256" \
  expiry="1h"

vault kv put secret/jwt/refresh \
  secret="$JWT_REFRESH" \
  algorithm="HS256" \
  expiry="7d"

echo "  ✓ Created JWT secrets"

# API Gateway Configuration
vault kv put secret/api-gateway/config \
  cookie_secret="$COOKIE_SECRET" \
  session_timeout="3600" \
  max_requests_per_minute="100"

echo "  ✓ Created API Gateway configuration"

# Shared service secrets (Kafka, etc.)
vault kv put secret/shared/kafka \
  broker="kafka:9092" \
  client_id="ft-transcendence"

echo "  ✓ Created shared service secrets"

# Database credentials (example - adjust for your DB)
vault kv put secret/database/api-gateway \
  username="api_gateway_user" \
  password="$(openssl rand -base64 24)" \
  host="postgres" \
  port="5432" \
  database="transcendence"

echo "  ✓ Created database credentials"

# External API keys (examples)
vault kv put secret/external-apis/oauth \
  client_id="your-oauth-client-id" \
  client_secret="your-oauth-client-secret"

echo "  ✓ Created external API configuration"

# Monitoring secrets
vault kv put secret/monitoring/grafana \
  admin_user="admin" \
  admin_password="$(openssl rand -base64 24)"

vault kv put secret/monitoring/prometheus \
  scrape_interval="15s" \
  retention="30d"

echo "  ✓ Created monitoring secrets"

# Service-specific secrets
for service in "${SERVICES[@]}"; do
  vault kv put "secret/services/${service}/config" \
    encryption_key="$ENCRYPTION_KEY" \
    log_level="info"
done

echo "  ✓ Created service-specific secrets"

# ============================================================================
# 7. Generate AppRole Credentials for Services
# ============================================================================
echo ""
echo "🎫 Generating AppRole Credentials..."

CREDS_DIR="/vault/data/approle-creds"
mkdir -p "$CREDS_DIR"
chmod 700 "$CREDS_DIR"

for service in "${SERVICES[@]}"; do
  # Get RoleID
  ROLE_ID=$(vault read -field=role_id "auth/approle/role/${service}/role-id")
  
  # Generate SecretID
  SECRET_ID=$(vault write -field=secret_id -f "auth/approle/role/${service}/secret-id")
  
  # Save to file
  cat > "${CREDS_DIR}/${service}.json" <<EOF
{
  "role_id": "${ROLE_ID}",
  "secret_id": "${SECRET_ID}",
  "vault_addr": "${VAULT_ADDR}"
}
EOF
  chmod 600 "${CREDS_DIR}/${service}.json"
  
  echo "  ✓ Generated credentials for: $service"
  echo "     RoleID: $ROLE_ID"
  echo "     SecretID: ${SECRET_ID:0:20}..."
done

# ============================================================================
# 8. Enable Audit Logging
# ============================================================================
echo ""
echo "📝 Enabling Audit Logging..."

if ! vault audit list | grep -q "^file/"; then
  vault audit enable file file_path=/vault/logs/audit.log
  echo "  ✓ Enabled file audit logging"
else
  echo "  ✓ Audit logging already enabled"
fi

# ============================================================================
# 9. Create Admin User
# ============================================================================
echo ""
echo "👤 Creating Admin User..."

ADMIN_PASSWORD=$(openssl rand -base64 24)

vault write auth/userpass/users/admin \
  password="$ADMIN_PASSWORD" \
  policies="admin"

echo "  ✓ Created admin user"
echo "     Username: admin"
echo "     Password: $ADMIN_PASSWORD"
echo ""
echo "     Save this password securely!"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "==================================================================="
echo "✅ Vault Configuration Complete!"
echo "==================================================================="
echo ""
echo "📁 AppRole credentials saved to: $CREDS_DIR"
echo "📝 Audit logs location: /vault/logs/audit.log"
echo ""
echo "Next Steps:"
echo "1. Copy AppRole credentials to your services"
echo "2. Update service configurations to use Vault"
echo "3. Test authentication: vault login -method=userpass username=admin"
echo "4. Monitor logs: docker exec vault tail -f /vault/logs/audit.log"
echo ""
echo "⚠️  SECURITY REMINDERS:"
echo "- Rotate root token: vault token create -policy=admin"
echo "- Revoke root token: vault token revoke <root-token>"
echo "- Backup unseal keys in separate secure locations"
echo "- Enable auto-unseal for production deployments"
echo "- Regularly rotate secrets and credentials"
echo "==================================================================="
