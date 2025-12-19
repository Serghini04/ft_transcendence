# TicTac Game Service

A comprehensive TicTacToe game backend service built with Fastify, TypeScript, and SQLite.

## Features

✨ **Core Gameplay**
- Real-time TicTacToe game logic
- Move validation and winner detection
- Turn-based gameplay with state management

🎯 **Matchmaking System**
- Skill-based matchmaking with ELO rating
- Queue management with timeout handling
- Fair player pairing algorithm

📊 **User History & Statistics**
- Complete game history tracking
- Player statistics (wins, losses, draws, win rate)
- ELO rating system for skill tracking
- Leaderboard system

🔌 **Real-time Communication**
- WebSocket support for live gameplay
- Real-time game updates and notifications
- Match found notifications

🛡️ **Security & Performance**
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQLite with WAL mode for performance

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run database migrations
npm run migrate

# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Environment Variables

```env
PORT=3003
HOST=0.0.0.0
NODE_ENV=development
DATABASE_PATH=./data/tictac.db
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=60000
MATCHMAKING_TIMEOUT=60000
SKILL_RANGE=100
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### Users
- `POST /api/users` - Create or get user
- `GET /api/users/:userId/stats` - Get user statistics
- `GET /api/users/:userId/history` - Get user game history
- `GET /api/users/leaderboard` - Get leaderboard

### Games
- `GET /api/games/:gameId` - Get game by ID
- `POST /api/games/:gameId/move` - Make a move
- `POST /api/games/:gameId/forfeit` - Forfeit game
- `GET /api/games/player/:playerId/active` - Get player's active game
- `GET /api/games/player/:playerId` - Get player's games

### Matchmaking
- `POST /api/matchmaking/join` - Join matchmaking queue
- `POST /api/matchmaking/leave` - Leave matchmaking queue
- `GET /api/matchmaking/status` - Get queue status
- `GET /api/matchmaking/check/:userId` - Check if user is in queue

### WebSocket

Connect to `ws://localhost:3003/ws`

**Message Types:**

```typescript
// Register connection
{ type: 'register', data: { userId: string } }

// Join matchmaking
{ type: 'join_matchmaking', data: { userId: string, username: string } }

// Leave matchmaking
{ type: 'leave_matchmaking', data: { userId: string } }

// Join game
{ type: 'join_game', data: { userId: string, gameId: string } }

// Make move
{ type: 'make_move', data: { gameId: string, playerId: string, position: number } }

// Forfeit game
{ type: 'forfeit', data: { gameId: string, playerId: string } }
```

**Server Events:**

```typescript
// Match found
{ type: 'match_found', game: GameState, opponent: Player }

// Game update
{ type: 'game_update', game: GameState }

// Game finished
{ type: 'game_finished', game: GameState, reason?: string }

// Errors
{ type: 'error', message: string }
```

## Docker

```bash
# Build image
docker build -t tictac-game-service .

# Run container
docker run -p 3003:3003 -v $(pwd)/data:/app/data tictac-game-service
```

## Database Schema

### Users
- id (TEXT, PRIMARY KEY)
- username (TEXT, UNIQUE)
- rating (INTEGER, DEFAULT 1000)
- created_at (INTEGER)

### Games
- id (TEXT, PRIMARY KEY)
- player1_id (TEXT, FOREIGN KEY)
- player2_id (TEXT, FOREIGN KEY)
- board (TEXT, JSON)
- current_turn (TEXT)
- status (TEXT)
- winner_id (TEXT, FOREIGN KEY)
- winner_symbol (TEXT)
- started_at (INTEGER)
- finished_at (INTEGER)

### Game History
- id (INTEGER, PRIMARY KEY AUTOINCREMENT)
- game_id (TEXT, FOREIGN KEY)
- player1_id (TEXT, FOREIGN KEY)
- player2_id (TEXT, FOREIGN KEY)
- winner_id (TEXT, FOREIGN KEY)
- is_draw (INTEGER)
- moves (INTEGER)
- duration (INTEGER)
- created_at (INTEGER)

## Architecture

```
src/
├── config/          # Database configuration and migrations
├── models/          # Database models and queries
├── routes/          # API route handlers
├── services/        # Business logic (game, matchmaking, websocket)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Main application entry point
```

## Features Implementation

### Game Logic
- 3x3 board management
- Win condition checking (rows, columns, diagonals)
- Draw detection
- Turn validation
- Move history tracking

### Matchmaking
- Skill-based matching using ELO ratings
- Queue timeout management
- Fair pairing algorithm
- Automatic match creation

### Rating System
- ELO-based rating calculation
- K-factor of 32 for rating changes
- Rating updates after each game
- Expected score calculation

### WebSocket Integration
- Real-time game state updates
- Matchmaking notifications
- Player connection management
- Automatic cleanup on disconnect

## License

MIT
