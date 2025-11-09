# Move Panel Feature - Implementation Guide

## Executive Summary

Add a professional move history panel matching industry standards (Chess.com/Lichess) to enable game review, training navigation, and PGN export/import capabilities.

**Status:** Planned for next implementation phase
**Estimated Effort:** 12-16 hours (MVP + Training controls)
**Dependencies:** Clock feature (✅ Complete), WebSocket game state (✅ Complete)

---

## Research Summary

### Industry Standards Analysis

#### Chess.com Pattern
- **Move Display**: Vertical list with Standard Algebraic Notation (SAN)
- **Pairing**: Half-moves grouped (1. e4 e5, 2. Nf3 Nc6)
- **Highlighting**: Current move clearly marked
- **Navigation**: Limited during live games, full access in analysis
- **Location**: Compact panel near clocks
- **Training Features**: Back/Forward controls, jump-to-start/end buttons
- **Analysis Integration**: Engine eval bars, PGN export from same area
- **Mobile**: Move list can overlap takeback bar as game progresses

#### Lichess Pattern
- **Navigation**: Arrow buttons, keyboard shortcuts, mouse wheel
- **Variations**: Displayed as dropdown comments, right-click to promote
- **Study Mode**: Chapter numbers visible, dropdown for move alternatives
- **Layout Options**: Adaptable to screen format (horizontal/vertical)
- **Themes**: Light theme improves annotation visibility
- **Analysis Tools**: Hover over PV lines temporarily shows position

#### Best Practices Identified
1. ✅ Last move highlighted for board clarity
2. ✅ Orientation options (horizontal/vertical) for screen adaptation
3. ✅ Figurine notation option (piece icons: ♘ instead of N)
4. ✅ PGN format with 'main_on_own_line' for readability
5. ✅ Keyboard navigation (arrow keys) as primary control
6. ✅ Database integration for import/organize/analyze games
7. ✅ Graphical evaluation display with PV
8. ✅ Dropdown for game selection when multiple games available

---

## Current System State

### What We Already Have ✅

**Frontend (`useGameState.ts`):**
```typescript
interface GameState {
  moveHistory: string[];  // Already tracked: ["e4", "e5", "Nf3", "Nc6"]
  position: string;       // Current FEN
  clockState: ClockState | null;
  gameStatus: string;
  // ... other fields
}
```

**Backend (`Game.java`):**
- `moveHistory` field stored as JSON array in database
- WebSocket broadcasts include `moveHistory` with every move
- Full game state persistence

**Chess Engine:**
- chess.js validates all moves
- Can reconstruct any position from move history
- Built-in PGN generation: `game.pgn()`

### What We Need to Build 🚧

1. **MovePanel Component** - Visual display of move history
2. **Navigation State** - Track which move is being viewed
3. **Position Replay** - Reconstruct board from partial history
4. **Training Controls** - Back/forward navigation UI
5. **PGN Export** - Download/copy game notation
6. **PGN Import** - Load training positions (Phase 3)

---

## Architecture Design

### Component Hierarchy

```
ActiveGame.tsx
├── VideoCall
├── GameContainer
│   ├── BoardWrapper
│   │   └── ChessBoard
│   └── SidePanel
│       ├── GameClock (opponent)
│       ├── MovePanel (NEW)  ⭐
│       │   ├── MoveList
│       │   ├── NavigationControls (training only)
│       │   └── PGNControls
│       ├── TurnIndicator
│       └── GameClock (player)
```

### Data Flow

```
Backend (Game.moveHistory)
    ↓ WebSocket
Frontend (gameState.moveHistory)
    ↓ Props
MovePanel Component
    ↓ User clicks move
NavigationHandler
    ↓ Replay moves
Chess.js Engine (reconstruct position)
    ↓ Update
ChessBoard (display historical position)
```

### State Management

**Add to `useGameState.ts`:**
```typescript
interface GameState {
  // Existing fields...
  moveHistory: string[];

  // NEW: Navigation state
  reviewMode: boolean;        // true when viewing history
  reviewIndex: number;        // Which move we're viewing (-1 = latest)
  reviewPosition: string;     // FEN at reviewIndex
}

// NEW: Navigation functions
const navigateToMove = (index: number) => void;
const navigateBack = () => void;
const navigateForward = () => void;
const navigateToStart = () => void;
const navigateToEnd = () => void;
const exitReviewMode = () => void;
```

---

## Feature Specifications

### Phase 1: Always-On Move History (MVP)
**Effort:** 4-6 hours
**User Story:** As a player, I want to see all moves made in the game so I can review the game progression.

#### Requirements

1. **Display Move History**
   - Show moves in Standard Algebraic Notation (SAN)
   - Pair half-moves: `1. e4 e5`, `2. Nf3 Nc6`
   - Number each full move (1, 2, 3...)
   - Auto-scroll to latest move on new moves
   - Highlight current/latest move

2. **Visual Design**
   - Scrollable container (max height: fit between clocks)
   - Monospace font for alignment
   - Card/panel background matching theme
   - Hover effects on individual moves
   - Mobile: Collapsible section below clocks

