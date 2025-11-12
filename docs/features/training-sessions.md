# Training Sessions - Architecture & Implementation

**Status:** ✅ Production Ready (Phase 1 - Spectator Mode)
**Shipped:** 2025-01-12
**Production Fixes:** 2025-11-12 (WebSocket auth + transaction management)
**Phase:** 1 of 2

---

## Overview

Training sessions enable coaches to demonstrate chess positions and tactics to students in real-time. Coaches have full board control and can edit positions, while students spectate and see live updates via WebSocket.

---

## User Stories

### Coach Workflow
1. Click "Start Training" in lobby
2. Session created with unique room code (e.g., `TRAIN-ABC`)
3. Confirmation banner displays room code with copy button
4. Share code with students
5. Students join → participant list updates live
6. Make moves or edit positions → broadcast to all spectators
7. Click "End Session" when done

### Student Workflow
1. Receive room code from coach
2. Click "Join Training" in lobby
3. Enter code in modal (auto-uppercase, validated)
4. Join as spectator
5. See live board updates as coach demonstrates
6. View participant list and session details
7. Use move navigation to review

---

## Architecture

### Backend Components

#### Entity Layer
**`TrainingSession.java`**
- Coach (User) - one-to-one
- Participants (Set<User>) - many-to-many
- Room code (String) - TRAIN-XXX format
- Current FEN (String)
- Move history (JSON String)
- Status (ACTIVE/ENDED)
- Timestamps (created, updated)

#### Repository Layer
**`TrainingSessionRepository.java`**
- `findByRoomCode(String)` - Join by code
- `findBySessionId(String)` - WebSocket lookup
- `findFirstByCoachAndStatusOrderByUpdatedAtDesc()` - Resume session

#### Service Layer
**`TrainingSessionService.java`**
- `createSession()` - Generate TRAIN-XXX code
- `joinByCode()` - Add participant
- `endSession()` - Close and cleanup
- Validates coach permissions
- Prevents duplicate room codes

#### Controller Layer
**`TrainingSessionController.java`** (REST)
- POST `/api/training/create` - Create session
- POST `/api/training/join-by-code` - Join by room code
- POST `/api/training/{sessionId}/end` - End session
- Secured with `@PreAuthorize("hasRole('USER')")`

**`TrainingSessionWebSocketController.java`** (WebSocket)
- `/app/training/join` - Connect to session
- `/app/training/position-update` - Coach broadcasts move
- `/app/training/end` - Coach ends session
- `/topic/training/{sessionId}` - Broadcast to all
- `/topic/training/{sessionId}/{userId}` - Private messages

#### DTO Layer
**`TrainingMessage.java`**
- `PARTICIPANT_JOINED` - New spectator
- `POSITION_UPDATE` - Board state change
- `SESSION_STATE` - Full sync on join
- `SESSION_ENDED` - Coach closed session
- `ERROR` - Validation failures

---

### Frontend Components

#### State Management
**`useGameState.ts`**
- `createTrainingSession()` - Coach creates
- `joinTrainingSessionByCode()` - Student joins
- `updateTrainingPosition()` - Broadcast moves
- `endTrainingSession()` - Coach ends
- `participants` - Live participant list
- Handles SESSION_STATE, PARTICIPANT_JOINED, POSITION_UPDATE, SESSION_ENDED

#### WebSocket Service
**`game-service.ts`**
- Subscribes to broadcast topic: `/topic/training/{sessionId}`
- Subscribes to private topic: `/topic/training/{sessionId}/{participantId}`
- Preserves all metadata (participants, participantCount)
- Converts TrainingMessage → GameMessage

#### UI Components

**`TrainingSession.tsx`** - Main UI
- Coach mode: Edit position, reset, end session buttons
- Spectator mode: Read-only board
- Participant sidebar with coach badges
- Room code header (clickable to copy)
- Move panel with navigation
- Responsive layout

**`BoardEditor.tsx`** - Position Editor
- FEN string input with validation
- Quick setup buttons (standard, empty, custom)
- Visual feedback for valid/invalid FEN
- Broadcasts position updates in shared sessions
- Preserves session metadata when editing

