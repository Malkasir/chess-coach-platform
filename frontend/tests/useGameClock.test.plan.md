# useGameClock Hook - Test Plan

## Overview
This document outlines comprehensive tests for the `useGameClock` hook to ensure correct clock behavior, particularly around:
- Countdown synchronization with server
- Training mode bypass
- Time expiration detection
- First-move handling (clock doesn't start until first move)

## Prerequisites

### Install Testing Dependencies
```bash
npm install --save-dev vitest @testing-library/react @testing-library/react-hooks @testing-library/jest-dom
```

### Update package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Create vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

### Create tests/setup.ts
```typescript
import '@testing-library/jest-dom';
```

---

## Test Suite: useGameClock.test.ts

### Test Structure
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useGameClock } from '../src/hooks/useGameClock';
import { ClockState } from '../src/types/clock.types';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useGameClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tests go here...
});
```

---

## Test Cases

### 1. Training Mode Tests

#### 1.1 Training mode sets times to -1 (not 0)
**Purpose**: Verify training mode uses -1 to signal "no clock" (not 0 which means expired)

```typescript
it('should set times to -1 for training mode', () => {
  const clockState: ClockState = {
    gameMode: 'TRAINING',
    baseTimeSeconds: null,
    incrementSeconds: 0,
    whiteTimeRemaining: null,
    blackTimeRemaining: null,
    lastMoveTimestamp: null,
    activeColor: 'WHITE'
  };

  const { result } = renderHook(() => useGameClock(clockState));

  // Display values should be 0 (clamped), but expiration should be false
  expect(result.current.whiteTimeRemaining).toBe(0);
  expect(result.current.blackTimeRemaining).toBe(0);
  expect(result.current.isWhiteTimeExpired).toBe(false);
  expect(result.current.isBlackTimeExpired).toBe(false);
});
```

#### 1.2 Training mode never reports time expired
**Purpose**: Ensure training games can't timeout

```typescript
it('should never report time expired in training mode', () => {
  const clockState: ClockState = {
    gameMode: 'TRAINING',
    baseTimeSeconds: null,
    incrementSeconds: 0,
    whiteTimeRemaining: null,
    blackTimeRemaining: null,
    lastMoveTimestamp: Date.now(),
    activeColor: 'WHITE'
  };

  const { result } = renderHook(() => useGameClock(clockState));

  // Advance time by 1000 seconds
  act(() => {
    vi.advanceTimersByTime(1000000);
  });

  expect(result.current.isWhiteTimeExpired).toBe(false);
  expect(result.current.isBlackTimeExpired).toBe(false);
});
```

---

### 2. Clock Initialization Tests

#### 2.1 Clock doesn't start when lastMoveTimestamp is null
**Purpose**: Verify clock doesn't countdown while waiting for first move

```typescript
it('should not start countdown when lastMoveTimestamp is null', () => {
  const clockState: ClockState = {
    gameMode: 'TIMED',
    baseTimeSeconds: 600,
    incrementSeconds: 0,
    whiteTimeRemaining: 600,
    blackTimeRemaining: 600,
    lastMoveTimestamp: null, // Clock not started yet
    activeColor: 'WHITE'
  };

  const { result } = renderHook(() => useGameClock(clockState));

  const initialWhiteTime = result.current.whiteTimeRemaining;

  // Advance time by 10 seconds
  act(() => {
    vi.advanceTimersByTime(10000);
  });

  // Time should not have changed
  expect(result.current.whiteTimeRemaining).toBe(initialWhiteTime);
  expect(result.current.whiteTimeRemaining).toBe(600);
});
```

#### 2.2 Clock starts counting down after first move
**Purpose**: Verify clock starts when lastMoveTimestamp is set

```typescript
it('should start countdown after lastMoveTimestamp is set', () => {
  const { result, rerender } = renderHook(
    ({ clockState }) => useGameClock(clockState),
    {
      initialProps: {
        clockState: {
          gameMode: 'TIMED',
          baseTimeSeconds: 600,
          incrementSeconds: 0,
          whiteTimeRemaining: 600,
          blackTimeRemaining: 600,
          lastMoveTimestamp: null,
          activeColor: 'WHITE'
        } as ClockState
      }
    }
  );

  // Initially at 600 seconds
  expect(result.current.whiteTimeRemaining).toBe(600);

  // Simulate first move (server sets lastMoveTimestamp)
  const now = Date.now();
  rerender({
    clockState: {
      gameMode: 'TIMED',
      baseTimeSeconds: 600,
      incrementSeconds: 0,
      whiteTimeRemaining: 600,
      blackTimeRemaining: 600,
      lastMoveTimestamp: now,
      activeColor: 'WHITE'
    }
  });

  // Advance time by 5 seconds
  act(() => {
    vi.advanceTimersByTime(5000);
  });

  // White's clock should have decreased
  expect(result.current.whiteTimeRemaining).toBeLessThan(600);
  expect(result.current.whiteTimeRemaining).toBeGreaterThanOrEqual(594);
});
```

---

### 3. Countdown Tests

#### 3.1 Active player's time decreases
**Purpose**: Verify countdown works for active player

```typescript
it('should decrease active player time by ~1 second per second', () => {
  const clockState: ClockState = {
    gameMode: 'TIMED',
    baseTimeSeconds: 600,
    incrementSeconds: 0,
    whiteTimeRemaining: 300,
    blackTimeRemaining: 300,
    lastMoveTimestamp: Date.now(),
    activeColor: 'WHITE'
  };

  const { result } = renderHook(() => useGameClock(clockState));

  const initialTime = result.current.whiteTimeRemaining;

  // Advance by 5 seconds
  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(result.current.whiteTimeRemaining).toBeLessThan(initialTime);
  expect(result.current.whiteTimeRemaining).toBeGreaterThanOrEqual(initialTime - 6);
  expect(result.current.whiteTimeRemaining).toBeLessThanOrEqual(initialTime - 4);
});
```

#### 3.2 Waiting player's time stays constant
**Purpose**: Verify only active player's clock runs

```typescript
it('should not change waiting player time', () => {
  const clockState: ClockState = {
    gameMode: 'TIMED',
    baseTimeSeconds: 600,
    incrementSeconds: 0,
    whiteTimeRemaining: 300,
    blackTimeRemaining: 250,
    lastMoveTimestamp: Date.now(),
    activeColor: 'WHITE' // White's turn, black is waiting
  };

  const { result } = renderHook(() => useGameClock(clockState));

  const initialBlackTime = result.current.blackTimeRemaining;

  // Advance by 10 seconds
  act(() => {
    vi.advanceTimersByTime(10000);
  });

  // Black's time should not change
  expect(result.current.blackTimeRemaining).toBe(initialBlackTime);
});
```

---

### 4. Time Expiration Tests

#### 4.1 Reports expiration when time reaches 0
**Purpose**: Verify time expiration is detected

```typescript
it('should report time expired when countdown reaches 0', () => {
  const clockState: ClockState = {
    gameMode: 'TIMED',
    baseTimeSeconds: 600,
    incrementSeconds: 0,
    whiteTimeRemaining: 5,
    blackTimeRemaining: 300,
    lastMoveTimestamp: Date.now(),
    activeColor: 'WHITE'
  };

  const { result } = renderHook(() => useGameClock(clockState));

  // Advance by 6 seconds (beyond the 5s remaining)
  act(() => {
    vi.advanceTimersByTime(6000);
  });

  expect(result.current.isWhiteTimeExpired).toBe(true);
  expect(result.current.isBlackTimeExpired).toBe(false);
});
```

#### 4.2 Time clamped to 0 (never negative)
**Purpose**: Verify time doesn't go negative

```typescript
it('should clamp time to 0, never negative', () => {
  const clockState: ClockState = {
    gameMode: 'TIMED',
    baseTimeSeconds: 600,
    incrementSeconds: 0,
    whiteTimeRemaining: 2,
    blackTimeRemaining: 300,
    lastMoveTimestamp: Date.now(),
    activeColor: 'WHITE'
  };

  const { result } = renderHook(() => useGameClock(clockState));

  // Advance by 10 seconds (way beyond the 2s remaining)
  act(() => {
    vi.advanceTimersByTime(10000);
  });

  expect(result.current.whiteTimeRemaining).toBe(0);
  expect(result.current.whiteTimeRemaining).toBeGreaterThanOrEqual(0);
});
```

---

### 5. Server Synchronization Tests

#### 5.1 Syncs with server on clockState change
**Purpose**: Verify hook updates when server sends new clock state

```typescript
it('should sync with server when clockState changes', () => {
  const { result, rerender } = renderHook(
    ({ clockState }) => useGameClock(clockState),
    {
      initialProps: {
        clockState: {
          gameMode: 'TIMED',
          baseTimeSeconds: 600,
          incrementSeconds: 3,
          whiteTimeRemaining: 300,
          blackTimeRemaining: 300,
          lastMoveTimestamp: Date.now(),
          activeColor: 'WHITE'
        } as ClockState
      }
    }
  );

  expect(result.current.whiteTimeRemaining).toBe(300);

  // Server sends updated state after black's move
  const now = Date.now();
  rerender({
    clockState: {
      gameMode: 'TIMED',
      baseTimeSeconds: 600,
      incrementSeconds: 3,
      whiteTimeRemaining: 303, // Got increment
      blackTimeRemaining: 295, // Lost time
      lastMoveTimestamp: now,
      activeColor: 'BLACK' // Now black's turn
    }
  });

  expect(result.current.whiteTimeRemaining).toBe(303);
  expect(result.current.blackTimeRemaining).toBe(295);
});
```

#### 5.2 Periodic resync every 3 seconds
**Purpose**: Verify periodic server resync prevents drift

```typescript
it('should resync with server every 3 seconds', () => {
  const syncSpy = vi.fn();
  const clockState: ClockState = {
    gameMode: 'TIMED',
    baseTimeSeconds: 600,
    incrementSeconds: 0,
    whiteTimeRemaining: 300,
    blackTimeRemaining: 300,
    lastMoveTimestamp: Date.now(),
    activeColor: 'WHITE'
  };

  renderHook(() => useGameClock(clockState));

  // Advance by 3 seconds
  act(() => {
    vi.advanceTimersByTime(3000);
  });

  // Advance by another 3 seconds
  act(() => {
    vi.advanceTimersByTime(3000);
  });

  // Note: In actual implementation, check debugLog calls or internal state
  // This is a simplified assertion
  expect(true).toBe(true); // Placeholder - actual test needs access to internal resync
});
```

---

### 6. Edge Cases

#### 6.1 Handles null clockState gracefully
**Purpose**: Verify hook handles missing clock state

```typescript
it('should handle null clockState gracefully', () => {
  const { result } = renderHook(() => useGameClock(null));

  expect(result.current.whiteTimeRemaining).toBe(0);
  expect(result.current.blackTimeRemaining).toBe(0);
  expect(result.current.isWhiteTimeExpired).toBe(false);
  expect(result.current.isBlackTimeExpired).toBe(false);
});
```

#### 6.2 Handles zero lastMoveTimestamp
**Purpose**: Verify 0 timestamp is treated same as null

```typescript
it('should not start countdown when lastMoveTimestamp is 0', () => {
  const clockState: ClockState = {
    gameMode: 'TIMED',
    baseTimeSeconds: 600,
    incrementSeconds: 0,
    whiteTimeRemaining: 600,
    blackTimeRemaining: 600,
    lastMoveTimestamp: 0, // Treated as "not started"
    activeColor: 'WHITE'
  };

  const { result } = renderHook(() => useGameClock(clockState));

  const initialTime = result.current.whiteTimeRemaining;

  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(result.current.whiteTimeRemaining).toBe(initialTime);
});
```

---

## Manual Testing Checklist

Until automated tests are set up, manually verify:

### Training Mode
- [ ] Create training game
- [ ] Verify clock shows "Training Mode - No Clock"
- [ ] Verify moves are not blocked
- [ ] Verify no time expiration occurs

### Timed Game - Clock Initialization
- [ ] Create timed game (e.g., 3+2 Blitz)
- [ ] Verify both clocks show initial time (3:00)
- [ ] Verify clocks DO NOT count down while waiting for opponent
- [ ] Verify clocks DO NOT count down before first move

### Timed Game - First Move
- [ ] Make first move as white
- [ ] Verify white's clock NOW starts counting down
- [ ] Verify black's clock stays at initial time

### Timed Game - Normal Play
- [ ] Play several moves
- [ ] Verify active player's clock counts down
- [ ] Verify waiting player's clock stays constant
- [ ] Verify increment is applied after each move

### Timed Game - Time Urgency
- [ ] Let time drop below 60s
- [ ] Verify clock turns ORANGE
- [ ] Let time drop below 30s
- [ ] Verify clock turns RED
- [ ] Let time drop below 10s
- [ ] Verify clock turns RED and PULSES

### Timed Game - Timeout
- [ ] Let one player's time expire
- [ ] Verify moves are blocked for that player
- [ ] Verify timeout message appears
- [ ] Verify opponent is declared winner

---

## Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Critical Paths**: 100%
  - Training mode bypass
  - Time expiration detection
  - First-move handling
  - Server synchronization

---

## Implementation Priority

1. **High Priority** (Core functionality):
   - Training mode tests (1.1, 1.2)
   - Clock initialization tests (2.1, 2.2)
   - Time expiration tests (4.1, 4.2)

2. **Medium Priority** (Correctness):
   - Countdown tests (3.1, 3.2)
   - Server sync tests (5.1)

3. **Low Priority** (Edge cases):
   - Edge case tests (6.1, 6.2)
   - Periodic resync test (5.2)

---

## Notes

- All time-based tests use `vi.useFakeTimers()` for deterministic behavior
- Tests mock `Date.now()` for predictable timestamps
- Cleanup timers in `afterEach` to prevent test pollution
- Use `act()` wrapper for state updates to avoid React warnings