3. **PGN Export**
   - "Copy PGN" button in panel footer
   - "Download PGN" with filename: `Game-{gameId}.pgn`
   - Show success toast after copy
   - Include game metadata (players, date, result)

4. **Accessibility**
   - ARIA labels for move list
   - Keyboard navigation (tab through moves)
   - Screen reader friendly move announcements

#### Technical Implementation

**Component: `frontend/src/components/MovePanel.tsx`**
```typescript
interface MovePanelProps {
  moveHistory: string[];
  currentMoveIndex: number;        // -1 = latest move (live), 0+ = ply index
  gameMode: 'TIMED' | 'TRAINING';
  playerColor: 'white' | 'black' | null;
  onMoveClick?: (plyIndex: number) => void;  // Only in training
}

export const MovePanel: React.FC<MovePanelProps> = ({
  moveHistory,
  currentMoveIndex,
  gameMode,
  playerColor,
  onMoveClick
}) => {
  // Pair moves: ["e4", "e5"] → [{white: "e4", black: "e5"}]
  const pairedMoves = usePairedMoves(moveHistory);

  // Auto-scroll to latest move
  const moveListRef = useScrollToBottom(moveHistory.length);

  // Handle click on individual move (white or black)
  const handleMoveClick = (rowIndex: number, column: 'white' | 'black') => {
    if (gameMode !== 'TRAINING') return;

    // Convert row/column to ply index
    const plyIndex = column === 'white' ? rowIndex * 2 : rowIndex * 2 + 1;

    if (plyIndex < moveHistory.length) {
      onMoveClick?.(plyIndex);
    }
  };

  return (
    <div className={styles.movePanel}>
      <div ref={moveListRef} className={styles.moveList}>
        {pairedMoves.map((pair, idx) => (
          <div key={idx} className={styles.moveRow}>
            <span className={styles.number}>{idx + 1}.</span>
            <span
              className={`${styles.white} ${currentMoveIndex === idx * 2 ? styles.active : ''}`}
              onClick={() => handleMoveClick(idx, 'white')}
            >
              {pair.white}
            </span>
            <span
              className={`${styles.black} ${currentMoveIndex === idx * 2 + 1 ? styles.active : ''}`}
              onClick={() => handleMoveClick(idx, 'black')}
            >
              {pair.black}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.pgnControls}>
        <button onClick={handleCopyPGN}>📋 Copy PGN</button>
        <button onClick={handleDownloadPGN}>⬇️ Download</button>
      </div>
    </div>
  );
};
```

**Helper: `frontend/src/hooks/usePairedMoves.ts`**
```typescript
import { useMemo } from 'react';

interface MovePair {
  white: string | null;
  black: string | null;
}

export const usePairedMoves = (moveHistory: string[]): MovePair[] => {
  return useMemo(() => {
    const pairs: MovePair[] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        white: moveHistory[i] || null,
        black: moveHistory[i + 1] || null
      });
    }
    return pairs;
  }, [moveHistory]);
};
```

**Helper: `frontend/src/hooks/useScrollToBottom.ts`**
```typescript
import { useEffect, useRef } from 'react';

/**
 * Auto-scrolls a container to bottom when content changes
 * @param dependency - Value to watch for changes (e.g., moveHistory.length)
 */
export const useScrollToBottom = (dependency: number) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [dependency]);

  return containerRef;
};
```

**CSS: `frontend/src/components/MovePanel.module.css`**
```css
.movePanel {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-card);
  border-radius: 8px;
  padding: var(--space-md);
  flex: 1;
  min-height: 200px;
  max-height: 400px;
  overflow: hidden;
}

.moveList {
  flex: 1;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: var(--text-sm);
}

.moveRow {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.moveRow:hover {
  background-color: var(--bg-card-hover);
  cursor: pointer;
}

.moveRow.active {
  background-color: rgba(103, 80, 164, 0.3);
  font-weight: var(--font-semibold);
}

.moveNumber {
  color: var(--text-muted);
  text-align: right;
}

.whiteMove, .blackMove {
  color: var(--text-primary);
}

.pgnControls {
  display: flex;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--space-sm);
}

.pgnControls button {
  flex: 1;
  padding: var(--space-sm);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-normal);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 0.2s;
}

.pgnControls button:hover {
  background-color: var(--bg-card-hover);
  border-color: var(--border-focus);
}
```

**Integration: Update `frontend/src/components/ActiveGame.tsx`**

**A. Update ActiveGame Props Interface**

