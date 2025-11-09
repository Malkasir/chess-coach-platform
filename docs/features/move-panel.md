# Move Panel Feature

**Status:** ✅ Completed
**Shipped:** 2025-01-09
**Backend Changes Required:** None

## Overview

Professional move history display with training mode navigation controls. Allows users to review past positions, export PGN, and navigate game history using keyboard shortcuts.

## Features

- **Always-on Move Display:** Paired notation (1. e4 e5) shown in scrollable panel
- **Training Mode Navigation:** Back/forward/start/end controls (disabled in timed games)
- **Review Mode:** View any position without affecting live game state
- **PGN Export:** Full game export with proper headers (Event, Site, Date, etc.)
- **Keyboard Shortcuts:** ←/→ (moves), Home/End (start/live)
- **Live Position Preservation:** Server updates don't eject you from review mode

## Architecture Decisions

### Why Review State Lives in useGameState

**Decision:** `reviewMode` and `reviewIndex` are part of GameState interface (useGameState.ts:18-21)

**Rationale:**
- Navigation affects what position is displayed on the board
- ChessBoard needs to know review state to disable moves
- Position reconstruction requires access to full moveHistory
- Centralized state makes prop drilling explicit and type-safe

**Files:**
- `frontend/src/hooks/useGameState.ts:18-21` (state interface)
- `frontend/src/hooks/useGameState.ts:439-495` (navigation functions)

### Why ChessBoard Blocks Moves in Review Mode

**Decision:** ChessBoard receives `reviewMode` prop and disables drag-and-drop (ChessBoard.tsx:14, 24, 46-49, 101-104)

**Rationale:**
- Prevents accidental moves while reviewing history
- Clear user feedback (pieces not draggable)
- Works alongside existing `isTimeExpired` check
- Consistent with industry standards (Chess.com, Lichess)

**Implementation:**
```typescript
// ChessBoard.tsx:46-49
if (reviewMode) {
  debugLog('📖 Move blocked: Currently reviewing game history');
  return false;
}
```

### Why PGN Always Reconstructs from moveHistory

**Decision:** PGN export ignores the provided `game` instance and rebuilds from scratch (MovePanel.tsx:69-81)

**Rationale:**
- `gameRef.current` is truncated during review mode (navigateToMove loads partial game)
- moveHistory always contains the full game regardless of review position
- Ensures PGN export never loses moves
- Fallback to `moveHistory.join(' ')` if reconstruction fails

