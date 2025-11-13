import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StockfishService, AnalysisLine, AnalysisResult } from './stockfish-service';

describe('StockfishService', () => {
  let service: StockfishService;

  beforeEach(() => {
    // Mock Worker to prevent actual Stockfish initialization
    global.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as any;

    service = new StockfishService();
  });

  afterEach(() => {
    if (service) {
      service.shutdown();
    }
  });

  describe('UCI Info Parsing', () => {
    it('should parse centipawn score from UCI info line', () => {
      const infoLine = 'info depth 15 multipv 1 score cp 25 nodes 100000 time 1000 pv e2e4 e7e5 g1f3';

      // Access private method via any type casting for testing
      const parsedResult = (service as any).parseMultiPVInfo(infoLine);

      // Since parseMultiPVInfo updates internal state, we need to verify through the callback
      let capturedAnalysis: AnalysisResult | null = null;
      (service as any).analysisCallback = (result: AnalysisResult) => {
        capturedAnalysis = result;
      };
      (service as any).isAnalyzing = true;

      // Call the parser
      (service as any).parseMultiPVInfo(infoLine);

      expect(capturedAnalysis).toBeTruthy();
      expect(capturedAnalysis!.lines).toHaveLength(1);
      expect(capturedAnalysis!.lines[0].score.type).toBe('cp');
      expect(capturedAnalysis!.lines[0].score.value).toBe(25);
      expect(capturedAnalysis!.lines[0].depth).toBe(15);
    });

    it('should parse mate score from UCI info line', () => {
      const infoLine = 'info depth 20 multipv 1 score mate 3 nodes 500000 time 2000 pv e2e4 e7e5';

      let capturedAnalysis: AnalysisResult | null = null;
      (service as any).analysisCallback = (result: AnalysisResult) => {
        capturedAnalysis = result;
      };
      (service as any).isAnalyzing = true;

      (service as any).parseMultiPVInfo(infoLine);

      expect(capturedAnalysis).toBeTruthy();
      expect(capturedAnalysis!.lines[0].score.type).toBe('mate');
      expect(capturedAnalysis!.lines[0].score.value).toBe(3);
    });

    it('should parse negative mate score (opponent has mate)', () => {
      const infoLine = 'info depth 18 multipv 1 score mate -2 nodes 300000 time 1500 pv e2e4';

      let capturedAnalysis: AnalysisResult | null = null;
      (service as any).analysisCallback = (result: AnalysisResult) => {
        capturedAnalysis = result;
      };
      (service as any).isAnalyzing = true;

      (service as any).parseMultiPVInfo(infoLine);

      expect(capturedAnalysis!.lines[0].score.type).toBe('mate');
      expect(capturedAnalysis!.lines[0].score.value).toBe(-2);
    });

    it('should parse principal variation (PV) moves', () => {
      const infoLine = 'info depth 12 multipv 1 score cp 15 pv e2e4 e7e5 g1f3 b8c6 f1c4';

      let capturedAnalysis: AnalysisResult | null = null;
      (service as any).analysisCallback = (result: AnalysisResult) => {
        capturedAnalysis = result;
      };
      (service as any).isAnalyzing = true;

      (service as any).parseMultiPVInfo(infoLine);

      expect(capturedAnalysis!.lines[0].pv).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4']);
    });

    it('should handle multiple MultiPV lines', () => {
      const infoLines = [
        'info depth 16 multipv 1 score cp 30 nodes 200000 time 1000 pv e2e4 e7e5 g1f3',
        'info depth 16 multipv 2 score cp 20 nodes 200000 time 1000 pv d2d4 d7d5 c2c4',
        'info depth 16 multipv 3 score cp 10 nodes 200000 time 1000 pv g1f3 g8f6 c2c4',
      ];

      let capturedAnalysis: AnalysisResult | null = null;
      (service as any).analysisCallback = (result: AnalysisResult) => {
        capturedAnalysis = result;
      };
      (service as any).isAnalyzing = true;

      // Parse all lines
      infoLines.forEach(line => (service as any).parseMultiPVInfo(line));

      expect(capturedAnalysis!.lines).toHaveLength(3);
      expect(capturedAnalysis!.lines[0].multipv).toBe(1);
      expect(capturedAnalysis!.lines[0].score.value).toBe(30);
      expect(capturedAnalysis!.lines[1].multipv).toBe(2);
      expect(capturedAnalysis!.lines[1].score.value).toBe(20);
      expect(capturedAnalysis!.lines[2].multipv).toBe(3);
      expect(capturedAnalysis!.lines[2].score.value).toBe(10);
    });

    it('should extract nodes and time from info line', () => {
      const infoLine = 'info depth 14 multipv 1 score cp 42 nodes 350000 time 1750 pv e2e4';

      let capturedAnalysis: AnalysisResult | null = null;
      (service as any).analysisCallback = (result: AnalysisResult) => {
        capturedAnalysis = result;
      };
      (service as any).isAnalyzing = true;

      (service as any).parseMultiPVInfo(infoLine);

      expect(capturedAnalysis!.lines[0].nodes).toBe(350000);
      expect(capturedAnalysis!.lines[0].time).toBe(1750);
    });

    it('should handle info lines without multipv tag (single line analysis)', () => {
      const infoLine = 'info depth 10 score cp 5 nodes 50000 time 500 pv e2e4 e7e5';

      // This should not parse since multipv is missing
      let capturedAnalysis: AnalysisResult | null = null;
      (service as any).analysisCallback = (result: AnalysisResult) => {
        capturedAnalysis = result;
      };
      (service as any).isAnalyzing = true;

      (service as any).parseMultiPVInfo(infoLine);

      // Should not have captured anything
      expect(capturedAnalysis).toBeNull();
    });
  });

  describe('Analysis Control', () => {
    it('should start analysis with correct settings', () => {
      const mockCallback = vi.fn();
      const sendCommandSpy = vi.spyOn(service as any, 'sendCommand');

      service.startAnalysis(16, 2, mockCallback);

      expect(sendCommandSpy).toHaveBeenCalledWith('setoption name MultiPV value 2');
      expect(sendCommandSpy).toHaveBeenCalledWith('go depth 16');
      expect(service.isCurrentlyAnalyzing()).toBe(true);
    });

    it('should stop analysis when requested', () => {
      const mockCallback = vi.fn();
      const sendCommandSpy = vi.spyOn(service as any, 'sendCommand');

      service.startAnalysis(12, 1, mockCallback);
      expect(service.isCurrentlyAnalyzing()).toBe(true);

      service.stopAnalysis();

      expect(sendCommandSpy).toHaveBeenCalledWith('stop');
      expect(service.isCurrentlyAnalyzing()).toBe(false);
    });

    it('should set MultiPV value correctly', () => {
      const sendCommandSpy = vi.spyOn(service as any, 'sendCommand');

      service.setMultiPV(3);

      expect(sendCommandSpy).toHaveBeenCalledWith('setoption name MultiPV value 3');
    });

    it('should clamp MultiPV value between 1 and 3', () => {
      const sendCommandSpy = vi.spyOn(service as any, 'sendCommand');

      // Test upper bound
      service.setMultiPV(10);
      expect(sendCommandSpy).toHaveBeenCalledWith('setoption name MultiPV value 3');

      // Test lower bound
      service.setMultiPV(0);
      expect(sendCommandSpy).toHaveBeenCalledWith('setoption name MultiPV value 1');
    });
  });

  describe('Position Management', () => {
    it('should set position with FEN string', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const sendCommandSpy = vi.spyOn(service as any, 'sendCommand');

      service.setPosition(fen);

      expect(sendCommandSpy).toHaveBeenCalledWith(`position fen ${fen}`);
    });

    it('should set position with moves', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const moves = ['e2e4', 'e7e5', 'g1f3'];
      const sendCommandSpy = vi.spyOn(service as any, 'sendCommand');

      service.setPosition(fen, moves);

      expect(sendCommandSpy).toHaveBeenCalledWith(`position fen ${fen} moves ${moves.join(' ')}`);
    });
  });
});