```typescript
import { MovePanel } from './MovePanel';

// Update interface to include navigation props
interface ActiveGameProps {
  currentUser: User;
  gameId: string;
  roomCode: string;
  gameStatus: string;
  position: string;
  playerColor: 'white' | 'black' | null;
  game: Chess;
  clockState: ClockState | null;
  // NEW: Move history and navigation
  moveHistory: string[];
  reviewMode?: boolean;
  reviewIndex?: number;
  onNavigateToMove?: (index: number) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateToStart?: () => void;
  onNavigateToEnd?: () => void;
  // Existing handlers
  isMyTurn: () => boolean;
  getCurrentTurnDisplay: () => string;
  onMove: (move: string, fen: string) => void;
  onResetGame: () => void;
  onExitGame: () => void;
  onCopyRoomCode: () => void;
  onLogout: () => void;
}

// Update component signature
export const ActiveGame: React.FC<ActiveGameProps> = ({
  currentUser,
  gameId,
  roomCode,
  gameStatus,
  position,
  playerColor,
  game,
  clockState,
  moveHistory,
  reviewMode,
  reviewIndex,
  onNavigateToMove,
  onNavigateBack,
  onNavigateForward,
  onNavigateToStart,
  onNavigateToEnd,
  isMyTurn,
  getCurrentTurnDisplay,
  onMove,
  onResetGame,
  onExitGame,
  onCopyRoomCode,
  onLogout,
}) => {
  // ... existing code
};
```

**B. Add MovePanel to Side Panel**

In sidePanel section (around line 123):

```typescript
<div className={styles.sidePanel}>
  {/* 1. Opponent Clock (Top) */}
  <GameClock
    clockState={clockState}
    playerColor={playerColor}
    whiteTimeRemaining={whiteTimeRemaining}
    blackTimeRemaining={blackTimeRemaining}
    layout="side-panel"
    showClock={playerColor === 'white' ? 'black' : 'white'}
  />

  {/* 2. Move Panel - NEW */}
  <MovePanel
    moveHistory={moveHistory}
    currentMoveIndex={reviewIndex ?? -1}
    gameMode={clockState?.gameMode || 'TIMED'}
    playerColor={playerColor}
    reviewMode={reviewMode}
    onMoveClick={onNavigateToMove}
    onNavigateBack={onNavigateBack}
    onNavigateForward={onNavigateForward}
    onNavigateToStart={onNavigateToStart}
    onNavigateToEnd={onNavigateToEnd}
  />

  {/* 3. Turn Indicator */}
  <div className={`${styles.turnIndicator} turn-indicator`} style={{...}}>
    {getCurrentTurnDisplay()}
  </div>

  {/* 4. Player Clock (Bottom) */}
  <GameClock
    clockState={clockState}
    playerColor={playerColor}
    whiteTimeRemaining={whiteTimeRemaining}
    blackTimeRemaining={blackTimeRemaining}
    layout="side-panel"
    showClock={playerColor === 'white' ? 'white' : 'black'}
  />

  {/* 5. Time Control Info (conditional) */}
  {clockState && clockState.gameMode === 'TIMED' && clockState.baseTimeSeconds && (
    <div style={{...}}>
      ⏱️ {Math.floor(clockState.baseTimeSeconds / 60)} min
      {clockState.incrementSeconds > 0 && ` + ${clockState.incrementSeconds}s`}
    </div>
  )}
</div>
```

**C. Update ChessCoachApp to Pass Navigation Props**

**File:** `frontend/src/ChessCoachApp.tsx`

After implementing navigation state in useGameState, update the destructuring around line 23:

```typescript
const {
  gameState,
  gameRef,
  createGame,
  joinByRoomCode,
  joinGameFromInvitation,
  resetGame,
  exitGame,
  makeMove,
  isMyTurn,
  getCurrentTurnDisplay,
  copyRoomCode,
  updateGameField,
  // NEW: Navigation functions
  navigateToMove,
  navigateBack,
  navigateForward,
  navigateToStart,
  navigateToEnd
} = useGameState(authService, authState.currentUser);

// ... later in render (around line 355):

<ActiveGame
  currentUser={authState.currentUser!}
  gameId={gameState.gameId}
  roomCode={gameState.roomCode}
  gameStatus={gameState.gameStatus}
  position={gameState.position}
  playerColor={gameState.playerColor}
  game={gameRef}
  clockState={gameState.clockState}
  // NEW: Pass move history and navigation
  moveHistory={gameState.moveHistory}
  reviewMode={gameState.reviewMode}
  reviewIndex={gameState.reviewIndex}
  onNavigateToMove={navigateToMove}
  onNavigateBack={navigateBack}
  onNavigateForward={navigateForward}
  onNavigateToStart={navigateToStart}
  onNavigateToEnd={navigateToEnd}
  // Existing handlers
  isMyTurn={isMyTurn}
  getCurrentTurnDisplay={getCurrentTurnDisplay}
  onMove={isAIGame ? handleAIMove : makeMove}
  onResetGame={resetGame}
  onExitGame={exitGame}
  onCopyRoomCode={copyRoomCode}
  onLogout={logout}
/>
```

