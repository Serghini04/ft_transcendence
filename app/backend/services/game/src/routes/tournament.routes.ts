import { FastifyInstance } from 'fastify';
import {
  createTournament,
  getTournaments,
  getTournamentById,
  joinTournament,
  leaveTournament,
  getTournamentBracket,
  deleteTournament
} from '../controllers/tournament.controller';

export default async function tournamentRoutes(app: FastifyInstance) {
  // Create a new tournament
  app.post('/api/v1/game/tournaments', createTournament);

  // Get all tournaments (only waiting tournaments)
  app.get('/api/v1/game/tournaments', getTournaments);

  // Get a specific tournament by ID
  app.get('/api/v1/game/tournaments/:id', getTournamentById);

  // Join a tournament
  app.post('/api/v1/game/tournaments/:id/join', joinTournament);

  // Leave a tournament
  app.post('/api/v1/game/tournaments/:id/leave', leaveTournament);

  // Get tournament bracket (with participants and matches)
  app.get('/api/v1/game/tournaments/:id/bracket', getTournamentBracket);

  // Delete a tournament (creator only)
  app.delete('/api/v1/game/tournaments/:id', deleteTournament);
}
