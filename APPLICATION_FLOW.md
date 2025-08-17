# Chess Coach Platform - Application Flow Documentation

## Overview

The Chess Coach Platform is a full-stack web application that enables real-time chess gameplay with integrated video calling capabilities. The platform is designed for chess coaching sessions where instructors and students can play chess while communicating via video.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Chess.js** for chess game logic and move validation
- **react-chessboard** for interactive chess board UI
- **Jitsi Meet** for video calling integration
- **WebSocket (STOMP)** for real-time game communication

### Backend
- **Spring Boot 3** with Java 17
- **Spring Security** with JWT authentication
- **Spring WebSocket** with STOMP messaging
- **JPA/Hibernate** for data persistence
- **H2 Database** (development) / **PostgreSQL** (production)
- **Maven** for dependency management

## Application Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ChessCoachApp (Root)                   │
├─────────────────────────────────────────────────────────────┤
│  - Authentication state management                         │
│  - Game invitation polling                                  │
│  - AI game coordination                                     │
│  - Route between AuthForm, GameLobby, ActiveGame          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼─────┐
            │AuthForm   │ │GameLob│ │ActiveGame│
            │           │ │by     │ │          │
            └───────────┘ └───────┘ └──────────┘
                                         │
                              ┌─────────┼─────────┐
                              │         │         │
                        ┌─────▼───┐ ┌───▼───┐ ┌──▼────┐
                        │ChessBoard│ │VideoCall│ │Controls│
                        └─────────┘ └───────┘ └───────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                        │
├─────────────────────────────────────────────────────────────┤
│  - AuthController (login/register)                        │
│  - GameController (create/join games)                     │
│  - GameWebSocketController (real-time moves)              │
│  - GameInvitationController (invite system)               │
│  - UserPresenceController (online status)                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                          │
├─────────────────────────────────────────────────────────────┤
│  - AuthService (JWT tokens)                               │
│  - GameService (game logic)                               │
│  - GameInvitationService (invitations)                    │
│  - UserPresenceService (online tracking)                  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Repository/Data Layer                     │
├─────────────────────────────────────────────────────────────┤
│  - UserRepository                                         │
│  - GameRepository                                         │
│  - GameInvitationRepository                               │
│  - UserPresenceRepository                                 │
└─────────────────────────────────────────────────────────────┘
```

## Complete Application Flow

### 1. Application Startup

1. **Frontend Initialization**
   - `main.tsx` renders the root `ChessCoachApp` component
   - `useAuth` hook initializes and checks for existing authentication
   - JWT token validation occurs automatically
   - Test users are created in development mode

2. **Backend Initialization**
   - Spring Boot starts on port 8080
   - Database schema auto-creation (H2/PostgreSQL)
   - WebSocket endpoints configured (`/topic/game/{gameId}`)
   - JWT security filters activated

### 2. User Authentication Flow

#### Login Process
```
Frontend                    Backend
    │                          │
    ├── POST /api/auth/login ──┤
    │   (email, password)      │
    │                          ├── Validate credentials
    │                          ├── Generate JWT token
    │                          ├── Set user online status
    │   ┌── Auth response ──────┤
    │   │   (token, user)       │
    ├───┘                      │
    ├── Store in localStorage  │
    ├── Update auth state      │
    └── Redirect to GameLobby  │
```

#### Registration Process
- Similar to login but creates new user account
- Includes validation (email uniqueness, password requirements)
- Automatic login after successful registration

### 3. Game Creation and Joining

#### Creating a Game
```
Frontend (Host)             Backend                    Database
    │                          │                          │
    ├── POST /api/games/create ┤                          │
    │   (hostId, colorPref)    │                          │
    │                          ├── Create Game entity ────┤
    │                          ├── Generate room code     │
    │                          ├── Assign colors          │
    │   ┌── Game details ──────┤                          │
    │   │   (gameId, roomCode) │                          │
    ├───┘                      │                          │
    ├── Connect to WebSocket   │                          │
    └── Wait for opponent      │                          │
```

#### Joining by Room Code
```
Frontend (Guest)            Backend                    Database
    │                          │                          │
    ├── POST /api/games/join-by-code                      │
    │   (roomCode, guestId)    │                          │
    │                          ├── Find game by code ────┤
    │                          ├── Assign guest to game   │
    │                          ├── Set game to ACTIVE     │
    │   ┌── Game state ────────┤                          │
    │   │   (gameId, colors)   │                          │
    ├───┘                      │                          │
    ├── Connect to WebSocket   │                          │
    └── Start playing          │                          │
```

### 4. Real-Time Chess Gameplay

#### Move Processing Flow
```
Player A                 WebSocket              Backend              Player B
   │                        │                     │                    │
   ├── Make move on board   │                     │                    │
   ├── Validate locally     │                     │                    │
   ├── Send move ───────────┤                     │                    │
   │                        ├── /game/move ──────┤                    │
   │                        │                     ├── Validate move   │
   │                        │                     ├── Save to DB      │
   │                        │                     ├── Broadcast ──────┤
   │                        │   ┌── Move update ──┤                    │
   │   ┌── Move received ────┤───┘                 │                    ├── Update board
   ├───┘                    │                     │                    └── Switch turns
   └── Update board         │                     │
