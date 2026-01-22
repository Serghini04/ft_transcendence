#!/bin/bash

# ============================================================================
# Vault Initialization Script
# This script initializes and unseals Vault, then configures it
# SECURITY WARNING: This is for development/demo. In production:
# - Use auto-unseal with cloud KMS
# - Store unseal keys in separate secure locations
# - Never commit unseal keys to version control
# ============================================================================

set -e

VAULT_ADDR="${VAULT_ADDR:-https://vault:8200}"
VAULT_SKIP_VERIFY="${VAULT_SKIP_VERIFY:-true}"

export VAULT_ADDR
export VAULT_SKIP_VERIFY

echo "==================================================================="
echo "  Vault Initialization Script"
echo "==================================================================="

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be ready..."
until curl -k -s "${VAULT_ADDR}/v1/sys/health" | grep -q "initialized"; do
  echo "   Vault not ready yet, retrying in 2 seconds..."
  sleep 2
done

echo "✓ Vault is accessible"

# Check if Vault is already initialized
if vault status 2>/dev/null | grep -q "Initialized.*true"; then
  echo "✓ Vault is already initialized"
  
  # Check if sealed
  if vault status 2>/dev/null | grep -q "Sealed.*true"; then
    echo "⚠ Vault is sealed. Please unseal manually or check unseal keys."
    exit 1
  else
    echo "✓ Vault is unsealed and ready"
    exit 0
  fi
fi

echo "📝 Initializing Vault with 5 key shares and 3 key threshold..."

# Initialize Vault
INIT_OUTPUT=$(vault operator init \
  -key-shares=5 \
  -key-threshold=3 \
  -format=json)

# Extract unseal keys and root token
UNSEAL_KEY_1=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[0]')
UNSEAL_KEY_2=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[1]')
UNSEAL_KEY_3=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[2]')
UNSEAL_KEY_4=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[3]')
UNSEAL_KEY_5=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[4]')
ROOT_TOKEN=$(echo "$INIT_OUTPUT" | jq -r '.root_token')

# Save to file (ONLY FOR DEVELOPMENT - NEVER IN PRODUCTION)
KEYS_FILE="/vault/data/unseal-keys.json"
echo "$INIT_OUTPUT" > "$KEYS_FILE"
chmod 600 "$KEYS_FILE"

echo "✓ Vault initialized successfully"
echo ""
echo "⚠️  CRITICAL SECURITY INFORMATION ⚠️"
echo "==================================================================="
echo "Root Token: $ROOT_TOKEN"
echo ""
echo "Unseal Keys (store these securely in separate locations):"
echo "  Key 1: $UNSEAL_KEY_1"
echo "  Key 2: $UNSEAL_KEY_2"
echo "  Key 3: $UNSEAL_KEY_3"
echo "  Key 4: $UNSEAL_KEY_4"
echo "  Key 5: $UNSEAL_KEY_5"
echo ""
echo "Keys are also saved to: $KEYS_FILE"
echo "⚠️  IN PRODUCTION: Delete this file after copying keys securely!"
echo "==================================================================="
echo ""

# Unseal Vault using 3 keys
echo "🔓 Unsealing Vault (requires 3 out of 5 keys)..."
vault operator unseal "$UNSEAL_KEY_1"
vault operator unseal "$UNSEAL_KEY_2"
vault operator unseal "$UNSEAL_KEY_3"

echo "✓ Vault unsealed successfully"

# Login with root token
echo "🔐 Logging in with root token..."
vault login "$ROOT_TOKEN" > /dev/null

echo "✓ Logged in successfully"
echo ""
echo "✅ Vault initialization complete!"
echo "   Next step: Run configure-vault.sh to set up secrets and policies"
