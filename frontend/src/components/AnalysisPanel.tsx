import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Chess } from 'chess.js';
import { StockfishService, AnalysisResult, AnalysisLine } from '../services/chess-engine/stockfish-service';
import styles from './AnalysisPanel.module.css';

interface AnalysisPanelProps {
  game: Chess;
  enabled: boolean;
  onPlayMove?: (uciMove: string) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  game,
  enabled,
  onPlayMove
}) => {
  const { t } = useTranslation(['game']);

  // Settings
  const [depth, setDepth] = useState<number>(12);
  const [multipv, setMultipv] = useState<number>(1);
  const [analysisEnabled, setAnalysisEnabled] = useState<boolean>(enabled);

  // Analysis results
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Refs
  const engineRef = useRef<StockfishService | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new StockfishService();
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.stopAnalysis();
        engineRef.current.shutdown();
        engineRef.current = null;
      }
    };
  }, []);

  // Handle position changes with debouncing
  useEffect(() => {
    if (!analysisEnabled || !engineRef.current) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce analysis by 300ms
    debounceTimerRef.current = setTimeout(() => {
      if (engineRef.current) {
        const fen = game.fen();
        engineRef.current.setPosition(fen);
        engineRef.current.startAnalysis(depth, multipv, handleAnalysisUpdate);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [game.fen(), analysisEnabled, depth, multipv]);

  // Handle analysis updates from engine
  const handleAnalysisUpdate = useCallback((result: AnalysisResult) => {
    setAnalysis(result);
  }, []);

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

  // Format score for display
  const formatScore = (line: AnalysisLine): string => {
    if (line.score.type === 'mate') {
      const mateIn = line.score.value;
      return mateIn > 0 ? `M${mateIn}` : `M${Math.abs(mateIn)}`;
    } else {
      const pawns = (line.score.value / 100).toFixed(2);
      return line.score.value > 0 ? `+${pawns}` : pawns;
    }
  };

  // Convert UCI moves to SAN notation
  const formatPV = (pv: string[], maxMoves: number = 5): string => {
    try {
      // Create a new Chess instance from current FEN
      const tempGame = new Chess(game.fen());
      const sanMoves: string[] = [];

      for (let i = 0; i < Math.min(pv.length, maxMoves); i++) {
        const move = tempGame.move({ from: pv[i].slice(0, 2), to: pv[i].slice(2, 4), promotion: pv[i][4] });
        if (move) {
          sanMoves.push(move.san);
        } else {
          break;
        }
      }

      return sanMoves.join(' ') + (pv.length > maxMoves ? '...' : '');
    } catch {
      // Fallback to UCI notation if conversion fails
      return pv.slice(0, maxMoves).join(' ') + (pv.length > maxMoves ? '...' : '');
    }
  };

  // Pause analysis when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && engineRef.current) {
        engineRef.current.stopAnalysis();
      } else if (!document.hidden && analysisEnabled && engineRef.current) {
        const fen = game.fen();
        engineRef.current.setPosition(fen);
        engineRef.current.startAnalysis(depth, multipv, handleAnalysisUpdate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [analysisEnabled, depth, multipv, game, handleAnalysisUpdate]);

  return (
    <div className={styles.analysisPanel}>
      {/* Header with toggle */}
      <div className={styles.header}>
        <h3>{t('game:analysis.title')}</h3>
        <button
          onClick={handleToggleAnalysis}
          className={analysisEnabled ? styles.toggleOn : styles.toggleOff}
          aria-label={analysisEnabled ? t('game:analysis.toggle_off') : t('game:analysis.toggle_on')}
        >
          {analysisEnabled ? t('game:analysis.on') : t('game:analysis.off')}
        </button>
      </div>

      {/* Settings */}
      {analysisEnabled && (
        <>
          <div className={styles.settings}>
            {/* Depth selector */}
            <div className={styles.setting}>
              <label htmlFor="depth-select">{t('game:analysis.depth_label')}</label>
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
            </div>

            {/* MultiPV selector */}
            <div className={styles.setting}>
              <label htmlFor="lines-select">{t('game:analysis.lines_label')}</label>
              <select
                id="lines-select"
                value={multipv}
                onChange={(e) => handleMultipvChange(Number(e.target.value))}
                className={styles.select}
              >
                <option value={1}>1 {t('game:analysis.line')}</option>
                <option value={2}>2 {t('game:analysis.lines')}</option>
                <option value={3}>3 {t('game:analysis.lines')}</option>
              </select>
            </div>
          </div>

          {/* Analysis results */}
          <div className={styles.results}>
            {analysis ? (
              <>
                <div className={styles.depthInfo}>
                  {t('game:analysis.depth_reached', { depth: analysis.depth })}
                </div>

                {/* Analysis lines */}
                {analysis.lines.map((line) => (
                  <div key={line.multipv} className={styles.line}>
                    <div className={styles.lineHeader}>
                      <span className={styles.lineNumber}>#{line.multipv}</span>
                      <span className={styles.score}>{formatScore(line)}</span>
                    </div>
                    <div className={styles.pv} style={{ direction: 'ltr' }}>
                      {formatPV(line.pv)}
                    </div>
                  </div>
                ))}

                {/* Play best move button */}
                {analysis.lines.length > 0 && onPlayMove && (
                  <button
                    onClick={handlePlayBestMove}
                    className={styles.playButton}
                  >
                    {t('game:analysis.play_best_move')}
                  </button>
                )}
              </>
            ) : (
              <div className={styles.analyzing}>
                {t('game:analysis.analyzing')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
