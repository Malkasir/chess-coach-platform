import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';

// Alternative chess board using chessboardjsx
export const AlternativeChessBoard: React.FC = () => {
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    console.log('🎯 ALTERNATIVE: Piece drop from', sourceSquare, 'to', targetSquare);
    
    // Test move: e2-e4
    if (sourceSquare === 'e2' && targetSquare === 'e4') {
      setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
      return true;
    }
    
    // For any other move, just log it
    console.log('✅ ALTERNATIVE: Move allowed');
    return true;
  };

  console.log('🎨 ALTERNATIVE: Rendering chessboardjsx with position:', position);

  return (
    <div style={{ padding: '20px', backgroundColor: 'rgba(0,255,0,0.1)', borderRadius: '10px', margin: '10px' }}>
      <h3>Alternative: ChessboardJSX</h3>
      <div style={{ width: '400px', margin: '0 auto' }}>
        <Chessboard
          position={position}
          onPieceDrop={onPieceDrop}
          arePiecesDraggable={true}
          width={400}
        />
      </div>
      <button 
        onClick={() => {
          console.log('🔄 ALTERNATIVE: Reset button clicked');
          setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        }}
        style={{ marginTop: '10px', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Reset Board
      </button>
    </div>
  );
};