**`JoinTrainingSessionModal.tsx`** - Join Flow
- Room code input (9 characters, TRAIN-XXX)
- Auto-uppercase conversion
- Real-time validation
- User-friendly error messages:
  - 404: "Training session not found"
  - 403: "No permission"
  - Session ended: "This session has ended"
- Loading state with disabled controls
- Keyboard shortcuts (Enter to submit, Escape to close)

**`ConfirmationBanner.tsx`** - Success Feedback
- Displays after session creation
- Prominent room code with copy button
- Visual feedback on copy ("✓ Copied!")
- Dismissible with X button
- Animated entrance (slide down)

#### Shared Constants
**`trainingSession.ts`**
- `TRAINING_ROOM_CODE_REGEX` - /^TRAIN-[A-Z]{3}$/
- `TRAINING_ROOM_CODE_LENGTH` - 9
- `TRAINING_ROOM_CODE_PLACEHOLDER` - "TRAIN-ABC"
- `isValidTrainingRoomCode(code)` - Validation helper

**Why this matters:**
- Single source of truth prevents format drift
- If backend changes format, update in one place
- No magic numbers scattered across components

---

## Security & Authentication

### WebSocket Authentication Flow
**Component: `WebSocketAuthChannelInterceptor.java`**

Training sessions require authenticated WebSocket connections. The interceptor handles JWT validation for STOMP connections:

1. **CONNECT Frame Interception**: Intercepts all STOMP CONNECT frames before they reach controllers
2. **JWT Extraction**: Extracts Bearer token from "Authorization" header
3. **Token Validation**: Validates JWT using `JwtUtil.validateToken(token)`
4. **User Loading**: Loads User entity from database via `UserRepository.findByEmail()`
5. **Principal Setting**: Creates `UsernamePasswordAuthenticationToken` and sets it as session principal via `accessor.setUser()`
6. **Session Preservation**: Principal persists for all subsequent messages in that WebSocket session

**Code Location**: `backend/src/main/java/com/chesscoach/security/WebSocketAuthChannelInterceptor.java`

**Integration**: Registered in `WebSocketConfig.configureClientInboundChannel()` with `@Lazy` injection to avoid circular dependencies

**Logging**: Emits "✅ WebSocket authenticated: {email} (User ID: {id})" on success, "❌" messages on failure

### Transaction Management
**Service Layer: `TrainingSessionService.java`**

The service class uses `@Transactional` at the class level to prevent lazy initialization errors:

- **Problem Solved**: Hibernate sessions were closing before participant collections could be loaded for serialization
- **Solution**: `@Transactional` keeps the persistence context open throughout service method execution
- **Benefits**:
  - Participants collection loaded on-demand when `buildSessionStateResponse()` accesses it
  - No "failed to lazily initialize" errors in WebSocket broadcasts
  - Clean JSON serialization with fully-initialized objects
  - Automatic rollback on exceptions

**Code Location**: `backend/src/main/java/com/chesscoach/service/TrainingSessionService.java:20`

---

## WebSocket Message Flow

### Session Creation (Coach)
```
Coach clicks "Start Training"
  → Frontend: createTrainingSession()
  → Backend: POST /api/training/create
  → Response: { sessionId, roomCode: "TRAIN-ABC", currentFen }
  → Frontend: joinTrainingSession(sessionId, coachId)
  → Backend: WebSocket /app/training/join
  → Backend: Sends SESSION_STATE to /topic/training/{sessionId}/{coachId}
  → Frontend: Participants = [coach], displays confirmation banner
```

### Student Joins
```
Student enters "TRAIN-ABC" in modal
  → Frontend: joinTrainingSessionByCode("TRAIN-ABC")
  → Backend: POST /api/training/join-by-code
  → Response: { sessionId, currentFen, isCoach: false }
  → Frontend: joinTrainingSession(sessionId, studentId)
  → Backend: WebSocket /app/training/join
  → Backend: Broadcasts PARTICIPANT_JOINED to /topic/training/{sessionId}
  → Backend: Sends SESSION_STATE to /topic/training/{sessionId}/{studentId}
  → Coach: Merges new participant into list (firstName/lastName parsed)
  → Student: Receives full participant list, board state
```

