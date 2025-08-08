import React, { useState } from 'react';
import styles from '../styles/shared.module.css';

interface GameInvitationModalProps {
  isVisible: boolean;
  playerName: string;
  playerId: number;
  currentUserId: number;
  onSendInvitation: (invitation: InvitationData) => void;
  onClose: () => void;
}

export interface InvitationData {
  recipientId: number;
  type: 'quick_game' | 'lesson' | 'puzzle_session';
  colorPreference: 'white' | 'black' | 'random';
  message: string;
}

export const GameInvitationModal: React.FC<GameInvitationModalProps> = ({
  isVisible,
  playerName,
  playerId,
  currentUserId,
  onSendInvitation,
  onClose,
}) => {
  const [invitationType, setInvitationType] = useState<'quick_game' | 'lesson' | 'puzzle_session'>('quick_game');
  const [colorPreference, setColorPreference] = useState<'white' | 'black' | 'random'>('random');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendInvitation = async () => {
    if (sending) return;

    const invitationData: InvitationData = {
      recipientId: playerId,
      type: invitationType,
      colorPreference,
      message: message.trim() || getDefaultMessage()
    };

    setSending(true);
    try {
      await onSendInvitation(invitationData);
      // Reset form
      setMessage('');
      setInvitationType('quick_game');
      setColorPreference('random');
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSending(false);
    }
  };

  const getDefaultMessage = () => {
    switch (invitationType) {
      case 'quick_game':
        return `Hi ${playerName}! Want to play a quick chess game?`;
      case 'lesson':
        return `Hi ${playerName}! Would you like to have a chess lesson?`;
      case 'puzzle_session':
        return `Hi ${playerName}! Want to solve some chess puzzles together?`;
      default:
        return `Hi ${playerName}! Let's play chess!`;
    }
  };

  const getInvitationTypeIcon = (type: string) => {
    switch (type) {
      case 'quick_game': return '⚡';
      case 'lesson': return '📚';
      case 'puzzle_session': return '🧩';
      default: return '♟️';
    }
  };

  const getInvitationTypeDescription = (type: string) => {
    switch (type) {
      case 'quick_game': return 'Play a casual chess game';
      case 'lesson': return 'One-on-one chess coaching session';
      case 'puzzle_session': return 'Solve chess puzzles together';
      default: return 'Chess game';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Invite {playerName} to Play</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.invitationForm}>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>Game Type:</label>
            <div className={styles.gameTypeOptions}>
              {(['quick_game', 'lesson', 'puzzle_session'] as const).map((type) => (
                <div
                  key={type}
                  className={`${styles.gameTypeOption} ${
                    invitationType === type ? styles.selected : ''
                  }`}
                  onClick={() => setInvitationType(type)}
                >
                  <span className={styles.gameTypeIcon}>
                    {getInvitationTypeIcon(type)}
                  </span>
                  <div className={styles.gameTypeText}>
                    <div className={styles.gameTypeName}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className={styles.gameTypeDescription}>
                      {getInvitationTypeDescription(type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formSection}>
            <label htmlFor="invitation-color" className={styles.formLabel}>Your Color Preference:</label>
            <div className={styles.colorSelection}>
              <select
                id="invitation-color"
                name="colorPreference"
                value={colorPreference}
                onChange={(e) => setColorPreference(e.target.value as 'white' | 'black' | 'random')}
                className={styles.select}
              >
                <option value="random">Random</option>
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <label htmlFor="invitation-message" className={styles.formLabel}>Message (Optional):</label>
            <textarea
              id="invitation-message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getDefaultMessage()}
              className={styles.messageTextarea}
              rows={3}
              maxLength={500}
            />
            <div className={styles.characterCount}>
              {message.length}/500
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            onClick={onClose} 
            className={styles.secondaryButton}
            disabled={sending}
          >
            Cancel
          </button>
          <button 
            onClick={handleSendInvitation} 
            className={styles.primaryButton}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};