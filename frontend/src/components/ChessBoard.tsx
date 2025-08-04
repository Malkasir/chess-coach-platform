import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';

interface ChessBoardProps {
  position: string;
  game: Chess;
  playerColor: 'white' | 'black' | null;
  isMyTurn: () => boolean;
  onMove: (move: string, fen: string) => void;
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

  // Update board orientation when playerColor changes
  useEffect(() => {
    if (playerColor) {
      setBoardOrientation(playerColor);
      console.log('🔄 Set board orientation to:', playerColor);
    }
  }, [playerColor]);

  // Track position changes and sync local position
  useEffect(() => {
    console.log('🔄 Position prop changed to:', position);
    setLocalPosition(position);
  }, [position]);

  // Handle piece drop with useCallback
  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    console.log('🎯 Piece drop:', { from: sourceSquare, to: targetSquare, playerColor, turn: game.turn() });

    // Check if it's the player's turn
    if (!isMyTurn()) {
      console.log('❌ Not your turn');
      return false;
    }

    // Create a copy of the game to test the move without affecting the original
    const gameCopy = new Chess(game.fen());

    // Try to validate the move
    let move;
    try {
      move = gameCopy.move({ 
        from: sourceSquare, 
        to: targetSquare, 
        promotion: 'q' // Always promote to queen for simplicity
      });
    } catch (error) {
      console.log('❌ Chess.js threw error for move:', { from: sourceSquare, to: targetSquare }, (error as Error).message);
      return false;
    }

    if (move === null) {
      console.log('❌ Illegal move attempted');
      return false;
    }

    // Move is legal! Send to server - this will update the position via props
    const newFen = gameCopy.fen();
    console.log('✅ Legal move validated:', move.san, 'New FEN:', newFen);
    
    // Update local position immediately for responsive UI
    setLocalPosition(newFen);
    
    // Don't modify the original game object here - let the parent handle state updates
    // The onMove callback will update the game state and re-render with new position
    onMove(move.san, newFen);
    
    return true;
  }, [game, playerColor, isMyTurn, onMove]);

  // Determine if a piece can be dragged
  const isDraggablePiece = useCallback(({ piece, sourceSquare }: any): boolean => {
    console.log('🤏 isDraggablePiece called:', { 
      piece, 
      sourceSquare, 
      playerColor, 
      gameTurn: game.turn(), 
      isMyTurn: isMyTurn(),
      gameStatus: game.isGameOver() ? 'over' : 'active'
    });
    
    // Don't allow dragging if no playerColor set
    if (!playerColor) {
      console.log('❌ No playerColor available');
      return false;
    }

    // Don't allow dragging pieces of the wrong color
    const pieceColor = piece.startsWith('w') ? 'white' : 'black';
    const isMyPiece = playerColor === pieceColor;
    console.log('🔍 Piece color check:', { pieceColor, playerColor, isMyPiece });
    
    if (!isMyPiece) {
      console.log('❌ Wrong piece color - player is', playerColor, 'piece is', pieceColor);
      return false;
    }

    // Check if it's the player's turn
    const myTurn = isMyTurn();
    console.log('🔍 Turn check:', { myTurn, gameTurn: game.turn() });
    
    if (!myTurn) {
      console.log('❌ Not your turn');
      return false;
    }

    // Check if piece has legal moves
    const moves = game.moves({ square: sourceSquare, verbose: true });
    console.log('🔍 Legal moves for', piece, 'on', sourceSquare, ':', moves.length, 'moves');
    
    if (moves.length === 0) {
      console.log('❌ Piece has no legal moves');
      return false;
    }

    console.log('✅ Piece can be dragged -', moves.length, 'legal moves');
    return true;
  }, [game, playerColor, isMyTurn]);

  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  console.log('🎨 ChessBoard render - position prop:', position, 'localPosition:', localPosition, 'playerColor:', playerColor, 'game FEN:', game.fen());
  console.log('🎨 Props check:', { 
    hasOnDrop: typeof onDrop === 'function',
    hasIsDraggablePiece: typeof isDraggablePiece === 'function',
    hasIsMyTurn: typeof isMyTurn === 'function'
  });

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '450px', 
        margin: '0 auto',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        
        <Chessboard
          position={localPosition}
          onPieceDrop={onDrop}
          boardOrientation={boardOrientation}
          isDraggablePiece={isDraggablePiece}
          boardWidth={450}
          arePiecesDraggable={true}
          customBoardStyle={{
            borderRadius: '12px'
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