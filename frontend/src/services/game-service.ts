import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface GameMessage {
  type: string;
  gameId: string;
  playerId?: string;
  move?: string;
  fen?: string;
  message?: string;
}

export interface GameState {
  gameId: string;
  coachId: string;
  studentId: string;
  fen: string;
  status: string;
  moveHistory: string[];
}

export class GameService {
  private client: Client | null = null;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private onGameUpdate: ((message: GameMessage) => void) | null = null;
  private baseUrl: string;

  constructor() {
    // Determine base URL based on environment
    this.baseUrl = this.getBaseUrl();
    this.setupWebSocket();
  }

  private getBaseUrl(): string {
    // Use environment variable if available
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl) {
      return envUrl;
    }
    
    // Fallback logic for dynamic detection
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn('Production deployment detected. Please set VITE_BACKEND_URL environment variable or deploy backend to cloud service.');
      return 'http://your-backend-url.com'; // Replace with actual backend URL when deployed
    }
    
    // Development fallback
    return 'http://localhost:8080';
  }

  private setupWebSocket() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${this.baseUrl}/chess-websocket`),
      debug: (str) => console.log('STOMP: ' + str),
      onConnect: () => {
        console.log('Connected to WebSocket');
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });
  }

  async createGame(coachId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/games/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId })
    });

    if (!response.ok) {
      throw new Error('Failed to create game');
    }

    const data = await response.json();
    return data.gameId;
  }

  async joinGame(gameId: string, playerId: string, isCoach: boolean = false): Promise<void> {
    this.gameId = gameId;
    this.playerId = playerId;

    // Connect to WebSocket if not already connected
    if (!this.client?.connected) {
      this.client?.activate();
      await new Promise(resolve => {
        const checkConnection = () => {
          if (this.client?.connected) {
            resolve(void 0);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    // Subscribe to game messages
    this.client?.subscribe(`/topic/game/${gameId}`, (message) => {
      const gameMessage: GameMessage = JSON.parse(message.body);
      if (this.onGameUpdate) {
        this.onGameUpdate(gameMessage);
      }
    });

    // Subscribe to player-specific messages
    this.client?.subscribe(`/topic/game/${gameId}/${playerId}`, (message) => {
      const gameMessage: GameMessage = JSON.parse(message.body);
      if (this.onGameUpdate) {
        this.onGameUpdate(gameMessage);
      }
    });

    // If student joining, call REST API first
    if (!isCoach) {
      const response = await fetch(`${this.baseUrl}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: playerId })
      });

      if (!response.ok) {
        throw new Error('Failed to join game');
      }
    }

    // Send join message via WebSocket
    this.client?.publish({
      destination: '/app/game/join',
      body: JSON.stringify({
        type: 'JOIN',
        gameId,
        playerId
      })
    });
  }

  makeMove(move: string, fen: string): void {
    if (!this.client?.connected || !this.gameId || !this.playerId) {
      console.error('Not connected to game');
      return;
    }

    this.client.publish({
      destination: '/app/game/move',
      body: JSON.stringify({
        type: 'MOVE',
        gameId: this.gameId,
        playerId: this.playerId,
        move,
        fen
      })
    });
  }

  async getGameState(gameId: string): Promise<GameState> {
    const response = await fetch(`${this.baseUrl}/api/games/${gameId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get game state');
    }

    return response.json();
  }

  setGameUpdateListener(callback: (message: GameMessage) => void): void {
    this.onGameUpdate = callback;
  }

  disconnect(): void {
    this.client?.deactivate();
    this.gameId = null;
    this.playerId = null;
    this.onGameUpdate = null;
  }
}