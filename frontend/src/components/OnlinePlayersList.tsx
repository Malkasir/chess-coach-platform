import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/shared.module.css';
import { apiClient } from '../services/api-client';

interface OnlinePlayer {
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  status: 'online' | 'in_game' | 'teaching' | 'away';
  statusMessage?: string;
  lastSeen: string;
  isAvailable: boolean;
  rating?: number;
}

interface OnlinePlayersListProps {
  currentUserId: number;
  onInvitePlayer: (playerId: number, playerName: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const OnlinePlayersList: React.FC<OnlinePlayersListProps> = ({
  currentUserId,
  onInvitePlayer,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation(['lobby']);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      fetchOnlinePlayers();
      const interval = setInterval(fetchOnlinePlayers, 30000); // Refresh every 30 seconds
      
      // Focus search input and prevent body scroll
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      document.body.style.overflow = 'hidden';
      
      return () => {
        clearInterval(interval);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isVisible]);

  const fetchOnlinePlayers = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      setError('');
      
      const currentQuery = searchQuery ?? searchTerm;
      const players: OnlinePlayer[] = currentQuery.trim() 
        ? await apiClient.searchPlayers(currentQuery)
        : await apiClient.getOnlinePlayers();
      
      // Filter out current user
      const filteredPlayers = players.filter((player: OnlinePlayer) => 
        player.userId !== currentUserId
      );
      
      setOnlinePlayers(filteredPlayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchOnlinePlayers(term);
    }, 500);
  };

  // Handle escape key and cleanup timeout
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
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [isVisible, onClose]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'in_game': return '♟️';
      case 'teaching': return '📚';
      case 'away': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusText = (status: string) => {
    return t(`lobby:online_players.status.${status}`, { defaultValue: t('lobby:online_players.status.unknown') });
  };

  const formatLastSeen = (lastSeenStr: string) => {
    const lastSeen = new Date(lastSeenStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('lobby:online_players.last_seen.just_now');
    if (diffMins < 60) return t('lobby:online_players.last_seen.minutes_ago', { count: diffMins });

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('lobby:online_players.last_seen.hours_ago', { count: diffHours });

    const diffDays = Math.floor(diffHours / 24);
    return t('lobby:online_players.last_seen.days_ago', { count: diffDays });
  };

  // Handle click outside modal
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={styles.modalOverlay} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="players-modal-title"
    >
      <div className={styles.modalContent} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h2 id="players-modal-title">{t('lobby:online_players.title', { count: onlinePlayers.length })}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label={t('lobby:online_players.close_aria_label')}
          >
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <label htmlFor="player-search" className="sr-only">{t('lobby:online_players.search_label')}</label>
          <input
            ref={searchInputRef}
            id="player-search"
            name="playerSearch"
            type="text"
            placeholder={t('lobby:online_players.search_placeholder')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.playersList}>
          {loading && (
            <div className={styles.loadingMessage}>{t('lobby:online_players.loading')}</div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              {error}
              <button onClick={() => fetchOnlinePlayers()} className={styles.retryButton}>
                {t('lobby:online_players.error_retry')}
              </button>
            </div>
          )}

          {!loading && !error && onlinePlayers.length === 0 && (
            <div className={styles.emptyMessage}>
              {searchTerm ? t('lobby:online_players.no_results') : t('lobby:online_players.no_players')}
            </div>
          )}

          {onlinePlayers.map((player) => (
            <div key={player.userId} className={styles.playerCard}>
              <div className={styles.playerInfo}>
                <div className={styles.playerHeader}>
                  <span className={styles.playerName}>
                    {player.fullName}
                  </span>
                  <span className={styles.playerRating}>
                    {player.rating ? `(${player.rating})` : `(${t('lobby:online_players.unrated')})`}
                  </span>
                </div>
                
                <div className={styles.playerStatus}>
                  <span className={styles.statusIcon}>
                    {getStatusIcon(player.status)}
                  </span>
                  <span className={styles.statusText}>
                    {getStatusText(player.status)}
                  </span>
                  <span className={styles.lastSeen}>
                    • {formatLastSeen(player.lastSeen)}
                  </span>
                </div>

                {player.statusMessage && (
                  <div className={styles.statusMessage}>
                    "{player.statusMessage}"
                  </div>
                )}
              </div>

              <div className={styles.playerActions}>
                {player.isAvailable ? (
                  <button
                    onClick={() => onInvitePlayer(player.userId, player.fullName)}
                    className={styles.inviteButton}
                  >
                    {t('lobby:online_players.invite_button')}
                  </button>
                ) : (
                  <span className={styles.unavailableText}>
                    {player.status === 'in_game' ? t('lobby:online_players.unavailable_playing') : t('lobby:online_players.unavailable_text')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.secondaryButton}>
            {t('lobby:online_players.close_button')}
          </button>
          <button onClick={() => fetchOnlinePlayers()} className={styles.primaryButton}>
            {t('lobby:online_players.refresh_button')}
          </button>
        </div>
      </div>
    </div>
  );
};