import { useState, useRef, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { GameService, GameMessage } from '../services/game-service';
import { AuthService, User } from '../services/auth-service';
import { ClockState, TimeControl } from '../types/clock.types';

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
  clockState: ClockState | null;
  // NEW: Navigation state for move review
  reviewMode: boolean;
  reviewIndex: number; // -1 = live position, 0+ = reviewing that ply
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
    colorPreference: 'random',
    clockState: null,
    // NEW: Navigation state initialization
    reviewMode: false,
    reviewIndex: -1
  });

  const gameRef = useRef(new Chess());
  const gameServiceRef = useRef<GameService | null>(null);

  // Lazy initialization of GameService
  if (!gameServiceRef.current) {
    gameServiceRef.current = new GameService();
  }

  const handleGameMessage = useCallback((message: GameMessage) => {
    switch (message.type) {
      case 'MOVE':
        if (message.fen && message.move) {
          const fen = message.fen; // Capture for TypeScript type narrowing
          setGameState(prev => {
            // If in review mode, only update moveHistory but keep review position
            if (prev.reviewMode) {
              return {
                ...prev,
                moveHistory: message.moveHistory || [...prev.moveHistory, message.move!],
                clockState: message.clockState || prev.clockState
              };
            }

            // Not in review mode - update position normally
            gameRef.current.load(fen);
            return {
              ...prev,
              position: fen,
              moveHistory: message.moveHistory || [...prev.moveHistory, message.move!],
              clockState: message.clockState || prev.clockState
            };
          });
        }
        break;
      case 'GAME_STATE':
        if (message.fen) {
          const fen = message.fen; // Capture for TypeScript type narrowing
          setGameState(prev => {
            // If in review mode, only update moveHistory but keep review position
            if (prev.reviewMode) {
              return {
                ...prev,
                moveHistory: message.moveHistory || prev.moveHistory,
                clockState: message.clockState || prev.clockState
              };
            }

            // Not in review mode - update position normally
            gameRef.current.load(fen);
            return {
              ...prev,
              position: fen,
              moveHistory: message.moveHistory || prev.moveHistory,
              gameStatus: prev.gameStatus === 'waiting' && prev.playerColor ? 'active' : prev.gameStatus,
              clockState: message.clockState || prev.clockState
            };
          });
        }
        break;
      case 'PLAYER_JOINED':
        setGameState(prev => ({
          ...prev,
          gameStatus: 'active',
          clockState: message.clockState || prev.clockState
        }));
        break;
      case 'GAME_OVER':
        console.log('🏁 Game over:', message.message);

        // Show user-friendly notification for game over
        if (message.message) {
          // Check if it's a timeout message
          const isTimeout = message.message.toLowerCase().includes('time');
          const alertMessage = isTimeout
            ? `⏰ Time's Up!\n\n${message.message}`
            : `🏁 Game Over\n\n${message.message}`;

          setTimeout(() => alert(alertMessage), 100);
        }

        setGameState(prev => ({
          ...prev,
          gameStatus: 'ended',
          clockState: message.clockState || prev.clockState
        }));
        break;
      case 'ERROR':
        console.error('❌ Game error:', message.message);
        break;
    }
  }, []);

  useEffect(() => {
    const gameService = gameServiceRef.current;
    if (!gameService) return;

    // Inject auth service into game service for authenticated requests
    gameService.setAuthService(authService);

    // Set up game message listener BEFORE any connection attempts
    gameService.setGameUpdateListener(handleGameMessage);

    // DO NOT disconnect on cleanup - preserve connection for game flow
    // Only disconnect when explicitly leaving a game
  }, [authService, handleGameMessage]);

  // Restore game state on page reload if user is in an active game
  useEffect(() => {
    const restoreGameState = async () => {
      if (!currentUser) return;

      try {
        // Check if user is in an active game
        const response = await authService.authenticatedFetch(
          `${gameServiceRef.current?.getBaseUrl()}/api/games/user/${currentUser.id}/current`
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
                await gameServiceRef.current?.joinGame(activeGame.gameId, currentUser.id.toString(), isHost);
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
  }, [currentUser, authService, gameState.gameStatus]);

  const createGame = async (timeControl: TimeControl, colorPreference: 'white' | 'black' | 'random' = 'random') => {
    try {
      const hostId = currentUser?.id.toString();
      if (!hostId) return;

      const response = await gameServiceRef.current?.createGame(
        hostId,
        colorPreference,
        timeControl
      );
      if (!response) return;
      const { gameId, roomCode, hostColor } = response;

      setGameState(prev => ({
        ...prev,
        playerId: hostId,
        isHost: true,
        gameId,
        roomCode,
        playerColor: hostColor as 'white' | 'black',
        moveHistory: [],
        gameStatus: 'waiting',
        clockState: null, // Will be populated when WebSocket connects
        colorPreference, // Update color preference in state
        // Reset navigation state when creating new game
        reviewMode: false,
        reviewIndex: -1
      }));

      await gameServiceRef.current?.joinGame(gameId, hostId, true);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const joinByRoomCode = async (roomCode: string) => {
    const guestId = currentUser?.id.toString();
    if (!guestId || !roomCode) return;

    try {
      const gameStateResponse = await gameServiceRef.current?.joinGameByCode(roomCode, guestId);
      if (!gameStateResponse) return;

      setGameState(prev => ({
        ...prev,
        playerId: guestId,
        isHost: false,
        gameId: gameStateResponse.gameId,
        roomCode: gameStateResponse.roomCode || roomCode,
        roomCodeInput: '', // Clear the input after successful join
        playerColor: gameStateResponse.guestColor,
        moveHistory: [],
        gameStatus: 'active',
        // Reset navigation state when joining game
        reviewMode: false,
        reviewIndex: -1
      }));

      await gameServiceRef.current?.joinGame(gameStateResponse.gameId, guestId, false);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const resetGame = () => {
    gameServiceRef.current?.disconnect();
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
      roomCodeInput: '',
      // Reset navigation state
      reviewMode: false,
      reviewIndex: -1
    }));
  };

  const makeMove = (move: string, fen: string) => {
    // Update the game object with the new FEN
    gameRef.current.load(fen);
    
    // Send move to server
    gameServiceRef.current?.makeMove(move, fen);
    
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
        gameStatus: 'connecting',
        // Reset navigation state when joining from invitation
        reviewMode: false,
        reviewIndex: -1
      }));

      // Connect to WebSocket for real-time updates
      await gameServiceRef.current?.joinGame(gameId, playerId, isHost);
      
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
      // Notify backend that user is leaving the game
      if (gameState.gameId && gameState.playerId) {
        await gameServiceRef.current?.leaveGame(gameState.gameId, gameState.playerId);
      }

      // Disconnect from WebSocket
      gameServiceRef.current?.disconnect();

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
        moveHistory: [],
        // Reset navigation state
        reviewMode: false,
        reviewIndex: -1
      }));

      // Reset chess engine
      gameRef.current = new Chess();

    } catch (error) {
      console.error('Error exiting game:', error);
    }
  };

  // Navigation functions for move review
  const navigateToMove = useCallback((index: number) => {
    if (gameState.clockState?.gameMode !== 'TRAINING') {
      console.warn('Navigation only available in training mode');
      return;
    }

    // Reconstruct position by replaying moves up to index
    const reviewGame = new Chess();
    for (let i = 0; i <= index && i < gameState.moveHistory.length; i++) {
      reviewGame.move(gameState.moveHistory[i]);
    }

    // Update gameRef for consistency
    gameRef.current.load(reviewGame.fen());

    // Update state with navigation position
    setGameState(prev => ({
      ...prev,
      reviewMode: true,
      reviewIndex: index,
      position: reviewGame.fen()
    }));
  }, [gameState.moveHistory, gameState.clockState]);

  const navigateBack = useCallback(() => {
    // Special case: if at live position (-1), jump to last move
    if (gameState.reviewIndex === -1) {
      const lastMoveIndex = gameState.moveHistory.length - 1;
      if (lastMoveIndex >= 0) {
        navigateToMove(lastMoveIndex);
      }
      return;
    }

    // Otherwise, step back one move
    const newIndex = gameState.reviewIndex - 1;
    if (newIndex >= -1) {
      navigateToMove(newIndex);
    }
  }, [gameState.reviewIndex, gameState.moveHistory.length, navigateToMove]);

  const navigateForward = useCallback(() => {
    const newIndex = gameState.reviewIndex + 1;
    if (newIndex < gameState.moveHistory.length) {
      navigateToMove(newIndex);
    }
  }, [gameState.reviewIndex, gameState.moveHistory.length, navigateToMove]);

  const navigateToStart = useCallback(() => {
    navigateToMove(-1); // -1 = starting position
  }, [navigateToMove]);

  const navigateToEnd = useCallback(() => {
    // Exit review mode and return to live position
    const liveGame = new Chess();
    gameState.moveHistory.forEach(move => liveGame.move(move));
    gameRef.current.load(liveGame.fen());

    setGameState(prev => ({
      ...prev,
      reviewMode: false,
      reviewIndex: -1,
      position: liveGame.fen()
    }));
  }, [gameState.moveHistory]);

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
    updateGameField,
    // NEW: Navigation functions
    navigateToMove,
    navigateBack,
    navigateForward,
    navigateToStart,
    navigateToEnd
  };
};