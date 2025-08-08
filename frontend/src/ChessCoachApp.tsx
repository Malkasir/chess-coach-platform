import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { AuthenticationForm } from './components/AuthenticationForm';
import { GameLobby } from './components/GameLobby';
import { ActiveGame } from './components/ActiveGame';
import { NotificationBanner } from './components/NotificationBanner';

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
    resetGame,
    makeMove,
    isMyTurn,
    getCurrentTurnDisplay,
    copyRoomCode,
    updateGameField
  } = useGameState(authService, authState.currentUser);

  // Notification state for game invitations
  const [currentInvitation, setCurrentInvitation] = useState<any>(null);

  // Poll for received invitations when authenticated
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.currentUser) return;

    const pollInvitations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:8080/api/invitations/received', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const invitations = await response.json();
          const pendingInvitation = invitations.find((inv: any) => inv.status === 'PENDING');
          
          if (pendingInvitation && (!currentInvitation || currentInvitation.id !== pendingInvitation.id)) {
            setCurrentInvitation(pendingInvitation);
          }
        }
      } catch (error) {
        console.error('Error polling invitations:', error);
      }
    };

    // Poll immediately and then every 10 seconds
    pollInvitations();
    const interval = setInterval(pollInvitations, 10000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.currentUser, currentInvitation?.id]);

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8080/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Invitation accepted:', result);
        setCurrentInvitation(null);
        // The game should be created and the user redirected to it
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8080/api/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('Invitation declined');
        setCurrentInvitation(null);
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
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