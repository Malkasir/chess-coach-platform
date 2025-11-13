import React from 'react';
import { useTranslation } from 'react-i18next';
import { Chess } from 'chess.js';
import { User } from '../services/auth-service';
import { ChessBoard } from './ChessBoard';
import { VideoCall } from './VideoCall';
import { AppHeader } from './AppHeader';
import { GameClock } from './GameClock';
import { MovePanel } from './MovePanel';
import { AnalysisPanel } from './AnalysisPanel';
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
  // NEW: Move history and navigation
  moveHistory: string[];
  reviewMode?: boolean;
  reviewIndex?: number;
  onNavigateToMove?: (index: number) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateToStart?: () => void;
  onNavigateToEnd?: () => void;
  // Existing handlers
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
  moveHistory,
  reviewMode,
  reviewIndex,
  onNavigateToMove,
  onNavigateBack,
  onNavigateForward,
  onNavigateToStart,
  onNavigateToEnd,
  isMyTurn,
  getCurrentTurnDisplay,
  onMove,
  onResetGame,
  onExitGame,
  onCopyRoomCode,
  onLogout,
}) => {
  const { t } = useTranslation(['game']);

  // Use game clock hook for smooth countdown
  const { whiteTimeRemaining, blackTimeRemaining, isWhiteTimeExpired, isBlackTimeExpired } = useGameClock(clockState);

  // Determine if current player's time has expired
  const isTimeExpired = playerColor === 'white' ? isWhiteTimeExpired : isBlackTimeExpired;

  // Determine if we're in training mode
  const isTrainingMode = clockState?.gameMode === 'TRAINING';

  // Debug: Log training mode state
  React.useEffect(() => {
    console.log('ActiveGame Debug:', {
      clockState,
      gameMode: clockState?.gameMode,
      isTrainingMode,
      reviewMode
    });
  }, [clockState, isTrainingMode, reviewMode]);

  // Handler for playing the engine's suggested move
  const handlePlayBestMove = (uciMove: string) => {
    try {
      // Convert UCI move (e.g., "e2e4") to chess.js move format
      const move = game.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: uciMove.length > 4 ? uciMove[4] : undefined
      });

      if (move) {
        onMove(move.san, game.fen());
      }
    } catch (error) {
      console.error('Failed to play suggested move:', error);
    }
  };

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
              {t('actions.new_game')}
            </button>
            <button onClick={onExitGame} className={styles.secondaryButton} style={{ marginInlineStart: '1rem', backgroundColor: '#dc3545' }}>
              {t('actions.exit_game')}
            </button>
            {gameStatus === 'waiting' && roomCode && (
              <>
                <input
                  id="room-code-input"
                  type="text"
                  value={roomCode}
                  readOnly
                  className={styles.input}
                  style={{ marginInlineStart: '1rem', direction: 'ltr' }}
                />
                <button id="copy-button" onClick={onCopyRoomCode} className={styles.secondaryButton}>
                  {t('actions.copy_code')}
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.statusPanel}>
          <div className={styles.statusCard}>{t('info.status_label')}: {gameStatus}</div>
          {roomCode && <div className={styles.statusCard} style={{ direction: 'ltr' }}>{t('info.room_code_label')}: {roomCode}</div>}
          {playerColor && <div className={styles.statusCard}>{t('info.color_label')}: {t(`info.color_${playerColor}`)}</div>}
          {gameStatus === 'waiting' && <div className={styles.statusCard}>{t('info.share_code')}</div>}
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
                  reviewMode={reviewMode}
                />
              ) : (
                <div className={styles.loadingBoard}>
                  <div className={styles.loadingText}>
                    {gameStatus === 'waiting' ? t('status.waiting') : t('info.initializing')}
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel - Clocks & Info */}
            <div className={styles.sidePanel}>
              {/* 1. Opponent Clock (Top) */}
              <GameClock
                clockState={clockState}
                playerColor={playerColor}
                whiteTimeRemaining={whiteTimeRemaining}
                blackTimeRemaining={blackTimeRemaining}
                layout="side-panel"
                showClock={playerColor === 'white' ? 'black' : 'white'}
              />

              {/* 2. Move Panel */}
              <MovePanel
                moveHistory={moveHistory}
                currentMoveIndex={reviewIndex ?? -1}
                gameMode={clockState?.gameMode || 'TIMED'}
                reviewMode={reviewMode}
                game={game}
                onMoveClick={onNavigateToMove}
                onNavigateBack={onNavigateBack}
                onNavigateForward={onNavigateForward}
                onNavigateToStart={onNavigateToStart}
                onNavigateToEnd={onNavigateToEnd}
              />

              {/* 2.5 Engine Analysis Panel (Training Mode Only) */}
              {isTrainingMode && (
                <AnalysisPanel
                  game={game}
                  position={position}
                  enabled={!reviewMode}
                  onPlayMove={handlePlayBestMove}
                />
              )}

              {/* 3. Turn Indicator */}
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

              {/* 4. Player Clock (Bottom) */}
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