**Responsive: Update `frontend/src/styles/shared.module.css`**
```css
.sidePanel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 280px;  /* Increased from 240px to fit move panel */
  min-width: 240px;
  flex-shrink: 0;
}

/* Tablet: Clocks horizontal, rest stacked below */
@media (max-width: 1024px) {
  .gameContainer {
    flex-direction: column;
    align-items: center;
  }

  .boardWrapper {
    max-width: 500px;
    width: 100%;
  }

  .sidePanel {
    width: 100%;
    max-width: 500px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "clock-opp clock-player"
      "moves moves"
      "turn turn"
      "time-control time-control";
    gap: var(--space-md);
  }

  /* Assign grid areas to children (in order) */
  .sidePanel > *:nth-child(1) { grid-area: clock-opp; }     /* Opponent Clock */
  .sidePanel > *:nth-child(2) { grid-area: moves; }         /* MovePanel */
  .sidePanel > *:nth-child(3) { grid-area: turn; }          /* Turn Indicator */
  .sidePanel > *:nth-child(4) { grid-area: clock-player; }  /* Player Clock */
  .sidePanel > *:nth-child(5) { grid-area: time-control; }  /* Time Control Info */
}

/* Mobile: Stack everything vertically */
@media (max-width: 640px) {
  .sidePanel {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
}
```

---

### Phase 2: Training Navigation Controls
**Effort:** 2-3 hours
**User Story:** As a coach/student, I want to navigate through game history to review and analyze positions.

#### Requirements

1. **Navigation Controls (Training Mode Only)**
   - ⏮ Jump to Start (move 0)
   - ◀ Previous Move
   - ▶ Next Move
   - ⏭ Jump to End (latest move)
   - Keyboard shortcuts: Arrow keys, Home, End
   - "Return to Live" button when in review mode

2. **Visual Feedback**
   - Show which move is being viewed
   - Disable forward button at latest move
   - Disable back button at start
   - Tooltip: "Navigate with arrow keys"

3. **Position Reconstruction**
   - Replay moves from start to selected index
   - Update board display (read-only)
   - Show historical clock state (if available)
   - Prevent making moves while reviewing

4. **Safety Guards**
   - Block navigation during live TIMED games
   - Show tooltip: "Available in Training Mode"
   - Preserve live game state
   - Prevent accidental move submission

#### Technical Implementation

**Update `frontend/src/hooks/useGameState.ts`:**
```typescript
// 1. Extend GameState interface (at top of file)
interface GameState {
  // ... existing fields
  moveHistory: string[];
  position: string;
  clockState: ClockState | null;
  // NEW: Navigation state
  reviewMode: boolean;
  reviewIndex: number; // -1 = live position, 0+ = reviewing that ply
}

// 2. Initialize navigation state in useState
const [gameState, setGameState] = useState<GameState>({
  // ... existing initialization
  reviewMode: false,
  reviewIndex: -1
});

// 3. Navigation functions
const navigateToMove = useCallback((index: number) => {
  if (gameState.clockState?.gameMode !== 'TRAINING') {
    console.warn('Navigation only available in training mode');
    return;
  }

  // Reconstruct position by replaying moves up to index
  const reviewGame = new Chess();
  for (let i = 0; i <= index && i < gameState.moveHistory.length; i++) {
    reviewGame.move(gameState.moveHistory[i]);
  }

  // Update gameRef for consistency
  gameRef.current.load(reviewGame.fen());

  // Update state with navigation position
  setGameState(prev => ({
    ...prev,
    reviewMode: true,
    reviewIndex: index,
    position: reviewGame.fen()
  }));
}, [gameState.moveHistory, gameState.clockState]);

const navigateBack = useCallback(() => {
  const newIndex = gameState.reviewIndex - 1;
  if (newIndex >= -1) {
    navigateToMove(newIndex);
  }
}, [gameState.reviewIndex, navigateToMove]);

const navigateForward = useCallback(() => {
  const newIndex = gameState.reviewIndex + 1;
  if (newIndex < gameState.moveHistory.length) {
    navigateToMove(newIndex);
  }
}, [gameState.reviewIndex, gameState.moveHistory.length, navigateToMove]);

const navigateToStart = useCallback(() => {
  navigateToMove(-1); // -1 = starting position
}, [navigateToMove]);

const navigateToEnd = useCallback(() => {
  // Exit review mode and return to live position
  const liveGame = new Chess();
  gameState.moveHistory.forEach(move => liveGame.move(move));
  gameRef.current.load(liveGame.fen());

  setGameState(prev => ({
    ...prev,
    reviewMode: false,
    reviewIndex: -1,
    position: liveGame.fen()
  }));
}, [gameState.moveHistory]);

// 4. Export in hook return
return {
  // ... existing returns
  gameState,
  gameRef: gameRef.current,
  // NEW: Navigation functions
  navigateToMove,
  navigateBack,
  navigateForward,
  navigateToStart,
  navigateToEnd
};
```

