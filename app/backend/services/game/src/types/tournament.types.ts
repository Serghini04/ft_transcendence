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
  seed?: number; // Player position in bracket
  avatar?: string; // User avatar URL
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

export interface JoinTournamentRequest {
  tournamentId: string;
  userId: string;
  username: string;
}

export interface TournamentBracketData {
  tournament: Tournament;
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}
