import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';

// Minimal test component to verify react-chessboard is working
export const TestChessBoard: React.FC = () => {
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  console.log('🎨 TEST: Rendering TestChessBoard with position:', position);

  // Try multiple configurations to see what works
  const testConfigs = [
    // Config 1: Minimal
    { 
      title: "Minimal (no drag)",
      props: {
        position,
        boardWidth: 300
      }
    },
    // Config 2: With drag enabled but no handlers
    {
      title: "Drag enabled, no handlers", 
      props: {
        position,
        boardWidth: 300,
        arePiecesDraggable: true
      }
    },
    // Config 3: With handlers
    {
      title: "With handlers",
      props: {
        position,
        boardWidth: 300,
        arePiecesDraggable: true,
        onPieceDrop: (sourceSquare: string, targetSquare: string) => {
          console.log('🎯 TEST: Drop event from', sourceSquare, 'to', targetSquare);
          return false; // Don't allow moves, just test event
        },
        isDraggablePiece: ({ piece, sourceSquare }: any) => {
          console.log('🤏 TEST: isDraggable check for', piece, 'on', sourceSquare);
          return true;
        }
      }
    }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', margin: '10px' }}>
      <h3>React-Chessboard Test</h3>
      {testConfigs.map((config, index) => (
        <div key={index} style={{ marginBottom: '20px' }}>
          <h4>{config.title}</h4>
          <div style={{ width: '300px', margin: '0 auto', border: '1px solid white' }}>
            <Chessboard {...config.props} />
          </div>
        </div>
      ))}
      <button 
        onClick={() => {
          console.log('🔄 TEST: Reset button clicked');
          setPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
        }}
        style={{ marginTop: '10px', padding: '10px', backgroundColor: '#6750a4', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Change Position (e2-e4)
      </button>
    </div>
  );
};