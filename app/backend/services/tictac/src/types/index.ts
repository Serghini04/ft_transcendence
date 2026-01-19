export interface Player {
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

export interface Move {
  gameId: string;
  playerId: string;
  position: number;
  symbol: 'X' | 'O';
  timestamp: number;
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

export interface MatchmakingPlayer {
  userId: string;
  username: string;
  rating: number;
  socketId: string;
  joinedAt: number;
}

export interface DBGame {
  id: string;
  player1_id: string;
  player2_id: string;
  board: string;
  current_turn: string;
  status: string;
  winner_id: string | null;
  winner_symbol: string | null;
  started_at: number;
  finished_at: number | null;
}

export interface DBUser {
  userId: string;
  name: string;
  rating: number;
  created_at: number;
}

export interface DBGameHistory {
  id: number;
  game_id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  is_draw: number;
  moves: number;
  duration: number;
  created_at: number;
}
