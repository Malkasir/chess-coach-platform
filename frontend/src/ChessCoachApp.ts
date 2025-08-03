import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Chess } from 'chess.js';
import './components/video-call.js';
import './components/theme-selector.js';
import './components/auth-form.js';
import 'chessboard-element';
import { GameService, GameMessage } from './services/game-service.js';
import { ThemeService, ThemeConfiguration } from './services/theme-service.js';
import { AuthService, User } from './services/auth-service.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

@customElement('chess-coach-app')
export class ChessCoachApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);
      min-height: 100vh;
      font-family: 'Roboto', sans-serif;
    }

    main {
      padding: 1rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: var(--md-sys-color-surface-container);
    }

    header h1 {
      font-size: 1.5rem;
      margin: 0;
    }

    .controls-panel {
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .controls-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .status-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .status-card {
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 8px;
      padding: 1rem;
    }

    .game-area {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .chess-panel {
      flex: 1;
      max-width: 500px;
    }

    chess-board {
      width: 100%;
      max-width: 500px;
      height: auto;
      aspect-ratio: 1 / 1;
    }

    video-call {
      width: 400px;
      height: 300px;
    }

    @media (max-width: 900px) {
      .game-area {
        flex-direction: column;
        align-items: center;
      }
    }

    .turn-indicator {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
      font-weight: 500;
    }

    .turn-indicator.your-turn {
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }

    .turn-indicator.opponent-turn {
      background-color: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    .turn-indicator.waiting {
      background-color: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
    }

    .move-history {
      margin-top: 1rem;
      padding: 1rem;
      background-color: var(--md-sys-color-surface-container-lowest);
      border-radius: 8px;
    }
  `;

  @property({ type: String }) header = 'Chess Coach Platform';

  private game = new Chess();
  private gameService = new GameService();
  private themeService = new ThemeService();
  private authService = new AuthService();

  @state() private gameId: string = '';
  @state() private roomCode: string = '';
  @state() private inputRoomCode: string = '';
  @state() private playerId: string = '';
  @state() private isCoach: boolean = false;
  @state() private gameStatus: string = 'disconnected';
  @state() private position: string = 'start';
  @state() private playerColor: 'white' | 'black' | null = null;
  @state() private moveHistory: string[] = [];
  @state() private showThemeSelector: boolean = false;
  @state() private currentUser: User | null = null;
  @state() private isAuthenticated = false;

  connectedCallback() {
    super.connectedCallback();
    this.gameService.setGameUpdateListener(this.handleGameMessage.bind(this));
    this.themeService.addThemeChangeListener(this.handleThemeChange.bind(this));
    this.authService.addAuthChangeListener(this.handleAuthChange.bind(this));
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
    this.applyThemes();
  }

  firstUpdated() {
    super.firstUpdated();
    this.setupChessBoard();
    this.applyThemes();
  }

  updated() {
    super.updated();
    this.setupChessBoard();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.gameService.disconnect();
    this.themeService.removeThemeChangeListener(this.handleThemeChange.bind(this));
    this.authService.removeAuthChangeListener(this.handleAuthChange.bind(this));
  }

  private handleGameMessage(message: GameMessage) {
    console.log('Received game message:', message);
    
    switch (message.type) {
      case 'MOVE':
        if (message.fen && message.move) {
          this.game.load(message.fen);
          this.position = message.fen;
          
          // Add the move to our history if it's not already there
          if (!this.moveHistory.includes(message.move)) {
            this.moveHistory = [...this.moveHistory, message.move];
          } else {
          }
          
          this.updateBoardPosition();
        }
        break;
      case 'GAME_STATE':
        if (message.fen) {
          this.game.load(message.fen);
          this.position = message.fen;
          
          // Use move history from server if available, otherwise keep current
          if (message.moveHistory) {
            this.moveHistory = [...message.moveHistory];
          }
          
          // If we're waiting and we have a player color, the game is probably active
          if (this.gameStatus === 'waiting' && this.playerColor) {
            this.gameStatus = 'active';
          }
          
          this.updateBoardPosition();
        }
        break;
      case 'PLAYER_JOINED':
        this.gameStatus = 'active';
        break;
      case 'ERROR':
        console.error('Game error:', message.message);
        // If it was an invalid move, revert to last known good position
        if (message.message?.includes('Invalid move')) {
          this.updateBoardPosition();
          // Show user feedback about invalid move
        }
        break;
    }
    this.requestUpdate();
  }

  private handleThemeChange() {
    this.applyThemes();
    this.requestUpdate();
  }

  private updateBoardPosition() {
    const board = this.querySelector('chess-board');
    if (board && this.position) {
      board.setPosition(this.position);
    }
  }

  private async createGame() {
    try {
      const coachId = this.currentUser?.id.toString();
      if (!coachId) {
        console.error('No coach ID found');
        return;
      }

      this.playerId = coachId;
      this.isCoach = true;
      
      const { gameId, roomCode, coachColor } = await this.gameService.createGame(coachId);
      this.gameId = gameId;
      this.roomCode = roomCode;
      this.playerColor = coachColor as 'white' | 'black';
      this.moveHistory = []; // Reset move history for new game
      
      await this.gameService.joinGame(gameId, coachId, true);
      this.gameStatus = 'waiting';
      
      // Periodically check if student has joined
      const checkForStudent = async () => {
        try {
          const gameState = await this.gameService.getGameState(gameId);
          if (gameState.studentId && this.gameStatus === 'waiting') {
            this.gameStatus = 'active';
            this.requestUpdate();
          }
        } catch (error) {
          console.log('Game state check failed:', error);
        }
      };
      
      // Check every 2 seconds for 30 seconds
      const checkInterval = setInterval(() => {
        if (this.gameStatus === 'active') {
          clearInterval(checkInterval);
          return;
        }
        checkForStudent();
      }, 2000);
      
      setTimeout(() => clearInterval(checkInterval), 30000);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  }

  private async joinByRoomCode() {
    try {
      const studentId = this.currentUser?.id.toString();
      if (!studentId) {
        console.error('No student ID found');
        return;
      }
      
      this.playerId = studentId;
      this.isCoach = false;
      
      const gameState = await this.gameService.joinGameByCode(this.inputRoomCode, studentId);
      this.gameId = gameState.gameId;
      this.roomCode = gameState.roomCode;
      this.playerColor = gameState.studentColor;
      this.moveHistory = []; // Reset move history when joining
      
      // Join WebSocket for real-time updates
      await this.gameService.joinGame(gameState.gameId, studentId, false);
      this.gameStatus = 'active';
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  }

  private resetGame() {
    // Disconnect from current game
    this.gameService.disconnect();
    
    // Reset all game state
    this.gameId = '';
    this.roomCode = '';
    this.inputRoomCode = '';
    this.playerId = '';
    this.isCoach = false;
    this.gameStatus = 'disconnected';
    this.position = 'start';
    this.playerColor = null;
    this.moveHistory = [];
    
    // Reset chess game to starting position
    this.game = new Chess();
    this.position = this.game.fen();
    this.updateBoardPosition();
  }

  private async copyRoomCode() {
    try {
      await navigator.clipboard.writeText(this.roomCode);
      // You could add a toast notification here
      console.log('Room code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  }

  private setupChessBoard() {
    const board = this.querySelector('chess-board');
    if (!board) return;

    // Clear any existing listeners to avoid duplicates
    board.removeEventListener('drag-start', this.handleDragStart);
    board.removeEventListener('drop', this.handleDrop);

    // Add move validation listeners using the working implementation from main
    board.addEventListener('drag-start', this.handleDragStart.bind(this));
    board.addEventListener('drop', this.handleDrop.bind(this));
  }

  private handleDragStart(e: any) {
    const { source, piece } = e.detail;

    // 1️⃣ Do not allow dragging pieces of the wrong color
    const pieceColor = piece.startsWith('w') ? 'white' : 'black';
    if (this.playerColor !== pieceColor) {
      e.preventDefault();
      return;
    }

    // 2️⃣ allow only the side to move
    const turn = this.game.turn();
    if ((turn === 'w' && piece.startsWith('b')) ||
        (turn === 'b' && piece.startsWith('w'))) {
      e.preventDefault();
      return;
    }

    // 3️⃣ deny pickup if the piece has no legal moves
    const moves = this.game.moves({ square: source, verbose: true });
    if (moves.length === 0) e.preventDefault();
  }

  private handleDrop(e: any) {
    const { source, target, setAction } = e.detail;

    // Check if it's the player's turn first
    if (!this.isMyTurn()) {
      setAction('snapback');
      console.warn('❌ Not your turn');
      
      // Force the board to reset to current position after snapback animation
      setTimeout(() => {
        this.updateBoardPosition();
      }, 200);
      return;
    }

    // Store the current position before attempting the move
    const originalPosition = this.game.fen();

    // Try to validate the move with chess.js (wrapped in try-catch)
    let move;
    try {
      move = this.game.move({ from: source, to: target, promotion: 'q' });
    } catch (error) {
      // chess.js threw an error - this means invalid move
      console.warn('❌ Chess.js threw error for move:', { from: source, to: target }, (error as Error).message);
      setAction('snapback');
      
      // Force the board to reset to correct position after snapback animation
      setTimeout(() => {
        this.updateBoardPosition();
      }, 200);
      return;
    }

    if (move === null) {
      // Move is illegal - snap back immediately
      setAction('snapback');
      console.warn('❌ Illegal move attempted');
      
      // Ensure the local game state is correct
      this.game.load(originalPosition);
      
      // Force the board to reset to correct position after snapback animation
      setTimeout(() => {
        this.updateBoardPosition();
      }, 200);
      return;
    }

    // Move is legal! Send to server with the new FEN
    const newFen = this.game.fen();
    console.log('✅ Legal move validated:', move.san, 'New FEN:', newFen);
    this.gameService.makeMove(move.san, newFen);
    
    // Update our local position (optimistic update)
    this.position = newFen;
    this.moveHistory = [...this.moveHistory, move.san];
    this.updateBoardPosition();
  }

  private flipBoard() {
    const board = this.querySelector('chess-board');
    if (board) {
      board.orientation = board.orientation === 'white' ? 'black' : 'white';
    }
  }

  private isMyTurn(): boolean {
    if (!this.playerColor) return false;
    const currentTurn = this.game.turn() === 'w' ? 'white' : 'black';
    return this.playerColor === currentTurn;
  }

  private getCurrentTurnDisplay(): string {
    // ... (display logic remains the same)
    return '';
  }

  private getTurnIndicatorClass(): string {
    if (this.gameStatus !== 'active') return 'waiting';
    return this.isMyTurn() ? 'your-turn' : 'opponent-turn';
  }

  private renderMoveHistory() {
    // ... (move history rendering remains the same)
    return html``;
  }

  private applyThemes() {
    const styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = this.themeService.generateAppCSS() + this.themeService.generateBoardCSS();
  }


  private toggleThemeSelector() {
    this.showThemeSelector = !this.showThemeSelector;
  }

  private handleAuthChange(user: User | null) {
    this.currentUser = user;
    this.isAuthenticated = user !== null;
  }

  private handleLogout() {
    this.authService.logout();
    // ... (reset game state)
  }

  private renderAuthenticatedApp() {
    return html`
      <main>
        <header>
          <h1>${this.header}</h1>
          <div>
            <span>Welcome, ${this.currentUser?.firstName}</span>
            <md-icon-button @click=${this.handleLogout}><md-icon>logout</md-icon></md-icon-button>
          </div>
        </header>

        <div class="container">
          <div class="controls-panel">
            ${this.gameStatus === 'disconnected' ? html`
              <div class="controls-row">
                <md-filled-button @click=${this.createGame}>
                  Create New Game
                </md-filled-button>
                <span style="margin: 0 1rem;">OR</span>
                <md-filled-text-field
                  label="Enter Room Code"
                  placeholder="ABC123"
                  .value=${this.inputRoomCode}
                  @input=${(e: any) => this.inputRoomCode = e.target.value.toUpperCase()}
                  maxlength="6"
                ></md-filled-text-field>
                <md-outlined-button @click=${this.joinByRoomCode} ?disabled=${!this.inputRoomCode}>
                  Join Game
                </md-outlined-button>
              </div>
            ` : ''}
            
            ${this.gameStatus === 'waiting' || this.gameStatus === 'active' ? html`
              <div class="controls-row">
                <md-outlined-button @click=${this.resetGame}>
                  New Game
                </md-outlined-button>
                ${this.gameStatus === 'waiting' && this.roomCode ? html`
                  <md-filled-text-field
                    label="Share this Room Code"
                    .value=${this.roomCode}
                    readonly
                  ></md-filled-text-field>
                  <md-outlined-button @click=${this.copyRoomCode}>
                    Copy Code
                  </md-outlined-button>
                ` : ''}
              </div>
            ` : ''}
          </div>

          <div class="status-panel">
            <div class="status-card">Status: ${this.gameStatus}</div>
            ${this.roomCode ? html`<div class="status-card">Room Code: ${this.roomCode}</div>` : ''}
            ${this.playerColor ? html`<div class="status-card">Color: ${this.playerColor}</div>` : ''}
            ${this.gameStatus === 'waiting' ? html`<div class="status-card">Share this room code with your opponent!</div>` : ''}
          </div>

          <div class="game-area">
            <video-call .gameId=${this.gameId}></video-call>
            <div class="chess-panel">
              <div class="turn-indicator ${this.getTurnIndicatorClass()}">${this.getCurrentTurnDisplay()}</div>
              <chess-board position=${this.position} draggable-pieces></chess-board>
              <div class="controls-row">
                <md-outlined-button @click=${this.flipBoard}>Flip Board</md-outlined-button>
                <md-outlined-button @click=${this.toggleThemeSelector}>Themes</md-outlined-button>
              </div>
              ${this.showThemeSelector ? html`<theme-selector .themeService=${this.themeService}></theme-selector>` : ''}
              ${this.renderMoveHistory()}
            </div>
          </div>
        </div>
      </main>
    `;
  }

  private renderAuthScreen() {
    return html`
      <main>
        <auth-form .authService=${this.authService}></auth-form>
      </main>
    `;
  }

  render() {
    return this.isAuthenticated ? this.renderAuthenticatedApp() : this.renderAuthScreen();
  }
}