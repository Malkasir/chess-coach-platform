import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
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

  // Poll for received invitations when authenticated
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.currentUser) {
      console.log('🔒 Skipping invitation polling - not authenticated:', { isAuthenticated: authState.isAuthenticated, hasUser: !!authState.currentUser });
      return;
    }

    console.log('✅ Starting invitation polling - user authenticated:', authState.currentUser.email);

    const pollInvitations = async () => {
      try {
        // Use the authService to make authenticated requests
        const response = await authService.authenticatedFetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/invitations/pending/${authState.currentUser?.id}`
        );

        if (response.ok) {
          const invitations = await response.json();
          console.log('📨 Raw invitations data:', invitations);
          
          const pendingInvitation = invitations.find((inv: any) => inv.status === 'PENDING' || inv.status === 'pending');
          console.log('📨 Found pending invitation:', pendingInvitation);
          
          if (pendingInvitation && (!currentInvitation || currentInvitation.id !== pendingInvitation.id)) {
            console.log('📨 Setting current invitation:', pendingInvitation);
            setCurrentInvitation(pendingInvitation);
          } else {
            console.log('📨 No new invitation to display:', { 
              hasPending: !!pendingInvitation, 
              currentId: currentInvitation?.id,
              pendingId: pendingInvitation?.id 
            });
          }
        } else {
          console.warn('⚠️ Invitation polling failed:', response.status, response.statusText);
        }
      } catch (error) {
        debugError('Error polling invitations:', error);
      }
    };

    // Poll immediately and then every 15 seconds (reduced frequency)
    pollInvitations();
    const interval = setInterval(pollInvitations, 15000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.currentUser, currentInvitation?.id]);

  // Poll for sent invitations to check if they've been accepted
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.currentUser) {
      return;
    }

    const pollSentInvitations = async () => {
      try {
        const response = await authService.authenticatedFetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/invitations/sent/${authState.currentUser?.id}`
        );

        if (response.ok) {
          const invitations = await response.json();
          console.log('📤 Sent invitations:', invitations);
          
          // Check if any previously pending invitations are now accepted
          const acceptedInvitations = invitations.filter((inv: any) => 
            inv.status === 'accepted' && 
            !sentInvitations.find(sent => sent.id === inv.id && sent.status === 'accepted')
          );
          
          if (acceptedInvitations.length > 0) {
            console.log('🎉 Found accepted invitations:', acceptedInvitations);
            
            // Use the game info returned by the backend for accepted invitations
            for (const invitation of acceptedInvitations) {
              if (invitation.game && invitation.game.gameId) {
                console.log('🎮 Sender joining the same game:', invitation.game);
                
                // Set sender color - they get what they requested or default white
                let senderColor: 'white' | 'black' = 'white'; // Default sender color
                if (invitation.senderColor === 'white') {
                  senderColor = 'white';
                } else if (invitation.senderColor === 'black') {
                  senderColor = 'black';
                } else {
                  // If no preference or random, sender gets white
                  senderColor = 'white';
                }
                
                console.log('🎨 Sender color assignment:', {
                  requestedColor: invitation.senderColor,
                  assignedColor: senderColor
                });
                
                // Join game with proper WebSocket connection (sender/host)
                await joinGameFromInvitation(invitation.game.gameId, invitation.game.roomCode, senderColor, true);
                
                console.log('✅ Sender successfully joined game');
                break; // Only join the first game
              }
            }
          }
          
          setSentInvitations(invitations);
        }
      } catch (error) {
        debugError('Error polling sent invitations:', error);
      }
    };

    // Poll every 15 seconds for sent invitation updates (reduced frequency)
    const interval = setInterval(pollSentInvitations, 15000);
    pollSentInvitations(); // Poll immediately

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.currentUser]);

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
        console.log('Invitation accepted:', result);
        setCurrentInvitation(null);
        
        // Extract game info and join the created game
        if (result.game && result.game.gameId) {
          console.log('🎮 Recipient joining created game:', result.game);
          console.log('🎯 Game details:', {
            gameId: result.game.gameId,
            roomCode: result.game.roomCode,
            senderColor: result.senderColor,
            recipientWillBe: result.senderColor === 'white' ? 'black' : result.senderColor === 'black' ? 'white' : 'random'
          });
          
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
          
          console.log('🎨 Recipient color assignment:', {
            senderColor: result.senderColor,
            recipientColor: playerColor
          });
          
          // Join game with proper WebSocket connection (recipient/guest)
          await joinGameFromInvitation(result.game.gameId, result.game.roomCode, playerColor, false);
          
          console.log('✅ Recipient successfully joined game');
          
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
        console.log('Invitation declined');
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
                updateGameField('position', updatedGameState.chess.fen());
                debugLog('✅ Game state updated after AI opening move');
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
          setTimeout(async () => {
            try {
              const aiMove = await aiService.makeAIMove();
              if (aiMove) {
                debugLog('🤖 AI played:', aiMove);
                
                // Update game state with AI move
                const aiGameState = aiService.getCurrentGame();
                if (aiGameState) {
                  updateGameField('position', aiGameState.chess.fen());
                  debugLog('✅ Game state updated after AI move');
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
          roomCodeInput={gameState.roomCodeInput}
          colorPreference={gameState.colorPreference}
          onCreateGame={createGame}
          onJoinByRoomCode={joinByRoomCode}
          onResetGame={resetGame}
          onCopyRoomCode={copyRoomCode}
          onLogout={logout}
          onRoomCodeInputChange={(code) => updateGameField('roomCodeInput', code)}
          onColorPreferenceChange={(color) => updateGameField('colorPreference', color)}
          onAIGameStart={handleAIGameStart}
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