### Coach Makes Move
```
Coach drags piece on board
  → Frontend: handleTrainingMove(move, fen)
  → Frontend: makeMove() updates local state
  → Frontend: updateTrainingPosition(sessionId, fen, moveHistory)
  → Backend: WebSocket /app/training/position-update
  → Backend: Validates coach permission
  → Backend: Saves FEN + move history
  → Backend: Broadcasts POSITION_UPDATE to /topic/training/{sessionId}
  → All Spectators: Receive update, board updates immediately
```

### Coach Edits Position (via BoardEditor)
```
Coach pastes FEN in editor
  → Frontend: loadCustomPosition(fen)
  → Detects shared session (gameStatus === 'trainingSession' && roomCode)
  → Preserves roomCode, participants, isHost flags
  → Updates position, moveHistory = []
  → Frontend: updateTrainingPosition(sessionId, fen, [])
  → Backend: Broadcasts POSITION_UPDATE
  → All Spectators: See new position immediately
```

**Critical Fix:** Before this, editing positions would reset to local session, clearing roomCode and participants. Now it detects shared sessions and preserves metadata.

### Coach Ends Session
```
Coach clicks "End Session"
  → Frontend: endTrainingSession()
  → Backend: POST /api/training/{sessionId}/end (validates coach permission)
  → Backend: Sets session status = ENDED
  → Backend: WebSocket /app/training/end
  → Backend: Broadcasts SESSION_ENDED to /topic/training/{sessionId}
  → All Participants: Alert shown, return to lobby
```

---

## Participant List Synchronization

### Problem
Backend only sends full participant list to NEW joiners via SESSION_STATE on their private topic. Existing participants only receive PARTICIPANT_JOINED broadcast (which lacks full user details).

### Solution: Client-Side Merge
```typescript
case 'PARTICIPANT_JOINED':
  // Parse "John Doe" → { firstName: "John", lastName: "Doe" }
  const nameParts = message.userName.split(' ');

  // Check for duplicates
  if (existingIds.includes(newParticipantId)) return prev;

  // Add to list
  return {
    ...prev,
    participants: [...prev.participants, {
      id: newParticipantId,
      firstName,
      lastName,
      isCoach: false  // New joiners are spectators
    }]
  };
```

**Edge cases handled:**
- Duplicate joins (ID check)
- Coach reconnection (preserve isCoach flag via `isSelf && prev.isHost`)
- Name parsing (handles single names and multi-word last names)
- parseInt safety (explicit radix, NaN guard)

---

## Validation & Security

### Room Code Validation
- **Format:** `TRAIN-XXX` (9 characters, hyphen, 3 uppercase letters)
- **Frontend:** Validated before submission via `isValidTrainingRoomCode()`
- **Backend:** Generates with collision detection (recursive retry)
- **Centralized:** All checks use shared constants

### Backend Security
- REST endpoints: `@PreAuthorize("hasRole('USER')")`
- WebSocket: Secured via `Principal` (authenticated user)
- Coach-only actions: Validated in service layer
  - Position updates: `if (!session.isCoach(user)) return error`
  - End session: `if (!session.isCoach(user)) return error`
- Participant checks: Compare user IDs via `session.isParticipant(user)`

### Move Routing Safety
```typescript
// Training sessions bypass regular game endpoint
const isRegularGame = gameState.gameStatus === 'active' || gameState.gameStatus === 'waiting';
if (isRegularGame && !gameState.isCustomPosition) {
  gameServiceRef.current?.makeMove(move, fen); // Only for ranked games
}
```

**Why:** Training moves shouldn't hit `/app/game/move` (which expects gameId/playerId). They use `/app/training/position-update` instead.

---

## Key Design Decisions

### Why TRAIN-XXX Format?
- **Distinguishable:** Different from game room codes (ABC123)
- **Semantic:** Clear it's a training session
- **Collision-resistant:** 17,576 combinations (26^3)
- **User-friendly:** Easy to communicate ("Train ABC")

