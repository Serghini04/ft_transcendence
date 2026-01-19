# ============================================================================
# HashiCorp Vault Configuration
# Production-ready configuration with security best practices
# ============================================================================

# Storage backend - File storage for development/testing
# For production, consider using Consul, etcd, or cloud storage
storage "file" {
  path = "/vault/data"
}

# Listener configuration - TLS disabled for development
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

# API address
api_addr = "http://vault:8200"

# Cluster address (for HA setup)
cluster_addr = "http://vault:8201"

# UI configuration
ui = true

# Telemetry for monitoring
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
  
  # Statsd configuration (optional)
  # statsd_address = "statsd:8125"
}

# High availability configuration (for production)
# ha_storage "consul" {
#   address = "consul:8500"
#   path    = "vault/"
# }

# Seal configuration
# Auto-unseal with Transit (requires another Vault instance)
# seal "transit" {
#   address            = "https://vault-transit:8200"
#   token              = "s.xxxxxxxxxxxxx"
#   disable_renewal    = "false"
#   key_name           = "autounseal"
#   mount_path         = "transit/"
#   tls_skip_verify    = "false"
# }

# Logging
log_level = "info"
log_format = "json"

# Disable mlock for containerized environments
disable_mlock = true

# Plugin directory
plugin_directory = "/vault/plugins"

# Maximum lease TTL
max_lease_ttl = "768h"

# Default lease TTL
default_lease_ttl = "768h"

# Enable raw endpoint (disable in production)
# raw_storage_endpoint = false

# Disable cache (for security, but impacts performance)
# disable_cache = true

# Disable performance standby (for single instance)
disable_performance_standby = true
