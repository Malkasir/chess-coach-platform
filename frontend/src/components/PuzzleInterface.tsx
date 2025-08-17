import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Puzzle } from '../services/puzzle-service';
import styles from '../styles/shared.module.css';
import { debugLog, debugError } from '../utils/debug';

interface PuzzleInterfaceProps {
  puzzle: Puzzle;
  onExit: () => void;
  onNextPuzzle: () => void;
}

export const PuzzleInterface: React.FC<PuzzleInterfaceProps> = ({
  puzzle,
  onExit,
  onNextPuzzle
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [gamePosition, setGamePosition] = useState<string>('');
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [puzzleState, setPuzzleState] = useState<'solving' | 'solved' | 'failed'>('solving');
  const [hint, setHint] = useState<string>('');
  const [showSolution, setShowSolution] = useState(false);

  // Parse the solution moves
  const solutionMoves = puzzle.solution.split(' ').filter(move => move.trim() !== '');

  // Initialize puzzle
  useEffect(() => {
    const chess = new Chess();
    try {
      chess.load(puzzle.fen);
      setGame(chess);
      setGamePosition(chess.fen());
      setMoves([]);
      setCurrentMoveIndex(0);
      setPuzzleState('solving');
      setHint('');
      setShowSolution(false);
      debugLog('Puzzle initialized:', { fen: puzzle.fen, solution: solutionMoves });
    } catch (error) {
      debugError('Failed to load puzzle FEN:', error);
    }
  }, [puzzle]);

  const makeMove = useCallback((from: string, to: string, promotion?: string) => {
    try {
      const gameCopy = new Chess(game.fen());
      
      // Try to make the move
      const move = gameCopy.move({
        from,
        to,
        promotion: promotion || 'q'
      });

      if (move) {
        setGame(gameCopy);
        setGamePosition(gameCopy.fen());
        
        const newMoves = [...moves, move.san];
        setMoves(newMoves);
        
        // Check if this move matches the solution
        checkMove(move.san, newMoves.length - 1);
        
        debugLog('Move made:', { move: move.san, totalMoves: newMoves.length });
        return true;
      }
    } catch (error) {
      debugError('Invalid move:', error);
    }
    return false;
  }, [game, moves]);

  const checkMove = (moveSan: string, moveIndex: number) => {
    if (moveIndex >= solutionMoves.length) {
      setPuzzleState('failed');
      setHint('Too many moves! Try again.');
      return;
    }

    const expectedMove = solutionMoves[moveIndex];
    
    if (moveSan === expectedMove) {
      // Correct move
      setCurrentMoveIndex(moveIndex + 1);
      
      if (moveIndex + 1 >= solutionMoves.length) {
        // Puzzle solved!
        setPuzzleState('solved');
        setHint('🎉 Congratulations! Puzzle solved!');
      } else {
        setHint(`✓ Correct! Continue with the solution...`);
      }
    } else {
      // Wrong move
      setPuzzleState('failed');
      setHint(`❌ Wrong move! Expected: ${expectedMove}`);
    }
  };

  const resetPuzzle = () => {
    const chess = new Chess();
    chess.load(puzzle.fen);
    setGame(chess);
    setGamePosition(chess.fen());
    setMoves([]);
    setCurrentMoveIndex(0);
    setPuzzleState('solving');
    setHint('');
    setShowSolution(false);
  };

  const showHint = () => {
    if (currentMoveIndex < solutionMoves.length) {
      const nextMove = solutionMoves[currentMoveIndex];
      setHint(`💡 Hint: Try ${nextMove}`);
    }
  };

  const toggleSolution = () => {
    setShowSolution(!showSolution);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    // Only allow moves if puzzle is still being solved
    if (puzzleState !== 'solving') {
      return false;
    }

    // Handle promotion
    const promotion = piece[1]?.toLowerCase() === 'p' && 
                    (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined;

    return makeMove(sourceSquare, targetSquare, promotion);
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Beginner';
    if (difficulty <= 4) return 'Easy';
    if (difficulty <= 6) return 'Intermediate';
    if (difficulty <= 8) return 'Advanced';
    return 'Expert';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return '#4caf50';
    if (difficulty <= 4) return '#8bc34a';
    if (difficulty <= 6) return '#ff9800';
    if (difficulty <= 8) return '#f44336';
    return '#9c27b0';
  };

  return (
    <div className={styles.app}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem',
        marginBottom: '1.5rem',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'white' }}>🧩 Chess Puzzle #{puzzle.id}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <span style={{ 
                backgroundColor: getDifficultyColor(puzzle.difficulty),
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {getDifficultyLabel(puzzle.difficulty)} (Level {puzzle.difficulty})
              </span>
              <span style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.9rem'
              }}>
                {puzzle.theme}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' }}>
                {puzzle.moveCount} move{puzzle.moveCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button 
            onClick={onExit}
            className={styles.secondaryButton}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          >
            ← Back to Lobby
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Chess Board */}
        <div style={{ flex: '0 0 500px' }}>
          <Chessboard
            position={gamePosition}
            onPieceDrop={onDrop}
            boardWidth={500}
            arePremovesAllowed={false}
            isDraggablePiece={({ piece }) => {
              // Only allow dragging pieces for the side to move when puzzle is being solved
              if (puzzleState !== 'solving') return false;
              const turn = game.turn();
              return piece[0] === turn;
            }}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>

        {/* Puzzle Info Panel */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {/* Description */}
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Objective</h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0, 
              lineHeight: '1.5',
              fontSize: '1.1rem'
            }}>
              {puzzle.description}
            </p>
          </div>

          {/* Status & Hint */}
          {hint && (
            <div style={{ 
              backgroundColor: puzzleState === 'solved' ? 'rgba(76, 175, 80, 0.1)' : 
                             puzzleState === 'failed' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)',
              border: `1px solid ${puzzleState === 'solved' ? 'rgba(76, 175, 80, 0.3)' : 
                                  puzzleState === 'failed' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`,
              color: puzzleState === 'solved' ? '#4caf50' : 
                     puzzleState === 'failed' ? '#f44336' : '#2196f3',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '1.1rem',
              textAlign: 'center'
            }}>
              {hint}
            </div>
          )}

          {/* Progress */}
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>Progress</h4>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Move {currentMoveIndex + 1} of {solutionMoves.length}
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              height: '8px',
              borderRadius: '4px',
              marginTop: '0.5rem',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                height: '100%',
                width: `${(currentMoveIndex / solutionMoves.length) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Move History */}
          {moves.length > 0 && (
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>Your Moves</h4>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {moves.join(', ')}
              </div>
            </div>
          )}

          {/* Solution (if shown) */}
          {showSolution && (
            <div style={{ 
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              color: '#ffc107',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Solution</h4>
              <div>{solutionMoves.join(', ')}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              onClick={resetPuzzle}
              className={styles.secondaryButton}
            >
              🔄 Reset
            </button>
            
            <button 
              onClick={showHint}
              className={styles.secondaryButton}
              disabled={puzzleState !== 'solving'}
            >
              💡 Hint
            </button>
            
            <button 
              onClick={toggleSolution}
              className={styles.secondaryButton}
            >
              {showSolution ? '🙈 Hide Solution' : '👁️ Show Solution'}
            </button>
            
            {puzzleState === 'solved' && (
              <button 
                onClick={onNextPuzzle}
                className={styles.primaryButton}
                style={{ background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)' }}
              >
                ✨ Next Puzzle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};