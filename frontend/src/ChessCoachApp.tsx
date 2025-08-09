import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { AuthenticationForm } from './components/AuthenticationForm';
import { GameLobby } from './components/GameLobby';
import { ActiveGame } from './components/ActiveGame';
import { NotificationBanner } from './components/NotificationBanner';
import { debugError } from './utils/debug';

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
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/invitations/pending/${authState.currentUser.id}`
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
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/invitations/sent/${authState.currentUser.id}`
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
        onMove={makeMove}
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