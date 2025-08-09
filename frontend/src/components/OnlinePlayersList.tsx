import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    switch (status) {
      case 'online': return 'Available';
      case 'in_game': return 'In Game';
      case 'teaching': return 'Teaching';
      case 'away': return 'Away';
      default: return 'Unknown';
    }
  };

  const formatLastSeen = (lastSeenStr: string) => {
    const lastSeen = new Date(lastSeenStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
          <h2 id="players-modal-title">Online Players ({onlinePlayers.length})</h2>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Close players list"
          >
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <label htmlFor="player-search" className="sr-only">Search players</label>
          <input
            ref={searchInputRef}
            id="player-search"
            name="playerSearch"
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.playersList}>
          {loading && (
            <div className={styles.loadingMessage}>Loading players...</div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              {error}
              <button onClick={() => fetchOnlinePlayers()} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && onlinePlayers.length === 0 && (
            <div className={styles.emptyMessage}>
              {searchTerm ? 'No players found matching your search.' : 'No other players online right now.'}
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
                    {player.rating ? `(${player.rating})` : '(Unrated)'}
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
                    Invite to Game
                  </button>
                ) : (
                  <span className={styles.unavailableText}>
                    {player.status === 'in_game' ? 'Playing' : 'Unavailable'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Close
          </button>
          <button onClick={() => fetchOnlinePlayers()} className={styles.primaryButton}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};