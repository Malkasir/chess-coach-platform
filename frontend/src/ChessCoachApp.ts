import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Chess } from 'chess.js'; // ✅ NEW
import './components/video-call.js';
import 'chessboard-element';
import { GameService, GameMessage } from './services/game-service.js';

@customElement('chess-coach-app')
export class ChessCoachApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 25px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .game-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .game-header h1 {
      font-size: 2.5rem;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .controls-panel {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .controls-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn {
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    .btn:disabled {
      background: rgba(255,255,255,0.2);
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: linear-gradient(45deg, #2196F3, #1976D2);
    }

    .input-field {
      padding: 12px 16px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
      color: white;
      font-size: 14px;
      backdrop-filter: blur(5px);
    }

    .input-field::placeholder {
      color: rgba(255,255,255,0.7);
    }

    .status-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .status-card {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 1rem;
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(5px);
    }

    .status-label {
      font-size: 12px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }

    .status-value {
      font-size: 16px;
      font-weight: 600;
    }

    .game-area {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2rem;
      align-items: start;
    }

    .chess-panel {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 2rem;
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      text-align: center;
    }

    chess-board {
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .turn-indicator {
      margin-bottom: 1rem;
      padding: 1rem;
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
    }

    .turn-indicator.your-turn {
      background: rgba(76, 175, 80, 0.3);
      border-color: #4CAF50;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
      100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
    }

    @media (max-width: 768px) {
      .game-area {
        grid-template-columns: 1fr;
      }
      
      .controls-row {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;

  createRenderRoot() {
    return this;
  }

  @property({ type: String }) header = 'Chess Coach Platform';
  
  private game = new Chess();
  private gameService = new GameService();
  
  @state() private gameId: string = '';
  @state() private playerId: string = '';
  @state() private isCoach: boolean = false;
  @state() private gameStatus: string = 'disconnected';
  @state() private position: string = 'start';
  @state() private playerColor: 'white' | 'black' | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.gameService.setGameUpdateListener(this.handleGameMessage.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.gameService.disconnect();
  }

  private handleGameMessage(message: GameMessage) {
    console.log('Received game message:', message);
    
    switch (message.type) {
      case 'MOVE':
        if (message.fen) {
          this.game.load(message.fen);
          this.position = message.fen;
          this.updateBoardPosition();
        }
        break;
      case 'GAME_STATE':
        if (message.fen) {
          this.game.load(message.fen);
          this.position = message.fen;
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
        }
        break;
    }
    this.requestUpdate();
  }

  private updateBoardPosition() {
    const board = this.querySelector('chess-board');
    if (board) {
      board.setPosition(this.position);
    }
  }

  private async createGame() {
    try {
      const coachId = this.playerId || 'coach-' + Date.now();
      this.playerId = coachId;
      this.isCoach = true;
      
      const { gameId, coachColor } = await this.gameService.createGame(coachId);
      this.gameId = gameId;
      this.playerColor = coachColor;
      
      await this.gameService.joinGame(gameId, coachId, true);
      this.gameStatus = 'waiting';
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
    const currentTurn = this.game.turn() === 'w' ? 'white' : 'black';
    const isMyTurn = this.isMyTurn();
    return isMyTurn ? 'Your turn' : `${currentTurn === 'white' ? 'White' : 'Black'} to move`;
  }

  firstUpdated() {
    const board = this.querySelector('chess-board');
    if (!board) return;

    board.addEventListener('drag-start', (e: any) => {
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
    });

    board.addEventListener('drop', (e: any) => {
      const { source, target, setAction } = e.detail;

      // Try the move locally to get the SAN notation
      const move = this.game.move({ from: source, to: target, promotion: 'q' });

      if (move === null) {
        setAction('snapback');
        return;
      }

      // Send move to server for authoritative validation
      this.gameService.makeMove(move.san);
      
      // Optimistically update the position - server will correct if invalid
      this.position = this.game.fen();
      this.updateBoardPosition();
    });
  }

  render() {
    return html`
      <div class="container">
        <div class="game-header">
          <h1>${this.header}</h1>
        </div>

        <div class="controls-panel">
          <h3 style="margin-top: 0;">Game Controls</h3>
          <div class="controls-row">
            <button 
              class="btn"
              @click=${this.createGame} 
              ?disabled=${this.gameStatus !== 'disconnected'}
            >
              🎯 Create Game (Coach)
            </button>
            <input 
              class="input-field"
              type="text" 
              placeholder="Enter Game ID" 
              .value=${this.gameId}
              @input=${(e: any) => this.gameId = e.target.value}
              ?disabled=${this.gameStatus !== 'disconnected'}
            />
            <button 
              class="btn btn-secondary"
              @click=${this.joinGame} 
              ?disabled=${this.gameStatus !== 'disconnected' || !this.gameId}
            >
              🎓 Join Game (Student)
            </button>
          </div>
        </div>

        <div class="status-panel">
          <div class="status-card">
            <div class="status-label">Connection Status</div>
            <div class="status-value">${this.gameStatus}</div>
          </div>
          ${this.gameId ? html`
            <div class="status-card">
              <div class="status-label">Game ID</div>
              <div class="status-value">${this.gameId}</div>
            </div>
          ` : ''}
          ${this.playerId ? html`
            <div class="status-card">
              <div class="status-label">Player ID</div>
              <div class="status-value">${this.playerId}</div>
            </div>
          ` : ''}
          ${this.playerColor ? html`
            <div class="status-card">
              <div class="status-label">Your Color</div>
              <div class="status-value">${this.playerColor}</div>
            </div>
          ` : ''}
        </div>

        <div class="game-area">
          <video-call room="chess-room-${this.gameId || '1'}"></video-call>
          <div class="chess-panel">
            ${this.gameStatus === 'active' ? html`
              <div class="turn-indicator ${this.isMyTurn() ? 'your-turn' : ''}">
                <strong>${this.getCurrentTurnDisplay()}</strong>
              </div>
            ` : ''}
            <chess-board
              position=${this.position}
              draggable-pieces
              style="width: 400px; height: 400px;"
            ></chess-board>
            <button class="btn btn-secondary" @click=${this.flipBoard} style="margin-top: 1rem;">
              🔄 Flip Board
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
