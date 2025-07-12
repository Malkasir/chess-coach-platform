import { html, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from 'lit/decorators.js';
import './components/video-call.js'; // <- Add this to include your video call

@customElement('chess-coach-app')
export class ChessCoachApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 25px;
      color: var(--chess-coach-app-text-color, #000);
    }
  `;

@property({ type: String }) header  = 'Hey there';
@property({ type: Number }) counter = 5;

  __increment() {
    this.counter += 1;
  }

  render() {
    return html`
      <h2>${this.header} Nr. ${this.counter}!</h2>
      <button @click=${this.__increment}>increment</button>

      <hr />
      <video-call room="chess-room-1"></video-call>
    `;
  }
}
