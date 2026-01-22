# Storage backend
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
}

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

# Disable performance standby (for single instance)
disable_performance_standby = true
