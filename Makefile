MESSAGES = ./scripts/messages.sh

help:
	@bash -c 'source $(MESSAGES) && show_help'


up:
	@bash -c 'source $(MESSAGES) && msg_up_start'
	@docker-compose up -d
	@bash -c 'source $(MESSAGES) && msg_up_complete'


down:
	@bash -c 'source $(MESSAGES) && msg_down_start'
	@docker-compose down
	@bash -c 'source $(MESSAGES) && msg_down_complete'


restart:
	@bash -c 'source $(MESSAGES) && msg_restart_start'
	@docker-compose restart
	@bash -c 'source $(MESSAGES) && msg_restart_complete'

build:
	@bash -c 'source $(MESSAGES) && msg_build_start'
	@docker-compose build
	@bash -c 'source $(MESSAGES) && msg_build_complete'

build-clean:
	@bash -c 'source $(MESSAGES) && msg_build_start'
	@docker-compose build --no-cache
	@bash -c 'source $(MESSAGES) && msg_build_complete'


clean:
	@bash -c 'source $(MESSAGES) && msg_clean_start'
	@docker-compose down -v
	@bash -c 'source $(MESSAGES) && msg_clean_complete'


logs:
	@bash -c 'source $(MESSAGES) && msg_logs'
	@docker-compose logs -f


ps:
	@bash -c 'source $(MESSAGES) && msg_ps'
	@docker-compose ps


test-producer:
	@bash -c 'source $(MESSAGES) && msg_test_producer_start'
	@curl -s -X POST http://localhost:3001/send \
		-H "Content-Type: application/json" \
		-d '{"message": "hicham meserghi seraghna hakma elhila9a", "key": "souaouri"}' \
		2>&1 | grep -o '{.*}' | jq '.' || curl -X POST http://localhost:3001/send -H "Content-Type: application/json" -d '{"message": "Test message from Makefile", "key": "test-key"}'
	@bash -c 'source $(MESSAGES) && msg_test_producer_complete'


test-consumer:
	@bash -c 'source $(MESSAGES) && msg_test_consumer_start'
	@curl -s http://localhost:3002/messages/latest 2>&1 | grep -o '{.*}' | jq '.' || curl http://localhost:3002/messages/latest
	@bash -c 'source $(MESSAGES) && msg_test_consumer_complete'

dev:
	@echo "🔧 Starting Frontend Development Mode..."
	@docker-compose --profile development up frontend-dev -d

dev-full:
	@echo "🚀 Starting Full Development Stack..."
	@docker-compose --profile development up -d

services:
	@echo "🔧 Starting Microservices (A, B, C, D)..."
	@docker-compose up -d service-a service-b service-c service-d

services-logs:
	@echo "📋 Showing logs for all microservices..."
	@docker-compose logs -f service-a service-b service-c service-d

test-services:
	@echo "🧪 Testing Service A -> B, C, D message flow..."
	@echo "Starting consumers first..."
	@docker-compose up -d service-b service-c service-d
	@sleep 5
	@echo "Sending message from Service-A..."
	@docker-compose up service-a
	@sleep 2
	@echo "\n📊 Check logs with: make services-logs"

send-message:
	@echo "📤 Sending message via Service-A API..."
	@curl -X POST http://localhost:3010/send \
		-H "Content-Type: application/json" \
		-d '{"userId": 101, "userName": "Ali", "event": "USER_CREATED"}' | jq '.'

test-service-a:
	@echo "🧪 Testing Service-A HTTP API..."
	@echo "Health check:"
	@curl -s http://localhost:3010/health | jq '.'
	@echo "\nSending test message:"
	@curl -s -X POST http://localhost:3010/send \
		-H "Content-Type: application/json" \
		-d '{"userId": 999, "userName": "Test User", "event": "USER_REGISTERED"}' | jq '.'

test-service-b:
	@echo "🧪 Testing Service-B HTTP API..."
	@echo "Health check:"
	@curl -s http://localhost:3011/health | jq '.'
	@echo "\nLatest message:"
	@curl -s http://localhost:3011/messages/latest | jq '.'
	@echo "\nStats:"
	@curl -s http://localhost:3011/stats | jq '.'

