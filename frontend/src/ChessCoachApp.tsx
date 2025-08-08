import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameState } from './hooks/useGameState';
import { AuthenticationForm } from './components/AuthenticationForm';
import { GameLobby } from './components/GameLobby';
import { ActiveGame } from './components/ActiveGame';

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
    );
  }

  // Show active game when in a game
  return (
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
  );
};