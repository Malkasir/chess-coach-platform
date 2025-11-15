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
    role?: string; // Phase 2: Participant role
  }>;
  onCopyRoomCode?: () => void;
  onEndSession?: () => void;
  // Phase 2: Interactive Mode
  interactiveMode?: boolean;
  onToggleInteractiveMode?: (enabled: boolean) => void;
  // Phase 2: Role Assignment
  userRole?: string;
  onAssignRole?: (userId: number, role: string) => void;
  canPlayBothSides?: boolean;
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
  userRole = 'SPECTATOR',
  onAssignRole,
  canPlayBothSides = false,
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

  // Log only when interactive mode or role changes (not on every render)
  React.useEffect(() => {
    if (isSharedSession && !isCoach) {
      console.log('🎮 Student state:', { interactiveMode, userRole, canPlayBothSides, allowBothSides: isCoach || canPlayBothSides });
    }
  }, [isSharedSession, isCoach, interactiveMode, userRole, canPlayBothSides]);

  // Memoize isMyTurn callback to prevent timing issues during rapid state updates
  const isMyTurn = React.useCallback(() => {
    if (reviewMode) return false;
    if (isCoach) return true;
    if (!interactiveMode) return false;
    if (!userRole || userRole === 'SPECTATOR') return false;
    if (userRole === 'BOTH') return true;

    // Check turn-based permissions for WHITE/BLACK roles
    const currentTurn = game.turn();
    if (userRole === 'WHITE') return currentTurn === 'w';
    if (userRole === 'BLACK') return currentTurn === 'b';

    return false;
  }, [reviewMode, isCoach, interactiveMode, userRole, game]);

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
      // Always base the engine move on the current board position to avoid stale state
      const tempGame = new Chess(position);
      const move = tempGame.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: uciMove.length > 4 ? uciMove[4] : undefined
      });

      if (!move) {
        console.warn('Engine suggested an illegal move for the current position', {
          uciMove,
          position
        });
        return;
      }

      // Delegate to parent handler – it will update shared Chess instance + state
      onMove(move.san, tempGame.fen());
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
                    title={
                      interactiveMode
                        ? 'Interactive mode ON - Students can make moves (remember to assign roles!)'
                        : 'Interactive mode OFF - Only coach can make moves. Click to enable and then assign roles to students.'
                    }
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
          {isSharedSession && !isCoach && interactiveMode && userRole === 'SPECTATOR' && (
            <div className={styles.statusCard} style={{
              background: '#ffc107',
              color: '#000',
              fontWeight: 'var(--font-semibold)',
              border: '2px solid #ff9800'
            }}>
              ⚠️ Waiting for coach to assign you a role
            </div>
          )}
          {isSharedSession && !isCoach && interactiveMode && userRole !== 'SPECTATOR' && (
            <div className={styles.statusCard} style={{
              background: '#28a745',
              color: 'white',
              fontWeight: 'var(--font-medium)'
            }}>
              🎮 Interactive Mode
            </div>
          )}
          {isSharedSession && !isCoach && userRole && userRole !== 'SPECTATOR' && (
            <div className={styles.statusCard} style={{
              background: userRole === 'BOTH' ? '#ff9800' : userRole === 'WHITE' ? '#f0f0f0' : '#333',
              color: userRole === 'WHITE' ? '#333' : 'white',
              fontWeight: 'var(--font-semibold)',
              border: userRole === 'WHITE' ? '2px solid #333' : 'none'
            }}>
              🎭 Playing: {userRole === 'BOTH' ? 'Both Colors' : userRole === 'WHITE' ? 'White' : 'Black'}
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
                key={`chessboard-${isCoach}-${canPlayBothSides}-${userRole}`}
                position={position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : position}
                game={game}
                playerColor={
                  // Derive playerColor from user role
                  isCoach || canPlayBothSides ? 'white' : // Coach/BOTH can move both sides
                  userRole === 'BLACK' ? 'black' :
                  'white' // Default for WHITE/SPECTATOR
                }
                isMyTurn={isMyTurn}
                onMove={onMove}
                isTimeExpired={false}
                reviewMode={reviewMode}
                allowBothSides={isCoach || canPlayBothSides}
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
                      {participants.map(participant => {
                        const needsRole = interactiveMode && !participant.isCoach && (!participant.role || participant.role === 'SPECTATOR');
                        return (
                          <li key={participant.id} style={{
                            padding: 'var(--space-xs) var(--space-sm)',
                            marginBottom: 'var(--space-xs)',
                            backgroundColor: needsRole ? '#fff3cd' : 'var(--bg-card)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 'var(--space-sm)',
                            border: needsRole ? '2px solid #ffc107' : 'none'
                          }}>
                            <span style={{
                              color: needsRole ? '#856404' : 'var(--text-primary)',
                              flex: '1 1 auto',
                              fontWeight: needsRole ? 'var(--font-semibold)' : 'normal'
                            }}>
                              {needsRole && '⚠️ '}
                              {participant.firstName} {participant.lastName}
                            </span>
                            {isCoach && !participant.isCoach && onAssignRole && (
                              <select
                                value={participant.role || 'SPECTATOR'}
                                onChange={(e) => onAssignRole(participant.id, e.target.value)}
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  padding: '2px 4px',
                                  backgroundColor: needsRole ? '#fff' : 'var(--bg-secondary)',
                                  color: needsRole ? '#000' : 'var(--text-primary)',
                                  border: needsRole ? '2px solid #ff9800' : '1px solid var(--border-color)',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontWeight: needsRole ? 'var(--font-bold)' : 'normal'
                                }}
                                title={needsRole ? "⚠️ Assign a role for this student to participate!" : "Assign role to this participant"}
                              >
                                <option value="SPECTATOR">👁️ Spectator</option>
                                <option value="WHITE">⚪ White</option>
                                <option value="BLACK">⚫ Black</option>
                                <option value="BOTH">🎭 Both</option>
                              </select>
                            )}
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
                        );
                      })}
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
