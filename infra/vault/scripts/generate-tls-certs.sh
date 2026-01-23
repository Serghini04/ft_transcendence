#!/bin/bash

# ============================================================================
# Generate TLS Certificates for Vault
# Creates self-signed certificates for development/testing
# For production, use proper certificates from a CA
# ============================================================================

set -e

CERT_DIR="/vault/config/tls"
DOMAIN="vault"

mkdir -p "$CERT_DIR"

echo "==================================================================="
echo "  Generating TLS Certificates for Vault"
echo "==================================================================="

# Generate private key
openssl genrsa -out "${CERT_DIR}/vault.key" 4096
echo "✓ Generated private key"

# Generate certificate signing request
openssl req -new -key "${CERT_DIR}/vault.key" \
  -out "${CERT_DIR}/vault.csr" \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"
echo "✓ Generated CSR"

# Generate self-signed certificate
openssl x509 -req -days 365 \
  -in "${CERT_DIR}/vault.csr" \
  -signkey "${CERT_DIR}/vault.key" \
  -out "${CERT_DIR}/vault.crt" \
  -extfile <(printf "subjectAltName=DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1")
echo "✓ Generated self-signed certificate"

# Set proper permissions
chmod 644 "${CERT_DIR}/vault.crt"
chmod 600 "${CERT_DIR}/vault.key"

echo ""
echo "✅ TLS certificates generated successfully!"
echo "   Certificate: ${CERT_DIR}/vault.crt"
echo "   Private Key: ${CERT_DIR}/vault.key"
echo ""
echo "⚠️  These are self-signed certificates for development only"
echo "   For production, use certificates from a trusted CA"
