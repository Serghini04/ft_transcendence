# TicTacToe Online Game - Integration Guide

## Documentation

- [Integration Guide](INTEGRATION.md) - This file (setup and usage)
- [Syntax Explanation](SYNTAX_EXPLANATION.md) - Detailed explanation of TypeScript/React patterns used in the codebase

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend service
cd app/backend/services/tictac

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Backend will be available at: `http://localhost:3003`

### 2. Frontend Setup

```bash
# Navigate to frontend
cd app/frontend

# Create .env file
cp .env.example .env
```

Add to your `.env`:
```env
VITE_TICTAC_API_URL=http://localhost:3003/api
VITE_TICTAC_WS_URL=ws://localhost:3003/ws
```

### 3. Use Online Game Component

Option 1: Replace existing TicTac component:
```tsx
// In your router or main component
import OnlineTicTac from './TicTac/OnlineTicTac';

<Route path="/tictac" element={<OnlineTicTac />} />
```

Option 2: Keep both (local and online):
```tsx
import TicTac from './TicTac/TicTac';        // Local game
import OnlineTicTac from './TicTac/OnlineTicTac';  // Online game

// In your navigation
<Route path="/tictac" element={<TicTac />} />
<Route path="/tictac/online" element={<OnlineTicTac />} />
```

## Features

### Online TicTac Component Features:
- ✅ User login/registration
- ✅ Real-time matchmaking
- ✅ Live gameplay with WebSocket
- ✅ Player statistics display
- ✅ Rating system (ELO)
- ✅ Forfeit option
- ✅ Automatic match finding
- ✅ Connection status indicator

### API Integration:
- User management
- Game state synchronization
- Move validation
- Rating updates
- Game history tracking

### WebSocket Integration:
- Real-time move updates
- Matchmaking notifications
- Game finished events
- Connection management

## File Structure

```
app/
├── backend/services/tictac/
│   ├── src/
│   │   ├── config/         # Database & migrations
│   │   ├── models/         # User, Game, History models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── server.ts       # Main server
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/src/TicTac/
    ├── Assets/             # Images (circle.png, cross.png)
    ├── hooks/
    │   └── useOnlineGame.ts    # Game logic hook
    ├── services/
    │   ├── api.ts              # REST API client
    │   └── websocket.ts        # WebSocket client
    ├── TicTac.tsx              # Local game (original)
    └── OnlineTicTac.tsx        # Online game (new)
```

## Usage Flow

1. **User Opens Game**: User sees login screen
2. **Login**: User enters username (creates account if new)
3. **Find Match**: User clicks "Find Match" button
4. **Matchmaking**: System searches for opponent based on skill rating
5. **Match Found**: Game starts when opponent found
6. **Gameplay**: Players take turns, moves synced in real-time
7. **Game End**: Winner determined, ratings updated
8. **New Game**: Option to find another match

## API Examples

### Create User
```typescript
const user = await TicTacAPI.createOrGetUser("username");
// Returns: { id, username, rating }
```

### Get Stats
```typescript
const stats = await TicTacAPI.getUserStats(userId);
// Returns: { wins, losses, draws, winRate, rating, etc }
```

### Make Move (via WebSocket)
```typescript
wsService.makeMove(gameId, playerId, position);
// Broadcasts to both players
```

## Customization

### Change Colors
Edit `OnlineTicTac.tsx`:
```tsx
// Background
className="bg-[#0f1a24]"  // Change to your color

// Buttons
className="bg-blue-500 hover:bg-blue-600"  // Change blue
```

### Adjust Matchmaking Timeout
Edit backend `.env`:
```env
MATCHMAKING_TIMEOUT=60000  # milliseconds (60 seconds)
SKILL_RANGE=100           # rating difference allowed
```

### Change Starting Rating
Edit `app/backend/services/tictac/src/models/user.model.ts`:
```typescript
rating: 1000,  // Change default rating
```

## Testing

### Test Backend API
```bash
# Health check
curl http://localhost:3003/health

# Create user
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'
```

### Test WebSocket
Use browser console:
```javascript
const ws = new WebSocket('ws://localhost:3003/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({
  type: 'register',
  data: { userId: 'your-user-id' }
}));
```

## Troubleshooting

### Backend won't start
- Check if port 3003 is available
- Ensure SQLite dependencies installed: `npm install`
- Run migrations: `npm run migrate`

### Frontend can't connect
- Check `.env` file has correct URLs
- Verify backend is running on http://localhost:3003
- Check browser console for CORS errors

### WebSocket disconnects
- Check network connection
- Backend will auto-reconnect (max 5 attempts)
- Check backend logs for errors

### Matchmaking not working
- Ensure at least 2 users are searching
- Check matchmaking timeout settings
- Verify WebSocket connection is active

## Production Deployment

### Backend (Docker)
```bash
cd app/backend/services/tictac
docker build -t tictac-game .
docker run -p 3003:3003 -v tictac-data:/app/data tictac-game
```

### Frontend Environment
```env
VITE_TICTAC_API_URL=https://your-domain.com/api
VITE_TICTAC_WS_URL=wss://your-domain.com/ws
```

## Support

For issues or questions:
- Check backend logs: `npm run dev` shows detailed logs
- Check browser console for frontend errors
- Review API documentation in backend README.md
- See [SYNTAX_EXPLANATION.md](SYNTAX_EXPLANATION.md) for understanding advanced TypeScript patterns
