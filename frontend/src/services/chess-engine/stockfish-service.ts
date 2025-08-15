/**
 * Stockfish Chess Engine Service
 * 
 * Provides a Web Worker-based interface to the Stockfish chess engine
 * with personality-driven move selection and difficulty adjustment.
 */

import { ChessPersonality, EngineSettings } from '../../types/personality.types';
import { debugLog, debugError } from '../../utils/debug';

export interface EngineMove {
  from: string;
  to: string;
  promotion?: string;
  san?: string;
  uci: string;
}

export interface EngineEvaluation {
  bestMove: string;
  evaluation: number;
  depth: number;
  nodes: number;
  time: number;
  pv: string[];
}

export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingMoves: Array<{ resolve: (value: EngineMove) => void; reject: (error: any) => void }> = [];
  private currentPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  private engineSettings: EngineSettings;

  constructor() {
    this.engineSettings = {
      skillLevel: 10,
      thinkTime: 1000,
      depth: 15
    };
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    try {
      debugLog('Initializing Stockfish engine...');
      
      // Try to use real Stockfish, fall back to mock if it fails
      try {
        this.worker = await this.createStockfishWorker();
        debugLog('Real Stockfish engine loaded successfully');
      } catch (error) {
        debugLog('Failed to load real Stockfish, using mock engine:', error);
        this.worker = await this.createMockWorker();
      }

      this.worker.onmessage = (event) => {
        this.handleEngineMessage(event.data);
      };

      this.worker.onerror = (error) => {
        debugError('Stockfish Worker error:', error);
      };

      // Initialize UCI protocol
      this.sendCommand('uci');
      
      debugLog('Stockfish engine initialized successfully');
    } catch (error) {
      debugError('Failed to initialize Stockfish engine:', error);
      throw new Error('Could not initialize chess engine');
    }
  }

  private async createStockfishWorker(): Promise<Worker> {
    // For a real Stockfish implementation, we would need to properly load the WebAssembly
    // For now, let's create an improved mock that's more realistic
    debugLog('Real Stockfish not implemented yet, using enhanced mock');
    throw new Error('Real Stockfish implementation pending - using mock for development');
  }

  private async createMockWorker(): Promise<Worker> {
    // Create a simple mock worker for testing
    const workerCode = `
      let isReady = false;
      let currentPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Simple position-aware move generation for testing
      function generateMockMove(fen) {
        const parts = fen.split(' ');
        const turn = parts[1]; // 'w' for white, 'b' for black
        
        // Basic opening moves for each color
        const whiteMoves = ['e2e4', 'g1f3', 'd2d4', 'b1c3', 'f1c4', 'e1g1'];
        const blackMoves = ['e7e5', 'g8f6', 'd7d5', 'b8c6', 'f8c5', 'e8g8'];
        
        const availableMoves = turn === 'w' ? whiteMoves : blackMoves;
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        
        console.log('Mock engine generating move for turn:', turn, '-> move:', randomMove);
        return randomMove;
      }
      
      onmessage = function(e) {
        const command = e.data;
        console.log('Mock engine received:', command);
        
        setTimeout(() => {
          if (command === 'uci') {
            postMessage('id name Stockfish Mock');
            postMessage('id author Mock Engine');
            postMessage('option name Skill Level type spin default 20 min 0 max 20');
            postMessage('uciok');
          } else if (command === 'isready') {
            postMessage('readyok');
            isReady = true;
          } else if (command.startsWith('go')) {
            // Mock thinking for a move
            setTimeout(() => {
              const move = generateMockMove(currentPosition);
              postMessage('bestmove ' + move);
            }, 500);
          } else if (command.startsWith('position')) {
            // Extract and store the FEN position
            const fenMatch = command.match(/position fen (.+?)(?:\s+moves|$)/);
            if (fenMatch) {
              currentPosition = fenMatch[1];
              console.log('Position updated to:', currentPosition);
            }
          } else if (command.startsWith('setoption')) {
            // Acknowledge option setting
            console.log('Option set:', command);
          }
        }, 50);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }

  private handleEngineMessage(message: string): void {
    debugLog('Engine message:', message);

    if (message === 'uciok') {
      this.isReady = true;
      this.sendCommand('isready');
    }

    if (message === 'readyok') {
      debugLog('Stockfish engine is ready');
    }

    // Handle bestmove responses
    if (message.startsWith('bestmove')) {
      const parts = message.split(' ');
      const bestMove = parts[1];
      
      // Resolve the first pending move request
      if (this.pendingMoves.length > 0) {
        const { resolve } = this.pendingMoves.shift()!;
        
        if (bestMove && bestMove !== '(none)') {
          resolve({
            uci: bestMove,
            from: bestMove.slice(0, 2),
            to: bestMove.slice(2, 4),
            promotion: bestMove.length > 4 ? bestMove.slice(4) : undefined
          });
        }
      }
    }

    // Handle evaluation info
    if (message.startsWith('info')) {
      this.parseEvaluationInfo(message);
    }
  }

  private parseEvaluationInfo(info: string): void {
    // Parse UCI info output for evaluation data
    if (info.includes('score cp')) {
      const scoreMatch = info.match(/score cp (-?\d+)/);
      if (scoreMatch) {
        const centipawns = parseInt(scoreMatch[1]);
        debugLog(`Position evaluation: ${centipawns} centipawns`);
      }
    }
  }

  private sendCommand(command: string): void {
    if (this.worker) {
      debugLog('Sending command:', command);
      this.worker.postMessage(command);
    }
  }

  /**
   * Configure engine settings based on personality
   */
  public configureForPersonality(personality: ChessPersonality): void {
    this.engineSettings = {
      skillLevel: personality.skillLevel,
      thinkTime: this.calculateThinkTime(personality),
      depth: this.calculateDepth(personality),
      uciOptions: this.buildUCIOptions(personality)
    };

    this.applyEngineSettings();
  }

  private calculateThinkTime(personality: ChessPersonality): number {
    // Adjust think time based on personality characteristics
    const baseTime = 1000;
    const speedModifier = personality.playingStyle.developmentSpeed / 100;
    return Math.max(500, baseTime * (1 + speedModifier));
  }

  private calculateDepth(personality: ChessPersonality): number {
    // Adjust search depth based on skill level
    return Math.min(20, Math.max(5, personality.skillLevel + 5));
  }

  private buildUCIOptions(personality: ChessPersonality): Record<string, string | number> {
    return {
      'Skill Level': personality.skillLevel,
      'MultiPV': personality.playingStyle.tacticalPreference > 70 ? 3 : 1,
      'Contempt': this.calculateContempt(personality),
      'Aggressiveness': this.calculateAggressiveness(personality)
    };
  }

  private calculateContempt(personality: ChessPersonality): number {
    // Contempt affects draw tendency
    return Math.round(personality.playingStyle.aggression / 10);
  }

  private calculateAggressiveness(personality: ChessPersonality): number {
    // Map aggression to engine aggressiveness
    return Math.max(0, Math.min(200, 100 + personality.playingStyle.aggression));
  }

  private applyEngineSettings(): void {
    if (!this.engineSettings.uciOptions) return;

    for (const [option, value] of Object.entries(this.engineSettings.uciOptions)) {
      this.sendCommand(`setoption name ${option} value ${value}`);
    }
  }

  /**
   * Set the current board position
   */
  public setPosition(fen: string, moves: string[] = []): void {
    this.currentPosition = fen;
    
    let positionCommand = `position fen ${fen}`;
    if (moves.length > 0) {
      positionCommand += ` moves ${moves.join(' ')}`;
    }
    
    this.sendCommand(positionCommand);
  }

  /**
   * Get the best move for the current position
   */
  public getBestMove(timeMs?: number): Promise<EngineMove> {
    const thinkTime = timeMs || this.engineSettings.thinkTime;
    
    return new Promise((resolve, reject) => {
      this.pendingMoves.push({ resolve, reject });
      this.sendCommand(`go movetime ${thinkTime}`);
    });
  }

  /**
   * Analyze position and get multiple candidate moves
   */
  public analyzePosition(depth?: number): Promise<EngineEvaluation> {
    const searchDepth = depth || this.engineSettings.depth || 15;
    
    return new Promise((resolve, reject) => {
      // This is a simplified implementation for now
      // In a full implementation, you'd collect and parse all the UCI info messages
      this.pendingMoves.push({ 
        resolve: (result) => {
          resolve({
            bestMove: result.uci,
            evaluation: 0, // Would be parsed from info messages
            depth: searchDepth,
            nodes: 0, // Would be parsed from info messages
            time: 0, // Would be parsed from info messages
            pv: [] // Would be parsed from info messages
          });
        }, 
        reject 
      });
      
      this.sendCommand(`go depth ${searchDepth}`);
    });
  }

  /**
   * Shutdown the engine
   */
  public shutdown(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }

  /**
   * Check if engine is ready
   */
  public isEngineReady(): boolean {
    return this.isReady;
  }
}

// Singleton instance
let stockfishInstance: StockfishService | null = null;

export function getStockfishService(): StockfishService {
  if (!stockfishInstance) {
    stockfishInstance = new StockfishService();
  }
  return stockfishInstance;
}