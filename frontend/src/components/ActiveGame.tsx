import React from 'react';
import { Chess } from 'chess.js';
import { User } from '../services/auth-service';
import { ChessBoard } from './ChessBoard';
import { VideoCall } from './VideoCall';
import { AppHeader } from './AppHeader';
import { GameClock } from './GameClock';
import { useGameClock } from '../hooks/useGameClock';
import { ClockState } from '../types/clock.types';
import styles from '../styles/shared.module.css';

interface ActiveGameProps {
  currentUser: User;
  gameId: string;
  roomCode: string;
  gameStatus: string;
  position: string;
  playerColor: 'white' | 'black' | null;
  game: Chess;
  clockState: ClockState | null;
  isMyTurn: () => boolean;
  getCurrentTurnDisplay: () => string;
  onMove: (move: string, fen: string) => void;
  onResetGame: () => void;
  onExitGame: () => void;
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
  clockState,
  isMyTurn,
  getCurrentTurnDisplay,
  onMove,
  onResetGame,
  onExitGame,
  onCopyRoomCode,
  onLogout,
}) => {
  // Use game clock hook for smooth countdown
  const { whiteTimeRemaining, blackTimeRemaining, isWhiteTimeExpired, isBlackTimeExpired } = useGameClock(clockState);

  // Determine if current player's time has expired
  const isTimeExpired = playerColor === 'white' ? isWhiteTimeExpired : isBlackTimeExpired;

  return (
    <div className={styles.app}>
      <AppHeader 
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <div className={styles.container}>
        <div className={styles.controlsPanel}>
          <div className={styles.controlsRow}>
            <button onClick={onResetGame} className={styles.secondaryButton}>
              New Game
            </button>
            <button onClick={onExitGame} className={styles.secondaryButton} style={{ marginLeft: '1rem', backgroundColor: '#dc3545' }}>
              Exit Game
            </button>
            {gameStatus === 'waiting' && roomCode && (
              <>
                <input
                  id="room-code-input"
                  type="text"
                  value={roomCode}
                  readOnly
                  className={styles.input}
                  style={{ marginLeft: '1rem' }}
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
          {/* Video Call Section */}
          <div className={styles.videoSection}>
            <VideoCall gameId={gameId} />
          </div>

          {/* Board + Clocks Section */}
          <div className={styles.gameContainer}>
            {/* Chess Board */}
            <div className={styles.boardWrapper}>
              {playerColor ? (
                <ChessBoard
                  position={position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : position}
                  game={game}
                  playerColor={playerColor}
                  isMyTurn={isMyTurn}
                  onMove={onMove}
                  isTimeExpired={isTimeExpired}
                />
              ) : (
                <div className={styles.loadingBoard}>
                  <div className={styles.loadingText}>
                    {gameStatus === 'waiting' ? 'Waiting for opponent...' : 'Initializing chess board...'}
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel - Clocks & Info */}
            <div className={styles.sidePanel}>
              {/* Opponent Clock (Top) */}
              <GameClock
                clockState={clockState}
                playerColor={playerColor}
                whiteTimeRemaining={whiteTimeRemaining}
                blackTimeRemaining={blackTimeRemaining}
                layout="side-panel"
                showClock={playerColor === 'white' ? 'black' : 'white'}
              />

              {/* Turn Indicator */}
              <div className={`${styles.turnIndicator} turn-indicator`} style={{
                textAlign: 'center',
                padding: 'var(--space-md)',
                margin: 'var(--space-sm) 0',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)'
              }}>
                {getCurrentTurnDisplay()}
              </div>

              {/* Player Clock (Bottom) */}
              <GameClock
                clockState={clockState}
                playerColor={playerColor}
                whiteTimeRemaining={whiteTimeRemaining}
                blackTimeRemaining={blackTimeRemaining}
                layout="side-panel"
                showClock={playerColor === 'white' ? 'white' : 'black'}
              />

              {/* Time Control Info */}
              {clockState && clockState.gameMode === 'TIMED' && clockState.baseTimeSeconds && (
                <div style={{
                  textAlign: 'center',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '6px'
                }}>
                  ⏱️ {Math.floor(clockState.baseTimeSeconds / 60)} min
                  {clockState.incrementSeconds > 0 && ` + ${clockState.incrementSeconds}s`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

