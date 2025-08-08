import React from 'react';
import { User } from '../services/auth-service';
import styles from '../styles/shared.module.css';

interface GameLobbyProps {
  currentUser: User;
  gameStatus: string;
  roomCode: string;
  roomCodeInput: string;
  colorPreference: 'white' | 'black' | 'random';
  onCreateGame: () => void;
  onJoinByRoomCode: () => void;
  onResetGame: () => void;
  onCopyRoomCode: () => void;
  onLogout: () => void;
  onRoomCodeInputChange: (code: string) => void;
  onColorPreferenceChange: (color: 'white' | 'black' | 'random') => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  currentUser,
  gameStatus,
  roomCode,
  roomCodeInput,
  colorPreference,
  onCreateGame,
  onJoinByRoomCode,
  onResetGame,
  onCopyRoomCode,
  onLogout,
  onRoomCodeInputChange,
  onColorPreferenceChange,
}) => {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Chess Coach Platform</h1>
        <div className={styles.userInfo}>
          <span>Welcome, {currentUser.firstName} ({currentUser.email})</span>
          <button onClick={onLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.controlsPanel}>
          {gameStatus === 'disconnected' && (
            <>
              <div className={styles.controlsRow}>
                <div className={styles.colorSelection}>
                  <label className={styles.label}>Your Color:</label>
                  <select
                    value={colorPreference}
                    onChange={(e) => onColorPreferenceChange(e.target.value as 'white' | 'black' | 'random')}
                    className={styles.select}
                  >
                    <option value="random">Random</option>
                    <option value="white">White</option>
                    <option value="black">Black</option>
                  </select>
                </div>
                <button onClick={onCreateGame} className={styles.primaryButton}>
                  Create New Game
                </button>
              </div>
              <div className={styles.controlsRow}>
                <span style={{ margin: '0 1rem' }}>OR</span>
                <input
                  type="text"
                  placeholder="Enter Room Code (ABC123)"
                  maxLength={6}
                  value={roomCodeInput}
                  onChange={(e) => onRoomCodeInputChange(e.target.value)}
                  className={styles.input}
                />
                <button onClick={onJoinByRoomCode} className={styles.secondaryButton}>
                  Join Game
                </button>
              </div>
            </>
          )}
          
          {(gameStatus === 'waiting' || gameStatus === 'active') && (
            <div className={styles.controlsRow}>
              <button onClick={onResetGame} className={styles.secondaryButton}>
                New Game
              </button>
              {gameStatus === 'waiting' && roomCode && (
                <>
                  <input
                    id="room-code-input"
                    type="text"
                    value={roomCode}
                    readOnly
                    className={styles.input}
                  />
                  <button id="copy-button" onClick={onCopyRoomCode} className={styles.secondaryButton}>
                    Copy Code
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.statusPanel}>
          <div className={styles.statusCard}>Status: {gameStatus}</div>
          {roomCode && <div className={styles.statusCard}>Room Code: {roomCode}</div>}
          {gameStatus === 'waiting' && <div className={styles.statusCard}>Share this room code with your opponent!</div>}
        </div>
      </div>
    </div>
  );
};

