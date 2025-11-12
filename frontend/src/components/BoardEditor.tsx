import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, PieceSymbol } from 'chess.js';
import styles from './BoardEditor.module.css';

interface BoardEditorProps {
  onPositionChange: (fen: string) => void;
}

type Piece = {
  type: PieceSymbol;
  color: 'w' | 'b';
};

const PIECES: Piece[] = [
  { type: 'k', color: 'w' },
  { type: 'q', color: 'w' },
  { type: 'r', color: 'w' },
  { type: 'b', color: 'w' },
  { type: 'n', color: 'w' },
  { type: 'p', color: 'w' },
  { type: 'k', color: 'b' },
  { type: 'q', color: 'b' },
  { type: 'r', color: 'b' },
  { type: 'b', color: 'b' },
  { type: 'n', color: 'b' },
  { type: 'p', color: 'b' },
];

export const BoardEditor: React.FC<BoardEditorProps> = ({ onPositionChange }) => {
  const [position, setPosition] = useState<Record<string, string>>({});
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  // Track drag state for delete-on-drag-off-board functionality
  const [lastDropWasSuccessful, setLastDropWasSuccessful] = useState(false);
  const [dragSourceSquare, setDragSourceSquare] = useState<Square | null>(null);
  // Track mouse position for custom cursor
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);

  // Convert internal position to FEN
  const positionToFEN = (pos: Record<string, string>): string => {
    try {
      const game = new Chess();
      game.clear(); // Remove all pieces

      // Place pieces from our position
      Object.entries(pos).forEach(([square, piece]) => {
        const color = piece[0] === 'w' ? 'w' : 'b';
        // piece[1] is now uppercase (e.g., 'K', 'P'), convert to lowercase for chess.js
        const type = piece[1].toLowerCase() as PieceSymbol;
        game.put({ type, color }, square as Square);
      });

      return game.fen();
    } catch (error) {
      console.error('Failed to generate FEN:', error);
      return new Chess().fen(); // Return starting position as fallback
    }
  };

  // Handle piece placement on board
  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    // If dragging from palette (selectedPiece is set), place it
    if (selectedPiece) {
      const newPosition = { ...position };
      // Convert to uppercase format for react-chessboard: 'wK', 'bP', etc.
      const formattedPiece = `${selectedPiece[0]}${selectedPiece[1].toUpperCase()}`;
      newPosition[targetSquare] = formattedPiece;
      setPosition(newPosition);
      onPositionChange(positionToFEN(newPosition));
      setLastDropWasSuccessful(true);
      // Keep piece selected so user can place multiple pieces
      return true;
    }

    // If dragging from board to board, move the piece
    if (position[sourceSquare]) {
      const newPosition = { ...position };
      newPosition[targetSquare] = newPosition[sourceSquare];
      delete newPosition[sourceSquare];
      setPosition(newPosition);
      onPositionChange(positionToFEN(newPosition));
      setLastDropWasSuccessful(true);
      return true;
    }

    return false;
  };

  // Handle piece drag beginning - track source square
  const onPieceDragBegin = (piece: string, sourceSquare: Square): void => {
    setDragSourceSquare(sourceSquare);
    setLastDropWasSuccessful(false);
  };

  // Handle piece drag ending - delete if dropped off board
  const onPieceDragEnd = (piece: string, sourceSquare: Square): void => {
    // If the piece wasn't successfully dropped on the board, delete it
    if (!lastDropWasSuccessful && position[sourceSquare]) {
      const newPosition = { ...position };
      delete newPosition[sourceSquare];
      setPosition(newPosition);
      onPositionChange(positionToFEN(newPosition));
    }
    setDragSourceSquare(null);
  };

  // Handle square click (for placing pieces from palette)
  const onSquareClick = (square: Square) => {
    if (selectedPiece) {
      // If square has a piece, don't place - just deselect so user can remove pieces
      if (position[square]) {
        setSelectedPiece(null);
        return;
      }
      // Place selected piece on empty square (keeps selection active for multiple placements)
      const newPosition = { ...position };
      // Convert to uppercase format for react-chessboard: 'wK', 'bP', etc.
      const formattedPiece = `${selectedPiece[0]}${selectedPiece[1].toUpperCase()}`;
      newPosition[square] = formattedPiece;
      setPosition(newPosition);
      onPositionChange(positionToFEN(newPosition));
      // Keep piece selected so user can place multiple pieces
    } else if (position[square]) {
      // Remove piece from square (when no piece is selected)
      const newPosition = { ...position };
      delete newPosition[square];
      setPosition(newPosition);
      onPositionChange(positionToFEN(newPosition));
    }
  };

  // Clear all pieces
  const handleClearBoard = () => {
    setPosition({});
    onPositionChange(positionToFEN({}));
  };

  // Set to starting position
  const handleStartingPosition = () => {
    const startingGame = new Chess();
    const startingPos: Record<string, string> = {};

    // Parse starting position
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = String.fromCharCode(97 + col) + (8 - row) as Square;
        const piece = startingGame.get(square);
        if (piece) {
          // Use uppercase format for react-chessboard: 'wK', 'bP', etc.
          startingPos[square] = `${piece.color}${piece.type.toUpperCase()}`;
        }
      }
    }

    setPosition(startingPos);
    onPositionChange(startingGame.fen());
  };

  // Get piece name for display
  const getPieceName = (piece: Piece): string => {
    const names: Record<string, string> = {
      k: 'King',
      q: 'Queen',
      r: 'Rook',
      b: 'Bishop',
      n: 'Knight',
      p: 'Pawn',
    };
    const color = piece.color === 'w' ? 'White' : 'Black';
    return `${color} ${names[piece.type]}`;
  };

  // Get local piece SVG path
  const getPiecePath = (piece: Piece): string => {
    return `/pieces/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`;
  };

  // Handle mouse movement for custom cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedPiece) {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseEnter = () => {
    if (selectedPiece) {
      setShowCursor(true);
    }
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
  };

  return (
    <div className={styles.container}>
      {/* Piece Palette */}
      <div className={styles.palette}>
        <div className={styles.paletteHeader}>Piece Palette</div>

        {/* Selected Piece Indicator */}
        {selectedPiece ? (
          <div className={styles.selectionIndicator}>
            <img
              src={getPiecePath(PIECES.find(p => `${p.color}${p.type}` === selectedPiece)!)}
              alt="Selected piece"
              className={styles.selectedPieceIcon}
            />
            <div className={styles.selectionText}>
              <strong>{getPieceName(PIECES.find(p => `${p.color}${p.type}` === selectedPiece)!)}</strong>
              <span>Click squares to place multiple</span>
            </div>
          </div>
        ) : (
          <div className={styles.paletteInfo}>
            Click a piece to select it
          </div>
        )}

        <div className={styles.pieceSection}>
          <div className={styles.sectionLabel}>White Pieces</div>
          <div className={styles.pieceGrid}>
            {PIECES.filter(p => p.color === 'w').map((piece, idx) => {
              const pieceId = `${piece.color}${piece.type}`;
              return (
                <button
                  key={idx}
                  className={`${styles.pieceButton} ${selectedPiece === pieceId ? styles.selected : ''}`}
                  onClick={() => setSelectedPiece(selectedPiece === pieceId ? null : pieceId)}
                  title={getPieceName(piece)}
                >
                  <img
                    src={getPiecePath(piece)}
                    alt={getPieceName(piece)}
                    className={styles.pieceImage}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.pieceSection}>
          <div className={styles.sectionLabel}>Black Pieces</div>
          <div className={styles.pieceGrid}>
            {PIECES.filter(p => p.color === 'b').map((piece, idx) => {
              const pieceId = `${piece.color}${piece.type}`;
              return (
                <button
                  key={idx}
                  className={`${styles.pieceButton} ${selectedPiece === pieceId ? styles.selected : ''}`}
                  onClick={() => setSelectedPiece(selectedPiece === pieceId ? null : pieceId)}
                  title={getPieceName(piece)}
                >
                  <img
                    src={getPiecePath(piece)}
                    alt={getPieceName(piece)}
                    className={styles.pieceImage}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {selectedPiece && (
          <button
            className={styles.cancelButton}
            onClick={() => setSelectedPiece(null)}
          >
            Cancel Selection
          </button>
        )}
      </div>

      {/* Board Editor */}
      <div className={styles.boardSection}>
        <div
          className={`${styles.boardWrapper} ${selectedPiece ? styles.withSelectedPiece : ''}`}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Chessboard
            position={position}
            onPieceDrop={onPieceDrop}
            onPieceDragBegin={onPieceDragBegin}
            onPieceDragEnd={onPieceDragEnd}
            onSquareClick={onSquareClick}
            boardWidth={400}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            customLightSquareStyle={{
              backgroundColor: 'var(--board-light)'
            }}
            customDarkSquareStyle={{
              backgroundColor: 'var(--board-dark)'
            }}
          />

          {/* Custom cursor showing selected piece */}
          {selectedPiece && showCursor && (
            <div
              className={styles.customCursor}
              style={{
                left: `${cursorPosition.x}px`,
                top: `${cursorPosition.y}px`
              }}
            >
              <img
                src={getPiecePath(PIECES.find(p => `${p.color}${p.type}` === selectedPiece)!)}
                alt="Selected piece cursor"
              />
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <button
            className={styles.controlButton}
            onClick={handleClearBoard}
          >
            🗑️ Clear Board
          </button>
          <button
            className={styles.controlButton}
            onClick={handleStartingPosition}
          >
            ♟️ Starting Position
          </button>
        </div>

        <div className={styles.instructions}>
          <strong>How to use:</strong>
          <ul>
            <li>Click a piece to select, then click empty squares to place multiple</li>
            <li>Click the same piece again to deselect</li>
            <li>Drag pieces on the board to move them</li>
            <li>Drag a piece off the board to delete it</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
