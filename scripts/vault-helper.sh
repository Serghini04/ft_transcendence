#!/bin/bash

# ============================================================================
# Vault Helper - Common Vault Operations
# ============================================================================

VAULT_CONTAINER="vault"
VAULT_ADDR="https://localhost:8200"
export VAULT_SKIP_VERIFY=true

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function get_root_token() {
  docker exec "$VAULT_CONTAINER" jq -r '.root_token' /vault/data/unseal-keys.json 2>/dev/null
}

function vault_exec() {
  local token=$(get_root_token)
  docker exec -e VAULT_TOKEN="$token" "$VAULT_CONTAINER" vault "$@"
}

function show_help() {
  echo "Vault Helper - Common Operations"
  echo ""
  echo "Usage: $0 <command> [arguments]"
  echo ""
  echo "Commands:"
  echo "  status              - Show Vault status"
  echo "  unseal              - Unseal Vault"
  echo "  seal                - Seal Vault"
  echo "  secrets             - List all secrets"
  echo "  get <path>          - Get secret at path"
  echo "  put <path> <data>   - Put secret (format: key=value key2=value2)"
  echo "  policies            - List all policies"
  echo "  approles            - List all AppRoles"
  echo "  creds <service>     - Get AppRole credentials for service"
  echo "  logs                - View audit logs"
  echo "  token               - Get root token"
  echo "  ui                  - Open Vault UI in browser"
  echo "  backup              - Backup Vault data"
  echo "  restore <file>      - Restore Vault data"
  echo ""
  echo "Examples:"
  echo "  $0 get secret/jwt/main"
  echo "  $0 put secret/test/key password=secret123"
  echo "  $0 creds api-gateway"
}

case "$1" in
  status)
    echo -e "${BLUE}Vault Status:${NC}"
    vault_exec status
    ;;
  
  unseal)
    echo "🔓 Unsealing Vault..."
    docker exec "$VAULT_CONTAINER" sh /vault/scripts/unseal-vault.sh
    ;;
  
  seal)
    echo "🔒 Sealing Vault..."
    vault_exec operator seal
    ;;
  
  secrets)
    echo -e "${BLUE}All Secrets:${NC}"
    vault_exec kv list secret/
    echo ""
    echo "To get a specific secret: $0 get secret/path"
    ;;
  
  get)
    if [ -z "$2" ]; then
      echo "Usage: $0 get <path>"
      exit 1
    fi
    vault_exec kv get "$2"
    ;;
  
  put)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "Usage: $0 put <path> key=value [key2=value2 ...]"
      exit 1
    fi
    path="$2"
    shift 2
    vault_exec kv put "$path" "$@"
    ;;
  
  policies)
    echo -e "${BLUE}Vault Policies:${NC}"
    vault_exec policy list
    ;;
  
  approles)
    echo -e "${BLUE}AppRoles:${NC}"
    vault_exec list auth/approle/role
    ;;
  
  creds)
    if [ -z "$2" ]; then
      echo "Usage: $0 creds <service-name>"
      echo "Available services:"
      docker exec "$VAULT_CONTAINER" ls /vault/data/approle-creds/ 2>/dev/null | sed 's/.json//'
      exit 1
    fi
    echo -e "${BLUE}Credentials for $2:${NC}"
    docker exec "$VAULT_CONTAINER" cat "/vault/data/approle-creds/$2.json" | jq .
    ;;
  
  logs)
    echo -e "${BLUE}Audit Logs (Ctrl+C to exit):${NC}"
    docker exec "$VAULT_CONTAINER" tail -f /vault/logs/audit.log
    ;;
  
  token)
    echo -e "${BLUE}Root Token:${NC}"
    get_root_token
    ;;
  
  ui)
    echo "Opening Vault UI..."
    xdg-open "$VAULT_ADDR/ui" 2>/dev/null || open "$VAULT_ADDR/ui" 2>/dev/null || echo "Open manually: $VAULT_ADDR/ui"
    ;;
  
  backup)
    BACKUP_FILE="vault-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    echo "📦 Creating backup: $BACKUP_FILE"
    docker exec "$VAULT_CONTAINER" tar czf "/tmp/$BACKUP_FILE" /vault/data
    docker cp "$VAULT_CONTAINER:/tmp/$BACKUP_FILE" "./$BACKUP_FILE"
    docker exec "$VAULT_CONTAINER" rm "/tmp/$BACKUP_FILE"
    echo -e "${GREEN}✓${NC} Backup saved to: ./$BACKUP_FILE"
    ;;
  
  restore)
    if [ -z "$2" ]; then
      echo "Usage: $0 restore <backup-file>"
      exit 1
    fi
    echo "⚠️  This will restore Vault data. Continue? (y/N)"
    read -r response
    if [ "$response" = "y" ]; then
      docker cp "$2" "$VAULT_CONTAINER:/tmp/restore.tar.gz"
      docker exec "$VAULT_CONTAINER" tar xzf /tmp/restore.tar.gz -C /
      docker restart "$VAULT_CONTAINER"
      echo -e "${GREEN}✓${NC} Restore complete"
    fi
    ;;
  
  *)
    show_help
    ;;
esac
