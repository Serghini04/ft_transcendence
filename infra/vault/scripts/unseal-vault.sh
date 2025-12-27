#!/bin/bash

# ============================================================================
# Vault Unseal Script
# Use this to unseal Vault after restart
# ============================================================================

set -e

VAULT_ADDR="${VAULT_ADDR:-https://vault:8200}"
VAULT_SKIP_VERIFY="${VAULT_SKIP_VERIFY:-true}"

export VAULT_ADDR
export VAULT_SKIP_VERIFY

echo "==================================================================="
echo "  Vault Unseal Script"
echo "==================================================================="

# Check if Vault is accessible
if ! curl -k -s "${VAULT_ADDR}/v1/sys/health" &>/dev/null; then
  echo "❌ Cannot connect to Vault at $VAULT_ADDR"
  exit 1
fi

# Check if already unsealed
if vault status 2>/dev/null | grep -q "Sealed.*false"; then
  echo "✓ Vault is already unsealed"
  exit 0
fi

# Check for unseal keys file
KEYS_FILE="/vault/data/unseal-keys.json"

if [ -f "$KEYS_FILE" ]; then
  echo "📄 Found unseal keys file: $KEYS_FILE"
  
  # Extract unseal keys
  UNSEAL_KEY_1=$(jq -r '.unseal_keys_b64[0]' "$KEYS_FILE")
  UNSEAL_KEY_2=$(jq -r '.unseal_keys_b64[1]' "$KEYS_FILE")
  UNSEAL_KEY_3=$(jq -r '.unseal_keys_b64[2]' "$KEYS_FILE")
  
  echo "🔓 Unsealing Vault..."
  vault operator unseal "$UNSEAL_KEY_1"
  vault operator unseal "$UNSEAL_KEY_2"
  vault operator unseal "$UNSEAL_KEY_3"
  
  echo "✅ Vault unsealed successfully!"
else
  echo "⚠️  Unseal keys file not found"
  echo "Please provide 3 unseal keys manually:"
  echo ""
  
  vault operator unseal
  vault operator unseal
  vault operator unseal
  
  if vault status 2>/dev/null | grep -q "Sealed.*false"; then
    echo "✅ Vault unsealed successfully!"
  else
    echo "❌ Failed to unseal Vault"
    exit 1
  fi
fi
