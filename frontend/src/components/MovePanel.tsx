import React, { useEffect } from 'react';
import { Chess } from 'chess.js';
import { usePairedMoves } from '../hooks/usePairedMoves';
import { useScrollToBottom } from '../hooks/useScrollToBottom';
import styles from './MovePanel.module.css';

interface MovePanelProps {
  moveHistory: string[];
  currentMoveIndex: number; // -1 = live position, 0+ = ply index
  gameMode: 'TIMED' | 'TRAINING';
  reviewMode?: boolean;
  game?: Chess; // For PGN generation
  onMoveClick?: (plyIndex: number) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateToStart?: () => void;
  onNavigateToEnd?: () => void;
}

export const MovePanel: React.FC<MovePanelProps> = ({
  moveHistory,
  currentMoveIndex,
  gameMode,
  reviewMode = false,
  game,
  onMoveClick,
  onNavigateBack,
  onNavigateForward,
  onNavigateToStart,
  onNavigateToEnd
}) => {
  // Pair moves: ["e4", "e5"] → [{white: "e4", black: "e5"}]
  const pairedMoves = usePairedMoves(moveHistory);

  // Auto-scroll to latest move
  const moveListRef = useScrollToBottom(moveHistory.length);

  // Handle click on individual move (white or black)
  const handleMoveClick = (rowIndex: number, column: 'white' | 'black') => {
    if (gameMode !== 'TRAINING') return;

    // Convert row/column to ply index
    const plyIndex = column === 'white' ? rowIndex * 2 : rowIndex * 2 + 1;

    if (plyIndex < moveHistory.length) {
      onMoveClick?.(plyIndex);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (gameMode !== 'TRAINING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onNavigateBack?.();
      if (e.key === 'ArrowRight') onNavigateForward?.();
      if (e.key === 'Home') onNavigateToStart?.();
      if (e.key === 'End') onNavigateToEnd?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, onNavigateBack, onNavigateForward, onNavigateToStart, onNavigateToEnd]);

  // PGN copy handler - generates proper PGN format
  const handleCopyPGN = () => {
    let pgnText: string;

    // Always reconstruct from moveHistory to ensure full game is exported
    // (the provided game instance might be truncated if in review mode)
    const tempGame = new Chess();
    try {
      moveHistory.forEach(move => tempGame.move(move));
      pgnText = tempGame.pgn({
        maxWidth: 80,
        newline: '\n'
      });
    } catch (error) {
      console.error('Failed to reconstruct game for PGN:', error);
      pgnText = moveHistory.join(' ');
    }

    navigator.clipboard.writeText(pgnText).then(() => {
      console.log('PGN copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy PGN:', err);
    });
  };

  return (
    <div className={styles.movePanel}>
      {/* Move List */}
      <div ref={moveListRef} className={styles.moveList}>
        {pairedMoves.length === 0 ? (
          <div className={styles.emptyState}>
            No moves yet
          </div>
        ) : (
          pairedMoves.map((pair, idx) => (
            <div key={idx} className={styles.moveRow}>
              <span className={styles.number}>{idx + 1}.</span>
              {pair.white && (
                <span
                  className={`${styles.white} ${currentMoveIndex === idx * 2 ? styles.active : ''}`}
                  onClick={() => handleMoveClick(idx, 'white')}
                >
                  {pair.white}
                </span>
              )}
              {pair.black && (
                <span
                  className={`${styles.black} ${currentMoveIndex === idx * 2 + 1 ? styles.active : ''}`}
                  onClick={() => handleMoveClick(idx, 'black')}
                >
                  {pair.black}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Training Controls */}
      {gameMode === 'TRAINING' && (
        <div className={styles.navigationControls}>
          {reviewMode && (
            <div className={styles.reviewBanner}>
              <span>
                {currentMoveIndex === -1 ? (
                  '📖 Reviewing Starting Position'
                ) : (
                  <>
                    📖 Reviewing Move {Math.floor(currentMoveIndex / 2) + 1}
                    {currentMoveIndex % 2 === 0 ? ' (White)' : ' (Black)'}
                  </>
                )}
              </span>
              <button onClick={onNavigateToEnd} className={styles.exitReviewBtn}>
                Return to Live
              </button>
            </div>
          )}

          <div className={styles.navButtons}>
            <button
              onClick={onNavigateToStart}
              disabled={moveHistory.length === 0 || (reviewMode && currentMoveIndex === -1)}
              title="Jump to Start (Home)"
            >
              ⏮
            </button>
            <button
              onClick={onNavigateBack}
              disabled={moveHistory.length === 0 || (reviewMode && currentMoveIndex === -1)}
              title="Previous Move (←)"
            >
              ◀
            </button>
            <button
              onClick={onNavigateForward}
              disabled={currentMoveIndex >= moveHistory.length - 1}
              title="Next Move (→)"
            >
              ▶
            </button>
            <button
              onClick={onNavigateToEnd}
              disabled={currentMoveIndex === -1}
              title="Return to Live (End)"
            >
              ⏭
            </button>
          </div>
        </div>
      )}

      {/* PGN Controls */}
      <div className={styles.pgnControls}>
        <button onClick={handleCopyPGN}>📋 Copy Moves</button>
      </div>
    </div>
  );
};
