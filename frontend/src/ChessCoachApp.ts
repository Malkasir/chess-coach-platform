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
      
      const { gameId, coachColor } = await this.gameService.createGame(coachId);
      this.gameId = gameId;
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

  private async joinGame() {
    try {
      const studentId = this.playerId || 'student-' + Date.now();
      this.playerId = studentId;
      this.isCoach = false;
      
      await this.gameService.joinGame(this.gameId, studentId, false);
      const gameState = await this.gameService.getGameState(this.gameId);
      this.playerColor = gameState.studentColor;
      this.moveHistory = []; // Reset move history when joining
      this.gameStatus = 'active';
    } catch (error) {
      console.error('Failed to join game:', error);
    }
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

  firstUpdated() {
    this.applyThemes();
    // ... (event listeners for chessboard remain the same)
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
            <div class="controls-row">
              <md-filled-button @click=${this.createGame} ?disabled=${this.gameStatus !== 'disconnected'}>
                Create Game
              </md-filled-button>
              <md-filled-text-field
                label="Game ID"
                .value=${this.gameId}
                @input=${(e: any) => this.gameId = e.target.value}
                ?disabled=${this.gameStatus !== 'disconnected'}
              ></md-filled-text-field>
              <md-outlined-button @click=${this.joinGame} ?disabled=${this.gameStatus !== 'disconnected' || !this.gameId}>
                Join Game
              </md-outlined-button>
            </div>
          </div>

          <div class="status-panel">
            <div class="status-card">Status: ${this.gameStatus}</div>
            ${this.gameId ? html`<div class="status-card">Game ID: ${this.gameId}</div>` : ''}
            ${this.playerColor ? html`<div class="status-card">Color: ${this.playerColor}</div>` : ''}
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