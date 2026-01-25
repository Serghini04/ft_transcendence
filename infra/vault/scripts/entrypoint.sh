#!/bin/bash

set -e

echo "Starting Vault with auto-initialization..."

# Start Vault server in the background
vault server -dev \
  -dev-root-token-id=dev-root-token \
  -dev-listen-address=0.0.0.0:8200 &

VAULT_PID=$!

# Wait for Vault to be ready
echo "Waiting for Vault to start..."
sleep 5

# Set Vault environment
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='dev-root-token'

# Wait until Vault is actually ready
max_attempts=30
attempt=0
until vault status > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "Vault failed to start within timeout"
    exit 1
  fi
  echo "   Waiting for Vault... (attempt $attempt/$max_attempts)"
  sleep 1
done

echo "Vault is ready!"

# Initialize secrets if script exists
if [ -f "/vault/scripts/auto-init-secrets.sh" ]; then
  echo "Running auto-initialization script..."
  bash /vault/scripts/auto-init-secrets.sh
else
  echo "Auto-initialization script not found"
fi

echo "Vault is ready and initialized!"

# Keep the container running by waiting for the Vault process
wait $VAULT_PID
