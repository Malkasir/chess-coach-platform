import React, { useState, useEffect } from 'react';
import styles from '../styles/shared.module.css';

interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Classic Wood',
    description: 'Traditional wooden chess board with warm colors',
    icon: '🏰',
    preview: {
      primary: '#654321',
      secondary: '#f0d9b5',
      accent: '#d4af37'
    }
  },
  {
    id: 'marble',
    name: 'Marble Luxury',
    description: 'Elegant marble design with royal blue accents',
    icon: '💎',
    preview: {
      primary: '#2f4f4f',
      secondary: '#f8f8ff',
      accent: '#4169e1'
    }
  },
  {
    id: 'neon',
    name: 'Neon Cyberpunk',
    description: 'Futuristic cyberpunk with glowing neon effects',
    icon: '⚡',
    preview: {
      primary: '#001428',
      secondary: '#00ffff',
      accent: '#ff00ff'
    }
  },
  {
    id: 'glass',
    name: 'Glass Modern',
    description: 'Modern glassmorphism with subtle transparency',
    icon: '🔮',
    preview: {
      primary: 'rgba(255,255,255,0.1)',
      secondary: '#ffffff',
      accent: '#8b5cf6'
    }
  },
  {
    id: 'medieval',
    name: 'Dark Medieval',
    description: 'Gothic medieval atmosphere with gold accents',
    icon: '⚔️',
    preview: {
      primary: '#2f1b14',
      secondary: '#f5deb3',
      accent: '#ffd700'
    }
  }
];

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ isOpen, onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState('classic');

  // Load saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('chess-theme') || 'classic';
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('chess-theme', themeId);
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <h2>🎨 Choose Your Theme</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close theme selector"
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: 'var(--text-base)',
            margin: 0,
            lineHeight: 1.5
          }}>
            Transform your chess experience with beautiful themes inspired by chess masters. 
            Each theme creates a unique atmosphere for your games.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className={`theme-card ${selectedTheme === theme.id ? 'selected' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: selectedTheme === theme.id 
                  ? '2px solid var(--accent-color)' 
                  : '1px solid var(--border-subtle)',
                backgroundColor: selectedTheme === theme.id 
                  ? 'var(--bg-card-hover)' 
                  : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (selectedTheme !== theme.id) {
                  e.currentTarget.style.borderColor = 'var(--border-normal)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTheme !== theme.id) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Theme preview gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.preview.primary}, ${theme.preview.accent}, ${theme.preview.secondary})`,
                opacity: 0.8
              }} />

              {/* Theme icon and name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ 
                  fontSize: '1.5rem', 
                  marginRight: '0.5rem',
                  filter: selectedTheme === theme.id ? 'brightness(1.3)' : 'none'
                }}>
                  {theme.icon}
                </span>
                <h3 style={{
                  margin: 0,
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)'
                }}>
                  {theme.name}
                </h3>
              </div>

              {/* Theme description */}
              <p style={{
                margin: 0,
                color: 'var(--text-muted)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.4
              }}>
                {theme.description}
              </p>

              {/* Color palette preview */}
              <div style={{
                display: 'flex',
                gap: '4px',
                marginTop: '1rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: theme.preview.primary,
                  border: '1px solid var(--border-subtle)'
                }} />
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: theme.preview.secondary,
                  border: '1px solid var(--border-subtle)'
                }} />
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: theme.preview.accent,
                  border: '1px solid var(--border-subtle)'
                }} />
              </div>

              {/* Selected indicator */}
              {selectedTheme === theme.id && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Preview information */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>💡</span>
            <span style={{ 
              color: 'var(--text-primary)', 
              fontWeight: 'var(--font-medium)' 
            }}>
              Pro Tip
            </span>
          </div>
          <p style={{
            margin: 0,
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.4
          }}>
            Your theme preference is automatically saved and will persist across sessions. 
            Try different themes to find the perfect atmosphere for your chess games!
          </p>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;