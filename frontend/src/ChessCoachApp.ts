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

  private game = new Chess(); // ✅ chess.js game logic

  __increment() {
    this.counter += 1;
  }


firstUpdated() {
  const board = this.querySelector('chess-board');
  if (!board) return;

  board.setAttribute('position', this.game.fen());

  board.addEventListener('move', (e: any) => {
    const { from, to } = e.detail;

    // Try the move using chess.js
    const move = this.game.move({ from, to, promotion: 'q' });

    if (move) {
      // ✅ Legal move
      console.log('✅ Legal move:', move.san);
      board.setAttribute('position', this.game.fen()); // update board to match internal state
    } else {
      // ❌ Illegal move → revert position
      console.warn('❌ Illegal move:', from, to);
      board.setAttribute('position', this.game.fen()); // force rollback
    }
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
