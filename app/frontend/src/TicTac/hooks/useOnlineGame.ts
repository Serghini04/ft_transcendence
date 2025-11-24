import { useState, useEffect } from 'react';
import { wsService } from '../services/websocket';
import type { WSMessage } from '../services/websocket';
import { TicTacAPI } from '../services/api';
import type { User, GameState } from '../services/api';

export function useOnlineGame(user: User | null) {
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [opponent, setOpponent] = useState<{ userId: string; username: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    wsService.connect(user.id)
      .then(() => {
        setIsConnected(true);
        console.log('Connected to game server');
      })
      .catch((err) => {
        console.error('Failed to connect:', err);
        setError('Failed to connect to game server');
      });

    // Set up message handlers
    const handleMatchFound = (message: WSMessage) => {
      console.log('Match found:', message);
      setCurrentGame(message.game);
      setOpponent(message.opponent);
      setIsSearching(false);
      
      // Join the game via WebSocket
      if (user && message.game) {
        wsService.joinGame(user.id, message.game.id);
      }
    };

    const handleGameUpdate = (message: WSMessage) => {
      console.log('Game update:', message);
      setCurrentGame(message.game);
    };

    const handleGameFinished = (message: WSMessage) => {
      console.log('Game finished:', message);
      setCurrentGame(message.game);
    };

    const handleMatchmakingJoined = (message: WSMessage) => {
      console.log('Joined matchmaking:', message);
      setIsSearching(true);
    };

    const handleMatchmakingLeft = (message: WSMessage) => {
      console.log('Left matchmaking:', message);
      setIsSearching(false);
    };

    const handleError = (message: WSMessage) => {
      console.error('Error:', message);
      setError(message.error || message.message || 'An error occurred');
      setIsSearching(false);
    };

    wsService.on('match_found', handleMatchFound);
    wsService.on('game_update', handleGameUpdate);
    wsService.on('game_finished', handleGameFinished);
    wsService.on('matchmaking_joined', handleMatchmakingJoined);
    wsService.on('matchmaking_left', handleMatchmakingLeft);
    wsService.on('matchmaking_error', handleError);
    wsService.on('move_error', handleError);
    wsService.on('forfeit_error', handleError);
    wsService.on('error', handleError);

    // Check for active game
    TicTacAPI.getActiveGame(user.id)
      .then((game) => {
        if (game) {
          setCurrentGame(game);
          wsService.joinGame(user.id, game.id);
        }
      })
      .catch((err) => {
        console.error('Failed to get active game:', err);
      });

    return () => {
      wsService.off('match_found', handleMatchFound);
      wsService.off('game_update', handleGameUpdate);
      wsService.off('game_finished', handleGameFinished);
      wsService.off('matchmaking_joined', handleMatchmakingJoined);
      wsService.off('matchmaking_left', handleMatchmakingLeft);
      wsService.off('matchmaking_error', handleError);
      wsService.off('move_error', handleError);
      wsService.off('forfeit_error', handleError);
      wsService.off('error', handleError);
      wsService.disconnect();
    };
  }, [user]);

  const findMatch = () => {
    if (!user || !isConnected) return;
    
    setError(null);
    wsService.joinMatchmaking(user.id, user.username);
  };

  const cancelSearch = () => {
    if (!user) return;
    
    wsService.leaveMatchmaking(user.id);
    setIsSearching(false);
  };

  const makeMove = async (position: number) => {
    if (!user || !currentGame) return;

    try {
      wsService.makeMove(currentGame.id, user.id, position);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const forfeit = () => {
    if (!user || !currentGame) return;

    wsService.forfeitGame(currentGame.id, user.id);
  };

  const resetGame = () => {
    setCurrentGame(null);
    setOpponent(null);
    setError(null);
  };

  return {
    currentGame,
    isSearching,
    opponent,
    error,
    isConnected,
    findMatch,
    cancelSearch,
    makeMove,
    forfeit,
    resetGame
  };
}
