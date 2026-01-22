# ============================================================================
# Services Policy - Access for microservices (chat, game, notification, etc.)
# Least privilege: Read-only access to service-specific secrets
# ============================================================================

# Read service-specific secrets
path "secret/data/services/{{identity.entity.aliases.auth_approle_*.metadata.service_name}}/*" {
  capabilities = ["read", "list"]
}

# Read shared service secrets (e.g., Kafka credentials)
path "secret/data/shared/*" {
  capabilities = ["read", "list"]
}

# Read database credentials for specific service
path "secret/data/database/{{identity.entity.aliases.auth_approle_*.metadata.service_name}}" {
  capabilities = ["read"]
}

# Token operations
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# AppRole login
path "auth/approle/login" {
  capabilities = ["update"]
}
