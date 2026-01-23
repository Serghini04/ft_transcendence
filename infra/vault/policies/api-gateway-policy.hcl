# ============================================================================
# API Gateway Policy - Access to authentication and gateway secrets
# Least privilege: Only access to required secrets
# ============================================================================

# Read JWT secrets for token validation
path "secret/data/jwt/*" {
  capabilities = ["read", "list"]
}

# Read API Gateway configuration
path "secret/data/api-gateway/*" {
  capabilities = ["read", "list"]
}

# Read database credentials (if needed)
path "secret/data/database/api-gateway" {
  capabilities = ["read"]
}

# Read external API keys (e.g., OAuth providers)
path "secret/data/external-apis/*" {
  capabilities = ["read", "list"]
}

# Token self-renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Token self-lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# AppRole login (for authentication)
path "auth/approle/login" {
  capabilities = ["update"]
}
