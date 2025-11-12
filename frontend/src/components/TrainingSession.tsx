import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { User } from '../services/auth-service';
import { ChessBoard } from './ChessBoard';
import { AppHeader } from './AppHeader';
import { MovePanel } from './MovePanel';
import { BoardEditor } from './BoardEditor';
import styles from '../styles/shared.module.css';

interface TrainingSessionProps {
  currentUser: User;
  position: string;
  game: Chess;
  // Move history and navigation
  moveHistory: string[];
  reviewMode?: boolean;
  reviewIndex?: number;
  onNavigateToMove?: (index: number) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateToStart?: () => void;
  onNavigateToEnd?: () => void;
  // Handlers
  onMove: (move: string, fen: string) => void;
  onPositionChange: (fen: string) => void;
  onResetPosition: () => void;
  onExitTraining: () => void;
  onLogout: () => void;
  // Shared training session props (optional)
  isSharedSession?: boolean;
  roomCode?: string;
  isCoach?: boolean;
  participants?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    isCoach: boolean;
  }>;
  onCopyRoomCode?: () => void;
  onEndSession?: () => void;
}

export const TrainingSession: React.FC<TrainingSessionProps> = ({
  currentUser,
  position,
  game,
  moveHistory,
  reviewMode,
  reviewIndex,
  onNavigateToMove,
  onNavigateBack,
  onNavigateForward,
  onNavigateToStart,
  onNavigateToEnd,
  onMove,
  onPositionChange,
  onResetPosition,
  onExitTraining,
  onLogout,
  isSharedSession = false,
  roomCode,
  isCoach = true,
  participants = [],
  onCopyRoomCode,
  onEndSession,
}) => {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className={styles.app}>
      <AppHeader
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <div className={styles.container}>
        {/* Controls Panel */}
        <div className={styles.controlsPanel}>
          <div className={styles.controlsRow}>
            {isCoach && (
              <>
                <button
                  onClick={() => setShowEditor(!showEditor)}
                  className={styles.primaryButton}
                >
                  {showEditor ? '🎯 Hide Editor' : '📋 Edit Position'}
                </button>
                <button onClick={onResetPosition} className={styles.secondaryButton}>
                  🔄 Reset Position
                </button>
              </>
            )}
            {isSharedSession && isCoach && onEndSession && (
              <button
                onClick={onEndSession}
                className={styles.secondaryButton}
                style={{ backgroundColor: '#dc3545' }}
              >
                🛑 End Session
              </button>
            )}
            <button
              onClick={onExitTraining}
              className={styles.secondaryButton}
              style={{ marginLeft: isCoach ? 'unset' : 'auto', marginRight: '0', backgroundColor: '#6c757d' }}
            >
              ← {isSharedSession ? 'Leave' : 'Exit'} Training
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div className={styles.statusPanel}>
          <div className={styles.statusCard} style={{
            background: 'linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'var(--font-bold)'
          }}>
            {isSharedSession ? (isCoach ? '👨‍🏫 Coach Mode' : '👁️ Spectator Mode') : '📚 Training Mode'}
          </div>
          {isSharedSession && roomCode && (
            <div className={styles.statusCard} style={{ cursor: 'pointer' }} onClick={onCopyRoomCode}>
              🔑 Room: {roomCode}
            </div>
          )}
          <div className={styles.statusCard}>
            ⏱️ Unlimited Time
          </div>
          <div className={styles.statusCard}>
            {moveHistory.length} Move{moveHistory.length !== 1 ? 's' : ''} Played
          </div>
          {isSharedSession && participants.length > 0 && (
            <div className={styles.statusCard}>
              👥 {participants.length} Participant{participants.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className={styles.gameArea}>
          {/* Board Editor (Conditional - Coach only) */}
          {showEditor && isCoach && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-lg)',
              border: '2px solid var(--primary-color)'
            }}>
              <BoardEditor onPositionChange={onPositionChange} />
            </div>
          )}

          {/* Board + Move Panel Section */}
          <div className={styles.gameContainer}>
            {/* Chess Board */}
            <div className={styles.boardWrapper}>
              <ChessBoard
                position={position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : position}
                game={game}
                playerColor="white"
                isMyTurn={() => !reviewMode && isCoach}
                onMove={onMove}
                isTimeExpired={false}
                reviewMode={reviewMode}
                allowBothSides={isCoach}
              />
            </div>

            {/* Side Panel - Move Panel & Info */}
            <div className={styles.sidePanel}>
              {/* Participants List (Shared Sessions Only) */}
              {isSharedSession && participants.length > 0 && (
                <div style={{
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  marginBottom: 'var(--space-md)',
                  fontSize: 'var(--text-sm)'
                }}>
                  <strong style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    color: 'var(--text-primary)'
                  }}>
                    👥 Participants
                  </strong>
                  <ul style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none'
                  }}>
                    {participants.map(participant => (
                      <li key={participant.id} style={{
                        padding: 'var(--space-xs) var(--space-sm)',
                        marginBottom: 'var(--space-xs)',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {participant.firstName} {participant.lastName}
                        </span>
                        {participant.isCoach && (
                          <span style={{
                            fontSize: 'var(--text-xs)',
                            padding: '2px 6px',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            borderRadius: '3px',
                            fontWeight: 'var(--font-semibold)'
                          }}>
                            Coach
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Training Instructions */}
              <div style={{
                padding: 'var(--space-md)',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                marginBottom: 'var(--space-md)',
                fontSize: 'var(--text-sm)',
                lineHeight: '1.6'
              }}>
                <strong style={{
                  display: 'block',
                  marginBottom: 'var(--space-xs)',
                  color: 'var(--text-primary)'
                }}>
                  💡 {isSharedSession ? (isCoach ? 'Coach' : 'Spectator') : 'Training'} Tips
                </strong>
                <ul style={{
                  margin: 0,
                  paddingLeft: 'var(--space-lg)',
                  color: 'var(--text-muted)'
                }}>
                  {isSharedSession ? (
                    isCoach ? (
                      <>
                        <li>Share the room code with your students</li>
                        <li>Use "Edit Position" to set up custom positions</li>
                        <li>Make moves to demonstrate solutions and tactics</li>
                        <li>Students see your moves in real-time</li>
                        <li>Click "End Session" when you're done teaching</li>
                      </>
                    ) : (
                      <>
                        <li>Watch as the coach demonstrates the position</li>
                        <li>You're in spectator mode - board is read-only</li>
                        <li>Use move navigation to review the moves</li>
                        <li>Ask questions to your coach via your communication tool</li>
                        <li>Session ends when the coach closes it</li>
                      </>
                    )
                  ) : (
                    <>
                      <li>Click "Edit Position" to set up custom positions</li>
                      <li>Play both white and black pieces to demonstrate solutions</li>
                      <li>Practice tactics, endgames, or specific scenarios</li>
                      <li>Use move navigation to review your analysis</li>
                      <li>No time pressure - take your time to think</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Move Panel */}
              <MovePanel
                moveHistory={moveHistory}
                currentMoveIndex={reviewIndex ?? -1}
                gameMode="TRAINING"
                reviewMode={reviewMode}
                game={game}
                onMoveClick={onNavigateToMove}
                onNavigateBack={onNavigateBack}
                onNavigateForward={onNavigateForward}
                onNavigateToStart={onNavigateToStart}
                onNavigateToEnd={onNavigateToEnd}
              />

              {/* Turn Indicator */}
              <div className={`${styles.turnIndicator} turn-indicator`} style={{
                textAlign: 'center',
                padding: 'var(--space-md)',
                margin: 'var(--space-md) 0',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)'
              }}>
                {reviewMode ? '👁️ Review Mode' : `${game.turn() === 'w' ? '⚪' : '⚫'} ${game.turn() === 'w' ? 'White' : 'Black'} to move`}
              </div>

              {/* Position Stats */}
              <div style={{
                textAlign: 'center',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                marginTop: 'var(--space-md)',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '6px'
              }}>
                {game.isCheck() && '⚠️ Check! '}
                {game.isCheckmate() && '🏁 Checkmate! '}
                {game.isStalemate() && '🤝 Stalemate! '}
                {game.isDraw() && '🤝 Draw! '}
                {!game.isGameOver() && !game.isCheck() && '✓ Position Loaded'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
