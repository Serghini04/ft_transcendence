# 🎮 Playing TicTacToe with Friends - Quick Guide

## ✅ WORKING SETUP

### Your Network Details:
- **Your IP Address:** `10.30.250.174`
- **Backend Port:** `3003`
- **Frontend Port:** `5173`

---

## 🚀 Quick Start (Both Players Same Network)

### Host (You):
```bash
# 1. Start services
docker-compose up -d

# 2. Start frontend
cd app/frontend
npm run dev

# 3. Open browser
http://localhost:5173
```

### Friend (On Same WiFi):
```
Open browser: http://10.30.250.174:5173
```

---

## 🎯 How to Play:

1. **Both players** go to TicTacToe → Online Multiplayer
2. **Both players** enter different usernames
3. **Both players** click "Find Match"
4. **System automatically matches** you together! 🎉
5. Play TicTacToe in real-time

---

## 📊 Features:

- ✅ Real-time gameplay via WebSocket
- ✅ ELO rating system (starts at 1000)
- ✅ Win/Loss/Draw statistics
- ✅ Automatic matchmaking based on skill level
- ✅ Move validation and turn management
- ✅ Forfeit option during games

---

## 🔧 Troubleshooting:

### Friend Can't Connect?

**Network Test Page:**
```
http://10.30.250.174:5173/network-test
```

**Check Backend Health:**
```bash
curl http://10.30.250.174:3003/health
```

**Restart Services:**
```bash
docker-compose restart tictac-game
cd app/frontend && npm run dev
```

**Clear Browser Cache:**
- Press `Ctrl+Shift+R` (Windows/Linux)
- Press `Cmd+Shift+R` (Mac)

---

## 🌐 Configuration:

### CORS Allowed Origins:
- `http://localhost:5173`
- `http://localhost:8888`
- `http://10.30.250.174:5173`
- `http://10.30.250.174:8888`

### Ports Exposed:
- `3003` - TicTacToe Backend (API + WebSocket)
- `5173` - Frontend (Vite Dev Server)

---

## 📱 Multiple Friends:

The system supports multiple concurrent games:

1. **Friend 1** and **Friend 2** both join matchmaking
2. They get matched together (Game 1)
3. **Friend 3** and **Friend 4** join matchmaking
4. They get matched together (Game 2)
5. Multiple games run simultaneously! 🎮

---

## 🏆 Leaderboard & Stats:

Each player gets:
- **Wins** - Total victories
- **Losses** - Total defeats  
- **Draws** - Tied games
- **Rating** - ELO score (starts at 1000)
- **Win Rate** - Percentage of games won

Rating changes based on game results:
- Win vs higher-rated: **+Points**
- Win vs lower-rated: **+Fewer Points**
- Loss: **-Points**

---

## 🎨 Game Modes:

### Local Mode (`/tictac`):
- Same computer
- Two players take turns
- No login required
- Score tracking per session

### Online Mode (`/tictac-online`):
- Network play
- Matchmaking system
- Account-based stats
- ELO ratings

---

## 💾 Data Persistence:

Game data is stored in Docker volume:
```bash
docker volume inspect trancsendence_tictac-data
```

To backup data:
```bash
docker run --rm -v trancsendence_tictac-data:/data -v $(pwd):/backup alpine tar czf /backup/tictac-backup.tar.gz -C /data .
```

To restore data:
```bash
docker run --rm -v trancsendence_tictac-data:/data -v $(pwd):/backup alpine tar xzf /backup/tictac-backup.tar.gz -C /data
```

---

## 🔐 Security Notes:

- ✅ Rate limiting: 100 requests/minute per IP
- ✅ CORS protection for allowed origins
- ✅ Input validation on all endpoints
- ✅ WebSocket authentication via userId
- ⚠️ **Local network only** - not exposed to internet

---

## 📈 Monitoring:

### Check Service Status:
```bash
docker-compose ps tictac-game
```

### View Logs:
```bash
docker-compose logs -f tictac-game
```

### Check Active Connections:
```bash
curl http://localhost:3003/api/ws/stats
```

### Matchmaking Queue Status:
```bash
curl http://localhost:3003/api/matchmaking/status
```

---

## 🎯 Share This With Friends:

**Just share your IP + Port:**
```
http://10.30.250.174:5173
```

**Game Selection:**
Click the Grid icon (🔲) in the sidebar → Choose "Online Multiplayer"

**That's it!** ✨

---

## 🆘 Support Commands:

```bash
# Check if backend is running
docker-compose ps tictac-game

# Restart backend
docker-compose restart tictac-game

# View backend logs
docker-compose logs --tail=50 tictac-game

# Test API
curl http://localhost:3003/health

# Check frontend
lsof -i :5173

# Get your IP
ipconfig getifaddr en0
```

---

## 🎊 Enjoy Playing!

You're all set up for online multiplayer TicTacToe! 🎮

Questions? Check the logs or run the network test page.
