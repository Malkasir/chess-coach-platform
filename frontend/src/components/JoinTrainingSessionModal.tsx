import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/shared.module.css';
import {
  TRAINING_ROOM_CODE_LENGTH,
  TRAINING_ROOM_CODE_PLACEHOLDER,
  isValidTrainingRoomCode
} from '../constants/trainingSession';

interface JoinTrainingSessionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onJoinSession: (roomCode: string) => Promise<void>;
}

export const JoinTrainingSessionModal: React.FC<JoinTrainingSessionModalProps> = ({
  isVisible,
  onClose,
  onJoinSession,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens and focus input
  useEffect(() => {
    if (isVisible) {
      setRoomCode('');
      setError('');
      setIsJoining(false);
      // Focus input after modal animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  const handleRoomCodeChange = (value: string) => {
    // Convert to uppercase and limit to expected length (TRAIN-XXX format)
    const sanitized = value.toUpperCase().slice(0, TRAINING_ROOM_CODE_LENGTH);
    setRoomCode(sanitized);

    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleJoinSession = async () => {
    // Validate room code using shared validation logic
    if (!roomCode || !isValidTrainingRoomCode(roomCode)) {
      setError('Room code must be in TRAIN-XXX format');
      return;
    }

    try {
      setIsJoining(true);
      setError('');
      await onJoinSession(roomCode);
      onClose();
    } catch (err) {
      // Extract error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to join training session';

      // User-friendly error messages
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        setError('Training session not found. Check the room code and try again.');
      } else if (errorMessage.includes('not active') || errorMessage.includes('ended')) {
        setError('This training session has ended.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
        setError('You do not have permission to join this session.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isJoining) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidTrainingRoomCode(roomCode) && !isJoining) {
      handleJoinSession();
    } else if (e.key === 'Escape' && !isJoining) {
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
      aria-labelledby="join-training-modal-title"
    >
      <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 id="join-training-modal-title" style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>
            Join Training Session
          </h2>
          <button
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label="Close modal"
            disabled={isJoining}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody} style={{ padding: 'var(--space-xl)' }}>
          <label
            htmlFor="training-room-code"
            style={{
              display: 'block',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-md)',
              color: 'var(--text-primary)'
            }}
          >
            Room Code
          </label>

          <input
            ref={inputRef}
            id="training-room-code"
            type="text"
            value={roomCode}
            onChange={(e) => handleRoomCodeChange(e.target.value)}
            placeholder={TRAINING_ROOM_CODE_PLACEHOLDER}
            maxLength={TRAINING_ROOM_CODE_LENGTH}
            className={styles.input}
            disabled={isJoining}
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              fontSize: 'var(--text-lg)',
              textAlign: 'center',
              letterSpacing: '0.1em',
              fontWeight: 'var(--font-bold)',
              textTransform: 'uppercase',
              border: error ? '2px solid var(--error-color)' : '2px solid var(--border-subtle)',
              fontFamily: 'monospace',
              opacity: isJoining ? 0.6 : 1
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'training-room-code-error' : undefined}
          />

          {error && (
            <div
              id="training-room-code-error"
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
            👨‍🏫 Ask your coach for the training session code (format: TRAIN-XXX)
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.secondaryButton}
            disabled={isJoining}
            style={{
              marginRight: 'var(--space-md)',
              opacity: isJoining ? 0.5 : 1,
              cursor: isJoining ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleJoinSession}
            className={styles.primaryButton}
            disabled={!isValidTrainingRoomCode(roomCode) || isJoining}
            style={{
              opacity: (!isValidTrainingRoomCode(roomCode) || isJoining) ? 0.5 : 1,
              cursor: (!isValidTrainingRoomCode(roomCode) || isJoining) ? 'not-allowed' : 'pointer'
            }}
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </div>
      </div>
    </div>
  );
};
