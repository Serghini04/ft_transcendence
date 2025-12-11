# TicTacToe Game Module

This directory contains the TicTacToe game implementation with both local and online multiplayer modes.

## 📚 Documentation

- **[INTEGRATION.md](INTEGRATION.md)** - Setup guide, API integration, and deployment instructions
- **[SYNTAX_EXPLANATION.md](SYNTAX_EXPLANATION.md)** - Detailed explanation of advanced TypeScript/React patterns used in the codebase

## 📁 Structure

```
TicTac/
├── Assets/              # Game images (X and O symbols)
├── hooks/               # Custom React hooks
│   └── useOnlineGame.ts
├── services/            # API and WebSocket services
│   ├── api.ts
│   └── websocket.ts
├── GameSelection.tsx    # Game mode selection screen
├── TicTac.tsx          # Local game wrapper
├── TicTacGame.tsx      # Main game component (shared by local & online)
└── OnlineTicTac.tsx    # Online multiplayer wrapper
```

## 🎮 Components

### TicTacGame.tsx
The main game component that renders the board and handles game logic. Supports both local and online modes.

**Key Features:**
- Responsive grid layout with animations
- Win detection with highlighting
- Score tracking
- Player turn indicators
- Beautiful UI with gradients and effects

**Advanced Patterns:**
- Uses computed property names for dynamic state updates
- Type assertions for TypeScript safety
- React state management with functional updates

See [SYNTAX_EXPLANATION.md](SYNTAX_EXPLANATION.md) for detailed explanations of advanced syntax patterns.

### OnlineTicTac.tsx
Wrapper for online multiplayer mode with WebSocket integration.

**Features:**
- Real-time matchmaking
- Live move synchronization
- Player statistics
- Rating system (ELO)
- Connection status monitoring

### TicTac.tsx
Simple wrapper for local two-player mode.

## 🚀 Quick Start

### Local Game
```typescript
import TicTac from './TicTac/TicTac';

// In your router
<Route path="/tictac" element={<TicTac />} />
```

### Online Game
See [INTEGRATION.md](INTEGRATION.md) for complete setup instructions including backend configuration.

## 🔍 Learning Resources

If you're new to the codebase or want to understand specific patterns:

1. **TypeScript Syntax** - See [SYNTAX_EXPLANATION.md](SYNTAX_EXPLANATION.md) for explanations of:
   - Spread operator (`...prev`)
   - Computed property names (`[variable]`)
   - Type assertions (`as Type`)
   - React state updater functions

2. **Integration** - See [INTEGRATION.md](INTEGRATION.md) for:
   - Backend setup
   - API endpoints
   - WebSocket communication
   - Deployment guide

## 🎯 Game Modes

### Local Mode
- Two players on the same device
- No network connection required
- Score tracking across rounds
- Custom player names

### Online Mode
- Real-time multiplayer
- Matchmaking based on skill rating
- Player statistics and leaderboards
- WebSocket-based communication

## 🛠️ Development

The game uses modern React patterns:
- Functional components with hooks
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide React for icons

## 📝 Notes

- The game uses a shared `TicTacGame` component for both modes
- State management differs between local (useState) and online (WebSocket events)
- The UI is fully responsive and works on mobile devices
- All animations are CSS-based for smooth performance
