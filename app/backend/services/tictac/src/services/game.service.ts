import type { GameState, Move } from '../types/index.js';
import { GameModel } from '../models/game.model.js';
import { GameHistoryModel } from '../models/history.model.js';
import { UserModel } from '../models/user.model.js';
import { nanoid } from 'nanoid';
import { getKafkaProducer } from '../kafka/producer.js';
import type { GameFinishedEvent } from '../kafka/producer.js';

export class GameService {
  private static moveHistory: Map<string, Move[]> = new Map();

  static createGame(player1Id: string, player2Id: string): GameState {
    const gameId = nanoid();
    const game = GameModel.create(gameId, player1Id, player2Id);
    this.moveHistory.set(gameId, []);
    return game;
  }

  static async makeMove(gameId: string, playerId: string, position: number): Promise<{
    success: boolean;
    game?: GameState;
    error?: string;
  }> {
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

    const isPlayer1 = game.player1Id === playerId;
    const isPlayer2 = game.player2Id === playerId;
    
    if (!isPlayer1 && !isPlayer2) {
      return { success: false, error: 'Player not in this game' };
    }

    const playerSymbol: 'X' | 'O' = isPlayer1 ? 'X' : 'O';
    
    if (game.currentTurn !== playerSymbol) {
      return { success: false, error: 'Not your turn' };
    }

    if (game.board[position] !== '') {
      return { success: false, error: 'Position already taken' };
    }

    game.board[position] = playerSymbol;
    const moves = this.moveHistory.get(gameId) || [];
    moves.push({
      gameId,
      playerId,
      position,
      symbol: playerSymbol,
      timestamp: Date.now()
    });
    this.moveHistory.set(gameId, moves);
    const winner = this.checkWinner(game.board);
    
    if (winner) {
      game.status = 'finished';
      game.winnerSymbol = winner;
      game.winner = winner === 'X' ? game.player1Id : game.player2Id;
      game.finishedAt = Date.now();
      
      this.updateRatings(game);
      
      const duration = game.finishedAt - game.startedAt;
      
      // Publish to Kafka BEFORE saving to database
      await this.publishGameFinished(game, moves.length, duration, 'win');
      
      GameHistoryModel.create(game, moves.length, duration);
      
      this.moveHistory.delete(gameId);
    } else if (this.isBoardFull(game.board)) {
      game.status = 'finished';
      game.winner = null;
      game.winnerSymbol = null;
      game.finishedAt = Date.now();
      
      const duration = game.finishedAt - game.startedAt;
      
      // Publish to Kafka BEFORE saving to database
      await this.publishGameFinished(game, moves.length, duration, 'draw');
      
      GameHistoryModel.create(game, moves.length, duration);
      
      this.moveHistory.delete(gameId);
    } else {
      game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    }

    GameModel.update(game);

    return { success: true, game };
  }
  private static checkWinner(board: ('X' | 'O' | '')[]): 'X' | 'O' | null {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as 'X' | 'O';
      }
    }

    return null;
  }

  private static isBoardFull(board: ('X' | 'O' | '')[]): boolean {
    return board.every(cell => cell !== '');
  }

  private static updateRatings(game: GameState): void {
    const player1 = UserModel.findById(game.player1Id);
    const player2 = UserModel.findById(game.player2Id);

    if (!player1 || !player2) return;

    const K = 32;
    
    const expectedScore1 = 1 / (1 + Math.pow(10, (player2.rating - player1.rating) / 400));
    const expectedScore2 = 1 - expectedScore1;

    let actualScore1: number;
    let actualScore2: number;

    if (game.winner === null) {
      actualScore1 = 0.5;
      actualScore2 = 0.5;
    } else if (game.winner === game.player1Id) {
      actualScore1 = 1;
      actualScore2 = 0;
    } else {
      actualScore1 = 0;
      actualScore2 = 1;
    }

    const newRating1 = Math.round(player1.rating + K * (actualScore1 - expectedScore1));
    const newRating2 = Math.round(player2.rating + K * (actualScore2 - expectedScore2));

    UserModel.updateRating(game.player1Id, newRating1);
    UserModel.updateRating(game.player2Id, newRating2);
  }

  static getMoveHistory(gameId: string): Move[] {
    return this.moveHistory.get(gameId) || [];
  }

  private static async publishGameFinished(
    game: GameState,
    moves: number,
    duration: number,
    reason: 'win' | 'draw' | 'forfeit' | 'disconnect'
  ): Promise<void> {
    try {
      const kafkaProducer = getKafkaProducer();
      
      const event: GameFinishedEvent = {
        gameId: game.id,
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        winnerId: game.winner,
        winnerSymbol: game.winnerSymbol,
        isDraw: game.winner === null && game.winnerSymbol === null,
        moves,
        duration,
        reason,
        finishedAt: game.finishedAt || Date.now(),
      };

      await kafkaProducer.publishGameFinished(event);
    } catch (error) {
      console.error('Failed to publish game finished event:', error);
      // Don't throw - we don't want to break game flow if Kafka is down
    }
  }

  static async forfeitGame(gameId: string, playerId: string): Promise<{
    success: boolean;
    game?: GameState;
    error?: string;
  }> {
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

    game.status = 'finished';
    game.winner = isPlayer1 ? game.player2Id : game.player1Id;
    game.winnerSymbol = isPlayer1 ? 'O' : 'X';
    game.finishedAt = Date.now();

    this.updateRatings(game);

    const moves = this.moveHistory.get(gameId) || [];
    const duration = game.finishedAt - game.startedAt;
    
    // Publish to Kafka BEFORE saving to database
    await this.publishGameFinished(game, moves.length, duration, 'forfeit');
    
    GameHistoryModel.create(game, moves.length, duration);

    this.moveHistory.delete(gameId);

    GameModel.update(game);

    return { success: true, game };
  }
}
