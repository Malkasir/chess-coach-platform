import './components/video-call.ts'; // This registers <video-call>

// Optionally export your app component (if used elsewhere)
export { ChessCoachApp } from './ChessCoachApp.js';

// Wait for DOM to be ready (safer than overwriting immediately)
window.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.innerHTML = `<video-call room="chess-room-1"></video-call>`;
  document.body.appendChild(container);
});
