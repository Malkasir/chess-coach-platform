import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Puzzle } from '../services/puzzle-service';
import styles from '../styles/shared.module.css';
import { debugLog, debugError } from '../utils/debug';

interface PuzzleCreatorProps {
  isVisible: boolean;
  onClose: () => void;
  onPuzzleCreated: (puzzle: Puzzle) => void;
}

export const PuzzleCreator: React.FC<PuzzleCreatorProps> = ({
  isVisible,
  onClose,
  onPuzzleCreated
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [gamePosition, setGamePosition] = useState<string>(new Chess().fen());
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  
  // Form state
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState(5);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [recordingMode, setRecordingMode] = useState<'setup' | 'solution'>('setup');
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Available themes
  const themes = [
    'Fork', 'Pin', 'Checkmate', 'Discovered Attack', 'Smothered Mate',
    'Endgame', 'Combination', 'Opening', 'Middlegame', 'Tactics',
    'Strategy', 'Sacrifice', 'Deflection', 'Decoy', 'X-Ray',
    'Zwischenzug', 'Zugzwang', 'Breakthrough'
  ];

  const resetPuzzle = () => {
    const newGame = new Chess();
    setGame(newGame);
    setGamePosition(newGame.fen());
    setMoves([]);
    setCurrentMoveIndex(0);
    setSolutionMoves([]);
    setRecordingMode('setup');
    setDescription('');
    setTheme('');
    setDifficulty(5);
    setError('');
  };

  const startSolutionRecording = () => {
    if (moves.length === 0) {
      setError('Please set up the position first by making moves from the starting position.');
      return;
    }
    
    // Save the current position as the puzzle position
    setRecordingMode('solution');
    setSolutionMoves([]);
    setError('');
    debugLog('Starting solution recording from position:', game.fen());
  };

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
        
        if (recordingMode === 'setup') {
          const newMoves = [...moves, move.san];
          setMoves(newMoves);
          setCurrentMoveIndex(newMoves.length);
        } else if (recordingMode === 'solution') {
          const newSolutionMoves = [...solutionMoves, move.san];
          setSolutionMoves(newSolutionMoves);
        }
        
        debugLog('Move made:', { move: move.san, mode: recordingMode });
        return true;
      }
    } catch (error) {
      debugError('Invalid move:', error);
    }
    return false;
  }, [game, moves, solutionMoves, recordingMode]);

  const undoLastMove = () => {
    if (recordingMode === 'setup' && moves.length > 0) {
      // Undo setup move
      const newMoves = moves.slice(0, -1);
      setMoves(newMoves);
      
      // Rebuild game state
      const newGame = new Chess();
      for (const move of newMoves) {
        newGame.move(move);
      }
      setGame(newGame);
      setGamePosition(newGame.fen());
      setCurrentMoveIndex(newMoves.length);
    } else if (recordingMode === 'solution' && solutionMoves.length > 0) {
      // Undo solution move
      const newSolutionMoves = solutionMoves.slice(0, -1);
      setSolutionMoves(newSolutionMoves);
      
      // Rebuild game state from setup position + remaining solution moves
      const newGame = new Chess();
      for (const move of moves) {
        newGame.move(move);
      }
      for (const move of newSolutionMoves) {
        newGame.move(move);
      }
      setGame(newGame);
      setGamePosition(newGame.fen());
    }
  };

  const savePuzzle = async () => {
    if (!description.trim()) {
      setError('Please enter a description for the puzzle.');
      return;
    }

    if (!theme.trim()) {
      setError('Please select or enter a theme for the puzzle.');
      return;
    }

    if (solutionMoves.length === 0) {
      setError('Please record the solution moves.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Get the position after setup moves (this becomes the puzzle starting position)
      const puzzleGame = new Chess();
      for (const move of moves) {
        puzzleGame.move(move);
      }
      const puzzleFen = puzzleGame.fen();

      const puzzleData = {
        fen: puzzleFen,
        solution: solutionMoves.join(' '),
        description: description.trim(),
        theme: theme.trim(),
        difficulty: difficulty,
        moveCount: solutionMoves.length
      };

      debugLog('Creating puzzle:', puzzleData);

      // Import puzzle service dynamically
      const { getPuzzleService } = await import('../services/puzzle-service');
      const puzzleService = getPuzzleService();
      
      const createdPuzzle = await puzzleService.createPuzzle(puzzleData);
      
      debugLog('Puzzle created successfully:', createdPuzzle);
      onPuzzleCreated(createdPuzzle);
      onClose();
      
    } catch (error) {
      debugError('Failed to create puzzle:', error);
      setError('Failed to create puzzle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
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

  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '1200px', maxHeight: '90vh' }}>
        <div className={styles.modalHeader}>
          <h2>🎯 Create Chess Puzzle</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Chess Board */}
          <div style={{ flex: '0 0 500px' }}>
            <Chessboard
              position={gamePosition}
              onPieceDrop={onDrop}
              boardWidth={500}
              arePremovesAllowed={false}
              isDraggablePiece={() => true}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            />
            
            {/* Board Controls */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button 
                onClick={undoLastMove}
                className={styles.secondaryButton}
                disabled={recordingMode === 'setup' ? moves.length === 0 : solutionMoves.length === 0}
              >
                ↶ Undo
              </button>
              <button 
                onClick={resetPuzzle}
                className={styles.secondaryButton}
              >
                🔄 Reset
              </button>
              {recordingMode === 'setup' && (
                <button 
                  onClick={startSolutionRecording}
                  className={styles.primaryButton}
                  disabled={moves.length === 0}
                >
                  ▶️ Record Solution
                </button>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            {/* Mode Indicator */}
            <div style={{ 
              backgroundColor: recordingMode === 'setup' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(76, 175, 80, 0.1)',
              border: `1px solid ${recordingMode === 'setup' ? 'rgba(33, 150, 243, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
              color: recordingMode === 'setup' ? '#2196f3' : '#4caf50',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <strong>
                {recordingMode === 'setup' ? '🏗️ Setup Mode' : '🎯 Solution Recording'}
              </strong>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {recordingMode === 'setup' 
                  ? 'Set up the puzzle position by making moves'
                  : 'Record the solution moves from the puzzle position'
                }
              </div>
            </div>

            {/* Move History */}
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>
                {recordingMode === 'setup' ? 'Setup Moves' : 'Solution Moves'}
              </h4>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', minHeight: '1.5rem' }}>
                {recordingMode === 'setup' 
                  ? (moves.length > 0 ? moves.join(', ') : 'No moves yet')
                  : (solutionMoves.length > 0 ? solutionMoves.join(', ') : 'No solution moves yet')
                }
              </div>
            </div>

            {/* Puzzle Details Form */}
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'white' }}>Puzzle Details</h4>
              
              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.5rem', display: 'block' }}>
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what the solver should find (e.g., 'White to move. Find the winning tactic.')"
                  className={styles.input}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* Theme */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.5rem', display: 'block' }}>
                  Theme *
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className={styles.select}
                  style={{ width: '100%' }}
                >
                  <option value="">Select a theme...</option>
                  {themes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.5rem', display: 'block' }}>
                  Difficulty: {difficulty} ({getDifficultyLabel(difficulty)})
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <span>1 (Beginner)</span>
                  <span>10 (Expert)</span>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{ 
                color: '#f44336', 
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                border: '1px solid rgba(244, 67, 54, 0.3)'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Cancel
          </button>
          <button 
            onClick={savePuzzle} 
            className={styles.primaryButton}
            disabled={saving || recordingMode === 'setup' || solutionMoves.length === 0}
            style={{ background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)' }}
          >
            {saving ? 'Creating...' : '✨ Create Puzzle'}
          </button>
        </div>
      </div>
    </div>
  );
};