# ============================================================================
# Read-Only Policy - For auditing and monitoring
# ============================================================================

# Read all secrets (but cannot modify)
path "secret/data/*" {
  capabilities = ["read", "list"]
}

# List secret engines
path "secret/metadata/*" {
  capabilities = ["list"]
}

# Read policies
path "sys/policies/*" {
  capabilities = ["read", "list"]
}

# Read auth methods
path "sys/auth" {
  capabilities = ["read"]
}

# Health check
path "sys/health" {
  capabilities = ["read"]
}

# Token lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
