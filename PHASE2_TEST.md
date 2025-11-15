# Phase 2 Interactive Mode Test Plan

## ✅ Status: WORKING (Milestone 1 Complete)

For students to make moves, the coach must complete **TWO steps**:
1. ✅ Toggle "Interactive Mode" ON
2. ✅ Assign a role (WHITE, BLACK, or BOTH) to each student

**Just enabling interactive mode is NOT enough!** Students with role "SPECTATOR" cannot move even when interactive mode is ON.

### Recent Fixes (Latest Version)
- ✅ **Sticky permissions**: Once assigned a role, permissions persist even if stale messages arrive
- ✅ **Component remounting**: ChessBoard fully resets when permissions change, eliminating stale closures
- ✅ **First-try success**: Students can move immediately after role assignment (no role toggling needed!)

## Test Procedure

1. **Coach creates a session**
   - Login as user1@test.com
   - Create a training session
   - Note the room code

2. **Student joins**
   - Open a NEW incognito/private window (to avoid shared state)
   - Login as user2@test.com
   - Join the session with the room code

3. **Coach enables interactive mode (STEP 1 of 2)**
   - Toggle "Interactive Mode" ON
   - Check console: should see `MODE_CHANGED … interactiveMode: true`
   - ⚠️ Student still CANNOT move at this point (expected behavior)

4. **Coach assigns student role (STEP 2 of 2)** ⭐ REQUIRED
   - Open the participant list (click "👥 Participants")
   - Select student (Test User2) from the dropdown
   - Assign role "BOTH" (or WHITE/BLACK)
   - Check console: should see `ROLE_ASSIGNED … role: "BOTH"`
   - ✅ Student CAN NOW move!

5. **Student attempts to move**
   - Try to drag a piece (e.g., e2 pawn)
   - Check console for `isMyTurn` logs
   - Piece should be draggable

## Expected Results

### After Step 3 (Interactive Mode ON, No Role Yet):
**Student console should show:**
```
🎮 TrainingSession Props UPDATE:
  📌 interactiveMode: true
  📌 userRole: SPECTATOR  ← Still default!
  ✅ calculatedAllowBothSides: false

🎯 isDraggablePiece called for: wP at e2
  🔍 isMyTurn called:
    - interactiveMode: true
    - userRole: SPECTATOR
  🚫 Cannot move: No role or spectator  ← EXPECTED!
```

**Student UI should show:**
- ⚠️ Yellow banner: "Waiting for coach to assign you a role"

**Coach UI should show:**
- ⚠️ Highlighted participant with warning icon
- Orange bordered dropdown for role assignment

---

### After Step 4 (Role "BOTH" Assigned):
**Student console should show:**
```
🎭 ROLE_ASSIGNED message received!
  ✅✅✅ MY ROLE IS BEING UPDATED TO: BOTH

🎮 TrainingSession Props UPDATE:
  📌 interactiveMode: true
  📌 userRole: BOTH  ← Updated!
  ✅ calculatedAllowBothSides: true

🎯 isDraggablePiece called for: wP at e2
  📊 Current state: {allowBothSides: true, ...}
  ✅ allowBothSides is TRUE - SKIPPING all restrictions
  ✅✅ Piece IS draggable - has 2 legal moves  ← SUCCESS!
```

**Student UI should show:**
- 🎮 Green "Interactive Mode" badge
- 🎭 "Playing: Both Colors" badge

---

### If Student Still Can't Move After Step 4:
**Check for these failure patterns:**

**Pattern 1: Role assignment not received**
```
MODE_CHANGED received ✅
(no ROLE_ASSIGNED message) ❌
```
→ WebSocket issue or backend not broadcasting

**Pattern 2: User ID mismatch**
```
🎭 ROLE_ASSIGNED message received!
  🔍 ID comparison: exactMatch: false ❌
  ℹ️ This role assignment is for a different user
```
→ Wrong user ID being sent/compared

## Backend Logs to Check

Run this command to see the backend logs in real-time:
```bash
tail -f backend/target/spring-boot.log
```

Look for:
```
🎮 Toggling interactive mode ... to true
✅ Interactive mode toggled successfully
📢 Broadcasting interactive mode change
```

And:
```
🎭 Assigning role BOTH to user 2
✅ Role assigned successfully
📢 Broadcasting role assignment
```

## Common Issues & Solutions

### 1. ❌ "Student can't move even though interactive mode is ON"
**Root Cause:** Coach enabled interactive mode but **forgot to assign a role**

**Solution:**
- Coach must open participant list and assign a role (WHITE, BLACK, or BOTH)
- Look for ⚠️ warning icon next to student's name (added in this update)
- Student will see yellow banner: "Waiting for coach to assign you a role"

**Verification:**
```bash
# Student console should show:
userRole: SPECTATOR  ← This is why they can't move!
```

---

### 2. ❌ "Interactive mode keeps flipping back to false"
**Root Cause:** Multiple browser tabs or race condition

**Solution:**
- Close duplicate tabs
- Check backend logs for duplicate toggle messages
- Verify WebSocket is only connected once per user

---

### 3. ❌ "Role reverts to SPECTATOR after assignment"
**Root Cause:** SESSION_STATE message sent with old role data

**Solution:**
- Check backend database persistence
- Verify `assignRole` saves before broadcasting
- Look for SESSION_STATE messages overwriting the role

---

### 4. ❌ "Props are correct but moves still blocked"
**Root Cause:** Stale closure in chessboard component

**Solution:**
- Check that `allowBothSides` dependency is in useCallback arrays
- Verify ChessBoard re-renders when props change
- This should be fixed by the enhanced logging added in this update