**Update `frontend/src/components/MovePanel.tsx`:**
```typescript
interface MovePanelProps {
  moveHistory: string[];
  currentMoveIndex: number; // reviewIndex from gameState
  gameMode: 'TIMED' | 'TRAINING';
  reviewMode?: boolean;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateToStart?: () => void;
  onNavigateToEnd?: () => void;
  onMoveClick?: (plyIndex: number) => void;
}

export const MovePanel: React.FC<MovePanelProps> = ({
  moveHistory,
  currentMoveIndex,
  gameMode,
  reviewMode = false,
  onNavigateBack,
  onNavigateForward,
  onNavigateToStart,
  onNavigateToEnd,
  onMoveClick
}) => {
  const pairedMoves = usePairedMoves(moveHistory);
  const moveListRef = useScrollToBottom(moveHistory.length);

  // Keyboard navigation
  useEffect(() => {
    if (gameMode !== 'TRAINING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onNavigateBack?.();
      if (e.key === 'ArrowRight') onNavigateForward?.();
      if (e.key === 'Home') onNavigateToStart?.();
      if (e.key === 'End') onNavigateToEnd?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, onNavigateBack, onNavigateForward, onNavigateToStart, onNavigateToEnd]);

  // Handle click on individual move (white or black)
  const handleMoveClick = (rowIndex: number, column: 'white' | 'black') => {
    if (gameMode !== 'TRAINING') return;
    const plyIndex = column === 'white' ? rowIndex * 2 : rowIndex * 2 + 1;
    if (plyIndex < moveHistory.length) {
      onMoveClick?.(plyIndex);
    }
  };

  return (
    <div className={styles.movePanel}>
      {/* Move List */}
      <div ref={moveListRef} className={styles.moveList}>
        {pairedMoves.map((pair, idx) => (
          <div key={idx} className={styles.moveRow}>
            <span className={styles.number}>{idx + 1}.</span>
            <span
              className={`${styles.white} ${currentMoveIndex === idx * 2 ? styles.active : ''}`}
              onClick={() => handleMoveClick(idx, 'white')}
            >
              {pair.white}
            </span>
            <span
              className={`${styles.black} ${currentMoveIndex === idx * 2 + 1 ? styles.active : ''}`}
              onClick={() => handleMoveClick(idx, 'black')}
            >
              {pair.black}
            </span>
          </div>
        ))}
      </div>

      {/* Training Controls */}
      {gameMode === 'TRAINING' && (
        <div className={styles.navigationControls}>
          {reviewMode && (
            <div className={styles.reviewBanner}>
              <span>
                📖 Reviewing Move {Math.floor(currentMoveIndex / 2) + 1}
                {currentMoveIndex % 2 === 0 ? ' (White)' : ' (Black)'}
              </span>
              <button onClick={onNavigateToEnd} className={styles.exitReviewBtn}>
                Return to Live
              </button>
            </div>
          )}

          <div className={styles.navButtons}>
            <button
              onClick={onNavigateToStart}
              disabled={currentMoveIndex <= -1}
              title="Jump to Start (Home)"
            >
              ⏮
            </button>
            <button
              onClick={onNavigateBack}
              disabled={currentMoveIndex <= -1}
              title="Previous Move (←)"
            >
              ◀
            </button>
            <button
              onClick={onNavigateForward}
              disabled={currentMoveIndex >= moveHistory.length - 1}
              title="Next Move (→)"
            >
              ▶
            </button>
            <button
              onClick={onNavigateToEnd}
              disabled={currentMoveIndex === -1}
              title="Return to Live (End)"
            >
              ⏭
            </button>
          </div>
        </div>
      )}

      {/* PGN Controls */}
      <div className={styles.pgnControls}>
        <button onClick={handleCopyPGN}>📋 Copy PGN</button>
        <button onClick={handleDownloadPGN}>⬇️ Download</button>
      </div>
    </div>
  );
};
```

**Update `frontend/src/components/ChessBoard.tsx`:**
```typescript
// Add prop to disable moves in review mode
interface ChessBoardProps {
  position: string;
  game: Chess;
  playerColor: 'white' | 'black' | null;
  isMyTurn: () => boolean;
  onMove: (move: string, fen: string, moveObj?: { from: string; to: string; promotion?: string }) => void;
  isTimeExpired?: boolean;
  reviewMode?: boolean; // NEW: Disable moves when reviewing history
}

// Update onDrop handler
const onDrop = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
  // Prevent moves in review mode
  if (reviewMode) {
    debugLog('📖 Move blocked: Currently reviewing game history');
    return false;
  }

  // Check if time has expired
  if (isTimeExpired) {
    debugLog('⏰ Move blocked: Time expired');
    return false;
  }

  // Check if it's the player's turn
  if (!isMyTurn()) {
    debugLog('⏸️ Move blocked: Not your turn');
    return false;
  }

  // ... rest of move logic
}, [reviewMode, isTimeExpired, isMyTurn, ...]);

// Update isDraggablePiece
const isDraggablePiece = useCallback(({ piece }: { piece: string }) => {
  // Can't drag in review mode
  if (reviewMode) return false;

  // Can't drag if time expired
  if (isTimeExpired) return false;

  // Can only drag your own pieces on your turn
  if (!isMyTurn()) return false;

  // ... rest of draggable logic
}, [reviewMode, isTimeExpired, isMyTurn, ...]);
```

