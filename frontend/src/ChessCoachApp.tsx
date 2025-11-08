import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { useInvitationNotifications, InvitationMessage, InvitationNotificationCallbacks } from './hooks/useInvitationNotifications';
import { AuthenticationForm } from './components/AuthenticationForm';
import { GameLobby } from './components/GameLobby';
import { ActiveGame } from './components/ActiveGame';
import { NotificationBanner } from './components/NotificationBanner';
import { debugError, debugLog } from './utils/debug';
import { ChessPersonality } from './types/personality.types';

export const ChessCoachAppReact: React.FC = () => {
  const {
    authState,
    authService,
    handleLogin,
    handleRegister,
    toggleRegistration,
    logout,
    updateAuthField
  } = useAuth();

  const {
    gameState,
    gameRef,
    createGame,
    joinByRoomCode,
    joinGameFromInvitation,
    resetGame,
    exitGame,
    makeMove,
    isMyTurn,
    getCurrentTurnDisplay,
    copyRoomCode,
    updateGameField
  } = useGameState(authService, authState.currentUser);

  // Notification state for game invitations
  const [currentInvitation, setCurrentInvitation] = useState<any>(null);
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);

  // AI game state
  const [aiGameState, setAiGameState] = useState<any>(null);
  const [aiService, setAiService] = useState<any>(null);

  // Real-time invitation notification callbacks - memoized to prevent reconnection loops
  const invitationCallbacks: InvitationNotificationCallbacks = useMemo(() => ({
    onNewInvitation: (message: InvitationMessage) => {
      debugLog('📨 Received new invitation:', message);

      // Convert the message to the format expected by the UI
      const invitation = {
        id: message.invitationId,
        senderId: message.senderId,
        senderName: message.senderName,
        recipientId: message.recipientId,
        recipientName: message.recipientName,
        type: message.gameType,
        senderColor: message.senderColor,
        message: message.message,
        status: 'PENDING',
        timestamp: message.timestamp
      };

      setCurrentInvitation(invitation);
    },

    onInvitationAccepted: async (message: InvitationMessage) => {
      debugLog('✅ Invitation accepted, joining game:', message);

      if (message.gameId && message.roomCode && authState.currentUser) {
        try {
          // The sender (current user) becomes the host when their invitation is accepted
          let senderColor: 'white' | 'black' = 'white'; // Default sender color
          if (message.senderColor === 'white') {
            senderColor = 'white';
          } else if (message.senderColor === 'black') {
            senderColor = 'black';
          } else {
            // If no preference or random, sender gets white
            senderColor = 'white';
          }

          await joinGameFromInvitation(message.gameId, message.roomCode, senderColor, true);
          debugLog('✅ Successfully joined game from accepted invitation:', message.gameId);
        } catch (error) {
          debugError('❌ Error joining game from accepted invitation:', error);
        }
      }
    },

    onInvitationDeclined: (message: InvitationMessage) => {
      debugLog('❌ Invitation declined:', message);
      // Update sent invitations to reflect the decline
      setSentInvitations(prev =>
        prev.map(inv =>
          inv.id === message.invitationId ? { ...inv, status: 'declined' } : inv
        )
      );
    },

    onInvitationCancelled: (message: InvitationMessage) => {
      debugLog('🚫 Invitation cancelled:', message);
      // Remove the invitation from current invitation if it matches using functional update
      setCurrentInvitation((prev: any) => prev?.id === message.invitationId ? null : prev);
    }
  }), [authState.currentUser, joinGameFromInvitation]);

  // Use real-time invitation notifications instead of polling
  const { connectionStatus } = useInvitationNotifications(
    authState.currentUser?.id?.toString() || null,
    authService,
    invitationCallbacks
  );

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      const response = await authService.authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/invitations/${invitationId}/accept`,
        { 
          method: 'POST',
          body: JSON.stringify({ userId: authState.currentUser!.id })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setCurrentInvitation(null);
        
        // Extract game info and join the created game
        if (result.game && result.game.gameId) {
          // Set player color based on invitation - recipient gets opposite of sender
          let playerColor: 'white' | 'black' = 'black'; // Default recipient color
          if (result.senderColor === 'white') {
            playerColor = 'black';
          } else if (result.senderColor === 'black') {
            playerColor = 'white';
          } else {
            // If sender didn't specify or chose random, recipient gets black
            playerColor = 'black';
          }
          
          // Join game with proper WebSocket connection (recipient/guest)
          await joinGameFromInvitation(result.game.gameId, result.game.roomCode, playerColor, false);
        }
      }
    } catch (error) {
      debugError('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      const response = await authService.authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/invitations/${invitationId}/decline`,
        { 
          method: 'POST',
          body: JSON.stringify({ userId: authState.currentUser!.id })
        }
      );

      if (response.ok) {
        setCurrentInvitation(null);
      }
    } catch (error) {
      debugError('Error declining invitation:', error);
    }
  };

  const handleDismissNotification = () => {
    setCurrentInvitation(null);
  };

  // AI Game Handler
  const handleAIGameStart = async (personality: ChessPersonality, userColor: 'white' | 'black' | 'random') => {
    debugLog('🤖 Starting AI game from ChessCoachApp:', { personality: personality.name, userColor });
    
    try {
      // Import the AI service
      const { getChessAIService } = await import('./services/chess-engine/chess-ai-service');
      const aiServiceInstance = getChessAIService();
      
      // Start the AI game
      const gameState = await aiServiceInstance.startGame({
        personality,
        userColor
      });
      
      debugLog('✅ AI game started successfully:', gameState);
      
      // Set AI game state
      setAiGameState(gameState);
      setAiService(aiServiceInstance);
      
      // Determine actual colors
      const actualUserColor = userColor === 'random' 
        ? (gameState.isAITurn ? 'white' : 'black')
        : userColor;
      
      // Transition to active game state
      updateGameField('gameStatus', 'active');
      updateGameField('position', gameState.chess.fen());
      updateGameField('playerColor', actualUserColor);
      updateGameField('roomCode', `AI-${personality.name.replace(/\s+/g, '')}`);
      
      debugLog('🎮 Transitioned to AI game state:', {
        personality: personality.name,
        userColor: actualUserColor,
        gameActive: gameState.gameActive,
        currentFEN: gameState.chess.fen(),
        isAITurn: gameState.isAITurn
      });

      // If it's AI's turn to start (user chose black), make the first AI move
      if (gameState.isAITurn) {
        debugLog('🤖 AI will make the first move...');
        setTimeout(async () => {
          try {
            const aiMove = await aiServiceInstance.makeAIMove();
            if (aiMove) {
              debugLog('🤖 AI opening move:', aiMove);
              const updatedGameState = aiServiceInstance.getCurrentGame();
              if (updatedGameState) {
                const newFEN = updatedGameState.chess.fen();
                updateGameField('position', newFEN);
                // CRITICAL: Also update the gameRef used by isMyTurn()
                gameRef.load(newFEN);
                debugLog('✅ Game state and gameRef updated after AI opening move', { 
                  newFEN, 
                  turn: gameRef.turn(),
                  isMyTurn: isMyTurn() 
                });
              }
            }
          } catch (error) {
            debugError('❌ AI opening move failed:', error);
          }
        }, 1500); // 1.5 second delay for opening move
      }
      
    } catch (error) {
      debugError('❌ Failed to start AI game:', error);
      alert(`Failed to start AI game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // AI Move Handler - wraps the regular move handler to also trigger AI responses
  const handleAIMove = async (move: string, fen: string, moveObj?: { from: string; to: string; promotion?: string }) => {
    debugLog('🎯 Player move in AI game:', { move, fen, moveObj });
    
    // First, handle the player move normally
    makeMove(move, fen);
    
    // If there's an AI service, update its position and check if AI should move
    if (aiService && aiGameState) {
      try {
        // Update AI service with the new board position
        const positionUpdated = aiService.updatePosition(fen);
        
        debugLog('🔍 Position updated result:', positionUpdated);
        debugLog('🔍 Is AI turn after move?', aiService.isAITurn());
        
        if (positionUpdated && aiService.isAITurn()) {
          debugLog('🤖 AI turn - thinking...');
          
          // Wait a bit for dramatic effect
          const aiTimeout = setTimeout(async () => {
            try {
              const aiMove = await aiService.makeAIMove();
              if (aiMove) {
                debugLog('🤖 AI played:', aiMove);
                
                // Update game state with AI move
                const aiGameState = aiService.getCurrentGame();
                if (aiGameState) {
                  const newFEN = aiGameState.chess.fen();
                  updateGameField('position', newFEN);
                  // CRITICAL: Also update the gameRef used by isMyTurn()
                  gameRef.load(newFEN);
                  debugLog('✅ Game state and gameRef updated after AI move', { 
                    newFEN, 
                    turn: gameRef.turn(),
                    isMyTurn: isMyTurn() 
                  });
                }
              }
            } catch (error) {
              debugError('❌ AI move failed:', error);
            }
          }, 1000); // 1 second delay for AI "thinking"
        }
      } catch (error) {
        debugError('❌ Error processing player move:', error);
      }
    }
  };

  // Show authentication form if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <AuthenticationForm
        isRegistering={authState.isRegistering}
        loginEmail={authState.loginEmail}
        loginPassword={authState.loginPassword}
        loginError={authState.loginError}
        registerEmail={authState.registerEmail}
        registerPassword={authState.registerPassword}
        registerFirstName={authState.registerFirstName}
        registerLastName={authState.registerLastName}
        registerError={authState.registerError}
        onLoginSubmit={handleLogin}
        onRegisterSubmit={handleRegister}
        onToggleRegistration={toggleRegistration}
        onLoginEmailChange={(email) => updateAuthField('loginEmail', email)}
        onLoginPasswordChange={(password) => updateAuthField('loginPassword', password)}
        onRegisterEmailChange={(email) => updateAuthField('registerEmail', email)}
        onRegisterPasswordChange={(password) => updateAuthField('registerPassword', password)}
        onRegisterFirstNameChange={(firstName) => updateAuthField('registerFirstName', firstName)}
        onRegisterLastNameChange={(lastName) => updateAuthField('registerLastName', lastName)}
      />
    );
  }

  // Show game lobby when not in a game
  if (gameState.gameStatus === 'disconnected') {
    return (
      <>
        <GameLobby
          currentUser={authState.currentUser!}
          gameStatus={gameState.gameStatus}
          roomCode={gameState.roomCode}
          onCreateGame={createGame}
          onJoinByRoomCode={joinByRoomCode}
          onResetGame={resetGame}
          onCopyRoomCode={copyRoomCode}
          onLogout={logout}
          onAIGameStart={handleAIGameStart}
          invitationConnectionStatus={connectionStatus}
        />
        <NotificationBanner
          invitation={currentInvitation}
          onAccept={handleAcceptInvitation}
          onDecline={handleDeclineInvitation}
          onDismiss={handleDismissNotification}
        />
      </>
    );
  }

  // Show active game when in a game
  const isAIGame = gameState.roomCode?.startsWith('AI-');
  
  return (
    <>
      <ActiveGame
        currentUser={authState.currentUser!}
        gameId={gameState.gameId}
        roomCode={gameState.roomCode}
        gameStatus={gameState.gameStatus}
        position={gameState.position}
        playerColor={gameState.playerColor}
        game={gameRef}
        clockState={gameState.clockState}
        isMyTurn={isMyTurn}
        getCurrentTurnDisplay={getCurrentTurnDisplay}
        onMove={isAIGame ? handleAIMove : makeMove}
        onResetGame={resetGame}
        onExitGame={exitGame}
        onCopyRoomCode={copyRoomCode}
        onLogout={logout}
      />
      <NotificationBanner
        invitation={currentInvitation}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
        onDismiss={handleDismissNotification}
      />
    </>
  );
};