import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { debugLog, debugError } from '../utils/debug';
import '../styles/chessboard-themes.css';

interface ChessBoardProps {
  position: string;
  game: Chess;
  playerColor: 'white' | 'black' | null;
  isMyTurn: () => boolean;
  onMove: (move: string, fen: string, moveObj?: { from: string; to: string; promotion?: string }) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  position,
  game,
  playerColor,
  isMyTurn,
  onMove
}) => {
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(playerColor || 'white');
  const [localPosition, setLocalPosition] = useState<string>(position);
  
  // Create Chess instance from local position for consistent rule checking
  const rulesGame = useMemo(() => new Chess(localPosition), [localPosition]);

  // Update board orientation when playerColor changes
  useEffect(() => {
    if (playerColor) {
      setBoardOrientation(playerColor);
    }
  }, [playerColor]);

  // Track position changes and sync local position
  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  // Handle piece drop with useCallback
  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    // Check if it's the player's turn
    if (!isMyTurn()) {
      return false;
    }

    // Use rulesGame based on localPosition for consistent legality checks
    const gameCopy = new Chess(localPosition);

    // Try to validate the move
    let move;
    try {
      move = gameCopy.move({ 
        from: sourceSquare, 
        to: targetSquare, 
        promotion: 'q' // Always promote to queen for simplicity
      });
    } catch (error) {
      return false;
    }

    if (move === null) {
      return false;
    }

    // Move is legal! Send to server - this will update the position via props
    const newFen = gameCopy.fen();
    
    // Update local position immediately for responsive UI
    setLocalPosition(newFen);
    
    // Don't modify the original game object here - let the parent handle state updates
    // The onMove callback will update the game state and re-render with new position
    onMove(move.san, newFen, {
      from: move.from,
      to: move.to,
      promotion: move.promotion
    });
    
    return true;
  }, [localPosition, playerColor, isMyTurn, onMove]);

  // Determine if a piece can be dragged
  const isDraggablePiece = useCallback(({ piece, sourceSquare }: any): boolean => {
    // Don't allow dragging if no playerColor set
    if (!playerColor) {
      return false;
    }

    // Don't allow dragging pieces of the wrong color
    const pieceColor = piece.startsWith('w') ? 'white' : 'black';
    const isMyPiece = playerColor === pieceColor;
    
    if (!isMyPiece) {
      return false;
    }

    // Check if it's the player's turn
    const myTurn = isMyTurn();
    
    if (!myTurn) {
      return false;
    }

    // Check if piece has legal moves
    const moves = rulesGame.moves({ square: sourceSquare, verbose: true });
    
    if (moves.length === 0) {
      return false;
    }
    return true;
  }, [rulesGame, playerColor, isMyTurn]);

  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };


  return (
    <div style={{ textAlign: 'center' }}>
      <div className="chess-board-container" style={{ width: '466px', height: '466px' }}>        
        <Chessboard
          position={localPosition}
          onPieceDrop={onDrop}
          boardOrientation={boardOrientation}
          isDraggablePiece={isDraggablePiece}
          boardWidth={450}
          arePiecesDraggable={true}
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
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={flipBoard}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            cursor: 'pointer'
          }}
        >
          Flip Board
        </button>
      </div>
    </div>
  );
};