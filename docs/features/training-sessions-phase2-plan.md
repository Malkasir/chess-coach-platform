# Training Sessions Phase 2 - Interactive Mode

**Status:** 🚧 **PLANNED** (Not Started)
**Target:** Q2 2025
**Depends On:** Phase 1 (✅ Shipped 2025-01-12)
**Branch:** `feature/training-interactive-mode`

---

## Executive Summary

Phase 2 transforms training sessions from **coach-only demonstrations** (Phase 1) to **interactive coaching experiences** where students can make moves with coach supervision. This unlocks the core value proposition: collaborative learning through hands-on practice.

---

## User Pain Points (Phase 1 Limitations)

### Current State
1. **Students are passive spectators** - Can only watch, cannot participate
2. **No student move control** - Coach must make all moves manually
3. **No reset/restart functionality** - Can't quickly restart from a position
4. **Single static role** - Can't switch who plays which color
5. **No move approval workflow** - No way to grant/revoke student control

### User Feedback
> "I want to let my student try to find the move themselves, then correct them if they're wrong." - Coach feedback

> "I'm just watching. I want to try making moves and see if I got it right." - Student feedback

---

## Proposed Features

### Feature 1: Interactive Mode Toggle
**What:** Coach can enable/disable interactive mode during a training session.

**User Story:**
- As a **coach**, I want to toggle interactive mode on/off so that I can switch between demonstration and practice modes.

**Acceptance Criteria:**
- [ ] Coach sees "Interactive Mode: Off" button in training session UI
- [ ] Click toggles to "Interactive Mode: On" (green/highlighted)
- [ ] State broadcasts to all participants via WebSocket
- [ ] Students see "Interactive Mode Active" indicator
- [ ] Default state: OFF (maintains Phase 1 behavior)

**Technical Notes:**
- Add `interactiveMode: boolean` to `TrainingSession` entity
- New WebSocket message type: `MODE_CHANGED`
- Backend validates only coach can toggle mode

---

### Feature 2: Direct Student Moves (No Approval Needed)
**What:** When interactive mode is enabled, assigned students can make moves directly without coach approval.

**User Story:**
- As a **student**, I want to make moves directly so that I can practice naturally without waiting for approval.
- As a **coach**, I want students to move freely so that lessons flow smoothly. I can use Undo if they make mistakes.

