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
    }

    chess-board {
      border: 1px solid #ccc;
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

      // Let chess.js validate locally first
      const move = this.game.move({ from: source, to: target, promotion: 'q' });

      if (move === null) {
        setAction('snapback');
        return;
      }

      // If valid, send to server with current FEN
      const currentFen = this.game.fen();
      this.gameService.makeMove(move.san, currentFen);
      
      // Reset local game state - server will send back the authoritative state
      this.game.undo();
    });
  }

  render() {
    return html`
      <h2>${this.header}</h2>
      
      <div style="margin-bottom: 2rem;">
        <h3>Game Controls</h3>
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
          <button @click=${this.createGame} ?disabled=${this.gameStatus !== 'disconnected'}>
            Create Game (Coach)
          </button>
          <input 
            type="text" 
            placeholder="Enter Game ID" 
            .value=${this.gameId}
            @input=${(e: any) => this.gameId = e.target.value}
            ?disabled=${this.gameStatus !== 'disconnected'}
          />
          <button @click=${this.joinGame} ?disabled=${this.gameStatus !== 'disconnected' || !this.gameId}>
            Join Game (Student)
          </button>
        </div>
        <div>
          <strong>Status:</strong> ${this.gameStatus}
          ${this.gameId ? html` | <strong>Game ID:</strong> ${this.gameId}` : ''}
          ${this.playerId ? html` | <strong>Player:</strong> ${this.playerId}` : ''}
          ${this.playerColor ? html` | <strong>You are:</strong> ${this.playerColor}` : ''}
        </div>
      </div>

      <hr />

      <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
        <video-call room="chess-room-${this.gameId || '1'}"></video-call>
        <div>
          <chess-board
            position=${this.position}
            draggable-pieces
            style="width: 400px; height: 400px;"
          ></chess-board>
          <button @click=${this.flipBoard} style="margin-top: 1rem;">Flip Board</button>
        </div>
      </div>
    `;
  }
}
