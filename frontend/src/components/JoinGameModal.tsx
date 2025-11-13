import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/shared.module.css';

interface JoinGameModalProps {
  isVisible: boolean;
  onClose: () => void;
  onJoinGame: (roomCode: string) => void;
}

export const JoinGameModal: React.FC<JoinGameModalProps> = ({
  isVisible,
  onClose,
  onJoinGame,
}) => {
  const { t } = useTranslation(['lobby', 'common']);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens and focus input
  useEffect(() => {
    if (isVisible) {
      setRoomCode('');
      setError('');
      // Focus input after modal animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  const handleRoomCodeChange = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    const sanitized = value.toUpperCase().slice(0, 6);
    setRoomCode(sanitized);

    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleJoinGame = () => {
    // Validate room code
    if (!roomCode || roomCode.length !== 6) {
      setError(t('lobby:join_game.error_invalid_length'));
      return;
    }

    // Check if room code is alphanumeric
    if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
      setError(t('lobby:join_game.error_invalid_format'));
      return;
    }

    onJoinGame(roomCode);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomCode.length === 6) {
      handleJoinGame();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyPress}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-game-modal-title"
    >
      <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 id="join-game-modal-title" style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>
            {t('lobby:join_game.title')}
          </h2>
          <button
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label={t('common:aria.close_modal')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody} style={{ padding: 'var(--space-xl)' }}>
          <label
            htmlFor="room-code-join"
            style={{
              display: 'block',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-md)',
              color: 'var(--text-primary)'
            }}
          >
            {t('lobby:join_game.room_code_label')}
          </label>

          <input
            ref={inputRef}
            id="room-code-join"
            type="text"
            value={roomCode}
            onChange={(e) => handleRoomCodeChange(e.target.value)}
            placeholder={t('lobby:join_game.room_code_placeholder')}
            maxLength={6}
            className={styles.input}
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              fontSize: 'var(--text-lg)',
              textAlign: 'center',
              letterSpacing: '0.2em',
              fontWeight: 'var(--font-bold)',
              textTransform: 'uppercase',
              border: error ? '2px solid var(--error-color)' : '2px solid var(--border-subtle)',
              fontFamily: 'monospace',
              direction: 'ltr'
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'room-code-error' : undefined}
          />

          {error && (
            <div
              id="room-code-error"
              role="alert"
              style={{
                marginTop: 'var(--space-sm)',
                color: 'var(--error-color)',
                fontSize: 'var(--text-sm)',
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}

          <div style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            💡 {t('lobby:join_game.hint')}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.secondaryButton}
            style={{ marginInlineEnd: 'var(--space-md)' }}
          >
            {t('lobby:join_game.cancel_button')}
          </button>
          <button
            onClick={handleJoinGame}
            className={styles.primaryButton}
            disabled={roomCode.length !== 6}
            style={{
              opacity: roomCode.length !== 6 ? 0.5 : 1,
              cursor: roomCode.length !== 6 ? 'not-allowed' : 'pointer'
            }}
          >
            {t('lobby:join_game.join_button')}
          </button>
        </div>
      </div>
    </div>
  );
};
