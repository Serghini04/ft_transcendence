// Dynamically detect the host - use window.location.hostname for network play
const getWsUrl = () => {
  if (import.meta.env.VITE_TICTAC_WS_URL) {
    return import.meta.env.VITE_TICTAC_WS_URL;
  }
  const hostname = window.location.hostname;
  return `ws://${hostname}:3003/ws`;
};

const WS_URL = getWsUrl();

export type WSMessageType = 
  | 'register'
  | 'join_game'
  | 'make_move'
  | 'join_matchmaking'
  | 'leave_matchmaking'
  | 'forfeit'
  | 'registered'
  | 'joined_game'
  | 'game_update'
  | 'game_finished'
  | 'match_found'
  | 'matchmaking_joined'
  | 'matchmaking_left'
  | 'move_error'
  | 'matchmaking_error'
  | 'forfeit_error'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  [key: string]: any;
}

export type MessageHandler = (message: WSMessage) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<WSMessageType, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private userId: string | null = null;

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Register user
          this.send({
            type: 'register',
            data: { userId }
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(type: WSMessageType, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  off(type: WSMessageType, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(message: WSMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(this.userId!);
      }, this.reconnectDelay);
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Game actions
  joinGame(userId: string, gameId: string): void {
    this.send({
      type: 'join_game',
      data: { userId, gameId }
    });
  }

  makeMove(gameId: string, playerId: string, position: number): void {
    this.send({
      type: 'make_move',
      data: { gameId, playerId, position }
    });
  }

  joinMatchmaking(userId: string, username: string): void {
    this.send({
      type: 'join_matchmaking',
      data: { userId, username }
    });
  }

  leaveMatchmaking(userId: string): void {
    this.send({
      type: 'leave_matchmaking',
      data: { userId }
    });
  }

  forfeitGame(gameId: string, playerId: string): void {
    this.send({
      type: 'forfeit',
      data: { gameId, playerId }
    });
  }
}

export const wsService = new WebSocketService();
