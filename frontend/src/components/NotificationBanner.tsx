import React, { useState, useEffect } from 'react';
import styles from '../styles/shared.module.css';

interface GameInvitation {
  id: number;
  type: 'quick_game' | 'lesson' | 'puzzle_session';
  sender: {
    id: number;
    fullName: string;
  };
  message: string;
  expiresAt: string;
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
    switch (type) {
      case 'quick_game': return 'Quick Game';
      case 'lesson': return 'Chess Lesson';
      case 'puzzle_session': return 'Puzzle Session';
      default: return 'Chess Game';
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMs <= 0) return 'Expired';
    if (diffMins < 60) return `${Math.max(0, diffMins)}m left`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m left`;
  };

  return (
    <div className={styles.notificationBanner}>
      <div className={styles.notificationContent}>
        <div className={styles.notificationIcon}>
          {getTypeIcon(invitation.type)}
        </div>
        
        <div className={styles.notificationInfo}>
          <div className={styles.notificationTitle}>
            <strong>{invitation.sender.fullName}</strong> invited you to a {getTypeText(invitation.type)}
          </div>
          
          {invitation.message && (
            <div className={styles.notificationMessage}>
              "{invitation.message}"
            </div>
          )}
          
          <div className={styles.notificationMeta}>
            <span className={styles.timeRemaining}>
              ⏱️ {getTimeRemaining(invitation.expiresAt)}
            </span>
            {invitation.senderColor && invitation.senderColor !== 'random' && (
              <span className={styles.colorInfo}>
                • They want {invitation.senderColor}
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.notificationActions}>
          <button 
            onClick={() => onAccept(invitation.id)}
            className={styles.acceptButton}
          >
            Accept
          </button>
          <button 
            onClick={() => onDecline(invitation.id)}
            className={styles.declineButton}
          >
            Decline
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