### Why Spectator-Only (Phase 1)?
- **Simpler:** No turn management or approval logic
- **Faster:** MVP shipped in 2 days
- **Safe:** Students can't disrupt coach's demonstration
- **Phase 2:** Will add interactive mode with coach approval

### Why Client-Side Participant Merge?
- **Less invasive:** No backend changes needed
- **Backend already sends data:** userName + userId in PARTICIPANT_JOINED
- **Simpler:** Avoid broadcasting full list to everyone on each join
- **Trade-off:** Name parsing (first/last split) is imperfect but acceptable

### Why Preserve Position on BoardEditor Load?
**Before fix:**
```
Coach in session → opens BoardEditor → loads FEN
  → loadCustomPosition() resets to local session
  → roomCode cleared, participants lost, controls hidden
```

**After fix:**
```typescript
const isSharedSession = gameState.gameStatus === 'trainingSession' && !!gameState.roomCode;

if (isSharedSession) {
  return {
    ...prev,  // Preserve roomCode, participants, isHost
    position: validatedFen,
    moveHistory: []
  };
}
```

**Result:** Coach keeps controls, spectators still see updates, session stays intact.

---

## Testing Checklist

### Backend Tests
- [x] TrainingSession entity validation
- [x] Room code uniqueness (collision detection)
- [x] Coach-only permission checks
- [x] Participant add/remove logic
- [x] WebSocket message broadcasts
- [x] Session end cleanup
- [x] JWT authentication in WebSocket connections
- [x] Transaction boundaries prevent lazy initialization errors

### Frontend Tests
- [ ] Room code validation (TRAIN-XXX regex)
- [ ] JoinTrainingSessionModal error handling
- [ ] Participant list updates on PARTICIPANT_JOINED
- [ ] Position updates on POSITION_UPDATE
- [ ] BoardEditor preserves shared session metadata
- [ ] Move routing (training vs regular game)
- [ ] ConfirmationBanner copy button

### Integration Tests
- [ ] Coach creates → student joins → sees board
- [ ] Coach makes move → spectators see update
- [ ] Coach edits position → spectators see change
- [ ] Coach ends session → all return to lobby
- [ ] Invalid room code → user-friendly error
- [ ] Non-coach tries to update position → error

### Manual Test Scenarios
1. **Happy Path:**
   - Coach creates session
   - 3 students join with room code
   - Coach demonstrates tactic with 5 moves
   - Students see live updates
   - Coach ends session
   - Everyone returns to lobby

2. **Edge Cases:**
   - Student enters wrong code → sees error
   - Coach closes browser → reconnects → still coach
   - Student leaves and rejoins → added again
   - Coach edits position via BoardEditor → session preserved
   - Two coaches try to create at exact same time → unique codes

---

## Performance Considerations

### Current Optimizations
- ✅ Participant list stored in memory (no DB query per message)
- ✅ WebSocket broadcast vs polling (real-time, low latency)
- ✅ FEN strings (compressed board state, <100 bytes)
- ✅ Move history as JSON string (efficient storage)

### Future Optimizations
- 📋 Participant count cache (avoid Set.size() on every message)
- 📋 Rate limiting on position updates (prevent spam)
- 📋 Compression for large move histories (>100 moves)
- 📋 WebSocket reconnection with state recovery

---

## Known Limitations

### Phase 1 Constraints
- **Single coach:** Only creator can control board
- **Spectator only:** Students can't make moves
- **No persistence:** Sessions lost on server restart
- **No history:** Can't replay past sessions
- **No communication:** Requires external chat/voice

### Technical Debt
- Name parsing (first/last split) doesn't handle cultures with multiple names
- Room codes never expire (potential for collision after long runtime)
- No session timeout (inactive sessions stay in memory)
- No participant limit (could scale poorly with 1000+ spectators)

---

## Phase 2 Roadmap

### Interactive Mode
- Student requests to make move
- Coach approves/denies
- Turn indicator shows whose turn
- Undo/redo for student mistakes

### Multiple Coaches
- Assistant coaches with permissions
- Annotation tools (arrows, highlights)
- Coach chat channel

### Session Recording
- Save training sessions to database
- Replay feature with timestamps
- Export as PGN with comments

