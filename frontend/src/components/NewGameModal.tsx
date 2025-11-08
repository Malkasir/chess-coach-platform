import React, { useState, useEffect } from 'react';
import { TimeControl, DEFAULT_TIME_CONTROL } from '../types/clock.types';
import { TimeControlSelector } from './TimeControlSelector';
import styles from '../styles/shared.module.css';

interface NewGameModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateGame: (timeControl: TimeControl, colorPreference: 'white' | 'black' | 'random') => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isVisible,
  onClose,
  onCreateGame,
}) => {
  const [gameMode, setGameMode] = useState<'TIMED' | 'TRAINING'>('TIMED');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [colorPreference, setColorPreference] = useState<'white' | 'black' | 'random'>('random');

  // Reset to defaults when modal opens
  useEffect(() => {
    if (isVisible) {
      setGameMode('TIMED');
      setSelectedTimeControl(DEFAULT_TIME_CONTROL);
      setColorPreference('random');
    }
  }, [isVisible]);

  // Update time control when game mode changes
  useEffect(() => {
    if (gameMode === 'TRAINING') {
      setSelectedTimeControl({
        mode: 'TRAINING',
        baseTimeSeconds: null,
        incrementSeconds: 0,
        label: 'Training (No Clock)'
      });
    } else if (selectedTimeControl.mode === 'TRAINING') {
      // If switching from TRAINING to TIMED, reset to default
      setSelectedTimeControl(DEFAULT_TIME_CONTROL);
    }
  }, [gameMode, selectedTimeControl.mode]);

  const handleCreateGame = () => {
    onCreateGame(selectedTimeControl, colorPreference);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleBackdropClick}
      onKeyDown={handleEscapeKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-game-modal-title"
    >
      <div className={styles.modalContent} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 id="new-game-modal-title" style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>
            Create New Game
          </h2>
          <button
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody} style={{ padding: 'var(--space-lg)' }}>
          {/* Step 1: Game Mode */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-md)',
              color: 'var(--text-primary)'
            }}>
              1. Game Mode
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                onClick={() => setGameMode('TIMED')}
                className={gameMode === 'TIMED' ? styles.primaryButton : styles.secondaryButton}
                style={{
                  flex: 1,
                  padding: 'var(--space-md)',
                  fontSize: 'var(--text-md)',
                  border: gameMode === 'TIMED' ? '2px solid var(--primary-color)' : '1px solid var(--border-subtle)',
                  backgroundColor: gameMode === 'TIMED' ? 'var(--primary-color)' : 'var(--bg-card)',
                  color: gameMode === 'TIMED' ? 'white' : 'var(--text-primary)'
                }}
              >
                ⏱️ Timed Game
              </button>
              <button
                onClick={() => setGameMode('TRAINING')}
                className={gameMode === 'TRAINING' ? styles.primaryButton : styles.secondaryButton}
                style={{
                  flex: 1,
                  padding: 'var(--space-md)',
                  fontSize: 'var(--text-md)',
                  border: gameMode === 'TRAINING' ? '2px solid var(--primary-color)' : '1px solid var(--border-subtle)',
                  backgroundColor: gameMode === 'TRAINING' ? 'var(--primary-color)' : 'var(--bg-card)',
                  color: gameMode === 'TRAINING' ? 'white' : 'var(--text-primary)'
                }}
              >
                📚 Training (No Clock)
              </button>
            </div>
          </div>

          {/* Step 2: Time Control (only for TIMED games) */}
          {gameMode === 'TIMED' && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: 'var(--space-md)',
                color: 'var(--text-primary)'
              }}>
                2. Time Control
              </label>
              <div style={{
                padding: 'var(--space-md)',
                backgroundColor: 'var(--bg-panel)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}>
                <TimeControlSelector
                  value={selectedTimeControl}
                  onChange={setSelectedTimeControl}
                  disabled={false}
                />
              </div>
            </div>
          )}

          {/* Step 3: Color Selection */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-md)',
              color: 'var(--text-primary)'
            }}>
              {gameMode === 'TIMED' ? '3' : '2'}. Your Color
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              {(['random', 'white', 'black'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setColorPreference(color)}
                  className={colorPreference === color ? styles.primaryButton : styles.secondaryButton}
                  style={{
                    flex: 1,
                    padding: 'var(--space-md)',
                    fontSize: 'var(--text-md)',
                    border: colorPreference === color ? '2px solid var(--primary-color)' : '1px solid var(--border-subtle)',
                    backgroundColor: colorPreference === color ? 'var(--primary-color)' : 'var(--bg-card)',
                    color: colorPreference === color ? 'white' : 'var(--text-primary)',
                    textTransform: 'capitalize'
                  }}
                >
                  {color === 'random' && '🎲 '}
                  {color === 'white' && '⚪ '}
                  {color === 'black' && '⚫ '}
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: 'var(--space-lg)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)'
          }}>
            <strong>Game Summary:</strong>
            <ul style={{ marginTop: 'var(--space-xs)', paddingLeft: 'var(--space-lg)' }}>
              <li>Mode: {gameMode === 'TIMED' ? 'Timed Game' : 'Training (No Clock)'}</li>
              {gameMode === 'TIMED' && (
                <li>Time: {selectedTimeControl.label || `${Math.floor((selectedTimeControl.baseTimeSeconds || 0) / 60)}+${selectedTimeControl.incrementSeconds}`}</li>
              )}
              <li>Color: {colorPreference.charAt(0).toUpperCase() + colorPreference.slice(1)}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.secondaryButton}
            style={{ marginRight: 'var(--space-md)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGame}
            className={styles.primaryButton}
          >
            Create Game
          </button>
        </div>
      </div>
    </div>
  );
};
