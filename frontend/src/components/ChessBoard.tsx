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
  isTimeExpired?: boolean; // Prevents moves when player's time has run out
  reviewMode?: boolean; // NEW: Disable moves when reviewing history
  allowBothSides?: boolean; // NEW: Allow playing both white and black (for training mode)
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  position,
  game,
  playerColor,
  isMyTurn,
  onMove,
  isTimeExpired = false,
  reviewMode = false,
  allowBothSides = false
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
  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
    // Prevent moves in review mode
    if (reviewMode) {
      debugLog('📖 Move blocked: Currently reviewing game history');
      return false;
    }

    // Check if time has expired
    if (isTimeExpired) {
      debugLog('⏰ Move blocked: Time expired');
      return false;
    }

    // Check if it's the player's turn (skip in training mode when playing both sides)
    if (!allowBothSides && !isMyTurn()) {
      return false;
    }

    // Use rulesGame based on localPosition for consistent legality checks
    const gameCopy = new Chess(localPosition);

    // Check if this is a pawn promotion move
    const movingPiece = gameCopy.get(sourceSquare);
    const isPawn = movingPiece && movingPiece.type === 'p';
    const isPromotionRank = (movingPiece?.color === 'w' && targetSquare[1] === '8') ||
                            (movingPiece?.color === 'b' && targetSquare[1] === '1');

    if (isPawn && isPromotionRank) {
      // Extract promotion piece from the piece parameter (e.g., 'wQ' -> 'q')
      const promotionPiece = piece.toLowerCase().charAt(1) as 'q' | 'r' | 'b' | 'n';

      // Try the move with the selected promotion piece
      let move;
      try {
        move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotionPiece
        });
      } catch (error) {
        return false;
      }

      if (move === null) {
        return false;
      }

      // Move is legal! Send to server
      const newFen = gameCopy.fen();
      setLocalPosition(newFen);

      onMove(move.san, newFen, {
        from: move.from,
        to: move.to,
        promotion: move.promotion
      });

      return true;
    }

    // Try to validate the move (non-promotion)
    let move;
    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare
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
  }, [localPosition, playerColor, isMyTurn, onMove, isTimeExpired, reviewMode, allowBothSides]);

  // Determine if a piece can be dragged
  const isDraggablePiece = useCallback(({ piece, sourceSquare }: any): boolean => {
    // Can't drag in review mode
    if (reviewMode) {
      return false;
    }

    // Don't allow dragging if time has expired
    if (isTimeExpired) {
      return false;
    }

    // In training mode (allowBothSides), skip color and turn checks
    if (!allowBothSides) {
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
    }

    // Check if piece has legal moves
    const moves = rulesGame.moves({ square: sourceSquare, verbose: true });
    
    if (moves.length === 0) {
      return false;
    }
    return true;
  }, [rulesGame, playerColor, isMyTurn, isTimeExpired, reviewMode, allowBothSides]);

  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  // Check if a move would result in pawn promotion
  const onPromotionCheck = useCallback((sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
    const gameCopy = new Chess(localPosition);
    const movingPiece = gameCopy.get(sourceSquare);

    // Check if this is a pawn moving to the promotion rank
    const isPawn = movingPiece && movingPiece.type === 'p';
    const isPromotionRank = (movingPiece?.color === 'w' && targetSquare[1] === '8') ||
                            (movingPiece?.color === 'b' && targetSquare[1] === '1');

    return !!(isPawn && isPromotionRank);
  }, [localPosition]);


  return (
    <div style={{ textAlign: 'center' }}>
      <div className="chess-board-container" style={{ width: '466px', height: '466px' }}>
        <Chessboard
          position={localPosition}
          onPieceDrop={onDrop}
          onPromotionCheck={onPromotionCheck}
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
          promotionToSquare={null}
          showPromotionDialog={true}
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