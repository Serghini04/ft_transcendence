# ============================================================================
# Monitoring Policy - Read-only access for monitoring tools
# ============================================================================

# Read monitoring credentials
path "secret/data/monitoring/*" {
  capabilities = ["read", "list"]
}

# Read Prometheus, Grafana configs
path "secret/data/grafana/*" {
  capabilities = ["read"]
}

path "secret/data/prometheus/*" {
  capabilities = ["read"]
}

# Health check endpoint
path "sys/health" {
  capabilities = ["read"]
}

# Metrics endpoint
path "sys/metrics" {
  capabilities = ["read"]
}

# Token operations
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
