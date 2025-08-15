/**
 * Chess AI Service
 * 
 * High-level service that coordinates AI personalities with the chess engine.
 * This service manages game sessions, personality behaviors, and provides
 * the main interface for AI chess gameplay.
 */

import { ChessPersonality, GameSession } from '../../types/personality.types';
import { StockfishService, EngineMove } from './stockfish-service';
import { debugLog, debugError } from '../../utils/debug';
import { Chess } from 'chess.js';

export interface AIGameConfig {
  personality: ChessPersonality;
  userColor: 'white' | 'black' | 'random';
  fen?: string;
}

export interface AIGameState {
  chess: Chess;
  session: GameSession;
  isAITurn: boolean;
  gameActive: boolean;
}

export class ChessAIService {
  private stockfish: StockfishService;
  private currentGame: AIGameState | null = null;

  constructor() {
    this.stockfish = new StockfishService();
  }

  /**
   * Start a new AI game with the specified configuration
   */
  public async startGame(config: AIGameConfig): Promise<AIGameState> {
    try {
      debugLog('Starting AI game with config:', config);

      // Determine actual colors if random was selected
      const userColor = config.userColor === 'random' 
        ? (Math.random() < 0.5 ? 'white' : 'black')
        : config.userColor;

      debugLog('User will play as:', userColor);

      // Initialize chess game
      const chess = new Chess(config.fen);
      debugLog('Chess game initialized, starting position:', chess.fen());
      
      // Configure engine for this personality
      debugLog('Configuring engine for personality:', config.personality.name);
      this.stockfish.configureForPersonality(config.personality);

      // Create game session
      const session: GameSession = {
        personality: config.personality,
        engineSettings: {
          skillLevel: config.personality.skillLevel,
          thinkTime: this.calculateThinkTime(config.personality),
          depth: this.calculateDepth(config.personality)
        },
        stats: {
          movesPlayed: 0,
          playerAccuracy: 100,
          averageThinkTime: 0
        }
      };

      // Create game state
      this.currentGame = {
        chess,
        session,
        isAITurn: userColor === 'black', // AI goes first if user is black
        gameActive: true
      };

      debugLog('AI game created successfully:', {
        personality: config.personality.name,
        userColor,
        isAITurn: this.currentGame.isAITurn,
        gameActive: this.currentGame.gameActive
      });

      return this.currentGame;

    } catch (error) {
      debugError('Failed to start AI game - detailed error:', error);
      throw error; // Re-throw the original error instead of wrapping it
    }
  }

  /**
   * Make a move for the AI player
   */
  public async makeAIMove(): Promise<EngineMove | null> {
    if (!this.currentGame || !this.currentGame.isAITurn || !this.currentGame.gameActive) {
      return null;
    }

    try {
      debugLog('AI is thinking...');

      // Set current position for the engine
      this.stockfish.setPosition(this.currentGame.chess.fen());

      // Get the best move from the engine
      const engineMove = await this.stockfish.getBestMove();

      // Validate and make the move
      const move = this.currentGame.chess.move({
        from: engineMove.from,
        to: engineMove.to,
        promotion: engineMove.promotion || 'q'
      });

      if (move) {
        debugLog('AI played:', move.san);
        
        // Update game state
        this.currentGame.isAITurn = false;
        this.currentGame.session.stats.movesPlayed++;

        // Check for game end
        if (this.currentGame.chess.isGameOver()) {
          this.currentGame.gameActive = false;
          debugLog('Game over');
        }

        return {
          ...engineMove,
          san: move.san
        };
      }

      debugError('Invalid move from AI:', engineMove);
      return null;

    } catch (error) {
      debugError('Failed to make AI move:', error);
      return null;
    }
  }

  /**
   * Process a player move and prepare for AI response
   */
  public processPlayerMove(move: { from: string; to: string; promotion?: string }): boolean {
    if (!this.currentGame || this.currentGame.isAITurn || !this.currentGame.gameActive) {
      return false;
    }

    try {
      // Validate and make the player move
      const chessMove = this.currentGame.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });

      if (chessMove) {
        debugLog('Player played:', chessMove.san);
        
        // Update game state
        this.currentGame.isAITurn = true;
        this.currentGame.session.stats.movesPlayed++;

        // Check for game end
        if (this.currentGame.chess.isGameOver()) {
          this.currentGame.gameActive = false;
          debugLog('Game over');
        }

        return true;
      }

      return false;

    } catch (error) {
      debugError('Invalid player move:', error);
      return false;
    }
  }

  /**
   * Get the current game state
   */
  public getCurrentGame(): AIGameState | null {
    return this.currentGame;
  }

  /**
   * Check if it's the AI's turn
   */
  public isAITurn(): boolean {
    return this.currentGame?.isAITurn ?? false;
  }

  /**
   * Check if the game is active
   */
  public isGameActive(): boolean {
    return this.currentGame?.gameActive ?? false;
  }

  /**
   * Get the current FEN position
   */
  public getCurrentFEN(): string | null {
    return this.currentGame?.chess.fen() ?? null;
  }

  /**
   * Get game result if the game is over
   */
  public getGameResult(): string | null {
    if (!this.currentGame || this.currentGame.gameActive) {
      return null;
    }

    const chess = this.currentGame.chess;
    
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
    } else if (chess.isDraw()) {
      if (chess.isStalemate()) {
        return 'Draw by stalemate';
      } else if (chess.isInsufficientMaterial()) {
        return 'Draw by insufficient material';
      } else if (chess.isThreefoldRepetition()) {
        return 'Draw by threefold repetition';
      } else {
        return 'Draw by fifty-move rule';
      }
    }
    
    return 'Game ended';
  }

  /**
   * End the current game
   */
  public endGame(): void {
    if (this.currentGame) {
      this.currentGame.gameActive = false;
      debugLog('Game ended by user');
    }
  }

  /**
   * Get a personality quote for the current situation
   */
  public getPersonalityQuote(): string | null {
    if (!this.currentGame) return null;

    const quotes = this.currentGame.session.personality.quotes;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  /**
   * Shutdown the service
   */
  public shutdown(): void {
    this.stockfish.shutdown();
    this.currentGame = null;
  }

  // Private helper methods

  private calculateThinkTime(personality: ChessPersonality): number {
    const baseTime = 1000;
    const speedModifier = personality.playingStyle.developmentSpeed / 100;
    return Math.max(500, baseTime * (1 + speedModifier));
  }

  private calculateDepth(personality: ChessPersonality): number {
    return Math.min(20, Math.max(5, personality.skillLevel + 5));
  }
}

// Singleton instance
let chessAIInstance: ChessAIService | null = null;

export function getChessAIService(): ChessAIService {
  if (!chessAIInstance) {
    chessAIInstance = new ChessAIService();
  }
  return chessAIInstance;
}