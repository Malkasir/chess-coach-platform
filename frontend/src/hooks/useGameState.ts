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

  const handleGameMessage = (message: GameMessage) => {
    console.log('📥 Received game message:', message);
    
    switch (message.type) {
      case 'MOVE':
        if (message.fen && message.move) {
          console.log('♟️ Processing move:', message.move, 'New FEN:', message.fen);
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
          console.log('🎲 Loading game state, FEN:', message.fen);
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
        console.log('👤 Player joined, setting game to active');
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
      console.error('Room code attempted:', gameState.roomCodeInput);
      console.error('Guest ID:', guestId);
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
    console.log('📤 Making move:', move, 'New position:', fen);
    
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

  return {
    gameState,
    gameRef: gameRef.current,
    createGame,
    joinByRoomCode,
    resetGame,
    makeMove,
    isMyTurn,
    getCurrentTurnDisplay,
    copyRoomCode,
    updateGameField
  };
};