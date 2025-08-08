import React, { useState, useEffect } from 'react';
import styles from '../styles/shared.module.css';

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

  useEffect(() => {
    if (isVisible) {
      fetchOnlinePlayers();
      const interval = setInterval(fetchOnlinePlayers, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const fetchOnlinePlayers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = searchTerm 
        ? `/api/presence/search?q=${encodeURIComponent(searchTerm)}`
        : '/api/presence/online';
      
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch online players: ${response.status}`);
      }
      
      const players = await response.json();
      
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
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      // Debounce search
      setTimeout(() => {
        if (searchTerm === term) {
          fetchOnlinePlayers();
        }
      }, 500);
    } else {
      fetchOnlinePlayers();
    }
  };

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

  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Online Players ({onlinePlayers.length})</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <label htmlFor="player-search" className="sr-only">Search players</label>
          <input
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
              <button onClick={fetchOnlinePlayers} className={styles.retryButton}>
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
          <button onClick={fetchOnlinePlayers} className={styles.primaryButton}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};