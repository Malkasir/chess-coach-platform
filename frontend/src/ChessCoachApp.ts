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
      display: flex !important;
      flex-direction: row !important;
      gap: 2rem;
      max-width: 1000px;
      margin: 0 auto;
      align-items: flex-start;
      justify-content: center;
    }

    .video-panel {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 1rem;
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      flex: 0 0 400px;
      width: 400px;
      height: 450px;
      order: 1;
    }

    .chess-panel {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 1rem;
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      text-align: center;
      flex: 0 0 500px;
      width: 500px;
      order: 2;
    }

    chess-board {
      width: 450px !important;
      height: 450px !important;
      border: 3px solid rgba(255,255,255,0.4);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      display: block !important;
      margin: 0 auto !important;
      overflow: visible !important;
    }

    video-call {
      width: 100%;
      height: 350px;
      display: block;
      border-radius: 8px;
      overflow: hidden;
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

    /* Ensure chessboard is not clipped */
    .chess-panel {
      overflow: visible !important;
    }

    /* Override any potential web component styles */
    chess-board * {
      box-sizing: border-box !important;
    }


    @media (max-width: 1000px) {
      .game-area {
        flex-direction: column !important;
        max-width: 500px;
        gap: 1rem;
        align-items: center;
      }
      
      .chess-panel, .video-panel {
        flex: none;
        width: 100%;
        max-width: 480px;
        margin: 0 auto;
      }

      .video-panel {
        height: 300px;
        order: 1;
      }

      .chess-panel {
        order: 2;
      }
      
      .controls-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      chess-board {
        width: 400px !important;
        height: 400px !important;
      }
      
      video-call {
        height: 250px;
      }
    }

    @media (max-width: 500px) {
      .game-area {
        max-width: 350px;
      }

      chess-board {
        width: 320px !important;
        height: 320px !important;
      }
      
      .chess-panel, .video-panel {
        padding: 0.5rem;
        max-width: 340px;
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
    
    // Add styles directly to document head to ensure they apply
    if (!document.getElementById('chess-coach-styles')) {
      const style = document.createElement('style');
      style.id = 'chess-coach-styles';
      style.textContent = `
        chess-coach-app .game-area {
          display: flex !important;
          flex-direction: row !important;
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
          align-items: flex-start;
          justify-content: center;
        }
        
        chess-coach-app .video-panel {
          flex: 0 0 400px;
          width: 400px;
          height: 500px;
          order: 1;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 1rem;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        chess-coach-app .chess-panel {
          flex: 0 0 500px;
          width: 500px;
          order: 2;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 1rem;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          text-align: center;
        }
        
        chess-coach-app chess-board {
          width: 450px !important;
          height: 450px !important;
          display: block !important;
          margin: 0 auto !important;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        chess-coach-app video-call {
          width: 100%;
          height: 400px;
          display: block;
          border-radius: 8px;
          overflow: hidden;
        }
        
        chess-coach-app .video-panel h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.2rem;
          color: white;
        }
        
        @media (max-width: 1000px) {
          chess-coach-app .game-area {
            flex-direction: column !important;
            max-width: 500px;
            gap: 1rem;
            align-items: center;
          }
          
          chess-coach-app .chess-panel, 
          chess-coach-app .video-panel {
            flex: none;
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
          }

          chess-coach-app .video-panel {
            height: 300px;
            order: 1;
          }

          chess-coach-app .chess-panel {
            order: 2;
          }
          
          chess-coach-app chess-board {
            width: 400px !important;
            height: 400px !important;
          }
          
          chess-coach-app video-call {
            height: 250px;
          }
        }
        
        @media (max-width: 500px) {
          chess-coach-app .game-area {
            max-width: 350px;
          }

          chess-coach-app chess-board {
            width: 320px !important;
            height: 320px !important;
          }
          
          chess-coach-app .chess-panel, 
          chess-coach-app .video-panel {
            padding: 0.5rem;
            max-width: 340px;
          }
        }
      `;
      document.head.appendChild(style);
    }
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
          // Show user feedback about invalid move
          console.warn('❌ Invalid move rejected by server');
        }
        break;
    }
    this.requestUpdate();
  }

  private updateBoardPosition() {
    const board = this.querySelector('chess-board');
    if (board && this.position) {
      console.log('🔄 Updating board position to:', this.position);
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

  private logout() {
    const videoCall = this.querySelector('video-call') as any;
    videoCall?.disconnect?.();
    this.gameService.disconnect();
    this.game.reset();
    this.gameId = '';
    this.playerId = '';
    this.isCoach = false;
    this.gameStatus = 'disconnected';
    this.position = 'start';
    this.playerColor = null;
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
    const currentTurn = this.game.turn() === 'w' ? 'white' : 'black';
    const isMyTurn = this.isMyTurn();
    return isMyTurn ? 'Your turn' : `${currentTurn === 'white' ? 'White' : 'Black'} to move`;
  }

  firstUpdated() {
    const board = this.querySelector('chess-board');
    if (!board) return;

    // Force the board to respect our sizing
    setTimeout(() => {
      const chessBoard = this.querySelector('chess-board') as any;
      if (chessBoard) {
        // Ensure the board respects our CSS sizing
        chessBoard.style.width = '450px';
        chessBoard.style.height = '450px';
        chessBoard.style.display = 'block';
        chessBoard.style.margin = '0 auto';
      }
    }, 100);

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
            <button
              class="btn btn-secondary"
              @click=${this.logout}
              ?disabled=${this.gameStatus === 'disconnected'}
            >
              🚪 Logout
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
          <div class="video-panel">
            <h3 style="margin-top: 0; margin-bottom: 1rem;">Video Call</h3>
            <video-call room="chess-room-${this.gameId || '1'}"></video-call>
          </div>
          <div class="chess-panel">
            <h3 style="margin-top: 0;">Chess Board</h3>
            ${this.gameStatus === 'active' ? html`
              <div class="turn-indicator ${this.isMyTurn() ? 'your-turn' : ''}">
                <strong>${this.getCurrentTurnDisplay()}</strong>
              </div>
            ` : ''}
            <chess-board
              position=${this.position}
              draggable-pieces
            ></chess-board>
            <button class="btn btn-secondary" @click=${this.flipBoard}>
              🔄 Flip Board
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
