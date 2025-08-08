import React from 'react';
import { Chess } from 'chess.js';
import { User } from '../services/auth-service';
import { ChessBoard } from './ChessBoard';
import { VideoCall } from './VideoCall';
import styles from '../styles/shared.module.css';

interface ActiveGameProps {
  currentUser: User;
  gameId: string;
  roomCode: string;
  gameStatus: string;
  position: string;
  playerColor: 'white' | 'black' | null;
  game: Chess;
  isMyTurn: () => boolean;
  getCurrentTurnDisplay: () => string;
  onMove: (move: string, fen: string) => void;
  onResetGame: () => void;
  onCopyRoomCode: () => void;
  onLogout: () => void;
}

export const ActiveGame: React.FC<ActiveGameProps> = ({
  currentUser,
  gameId,
  roomCode,
  gameStatus,
  position,
  playerColor,
  game,
  isMyTurn,
  getCurrentTurnDisplay,
  onMove,
  onResetGame,
  onCopyRoomCode,
  onLogout,
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
        </div>

        <div className={styles.statusPanel}>
          <div className={styles.statusCard}>Status: {gameStatus}</div>
          {roomCode && <div className={styles.statusCard}>Room Code: {roomCode}</div>}
          {playerColor && <div className={styles.statusCard}>Color: {playerColor}</div>}
          {gameStatus === 'waiting' && <div className={styles.statusCard}>Share this room code with your opponent!</div>}
        </div>

        <div className={styles.gameArea}>
          <VideoCall gameId={gameId} />
          <div className={styles.chessPanel}>
            <div className={styles.turnIndicator}>
              {getCurrentTurnDisplay()}
            </div>
            
            {playerColor ? (
              <ChessBoard
                position={position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : position}
                game={game}
                playerColor={playerColor}
                isMyTurn={isMyTurn}
                onMove={onMove}
              />
            ) : (
              <div className={styles.loadingBoard}>
                <div className={styles.loadingText}>
                  {gameStatus === 'waiting' ? 'Waiting for opponent...' : 'Initializing chess board...'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

