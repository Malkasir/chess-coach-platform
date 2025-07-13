import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Chess } from 'chess.js'; // ✅ NEW
import './components/video-call.js';
import 'chessboard-element';

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

  @property({ type: String }) header = 'Hey there';
  @property({ type: Number }) counter = 5;

  private game = new Chess();
  @property({ type: String }) position = 'start';

  __increment() {
    this.counter += 1;
  }

  firstUpdated() {
    const board = this.querySelector('chess-board');
    if (!board) return;

board.addEventListener('drag-start', (e: any) => {
  const { source, piece } = e.detail;          // ← correct property

  // 1️⃣ allow only the side to move
  const turn = this.game.turn();               // 'w' | 'b'
  if ((turn === 'w' && piece.startsWith('b')) ||
      (turn === 'b' && piece.startsWith('w'))) {
    e.preventDefault();
    return;
  }

  // 2️⃣ deny pickup if the piece has no legal moves
  const moves = this.game.moves({ square: source, verbose: true });
  if (moves.length === 0) e.preventDefault();
});

// DROP ────────────────────────────────────────────────
board.addEventListener('drop', (e: any) => {
  const { source, target, setAction } = e.detail;

  // Let chess.js validate
  const move = this.game.move({ from: source, to: target, promotion: 'q' });

  if (move === null) {           // illegal
    setAction('snapback');       // bounce the piece
    return;                      // don't touch the board yet
  }
  // legal: leave setAction alone (default "snap" is fine)
});

// SNAP-END ─────────────────────────────────────────────
board.addEventListener('snap-end', () => {
  // once the animation finishes, make the board = engine
  board.setPosition(this.game.fen());
});


  }

  render() {
    return html`
      <h2>${this.header} Nr. ${this.counter}!</h2>
      <button @click=${this.__increment}>increment</button>

      <hr />

      <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
        <video-call room="chess-room-1"></video-call>
        <chess-board
          position="start"
          draggable-pieces
          style="width: 400px; height: 400px;"
        ></chess-board>
      </div>
    `;
  }
}
