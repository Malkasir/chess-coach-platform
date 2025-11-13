import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Chess } from 'chess.js';
import { StockfishService, AnalysisResult, AnalysisLine } from '../services/chess-engine/stockfish-service';
import styles from './AnalysisPanel.module.css';

interface AnalysisPanelProps {
  game: Chess;
  position: string; // FEN string - pass from parent to avoid game.fen() dependency churn
  enabled: boolean;
  onPlayMove?: (uciMove: string) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  game,
  position,
  enabled,
  onPlayMove
}) => {
  const { t } = useTranslation(['game']);

  // Settings
  const [depth, setDepth] = useState<number>(12);
  const [multipv, setMultipv] = useState<number>(1);
  const [analysisEnabled, setAnalysisEnabled] = useState<boolean>(enabled);
  const [engineReady, setEngineReady] = useState<boolean>(false);

  // Analysis results
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Sync enabled prop changes (e.g., entering/exiting review mode)
  useEffect(() => {
    setAnalysisEnabled(enabled);
  }, [enabled]);

  // Refs
  const engineRef = useRef<StockfishService | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle analysis updates from engine (declared early to avoid circular dependency)
  const handleAnalysisUpdate = useCallback((result: AnalysisResult) => {
    setAnalysis(result);
  }, []);

  // Initialize engine
  useEffect(() => {
    let service: StockfishService | null = null;

    try {
      // Always create a new service (handles StrictMode double-mount)
      service = new StockfishService();
      engineRef.current = service;
    } catch (error) {
      console.error('Failed to create StockfishService:', error);
      engineRef.current = null;
      setEngineReady(false);
      return;
    }

    // Poll engine readiness
    const checkReadiness = setInterval(() => {
      if (engineRef.current && engineRef.current.isEngineReady()) {
        setEngineReady(true);
        clearInterval(checkReadiness);
      }
    }, 100);

    // Cleanup on unmount
    return () => {
      clearInterval(checkReadiness);
      if (service) {
        service.stopAnalysis();
        service.shutdown();
      }
    };
  }, []);

  // Handle position changes with debouncing
  useEffect(() => {
    if (!analysisEnabled || !engineRef.current || !engineReady) {
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce analysis by 300ms
    debounceTimerRef.current = setTimeout(() => {
      if (engineRef.current && engineReady) {
        engineRef.current.setPosition(position);
        engineRef.current.startAnalysis(depth, multipv, handleAnalysisUpdate);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [position, analysisEnabled, depth, multipv, handleAnalysisUpdate, engineReady]);

  // Toggle analysis on/off
  const handleToggleAnalysis = () => {
    const newState = !analysisEnabled;
    setAnalysisEnabled(newState);

    if (!newState && engineRef.current) {
      engineRef.current.stopAnalysis();
      setAnalysis(null);
    }
  };

  // Handle depth change
  const handleDepthChange = (newDepth: number) => {
    setDepth(newDepth);
  };

  // Handle MultiPV change
  const handleMultipvChange = (newMultipv: number) => {
    setMultipv(newMultipv);
  };

  // Play best move
  const handlePlayBestMove = () => {
    if (analysis && analysis.lines.length > 0 && analysis.lines[0].pv.length > 0) {
      const bestMove = analysis.lines[0].pv[0];
      onPlayMove?.(bestMove);
    }
  };

  // Format score for display - already normalized to white's perspective by service
  const formatScore = (line: AnalysisLine): string => {
    const scoreValue = line.score.value;

    if (line.score.type === 'mate') {
      const mateIn = Math.abs(scoreValue);
      return scoreValue > 0 ? `+M${mateIn}` : `-M${mateIn}`;
    } else {
      const pawns = (scoreValue / 100).toFixed(2);
      return scoreValue > 0 ? `+${pawns}` : pawns;
    }
  };

  // Convert UCI moves to SAN notation with move numbers
  const formatPV = useCallback((pv: string[], maxMoves: number = 5): string => {
    try {
      // Create a new Chess instance from current FEN
      const tempGame = new Chess(game.fen());
      const sanMoves: string[] = [];

      // Calculate the actual move number from the FEN
      // FEN format: "position w/b KQkq - halfmove fullmove"
      const fenParts = game.fen().split(' ');
      let moveNumber = parseInt(fenParts[5] || '1', 10); // Full move number from FEN
      const isWhiteTurn = tempGame.turn() === 'w';

      for (let i = 0; i < Math.min(pv.length, maxMoves); i++) {
        const move = tempGame.move({ from: pv[i].slice(0, 2), to: pv[i].slice(2, 4), promotion: pv[i][4] });
        if (move) {
          // Add move number for white moves or first move if black
          if (i === 0 && !isWhiteTurn) {
            sanMoves.push(`${moveNumber}...${move.san}`);
          } else if (tempGame.turn() === 'b') {
            // Just added white's move
            sanMoves.push(`${moveNumber}.${move.san}`);
          } else {
            // Just added black's move
            sanMoves.push(move.san);
            moveNumber++; // Increment after black's move
          }
        } else {
          break;
        }
      }

      return sanMoves.join(' ') + (pv.length > maxMoves ? '...' : '');
    } catch {
      // Fallback to UCI notation if conversion fails
      return pv.slice(0, maxMoves).join(' ') + (pv.length > maxMoves ? '...' : '');
    }
  }, [game]);

  // Pre-format all PV lines to prevent flickering between UCI and SAN notation
  const formattedLines = useMemo(() => {
    if (!analysis) return [];

    return analysis.lines.map(line => ({
      ...line,
      formattedPV: formatPV(line.pv, 18)
    }));
  }, [analysis, formatPV]);

  // Pause analysis when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && engineRef.current) {
        engineRef.current.stopAnalysis();
      } else if (!document.hidden && analysisEnabled && engineRef.current && engineReady) {
        engineRef.current.setPosition(position);
        engineRef.current.startAnalysis(depth, multipv, handleAnalysisUpdate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [analysisEnabled, depth, multipv, position, handleAnalysisUpdate, engineReady]);

  return (
    <div className={styles.analysisPanel}>
      {/* Compact header with inline controls */}
      <div className={styles.header}>
        {/* Settings inline */}
        {analysisEnabled && (
          <div className={styles.headerSettings}>
            <span className={styles.settingLabel}>{t('game:analysis.depth_label')}:</span>
            <select
              id="depth-select"
              value={depth}
              onChange={(e) => handleDepthChange(Number(e.target.value))}
              className={styles.select}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={20}>20</option>
            </select>

            <span className={styles.settingLabel}>{t('game:analysis.lines_label')}:</span>
            <select
              id="lines-select"
              value={multipv}
              onChange={(e) => handleMultipvChange(Number(e.target.value))}
              className={styles.select}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        )}

        <button
          onClick={handleToggleAnalysis}
          className={analysisEnabled ? styles.toggleOn : styles.toggleOff}
          aria-label={analysisEnabled ? t('game:analysis.toggle_off') : t('game:analysis.toggle_on')}
        >
          {analysisEnabled ? t('game:analysis.on') : t('game:analysis.off')}
        </button>
      </div>

      {/* Analysis results - compact horizontal lines */}
      {analysisEnabled && (
        <div className={styles.results}>
          {!engineReady ? (
            <div className={styles.analyzing}>
              {t('game:analysis.engine_loading', { defaultValue: 'Engine loading...' })}
            </div>
          ) : formattedLines.length > 0 ? (
            <>
              {/* Analysis lines - compact: score #N moves */}
              {formattedLines.map((line) => (
                <div
                  key={line.multipv}
                  className={styles.line}
                  onClick={async () => {
                    // All lines are now clickable to explore different moves
                    if (onPlayMove && line.pv.length > 0) {
                      // IMPORTANT: Stop analysis first to prevent WASM crashes
                      if (engineRef.current) {
                        engineRef.current.stopAnalysis();
                      }

                      // Small delay to let the engine fully stop before playing move
                      await new Promise(resolve => setTimeout(resolve, 100));

                      // Now safe to play the move
                      onPlayMove(line.pv[0]);
                    }
                  }}
                  style={{ cursor: onPlayMove ? 'pointer' : 'default' }}
                  title={t('game:analysis.play_move', { defaultValue: `Play ${line.pv[0]}` })}
                >
                  <span className={styles.score}>{formatScore(line)}</span>
                  <span className={styles.lineNumber}>#{line.multipv}</span>
                  <span className={styles.pv} style={{ direction: 'ltr' }}>
                    {line.formattedPV}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.analyzing}>
              {t('game:analysis.analyzing')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