**Acceptance Criteria:**
- [ ] When interactive mode ON, students assigned to white/black can drag their pieces
- [ ] Student move validates legality (chess.js), then broadcasts immediately to all participants
- [ ] Illegal moves show error message: "Illegal move, try again"
- [ ] Coach sees move happen in real-time (can Undo if needed)
- [ ] All spectators see the move
- [ ] Move adds to move history panel
- [ ] Only assigned student can move their color (white student can't move black pieces)

**UI Behavior:**
```
Interactive Mode ON + Student assigned to White:
→ Student drags white pawn e2→e4
→ Move validates ✓
→ Broadcasts to all immediately
→ Coach sees move, can Undo if wrong
```

**Technical Notes:**
- Reuse existing `POSITION_UPDATE` WebSocket message type (no new types needed!)
- Frontend validation: `game.move()` on client side before sending
- Backend validation: Double-check move legality before broadcasting
- Frontend enables dragging for assigned color only
- Much simpler than approval workflow - fewer message types, less state

---

### Feature 3: Role Assignment (Play as White/Black)
**What:** Coach can assign a student to play as white or black.

**User Story:**
- As a **coach**, I want to assign a student to play white or black so that they can practice a specific side.
- As a **student**, I want to know which color I'm playing so that I only move my pieces.

**Acceptance Criteria:**
- [ ] Coach sees participant list with "Assign Role" dropdown per student
  - Options: "Spectator" (default), "Play as White", "Play as Black"
- [ ] Only ONE student can play white, ONE can play black at a time
- [ ] Assigning a role unassigns previous student (if any)
- [ ] Student sees "You are playing as White/Black" banner
- [ ] Student can ONLY move their assigned color's pieces
- [ ] Coach can always move both colors (override student roles)
- [ ] Coach can revoke role (set back to "Spectator")

**UI Mockup:**
```
┌─────────────────────────────┐
│ Participants (3)            │
├─────────────────────────────┤
│ 👨 Coach (You)              │
│ 👤 Alice [Play as White ▼] │
│ 👤 Bob   [Spectator ▼]     │
└─────────────────────────────┘
```

**Technical Notes:**
- Add to `TrainingSession` entity:
  - `whitePlayerId: Long` (nullable)
  - `blackPlayerId: Long` (nullable)
- New WebSocket message type: `ROLE_ASSIGNED`
- Frontend disables drag for pieces that don't match student's assigned color
- Backend validates move origin matches assigned role

---

### Feature 4: Reset Position Button
**What:** Coach can reset the board to starting position or a custom FEN without ending the session.

**User Story:**
- As a **coach**, I want to reset the position so that I can quickly restart a drill or set up a new position without creating a new session.

**Acceptance Criteria:**
- [ ] Coach sees "Reset Position" button near "End Session"
- [ ] Click shows modal with options:
  - "Starting Position" (standard chess starting position)
  - "Current Position" (set a custom FEN, opens position editor)
  - "Clear Board" (empty board for setting up positions)
- [ ] Confirm reset with "Are you sure? This will clear move history."
- [ ] Reset broadcasts to all participants
- [ ] Move history cleared, move panel shows "No moves yet"
- [ ] Students see notification: "Coach reset the position"

**UI Mockup:**
```
┌─────────────────────────────┐
│ Reset Position              │
├─────────────────────────────┤
│ ⚠ This will clear all moves │
│                             │
│ [♟ Starting Position]       │
│ [📝 Custom FEN]             │
│ [◻ Clear Board]             │
│                             │
│ [Cancel] [Confirm]          │
└─────────────────────────────┘
```

**Technical Notes:**
- Reuses existing `TrainingSessionWebSocketController.updatePosition()`
- Add `POSITION_RESET` message type (vs `POSITION_UPDATE` for moves)
- Frontend shows confirmation modal before sending reset
- Backend clears `moveHistory` JSON array

---

### Feature 5: Undo/Redo Functionality
**What:** Coach can undo/redo moves to demonstrate alternatives or correct student mistakes.

**User Story:**
- As a **coach**, I want to undo moves so that I can correct student mistakes and show them what would happen if they played differently.

**Acceptance Criteria:**
- [ ] Coach sees "Undo" button (disabled if no moves)
- [ ] Click reverts last move, broadcasts to all participants
- [ ] "Redo" button appears (re-applies undone move)
- [ ] Undo stack persists until new move or reset
- [ ] Students see "Coach undid last move" notification
- [ ] Max undo depth: 10 moves (prevent memory issues)
- [ ] **Critical for interactive mode:** Coach can quickly fix student mistakes

**Technical Notes:**
- Frontend maintains `undoStack: Move[]` and `redoStack: Move[]`
- New WebSocket message types: `MOVE_UNDONE`, `MOVE_REDONE`
- Backend updates `moveHistory` and `currentFen` accordingly
- Integrate with existing move navigation in Phase 1

---

### Feature 6: Analysis Panel Permissions
**What:** Coach controls who can see the engine analysis panel to prevent cheating during puzzles/tests.

**User Story:**
- As a **coach**, I want to hide the analysis panel from students during puzzles so they can't cheat with the engine.
- As a **coach**, I want to show analysis to everyone during post-game review so we can learn together.

**Acceptance Criteria:**
- [ ] Coach sees "Analysis Panel" dropdown with options:
  - "Coach Only" (default) - Only coach sees analysis
  - "Everyone" - All participants see analysis
  - "Off" - Analysis disabled for everyone (saves CPU)
- [ ] Setting broadcasts to all participants via WebSocket
- [ ] Students see different UI based on permission:
  - "Coach Only": Panel hidden, message "Analysis disabled by coach"
  - "Everyone": Panel visible and functional
  - "Off": Panel hidden for everyone
- [ ] Coach can always see analysis regardless of setting (override)
- [ ] Setting persists during session (doesn't reset on page refresh)

**UI Mockup:**
```
┌─────────────────────────────┐
│ Training Controls (Coach)   │
├─────────────────────────────┤
│ Interactive Mode: ON ✓      │
│ Analysis Panel: [Coach Only ▼]│
│   • Coach Only (current)    │
│   • Everyone                │
│   • Off                     │
└─────────────────────────────┘
```

**Use Cases:**
1. **Puzzle time:** Set to "Coach Only" → Students can't see best move
2. **Review time:** Set to "Everyone" → Analyze mistakes together
3. **Live game:** Set to "Off" → Save CPU, no analysis needed
4. **Coaching demo:** Set to "Coach Only" → Coach sees lines, explains verbally

**Technical Notes:**
- Add `analysisPermission: 'coach' | 'everyone' | 'off'` to `TrainingSession` entity
- New WebSocket message type: `ANALYSIS_PERMISSION_CHANGED`
- Frontend: Pass `enabled={analysisPermission === 'everyone' || isCoach}` to AnalysisPanel
- Backend validates only coach can change this setting

---

## Out of Scope (Future Phases)

### Phase 3 Features (Not Included)
- ❌ Multiple coaches (assistant coach permissions)
- ❌ Annotation tools (arrows, highlights)
- ❌ Session recording to database
- ❌ Replay with timestamps
- ❌ Quiz mode (timed puzzles)
- ❌ Performance analytics

---

## Technical Architecture

### Backend Changes

#### Entity Updates
```java
@Entity
public class TrainingSession {
    // Existing fields...

    // Phase 2 additions
    private Boolean interactiveMode = false;
    private Long whitePlayerId;
    private Long blackPlayerId;

    @Enumerated(EnumType.STRING)
    private AnalysisPermission analysisPermission = AnalysisPermission.COACH_ONLY;
}

public enum AnalysisPermission {
    COACH_ONLY,   // Only coach sees analysis (default)
    EVERYONE,     // All participants see analysis
    OFF           // Analysis disabled for everyone (saves CPU)
}
```

#### New DTOs
```java
public enum TrainingMessageType {
    // Phase 1 (existing)
    SESSION_STATE,
    PARTICIPANT_JOINED,
    POSITION_UPDATE,       // Reused for student moves!
    SESSION_ENDED,
    ERROR,

    // Phase 2 (new)
    MODE_CHANGED,          // Interactive mode toggled
    ROLE_ASSIGNED,         // Student assigned white/black
    POSITION_RESET,        // Board reset
    MOVE_UNDONE,           // Undo operation
    MOVE_REDONE,           // Redo operation
    ANALYSIS_PERMISSION_CHANGED  // Analysis panel permissions updated
}
```

#### Service Layer Updates
```java
@Service
public class TrainingSessionService {
    // Phase 2 methods
    public void toggleInteractiveMode(String sessionId, boolean enabled);
    public void assignRole(String sessionId, Long studentId, PlayerRole role);
    public void resetPosition(String sessionId, String fen);
    public void undoMove(String sessionId);
    public void redoMove(String sessionId);
    public void setAnalysisPermission(String sessionId, AnalysisPermission permission);

    // Note: No requestMove/approveMove/denyMove - students broadcast directly via POSITION_UPDATE!
}
```

---

### Frontend Changes

#### Component Updates
**`TrainingSession.tsx`**
- Add interactive mode toggle button (coach only)
- Add "Reset Position" button with modal (coach only)
- Add participant role selector dropdown (coach only)
- Add move approval UI (coach only, when pending move exists)
- Add "You are playing as White/Black" banner (student only, when assigned)
- Conditionally enable/disable piece dragging based on:
  - Role (coach/student)
  - Interactive mode state
  - Assigned color (for students)

**`useGameState.ts`** (hook updates)
```typescript
// Phase 2 additions
const [interactiveMode, setInteractiveMode] = useState(false);
const [whitePlayer, setWhitePlayer] = useState<Participant | null>(null);
const [blackPlayer, setBlackPlayer] = useState<Participant | null>(null);
const [pendingMoveRequest, setPendingMoveRequest] = useState<PendingMoveRequest | null>(null);

// New functions
const toggleInteractiveMode = () => { /* ... */ };
const assignRole = (studentId: number, role: 'white' | 'black' | 'spectator') => { /* ... */ };
const requestMove = (move: string) => { /* ... */ };
const approveMove = () => { /* ... */ };
const denyMove = () => { /* ... */ };
const resetPosition = (fen: string) => { /* ... */ };
const undoMove = () => { /* ... */ };
const redoMove = () => { /* ... */ };
```

---

## Implementation Plan

### Milestone 1: Interactive Mode Foundation (1 week)
**Goal:** Core infrastructure for interactive mode

**Tasks:**
1. Add `interactiveMode` boolean to backend entity
2. Implement `toggleInteractiveMode` service method
3. Add WebSocket message type `MODE_CHANGED`
4. Frontend: Add toggle button for coach
5. Frontend: Display mode indicator for students
6. Test: Mode toggle broadcasts correctly

**Acceptance Test:**
- Coach toggles mode, all participants see "Interactive Mode: On" indicator

---

### Milestone 2: Direct Student Moves (1 week) ✨ SIMPLIFIED
**Goal:** Students can make moves directly when assigned and interactive mode is ON

**Tasks:**
1. Frontend: Enable piece dragging for students when interactive mode ON AND assigned to white/black
2. Frontend: Validate move legality with chess.js before broadcasting
3. Frontend: Show "Illegal move" error if validation fails
4. Backend: Double-check move legality before broadcasting (security)
5. Backend: Reject moves from non-assigned students
6. Frontend: Disable dragging for pieces that don't match student's color
7. Test: Student makes legal move → Broadcasts immediately → All boards update

**Acceptance Test:**
- Interactive mode ON → Alice assigned to white → Alice drags e2→e4 → Move broadcasts immediately → Coach/students see it instantly

**Note:** Much simpler than approval workflow! No pending state, no timeout, fewer message types.

---

### Milestone 3: Role Assignment (1 week)
**Goal:** Coach can assign students to play white or black

**Tasks:**
1. Add `whitePlayerId` and `blackPlayerId` to backend entity
2. Implement `assignRole` service method with uniqueness validation
3. Add WebSocket message type `ROLE_ASSIGNED`
4. Frontend: Add role selector dropdown in participant list (coach view)
5. Frontend: Show "You are playing as White/Black" banner (student view)
6. Frontend: Disable dragging pieces that don't match student's color
7. Test: Only assigned student can move their color

**Acceptance Test:**
- Coach assigns Alice to white → Alice can only drag white pieces → Coach assigns Bob to white → Alice becomes spectator, Bob can drag white pieces

---

### Milestone 4: Position Reset (1 week)
**Goal:** Coach can reset board without ending session

**Tasks:**
1. Add `POSITION_RESET` WebSocket message type
2. Frontend: Create reset modal with "Starting Position" / "Custom FEN" / "Clear Board" options
3. Frontend: Confirmation dialog before reset
4. Backend: Clear move history on reset
5. Frontend: Broadcast reset notification to students
6. Test: Reset clears moves and updates all boards

**Acceptance Test:**
- Coach clicks "Reset Position" → Selects "Starting Position" → Confirms → All boards show starting position, move history cleared

---

### Milestone 5: Undo/Redo (1 week)
**Goal:** Coach can undo/redo moves

**Tasks:**
1. Add `MOVE_UNDONE`, `MOVE_REDONE` WebSocket message types
2. Backend: Implement undo/redo logic (update FEN + move history)
3. Frontend: Add Undo/Redo buttons (coach only)
4. Frontend: Maintain undo/redo stacks
5. Frontend: Disable buttons when stacks empty
6. Frontend: Show "Coach undid move" notification to students
7. Test: Undo reverts move, redo re-applies it

**Acceptance Test:**
- Make 3 moves → Undo twice → Redo once → Final position is after 2nd move

---

### Milestone 6: Analysis Panel Permissions (1 week)
**Goal:** Coach controls who can see engine analysis

**Tasks:**
1. Add `analysisPermission` enum to backend entity ('coach', 'everyone', 'off')
2. Add WebSocket message type `ANALYSIS_PERMISSION_CHANGED`
3. Implement service method `setAnalysisPermission(sessionId, permission)`
4. Frontend: Add permissions dropdown for coach
5. Frontend: Pass correct `enabled` prop to AnalysisPanel based on permission
6. Frontend: Show "Analysis disabled by coach" message to students when hidden
7. Test: Coach changes permission → Students see/don't see analysis panel accordingly

**Acceptance Test:**
- Coach sets "Coach Only" → Students don't see panel → Coach sets "Everyone" → Students see panel working

---

### Milestone 7: Polish & Testing (1 week)
**Goal:** Bug fixes, edge cases, documentation

**Tasks:**
1. Test concurrent student moves (ensure no race conditions)
2. Test role conflicts (unassign previous student)
3. Test interactive mode OFF disables student dragging
4. Add loading states for moves broadcasting
5. Add error handling for network failures
6. Update docs/features/training-sessions.md with Phase 2 info
7. Write end-to-end tests
8. Accessibility audit (keyboard navigation, screen readers)
9. Performance test: Multiple students moving rapidly

---

## Total Estimate: 7 weeks (Q2 2025)
**Simplified from original:** Removed complex approval workflow saves ~1 week, added analysis permissions +1 week → Same timeline but better features!

---

## Success Metrics

### User Engagement
- % of training sessions using interactive mode
- Average # of student move requests per session
- Move approval rate (approved / total requested)
- Average time to approve move (target: <5 seconds)

### Quality
- % of sessions completed without errors
- Move request timeout rate (target: <5%)
- Concurrent move request handling (no dropped requests)

### User Feedback
- Post-session survey: "Interactive mode improved the lesson" (target: >80% agree)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Concurrent move requests** | Multiple students try to move at once, system confused | Implement queue: only one pending move at a time |
| **Network latency** | Move approval feels slow, frustrating UX | Add optimistic UI updates, show "waiting" state |
| **Coach overwhelmed** | Too many move requests, can't keep up | Add auto-deny timeout (30s), show queue count |
| **Role confusion** | Students don't understand who can move | Clear UI indicators, "You are playing as White" banner |
| **Accidental resets** | Coach hits reset by mistake, loses progress | Confirmation modal with "Are you sure?" |

---

## Related Documentation
- [Training Sessions Phase 1](./training-sessions.md)
- [WebSocket Architecture](./websocket-architecture.md)
- [Main Roadmap](../README.md)

---

**Last Updated:** 2025-11-14
**Maintained By:** Engineering Team
**Next Review:** Start of implementation (Q2 2025)
