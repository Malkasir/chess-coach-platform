import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/shared.module.css';
import { TimeControl, DEFAULT_TIME_CONTROL } from '../types/clock.types';
import { TimeControlSelector } from './TimeControlSelector';

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
  timeControl: TimeControl;
}

export const GameInvitationModal: React.FC<GameInvitationModalProps> = ({
  isVisible,
  playerName,
  playerId,
  currentUserId,
  onSendInvitation,
  onClose,
}) => {
  const { t } = useTranslation(['lobby', 'common']);
  const [invitationType, setInvitationType] = useState<'quick_game' | 'lesson' | 'puzzle_session'>('quick_game');
  const [colorPreference, setColorPreference] = useState<'white' | 'black' | 'random'>('random');
  const [timeControl, setTimeControl] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const firstInputRef = useRef<HTMLSelectElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management and keyboard navigation
  useEffect(() => {
    if (isVisible && firstInputRef.current) {
      firstInputRef.current.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose]);

  // Handle click outside modal
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSendInvitation = async () => {
    if (sending) return;

    const invitationData: InvitationData = {
      recipientId: playerId,
      type: invitationType,
      colorPreference,
      timeControl,
      message: message.trim() || getDefaultMessage()
    };

    setSending(true);
    try {
      await onSendInvitation(invitationData);
      // Reset form
      setMessage('');
      setInvitationType('quick_game');
      setColorPreference('random');
      setTimeControl(DEFAULT_TIME_CONTROL);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSending(false);
    }
  };

  const getDefaultMessage = () => {
    return t(`lobby:invitation.game_types.${invitationType}.default_message`, { playerName });
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
    return t(`lobby:invitation.game_types.${type}.description`);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={styles.modalOverlay} 
      onClick={handleOverlayClick}
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modalContent} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h2 id="modal-title">{t('lobby:invitation.send_title', { playerName })}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label={t('common:aria.close_modal')}
          >
            ×
          </button>
        </div>

        <div className={styles.invitationForm}>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>{t('lobby:invitation.game_type_label')}</label>
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
                      {t(`lobby:invitation.game_types.${type}.name`)}
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
            <label htmlFor="invitation-color" className={styles.formLabel}>{t('lobby:invitation.color_preference_label')}</label>
            <div className={styles.colorSelection}>
              <select
                ref={firstInputRef}
                id="invitation-color"
                name="colorPreference"
                value={colorPreference}
                onChange={(e) => setColorPreference(e.target.value as 'white' | 'black' | 'random')}
                className={styles.select}
              >
                <option value="random">{t('lobby:invitation.color_options.random')}</option>
                <option value="white">{t('lobby:invitation.color_options.white')}</option>
                <option value="black">{t('lobby:invitation.color_options.black')}</option>
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <label className={styles.formLabel}>{t('lobby:invitation.time_control_label')}</label>
            <div style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-panel)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <TimeControlSelector
                value={timeControl}
                onChange={setTimeControl}
                disabled={false}
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <label htmlFor="invitation-message" className={styles.formLabel}>{t('lobby:invitation.message_label')}</label>
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
              {t('lobby:invitation.character_count', { count: message.length })}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.secondaryButton}
            disabled={sending}
          >
            {t('lobby:invitation.cancel_button')}
          </button>
          <button
            onClick={handleSendInvitation}
            className={styles.primaryButton}
            disabled={sending || message.length > 500}
          >
            {sending ? t('lobby:invitation.sending_button') : t('lobby:invitation.send_button')}
          </button>
        </div>
      </div>
    </div>
  );
};