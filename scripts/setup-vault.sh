#!/bin/bash

# ============================================================================
# Vault Setup Helper Script
# Complete automation for Vault initialization and configuration
# ============================================================================

set -e

VAULT_CONTAINER="vault"
VAULT_ADDR="https://localhost:8200"

export VAULT_SKIP_VERIFY=true

echo "==================================================================="
echo "  HashiCorp Vault Setup"
echo "  Complete Secrets Management Solution"
echo "==================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vault container is running
if ! docker ps | grep -q "$VAULT_CONTAINER"; then
  echo -e "${RED}❌ Vault container is not running${NC}"
  echo "   Start it with: docker-compose up -d vault"
  exit 1
fi

echo -e "${GREEN}✓${NC} Vault container is running"

# Wait for Vault to be ready
echo ""
echo "⏳ Waiting for Vault to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if docker exec "$VAULT_CONTAINER" vault status &>/dev/null || \
     docker exec "$VAULT_CONTAINER" sh -c 'curl -k -s https://localhost:8200/v1/sys/health' &>/dev/null; then
    echo -e "${GREEN}✓${NC} Vault is ready"
    break
  fi
  attempt=$((attempt + 1))
  echo "   Attempt $attempt/$max_attempts - waiting..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo -e "${RED}❌ Vault failed to start${NC}"
  exit 1
fi

# Generate TLS certificates if needed
echo ""
echo "🔐 Checking TLS certificates..."
if docker exec "$VAULT_CONTAINER" test -f /vault/config/tls/vault.crt; then
  echo -e "${GREEN}✓${NC} TLS certificates exist"
else
  echo "   Generating TLS certificates..."
  docker exec "$VAULT_CONTAINER" sh /vault/scripts/generate-tls-certs.sh
  echo -e "${GREEN}✓${NC} TLS certificates generated"
  
  # Restart Vault to use new certificates
  echo "   Restarting Vault..."
  docker restart "$VAULT_CONTAINER"
  sleep 5
fi

# Check if Vault is initialized
echo ""
echo "📋 Checking Vault status..."
if docker exec "$VAULT_CONTAINER" vault status | grep -q "Initialized.*true"; then
  echo -e "${GREEN}✓${NC} Vault is already initialized"
  
  # Check if sealed
  if docker exec "$VAULT_CONTAINER" vault status | grep -q "Sealed.*true"; then
    echo -e "${YELLOW}⚠${NC}  Vault is sealed - unsealing..."
    docker exec "$VAULT_CONTAINER" sh /vault/scripts/unseal-vault.sh
  else
    echo -e "${GREEN}✓${NC} Vault is unsealed"
  fi
else
  echo "   Initializing Vault..."
  docker exec "$VAULT_CONTAINER" sh /vault/scripts/init-vault.sh
  echo -e "${GREEN}✓${NC} Vault initialized and unsealed"
fi

# Configure Vault
echo ""
echo "⚙️  Configuring Vault..."

# Get root token
ROOT_TOKEN=$(docker exec "$VAULT_CONTAINER" jq -r '.root_token' /vault/data/unseal-keys.json 2>/dev/null || echo "")

if [ -z "$ROOT_TOKEN" ]; then
  echo -e "${RED}❌ Could not find root token${NC}"
  echo "   Please check /vault/data/unseal-keys.json in the container"
  exit 1
fi

# Run configuration script
docker exec -e VAULT_TOKEN="$ROOT_TOKEN" "$VAULT_CONTAINER" sh /vault/scripts/configure-vault.sh

echo ""
echo "==================================================================="
echo -e "${GREEN}✅ Vault Setup Complete!${NC}"
echo "==================================================================="
echo ""
echo "📊 Vault Information:"
echo "   URL: $VAULT_ADDR"
echo "   UI: $VAULT_ADDR/ui"
echo "   Container: $VAULT_CONTAINER"
echo ""
echo "🔑 Access Credentials:"
echo "   Root Token: $ROOT_TOKEN"
echo "   Admin Username: admin"
echo "   Admin Password: (see configuration output above)"
echo ""
echo "📁 Important Files (inside container):"
echo "   Unseal Keys: /vault/data/unseal-keys.json"
echo "   AppRole Credentials: /vault/data/approle-creds/"
echo "   Audit Log: /vault/logs/audit.log"
echo ""
echo "🚀 Quick Commands:"
echo "   # Access Vault CLI"
echo "   docker exec -it vault vault login $ROOT_TOKEN"
echo ""
echo "   # View secrets"
echo "   docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault kv list secret/"
echo ""
echo "   # Access Vault UI"
echo "   open $VAULT_ADDR/ui"
echo ""
echo "   # View audit logs"
echo "   docker exec vault tail -f /vault/logs/audit.log"
echo ""
echo "   # Get service credentials"
echo "   docker exec vault cat /vault/data/approle-creds/api-gateway.json"
echo ""
echo "⚠️  SECURITY WARNINGS:"
echo "   1. Change default admin password immediately"
echo "   2. Store unseal keys in separate secure locations"
echo "   3. Revoke and rotate root token after setup"
echo "   4. Enable audit logging to external system"
echo "   5. Use proper TLS certificates in production"
echo "   6. Implement auto-unseal with cloud KMS"
echo "   7. Regular backup of Vault data"
echo "==================================================================="
