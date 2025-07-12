import { html, render } from 'lit';
import './ChessCoachApp.ts';

const container = document.createElement('div');
document.body.appendChild(container);

render(
  html`<chess-coach-app header="Welcome to Chess platfor Coach Aram!"></chess-coach-app>`,
  container,
);
