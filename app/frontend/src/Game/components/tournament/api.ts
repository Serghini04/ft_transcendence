import { UseTokenStore } from '../../../userAuth/zustand/useStore';

const API_BASE_URL = 'http://localhost:8080/api/v1/game';

export interface Tournament {
  id: string;
  name: string;
  creator_id: string;
  max_players: number;
  current_players: number;
  visibility: 'public' | 'private';
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: number;
  started_at?: number;
  completed_at?: number;
}

export interface TournamentParticipant {
  id: number;
  tournament_id: string;
  user_id: string;
  username: string;
  joined_at: number;
  seed?: number;
  avatar?: string;
}

export interface TournamentMatch {
  id: number;
  tournament_id: string;
  round: number;
  position: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  score1?: number;
  score2?: number;
  scheduled_at?: number;
  completed_at?: number;
}

export interface CreateTournamentRequest {
  name: string;
  maxPlayers: number;
  creatorId: string;
  creatorUsername: string;
}

export interface TournamentBracketData {
  tournament: Tournament;
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}

// Helper to get auth headers
const getAuthHeaders = () => {
  const { token } = UseTokenStore.getState();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

/**
 * Create a new tournament
 */
export const createTournament = async (
  name: string,
  maxPlayers: number,
  creatorId: string,
  creatorUsername: string
): Promise<{ success: boolean; tournament: Tournament }> => {
  const response = await fetch(`${API_BASE_URL}/tournaments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name,
      maxPlayers,
      creatorId,
      creatorUsername,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tournament');
  }

  return response.json();
};

/**
 * Get all waiting tournaments
 */
export const getTournaments = async (): Promise<{ success: boolean; tournaments: Tournament[] }> => {
  // Add timestamp to prevent browser caching
  const timestamp = new Date().getTime();
  const response = await fetch(`${API_BASE_URL}/tournaments?_t=${timestamp}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tournaments');
  }

  return response.json();
};

/**
 * Get a specific tournament by ID
 */
export const getTournamentById = async (tournamentId: string): Promise<{ success: boolean; tournament: Tournament }> => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tournament');
  }

  return response.json();
};

/**
 * Join a tournament
 */
export const joinTournament = async (
  tournamentId: string,
  userId: string,
  username: string
): Promise<{ success: boolean; tournament: Tournament }> => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/join`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, username }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join tournament');
  }

  return response.json();
};

/**
 * Leave a tournament
 */
export const leaveTournament = async (
  tournamentId: string,
  userId: string
): Promise<{ success: boolean; tournament?: Tournament; deleted: boolean; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/leave`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to leave tournament');
  }

  return response.json();
};

/**
 * Get tournament bracket (with participants and matches)
 */
export const getTournamentBracket = async (
  tournamentId: string
): Promise<{ success: boolean; data: TournamentBracketData }> => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/bracket?_t=${Date.now()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tournament bracket');
  }

  return response.json();
};

/**
 * Delete a tournament (creator only)
 */
export const deleteTournament = async (
  tournamentId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tournament');
  }

  return response.json();
};
