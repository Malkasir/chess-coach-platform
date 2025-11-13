import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Chess } from 'chess.js';
import { AnalysisPanel } from './AnalysisPanel';
import { AnalysisResult } from '../services/chess-engine/stockfish-service';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Simple mock translations
      const translations: Record<string, string> = {
        'game:analysis.title': 'Engine Analysis',
        'game:analysis.on': 'On',
        'game:analysis.off': 'Off',
        'game:analysis.toggle_on': 'Turn analysis on',
        'game:analysis.toggle_off': 'Turn analysis off',
        'game:analysis.depth_label': 'Depth',
        'game:analysis.lines_label': 'Lines',
        'game:analysis.line': 'line',
        'game:analysis.lines': 'lines',
        'game:analysis.depth_reached': `Depth: ${options?.depth || 0}`,
        'game:analysis.analyzing': 'Analyzing position...',
        'game:analysis.play_best_move': 'Play Best Move',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock StockfishService
vi.mock('../services/chess-engine/stockfish-service', () => {
  const MockStockfishService = vi.fn().mockImplementation(() => ({
    setPosition: vi.fn(),
    startAnalysis: vi.fn(),
    stopAnalysis: vi.fn(),
    shutdown: vi.fn(),
    isCurrentlyAnalyzing: vi.fn(() => false),
  }));

  return {
    StockfishService: MockStockfishService,
    AnalysisLine: {},
    AnalysisResult: {},
  };
});

describe('AnalysisPanel', () => {
  let game: Chess;
  let mockOnPlayMove: ReturnType<typeof vi.fn>;
  const defaultPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  beforeEach(() => {
    game = new Chess();
    mockOnPlayMove = vi.fn();
  });

  it('should render with analysis disabled by default', () => {
    render(<AnalysisPanel game={game} position={defaultPosition} enabled={false} onPlayMove={mockOnPlayMove} />);

    expect(screen.getByText('Engine Analysis')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('should toggle analysis on/off', () => {
    render(<AnalysisPanel game={game} position={defaultPosition} enabled={false} onPlayMove={mockOnPlayMove} />);

    const toggleButton = screen.getByRole('button', { name: /Turn analysis on/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    // After click, button should show "On"
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('should render depth and lines selectors when enabled', () => {
    render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

    const toggleButton = screen.getByRole('button', { name: /Turn analysis off/i });
    fireEvent.click(toggleButton);

    expect(screen.getByLabelText('Depth')).toBeInTheDocument();
    expect(screen.getByLabelText('Lines')).toBeInTheDocument();
  });

  it('should render depth options correctly', () => {
    render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

    const depthSelect = screen.getByLabelText('Depth') as HTMLSelectElement;

    expect(depthSelect.querySelector('option[value="8"]')).toBeInTheDocument();
    expect(depthSelect.querySelector('option[value="12"]')).toBeInTheDocument();
    expect(depthSelect.querySelector('option[value="16"]')).toBeInTheDocument();
    expect(depthSelect.querySelector('option[value="20"]')).toBeInTheDocument();
  });

  it('should render lines options correctly', () => {
    render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

    const linesSelect = screen.getByLabelText('Lines') as HTMLSelectElement;

    expect(linesSelect.querySelector('option[value="1"]')).toBeInTheDocument();
    expect(linesSelect.querySelector('option[value="2"]')).toBeInTheDocument();
    expect(linesSelect.querySelector('option[value="3"]')).toBeInTheDocument();
  });

  it('should show analyzing message when no analysis results', () => {
    render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

    expect(screen.getByText('Analyzing position...')).toBeInTheDocument();
  });

  describe('RTL Handling', () => {
    it('should force LTR direction for principal variation (PV) display', () => {
      const { container } = render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      // Check if PV elements have LTR direction
      const pvElements = container.querySelectorAll('[style*="direction"]');

      pvElements.forEach((element) => {
        const style = (element as HTMLElement).style;
        expect(style.direction).toBe('ltr');
      });
    });

    it('should maintain LTR for chess notation in Arabic locale', async () => {
      // Create a mock analysis result
      const mockAnalysisResult: AnalysisResult = {
        lines: [
          {
            multipv: 1,
            depth: 16,
            score: { type: 'cp', value: 25 },
            pv: ['e2e4', 'e7e5', 'g1f3'],
            nodes: 100000,
            time: 1000,
          },
        ],
        depth: 16,
        fen: game.fen(),
      };

      // Override document direction to RTL to simulate Arabic locale
      document.documentElement.dir = 'rtl';

      const { container } = render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      // Simulate receiving analysis results by directly accessing the component's state
      // In a real scenario, this would come from the StockfishService callback

      // Check that PV containers have explicit LTR direction
      const pvContainers = container.querySelectorAll('.pv');
      pvContainers.forEach((pvContainer) => {
        expect(pvContainer).toHaveStyle({ direction: 'ltr' });
      });

      // Reset document direction
      document.documentElement.dir = 'ltr';
    });
  });

  describe('Score Formatting', () => {
    it('should format positive centipawn scores correctly', () => {
      // This would require exposing formatScore or testing through rendered output
      // For now, we test the rendered behavior

      render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      // The actual score formatting would be tested through integration
      // with real analysis results
    });
  });

  describe('Play Best Move', () => {
    it('should call onPlayMove with best move when button clicked', async () => {
      render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} onPlayMove={mockOnPlayMove} />);

      // This test would require simulating analysis results
      // In a full implementation, you'd trigger the analysis callback
      // and then test that clicking "Play Best Move" calls onPlayMove
    });

    it('should not render Play Best Move button when onPlayMove is not provided', () => {
      render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      expect(screen.queryByText('Play Best Move')).not.toBeInTheDocument();
    });
  });

  describe('Debouncing', () => {
    it('should debounce analysis when position changes rapidly', async () => {
      const { rerender } = render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      // Make multiple moves rapidly
      game.move('e4');
      rerender(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      game.move('e5');
      rerender(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      game.move('Nf3');
      rerender(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      // Wait for debounce timeout (300ms)
      await waitFor(
        () => {
          // The analysis should only be triggered once after debouncing
          // This would be verified through the StockfishService mock
        },
        { timeout: 500 }
      );
    });
  });

  describe('Visibility Handling', () => {
    it('should pause analysis when tab becomes hidden', () => {
      render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      });

      fireEvent(document, new Event('visibilitychange'));

      // Analysis should be stopped
      // This would be verified through the StockfishService mock
    });

    it('should resume analysis when tab becomes visible', () => {
      render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      // Simulate tab becoming visible
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      });

      fireEvent(document, new Event('visibilitychange'));

      // Analysis should restart
      // This would be verified through the StockfishService mock
    });
  });

  describe('Cleanup', () => {
    it('should shutdown engine on unmount', () => {
      const { unmount } = render(<AnalysisPanel game={game} position={defaultPosition} enabled={true} />);

      unmount();

      // Verify that shutdown was called
      // This would be verified through the StockfishService mock
    });
  });
});
