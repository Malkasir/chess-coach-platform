import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import styles from './LoadPositionModal.module.css';

interface LoadPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPosition: (fen: string) => void;
}

// Common positions for quick testing
const EXAMPLE_POSITIONS = [
  {
    name: 'Starting Position',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  {
    name: 'Lucena Position (Endgame)',
    fen: '1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1'
  },
  {
    name: 'Back Rank Mate Pattern',
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
  },
  {
    name: 'Scholar\'s Mate Setup',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4'
  }
];

export const LoadPositionModal: React.FC<LoadPositionModalProps> = ({
  isOpen,
  onClose,
  onLoadPosition
}) => {
  const [fenInput, setFenInput] = useState('');
  const [previewFen, setPreviewFen] = useState('start');
  const [error, setError] = useState<string | null>(null);

  // Validate and update preview when FEN changes
  const handleFenChange = (value: string) => {
    setFenInput(value);
    setError(null);

    if (!value.trim()) {
      setPreviewFen('start');
      return;
    }

    try {
      const testGame = new Chess(value);
      setPreviewFen(testGame.fen());
      setError(null);
    } catch (e) {
      setError('Invalid FEN string');
      setPreviewFen('start');
    }
  };

  // Load example position
  const handleExampleClick = (fen: string) => {
    setFenInput(fen);
    handleFenChange(fen);
  };

  // Load the position
  const handleLoad = () => {
    if (!fenInput.trim()) {
      setError('Please enter a FEN string');
      return;
    }

    try {
      const testGame = new Chess(fenInput);
      onLoadPosition(testGame.fen());
      handleClose();
    } catch (e) {
      setError('Invalid FEN string');
    }
  };

  // Reset and close
  const handleClose = () => {
    setFenInput('');
    setPreviewFen('start');
    setError(null);
    onClose();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && !error && fenInput.trim()) {
      handleLoad();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2>Load Custom Position</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* FEN Input Section */}
          <div className={styles.section}>
            <label htmlFor="fen-input" className={styles.label}>
              FEN String
            </label>
            <input
              id="fen-input"
              type="text"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              value={fenInput}
              onChange={(e) => handleFenChange(e.target.value)}
              autoFocus
            />
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.hint}>
              Enter a valid FEN (Forsyth-Edwards Notation) string to load a custom chess position.
            </div>
          </div>

          {/* Preview Board */}
          <div className={styles.section}>
            <label className={styles.label}>Preview</label>
            <div className={styles.previewBoard}>
              <Chessboard
                position={previewFen}
                boardWidth={300}
                arePiecesDraggable={false}
                customBoardStyle={{
                  borderRadius: '8px'
                }}
                customLightSquareStyle={{
                  backgroundColor: 'var(--board-light)'
                }}
                customDarkSquareStyle={{
                  backgroundColor: 'var(--board-dark)'
                }}
              />
            </div>
          </div>

          {/* Example Positions */}
          <div className={styles.section}>
            <label className={styles.label}>Quick Examples</label>
            <div className={styles.examples}>
              {EXAMPLE_POSITIONS.map((example) => (
                <button
                  key={example.name}
                  className={styles.exampleButton}
                  onClick={() => handleExampleClick(example.fen)}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className={styles.loadButton}
            onClick={handleLoad}
            disabled={!fenInput.trim() || !!error}
          >
            Load Position
          </button>
        </div>
      </div>
    </div>
  );
};