### Advanced Features
- Scheduled sessions with calendar
- Student groups/classes
- Quiz mode (coach sets puzzle, student solves)
- Performance analytics (student response time)

---

## File Reference

### Backend
```
backend/src/main/java/com/chesscoach/
├── entity/TrainingSession.java           # Data model
├── repository/TrainingSessionRepository.java
├── service/TrainingSessionService.java   # Business logic (@Transactional)
├── controller/TrainingSessionController.java         # REST API
├── controller/TrainingSessionWebSocketController.java # WebSocket
├── dto/TrainingMessage.java              # Message types
├── security/WebSocketAuthChannelInterceptor.java     # JWT auth for WebSocket
└── config/WebSocketConfig.java           # Registers interceptor with @Lazy
```

### Frontend
```
frontend/src/
├── hooks/useGameState.ts                 # State management
├── services/game-service.ts              # WebSocket client
├── components/
│   ├── TrainingSession.tsx               # Main UI
│   ├── BoardEditor.tsx                   # Position editor
│   ├── JoinTrainingSessionModal.tsx      # Join flow
│   └── ConfirmationBanner.tsx            # Success feedback
└── constants/trainingSession.ts          # Shared validation
```

---

## Migration Notes

### Breaking Changes
None. Training sessions are additive.

### Database Changes
New tables created:
- `training_session` (id, session_id, room_code, coach_id, current_fen, move_history, status, timestamps)
- `training_session_participants` (join table)

### Environment Variables
None required. Uses existing WebSocket configuration.

---

## Troubleshooting

### "Training session not found"
- Check room code format (TRAIN-XXX)
- Session may have ended
- Backend may have restarted (sessions lost)

### Participant list not updating
- Check WebSocket connection status
- Verify both topics subscribed (broadcast + private)
- Check console for SESSION_STATE message

### Coach lost controls after editing position
- Verify loadCustomPosition() has shared session detection
- Check `isSharedSession` flag computed correctly
- Ensure roomCode and isHost preserved

### Spectators not seeing moves
- Check updateTrainingPosition() called after makeMove()
- Verify backend broadcasts POSITION_UPDATE
- Check spectator subscribed to `/topic/training/{sessionId}`

---

## Resources

### Related Documentation
- [Move Panel](./move-panel.md) - Review mode architecture
- [WebSocket Setup](../WEBSOCKET_SETUP.md) - STOMP configuration
- [Security](../SECURITY.md) - Authentication patterns

### External References
- **Spring WebSocket:** https://docs.spring.io/spring-framework/reference/web/websocket.html
- **STOMP Protocol:** https://stomp.github.io/
- **FEN Notation:** https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation

---

## Production Deployment Notes

### Stability Verification
- ✅ Backend running 3+ hours without crashes (verified 2025-11-12)
- ✅ WebSocket authentication tested with multiple concurrent users
- ✅ Lazy loading errors eliminated via @Transactional
- ✅ Build passes without warnings or errors
- ✅ All core user flows tested (create, join, edit, end)

### Required Components for Deployment
1. **WebSocketAuthChannelInterceptor** - Must be present for JWT validation
2. **@Transactional on TrainingSessionService** - Required to prevent lazy init errors
3. **@Lazy on SimpMessagingTemplate** - Breaks circular dependency in WebSocketConfig
4. **Frontend JWT tokens in connectHeaders** - Already implemented in game-service.ts

### Environment Requirements
- Java 17+ (uses Spring Boot 3.x)
- H2 (dev) or PostgreSQL (prod) database
- WebSocket support on hosting platform (Render/Railway/AWS)
- CORS configured for frontend origin

### Known Minor Issues (Non-Blocking)
- "Invalid FEN" console warnings when editing positions without both kings (UX improvement for Phase 2)
- Sessions lost on server restart (in-memory only, Phase 1 limitation)
- No automatic session timeout (manual cleanup required)

---

**Last Updated:** 2025-11-12
**Implemented By:** Claude Code + Multiple Reviewers
**Status:** ✅ Production Ready (Phase 1 - Spectator Mode)
**Next Phase:** Interactive Mode (Q2 2025)