**CSS Updates:**
```css
.navigationControls {
  padding: var(--space-sm) 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin: var(--space-sm) 0;
}

.reviewBanner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(103, 80, 164, 0.2);
  padding: var(--space-sm);
  border-radius: 6px;
  margin-bottom: var(--space-sm);
  font-size: var(--text-sm);
}

.exitReviewBtn {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: var(--space-xs) var(--space-sm);
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--text-xs);
}

.navButtons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-xs);
}

.navButtons button {
  padding: var(--space-sm);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-normal);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.navButtons button:hover:not(:disabled) {
  background-color: var(--bg-card-hover);
  border-color: var(--border-focus);
  transform: translateY(-1px);
}

.navButtons button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.moveRow.isReviewing {
  background-color: rgba(255, 152, 0, 0.3);
  border-left: 3px solid var(--warning-color);
}
```

---

### Phase 3: PGN Workflow & Enhancements
**Effort:** 8-10 hours
**User Story:** As a coach, I want to import training positions and add annotations.

#### Requirements

1. **PGN Import (Training Mode)**
   - "Import PGN" button
   - Text area modal for paste
   - File upload option (.pgn)
   - Validation and error handling
   - Load into training board

2. **Move Timestamps**
   - Show time spent on each move (if available)
   - Format: `1. e4 (0:03) e5 (0:05)`
   - Clock icon indicator

3. **Engine Evaluation (Future)**
   - Small eval badges (+0.5, -1.2)
   - Blunder/Mistake/Inaccuracy icons
   - Requires Stockfish integration

4. **Advanced UI**
   - Tabbed side panel: Clocks | Moves | Notes
   - Figurine notation toggle
   - Variations support
   - Annotation system

#### Technical Implementation

**PGN Import:**
```typescript
const handleImportPGN = async (pgnString: string) => {
  try {
    const importGame = new Chess();
    const loaded = importGame.load_pgn(pgnString);

    if (!loaded) {
      throw new Error('Invalid PGN format');
    }

    // Extract moves
    const moves = importGame.history();

    // Load into game state (training mode only)
    if (gameState.clockState?.gameMode === 'TRAINING') {
      setGameState(prev => ({
        ...prev,
        moveHistory: moves,
        position: importGame.fen()
      }));

      showToast('success', 'PGN imported successfully');
    }
  } catch (error) {
    showToast('error', `Failed to import PGN: ${error.message}`);
  }
};
```

**Timestamps Display:**
```typescript
interface EnrichedMove {
  san: string;
  timestamp?: number;  // Milliseconds spent
  evaluation?: number; // Engine eval
}

// In MoveRow:
<span className={styles.moveText}>
  {move.san}
  {move.timestamp && (
    <span className={styles.timestamp}>
      ({formatMoveTime(move.timestamp)})
    </span>
  )}
</span>
```

---

## Testing Strategy

### Unit Tests

**`MovePanel.test.tsx`:**
```typescript
describe('MovePanel', () => {
  it('should display paired moves correctly', () => {
    const moves = ['e4', 'e5', 'Nf3', 'Nc6'];
    render(<MovePanel moveHistory={moves} />);
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('e4')).toBeInTheDocument();
    expect(screen.getByText('e5')).toBeInTheDocument();
  });

  it('should highlight the current move', () => {
    const moves = ['e4', 'e5', 'Nf3'];
    render(<MovePanel moveHistory={moves} currentMoveIndex={2} />);
    const nf3Move = screen.getByText('Nf3').closest('.moveRow');
    expect(nf3Move).toHaveClass('active');
  });

  it('should show navigation controls in training mode', () => {
    render(<MovePanel gameMode="TRAINING" moveHistory={['e4']} />);
    expect(screen.getByTitle(/Previous Move/i)).toBeInTheDocument();
  });

  it('should not show navigation in timed mode', () => {
    render(<MovePanel gameMode="TIMED" moveHistory={['e4']} />);
    expect(screen.queryByTitle(/Previous Move/i)).not.toBeInTheDocument();
  });
});
```

**`useNavigationState.test.ts`:**
```typescript
describe('Move Navigation', () => {
  it('should navigate back through history', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setMoveHistory(['e4', 'e5', 'Nf3', 'Nc6']);
      result.current.navigateToMove(1); // e5
    });

    expect(result.current.reviewIndex).toBe(1);
  });

  it('should prevent navigation in timed mode', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setClockState({ gameMode: 'TIMED' });
      result.current.navigateBack();
    });

    expect(result.current.reviewMode).toBe(false);
  });
});
```

### Integration Tests

1. ✅ Move display updates when new move received via WebSocket
2. ✅ PGN export includes all moves and metadata
3. ✅ Navigation reconstructs correct positions
4. ✅ Review mode disables piece dragging
5. ✅ Return to live restores game state

### E2E Tests (Manual)

1. Play 10 moves, verify all shown in panel
2. Click move 5, verify board shows that position
3. Use arrow keys to navigate
4. Export PGN, reimport, verify identical
5. Test responsive layout on mobile