test-service-c:
	@echo "🧪 Testing Service-C HTTP API..."
	@echo "Health check:"
	@curl -s http://localhost:3012/health | jq '.'
	@echo "\nLatest message:"
	@curl -s http://localhost:3012/messages/latest | jq '.'
	@echo "\nStats:"
	@curl -s http://localhost:3012/stats | jq '.'

test-service-d:
	@echo "🧪 Testing Service-D HTTP API..."
	@echo "Health check:"
	@curl -s http://localhost:3013/health | jq '.'
	@echo "\nLatest message:"
	@curl -s http://localhost:3013/messages/latest | jq '.'
	@echo "\nStats:"
	@curl -s http://localhost:3013/stats | jq '.'

test-all-services:
	@echo "🧪 Testing All Microservices..."
	@echo "\n=== SERVICE-A (Producer) ==="
	@make test-service-a
	@echo "\n=== SERVICE-B (Consumer) ==="
	@make test-service-b
	@echo "\n=== SERVICE-C (Consumer) ==="
	@make test-service-c
	@echo "\n=== SERVICE-D (Consumer) ==="
	@make test-service-d

stop-all:
	@bash -c 'source $(MESSAGES) && msg_stop_all_start'
	@docker-compose down
	@if [ -n "$$(docker ps -q)" ]; then \
		docker stop $$(docker ps -q); \
		bash -c 'source $(MESSAGES) && msg_stop_all_complete'; \
	else \
		bash -c 'source $(MESSAGES) && msg_stop_all_none'; \
	fi


delete-all: stop-all
	@bash -c 'source $(MESSAGES) && msg_delete_all_start'
	@echo "🗑️  Removing all Docker containers..."
	@docker rm -f $$(docker ps -aq) 2>/dev/null || echo "No containers to remove"
	@echo "🗑️  Removing all Docker volumes..."
	@docker volume rm $$(docker volume ls -q) 2>/dev/null || echo "No volumes to remove"
	@echo "🗑️  Removing all Docker images..."
	@docker rmi -f $$(docker images -q) 2>/dev/null || echo "No images to remove"
	@echo "🗑️  Removing all Docker networks (except defaults)..."
	@docker network rm $$(docker network ls -q -f type=custom) 2>/dev/null || echo "No custom networks to remove"
	@echo "🧹 Pruning Docker system..."
	@docker system prune -af --volumes
	@bash -c 'source $(MESSAGES) && msg_delete_all_complete'


fclean: stop-all
	@bash -c 'source $(MESSAGES) && msg_fclean_start'
	@docker-compose down -v --remove-orphans
	@bash -c 'source $(MESSAGES) && msg_fclean_volumes'
	@if [ -n "$$(docker volume ls -q -f name=trancsendence)" ]; then \
		docker volume ls -q -f name=trancsendence | xargs -r docker volume rm 2>/dev/null || true; \
		bash -c 'source $(MESSAGES) && msg_fclean_volumes_done'; \
	else \
		bash -c 'source $(MESSAGES) && msg_fclean_volumes_none'; \
	fi
	@bash -c 'source $(MESSAGES) && msg_fclean_images'
	@docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "^(kafka|zookeeper|prometheus|grafana|alertmanager|node-exporter|elasticsearch|logstash|kibana|filebeat|loki|promtail|kafka-producer|kafka-consumer|kafka-ui):" | xargs -r docker rmi -f 2>/dev/null || true
	@bash -c 'source $(MESSAGES) && msg_fclean_networks'
	@docker network ls -q -f name=ft_transc | xargs -r docker network rm 2>/dev/null || true
	@bash -c 'source $(MESSAGES) && msg_fclean_cache'
	@docker builder prune -f
	@bash -c 'source $(MESSAGES) && msg_fclean_complete'


re: fclean build up
	@bash -c 'source $(MESSAGES) && msg_rebuild_complete'

# Add a new safe clean command
clean-project:
	@bash -c 'source $(MESSAGES) && msg_clean_start'
	@docker-compose down -v --remove-orphans
	@echo "🗑️  Removing only project-specific images..."
	@docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "^(kafka|zookeeper|prometheus|grafana|alertmanager|node-exporter|elasticsearch|logstash|kibana|filebeat|loki|promtail|kafka-producer|kafka-consumer|kafka-ui):" | xargs -r docker rmi -f 2>/dev/null || true
	@echo "✨ Project cleaned successfully!"


