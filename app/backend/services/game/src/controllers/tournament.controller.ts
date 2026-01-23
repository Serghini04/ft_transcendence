import { FastifyRequest, FastifyReply } from 'fastify';
import { db, saveGameResult } from '../plugins/game.db';
import {
  CreateTournamentRequest,
  JoinTournamentRequest,
  Tournament,
  TournamentParticipant,
  TournamentBracketData
} from '../types/tournament.types';
import { randomUUID } from 'crypto';
import { checkAndAdvanceWinners } from './game.controller';
import * as http from 'http';

// Helper to send notification via HTTP
async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  metadata?: any
): Promise<boolean> {
  return new Promise((resolve) => {
    const data = JSON.stringify({ userId, title, message, type, metadata });
    
    console.log('🔔 sendNotification called:', { userId, title, hostname: 'notification-service', port: 3006 });
    
    const options = {
      hostname: 'notification-service',
      port: 3006,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res: http.IncomingMessage) => {
      console.log('🔔 HTTP response status:', res.statusCode);
      resolve(res.statusCode === 201);
    });

    req.on('error', (err) => {
      console.error('🔔 HTTP request error:', err.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

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

    // Cannot leave completed tournaments
    if (tournament.status === 'completed') {
      return reply.status(400).send({ error: 'Cannot leave a completed tournament' });
    }

    // Handle leaving during waiting status (before tournament starts)
    if (tournament.status === 'waiting') {
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
    }

    // Handle leaving during in_progress status (forfeit)
    if (tournament.status === 'in_progress') {
      console.log(`🚪 User ${userId} leaving active tournament ${tournamentId} (forfeit)`);

      // Find any active match where user is playing (no winner yet)
      const activeMatch = db.prepare(`
        SELECT * FROM tournament_matches 
        WHERE tournament_id = ? 
        AND (player1_id = ? OR player2_id = ?) 
        AND winner_id IS NULL
        AND player1_id IS NOT NULL
        AND player2_id IS NOT NULL
        LIMIT 1
      `).get(tournamentId, userId, userId) as any;

      if (activeMatch) {
        // User has an active match - mark opponent as winner (forfeit)
        const opponentId = activeMatch.player1_id === userId ? activeMatch.player2_id : activeMatch.player1_id;
        
        console.log(`⚠️ Forfeit: User ${userId} forfeits match ${activeMatch.id}, opponent ${opponentId} wins`);

        // Determine scores based on who forfeited
        const score1 = activeMatch.player1_id === opponentId ? 5 : 0;
        const score2 = activeMatch.player2_id === opponentId ? 5 : 0;

        // Update match with forfeit result
        const updateMatch = db.prepare(`
          UPDATE tournament_matches 
          SET winner_id = ?, 
              score1 = ?,
              score2 = ?,
              completed_at = ?
          WHERE id = ?
        `);

        updateMatch.run(opponentId, score1, score2, Date.now(), activeMatch.id);

        console.log(`✅ Match ${activeMatch.id} updated: Winner ${opponentId} by forfeit (${score1}-${score2})`);

        // Save game result to games table
        saveGameResult(db, {
          gameId: `tournament-${tournamentId}-${activeMatch.id}`,
          mode: 'tournament',
          player1Id: activeMatch.player1_id,
          player2Id: activeMatch.player2_id,
          winnerId: opponentId,
          score1: score1,
          score2: score2,
          createdAt: Date.now()
        });

        console.log(`💾 Forfeit game saved to database`);

        // Notify opponent via socket that they won by forfeit
        const namespace = request.server.io.of('/game');
        const roomId = `tournament-${tournamentId}-${activeMatch.id}`;
        
        console.log(`📢 Emitting forfeit win to room: ${roomId}`);
        namespace.to(roomId).emit('opponentForfeited', {
          winnerId: opponentId,
          message: 'Your opponent left the tournament. You win by forfeit!',
          matchId: activeMatch.id,
          tournamentId: tournamentId
        });

        // Check if we need to advance winners to next round
        await checkAndAdvanceWinners(db, tournamentId, activeMatch.id);
      } else {
        console.log(`ℹ️ User ${userId} already eliminated or no active match - can leave freely`);
      }

      // Keep participant in database (they stay as a participant who lost)
      console.log(`✅ User ${userId} forfeited tournament ${tournamentId} - marked as loser in match`);

      return reply.send({
        success: true,
        message: 'Left tournament (forfeit)',
        forfeited: true,
        deleted: false
      });
    }

    return reply.send({
      success: true,
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

/**
 * Get user's friends from relationships table
 */
export const getUserFriends = async (
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) => {
  const { userId } = request.params;

  try {
    // Get friends where user is either user1_id or user2_id and type is 'friend'
    // Using UNION to get friends from both directions
    const friends = db.prepare(`
      SELECT DISTINCT
        u.id,
        u.name as username,
        u.avatar as avatar_url
      FROM relationships r
      JOIN users u ON u.id = r.user2_id
      WHERE r.user1_id = ? AND r.type = 'friend'
      UNION
      SELECT DISTINCT
        u.id,
        u.name as username,
        u.avatar as avatar_url
      FROM relationships r
      JOIN users u ON u.id = r.user1_id
      WHERE r.user2_id = ? AND r.type = 'friend'
    `).all(userId, userId) as Array<{ id: string; username: string; avatar_url: string }>;

    return reply.send({
      success: true,
      friends
    });
  } catch (error) {
    request.log.error('Error fetching user friends:', error);
    return reply.status(500).send({ error: 'Failed to fetch friends' });
  }
};

/**
 * Invite friends to a tournament (creates pending invitations, doesn't auto-join)
 */
export const inviteFriendsToTournament = async (
  request: FastifyRequest<{ 
    Params: { id: string };
    Body: { userId: string; friendIds: string[] }
  }>,
  reply: FastifyReply
) => {
  const { id: tournamentId } = request.params;
  const { userId, friendIds } = request.body;

  if (!userId || !friendIds || friendIds.length === 0) {
    return reply.status(400).send({ error: 'Missing userId or friendIds' });
  }

  try {
    // Check if tournament exists and user is the creator
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournamentId) as Tournament | undefined;

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    if (tournament.creator_id !== userId) {
      return reply.status(403).send({ error: 'Only the creator can invite friends' });
    }

    if (tournament.status !== 'waiting') {
      return reply.status(400).send({ error: 'Tournament has already started' });
    }

    const sentInvitations: string[] = [];
    const alreadyInvited: string[] = [];
    const alreadyJoined: string[] = [];

    // Create invitation for each friend
    for (const friendId of friendIds) {
      // Check if friend already joined
      const existing = db.prepare(`
        SELECT * FROM tournament_participants 
        WHERE tournament_id = ? AND user_id = ?
      `).get(tournamentId, friendId);

      if (existing) {
        alreadyJoined.push(friendId);
        continue;
      }

      // Check if invitation already exists
      const existingInvite = db.prepare(`
        SELECT * FROM tournament_invitations 
        WHERE tournament_id = ? AND invitee_id = ? AND status = 'pending'
      `).get(tournamentId, friendId);

      if (existingInvite) {
        alreadyInvited.push(friendId);
        continue;
      }

      // Create invitation
      const insertInvitation = db.prepare(`
        INSERT INTO tournament_invitations (
          tournament_id, inviter_id, invitee_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `);

      const result = insertInvitation.run(
        tournamentId,
        userId,
        friendId,
        'pending',
        Date.now()
      );

      const invitationId = result.lastInsertRowid;

      sentInvitations.push(friendId);
      
      // Send notification to friend via notification service
      const inviter = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
      const inviterName = inviter?.name || 'Someone';
      
      request.log.info(`📨 Sending notification to user ${friendId} for tournament ${tournament.name}`);
      const notificationSent = await sendNotification(
        friendId,
        'Tournament Invitation',
        `${inviterName} invited you to join ${tournament.name}`,
        'tournament_invite',
        { 
          invitationId: Number(invitationId),
          tournamentId, 
          inviterName, 
          tournamentName: tournament.name 
        }
      );
      request.log.info(`📨 Notification sent: ${notificationSent ? 'SUCCESS' : 'FAILED'}`);
    }

    return reply.send({
      success: true,
      sentInvitations,
      alreadyInvited,
      alreadyJoined,
      message: `${sentInvitations.length} invitation(s) sent`
    });
  } catch (error) {
    request.log.error('Error inviting friends to tournament:', error);
    return reply.status(500).send({ error: 'Failed to invite friends' });
  }
};

/**
 * Get user's pending tournament invitations
 */
export const getUserTournamentInvitations = async (
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) => {
  const { userId } = request.params;

  try {
    const invitations = db.prepare(`
      SELECT 
        i.id,
        i.tournament_id,
        i.inviter_id,
        i.status,
        i.created_at,
        t.name as tournament_name,
        t.max_players,
        t.current_players,
        u.name as inviter_name
      FROM tournament_invitations i
      JOIN tournaments t ON i.tournament_id = t.id
      JOIN users u ON i.inviter_id = u.id
      WHERE i.invitee_id = ? AND i.status = 'pending' AND t.status = 'waiting'
      ORDER BY i.created_at DESC
    `).all(userId);

    return reply.send({
      success: true,
      invitations
    });
  } catch (error) {
    request.log.error('Error fetching tournament invitations:', error);
    return reply.status(500).send({ error: 'Failed to fetch invitations' });
  }
};

/**
 * Get a specific tournament invitation by ID
 */
export const getTournamentInvitation = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id: invitationId } = request.params;

  try {
    const invitation = db.prepare(`
      SELECT 
        i.id,
        i.tournament_id,
        i.inviter_id,
        i.invitee_id,
        i.status,
        i.created_at,
        i.responded_at
      FROM tournament_invitations i
      WHERE i.id = ?
    `).get(invitationId);

    if (!invitation) {
      return reply.status(404).send({ error: 'Invitation not found' });
    }

    return reply.send({
      success: true,
      invitation
    });
  } catch (error) {
    request.log.error('Error fetching tournament invitation:', error);
    return reply.status(500).send({ error: 'Failed to fetch invitation' });
  }
};

/**
 * Accept tournament invitation
 */
export const acceptTournamentInvitation = async (
  request: FastifyRequest<{ 
    Params: { id: string };
    Body: { userId: string }
  }>,
  reply: FastifyReply
) => {
  const { id: invitationId } = request.params;
  const { userId } = request.body;

  if (!userId) {
    return reply.status(400).send({ error: 'Missing userId' });
  }

  try {
    // Get invitation
    const invitation = db.prepare(`
      SELECT * FROM tournament_invitations WHERE id = ? AND invitee_id = ?
    `).get(invitationId, userId) as any;

    if (!invitation) {
      return reply.status(404).send({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return reply.status(400).send({ error: 'Invitation already responded to' });
    }

    // Get tournament
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(invitation.tournament_id) as Tournament | undefined;

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    if (tournament.status !== 'waiting') {
      return reply.status(400).send({ error: 'Tournament has already started' });
    }

    if (tournament.current_players >= tournament.max_players) {
      return reply.status(400).send({ error: 'Tournament is full' });
    }

    // Get user info
    const user = db.prepare('SELECT name as username FROM users WHERE id = ?').get(userId) as { username: string } | undefined;
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Add user to tournament
    const insertParticipant = db.prepare(`
      INSERT INTO tournament_participants (
        tournament_id, user_id, username, joined_at, seed
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const currentPlayers = db.prepare(`
      SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?
    `).get(invitation.tournament_id) as { count: number };

    insertParticipant.run(
      invitation.tournament_id,
      userId,
      user.username,
      Date.now(),
      currentPlayers.count + 1
    );

    // Update invitation status
    db.prepare(`
      UPDATE tournament_invitations 
      SET status = 'accepted', responded_at = ?
      WHERE id = ?
    `).run(Date.now(), invitationId);

    // Update tournament player count
    const newCount = db.prepare(`
      SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?
    `).get(invitation.tournament_id) as { count: number };

    db.prepare('UPDATE tournaments SET current_players = ? WHERE id = ?').run(newCount.count, invitation.tournament_id);

    // Get updated tournament to check if it's full
    const updatedTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(invitation.tournament_id) as Tournament;

    // Check if tournament is now full and start it
    if (updatedTournament.current_players >= updatedTournament.max_players) {
      // Tournament is full - start it!
      console.log(`🚀 Tournament ${invitation.tournament_id} is full (via invitation)! Starting...`);
      startTournament(invitation.tournament_id);
      console.log(`✅ Tournament ${invitation.tournament_id} start complete`);
    } else {
      console.log(`⏳ Tournament ${invitation.tournament_id} waiting: ${updatedTournament.current_players}/${updatedTournament.max_players} players`);
    }

    // Update notification metadata to mark invitation as accepted
    const updateData = JSON.stringify({
      userId,
      invitationId: Number(invitationId),
      status: 'accepted'
    });
    
    const updateReq = http.request({
      hostname: 'notification-service',
      port: 3006,
      path: '/api/v1/notifications/update-metadata',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': updateData.length
      }
    }, () => {});
    
    updateReq.on('error', () => {});
    updateReq.write(updateData);
    updateReq.end();

    return reply.send({
      success: true,
      message: 'Invitation accepted, you joined the tournament'
    });
  } catch (error) {
    request.log.error('Error accepting tournament invitation:', error);
    return reply.status(500).send({ error: 'Failed to accept invitation' });
  }
};

/**
 * Decline tournament invitation
 */
export const declineTournamentInvitation = async (
  request: FastifyRequest<{ 
    Params: { id: string };
    Body: { userId: string }
  }>,
  reply: FastifyReply
) => {
  const { id: invitationId } = request.params;
  const { userId } = request.body;

  if (!userId) {
    return reply.status(400).send({ error: 'Missing userId' });
  }

  try {
    // Get invitation
    const invitation = db.prepare(`
      SELECT * FROM tournament_invitations WHERE id = ? AND invitee_id = ?
    `).get(invitationId, userId) as any;

    if (!invitation) {
      return reply.status(404).send({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return reply.status(400).send({ error: 'Invitation already responded to' });
    }

    // Update invitation status
    db.prepare(`
      UPDATE tournament_invitations 
      SET status = 'declined', responded_at = ?
      WHERE id = ?
    `).run(Date.now(), invitationId);

    // Update notification metadata to mark invitation as declined
    const updateData = JSON.stringify({
      userId,
      invitationId: Number(invitationId),
      status: 'declined'
    });
    
    const updateReq = http.request({
      hostname: 'notification-service',
      port: 3006,
      path: '/api/v1/notifications/update-metadata',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': updateData.length
      }
    }, () => {});
    
    updateReq.on('error', () => {});
    updateReq.write(updateData);
    updateReq.end();

    return reply.send({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    request.log.error('Error declining tournament invitation:', error);
    return reply.status(500).send({ error: 'Failed to decline invitation' });
  }
};

