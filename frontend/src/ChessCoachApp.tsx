import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { GameService, GameMessage } from './services/game-service';
import { AuthService, User } from './services/auth-service';
import { ChessBoard } from './components/ChessBoard';
// import { TestChessBoard } from './components/TestChessBoard';
// import { AlternativeChessBoard } from './components/AlternativeChessBoard';
import { VideoCall } from './components/VideoCall';

// Extend window interface for our flag
declare global {
  interface Window {
    testUsersInitialized?: boolean;
  }
}

interface ChessCoachAppState {
  gameId: string;
  roomCode: string;
  playerId: string;
  isHost: boolean;
  gameStatus: string;
  position: string;
  playerColor: 'white' | 'black' | null;
  moveHistory: string[];
  currentUser: User | null;
  isAuthenticated: boolean;
  roomCodeInput: string;
  loginEmail: string;
  loginPassword: string;
  loginError: string;
  colorPreference: 'white' | 'black' | 'random';
  isRegistering: boolean;
  registerEmail: string;
  registerPassword: string;
  registerFirstName: string;
  registerLastName: string;
  registerError: string;
}

export const ChessCoachAppReact: React.FC = () => {
  const [state, setState] = useState<ChessCoachAppState>({
    gameId: '',
    roomCode: '',
    playerId: '',
    isHost: false,
    gameStatus: 'disconnected',
    position: 'start',
    playerColor: null,
    moveHistory: [],
    currentUser: null,
    isAuthenticated: false,
    roomCodeInput: '',
    loginEmail: '',
    loginPassword: '',
    loginError: '',
    colorPreference: 'random',
    isRegistering: false,
    registerEmail: '',
    registerPassword: '',
    registerFirstName: '',
    registerLastName: '',
    registerError: ''
  });

  const gameRef = useRef(new Chess());
  const gameServiceRef = useRef(new GameService());
  const authServiceRef = useRef(new AuthService());

  useEffect(() => {
    const gameService = gameServiceRef.current;
    const authService = authServiceRef.current;

    // Inject auth service into game service for authenticated requests
    gameService.setAuthService(authService);

    // Set up game message listener
    gameService.setGameUpdateListener(handleGameMessage);

    // Check authentication state on app load (for browser compatibility)
    const currentUser = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    
    if (currentUser && isAuthenticated) {
      setState(prev => ({
        ...prev,
        currentUser,
        isAuthenticated
      }));
    }

    // Initialize test users
    initializeTestUsers();

    return () => {
      gameService.disconnect();
    };
  }, []);

  const initializeTestUsers = async () => {
    // Check if already initialized to prevent duplicate calls
    const storageKey = 'chess-coach-test-users-initialized';
    if (window.testUsersInitialized || localStorage.getItem(storageKey)) {
      return;
    }
    window.testUsersInitialized = true;
    localStorage.setItem(storageKey, 'true');

    try {
      // Try to create test users (will fail silently if they already exist)
      const testUsers = [
        { id: 4, email: 'user1@test.com', firstName: 'User', lastName: 'One' },
        { id: 5, email: 'user2@test.com', firstName: 'User', lastName: 'Two' }
      ];

      for (const user of testUsers) {
        try {
          const response = await fetch(`${gameServiceRef.current.getBaseUrl()}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              password: 'password123',
              firstName: user.firstName,
              lastName: user.lastName
            })
          });
          
          if (response.ok) {
            console.log(`✅ Created test user: ${user.email}`);
          } else if (response.status === 400) {
            // User already exists, which is fine - suppress repetitive logging
            // console.log(`ℹ️ Test user already exists: ${user.email}`);
          } else {
            console.warn(`⚠️ Unexpected response for ${user.email}:`, response.status);
          }
        } catch (error) {
          // Network error or other issues
          console.warn(`⚠️ Failed to check/create test user ${user.email}:`, error);
        }
      }

      // Check if user is already authenticated
      const currentUser = authServiceRef.current.getCurrentUser();
      const isAuthenticated = authServiceRef.current.isAuthenticated();
      
      setState(prev => ({
        ...prev,
        currentUser,
        isAuthenticated
      }));
    } catch (error) {
      console.error('Failed to initialize test users:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, loginError: '' }));

    try {
      const authResponse = await authServiceRef.current.login({
        email: state.loginEmail,
        password: state.loginPassword
      });

      setState(prev => ({
        ...prev,
        currentUser: authResponse.user,
        isAuthenticated: true,
        loginEmail: '',
        loginPassword: '',
        loginError: ''
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loginError: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, registerError: '' }));

    try {
      const authResponse = await authServiceRef.current.register({
        email: state.registerEmail,
        password: state.registerPassword,
        firstName: state.registerFirstName,
        lastName: state.registerLastName
      });

      setState(prev => ({
        ...prev,
        currentUser: authResponse.user,
        isAuthenticated: true,
        registerEmail: '',
        registerPassword: '',
        registerFirstName: '',
        registerLastName: '',
        registerError: '',
        isRegistering: false
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        registerError: error instanceof Error ? error.message : 'Registration failed'
      }));
    }
  };

  const toggleRegistration = () => {
    setState(prev => ({
      ...prev,
      isRegistering: !prev.isRegistering,
      loginError: '',
      registerError: '',
      loginEmail: '',
      loginPassword: '',
      registerEmail: '',
      registerPassword: '',
      registerFirstName: '',
      registerLastName: ''
    }));
  };

  const handleGameMessage = (message: GameMessage) => {
    console.log('📥 Received game message:', message);
    
    switch (message.type) {
      case 'MOVE':
        if (message.fen && message.move) {
          console.log('♟️ Processing move:', message.move, 'New FEN:', message.fen);
          gameRef.current.load(message.fen);
          setState(prev => ({
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
          setState(prev => ({
            ...prev,
            position: message.fen!,
            moveHistory: message.moveHistory || prev.moveHistory,
            gameStatus: prev.gameStatus === 'waiting' && prev.playerColor ? 'active' : prev.gameStatus
          }));
        }
        break;
      case 'PLAYER_JOINED':
        console.log('👤 Player joined, setting game to active');
        setState(prev => ({ ...prev, gameStatus: 'active' }));
        break;
      case 'ERROR':
        console.error('❌ Game error:', message.message);
        break;
    }
  };

  const createGame = async () => {
    try {
      const hostId = state.currentUser?.id.toString();
      if (!hostId) return;

      const response = await gameServiceRef.current.createGame(hostId, state.colorPreference);
      const { gameId, roomCode, hostColor } = response;

      setState(prev => ({
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
    const guestId = state.currentUser?.id.toString();
    if (!guestId || !state.roomCodeInput) return;

    try {
      const gameState = await gameServiceRef.current.joinGameByCode(state.roomCodeInput, guestId);
      setState(prev => ({
        ...prev,
        playerId: guestId,
        isHost: false,
        gameId: gameState.gameId,
        roomCode: gameState.roomCode || '',
        playerColor: gameState.guestColor,
        moveHistory: [],
        gameStatus: 'active'
      }));

      await gameServiceRef.current.joinGame(gameState.gameId, guestId, false);
    } catch (error) {
      console.error('Failed to join game:', error);
      console.error('Room code attempted:', state.roomCodeInput);
      console.error('Guest ID:', guestId);
    }
  };

  const resetGame = () => {
    gameServiceRef.current.disconnect();
    gameRef.current = new Chess();
    
    setState(prev => ({
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

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(state.roomCode);
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

  const makeMove = (move: string, fen: string) => {
    console.log('📤 Making move:', move, 'New position:', fen);
    
    // Update the game object with the new FEN
    gameRef.current.load(fen);
    
    // Send move to server
    gameServiceRef.current.makeMove(move, fen);
    
    // Update local state
    setState(prev => ({
      ...prev,
      position: fen,
      moveHistory: [...prev.moveHistory, move]
    }));
  };

  const isMyTurn = (): boolean => {
    if (!state.playerColor) return false;
    const currentTurn = gameRef.current.turn() === 'w' ? 'white' : 'black';
    return state.playerColor === currentTurn;
  };

  const getCurrentTurnDisplay = (): string => {
    if (state.gameStatus === 'waiting') {
      return 'Waiting for opponent to join...';
    }
    
    if (state.gameStatus !== 'active' || !state.playerColor) {
      return 'Game not active';
    }
    
    const currentTurn = gameRef.current.turn() === 'w' ? 'white' : 'black';
    const myTurn = state.playerColor === currentTurn;
    
    if (myTurn) {
      return `Your turn (You are ${state.playerColor})`;
    } else {
      return `Opponent's turn (You are ${state.playerColor})`;
    }
  };

  const logout = () => {
    // Reset game state
    resetGame();
    
    // Clear auth state
    authServiceRef.current.logout();
    
    // Reset to initial state
    setState(prev => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false
    }));
    
    // Reload page to show login form
    window.location.reload();
  };

  // Show login form if not authenticated
  if (!state.isAuthenticated) {
    return (
      <div style={styles.app}>
        <header style={styles.header}>
          <h1>Chess Coach Platform</h1>
        </header>
        <div style={styles.loginContainer}>
          {!state.isRegistering ? (
            <form onSubmit={handleLogin} style={styles.loginForm}>
              <h2>Login</h2>
              {state.loginError && (
                <div style={styles.errorMessage}>{state.loginError}</div>
              )}
              <input
                type="email"
                placeholder="Email"
                value={state.loginEmail}
                onChange={(e) => setState(prev => ({ ...prev, loginEmail: e.target.value }))}
                style={styles.input}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={state.loginPassword}
                onChange={(e) => setState(prev => ({ ...prev, loginPassword: e.target.value }))}
                style={styles.input}
                required
              />
              <button type="submit" style={styles.primaryButton}>
                Login
              </button>
              <div style={styles.formToggle}>
                <span>Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={toggleRegistration}
                  style={styles.linkButton}
                >
                  Sign up
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={styles.loginForm}>
              <h2>Create Account</h2>
              {state.registerError && (
                <div style={styles.errorMessage}>{state.registerError}</div>
              )}
              <input
                type="text"
                placeholder="First Name"
                value={state.registerFirstName}
                onChange={(e) => setState(prev => ({ ...prev, registerFirstName: e.target.value }))}
                style={styles.input}
                required
                minLength={2}
                maxLength={50}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={state.registerLastName}
                onChange={(e) => setState(prev => ({ ...prev, registerLastName: e.target.value }))}
                style={styles.input}
                required
                minLength={2}
                maxLength={50}
              />
              <input
                type="email"
                placeholder="Email"
                value={state.registerEmail}
                onChange={(e) => setState(prev => ({ ...prev, registerEmail: e.target.value }))}
                style={styles.input}
                required
              />
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={state.registerPassword}
                onChange={(e) => setState(prev => ({ ...prev, registerPassword: e.target.value }))}
                style={styles.input}
                required
                minLength={8}
              />
              <button type="submit" style={styles.primaryButton}>
                Create Account
              </button>
              <div style={styles.formToggle}>
                <span>Already have an account? </span>
                <button 
                  type="button" 
                  onClick={toggleRegistration}
                  style={styles.linkButton}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>Chess Coach Platform</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {state.currentUser?.firstName} ({state.currentUser?.email})</span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.container}>
        <div style={styles.controlsPanel}>
          {state.gameStatus === 'disconnected' && (
            <>
              <div style={styles.controlsRow}>
                <div style={styles.colorSelection}>
                  <label style={styles.label}>Your Color:</label>
                  <select
                    value={state.colorPreference}
                    onChange={(e) => setState(prev => ({ ...prev, colorPreference: e.target.value as 'white' | 'black' | 'random' }))}
                    style={styles.select}
                  >
                    <option value="random">Random</option>
                    <option value="white">White</option>
                    <option value="black">Black</option>
                  </select>
                </div>
                <button onClick={createGame} style={styles.primaryButton}>
                  Create New Game
                </button>
              </div>
              <div style={styles.controlsRow}>
                <span style={{ margin: '0 1rem' }}>OR</span>
                <input
                  type="text"
                  placeholder="Enter Room Code (ABC123)"
                  maxLength={6}
                  value={state.roomCodeInput}
                  onChange={(e) => setState(prev => ({ ...prev, roomCodeInput: e.target.value }))}
                  style={styles.input}
                />
                <button onClick={joinByRoomCode} style={styles.secondaryButton}>
                  Join Game
                </button>
              </div>
            </>
          )}
          
          {(state.gameStatus === 'waiting' || state.gameStatus === 'active') && (
            <div style={styles.controlsRow}>
              <button onClick={resetGame} style={styles.secondaryButton}>
                New Game
              </button>
              {state.gameStatus === 'waiting' && state.roomCode && (
                <>
                  <input
                    id="room-code-input"
                    type="text"
                    value={state.roomCode}
                    readOnly
                    style={styles.input}
                  />
                  <button id="copy-button" onClick={copyRoomCode} style={styles.secondaryButton}>
                    Copy Code
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div style={styles.statusPanel}>
          <div style={styles.statusCard}>Status: {state.gameStatus}</div>
          {state.roomCode && <div style={styles.statusCard}>Room Code: {state.roomCode}</div>}
          {state.playerColor && <div style={styles.statusCard}>Color: {state.playerColor}</div>}
          {state.gameStatus === 'waiting' && <div style={styles.statusCard}>Share this room code with your opponent!</div>}
        </div>

        <div style={styles.gameArea}>
          <VideoCall gameId={state.gameId} />
          <div style={styles.chessPanel}>
            <div style={styles.turnIndicator}>
              {getCurrentTurnDisplay()}
            </div>
            
            {/* Test boards removed to avoid HTML5 backend conflicts */}
            
            {state.playerColor ? (
              <ChessBoard
                position={state.position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : state.position}
                game={gameRef.current}
                playerColor={state.playerColor}
                isMyTurn={isMyTurn}
                onMove={makeMove}
              />
            ) : (
              <div style={styles.loadingBoard}>
                <div style={styles.loadingText}>
                  {state.gameStatus === 'waiting' ? 'Waiting for opponent...' : 'Initializing chess board...'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: 'transparent',
    color: 'white',
    fontFamily: 'Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: '#ff6b6b',
    border: '1px solid #ff6b6b',
    borderRadius: '20px',
    padding: '0.5rem 1rem',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem'
  },
  controlsPanel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  },
  controlsRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const
  },
  statusPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  statusCard: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #ccc',
    borderRadius: '8px',
    padding: '1rem',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  gameArea: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start'
  },
  chessPanel: {
    flex: 1,
    maxWidth: '500px'
  },
  turnIndicator: {
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center' as const,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)'
  },
  primaryButton: {
    backgroundColor: '#6750a4',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '0.75rem 1.5rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '20px',
    padding: '0.75rem 1.5rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '20px',
    padding: '0.75rem 1rem',
    color: 'white',
    outline: 'none'
  },
  colorSelection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  select: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    padding: '0.5rem',
    color: 'white',
    outline: 'none',
    cursor: 'pointer'
  },
  loadingBoard: {
    width: '450px',
    height: '450px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '12px',
    margin: '0 auto'
  },
  loadingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '1.1rem',
    fontWeight: '500',
    textAlign: 'center' as const
  },
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80vh'
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '2rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    width: '300px'
  },
  errorMessage: {
    color: '#ff6b6b',
    textAlign: 'center' as const
  },
  testCredentials: {
    marginTop: '1rem',
    textAlign: 'center' as const,
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.7)'
  },
  formToggle: {
    textAlign: 'center' as const,
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.8)'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#6750a4',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500'
  }
};