.PHONY: logs logs-kafka logs-producer logs-consumer logs-elk logs-monitoring logs-all
# Log commands

logs:
	@echo "📋 Available log commands:"
	@echo "  make logs-kafka        - Show Kafka logs"
	@echo "  make logs-producer     - Show Producer logs"
	@echo "  make logs-consumer     - Show Consumer logs"
	@echo "  make logs-elk          - Show ELK stack logs"
	@echo "  make logs-monitoring   - Show monitoring stack logs"
	@echo "  make logs-all          - Show all logs"
	@echo "  make logs-follow       - Follow all logs in real-time"

logs-kafka:
	docker-compose logs -f kafka zookeeper

logs-producer:
	docker-compose logs -f kafka-producer

logs-consumer:
	docker-compose logs -f kafka-consumer

logs-elk:
	docker-compose logs -f elasticsearch logstash kibana filebeat

logs-monitoring:
	docker-compose logs -f prometheus grafana alertmanager node-exporter loki promtail

logs-all:
	docker-compose logs --tail=100

logs-follow:
	docker-compose logs -f

logs-errors:
	@echo "🔍 Checking for errors in logs..."
	@docker-compose logs --tail=500 | grep -i "error\|exception\|fatal\|fail" || echo "✅ No errors found"

logs-container:
	@echo "📦 Select container to view logs:"
	@docker-compose ps --format "table {{.Name}}\t{{.Status}}"
	@read -p "Enter container name: " container; \
	docker-compose logs -f $$container

# ============================================================================
# Vault Commands
# ============================================================================

vault-setup:
	@echo "🔐 Setting up HashiCorp Vault..."
	@bash scripts/setup-vault.sh

vault-status:
	@echo "📊 Vault Status:"
	@bash scripts/vault-helper.sh status

vault-unseal:
	@echo "🔓 Unsealing Vault..."
	@bash scripts/vault-helper.sh unseal

vault-seal:
	@echo "🔒 Sealing Vault..."
	@bash scripts/vault-helper.sh seal

vault-secrets:
	@echo "🔑 Listing all secrets..."
	@bash scripts/vault-helper.sh secrets

vault-token:
	@echo "🎫 Root Token:"
	@bash scripts/vault-helper.sh token

vault-logs:
	@echo "📝 Vault Audit Logs (Ctrl+C to exit):"
	@bash scripts/vault-helper.sh logs

vault-backup:
	@echo "💾 Creating Vault backup..."
	@bash scripts/vault-helper.sh backup

vault-ui:
	@echo "🌐 Opening Vault UI..."
	@bash scripts/vault-helper.sh ui

vault-creds:
	@echo "🔐 Available service credentials:"
	@docker exec vault ls /vault/data/approle-creds/ 2>/dev/null | sed 's/.json//' || echo "No credentials found"
	@echo ""
	@echo "To view credentials: make vault-creds-service SERVICE=api-gateway"

vault-creds-service:
	@bash scripts/vault-helper.sh creds $(SERVICE)

vault-help:
	@echo "🔐 Vault Commands:"
	@echo "  make vault-setup         - Complete Vault setup (first time)"
	@echo "  make vault-status        - Show Vault status"
	@echo "  make vault-unseal        - Unseal Vault after restart"
	@echo "  make vault-seal          - Seal Vault"
	@echo "  make vault-secrets       - List all secrets"
	@echo "  make vault-token         - Show root token"
	@echo "  make vault-logs          - View audit logs"
	@echo "  make vault-backup        - Backup Vault data"
	@echo "  make vault-ui            - Open Vault UI"
	@echo "  make vault-creds         - List service credentials"
	@echo "  make vault-creds-service SERVICE=<name> - Get specific service creds"
	@echo ""
	@echo "Examples:"
	@echo "  make vault-setup"
	@echo "  make vault-creds-service SERVICE=api-gateway"
	@echo "  ./scripts/vault-helper.sh get secret/jwt/main"


