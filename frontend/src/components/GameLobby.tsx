import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../services/auth-service';
import styles from '../styles/shared.module.css';
import { AppHeader } from './AppHeader';
import { OnlinePlayersList } from './OnlinePlayersList';
import { GameInvitationModal, InvitationData } from './GameInvitationModal';
import { AIPersonalitySelector } from './AIPersonalitySelector';
import { NewGameModal } from './NewGameModal';
import { JoinGameModal } from './JoinGameModal';
import { LoadPositionModal } from './LoadPositionModal';
import { JoinTrainingSessionModal } from './JoinTrainingSessionModal';
import { ChessPersonality } from '../types/personality.types';
import { TimeControl } from '../types/clock.types';
import { apiClient } from '../services/api-client';
import { debugLog, debugError } from '../utils/debug';

interface GameLobbyProps {
  currentUser: User;
  gameStatus: string;
  roomCode: string;
  onCreateGame: (timeControl: TimeControl, colorPreference: 'white' | 'black' | 'random') => void;
  onJoinByRoomCode: (roomCode: string) => void;
  onResetGame: () => void;
  onCopyRoomCode: () => void;
  onLogout: () => void;
  onAIGameStart: (personality: ChessPersonality, userColor: 'white' | 'black' | 'random') => void;
  onLoadPosition: (fen: string) => void;
  onCreateTrainingSession: () => void;
  onJoinTrainingSession: (roomCode: string) => Promise<void>;
  invitationConnectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  currentUser,
  gameStatus,
  roomCode,
  onCreateGame,
  onJoinByRoomCode,
  onResetGame,
  onCopyRoomCode,
  onLogout,
  onAIGameStart,
  onLoadPosition,
  onCreateTrainingSession,
  onJoinTrainingSession,
  invitationConnectionStatus = 'disconnected',
}) => {
  const { t } = useTranslation(['lobby']);
  const [showOnlinePlayers, setShowOnlinePlayers] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showAISelector, setShowAISelector] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showJoinGameModal, setShowJoinGameModal] = useState(false);
  const [showLoadPositionModal, setShowLoadPositionModal] = useState(false);
  const [showJoinTrainingModal, setShowJoinTrainingModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string } | null>(null);

  const handleInvitePlayer = (playerId: number, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName });
    setShowOnlinePlayers(false);
    setShowInvitationModal(true);
  };

  const handleSendInvitation = async (invitationData: InvitationData) => {
    try {
      const result = await apiClient.sendInvitation({
        senderId: currentUser.id,
        recipientId: invitationData.recipientId,
        type: invitationData.type.toUpperCase(),
        message: invitationData.message,
        colorPreference: invitationData.colorPreference.toUpperCase(),
        gameMode: invitationData.timeControl.mode,
        baseTimeSeconds: invitationData.timeControl.baseTimeSeconds,
        incrementSeconds: invitationData.timeControl.incrementSeconds
      });

      debugLog('Invitation sent successfully:', result);
    } catch (error) {
      debugError('Error sending invitation:', error);
      throw error;
    }
  };

  const handleAIGameStart = (personality: ChessPersonality, userColor: 'white' | 'black' | 'random') => {
    debugLog('🤖 GameLobby: Delegating AI game start to parent:', { personality: personality.name, userColor });
    onAIGameStart(personality, userColor);
  };
  return (
    <div className={styles.app}>
      <AppHeader
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <div className={styles.container}>
        <div className={styles.controlsPanel}>
          {gameStatus === 'disconnected' && (
            <>
              {/* Hero Section - Primary CTAs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-lg)'
              }}>
                <button
                  onClick={() => setShowNewGameModal(true)}
                  className={styles.primaryButton}
                  style={{
                    padding: 'var(--space-lg)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>🎮</span>
                  <span>{t('buttons.new_game')}</span>
                </button>

                <button
                  onClick={() => setShowJoinGameModal(true)}
                  className={styles.secondaryButton}
                  style={{
                    padding: 'var(--space-lg)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>🚪</span>
                  <span>{t('buttons.join_game')}</span>
                </button>

                <button
                  onClick={() => setShowOnlinePlayers(true)}
                  className={styles.secondaryButton}
                  style={{
                    padding: 'var(--space-lg)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>🟢</span>
                  <span>{t('buttons.find_players')}</span>
                </button>

                <button
                  onClick={() => setShowAISelector(true)}
                  className={styles.primaryButton}
                  style={{
                    padding: 'var(--space-lg)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>🤖</span>
                  <span>{t('buttons.play_vs_ai')}</span>
                </button>

                <button
                  onClick={() => setShowLoadPositionModal(true)}
                  className={styles.secondaryButton}
                  style={{
                    padding: 'var(--space-lg)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>📋</span>
                  <span>{t('buttons.load_position')}</span>
                </button>

                <button
                  onClick={onCreateTrainingSession}
                  className={styles.primaryButton}
                  style={{
                    padding: 'var(--space-lg)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>👨‍🏫</span>
                  <span>{t('buttons.start_training')}</span>
                </button>

                <button
                  onClick={() => setShowJoinTrainingModal(true)}
                  className={styles.secondaryButton}
                  style={{
                    padding: 'var(--space-lg)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>🎓</span>
                  <span>{t('buttons.join_training')}</span>
                </button>
              </div>
            </>
          )}

          {(gameStatus === 'waiting' || gameStatus === 'active') && (
            <div className={styles.controlsRow}>
              <button onClick={onResetGame} className={styles.secondaryButton}>
                {t('buttons.new_game')}
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

      {/* Modals */}
      <NewGameModal
        isVisible={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onCreateGame={(timeControl, colorPreference) => {
          onCreateGame(timeControl, colorPreference);
        }}
      />

      <JoinGameModal
        isVisible={showJoinGameModal}
        onClose={() => setShowJoinGameModal(false)}
        onJoinGame={(roomCode) => {
          onJoinByRoomCode(roomCode);
        }}
      />

      <LoadPositionModal
        isOpen={showLoadPositionModal}
        onClose={() => setShowLoadPositionModal(false)}
        onLoadPosition={(fen) => {
          onLoadPosition(fen);
        }}
      />

      <OnlinePlayersList
        currentUserId={currentUser.id}
        onInvitePlayer={handleInvitePlayer}
        isVisible={showOnlinePlayers}
        onClose={() => setShowOnlinePlayers(false)}
      />

      {selectedPlayer && (
        <GameInvitationModal
          isVisible={showInvitationModal}
          playerName={selectedPlayer.name}
          playerId={selectedPlayer.id}
          currentUserId={currentUser.id}
          onSendInvitation={handleSendInvitation}
          onClose={() => {
            setShowInvitationModal(false);
            setSelectedPlayer(null);
          }}
        />
      )}

      <AIPersonalitySelector
        isVisible={showAISelector}
        onClose={() => setShowAISelector(false)}
        onSelectPersonality={handleAIGameStart}
      />

      <JoinTrainingSessionModal
        isVisible={showJoinTrainingModal}
        onClose={() => setShowJoinTrainingModal(false)}
        onJoinSession={onJoinTrainingSession}
      />
    </div>
  );
};

