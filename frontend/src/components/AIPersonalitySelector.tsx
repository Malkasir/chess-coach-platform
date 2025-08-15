import React, { useState } from 'react';
import { ChessPersonality } from '../types/personality.types';
import { CHESS_PERSONALITIES, getRandomQuote } from '../data/personalities';
import styles from '../styles/shared.module.css';

interface AIPersonalitySelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectPersonality: (personality: ChessPersonality, userColor: 'white' | 'black' | 'random') => void;
}

export const AIPersonalitySelector: React.FC<AIPersonalitySelectorProps> = ({
  isVisible,
  onClose,
  onSelectPersonality
}) => {
  const [selectedPersonality, setSelectedPersonality] = useState<ChessPersonality>(CHESS_PERSONALITIES[4]); // Default to Balanced Beth
  const [userColor, setUserColor] = useState<'white' | 'black' | 'random'>('white');

  if (!isVisible) return null;

  const handlePersonalityClick = (personality: ChessPersonality) => {
    setSelectedPersonality(personality);
  };

  const handleStartGame = () => {
    onSelectPersonality(selectedPersonality, userColor);
    onClose();
  };

  const getDifficultyLabel = (skillLevel: number) => {
    if (skillLevel <= 4) return 'Beginner';
    if (skillLevel <= 8) return 'Intermediate';
    if (skillLevel <= 12) return 'Advanced';
    if (skillLevel <= 16) return 'Expert';
    return 'Master';
  };

  const getDifficultyColor = (skillLevel: number) => {
    if (skillLevel <= 4) return '#4caf50';
    if (skillLevel <= 8) return '#ff9800';
    if (skillLevel <= 12) return '#f44336';
    if (skillLevel <= 16) return '#9c27b0';
    return '#000000';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '800px', maxHeight: '90vh' }}>
        <div className={styles.modalHeader}>
          <h2>Choose Your AI Opponent</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {CHESS_PERSONALITIES.map((personality) => (
              <div
                key={personality.id}
                className={`${styles.playerCard} ${selectedPersonality.id === personality.id ? styles.selected : ''}`}
                onClick={() => handlePersonalityClick(personality)}
                style={{ 
                  cursor: 'pointer',
                  borderColor: selectedPersonality.id === personality.id ? personality.color : 'transparent',
                  borderWidth: '2px',
                  borderStyle: 'solid'
                }}
              >
                <div className={styles.playerInfo}>
                  <div className={styles.playerHeader}>
                    <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>{personality.avatar}</span>
                    <div>
                      <div className={styles.playerName}>{personality.name}</div>
                      <div style={{ 
                        color: getDifficultyColor(personality.skillLevel), 
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {getDifficultyLabel(personality.skillLevel)} ({personality.targetElo} ELO)
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    fontSize: '0.9rem',
                    marginTop: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    {personality.description}
                  </div>
                  <div style={{ 
                    color: personality.color, 
                    fontSize: '0.8rem',
                    fontStyle: 'italic'
                  }}>
                    "{getRandomQuote(personality)}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color selection */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>Your Color:</span>
          <select
            value={userColor}
            onChange={(e) => setUserColor(e.target.value as 'white' | 'black' | 'random')}
            className={styles.select}
            style={{ minWidth: '120px' }}
          >
            <option value="white">White (You start)</option>
            <option value="black">Black (AI starts)</option>
            <option value="random">Random</option>
          </select>
        </div>

        {/* Selected personality summary */}
        {selectedPersonality && (
          <div style={{ 
            background: `linear-gradient(135deg, ${selectedPersonality.color}20, transparent)`,
            border: `1px solid ${selectedPersonality.color}40`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{selectedPersonality.avatar}</span>
              <span style={{ color: 'white', fontWeight: '600' }}>
                You've selected {selectedPersonality.name}
              </span>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
              Skill: {getDifficultyLabel(selectedPersonality.skillLevel)} • 
              Style: {selectedPersonality.playingStyle.aggression > 0 ? 'Aggressive' : 'Positional'} • 
              ELO: ~{selectedPersonality.targetElo}
            </div>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Cancel
          </button>
          <button onClick={handleStartGame} className={styles.primaryButton}>
            Start Game vs {selectedPersonality.name}
          </button>
        </div>
      </div>
    </div>
  );
};