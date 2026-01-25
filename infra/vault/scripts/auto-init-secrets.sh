#!/bin/bash

set -e

echo "Starting Vault auto-initialization..."

# Wait for Vault to be ready
until vault status > /dev/null 2>&1; do
  echo "Waiting for Vault to be ready..."
  sleep 2
done

echo "Vault is ready!"

# Path to secrets file
SECRETS_FILE="/vault/secrets/.env.vault"

if [ ! -f "$SECRETS_FILE" ]; then
  echo "No secrets file found at $SECRETS_FILE"
  echo "ℹUsing default secrets"
  
  # Create default secrets
  vault kv put secret/app \
    JWT_SECRET='breakingPong_123!@' \
    JWT_REFRESH='breakingPong_Refresh_123!@' \
    COOKIE_SECRET='superSecretCookieKey!@' \
    ELASTIC_PASSWORD='changeme' \
    KIBANA_PASSWORD='changeme' \
    EMAIL_USER='ouaouriktsoulaymane@gmail.com' \
    EMAIL_PASSWORD='ynyr itsc mvvo wrmm'
  
  echo "Default secrets stored in Vault"
  exit 0
fi

echo "📖 Reading secrets from $SECRETS_FILE"

# Build the vault kv put command
CMD="vault kv put secret/app"

# Read and parse the .env.vault file
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove leading/trailing whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  
  # Add to command
  CMD="$CMD $key='$value'"
done < "$SECRETS_FILE"

# Execute the command
echo "Storing secrets in Vault..."
eval $CMD

if [ $? -eq 0 ]; then
  echo "Secrets successfully stored in Vault at secret/app"
  
  # Verify secrets were stored
  echo "Verifying stored secrets..."
  vault kv get secret/app > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "Secrets verified successfully!"
  else
    echo "Warning: Could not verify secrets"
  fi
else
  echo "Failed to store secrets in Vault"
  exit 1
fi
