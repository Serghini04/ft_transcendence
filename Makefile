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
		-d '{"message": "hicham soulaymane", "key": "souaouri"}' \
		2>&1 | grep -o '{.*}' | jq '.' || curl -X POST http://localhost:3001/send -H "Content-Type: application/json" -d '{"message": "Test message from Makefile", "key": "test-key"}'
	@bash -c 'source $(MESSAGES) && msg_test_producer_complete'


test-consumer:
	@bash -c 'source $(MESSAGES) && msg_test_consumer_start'
	@curl -s http://localhost:3002/messages/latest 2>&1 | grep -o '{.*}' | jq '.' || curl http://localhost:3002/messages/latest
	@bash -c 'source $(MESSAGES) && msg_test_consumer_complete'


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
	@if [ -n "$$(docker volume ls -q)" ]; then \
		docker volume rm $$(docker volume ls -q) 2>/dev/null || true; \
		bash -c 'source $(MESSAGES) && msg_delete_all_volumes_done'; \
	else \
		bash -c 'source $(MESSAGES) && msg_delete_all_volumes_none'; \
	fi
	@bash -c 'source $(MESSAGES) && msg_delete_all_images'
	@docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "^(kafka|zookeeper|prometheus|grafana|alertmanager|node-exporter|elasticsearch|logstash|kibana|filebeat|loki|promtail|kafka-producer|kafka-consumer|kafka-ui):" | xargs -r docker rmi -f 2>/dev/null || true
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

