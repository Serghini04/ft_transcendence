
help:
	@echo "Available targets:"
	@echo "  up           - Start all services"
	@echo "  up-dev       - Start development services"
	@echo "  up-Ops       - Start operations services"
	@echo "  down         - Stop all services"
	@echo "  restart      - Restart all services"
	@echo "  build        - Build images"
	@echo "  build-clean  - Build images without cache"
	@echo "  clean        - Stop and remove volumes"
	@echo "  logs         - Show logs"
	@echo "  ps           - Show running containers"
	@echo "  dev          - Start frontend dev mode"
	@echo "  dev-full     - Start full dev stack"
	@echo "  fclean       - Full cleanup"
	@echo "  re           - Rebuild everything"

up:
	docker-compose up -d

up-dev:
	docker-compose up -d frontend frontend-dev game-service chat-service notification-service api-gateway tictac-game kafka user_auth vault leaderboard-service

up-ops:
	docker-compose up -d prometheus grafana alertmanager node-exporter elasticsearch logstash kibana filebeat kafka-ui

down-dev:
	docker-compose stop frontend frontend-dev game-service chat-service notification-service api-gateway tictac-game kafka user_auth
	docker-compose rm -f frontend frontend-dev game-service chat-service notification-service api-gateway tictac-game kafka user_auth

down-ops:
	docker-compose stop prometheus grafana alertmanager node-exporter elasticsearch logstash kibana filebeat kafka-ui
	docker-compose rm -f prometheus grafana alertmanager node-exporter elasticsearch logstash kibana filebeat kafka-ui

restart:
	docker-compose restart

build:
	docker-compose build

build-clean:
	docker-compose build --no-cache

clean:
	docker-compose down -v

logs:
	docker-compose logs -f

ps:
	docker-compose ps

dev:
	docker-compose --profile development up frontend-dev -d


stop-all:
	@if [ -n "$$(docker ps -q)" ]; then docker stop $$(docker ps -q); fi
	@docker-compose down 2>/dev/null || true

delete-all: stop-all
	@docker rm -f $$(docker ps -aq) 2>/dev/null || true
	@docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	@docker rmi -f $$(docker images -q) 2>/dev/null || true
	@docker network rm $$(docker network ls -q -f type=custom) 2>/dev/null || true
	@docker system prune -af --volumes

fclean: stop-all
	@docker-compose down -v --remove-orphans 2>/dev/null || true
	@docker volume ls -q -f name=trancsendence | grep -v '^$$' | xargs docker volume rm 2>/dev/null || true
	@docker network ls -q -f name=ft_transc | grep -v '^$$' | xargs docker network rm 2>/dev/null || true
	@docker builder prune -f

re: fclean build up

.PHONY: help up down restart build build-clean \
	clean logs ps dev dev-full re fclean stop-all delete-all
