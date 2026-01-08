import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../plugins/game.db';
import {
  CreateTournamentRequest,
  JoinTournamentRequest,
  Tournament,
  TournamentParticipant,
  TournamentBracketData
} from '../types/tournament.types';
import { randomUUID } from 'crypto';

/**
 * Create a new tournament
 */
export const createTournament = async (
  request: FastifyRequest<{ Body: CreateTournamentRequest }>,
  reply: FastifyReply
) => {
  const { name, maxPlayers, creatorId, creatorUsername } = request.body;

  // Validate inputs
  if (!name || !maxPlayers || !creatorId || !creatorUsername) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  if (![4, 8].includes(maxPlayers)) {
    return reply.status(400).send({ error: 'Max players must be 4 or 8' });
  }

  try {
    const tournamentId = randomUUID();
    const createdAt = Date.now();

    // Insert tournament
    const insertTournament = db.prepare(`
      INSERT INTO tournaments (
        id, name, creator_id, max_players, current_players, visibility, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTournament.run(
      tournamentId,
      name,
      creatorId,
      maxPlayers,
      1, // Creator is the first participant
      'public', // All tournaments are public
      'waiting',
      createdAt
    );

    // Add creator as first participant
    const insertParticipant = db.prepare(`
      INSERT INTO tournament_participants (
        tournament_id, user_id, username, joined_at, seed
      ) VALUES (?, ?, ?, ?, ?)
    `);

    insertParticipant.run(
      tournamentId,
      creatorId,
      creatorUsername,
      createdAt,
      1 // Creator gets seed 1
    );

    // Fetch created tournament
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament;

    return reply.status(201).send({
      success: true,
      tournament
    });
  } catch (error) {
    request.log.error('Error creating tournament:', error);
    return reply.status(500).send({ error: 'Failed to create tournament' });
  }
};

/**
 * Get all tournaments (only those that haven't started yet)
 */
export const getTournaments = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const tournaments = db.prepare(`
      SELECT * FROM tournaments 
      WHERE status IN ('waiting', 'in_progress')
      ORDER BY created_at DESC
    `).all() as Tournament[];

    return reply.send({
      success: true,
      tournaments
    });
  } catch (error) {
    request.log.error('Error fetching tournaments:', error);
    return reply.status(500).send({ error: 'Failed to fetch tournaments' });
  }
};

/**
 * Get a specific tournament by ID
 */
export const getTournamentById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  try {
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as Tournament | undefined;

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    return reply.send({
      success: true,
      tournament
    });
  } catch (error) {
    request.log.error('Error fetching tournament:', error);
    return reply.status(500).send({ error: 'Failed to fetch tournament' });
  }
};

/**
 * Start a tournament - create matches and update status
 */
const startTournament = (tournamentId: string) => {
  try {
    const startedAt = Date.now();

    // Update tournament status
    db.prepare(`
      UPDATE tournaments 
      SET status = 'in_progress', started_at = ? 
      WHERE id = ?
    `).run(startedAt, tournamentId);

    // Get all participants
    const participants = db.prepare(`
      SELECT * FROM tournament_participants 
      WHERE tournament_id = ? 
      ORDER BY seed ASC
    `).all(tournamentId) as TournamentParticipant[];

    const maxPlayers = participants.length;
    const totalRounds = Math.log2(maxPlayers);

    // Create Round 1 matches
    const insertMatch = db.prepare(`
      INSERT INTO tournament_matches (
        tournament_id, round, position, player1_id, player2_id, scheduled_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Pair players for first round
    for (let i = 0; i < maxPlayers / 2; i++) {
      const player1 = participants[i * 2];
      const player2 = participants[i * 2 + 1];

      insertMatch.run(
        tournamentId,
        1, // Round 1
        i + 1, // Match position
        player1.user_id,
        player2.user_id,
        startedAt
      );
    }

    // Create placeholder matches for subsequent rounds
    let matchesInPreviousRound = maxPlayers / 2;
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInThisRound = matchesInPreviousRound / 2;
      for (let position = 1; position <= matchesInThisRound; position++) {
        insertMatch.run(
          tournamentId,
          round,
          position,
          null, // TBD from previous round
          null, // TBD from previous round
          null
        );
      }
      matchesInPreviousRound = matchesInThisRound;
    }

    console.log(`🏆 Tournament ${tournamentId} started with ${maxPlayers} players`);
  } catch (error) {
    console.error('Error starting tournament:', error);
  }
};

/**
 * Join a tournament
 */
export const joinTournament = async (
  request: FastifyRequest<{ 
    Params: { id: string };
    Body: { userId: string; username: string };
  }>,
  reply: FastifyReply
) => {
  const { id: tournamentId } = request.params;
  const { userId, username } = request.body;

  if (!userId || !username) {
    return reply.status(400).send({ error: 'Missing userId or username' });
  }

  try {
    // Get tournament
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament | undefined;

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    if (tournament.status !== 'waiting') {
      return reply.status(400).send({ error: 'Tournament has already started' });
    }

    if (tournament.current_players >= tournament.max_players) {
      return reply.status(400).send({ error: 'Tournament is full' });
    }

    // Check if user already joined
    const existingParticipant = db.prepare(`
      SELECT * FROM tournament_participants 
      WHERE tournament_id = ? AND user_id = ?
    `).get(tournamentId, userId);

    if (existingParticipant) {
      return reply.status(400).send({ error: 'You have already joined this tournament' });
    }

    // Add participant
    const nextSeed = tournament.current_players + 1;
    const joinedAt = Date.now();

    const insertParticipant = db.prepare(`
      INSERT INTO tournament_participants (
        tournament_id, user_id, username, joined_at, seed
      ) VALUES (?, ?, ?, ?, ?)
    `);

    insertParticipant.run(tournamentId, userId, username, joinedAt, nextSeed);

    // Update tournament current_players count
    const updateTournament = db.prepare(`
      UPDATE tournaments 
      SET current_players = current_players + 1 
      WHERE id = ?
    `);

    updateTournament.run(tournamentId);

    // Return updated tournament
    const updatedTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament;

    // Check if tournament is now full and start it
    if (updatedTournament.current_players >= updatedTournament.max_players) {
      // Tournament is full - start it!
      console.log(`🚀 Tournament ${tournamentId} is full! Starting...`);
      startTournament(tournamentId);
      console.log(`✅ Tournament ${tournamentId} start complete`);
    } else {
      console.log(`⏳ Tournament ${tournamentId} waiting: ${updatedTournament.current_players}/${updatedTournament.max_players} players`);
    }

    return reply.send({
      success: true,
      tournament: updatedTournament
    });
  } catch (error) {
    request.log.error('Error joining tournament:', error);
    return reply.status(500).send({ error: 'Failed to join tournament' });
  }
};

/**
 * Leave a tournament
 */
export const leaveTournament = async (
  request: FastifyRequest<{ 
    Params: { id: string };
    Body: { userId: string };
  }>,
  reply: FastifyReply
) => {
  const { id: tournamentId } = request.params;
  const { userId } = request.body;

  if (!userId) {
    return reply.status(400).send({ error: 'Missing userId' });
  }

  try {
    // Get tournament
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament | undefined;

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    if (tournament.status !== 'waiting') {
      return reply.status(400).send({ error: 'Cannot leave tournament after it has started' });
    }

    // Check if user is creator
    if (tournament.creator_id === userId) {
      // If creator leaves, delete the entire tournament
      const deleteTournament = db.prepare('DELETE FROM tournaments WHERE id = ?');
      deleteTournament.run(tournamentId);

      return reply.send({
        success: true,
        message: 'Tournament deleted (creator left)',
        deleted: true
      });
    }

    // Remove participant
    const deleteParticipant = db.prepare(`
      DELETE FROM tournament_participants 
      WHERE tournament_id = ? AND user_id = ?
    `);

    const result = deleteParticipant.run(tournamentId, userId);

    if (result.changes === 0) {
      return reply.status(400).send({ error: 'You are not a participant in this tournament' });
    }

    // Update tournament current_players count
    const updateTournament = db.prepare(`
      UPDATE tournaments 
      SET current_players = current_players - 1 
      WHERE id = ?
    `);

    updateTournament.run(tournamentId);

    // Return updated tournament
    const updatedTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament;

    return reply.send({
      success: true,
      tournament: updatedTournament,
      deleted: false
    });
  } catch (error) {
    request.log.error('Error leaving tournament:', error);
    return reply.status(500).send({ error: 'Failed to leave tournament' });
  }
};

/**
 * Get tournament bracket (tournament + participants + matches)
 */
export const getTournamentBracket = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id: tournamentId } = request.params;

  try {
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament | undefined;

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    // Join tournament_participants with users table to get avatars
    const participants = db.prepare(`
      SELECT 
        tp.tournament_id,
        tp.user_id,
        tp.username,
        tp.joined_at,
        tp.seed,
        u.avatar
      FROM tournament_participants tp
      LEFT JOIN users u ON tp.user_id = u.id
      WHERE tp.tournament_id = ? 
      ORDER BY tp.seed ASC
    `).all(tournamentId) as TournamentParticipant[];

    const matches = db.prepare(`
      SELECT * FROM tournament_matches 
      WHERE tournament_id = ? 
      ORDER BY round ASC, position ASC
    `).all(tournamentId) as any[];

    const bracketData: TournamentBracketData = {
      tournament,
      participants,
      matches
    };

    return reply.send({
      success: true,
      data: bracketData
    });
  } catch (error) {
    request.log.error('Error fetching tournament bracket:', error);
    return reply.status(500).send({ error: 'Failed to fetch tournament bracket' });
  }
};

/**
 * Delete a tournament (creator only)
 */
export const deleteTournament = async (
  request: FastifyRequest<{ 
    Params: { id: string };
    Body: { userId: string };
  }>,
  reply: FastifyReply
) => {
  const { id: tournamentId } = request.params;
  const { userId } = request.body;

  if (!userId) {
    return reply.status(400).send({ error: 'Missing userId' });
  }

  try {
    // Get tournament
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament | undefined;

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    // Check if user is creator
    if (tournament.creator_id !== userId) {
      return reply.status(403).send({ error: 'Only the tournament creator can delete it' });
    }

    // Delete tournament (CASCADE will delete participants and matches)
    const deleteTournament = db.prepare('DELETE FROM tournaments WHERE id = ?');
    deleteTournament.run(tournamentId);

    return reply.send({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    request.log.error('Error deleting tournament:', error);
    return reply.status(500).send({ error: 'Failed to delete tournament' });
  }
};
