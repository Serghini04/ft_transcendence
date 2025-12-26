# Testing Online TicTacToe Matchmaking

## Prerequisites
- Backend service running: `docker-compose up -d tictac-game`
- Frontend running: `cd app/frontend && npm run dev`

## Test Steps

### 1. Open Two Browser Windows
```
Browser 1: http://localhost:5173
Browser 2: http://localhost:5173 (or incognito mode)
```

### 2. Login as Different Users

**Browser 1:**
- Enter username: "Player1"
- Click "Start Playing"

**Browser 2:**
- Enter username: "Player2"
- Click "Start Playing"

### 3. Find Match

**In BOTH browsers:**
- Click "Find Match" button
- You'll see "Searching for opponent..." spinner
- Within seconds, both players will be matched

### 4. Play the Game

**Browser 1 (Player X):**
- Makes the first move by clicking any cell

**Browser 2 (Player O):**
- Sees Player X's move in real-time
- Makes their move when it's their turn

### 5. Game Features to Test

✅ **Real-time Updates**: Moves appear instantly in both browsers
✅ **Turn Management**: Only current player can make moves
✅ **Win Detection**: Game detects winner automatically
✅ **Rating System**: ELO ratings update after game
✅ **Statistics**: Wins/Losses/Draws tracked per user
✅ **Forfeit**: Click "Forfeit" to quit active game
✅ **Rematch**: Click "New Match" to find another opponent

## Matchmaking Logic

The system uses **skill-based matchmaking**:
- Players with similar ratings (±100) are matched together
- If no close match found, expands search range
- Queue timeout: 60 seconds
- Starting rating: 1000 ELO

## WebSocket Events

The system communicates via WebSocket:
```
ws://localhost:3003/ws
```

Events:
- `matchmaking_joined` - Entered queue
- `match_found` - Opponent found
- `game_update` - Move made
- `game_finished` - Game ended

## Troubleshooting

**Can't connect?**
```bash
# Check if service is running
docker-compose ps tictac-game

# Check logs
docker-compose logs tictac-game

# Test health endpoint
curl http://localhost:3003/health
```

**Match not found?**
- Make sure both users clicked "Find Match"
- Check browser console for WebSocket errors
- Verify backend is running and accessible

**Moves not syncing?**
- Check WebSocket connection status (🟢/🔴 indicator)
- Refresh both browsers
- Check network tab for WS connection

## API Endpoints

```
POST   /api/users              - Create/get user
GET    /api/users/:id          - Get user details
GET    /api/users/:id/stats    - Get user statistics
GET    /api/games/:id          - Get game details
POST   /api/matchmaking/join   - Join matchmaking
POST   /api/matchmaking/leave  - Leave matchmaking
```

## Example Flow

```
User 1                          User 2
  |                               |
  | Login "Alice"                 | Login "Bob"
  |                               |
  | Click "Find Match"            | Click "Find Match"
  |                               |
  |-------- Matchmaking Queue --------|
  |                               |
  |<------- Match Found! -------->|
  |                               |
  | Make move (X)                 | See move
  |                               | Make move (O)
  | See move                      |
  |                               |
  |<------- Game continues ------->|
  |                               |
  |<------- Winner detected ------>|
  |                               |
  | Click "New Match"             | Click "New Match"
  |                               |
```

## Advanced Testing

### Test with 3+ Players
- Open 3+ browsers
- Login with different usernames
- Click "Find Match" on all
- Should create multiple concurrent games

### Test Reconnection
- Start a game
- Close one browser tab
- Reopen and login with same username
- Should reconnect to active game

### Test Rating System
- Play multiple games
- Winner gains ELO points
- Loser loses ELO points
- Check `/api/users/:id/stats` for updated ratings
