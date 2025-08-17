import React, { useState, useEffect } from 'react';
import { Puzzle, getPuzzleService } from '../services/puzzle-service';
import styles from '../styles/shared.module.css';
import { debugLog, debugError } from '../utils/debug';

interface PuzzleSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onPuzzleSelect: (puzzle: Puzzle) => void;
}

export const PuzzleSelector: React.FC<PuzzleSelectorProps> = ({
  isVisible,
  onClose,
  onPuzzleSelect
}) => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | ''>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const puzzleService = getPuzzleService();

  // Load initial data when component becomes visible
  useEffect(() => {
    if (isVisible) {
      loadInitialData();
    }
  }, [isVisible]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [themesData, puzzlesData] = await Promise.all([
        puzzleService.getAllThemes(),
        puzzleService.getAllPuzzles()
      ]);
      
      setThemes(themesData);
      setPuzzles(puzzlesData);
      debugLog('Puzzle data loaded:', { themes: themesData.length, puzzles: puzzlesData.length });
    } catch (err) {
      debugError('Failed to load puzzle data:', err);
      setError('Failed to load puzzles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async () => {
    if (!selectedDifficulty && !selectedTheme) {
      // No filters, show all puzzles
      try {
        const allPuzzles = await puzzleService.getAllPuzzles();
        setPuzzles(allPuzzles);
      } catch (err) {
        debugError('Failed to load all puzzles:', err);
        setError('Failed to load puzzles.');
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const filters: { difficulty?: number; theme?: string } = {};
      
      if (selectedDifficulty) {
        filters.difficulty = Number(selectedDifficulty);
      }
      
      if (selectedTheme) {
        filters.theme = selectedTheme;
      }

      const filteredPuzzles = await puzzleService.searchPuzzles(filters);
      setPuzzles(filteredPuzzles);
      debugLog('Filtered puzzles:', filteredPuzzles.length);
    } catch (err) {
      debugError('Failed to filter puzzles:', err);
      setError('Failed to filter puzzles.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomPuzzle = async () => {
    setLoading(true);
    setError('');

    try {
      let puzzle: Puzzle;
      
      if (selectedDifficulty && selectedTheme) {
        // Try to get random puzzle with both filters
        const filteredPuzzles = await puzzleService.searchPuzzles({
          difficulty: Number(selectedDifficulty),
          theme: selectedTheme
        });
        
        if (filteredPuzzles.length === 0) {
          setError('No puzzles found with these criteria.');
          return;
        }
        
        puzzle = filteredPuzzles[Math.floor(Math.random() * filteredPuzzles.length)];
      } else if (selectedDifficulty) {
        puzzle = await puzzleService.getRandomPuzzleByDifficulty(Number(selectedDifficulty));
      } else if (selectedTheme) {
        puzzle = await puzzleService.getRandomPuzzleByTheme(selectedTheme);
      } else {
        puzzle = await puzzleService.getRandomPuzzle();
      }

      onPuzzleSelect(puzzle);
      onClose();
    } catch (err) {
      debugError('Failed to get random puzzle:', err);
      setError('Failed to get random puzzle.');
    } finally {
      setLoading(false);
    }
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

  // Apply filter changes when selections change
  useEffect(() => {
    if (isVisible) {
      handleFilterChange();
    }
  }, [selectedDifficulty, selectedTheme]);

  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
        <div className={styles.modalHeader}>
          <h2>🧩 Choose Chess Puzzle</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.9)', marginRight: '0.5rem' }}>
              Difficulty:
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value ? Number(e.target.value) : '')}
              className={styles.select}
            >
              <option value="">All Levels</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <option key={level} value={level}>
                  Level {level} ({getDifficultyLabel(level)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.9)', marginRight: '0.5rem' }}>
              Theme:
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className={styles.select}
            >
              <option value="">All Themes</option>
              {themes.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleRandomPuzzle}
            className={styles.primaryButton}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            🎲 Random Puzzle
          </button>
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

        {/* Loading state */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            padding: '2rem'
          }}>
            Loading puzzles...
          </div>
        )}

        {/* Puzzle list */}
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1rem'
        }}>
          {puzzles.map((puzzle) => (
            <div
              key={puzzle.id}
              className={styles.playerCard}
              onClick={() => {
                onPuzzleSelect(puzzle);
                onClose();
              }}
              style={{ 
                cursor: 'pointer',
                borderLeft: `4px solid ${getDifficultyColor(puzzle.difficulty)}`
              }}
            >
              <div className={styles.playerInfo}>
                <div className={styles.playerHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      backgroundColor: getDifficultyColor(puzzle.difficulty),
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      Level {puzzle.difficulty}
                    </span>
                    <span style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}>
                      {puzzle.theme}
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: '0.9rem',
                  marginTop: '0.5rem',
                  lineHeight: '1.4'
                }}>
                  {puzzle.description}
                </div>
                
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <span>Moves: {puzzle.moveCount}</span>
                  <span>ID: {puzzle.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No puzzles message */}
        {!loading && puzzles.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            padding: '2rem'
          }}>
            No puzzles found with the selected criteria.
          </div>
        )}

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Cancel
          </button>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''} available
          </div>
        </div>
      </div>
    </div>
  );
};