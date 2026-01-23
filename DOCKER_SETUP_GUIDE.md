# Docker Setup Guide - Transcendence Project

## 🎯 Quick Start

### Start Core Services Only (Recommended for Development)
```bash
make up
```
This starts only the essential services:
- Zookeeper
- Kafka
- API Gateway
- Game Service (with Tournament feature)
- Chat Service
- Notification Service
- TicTac Game
- User Auth
- Frontend

### Start All Services (Including Monitoring)
```bash
make up-all
```
This starts core services + monitoring stack (Prometheus, Grafana, ELK, etc.)

### Start Only Monitoring Services
```bash
make up-bonus
```
Starts: Prometheus, Grafana, Elasticsearch, Logstash, Kibana, Filebeat, Alertmanager, Node Exporter

## 📋 Available Commands

### Basic Operations
- `make up` - Start core services (fast, for development)
- `make up-all` - Start ALL services
- `make up-bonus` - Start monitoring stack only
- `make down` - Stop all services
- `make restart` - Restart core services
- `make restart-all` - Restart all services

### Build Commands
- `make build` - Build core services
- `make build-all` - Build all services
- `make build-clean` - Build core services without cache

### Logs
- `make logs` - Show core services logs
- `make logs-all` - Show all services logs
- `make logs-game` - Game service logs
- `make logs-chat` - Chat service logs
- `make logs-notification` - Notification service logs
- `make logs-auth` - User auth service logs
- `make logs-tictac` - TicTac game logs
- `make logs-kafka` - Kafka + Zookeeper logs
- `make logs-api` - API Gateway logs

### Status & Health
- `make status` - Check core services status
- `make status-all` - Check all services status
- `make health` - Health check for core services
- `make ps` - List running containers

### Cleanup
- `make clean` - Remove containers and volumes
- `make fclean` - **FULL CLEAN** - Removes everything (containers, volumes, images, networks, cache)
- `make delete-all` - **NUCLEAR OPTION** - Deletes EVERYTHING Docker-related

### Rebuild
- `make re` - Full clean + rebuild + start

## 🏥 Health Check Improvements

We've added health checks to ensure services start in the correct order:

### Zookeeper
```yaml
healthcheck:
  test: ["CMD", "nc", "-z", "localhost", "2181"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

### Kafka
```yaml
depends_on:
  zookeeper:
    condition: service_healthy  # Waits for Zookeeper to be HEALTHY
healthcheck:
  test: ["CMD", "nc", "-z", "localhost", "9092"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Services (game, chat, notification, user_auth)
```yaml
depends_on:
  kafka:
    condition: service_healthy  # Waits for Kafka to be HEALTHY
```

### Elasticsearch
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Logstash, Kibana, Filebeat
```yaml
depends_on:
  elasticsearch:
    condition: service_healthy  # Waits for Elasticsearch to be HEALTHY
```

## ⚠️ Common Issues & Solutions

### Issue: "Port already in use" errors
**Cause:** Old containers still running from previous sessions

**Solution:**
```bash
make fclean  # Clean everything
make up      # Start fresh
```

### Issue: Services can't connect to Kafka
**Cause:** Services started before Kafka was ready

**Solution:** With the new health checks, this is automatically handled. Services wait for Kafka to be healthy before starting.

### Issue: Kafka connection errors in logs
**Solution:** Wait 30-60 seconds for Kafka to fully initialize. The health check has a 30s start period.

### Issue: Docker network conflicts
**Solution:**
```bash
docker network rm transcendence_ft_Transc
make up
```

### Issue: Need to completely clean Docker
**Solution:**
```bash
make fclean  # Recommended
# OR
make delete-all  # Nuclear option - removes EVERYTHING
```

## 🔗 Service URLs

After running `make up`, services are available at:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost or https://localhost | Main application |
| API Gateway | http://localhost:8080 | API entry point |
| Game Service | http://localhost:3005 | Game + Tournament backend |
| Chat Service | http://localhost:3003 | Chat backend |
| Auth Service | http://localhost:3004 | Authentication |
| Notification | http://localhost:3006 | Notifications |
| TicTac Game | http://localhost:3030 | TicTac Toe |
| Kafka | localhost:9092 | Message broker |
| Zookeeper | localhost:2181 | Kafka coordinator |

### Monitoring URLs (when using `make up-all` or `make up-bonus`)

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | user: hidriouc / pass: hidriouc |
| Prometheus | http://localhost:9090 | - |
| Kibana | http://localhost:5601 | - |
| Elasticsearch | http://localhost:9200 | - |
| Alertmanager | http://localhost:9093 | - |

## 🎮 Testing Tournament Feature

1. **Start services:**
   ```bash
   make up
   ```

2. **Wait for services to be healthy** (about 1-2 minutes on first run)

3. **Check health:**
   ```bash
   make health
   ```

4. **Access the application:**
   - Open browser: http://localhost
   - Login with your credentials
   - Navigate to Tournament section
   - Create or join a tournament

5. **Monitor logs:**
   ```bash
   make logs-game  # Watch game service logs
   ```

## 🐛 Debugging

### Check if all containers are running
```bash
make status
```

### Check specific service logs
```bash
make logs-game
make logs-chat
make logs-kafka
```

### Check health of services
```bash
make health
```

### See all Docker containers
```bash
docker ps
```

### Inspect a specific container
```bash
docker logs game-service
docker logs kafka
```

## 🚀 Startup Order

With the new health checks, services start in this order:

1. **Zookeeper** starts and waits to be healthy
2. **Kafka** waits for Zookeeper health, then starts
3. **Core Services** (game, chat, notification, user_auth) wait for Kafka health
4. **API Gateway** starts
5. **Frontend** starts and waits for API Gateway

For monitoring (when using `make up-all`):
1. **Elasticsearch** starts with health check
2. **Logstash, Kibana** wait for Elasticsearch
3. **Prometheus, Grafana** start independently
4. **Filebeat** waits for Elasticsearch + Logstash

## 📝 Best Practices

1. **Always use `make up` for development** - It's faster and only starts what you need

2. **Use `make fclean` when switching branches** - Ensures clean state

3. **Check logs if something fails:**
   ```bash
   make logs-game
   make logs-kafka
   ```

4. **If services won't start, do a full clean:**
   ```bash
   make fclean
   make up
   ```

5. **Use `make up-bonus` only when you need monitoring** - Saves resources

## 🔄 Workflow Example

```bash
# Start fresh
make fclean
make up

# Wait for services to start (check logs)
make logs

# Work on your feature...

# Need monitoring?
make up-bonus

# Done for the day
make down

# Next day
make up  # Services remember their state (volumes preserved)

# If issues occur
make fclean  # Nuclear option
make up
```

## 📊 Resource Usage

### Core Services (`make up`)
- ~2GB RAM
- Starts in ~1-2 minutes

### All Services (`make up-all`)
- ~4-6GB RAM
- Starts in ~3-5 minutes

## ✅ Success Indicators

After `make up`, you should see:
```
✅ Core services started!
💡 Use 'make up-all' to start ALL services including monitoring stack
```

Check status:
```bash
make status
```

All services should show "Up" status.

Check health:
```bash
make health
```

All services should respond "✅ Healthy".