---

## Responsive Design

### Desktop (>1024px)
```
┌────────────────┐  ┌──────────────┐
│  Video Panel   │  │ ⚫ Opponent   │
│                │  │   Clock       │
│                │  ├──────────────┤
│                │  │ Move History │
│                │  │ 1. e4   e5   │
│                │  │ 2. Nf3  Nc6  │
│                │  │ 3. Bc4  Bc5  │
│                │  │ [⏮][◀][▶][⏭]│
│                │  │ [Copy][Down] │
└────────────────┘  ├──────────────┤
┌────────────────┐  │ Turn: White  │
│   Chess Board  │  ├──────────────┤
│                │  │ ⚪ You        │
│                │  │   Clock       │
└────────────────┘  └──────────────┘
```

### Tablet (640-1024px)
```
┌──────────────────────────────────┐
│         Video Panel              │
└──────────────────────────────────┘

┌──────────────┐  ┌──────────────┐
│ ⚫ Opp Clock  │  │ ⚪ You Clock  │
└──────────────┘  └──────────────┘

┌──────────────────────────────────┐
│         Chess Board              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│         Move History             │
│         1. e4 e5  2. Nf3 Nc6     │
│         [⏮][◀][▶][⏭]             │
└──────────────────────────────────┘
```

### Mobile (<640px)
```
┌──────────────────────────────────┐
│         Video Panel              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│         Chess Board              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ⚫ Opp: 5:00    Turn: White       │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Moves ▼ (collapsible)            │
│ 1. e4 e5  2. Nf3 Nc6             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ⚪ You: 4:58                      │
└──────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Always-On Move History
- [ ] Create `MovePanel.tsx` component
- [ ] Create `usePairedMoves.ts` helper hook
- [ ] Add move list display with SAN notation
- [ ] Implement move pairing (1. e4 e5)
- [ ] Add auto-scroll to latest move
- [ ] Highlight current/latest move
- [ ] Add PGN copy to clipboard
- [ ] Add PGN download functionality
- [ ] Integrate into `ActiveGame.tsx` side panel
- [ ] Update responsive CSS for mobile layout
- [ ] Write unit tests for MovePanel
- [ ] Write tests for usePairedMoves
- [ ] Manual testing across screen sizes

### Phase 2: Training Navigation
- [ ] Add navigation state to `useGameState.ts`
  - [ ] `reviewMode` boolean
  - [ ] `reviewIndex` number
  - [ ] `reviewPosition` string
- [ ] Implement `navigateToMove()` function
- [ ] Implement `navigateBack()` function
- [ ] Implement `navigateForward()` function
- [ ] Implement `navigateToStart()` function
- [ ] Implement `navigateToEnd()` function
- [ ] Implement `exitReviewMode()` function
- [ ] Add navigation controls to MovePanel
  - [ ] ⏮ Jump to Start button
  - [ ] ◀ Previous Move button
  - [ ] ▶ Next Move button
  - [ ] ⏭ Jump to End button
- [ ] Add keyboard shortcuts (arrow keys, Home, End)
- [ ] Show review mode banner
- [ ] Add "Return to Live" button
- [ ] Disable navigation in TIMED mode
- [ ] Disable piece dragging in review mode
- [ ] Update ChessBoard with `reviewMode` prop
- [ ] Write navigation state tests
- [ ] Write keyboard shortcut tests
- [ ] Manual testing of position reconstruction

### Phase 3: PGN Workflow (Future)
- [ ] Add "Import PGN" button
- [ ] Create PGN import modal
- [ ] Implement PGN validation
- [ ] Add file upload option
- [ ] Show move timestamps (if available)
- [ ] Add figurine notation toggle
- [ ] Add tabbed side panel (Clocks | Moves | Notes)
- [ ] Integrate engine evaluation (requires Stockfish)
- [ ] Add annotation system
- [ ] Write import/export integration tests

---

## Performance Considerations

### Optimization Strategies

1. **Virtualized Move List**
   - Use `react-window` for large games (100+ moves)
   - Only render visible moves in viewport
   - Reduces DOM nodes significantly

2. **Memoization**
   ```typescript
   const pairedMoves = useMemo(
     () => pairMoves(moveHistory),
     [moveHistory]
   );
   ```

3. **Debounce Auto-Scroll**
   ```typescript
   const scrollToBottom = useDebouncedCallback(() => {
     moveListRef.current?.scrollTo({ bottom: 0, behavior: 'smooth' });
   }, 100);
   ```

4. **Lazy Position Reconstruction**
   - Only reconstruct when navigating, not on every render
   - Cache reconstructed positions for visited moves

---

## Accessibility

### ARIA Labels
```tsx
<div
  className={styles.moveList}
  role="list"
  aria-label="Game move history"
>
  <div
    role="listitem"
    aria-label={`Move ${moveNumber}: ${whiteMove} ${blackMove}`}
    tabIndex={0}
  >
    {/* Move content */}
  </div>
