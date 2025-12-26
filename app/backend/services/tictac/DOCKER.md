# TicTac Game Service - Docker Setup

## 🚀 Quick Start

The TicTac game service has been added to the docker-compose stack!

### Start the Service

```bash
# Build and start all services (including tictac-game)
make up

# Or using docker-compose directly
docker-compose up -d tictac-game

# View logs
docker-compose logs -f tictac-game
```

### Access the Services

- **TicTac Game API**: http://localhost:3003/api
- **TicTac Game WebSocket**: ws://localhost:3003/ws
- **Health Check**: http://localhost:3003/health
- **Frontend**: http://localhost:8888

## 📦 Docker Configuration

### Service Details

**Container Name**: `tictac-game`  
**Image**: `tictac-game`  
**Port**: `3003`  
**Network**: `ft_Transc`  

### Environment Variables

```yaml
PORT: 3003
HOST: 0.0.0.0
NODE_ENV: production
DATABASE_PATH: /app/data/tictac.db
RATE_LIMIT_MAX: 100
RATE_LIMIT_TIMEWINDOW: 60000
MATCHMAKING_TIMEOUT: 60000
SKILL_RANGE: 100
CORS_ORIGIN: http://localhost:8888
```

### Volume

- **tictac-data**: Persistent SQLite database storage at `/app/data`

## 🔧 Management Commands

```bash
# Start the service
docker-compose up -d tictac-game

# Stop the service
docker-compose stop tictac-game

# Restart the service
docker-compose restart tictac-game

# View logs
docker-compose logs -f tictac-game

# Check service status
docker-compose ps tictac-game

# Execute commands in container
docker-compose exec tictac-game sh

# Rebuild after code changes
docker-compose build tictac-game
docker-compose up -d tictac-game
```

## 🗄️ Database Management

The SQLite database is stored in a Docker volume for persistence.

### Access Database

```bash
# Enter the container
docker-compose exec tictac-game sh

# Inside container, check database
cd /app/data
ls -la tictac.db
```

### Backup Database

```bash
# Copy database from container
docker cp tictac-game:/app/data/tictac.db ./backup-tictac.db

# Restore database
docker cp ./backup-tictac.db tictac-game:/app/data/tictac.db
docker-compose restart tictac-game
```

### Reset Database

```bash
# Remove volume (will delete all data!)
docker-compose down
docker volume rm trancsendence_tictac-data
docker-compose up -d tictac-game
```

## 🏥 Health Check

The service includes an automatic health check:

- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Start Period**: 10 seconds
- **Retries**: 3

Check health status:

```bash
# Via Docker
docker-compose ps tictac-game

# Via API
curl http://localhost:3003/health
```

## 🔍 Monitoring & Logs

### View Logs

```bash
# Real-time logs
docker-compose logs -f tictac-game

# Last 100 lines
docker-compose logs --tail=100 tictac-game

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 tictac-game
```

### Log Configuration

Logs are configured with:
- Driver: `json-file`
- Max Size: `10m`
- Max Files: `3`

Logs are stored at: `/var/lib/docker/containers/<container-id>/<container-id>-json.log`

## 🔄 Integration with Frontend

The frontend is already configured to connect to the service:

**Frontend .env** (`app/frontend/.env`):
```env
VITE_TICTAC_API_URL=http://localhost:3003/api
VITE_TICTAC_WS_URL=ws://localhost:3003/ws
```

### Using with Frontend

```tsx
// The frontend can now use the online game
import OnlineTicTac from './TicTac/OnlineTicTac';

<Route path="/tictac/online" element={<OnlineTicTac />} />
```

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
docker-compose logs tictac-game

# Check if port 3003 is in use
lsof -i :3003

# Rebuild from scratch
docker-compose build --no-cache tictac-game
docker-compose up -d tictac-game
```

### Connection Issues

```bash
# Check network
docker network inspect ft_Transc

# Test API from host
curl http://localhost:3003/health

# Test API from another container
docker-compose exec service-a curl http://tictac-game:3003/health
```

### Database Issues

```bash
# Check database file permissions
docker-compose exec tictac-game ls -la /app/data/

# Check disk space
docker-compose exec tictac-game df -h

# Inspect volume
docker volume inspect trancsendence_tictac-data
```

### WebSocket Connection Failed

```bash
# Check if WebSocket port is exposed
docker-compose ps tictac-game

# Test WebSocket (using wscat)
npm install -g wscat
wscat -c ws://localhost:3003/ws

# Check CORS settings
docker-compose exec tictac-game env | grep CORS
```

## 📊 Service Endpoints

### REST API

- `GET /health` - Health check
- `POST /api/users` - Create/get user
- `GET /api/users/:userId/stats` - User statistics
- `GET /api/users/:userId/history` - Game history
- `GET /api/users/leaderboard` - Leaderboard
- `GET /api/games/:gameId` - Get game
- `POST /api/games/:gameId/move` - Make move
- `POST /api/games/:gameId/forfeit` - Forfeit game
- `GET /api/games/player/:playerId/active` - Active game
- `POST /api/matchmaking/join` - Join matchmaking
- `POST /api/matchmaking/leave` - Leave matchmaking
- `GET /api/matchmaking/status` - Queue status

### WebSocket

Connect to: `ws://localhost:3003/ws`

**Client Messages:**
- `register` - Register connection
- `join_game` - Join game room
- `make_move` - Make a move
- `join_matchmaking` - Join queue
- `leave_matchmaking` - Leave queue
- `forfeit` - Forfeit game

**Server Events:**
- `match_found` - Match found
- `game_update` - Game state updated
- `game_finished` - Game finished
- `error` - Error occurred

## 🔐 Security Notes

- Service runs as non-root user (`node`)
- Rate limiting enabled (100 requests per minute)
- CORS configured for frontend origin
- Health checks monitor service availability
- Logs are size-limited to prevent disk issues

## 🚀 Production Deployment

For production, update environment variables:

```yaml
environment:
  - NODE_ENV=production
  - CORS_ORIGIN=https://yourdomain.com
  - RATE_LIMIT_MAX=1000
  - DATABASE_PATH=/app/data/tictac.db
```

And consider:
- Using a reverse proxy (nginx)
- SSL/TLS for WebSocket (wss://)
- Database backups
- Log aggregation (ELK stack is already configured)
- Monitoring (Prometheus/Grafana already available)

## 📝 Notes

- Database persists across container restarts via Docker volume
- First run will auto-create database schema via migrations
- Service automatically reconnects to WebSocket on disconnect
- Rating system uses ELO algorithm (K-factor: 32)
- Initial player rating: 1000
