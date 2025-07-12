import { html, render } from 'lit';
import './ChessCoachApp.ts';
import 'chessboard-element';

console.log('✅ chessboard-element loaded');


const container = document.createElement('div');
document.body.appendChild(container);

render(
  html`<chess-coach-app header="Welcome to Chess platform Coach Aram!"></chess-coach-app>`,
  container,
);
