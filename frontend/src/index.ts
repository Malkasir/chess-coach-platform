import { html, render } from 'lit';
import { ChessCoachApp } from './ChessCoachApp.js';
import './components/video-call.ts'; // registers <video-call>

// Add a container to the body
const container = document.createElement('div');
document.body.appendChild(container);

// Render your Lit component
render(
  html`
    <chess-coach-app header="Welcome to Chess Coach!"></chess-coach-app>
  `,
  container
);
