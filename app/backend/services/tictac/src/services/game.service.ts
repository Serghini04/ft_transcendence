import type { GameState, Move } from '../types/index.js';
import { GameModel } from '../models/game.model.js';
import { GameHistoryModel } from '../models/history.model.js';
import { UserModel } from '../models/user.model.js';
import { nanoid } from 'nanoid';

export class GameService {
  private static moveHistory: Map<string, Move[]> = new Map();

  /**
   * Create a new game between two players
   */
  static createGame(player1Id: string, player2Id: string): GameState {
    const gameId = nanoid();
    const game = GameModel.create(gameId, player1Id, player2Id);
    this.moveHistory.set(gameId, []);
    return game;
  }

  /**
   * Make a move in the game
   */
  static makeMove(gameId: string, playerId: string, position: number): {
    success: boolean;
    game?: GameState;
    error?: string;
  } {
    // Validate position
    if (position < 0 || position > 8) {
      return { success: false, error: 'Invalid position' };
    }

    const game = GameModel.findById(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    // Check if it's the player's turn
    const isPlayer1 = game.player1Id === playerId;
    const isPlayer2 = game.player2Id === playerId;
    
    if (!isPlayer1 && !isPlayer2) {
      return { success: false, error: 'Player not in this game' };
    }

    const playerSymbol: 'X' | 'O' = isPlayer1 ? 'X' : 'O';
    
    if (game.currentTurn !== playerSymbol) {
      return { success: false, error: 'Not your turn' };
    }

    // Check if position is empty
    if (game.board[position] !== '') {
      return { success: false, error: 'Position already taken' };
    }

    // Make the move
    game.board[position] = playerSymbol;
    
    // Record move
    const moves = this.moveHistory.get(gameId) || [];
    moves.push({
      gameId,
      playerId,
      position,
      symbol: playerSymbol,
      timestamp: Date.now()
    });
    this.moveHistory.set(gameId, moves);

    // Check for winner
    const winner = this.checkWinner(game.board);
    
    if (winner) {
      game.status = 'finished';
      game.winnerSymbol = winner;
      game.winner = winner === 'X' ? game.player1Id : game.player2Id;
      game.finishedAt = Date.now();
      
      // Update ratings
      this.updateRatings(game);
      
      // Save to history
      const duration = game.finishedAt - game.startedAt;
      GameHistoryModel.create(game, moves.length, duration);
      
      // Clean up move history
      this.moveHistory.delete(gameId);
    } else if (this.isBoardFull(game.board)) {
      // Draw
      game.status = 'finished';
      game.winner = null;
      game.winnerSymbol = null;
      game.finishedAt = Date.now();
      
      const duration = game.finishedAt - game.startedAt;
      GameHistoryModel.create(game, moves.length, duration);
      
      this.moveHistory.delete(gameId);
    } else {
      // Switch turns
      game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    }

    // Update game in database
    GameModel.update(game);

    return { success: true, game };
  }

  /**
   * Check if there's a winner
   */
  private static checkWinner(board: ('X' | 'O' | '')[]): 'X' | 'O' | null {
    const winningCombinations = [
      [0, 1, 2], // Top row
      [3, 4, 5], // Middle row
      [6, 7, 8], // Bottom row
      [0, 3, 6], // Left column
      [1, 4, 7], // Middle column
      [2, 5, 8], // Right column
      [0, 4, 8], // Diagonal \
      [2, 4, 6], // Diagonal /
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as 'X' | 'O';
      }
    }

    return null;
  }

  /**
   * Check if board is full (draw)
   */
  private static isBoardFull(board: ('X' | 'O' | '')[]): boolean {
    return board.every(cell => cell !== '');
  }

  /**
   * Update player ratings using ELO-like system
   */
  private static updateRatings(game: GameState): void {
    const player1 = UserModel.findById(game.player1Id);
    const player2 = UserModel.findById(game.player2Id);

    if (!player1 || !player2) return;

    const K = 32; // K-factor for rating change
    
    const expectedScore1 = 1 / (1 + Math.pow(10, (player2.rating - player1.rating) / 400));
    const expectedScore2 = 1 - expectedScore1;

    let actualScore1: number;
    let actualScore2: number;

    if (game.winner === null) {
      // Draw
      actualScore1 = 0.5;
      actualScore2 = 0.5;
    } else if (game.winner === game.player1Id) {
      // Player 1 wins
      actualScore1 = 1;
      actualScore2 = 0;
    } else {
      // Player 2 wins
      actualScore1 = 0;
      actualScore2 = 1;
    }

    const newRating1 = Math.round(player1.rating + K * (actualScore1 - expectedScore1));
    const newRating2 = Math.round(player2.rating + K * (actualScore2 - expectedScore2));

    UserModel.updateRating(game.player1Id, newRating1);
    UserModel.updateRating(game.player2Id, newRating2);
  }

  /**
   * Get move history for a game
   */
  static getMoveHistory(gameId: string): Move[] {
    return this.moveHistory.get(gameId) || [];
  }

  /**
   * Forfeit a game
   */
  static forfeitGame(gameId: string, playerId: string): {
    success: boolean;
    game?: GameState;
    error?: string;
  } {
    const game = GameModel.findById(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    const isPlayer1 = game.player1Id === playerId;
    const isPlayer2 = game.player2Id === playerId;

    if (!isPlayer1 && !isPlayer2) {
      return { success: false, error: 'Player not in this game' };
    }

    // The other player wins
    game.status = 'finished';
    game.winner = isPlayer1 ? game.player2Id : game.player1Id;
    game.winnerSymbol = isPlayer1 ? 'O' : 'X';
    game.finishedAt = Date.now();

    // Update ratings
    this.updateRatings(game);

    // Save to history
    const moves = this.moveHistory.get(gameId) || [];
    const duration = game.finishedAt - game.startedAt;
    GameHistoryModel.create(game, moves.length, duration);

    // Clean up
    this.moveHistory.delete(gameId);

    // Update game
    GameModel.update(game);

    return { success: true, game };
  }
}
