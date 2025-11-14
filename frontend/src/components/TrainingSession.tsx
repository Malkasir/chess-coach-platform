import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { User } from '../services/auth-service';
import { ChessBoard } from './ChessBoard';
import { AppHeader } from './AppHeader';
import { MovePanel } from './MovePanel';
import { AnalysisPanel } from './AnalysisPanel';
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
  // Phase 2: Interactive Mode
  interactiveMode?: boolean;
  onToggleInteractiveMode?: (enabled: boolean) => void;
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
  interactiveMode = false,
  onToggleInteractiveMode,
}) => {
  const [showEditor, setShowEditor] = useState(false);

  // Collapsible panel state (persisted to localStorage)
  const [movesPanelOpen, setMovesPanelOpen] = useState(() => {
    const saved = localStorage.getItem('training-moves-panel-open');
    return saved !== null ? JSON.parse(saved) : true; // Default: open
  });

  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(() => {
    const saved = localStorage.getItem('training-analysis-panel-open');
    return saved !== null ? JSON.parse(saved) : true; // Default: OPEN
  });

  const [participantsOpen, setParticipantsOpen] = useState(false);

  // Debug logging for interactive mode
  React.useEffect(() => {
    if (isSharedSession && isCoach) {
      console.log('🎮 TrainingSession Props:', {
        isSharedSession,
        isCoach,
        interactiveMode,
        hasToggleFunction: !!onToggleInteractiveMode
      });
    }
  }, [isSharedSession, isCoach, interactiveMode, onToggleInteractiveMode]);

  // Persist panel states to localStorage
  React.useEffect(() => {
    localStorage.setItem('training-moves-panel-open', JSON.stringify(movesPanelOpen));
  }, [movesPanelOpen]);

  React.useEffect(() => {
    localStorage.setItem('training-analysis-panel-open', JSON.stringify(analysisPanelOpen));
  }, [analysisPanelOpen]);

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
                {isSharedSession && onToggleInteractiveMode && (
                  <button
                    onClick={() => {
                      console.log('🎮 Button clicked! Current interactiveMode:', interactiveMode);
                      console.log('🎮 Calling onToggleInteractiveMode with:', !interactiveMode);
                      onToggleInteractiveMode(!interactiveMode);
                    }}
                    className={styles.secondaryButton}
                    style={{
                      backgroundColor: interactiveMode ? '#28a745' : '#6c757d',
                      color: 'white',
                      fontWeight: 'var(--font-medium)'
                    }}
                    title={interactiveMode ? 'Students can make moves' : 'Only coach can make moves'}
                  >
                    🎮 Interactive: {interactiveMode ? 'ON' : 'OFF'}
                  </button>
                )}
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
          {isSharedSession && !isCoach && interactiveMode && (
            <div className={styles.statusCard} style={{
              background: '#28a745',
              color: 'white',
              fontWeight: 'var(--font-medium)'
            }}>
              🎮 Interactive Mode
            </div>
          )}
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
              {/* Participants Dropdown (Shared Sessions Only) */}
              {isSharedSession && participants.length > 0 && (
                <div style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  marginBottom: 'var(--space-md)',
                  fontSize: 'var(--text-sm)'
                }}>
                  <button
                    onClick={() => setParticipantsOpen(!participantsOpen)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      padding: 'var(--space-xs)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontWeight: 'var(--font-medium)'
                    }}
                  >
                    <span>👥 {participants.length} Participant{participants.length !== 1 ? 's' : ''}</span>
                    <span>{participantsOpen ? '▲' : '▼'}</span>
                  </button>
                  {participantsOpen && (
                    <ul style={{
                      margin: 'var(--space-xs) 0 0 0',
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
                  )}
                </div>
              )}

              {/* Move Panel - Collapsible */}
              <div style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                marginBottom: 'var(--space-md)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setMovesPanelOpen(!movesPanelOpen)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    padding: 'var(--space-sm) var(--space-md)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 'var(--font-semibold)',
                    fontSize: 'var(--text-sm)',
                    borderRadius: '8px 8px 0 0'
                  }}
                >
                  <span>📝 Moves ({moveHistory.length})</span>
                  <span>{movesPanelOpen ? '▲' : '▼'}</span>
                </button>
                {movesPanelOpen && (
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
                )}
              </div>

              {/* Engine Analysis Panel - Collapsible */}
              <div style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                marginBottom: 'var(--space-md)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setAnalysisPanelOpen(!analysisPanelOpen)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    padding: 'var(--space-sm) var(--space-md)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 'var(--font-semibold)',
                    fontSize: 'var(--text-sm)',
                    borderRadius: '8px 8px 0 0'
                  }}
                >
                  <span>🤖 Engine Analysis</span>
                  <span>{analysisPanelOpen ? '▲' : '▼'}</span>
                </button>
                {analysisPanelOpen && (
                  <AnalysisPanel
                    game={game}
                    position={position}
                    enabled={!reviewMode && isCoach}
                    onPlayMove={handlePlayBestMove}
                  />
                )}
              </div>

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
