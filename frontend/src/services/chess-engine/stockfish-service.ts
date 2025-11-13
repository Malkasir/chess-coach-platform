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

// New interfaces for MultiPV analysis
export interface AnalysisLine {
  multipv: number;  // Line number (1 = best, 2 = second best, etc.)
  depth: number;    // Search depth reached
  score: {
    type: 'cp' | 'mate';  // Centipawn score or mate in N
    value: number;         // Score value (centipawns or moves to mate)
  };
  pv: string[];     // Principal variation (sequence of moves in UCI notation)
  nodes?: number;   // Nodes searched
  time?: number;    // Time spent in milliseconds
}

export interface AnalysisResult {
  lines: AnalysisLine[];  // Multiple lines (1-3 depending on MultiPV setting)
  depth: number;           // Current search depth
  fen: string;             // Position being analyzed
}

export type AnalysisCallback = (result: AnalysisResult) => void;

export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingMoves: Array<{ resolve: (value: EngineMove) => void; reject: (error: any) => void }> = [];
  private currentPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  private engineSettings: EngineSettings;

  // Analysis state
  private analysisCallback: AnalysisCallback | null = null;
  private currentAnalysis: Map<number, AnalysisLine> = new Map();  // multipv -> line
  private currentDepth: number = 0;
  private isAnalyzing: boolean = false;

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
    try {
      // Create the real Stockfish worker using Vite's worker syntax
      const worker = new Worker(
        new URL('../../workers/stockfish.worker.ts', import.meta.url),
        { type: 'module' }
      );

      debugLog('Real Stockfish worker created successfully');
      return worker;
    } catch (error) {
      debugError('Failed to create Stockfish worker:', error);
      debugLog('Falling back to mock worker for development');
      return this.createMockWorker();
    }
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

    // Enhanced parsing for MultiPV analysis
    if (this.isAnalyzing && this.analysisCallback) {
      this.parseMultiPVInfo(info);
    }
  }

  /**
   * Parse UCI info line for MultiPV analysis
   * Example info line:
   * "info depth 15 multipv 1 score cp 25 nodes 100000 time 1000 pv e2e4 e7e5 g1f3"
   */
  private parseMultiPVInfo(info: string): void {
    // Extract multipv number
    const multipvMatch = info.match(/multipv (\d+)/);
    if (!multipvMatch) return;
    const multipv = parseInt(multipvMatch[1]);

    // Extract depth
    const depthMatch = info.match(/depth (\d+)/);
    if (!depthMatch) return;
    const depth = parseInt(depthMatch[1]);

    // Extract score (either centipawns or mate)
    let scoreType: 'cp' | 'mate' = 'cp';
    let scoreValue = 0;

    const cpMatch = info.match(/score cp (-?\d+)/);
    const mateMatch = info.match(/score mate (-?\d+)/);

    if (cpMatch) {
      scoreType = 'cp';
      scoreValue = parseInt(cpMatch[1]);
    } else if (mateMatch) {
      scoreType = 'mate';
      scoreValue = parseInt(mateMatch[1]);
    } else {
      return;  // No score found
    }

    // Extract principal variation (sequence of moves)
    const pvMatch = info.match(/pv (.+)$/);
    const pv = pvMatch ? pvMatch[1].trim().split(' ') : [];

    // Extract optional fields
    const nodesMatch = info.match(/nodes (\d+)/);
    const timeMatch = info.match(/time (\d+)/);
    const nodes = nodesMatch ? parseInt(nodesMatch[1]) : undefined;
    const time = timeMatch ? parseInt(timeMatch[1]) : undefined;

    // Create analysis line
    const line: AnalysisLine = {
      multipv,
      depth,
      score: { type: scoreType, value: scoreValue },
      pv,
      nodes,
      time
    };

    // Update current analysis
    this.currentAnalysis.set(multipv, line);
    this.currentDepth = Math.max(this.currentDepth, depth);

    // Call callback with updated analysis
    if (this.analysisCallback) {
      const result: AnalysisResult = {
        lines: Array.from(this.currentAnalysis.values()).sort((a, b) => a.multipv - b.multipv),
        depth: this.currentDepth,
        fen: this.currentPosition
      };
      this.analysisCallback(result);
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
   * Start real-time analysis with MultiPV support
   * @param depth - Search depth (8, 12, 16, 20, etc.)
   * @param multipv - Number of lines to analyze (1-3)
   * @param callback - Function called with analysis updates
   */
  public startAnalysis(depth: number, multipv: number, callback: AnalysisCallback): void {
    // Stop any existing analysis
    this.stopAnalysis();

    // Set up new analysis
    this.isAnalyzing = true;
    this.analysisCallback = callback;
    this.currentAnalysis.clear();
    this.currentDepth = 0;

    // Configure MultiPV
    this.sendCommand(`setoption name MultiPV value ${multipv}`);

    // Start infinite analysis at specified depth
    this.sendCommand(`go depth ${depth}`);

    debugLog(`Started analysis: depth=${depth}, multipv=${multipv}`);
  }

  /**
   * Stop current analysis
   */
  public stopAnalysis(): void {
    if (this.isAnalyzing) {
      this.sendCommand('stop');
      this.isAnalyzing = false;
      this.analysisCallback = null;
      this.currentAnalysis.clear();
      this.currentDepth = 0;
      debugLog('Stopped analysis');
    }
  }

  /**
   * Check if currently analyzing
   */
  public isCurrentlyAnalyzing(): boolean {
    return this.isAnalyzing;
  }

  /**
   * Set MultiPV option (number of lines to analyze)
   * @param multipv - Number of lines (1-3)
   */
  public setMultiPV(multipv: number): void {
    const clampedValue = Math.max(1, Math.min(3, multipv));
    this.sendCommand(`setoption name MultiPV value ${clampedValue}`);
    debugLog(`MultiPV set to ${clampedValue}`);
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