```

#### WebSocket Message Types
- **MOVE**: Chess move with algebraic notation and FEN
- **GAME_STATE**: Complete game state synchronization
- **PLAYER_JOINED**: Notification when opponent joins
- **ERROR**: Error messages and validation failures

### 5. Game Invitation System

#### Sending Invitations
```
Sender                   Backend                  Recipient
   │                        │                        │
   ├── Browse online users  │                        │
   ├── Send invitation ─────┤                        │
   │                        ├── Create invitation    │
   │                        ├── Store in database    │
   │                        │                        │
   │                        │   ┌── Poll for invites ┤
   │                        ├───┘                    │
   │                        ├── Return pending ──────┤
   │                        │                        └── Show notification
```

#### Accepting Invitations
```
Recipient                Backend                  Sender
   │                        │                        │
   ├── Accept invitation ───┤                        │
   │                        ├── Create game          │
   │                        ├── Set invitation as    │
   │                        │   ACCEPTED             │
   │                        │                        │
   │                        │   ┌── Poll for status ─┤
   │                        ├───┘                    │
   │                        ├── Return game info ────┤
   │                        │                        └── Auto-join game
   └── Join created game    │                        │
```

### 6. Video Calling Integration

#### Jitsi Meet Integration
```
Game Start                 Jitsi Setup              Video Call
    │                          │                        │
    ├── Game becomes active    │                        │
    ├── Load Jitsi script ─────┤                        │
    │                          ├── Initialize API       │
    │                          ├── Create room          │
    │                          │   (room{gameId})       │
    │                          ├── Configure options ───┤
    │                          │   - Audio muted start  │
    │                          │   - Minimal toolbar    │
    │                          │   - No prejoin page    │
    │                          └── Embed in component ──┤
    │                                                   └── Video call active
```

### 7. AI Chess Integration

#### AI Game Flow
```
Player                   AI Service              Chess Engine
   │                        │                        │
   ├── Select AI personality │                        │
   ├── Start AI game ────────┤                        │
   │                        ├── Initialize Stockfish ─┤
   │                        ├── Set difficulty/style  │
   │                        ├── Start game            │
   │   ┌── Game ready ───────┤                        │
   ├───┘                    │                        │
   ├── Make move ────────────┤                        │
   │                        ├── Update position ──────┤
   │                        ├── Request AI move ──────┤
   │                        │   ┌── Calculate move ───┤
   │                        ├───┘                     │
   │   ┌── AI move ──────────┤                        │
   ├───┘                    │                        │
   └── Update board         │                        │
```

### 8. State Management

#### Frontend State Flow
```
useAuth Hook              useGameState Hook         React Components
     │                         │                         │
     ├── Authentication        ├── Game state           ├── ChessCoachApp
     ├── User management       ├── WebSocket conn       ├── GameLobby  
     ├── JWT token handling    ├── Move validation      ├── ActiveGame
     └── Login/logout          └── Board position       └── ChessBoard
```

#### Backend State Management
```
Database                  Service Layer             WebSocket
     │                         │                         │
     ├── Persistent state      ├── Business logic       ├── Real-time sync
     ├── User sessions         ├── Game validation      ├── Move broadcasting
     ├── Game history          ├── Invitation logic     ├── Player notifications
     └── Move records          └── Presence tracking    └── Error handling
```

## Key Features Implementation

### 1. Real-Time Synchronization
- WebSocket connections using STOMP protocol
- Automatic reconnection on connection loss
- Move validation on both client and server
- Consistent game state across all clients

### 2. User Presence System
- Online/offline status tracking
- Automatic cleanup of stale sessions
- Real-time updates of available players
- Session management with unique identifiers

### 3. Game State Restoration
- Automatic game restoration after page reload
- Confirmation dialogs for recent active games
- WebSocket reconnection with state sync
- Graceful handling of network interruptions

### 4. Security Implementation
- JWT-based authentication with expiration
- CORS configuration for frontend/backend communication
- Input validation on all API endpoints
- Secure WebSocket connections with authentication

### 5. Chess Engine Integration
- Chess.js for move validation and game logic
- FEN (Forsyth-Edwards Notation) for position storage
- Support for all chess rules including castling, en passant
- Algebraic notation for move recording

### 6. Video Communication
- Jitsi Meet embedded iframe integration
- Room-based video calls per game
- Configurable audio/video settings
- Minimal UI with essential controls only

## Error Handling and Edge Cases

### Connection Issues
- WebSocket reconnection with exponential backoff
- Graceful degradation when video call fails
- Local move validation to prevent illegal moves
- Server-side validation as final authority

### Game State Conflicts
- Server-side move validation
- Conflict resolution using server state as truth
- Automatic state synchronization on reconnection
- Move history preservation for replay

### User Experience Enhancements
- Loading states for all async operations
- Toast notifications for errors and success
- Visual feedback for move validation
- Responsive design for mobile compatibility

## Deployment and Scaling

### Development Environment
- Frontend: Vite dev server (port 3000)
- Backend: Spring Boot (port 8080)
- Database: H2 in-memory
- WebSocket: localhost connections

### Production Environment
- Frontend: Static hosting (Netlify/Vercel)
- Backend: Railway/Render deployment
- Database: PostgreSQL with connection pooling
- WebSocket: Production-grade STOMP broker

This comprehensive flow demonstrates how the Chess Coach Platform orchestrates real-time chess gameplay with video communication, providing a seamless experience for both casual games and structured coaching sessions.