# Move Panel - Quick Start Guide

## TL;DR

Add a professional move history panel with navigation controls for training mode.

**Estimated Time:** 12-16 hours for MVP + Training controls
**No Backend Changes Required** ✅

---

## What You're Building

```
Side Panel Layout:
┌─────────────────┐
│ ⚫ Black: 5:00  │  ← Existing
├─────────────────┤
│ Move History    │  ← NEW
│ 1. e4    e5     │
│ 2. Nf3   Nc6    │
│ 3. Bc4   Bc5    │
│ [⏮][◀][▶][⏭]   │  ← Training only
│ [Copy] [Export] │
├─────────────────┤
│ Turn: White     │  ← Existing
├─────────────────┤
│ ⚪ White: 4:58  │  ← Existing
└─────────────────┘
```

---

## Implementation Steps

### Step 1: Create MovePanel Component (2 hours)

**File:** `frontend/src/components/MovePanel.tsx`

```typescript
interface MovePanelProps {
  moveHistory: string[];
  currentMoveIndex: number;
  gameMode: 'TIMED' | 'TRAINING';
  onMoveClick?: (index: number) => void;
}

export const MovePanel: React.FC<MovePanelProps> = ({
  moveHistory,
  currentMoveIndex,
  gameMode,
  onMoveClick
}) => {
  // Pair moves: ["e4", "e5"] → [{white: "e4", black: "e5"}]
  const pairs = pairMoves(moveHistory);

  return (
    <div className={styles.movePanel}>
      {/* Move List */}
      <div className={styles.moveList}>
        {pairs.map((pair, idx) => (
          <div key={idx} className={styles.moveRow}>
            <span className={styles.number}>{idx + 1}.</span>
            <span className={styles.white}>{pair.white}</span>
            <span className={styles.black}>{pair.black}</span>
          </div>
        ))}
      </div>

      {/* PGN Export */}
      <button onClick={copyPGN}>📋 Copy PGN</button>
    </div>
  );
};
```

**Helper:**
```typescript
function pairMoves(moves: string[]) {
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ white: moves[i], black: moves[i + 1] || null });
  }
  return pairs;
}
```

---

### Step 2: Add to ActiveGame (30 min)

**A. Update ActiveGame Props Interface**

**File:** `frontend/src/components/ActiveGame.tsx`

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
```

**B. Add MovePanel to Side Panel**

In the sidePanel section (around line 123), insert MovePanel after Opponent Clock:

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

  {/* 2. Move Panel (NEW) */}
  <MovePanel
    moveHistory={moveHistory}
    currentMoveIndex={reviewIndex ?? -1}
    gameMode={clockState?.gameMode || 'TIMED'}
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

**C. Update ChessBoard to pass reviewMode**

Around line 105:

```typescript
<ChessBoard
  position={position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : position}
  game={game}
  playerColor={playerColor}
  isMyTurn={isMyTurn}
  onMove={onMove}
  isTimeExpired={isTimeExpired}
  reviewMode={reviewMode} // NEW
