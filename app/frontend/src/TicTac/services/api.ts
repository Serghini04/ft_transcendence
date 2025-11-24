// Dynamically detect the host - use window.location.hostname for network play
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_TICTAC_API_URL) {
    return import.meta.env.VITE_TICTAC_API_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:3003/api`;
};

const API_BASE_URL = getApiBaseUrl();

export interface User {
  id: string;
  username: string;
  rating: number;
}

export interface GameState {
  id: string;
  player1Id: string;
  player2Id: string;
  board: ('X' | 'O' | '')[];
  currentTurn: 'X' | 'O';
  status: 'waiting' | 'active' | 'finished';
  winner: string | null;
  winnerSymbol: 'X' | 'O' | null;
  startedAt: number;
  finishedAt: number | null;
}

export interface UserStats {
  userId: string;
  username: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  rating: number;
  lastPlayed: number | null;
}

export interface GameHistory {
  id: number;
  gameId: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  isDraw: boolean;
  moves: number;
  duration: number;
  createdAt: number;
}

export class TicTacAPI {
  // User endpoints
  static async createOrGetUser(username: string): Promise<User> {
    console.log('[API] Creating user at:', `${API_BASE_URL}/users`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        mode: 'cors',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create/get user: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[API] User created:', data.user);
      return data.user;
    } catch (error) {
      console.error('[API] Fetch error:', error);
      throw error;
    }
  }

  static async getUserStats(userId: string): Promise<UserStats> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`);
    
    if (!response.ok) throw new Error('Failed to get user stats');
    
    const data = await response.json();
    return data.stats;
  }

  static async getUserHistory(userId: string, limit = 20): Promise<GameHistory[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/history?limit=${limit}`);
    
    if (!response.ok) throw new Error('Failed to get user history');
    
    const data = await response.json();
    return data.history;
  }

  static async getLeaderboard(limit = 10): Promise<UserStats[]> {
    const response = await fetch(`${API_BASE_URL}/users/leaderboard?limit=${limit}`);
    
    if (!response.ok) throw new Error('Failed to get leaderboard');
    
    const data = await response.json();
    return data.leaderboard;
  }

  // Game endpoints
  static async getGame(gameId: string): Promise<GameState> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    
    if (!response.ok) throw new Error('Failed to get game');
    
    const data = await response.json();
    return data.game;
  }

  static async makeMove(gameId: string, playerId: string, position: number): Promise<GameState> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, position })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to make move');
    }
    
    const data = await response.json();
    return data.game;
  }

  static async forfeitGame(gameId: string, playerId: string): Promise<GameState> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/forfeit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId })
    });
    
    if (!response.ok) throw new Error('Failed to forfeit game');
    
    const data = await response.json();
    return data.game;
  }

  static async getActiveGame(playerId: string): Promise<GameState | null> {
    const response = await fetch(`${API_BASE_URL}/games/player/${playerId}/active`);
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to get active game');
    
    const data = await response.json();
    return data.game;
  }

  // Matchmaking endpoints
  static async joinMatchmaking(userId: string, username: string, socketId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/matchmaking/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, socketId })
    });
    
    if (!response.ok) throw new Error('Failed to join matchmaking');
    
    return await response.json();
  }

  static async leaveMatchmaking(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/matchmaking/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) throw new Error('Failed to leave matchmaking');
  }

  static async getMatchmakingStatus(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/matchmaking/status`);
    
    if (!response.ok) throw new Error('Failed to get matchmaking status');
    
    return await response.json();
  }
}
