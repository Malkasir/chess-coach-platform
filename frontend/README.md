# Chess Coach Platform - Frontend

A React-based chess coaching platform with video calling capabilities and AI opponents.

## Features

- **Real-time Chess Gameplay**: Collaborative chess games with WebSocket synchronization
- **Video Communication**: Integrated Jitsi Meet for coach-student sessions
- **AI Opponents**: Basic AI opponents powered by Stockfish (personality system UI implemented but behavioral differences not yet active)
- **Game Invitations**: Player discovery and invitation system
- **User Authentication**: JWT-based secure authentication
- **Responsive Design**: Optimized for desktop with mobile support (breakpoint at 768px)

## Technology Stack

- **React 18** with TypeScript
- **Vite** for development and building
- **Chess.js** for game logic and move validation
- **react-chessboard** for interactive board UI
- **Stockfish.js** chess engine with Web Worker implementation for AI opponents
- **Jitsi Meet** for video calling
- **STOMP WebSocket** for real-time communication

## Development

### Prerequisites
- Node.js 18+
- npm

### Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5173` (Vite default port)

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Type checking**:
   ```bash
   npm run typecheck
   ```

### Project Structure

```
src/
├── components/          # React components
│   ├── ChessBoard.tsx          # Interactive chess board
│   ├── GameLobby.tsx           # Game creation/joining
│   ├── AIPersonalitySelector.tsx  # AI opponent selection
│   ├── VideoCall.tsx           # Jitsi Meet integration
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts             # Authentication state
│   ├── useGameState.ts        # Game state management
│   └── useToasts.ts           # Toast notifications
├── services/           # API and business logic
│   ├── api-client.ts          # Backend API integration
│   ├── chess-engine/          # AI chess engine services
│   └── ...
├── styles/             # CSS modules and themes
└── types/              # TypeScript type definitions
```

## Configuration

The app connects to the backend at `http://localhost:8080` by default. No additional environment setup is required for development.

## Key Components

- **ChessCoachApp**: Root component managing authentication and routing
- **GameLobby**: Interface for creating games and selecting AI opponents
- **ActiveGame**: Main game interface with chess board and video call
- **AIPersonalitySelector**: Modal for choosing AI opponent personality
- **ChessBoard**: Interactive board with drag-and-drop move input

## AI Opponents

The platform includes basic AI integration:
- **Stockfish Engine**: Industry-standard chess engine with Web Worker implementation
- **Personality UI**: 5 personality options available (Aggressive Alex, Strategic Sophia, Tactical Tim, Steady Sam, Balanced Beth)
- **Skill Levels**: Configurable difficulty levels using Stockfish skill parameter
- **Note**: Personality behavioral differences are not yet implemented - currently uses basic Stockfish with different skill levels