**Bug Fixed:** Copy PGN was exporting only moves up to review position (colleague review #2, finding #2)

### Why Navigation State Resets Between Games

**Decision:** All game transitions reset `reviewMode: false, reviewIndex: -1` (useGameState.ts:204-206, 233-235, 355-357, 401-403, 426-427)

**Rationale:**
- New game should start at live position, not in review mode
- Prevents confusing state carryover
- Training mode correctly starts enabled for navigation

**Bug Fixed:** Training mode not working when transitioning from previous game (colleague review #1)

### Why handleGameMessage Checks reviewMode

**Decision:** MOVE and GAME_STATE handlers preserve review state when active (useGameState.ts:54-97)

**Rationale:**
- Server sends position updates when opponent moves
- Without check, user gets ejected from review mode back to live position
- Only updates moveHistory and clockState, keeps review position intact
- When not in review mode, updates position normally

**Implementation:**
```typescript
// useGameState.ts:54-72
case 'MOVE':
  if (message.fen && message.move) {
    setGameState(prev => {
      // If in review mode, only update moveHistory but keep review position
      if (prev.reviewMode) {
        return {
          ...prev,
          moveHistory: message.moveHistory || [...prev.moveHistory, message.move!],
          clockState: message.clockState || prev.clockState
        };
      }
      // Not in review mode - update position normally
      gameRef.current.load(message.fen);
      return { ...prev, position: message.fen!, ... };
    });
  }
```

**Bug Fixed:** Review mode breaking on server updates (colleague review #2, finding #1)

### Why navigateBack Has Special Case for Live Position

**Decision:** navigateBack checks if `reviewIndex === -1` and jumps to last move (useGameState.ts:464-470)

**Rationale:**
- At live position, index is -1
- Simple subtraction (-1 - 1 = -2) fails the >= -1 check
- User can't enter review mode using back button
- Special case treats live position as "after last move" for navigation

**Bug Fixed:** Can't step backward from live position (colleague review #2, finding #1)

## File Structure

```
frontend/src/
├── components/
│   ├── MovePanel.tsx              # Main component with navigation controls
│   ├── MovePanel.module.css       # Styling for move list and buttons
│   ├── ActiveGame.tsx             # Passes game + navigation props
│   └── ChessBoard.tsx             # Blocks moves when reviewMode=true
├── hooks/
│   ├── useGameState.ts            # Review state + navigation functions
│   ├── usePairedMoves.ts          # Converts ["e4","e5"] → [{white:"e4", black:"e5"}]
│   └── useScrollToBottom.ts       # Auto-scrolls to latest move
└── types/
    └── clock.types.ts             # GameMode enum (TIMED vs TRAINING)
```

## Key Implementation Details

### Move Numbering

- **Ply:** Half-move (one player's move). Index 0 = first white move, index 1 = first black move
- **Move Number:** Full move pair. Calculated as `Math.floor(plyIndex / 2) + 1`
- **Color:** `plyIndex % 2 === 0` → White, otherwise Black

### Review Banner Display

```typescript
// MovePanel.tsx:136-143
{currentMoveIndex === -1 ? (
  '📖 Reviewing Starting Position'
) : (
  <>
    📖 Reviewing Move {Math.floor(currentMoveIndex / 2) + 1}
    {currentMoveIndex % 2 === 0 ? ' (White)' : ' (Black)'}
  </>
)}
```

**Bug Fixed:** Banner showed "Move 0 (Black)" for starting position (colleague review #2, finding #4)

### Navigation Button Disable Logic

```typescript
// MovePanel.tsx:152-165
<button onClick={onNavigateToStart}
  disabled={moveHistory.length === 0 || (reviewMode && currentMoveIndex === -1)}
/>
<button onClick={onNavigateBack}
  disabled={moveHistory.length === 0 || (reviewMode && currentMoveIndex === -1)}
/>
<button onClick={onNavigateForward}
  disabled={currentMoveIndex >= moveHistory.length - 1}
/>
<button onClick={onNavigateToEnd}
  disabled={currentMoveIndex === -1}
/>
```

**Logic:**
- Back/Start: Enabled at live position when moves exist (allows entering review mode)
- Back/Start: Disabled when no moves OR already at starting position in review mode
- Forward: Disabled when at or past last move
- End: Disabled when already at live position

## Responsive Design

### Desktop (>1024px)
- Video panel: Left (350px)
- Board: Center (466px)
- Side panel: Right (280px), vertical stack:
  1. Opponent clock
  2. Move panel
  3. Turn indicator
  4. Player clock
  5. Time control info

### Tablet/Mobile (<1024px)
- Stacked layout with CSS Grid
- Move panel spans full width
- Clocks side-by-side above/below

**File:** `frontend/src/styles/shared.module.css:226-254`

## Testing Checklist

### Manual Testing
- [ ] Moves display in paired notation (1. e4 e5)
- [ ] Auto-scrolls to latest move
- [ ] Navigation only works in TRAINING mode
- [ ] Back button enters review mode from live position
- [ ] Review banner shows correct move number and color
- [ ] Opponent moves don't eject you from review mode
- [ ] Copy PGN exports full game regardless of review position
- [ ] Keyboard shortcuts work (←/→/Home/End)
- [ ] Pieces not draggable in review mode
- [ ] "Return to Live" button exits review mode
- [ ] Navigation resets when starting new game

### Edge Cases
- [ ] No moves: Buttons disabled, empty state shown
- [ ] Single move: Forward disabled from that move
- [ ] Starting position: Banner shows "Starting Position"
- [ ] Live position: Back/Start enabled (can enter review)

## Known Limitations

1. **No move annotations:** Future feature (comments, NAGs, variations)
2. **No PGN import:** Planned for Phase 3
3. **No virtualization:** 100+ move games may lag (rare for MVP)
4. **Training mode only:** Navigation disabled in timed games (by design)

## Future Enhancements

- [ ] PGN import from file/clipboard
- [ ] Move annotations and comments
- [ ] Engine evaluation bar
- [ ] Opening book recognition
- [ ] Virtualized list for 200+ move games

## Related Documentation

- **Implementation Guides (Archived):**
  - `MOVE_PANEL_IMPLEMENTATION_ARCHIVE.md` (original 400+ line spec)
  - `MOVE_PANEL_QUICK_START_ARCHIVE.md` (step-by-step guide)

- **Other Features:**
  - Game Clock System
  - Modal-based UX improvements
  - Side panel layout

## Changelog

### v0.0.0 (2025-01-09) - Initial Implementation

**Added:**
- Move history display with paired notation
- Training mode navigation controls
- Review mode with live position preservation
- PGN export with proper formatting
- Keyboard shortcuts (←/→/Home/End)

**Fixed (Post-Implementation Reviews):**
- Review mode preservation during server updates
- Navigation button enable/disable logic
- PGN export truncation in review mode
- Banner display for starting position
- Can't enter review mode from live position

**Components Created:**
- `MovePanel.tsx` - Main component
- `MovePanel.module.css` - Styling
- `usePairedMoves.ts` - Move pairing hook
- `useScrollToBottom.ts` - Auto-scroll hook

**Modified:**
- `useGameState.ts` - Added review state + navigation
- `ChessBoard.tsx` - Added reviewMode prop
- `ActiveGame.tsx` - Integrated MovePanel
- `shared.module.css` - Updated responsive layout
