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
      debugLog('🔄 Set board orientation to:', playerColor);
    }
  }, [playerColor]);

  // Track position changes and sync local position
  useEffect(() => {
    debugLog('🔄 Position prop changed to:', position);
    setLocalPosition(position);
  }, [position]);

  // Handle piece drop with useCallback
  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    debugLog('🎯 Piece drop:', { from: sourceSquare, to: targetSquare, playerColor, turn: rulesGame.turn() });

    // Check if it's the player's turn
    if (!isMyTurn()) {
      debugLog('❌ Not your turn');
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
      debugLog('❌ Chess.js threw error for move:', { from: sourceSquare, to: targetSquare }, (error as Error).message);
      return false;
    }

    if (move === null) {
      debugLog('❌ Illegal move attempted');
      return false;
    }

    // Move is legal! Send to server - this will update the position via props
    const newFen = gameCopy.fen();
    debugLog('✅ Legal move validated:', move.san, 'New FEN:', newFen);
    
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
    debugLog('🤏 isDraggablePiece called:', { 
      piece, 
      sourceSquare, 
      playerColor, 
      gameTurn: rulesGame.turn(), 
      isMyTurn: isMyTurn(),
      gameStatus: rulesGame.isGameOver() ? 'over' : 'active'
    });
    
    // Don't allow dragging if no playerColor set
    if (!playerColor) {
      debugLog('❌ No playerColor available');
      return false;
    }

    // Don't allow dragging pieces of the wrong color
    const pieceColor = piece.startsWith('w') ? 'white' : 'black';
    const isMyPiece = playerColor === pieceColor;
    debugLog('🔍 Piece color check:', { pieceColor, playerColor, isMyPiece });
    
    if (!isMyPiece) {
      debugLog('❌ Wrong piece color - player is', playerColor, 'piece is', pieceColor);
      return false;
    }

    // Check if it's the player's turn
    const myTurn = isMyTurn();
    debugLog('🔍 Turn check:', { myTurn, gameTurn: rulesGame.turn() });
    
    if (!myTurn) {
      debugLog('❌ Not your turn');
      return false;
    }

    // Check if piece has legal moves
    const moves = rulesGame.moves({ square: sourceSquare, verbose: true });
    debugLog('🔍 Legal moves for', piece, 'on', sourceSquare, ':', moves.length, 'moves');
    
    if (moves.length === 0) {
      debugLog('❌ Piece has no legal moves');
      return false;
    }

    debugLog('✅ Piece can be dragged -', moves.length, 'legal moves');
    return true;
  }, [rulesGame, playerColor, isMyTurn]);

  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  debugLog('🎨 ChessBoard render - position prop:', position, 'localPosition:', localPosition, 'playerColor:', playerColor, 'rulesGame FEN:', rulesGame.fen());
  debugLog('🎨 Props check:', { 
    hasOnDrop: typeof onDrop === 'function',
    hasIsDraggablePiece: typeof isDraggablePiece === 'function',
    hasIsMyTurn: typeof isMyTurn === 'function'
  });

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