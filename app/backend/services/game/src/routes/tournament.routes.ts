import { FastifyInstance } from 'fastify';
import {
  createTournament,
  getTournaments,
  getTournamentById,
  joinTournament,
  leaveTournament,
  getTournamentBracket,
  deleteTournament,
  getUserFriends,
  inviteFriendsToTournament,
  acceptTournamentInvitation,
  declineTournamentInvitation,
  getUserTournamentInvitations,
  getTournamentInvitation
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

  // Get user's friends
  app.get('/api/v1/game/users/:userId/friends', getUserFriends);

  // Invite friends to tournament
  app.post('/api/v1/game/tournaments/:id/invite', inviteFriendsToTournament);

  // Get user's tournament invitations
  app.get('/api/v1/game/users/:userId/tournament-invitations', getUserTournamentInvitations);

  // Get a specific tournament invitation
  app.get('/api/v1/game/tournament-invitations/:id', getTournamentInvitation);

  // Accept tournament invitation
  app.post('/api/v1/game/tournament-invitations/:id/accept', acceptTournamentInvitation);

  // Decline tournament invitation
  app.post('/api/v1/game/tournament-invitations/:id/decline', declineTournamentInvitation);
}

