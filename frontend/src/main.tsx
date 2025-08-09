import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChessCoachAppReact } from './ChessCoachApp';
import './index.css';
import './styles/themes.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChessCoachAppReact />
  </React.StrictMode>
);