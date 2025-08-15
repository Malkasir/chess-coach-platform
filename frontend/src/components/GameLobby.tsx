import React, { useState } from 'react';
import { User } from '../services/auth-service';
import styles from '../styles/shared.module.css';
import { AppHeader } from './AppHeader';
import { OnlinePlayersList } from './OnlinePlayersList';
import { GameInvitationModal, InvitationData } from './GameInvitationModal';
import { AIPersonalitySelector } from './AIPersonalitySelector';
import { ChessPersonality } from '../types/personality.types';
import { apiClient } from '../services/api-client';
import { debugLog, debugError } from '../utils/debug';

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
  onAIGameStart: (personality: ChessPersonality, userColor: 'white' | 'black' | 'random') => void;
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
  onAIGameStart,
}) => {
  const [showOnlinePlayers, setShowOnlinePlayers] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showAISelector, setShowAISelector] = useState(false);
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
        colorPreference: invitationData.colorPreference.toUpperCase()
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
              <div className={styles.controlsRow}>
                <div className={styles.colorSelection}>
                  <label htmlFor="color-preference" className={styles.label}>Your Color:</label>
                  <select
                    id="color-preference"
                    name="colorPreference"
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
                <button 
                  onClick={() => setShowOnlinePlayers(true)} 
                  className={styles.secondaryButton}
                  style={{ marginLeft: '1rem' }}
                >
                  🟢 Find Players
                </button>
                <button 
                  onClick={() => setShowAISelector(true)} 
                  className={styles.primaryButton}
                  style={{ marginLeft: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  🤖 Play vs AI
                </button>
              </div>
              <div className={styles.controlsRow}>
                <span style={{ margin: '0 1rem' }}>OR</span>
                <label htmlFor="room-code-input" className="sr-only">Enter Room Code</label>
                <input
                  id="room-code-input"
                  name="roomCode"
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
    </div>
  );
};

