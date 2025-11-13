import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/shared.module.css';

interface GameInvitation {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  type: 'quick_game' | 'lesson' | 'puzzle_session';
  message: string;
  status: string;
  timestamp: string;
  senderColor?: string;
}

interface NotificationBannerProps {
  invitation: GameInvitation | null;
  onAccept: (invitationId: number) => void;
  onDecline: (invitationId: number) => void;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  invitation,
  onAccept,
  onDecline,
  onDismiss,
}) => {
  const { t } = useTranslation(['lobby']);
  const [, forceUpdate] = useState({});
  
  
  // Force re-render every 30 seconds to update time remaining
  useEffect(() => {
    if (!invitation) return;
    
    const interval = setInterval(() => {
      forceUpdate({});
    }, 30000);
    
    return () => clearInterval(interval);
  }, [invitation]);

  if (!invitation) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quick_game': return '⚡';
      case 'lesson': return '📚';
      case 'puzzle_session': return '🧩';
      default: return '♟️';
    }
  };

  const getTypeText = (type: string) => {
    return t(`lobby:notification_banner.game_types.${type}`, {
      defaultValue: t('lobby:notification_banner.game_types.default')
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMs <= 0) return t('lobby:notification_banner.time.expired');
    if (diffMins < 60) return t('lobby:notification_banner.time.minutes_left', { count: Math.max(0, diffMins) });

    const diffHours = Math.floor(diffMins / 60);
    return t('lobby:notification_banner.time.hours_minutes_left', {
      hours: diffHours,
      minutes: diffMins % 60
    });
  };

  return (
    <div className={styles.notificationBanner}>
      <div className={styles.notificationContent}>
        <div className={styles.notificationIcon}>
          {getTypeIcon(invitation.type)}
        </div>
        
        <div className={styles.notificationInfo}>
          <div className={styles.notificationTitle}>
            {t('lobby:notification_banner.invited_to', {
              senderName: invitation.senderName,
              gameType: getTypeText(invitation.type)
            })}
          </div>

          {invitation.message && (
            <div className={styles.notificationMessage}>
              "{invitation.message}"
            </div>
          )}

          <div className={styles.notificationMeta}>
            <span className={styles.timeRemaining}>
              ⏱️ {t('lobby:notification_banner.time.just_now')}
            </span>
            {invitation.senderColor && invitation.senderColor !== 'random' && (
              <span className={styles.colorInfo}>
                • {t('lobby:notification_banner.color_preference', { color: invitation.senderColor })}
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.notificationActions}>
          <button
            onClick={() => onAccept(invitation.id)}
            className={styles.acceptButton}
          >
            {t('lobby:notification_banner.accept_button')}
          </button>
          <button
            onClick={() => onDecline(invitation.id)}
            className={styles.declineButton}
          >
            {t('lobby:notification_banner.decline_button')}
          </button>
          <button 
            onClick={onDismiss}
            className={styles.dismissButton}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};