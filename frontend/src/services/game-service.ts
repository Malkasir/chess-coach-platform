import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth-service';
import { ClockState, TimeControl } from '../types/clock.types';

export interface GameMessage {
  type: string;
  gameId: string;
  playerId?: string;
  move?: string;
  fen?: string;
  message?: string;
  moveHistory?: string[];
  clockState?: ClockState;
  // Training session fields
  participants?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    isCoach: boolean;
  }>;
  participantCount?: number;
  userId?: string;
  userName?: string;
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
  private authService: AuthService | null = null;

  constructor() {
    // Determine base URL based on environment
    this.baseUrl = this.determineBaseUrl();
    this.setupWebSocket();
  }

  setAuthService(authService: AuthService) {
    this.authService = authService;
  }

  private determineBaseUrl(): string {
    // Always prioritize the environment variable if it's set.
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl;
    }

    // Fallback for local development ONLY if the env var is not set.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }

    // If we are in production and the env var is missing, log an error.
    console.error('VITE_API_BASE_URL is not set for production build!');
    return 'about:blank'; // Fail loudly
  }

  private setupWebSocket() {
    console.log('🏗️ Setting up WebSocket client with baseUrl:', this.baseUrl);
    this.client = new Client({
      webSocketFactory: () => {
        const sockJsUrl = `${this.baseUrl}/chess-websocket`;
        console.log('🔗 Creating SockJS connection to:', sockJsUrl);
        return new SockJS(sockJsUrl);
      },
      debug: (str) => console.log('🔌 STOMP: ' + str),
      onConnect: (frame) => {
        console.log('✅ Connected to WebSocket', frame);
      },
      onDisconnect: (frame) => {
        console.log('❌ Disconnected from WebSocket', frame);
      },
      onStompError: (frame) => {
        console.error('💥 STOMP error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('🔌 WebSocket error:', event);
      },
      onWebSocketClose: (event) => {
        console.log('🔌 WebSocket closed:', event);
      },
      // Add heartbeat and reconnect settings for better browser compatibility
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000
    });
  }

  /**
   * Get WebSocket connect headers with JWT token for authentication
   */
  private getConnectHeaders(): Record<string, string> {
    const token = this.authService?.getToken();
    if (token) {
      console.log('🔐 Adding JWT token to WebSocket connection');
      return {
        Authorization: `Bearer ${token}`
      };
    }
    console.warn('⚠️ No JWT token available for WebSocket connection');
    return {};
  }

  async createGame(
    hostId: string,
    colorPreference: string = 'random',
    timeControl?: TimeControl
  ): Promise<{ gameId: string, roomCode: string, hostColor: 'white' | 'black' }> {
    const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };

    const requestBody: any = {
      hostId,
      colorPreference
    };

    // Add time control parameters if provided
    if (timeControl) {
      requestBody.gameMode = timeControl.mode;
      requestBody.baseTimeSeconds = timeControl.baseTimeSeconds;
      requestBody.incrementSeconds = timeControl.incrementSeconds;
    }

    const response = await fetch(`${this.baseUrl}/api/games/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create game' }));
      throw new Error(error.error || 'Failed to create game');
    }

    return response.json();
  }

  async joinGameByCode(roomCode: string, guestId: string): Promise<GameState> {
    const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };
    
    const response = await fetch(`${this.baseUrl}/api/games/join-by-code`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ roomCode: roomCode.toUpperCase(), guestId })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to join game' }));
      throw new Error(error.error || 'Failed to join game with room code');
    }

    return response.json();
  }

  async joinGame(gameId: string, playerId: string, isHost: boolean = false): Promise<void> {
    console.log('🔗 joinGame called:', { gameId, playerId, isHost });
    this.gameId = gameId;
    this.playerId = playerId;

    // Connect to WebSocket if not already connected
    const isConnected = this.client?.connected === true;
    if (!isConnected) {
      console.log('🔌 Activating WebSocket client...');
      if (!this.client) {
        console.error('❌ WebSocket client is null, recreating...');
        this.setupWebSocket();
      }

      // Set authentication headers before activating
      if (this.client) {
        this.client.connectHeaders = this.getConnectHeaders();
      }
      this.client?.activate();
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        const checkConnection = () => {
          attempts++;
          const currentlyConnected = this.client?.connected === true;
          console.log(`🔍 Connection attempt ${attempts}/${maxAttempts}, connected: ${currentlyConnected}, client state: ${this.client?.connected}`);
          if (currentlyConnected) {
            console.log('✅ WebSocket connected successfully!');
            resolve(void 0);
          } else if (attempts >= maxAttempts) {
            console.error('❌ WebSocket connection timeout after 5 seconds');
            reject(new Error('WebSocket connection timeout'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    } else {
      console.log('✅ WebSocket already connected');
    }

    // Subscribe to game messages
    this.client?.subscribe(`/topic/game/${gameId}`, (message) => {
      console.log('📨 Received game message:', message.body);
      const gameMessage: GameMessage = JSON.parse(message.body);
      console.log('🎮 Parsed game message:', gameMessage);
      if (this.onGameUpdate) {
        this.onGameUpdate(gameMessage);
      } else {
        console.warn('⚠️ No onGameUpdate callback set!');
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
      const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };
      
      const response = await fetch(`${this.baseUrl}/api/games/${gameId}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ guestId: playerId })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to join game' }));
        throw new Error(error.error || 'Failed to join game');
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
    const isConnected = this.client?.connected === true;
    console.log('🎯 makeMove called:', { 
      move, 
      fen, 
      clientConnected: isConnected, 
      gameId: this.gameId, 
      playerId: this.playerId 
    });
    
    if (!this.gameId || !this.playerId) {
      console.error('❌ Missing game/player ID', {
        gameId: this.gameId,
        playerId: this.playerId
      });
      return;
    }

    if (!this.client) {
      console.error('❌ No WebSocket client available');
      return;
    }

    // If not connected, try to reconnect first
    if (!isConnected) {
      console.warn('⚠️ WebSocket not connected, attempting to reconnect...');
      // Set authentication headers before activating
      if (this.client) {
        this.client.connectHeaders = this.getConnectHeaders();
      }
      this.client.activate();
      
      // Wait a brief moment for connection before trying to send
      setTimeout(() => {
        if (this.client?.connected) {
          console.log('✅ Reconnected, sending move...');
          this.sendMove(move, fen);
        } else {
          console.error('❌ Failed to reconnect WebSocket');
        }
      }, 500);
      return;
    }

    this.sendMove(move, fen);
  }

  private sendMove(move: string, fen: string): void {
    if (!this.client?.connected || !this.gameId || !this.playerId) {
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
    const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };

    const response = await fetch(`${this.baseUrl}/api/games/${gameId}`, {
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get game state' }));
      throw new Error(error.error || 'Failed to get game state');
    }

    return response.json();
  }

  async leaveGame(gameId: string, userId: string): Promise<void> {
    const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };

    const response = await fetch(`${this.baseUrl}/api/games/${gameId}/leave`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: parseInt(userId) })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to leave game' }));
      throw new Error(error.error || 'Failed to leave game');
    }
  }

  setGameUpdateListener(callback: (message: GameMessage) => void): void {
    this.onGameUpdate = callback;
  }

  disconnect(): void {
    console.log('🔌 Disconnecting from game service...');

    // Deactivate WebSocket connection but keep client instance
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        console.warn('⚠️ Error during WebSocket disconnect:', error);
      }
    }

    // Clear game-specific references but preserve client and callback
    this.gameId = null;
    this.playerId = null;
    // NOTE: Do NOT clear this.client or this.onGameUpdate to allow reconnection

    console.log('✅ Game service disconnected (client preserved for reconnection)');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ==================== TRAINING SESSION METHODS ====================

  async createTrainingSession(initialFen?: string): Promise<{
    sessionId: string;
    roomCode: string;
    coachId: number;
    currentFen: string;
  }> {
    const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };

    const response = await fetch(`${this.baseUrl}/api/training/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ initialFen: initialFen || null })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create training session' }));
      throw new Error(error.error || 'Failed to create training session');
    }

    return response.json();
  }

  async joinTrainingSessionByCode(roomCode: string): Promise<{
    sessionId: string;
    roomCode: string;
    coachId: number;
    currentFen: string;
    isCoach: boolean;
  }> {
    const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };

    const response = await fetch(`${this.baseUrl}/api/training/join-by-code`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ roomCode: roomCode.toUpperCase() })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to join training session' }));
      throw new Error(error.error || 'Failed to join training session');
    }

    return response.json();
  }

  async joinTrainingSession(sessionId: string, participantId?: string): Promise<void> {
    console.log('🔗 joinTrainingSession called:', { sessionId, participantId });

    // Connect to WebSocket if not already connected
    const isConnected = this.client?.connected === true;
    if (!isConnected) {
      console.log('🔌 Activating WebSocket client for training...');
      if (!this.client) {
        console.error('❌ WebSocket client is null, recreating...');
        this.setupWebSocket();
      }

      // Set authentication headers before activating
      if (this.client) {
        this.client.connectHeaders = this.getConnectHeaders();
      }
      this.client?.activate();
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        const checkConnection = () => {
          attempts++;
          const currentlyConnected = this.client?.connected === true;
          if (currentlyConnected) {
            console.log('✅ WebSocket connected for training!');
            resolve(void 0);
          } else if (attempts >= maxAttempts) {
            console.error('❌ Training WebSocket connection timeout');
            reject(new Error('Training WebSocket connection timeout'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    // Subscribe to training session messages (broadcast to all participants)
    this.client?.subscribe(`/topic/training/${sessionId}`, (message) => {
      console.log('📨 Received training broadcast message:', message.body);
      const trainingMessage = JSON.parse(message.body);
      console.log('🎓 Parsed training broadcast message:', trainingMessage);
      if (this.onGameUpdate) {
        // Convert training message to GameMessage format, preserving ALL fields
        const gameMessage: GameMessage = {
          type: trainingMessage.type,
          gameId: trainingMessage.sessionId,
          fen: trainingMessage.fen,
          message: trainingMessage.message,
          moveHistory: trainingMessage.moveHistory ? JSON.parse(trainingMessage.moveHistory) : undefined,
          // Preserve training-specific fields
          participants: trainingMessage.participants,
          participantCount: trainingMessage.participantCount,
          userId: trainingMessage.userId,
          userName: trainingMessage.userName
        };
        this.onGameUpdate(gameMessage);
      }
    });

    // Subscribe to participant-specific messages (SESSION_STATE, errors)
    if (participantId) {
      this.client?.subscribe(`/topic/training/${sessionId}/${participantId}`, (message) => {
        console.log('📨 Received participant-specific training message:', message.body);
        const trainingMessage = JSON.parse(message.body);
        console.log('🎓 Parsed participant-specific message:', trainingMessage);
        if (this.onGameUpdate) {
          // Convert training message to GameMessage format, preserving ALL fields
          const gameMessage: GameMessage = {
            type: trainingMessage.type,
            gameId: trainingMessage.sessionId,
            fen: trainingMessage.fen,
            message: trainingMessage.message,
            moveHistory: trainingMessage.moveHistory ? JSON.parse(trainingMessage.moveHistory) : undefined,
            // Preserve training-specific fields
            participants: trainingMessage.participants,
            participantCount: trainingMessage.participantCount,
            userId: trainingMessage.userId,
            userName: trainingMessage.userName
          };
          this.onGameUpdate(gameMessage);
        }
      });
    }

    // Send join message via WebSocket
    this.client?.publish({
      destination: '/app/training/join',
      body: JSON.stringify({
        type: 'JOIN',
        sessionId
      })
    });
  }

  updateTrainingPosition(sessionId: string, fen: string, moveHistory: string[]): void {
    const isConnected = this.client?.connected === true;
    console.log('🎯 updateTrainingPosition called:', { sessionId, fen, clientConnected: isConnected });

    if (!this.client?.connected || !sessionId) {
      console.error('❌ Cannot update position - not connected or no session');
      return;
    }

    this.client.publish({
      destination: '/app/training/position-update',
      body: JSON.stringify({
        type: 'POSITION_UPDATE',
        sessionId,
        fen,
        moveHistory: JSON.stringify(moveHistory)
      })
    });
  }

  async endTrainingSession(sessionId: string): Promise<void> {
    const isConnected = this.client?.connected === true;
    console.log('🛑 endTrainingSession called:', { sessionId, clientConnected: isConnected });

    if (!this.client?.connected || !sessionId) {
      console.error('❌ Cannot end session - not connected or no session');
      return;
    }

    // Send end message via WebSocket
    this.client.publish({
      destination: '/app/training/end',
      body: JSON.stringify({
        type: 'END',
        sessionId
      })
    });

    // Also call REST API to ensure session is ended
    const headers = this.authService ? this.authService.getAuthHeaders() : { 'Content-Type': 'application/json' };

    const response = await fetch(`${this.baseUrl}/api/training/${sessionId}/end`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to end training session' }));
      throw new Error(error.error || 'Failed to end training session');
    }
  }
}