/>
```

**D. Update ChessCoachApp to Pass Navigation Props**

**File:** `frontend/src/ChessCoachApp.tsx`

After implementing Step 3 (navigation state in useGameState), update the ActiveGame call around line 355:

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
  // NEW: Navigation functions from Step 3
  navigateToMove,
  navigateBack,
  navigateForward,
  navigateToStart,
  navigateToEnd
} = useGameState(authService, authState.currentUser);

// ... later in render:

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

---

### Step 3: Add Navigation State (2 hours)

**File:** `frontend/src/hooks/useGameState.ts`

```typescript
// 1. Extend GameState interface to include navigation state
interface GameState {
  // ... existing fields
  moveHistory: string[];
  position: string;
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

// 3. Add navigation functions
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

---

### Step 4: Add Training Controls (1.5 hours)

**Update MovePanel.tsx:**

```typescript
// Add props
interface MovePanelProps {
  moveHistory: string[];
  currentMoveIndex: number; // reviewIndex from gameState
  gameMode: 'TIMED' | 'TRAINING';
  reviewMode?: boolean;
  onNavigateToStart?: () => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateToEnd?: () => void;
  onMoveClick?: (plyIndex: number) => void;
}

// In component body:
{gameMode === 'TRAINING' && (
  <div className={styles.controls}>
    {reviewMode && (
      <div className={styles.banner}>
        📖 Reviewing Move {Math.floor(currentMoveIndex / 2) + 1}
        {currentMoveIndex % 2 === 0 ? ' (White)' : ' (Black)'}
        <button onClick={onNavigateToEnd}>Return to Live</button>
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
```

**Add Keyboard Support:**
```typescript
useEffect(() => {
  if (gameMode !== 'TRAINING') return;

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onNavigateBack?.();
    if (e.key === 'ArrowRight') onNavigateForward?.();
    if (e.key === 'Home') onNavigateToStart?.();
    if (e.key === 'End') onNavigateToEnd?.();
  };

  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [gameMode]);
```

---

### Step 5: CSS Styling (1 hour)

**File:** `frontend/src/components/MovePanel.module.css`

```css
.movePanel {
  background-color: var(--bg-card);
  border-radius: 8px;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 400px;
  overflow: hidden;
}

.moveList {
  flex: 1;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
}

.moveRow {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  border-radius: 4px;
}

.moveRow:hover {
  background-color: var(--bg-card-hover);
}

.moveRow.active {
  background-color: rgba(103, 80, 164, 0.3);
  font-weight: bold;
}

.navButtons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-xs);
}

.navButtons button {
  padding: var(--space-sm);
  font-size: 1.2rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-normal);
  border-radius: 6px;
  cursor: pointer;
}

.navButtons button:hover {
  background-color: var(--bg-card-hover);
}

.navButtons button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

---

### Step 6: Update Side Panel Width (15 min)

**File:** `frontend/src/styles/shared.module.css`

```css
.sidePanel {
  width: 280px; /* Increased from 240px to fit move panel */
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
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

## Testing Checklist

**Phase 1 - Display:**
- [ ] Move list shows all moves in correct order
- [ ] Moves are paired (1. e4 e5)
- [ ] Auto-scrolls to latest move
- [ ] Latest move is highlighted
- [ ] Copy PGN works
- [ ] Mobile layout doesn't break

**Phase 2 - Navigation:**
- [ ] Can click move to jump to it (training only)
- [ ] Arrow buttons work correctly
- [ ] Keyboard shortcuts work (←→ Home End)
- [ ] Can't navigate in TIMED mode
- [ ] Can't drag pieces in review mode
- [ ] "Return to Live" restores game state
- [ ] Position reconstruction is accurate

---

## Common Issues & Solutions

### Issue: Moves not displaying
**Solution:** Check that `gameState.moveHistory` is populated
```typescript
console.log('Move history:', gameState.moveHistory);
```

### Issue: Navigation not working
**Solution:** Verify game mode is TRAINING
```typescript
if (clockState?.gameMode !== 'TRAINING') {
  console.warn('Navigation only in training mode');
  return;
}
```

### Issue: Board not updating on navigation
**Solution:** Make sure position is set from reconstructed game
```typescript
const reviewGame = new Chess();
for (let i = 0; i <= index; i++) {
  reviewGame.move(moveHistory[i]);
}
setPosition(reviewGame.fen()); // Must update position state
```

### Issue: Side panel too narrow
**Solution:** Increase width in CSS
```css
.sidePanel {
  width: 280px; /* Enough for move list */
}
```

---

## File Checklist

**New Files:**
- [ ] `frontend/src/components/MovePanel.tsx` (150 lines)
- [ ] `frontend/src/components/MovePanel.module.css` (100 lines)
- [ ] `frontend/src/hooks/usePairedMoves.ts` (20 lines) - optional helper
- [ ] `frontend/src/hooks/useScrollToBottom.ts` (15 lines) - auto-scroll helper

**Modified Files:**
- [ ] `frontend/src/components/ActiveGame.tsx` (+20 lines - updated sidebar layout)
- [ ] `frontend/src/hooks/useGameState.ts` (+80 lines - navigation state & functions)
- [ ] `frontend/src/styles/shared.module.css` (+30 lines - responsive behavior)
- [ ] `frontend/src/components/ChessBoard.tsx` (+5 lines - reviewMode prop)

**Total:** ~350 lines of code

---

## PGN Export Implementation

```typescript
const handleCopyPGN = () => {
  // chess.js provides built-in PGN generation
  const pgn = game.pgn();

  navigator.clipboard.writeText(pgn).then(() => {
    showToast('success', 'PGN copied to clipboard');
  });
};

const handleDownloadPGN = () => {
  const pgn = game.pgn();
  const blob = new Blob([pgn], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Game-${gameState.gameId}.pgn`;
  a.click();

  URL.revokeObjectURL(url);
};
```

---

## Helper Hooks Implementation

### useScrollToBottom Hook

**File:** `frontend/src/hooks/useScrollToBottom.ts`

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

**Usage in MovePanel:**
```typescript
const MovePanel: React.FC<MovePanelProps> = ({ moveHistory, ... }) => {
  const moveListRef = useScrollToBottom(moveHistory.length);

  return (
    <div className={styles.movePanel}>
      <div ref={moveListRef} className={styles.moveList}>
        {/* Move rows */}
      </div>
    </div>
  );
};
```

### Click-to-Jump Implementation

**In MovePanel.tsx:**
```typescript
const MovePanel: React.FC<MovePanelProps> = ({
  moveHistory,
  currentMoveIndex,
  gameMode,
  onMoveClick
}) => {
  const pairs = pairMoves(moveHistory);

  const handleMoveClick = (rowIndex: number, column: 'white' | 'black') => {
    if (gameMode !== 'TRAINING') return;

    // Convert row/column to ply index
    const plyIndex = column === 'white'
      ? rowIndex * 2          // White's move: even ply
      : rowIndex * 2 + 1;     // Black's move: odd ply

    // Only navigate if that move exists
    if (plyIndex < moveHistory.length) {
      onMoveClick?.(plyIndex);
    }
  };

  return (
    <div className={styles.movePanel}>
      <div className={styles.moveList}>
        {pairs.map((pair, idx) => (
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
    </div>
  );
};
```

**CSS for clickable moves:**
```css
.white, .black {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.white:hover, .black:hover {
  background-color: var(--bg-card-hover);
}

.white.active, .black.active {
  background-color: rgba(103, 80, 164, 0.3);
  font-weight: var(--font-semibold);
}
```

### ChessBoard Review Mode Integration

**File:** `frontend/src/components/ChessBoard.tsx`

Add `reviewMode` prop to interface:
```typescript
interface ChessBoardProps {
  position: string;
  game: Chess;
  playerColor: 'white' | 'black' | null;
  isMyTurn: () => boolean;
  onMove: (move: string, fen: string, moveObj?: { from: string; to: string; promotion?: string }) => void;
  isTimeExpired?: boolean;
  reviewMode?: boolean; // NEW: Disable moves when reviewing history
}
```

Update piece drop handler:
```typescript
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
```

Update `isDraggablePiece` function:
```typescript
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

**Update ActiveGame to pass reviewMode:**
```typescript
<ChessBoard
  position={gameState.position}
  game={gameRef}
  playerColor={gameState.playerColor}
  isMyTurn={isMyTurn}
  onMove={makeMove}
  isTimeExpired={isTimeExpired}
  reviewMode={gameState.reviewMode} // NEW
/>
```

---

## Next Features (Future)

After completing MVP + Training controls, consider:

1. **PGN Import** - Load training positions
2. **Move Timestamps** - Show time spent per move
3. **Figurine Notation** - Use piece symbols (♘ instead of N)
4. **Engine Evaluation** - Show position assessment
5. **Variations** - Support alternative move sequences
6. **Opening Names** - Display opening theory

---

## Performance Notes

- ✅ No backend changes needed
- ✅ Uses existing moveHistory from WebSocket
- ✅ Client-side only using chess.js
- ✅ For games >100 moves, consider virtualizing list

---

## Summary

**What works after this:**
- ✅ Professional move list display
- ✅ PGN export functionality
- ✅ Training mode navigation (back/forward through history)
- ✅ Keyboard shortcuts
- ✅ Mobile responsive layout

**What's missing (Phase 3):**
- ❌ PGN import
- ❌ Move annotations
- ❌ Engine evaluation
- ❌ Variations support

**Recommended order:**
1. Step 1-2: Basic display (2.5 hours) → Ship MVP
2. Step 3-4: Navigation (3.5 hours) → Complete training features
3. Step 5-6: Polish (1.5 hours) → Production ready

**Total: 6-9 hours** for a complete, professional move panel!

---

**Ready to implement?** Start with Step 1 and work through sequentially. Each step is independent and testable.
