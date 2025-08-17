import { useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { GameService, GameMessage } from '../services/game-service';
import { AuthService, User } from '../services/auth-service';

interface GameState {
  gameId: string;
  roomCode: string;
  playerId: string;
  isHost: boolean;
  gameStatus: string;
  position: string;
  playerColor: 'white' | 'black' | null;
  moveHistory: string[];
  roomCodeInput: string;
  colorPreference: 'white' | 'black' | 'random';
}

export const useGameState = (authService: AuthService, currentUser: User | null) => {
  const [gameState, setGameState] = useState<GameState>({
    gameId: '',
    roomCode: '',
    playerId: '',
    isHost: false,
    gameStatus: 'disconnected',
    position: 'start',
    playerColor: null,
    moveHistory: [],
    roomCodeInput: '',
    colorPreference: 'random'
  });

  const gameRef = useRef(new Chess());
  const gameServiceRef = useRef(new GameService());

  useEffect(() => {
    const gameService = gameServiceRef.current;

    // Inject auth service into game service for authenticated requests
    gameService.setAuthService(authService);

    // Set up game message listener
    gameService.setGameUpdateListener(handleGameMessage);

    return () => {
      gameService.disconnect();
    };
  }, [authService]);

  // Restore game state on page reload if user is in an active game
  useEffect(() => {
    const restoreGameState = async () => {
      if (!currentUser) return;

      try {
        // Check if user is in an active game
        const response = await authService.authenticatedFetch(
          `${gameServiceRef.current.getBaseUrl()}/api/games/user/${currentUser.id}/current`
        );

        if (response.ok) {
          const activeGame = await response.json();
          if (activeGame && activeGame.gameId) {
            // Check if the game is recent (within last 30 minutes) to avoid resuming very old games
            const gameCreatedAt = new Date(activeGame.createdAt);
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            
            // Only restore if game is recent and user confirms
            if (gameCreatedAt > thirtyMinutesAgo) {
              const shouldResume = window.confirm(
                'You have an active game. Would you like to resume it?\n\n' +
                `Room Code: ${activeGame.roomCode}\n` +
                'Click "Cancel" to start fresh.'
              );
              
              if (shouldResume) {
                // Determine if user is host or guest
                const isHost = activeGame.hostId === currentUser.id;
                const playerColor = isHost ? activeGame.hostColor : activeGame.guestColor;
                
                // Restore game state
                setGameState(prev => ({
                  ...prev,
                  playerId: currentUser.id.toString(),
                  isHost,
                  gameId: activeGame.gameId,
                  roomCode: activeGame.roomCode,
                  playerColor: playerColor?.toLowerCase() as 'white' | 'black',
                  gameStatus: 'active'
                }));

                // Reconnect to WebSocket
                await gameServiceRef.current.joinGame(activeGame.gameId, currentUser.id.toString(), isHost);
              }
            }
          }
        }
      } catch (error) {
        // Silently ignore - no active game to restore
      }
    };

    if (currentUser && authService && gameState.gameStatus === 'disconnected') {
      restoreGameState();
    }
  }, [currentUser, authService]);

  const handleGameMessage = (message: GameMessage) => {
    switch (message.type) {
      case 'MOVE':
        if (message.fen && message.move) {
          gameRef.current.load(message.fen);
          setGameState(prev => ({
            ...prev,
            position: message.fen!,
            moveHistory: message.moveHistory || [...prev.moveHistory, message.move!]
          }));
        }
        break;
      case 'GAME_STATE':
        if (message.fen) {
          gameRef.current.load(message.fen);
          setGameState(prev => ({
            ...prev,
            position: message.fen!,
            moveHistory: message.moveHistory || prev.moveHistory,
            gameStatus: prev.gameStatus === 'waiting' && prev.playerColor ? 'active' : prev.gameStatus
          }));
        }
        break;
      case 'PLAYER_JOINED':
        setGameState(prev => ({ ...prev, gameStatus: 'active' }));
        break;
      case 'ERROR':
        console.error('❌ Game error:', message.message);
        break;
    }
  };

  const createGame = async () => {
    try {
      const hostId = currentUser?.id.toString();
      if (!hostId) return;

      const response = await gameServiceRef.current.createGame(hostId, gameState.colorPreference);
      const { gameId, roomCode, hostColor } = response;

      setGameState(prev => ({
        ...prev,
        playerId: hostId,
        isHost: true,
        gameId,
        roomCode,
        playerColor: hostColor as 'white' | 'black',
        moveHistory: [],
        gameStatus: 'waiting'
      }));

      await gameServiceRef.current.joinGame(gameId, hostId, true);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const joinByRoomCode = async () => {
    const guestId = currentUser?.id.toString();
    if (!guestId || !gameState.roomCodeInput) return;

    try {
      const gameStateResponse = await gameServiceRef.current.joinGameByCode(gameState.roomCodeInput, guestId);
      setGameState(prev => ({
        ...prev,
        playerId: guestId,
        isHost: false,
        gameId: gameStateResponse.gameId,
        roomCode: gameStateResponse.roomCode || '',
        playerColor: gameStateResponse.guestColor,
        moveHistory: [],
        gameStatus: 'active'
      }));

      await gameServiceRef.current.joinGame(gameStateResponse.gameId, guestId, false);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const resetGame = () => {
    gameServiceRef.current.disconnect();
    gameRef.current = new Chess();
    
    setGameState(prev => ({
      ...prev,
      gameId: '',
      roomCode: '',
      playerId: '',
      isHost: false,
      gameStatus: 'disconnected',
      position: 'start',
      playerColor: null,
      moveHistory: [],
      roomCodeInput: ''
    }));
  };

  const makeMove = (move: string, fen: string) => {
    // Update the game object with the new FEN
    gameRef.current.load(fen);
    
    // Send move to server
    gameServiceRef.current.makeMove(move, fen);
    
    // Update local state
    setGameState(prev => ({
      ...prev,
      position: fen,
      moveHistory: [...prev.moveHistory, move]
    }));
  };

  const isMyTurn = (): boolean => {
    if (!gameState.playerColor) return false;
    const currentTurn = gameRef.current.turn() === 'w' ? 'white' : 'black';
    return gameState.playerColor === currentTurn;
  };

  const getCurrentTurnDisplay = (): string => {
    if (gameState.gameStatus === 'waiting') {
      return 'Waiting for opponent to join...';
    }
    
    if (gameState.gameStatus === 'connecting') {
      return 'Connecting to game...';
    }
    
    if (gameState.gameStatus !== 'active' || !gameState.playerColor) {
      return 'Game not active';
    }
    
    const currentTurn = gameRef.current.turn() === 'w' ? 'white' : 'black';
    const myTurn = gameState.playerColor === currentTurn;
    
    if (myTurn) {
      return `Your turn (You are ${gameState.playerColor})`;
    } else {
      return `Opponent's turn (You are ${gameState.playerColor})`;
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(gameState.roomCode);
      console.log('Room code copied to clipboard!');
      // Provide visual feedback - temporarily change button text
      const button = document.querySelector('#copy-button') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.backgroundColor = '#4caf50';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to copy room code:', error);
      // Fallback: select the text for manual copying
      const input = document.querySelector('#room-code-input') as HTMLInputElement;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
      }
    }
  };

  const updateGameField = (field: keyof GameState, value: string) => {
    setGameState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const joinGameFromInvitation = async (gameId: string, roomCode: string, playerColor: 'white' | 'black', isHost: boolean = false) => {
    try {
      const playerId = currentUser?.id.toString();
      if (!playerId) return;

      setGameState(prev => ({
        ...prev,
        playerId,
        isHost,
        gameId,
        roomCode,
        playerColor,
        gameStatus: 'connecting'
      }));

      // Connect to WebSocket for real-time updates
      await gameServiceRef.current.joinGame(gameId, playerId, isHost);
      
      // Wait a moment to ensure WebSocket subscription is established
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          gameStatus: 'active'
        }));
      }, 1000);
      
    } catch (error) {
      console.error('Failed to join game from invitation:', error);
      setGameState(prev => ({
        ...prev,
        gameStatus: 'disconnected'
      }));
    }
  };

  const exitGame = async () => {
    try {
      // Disconnect from WebSocket
      gameServiceRef.current.disconnect();
      
      // Reset game state
      setGameState(prev => ({
        ...prev,
        gameId: '',
        roomCode: '',
        playerId: '',
        isHost: false,
        gameStatus: 'disconnected',
        position: 'start',
        playerColor: null,
        moveHistory: []
      }));
      
      // Reset chess engine
      gameRef.current = new Chess();
      
    } catch (error) {
      console.error('Error exiting game:', error);
    }
  };

  return {
    gameState,
    gameRef: gameRef.current,
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
  };
};