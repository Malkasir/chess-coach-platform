import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface GameMessage {
  type: string;
  gameId: string;
  playerId?: string;
  move?: string;
  fen?: string;
  message?: string;
  moveHistory?: string[];
}

export interface GameState {
  gameId: string;
  hostId: string;
  guestId: string;
  hostColor: 'white' | 'black';
  guestColor: 'white' | 'black';
  fen: string;
  status: string;
  moveHistory: string[];
  roomCode?: string;
}

export class GameService {
  private client: Client | null = null;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private onGameUpdate: ((message: GameMessage) => void) | null = null;
  private baseUrl: string;

  constructor() {
    // Determine base URL based on environment
    this.baseUrl = this.determineBaseUrl();
    this.setupWebSocket();
  }

  private determineBaseUrl(): string {
    // Always prioritize the environment variable if it's set.
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl) {
      return envUrl;
    }

    // Fallback for local development ONLY if the env var is not set.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }

    // If we are in production and the env var is missing, log an error.
    console.error('VITE_BACKEND_URL is not set for production build!');
    return 'about:blank'; // Fail loudly
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

  async createGame(hostId: string, colorPreference: string = 'random'): Promise<{ gameId: string, roomCode: string, hostColor: 'white' | 'black' }> {
    const response = await fetch(`${this.baseUrl}/api/games/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId, colorPreference })
    });

    if (!response.ok) {
      throw new Error('Failed to create game');
    }

    return response.json();
  }

  async joinGameByCode(roomCode: string, guestId: string): Promise<GameState> {
    const response = await fetch(`${this.baseUrl}/api/games/join-by-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: roomCode.toUpperCase(), guestId })
    });

    if (!response.ok) {
      throw new Error('Failed to join game with room code');
    }

    return response.json();
  }

  async joinGame(gameId: string, playerId: string, isHost: boolean = false): Promise<void> {
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

    // If guest joining, call REST API first
    if (!isHost) {
      const response = await fetch(`${this.baseUrl}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: playerId })
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
      console.error('❌ Not connected to game');
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

  getBaseUrl(): string {
    return this.baseUrl;
  }
}