</div>
```

### Keyboard Navigation
- ✅ Tab through moves
- ✅ Arrow keys for navigation
- ✅ Enter to select move
- ✅ Escape to exit review mode
- ✅ Focus indicators on all interactive elements

### Screen Reader Support
- Announce when entering review mode
- Announce current move on navigation
- Provide context for navigation buttons

---

## Future Enhancements

### Advanced Features (Phase 4+)

1. **Variations Support**
   - Display alternative move sequences
   - Tree structure for branching lines
   - Promote variation to main line

2. **Opening Book Integration**
   - Show opening name (e.g., "Ruy Lopez")
   - Link to opening explorer
   - Display theory depth indicator

3. **Game Analysis**
   - Integrate Stockfish for evaluation
   - Show blunders/mistakes/inaccuracies
   - Generate analysis report

4. **Social Features**
   - Share specific positions via URL
   - Embed games on external sites
   - Game database/library

5. **Study Mode**
   - Create custom training positions
   - Build repertoire with annotations
   - Spaced repetition for tactics

---

## Dependencies & Libraries

### Required
- ✅ `chess.js` - Already installed, provides PGN generation
- ✅ `react` - Core framework
- ✅ TypeScript - Type safety

### Optional (Phase 3+)
- `react-window` - Virtualized lists for long games
- `pgn-parser` - Advanced PGN parsing with variations
- `chess-pgn-viewer` - Reference implementation
- `stockfish.js` - Engine evaluation

---

## API Integration

### Backend Changes Required: NONE ✅

**Why no backend changes needed:**
- Move history already tracked in `Game.moveHistory`
- WebSocket already broadcasts move updates
- All navigation is client-side using chess.js
- PGN generation is client-side
- Training mode is local to user session

**Future Considerations:**
- Game database for saving/loading games
- Server-side engine analysis (expensive)
- Shared study positions (multi-user)

---

## Migration Path

### From Current State to Phase 1

1. **No Breaking Changes**
   - MovePanel is additive, doesn't modify existing code
   - Slots into existing side panel layout
   - Uses existing `gameState.moveHistory`

2. **CSS Updates**
   - Expand side panel width: 240px → 280px
   - Add grid layout for responsive behavior
   - New classes don't conflict with existing

3. **State Management**
   - No changes to useGameState in Phase 1
   - Just consume existing `moveHistory` field

### From Phase 1 to Phase 2

1. **State Extensions**
   - Add navigation state to useGameState
   - Backward compatible (defaults to reviewMode: false)

2. **ChessBoard Updates**
   - Add optional `reviewMode` prop
   - Existing behavior unchanged when false

---

## Success Metrics

### Phase 1
- ✅ Move list displays all moves correctly
- ✅ Auto-scrolls to latest move
- ✅ PGN export works for 100% of games
- ✅ Mobile layout doesn't overlap clocks

### Phase 2
- ✅ Navigation reconstructs positions accurately
- ✅ No crashes when navigating long games (100+ moves)
- ✅ Keyboard shortcuts work reliably
- ✅ Users can't accidentally submit moves in review mode

### Phase 3
- ✅ PGN import success rate >95%
- ✅ Handles games up to 200 moves smoothly
- ✅ Annotations persist across sessions

---

## Additional Research Links

### Reference Implementations
- **Lichess Analysis**: https://lichess.org/analysis
- **Chess.com Game Review**: https://www.chess.com/analysis
- **ChessTempo PGN Viewer**: https://old.chesstempo.com/pgn-examples.html
- **PGN Specification**: http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm

### Community Discussions
- Lichess Forum - Study UI: https://lichess.org/forum/lichess-feedback/suggestion-lichess-study-ui-update
- Chess.com Forum - Move List Issues: https://www.chess.com/forum/view/help-support/problem-moves-list-over-back-forward-buttons

### Technical Resources
- chess.js Documentation: https://github.com/jhlywa/chess.js
- react-chessboard: https://github.com/Clariity/react-chessboard
- PGN Parser Library: https://www.npmjs.com/package/pgn-parser

---

## Questions & Decisions

### Design Decisions Made
✅ Keep clock and move panel separate but integrated
✅ Side panel layout for desktop, stacked for mobile
✅ Training-only navigation to prevent cheating
✅ Client-side implementation (no backend changes)
✅ Progressive enhancement (Phase 1 → 2 → 3)

### Open Questions
❓ Should we support variations in Phase 2 or Phase 3?
❓ Do we need move timestamps in Phase 1 or wait for Phase 3?
❓ Should PGN import create a new game or overlay existing?
❓ How to handle draw offers / resignation in move panel?
❓ Should we show opening names from an opening book?

---

## Next Steps

1. **Immediate:** Review this documentation with stakeholders
2. **Planning:** Create GitHub issues for each phase
3. **Phase 1 Start:** Begin with MovePanel component implementation
4. **Timeline:** Target 1 week for Phase 1 MVP

---

**Document Version:** 1.0
**Last Updated:** 2025-01-09
**Author:** Based on user research + industry analysis
**Status:** Ready for implementation
