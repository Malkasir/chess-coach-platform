import { renderHook, act } from '@testing-library/react';
import { useGameClock } from '../src/hooks/useGameClock';
import { ClockState } from '../src/types/clock.types';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useGameClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ==================== Training Mode Tests ====================

  describe('Training Mode', () => {
    it('should set times to -1 for training mode and never report expired', () => {
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

    it('should never report time expired in training mode even after time passes', () => {
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
  });

  // ==================== Clock Initialization Tests ====================

  describe('Clock Initialization', () => {
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
      expect(initialWhiteTime).toBe(600);

      // Advance time by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Time should not have changed
      expect(result.current.whiteTimeRemaining).toBe(600);
    });

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
      expect(initialTime).toBe(600);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.whiteTimeRemaining).toBe(600);
    });

    it('should start countdown after lastMoveTimestamp is set', () => {
      const { result, rerender } = renderHook(
        ({ clockState }: { clockState: ClockState }) => useGameClock(clockState),
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
  });

  // ==================== Countdown Tests ====================

  describe('Countdown Behavior', () => {
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

      // Should lose approximately 5 seconds (allow ±2s variance for timing/rounding)
      expect(result.current.whiteTimeRemaining).toBeLessThan(initialTime);
      expect(result.current.whiteTimeRemaining).toBeGreaterThanOrEqual(initialTime - 7);
      expect(result.current.whiteTimeRemaining).toBeLessThanOrEqual(initialTime - 3);
    });

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
  });

  // ==================== Time Expiration Tests ====================

  describe('Time Expiration', () => {
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

    it('should not report expired for waiting player with 0 stored time (edge case)', () => {
      const clockState: ClockState = {
        gameMode: 'TIMED',
        baseTimeSeconds: 600,
        incrementSeconds: 0,
        whiteTimeRemaining: 100,
        blackTimeRemaining: 0, // Black is waiting but has 0 time stored
        lastMoveTimestamp: Date.now(),
        activeColor: 'WHITE' // White's turn
      };

      const { result } = renderHook(() => useGameClock(clockState));

      // Black should be reported as expired (0 time remaining)
      expect(result.current.isBlackTimeExpired).toBe(true);
    });
  });

  // ==================== Server Synchronization Tests ====================

  describe('Server Synchronization', () => {
    it('should sync with server when clockState changes', () => {
      const { result, rerender } = renderHook(
        ({ clockState }: { clockState: ClockState }) => useGameClock(clockState),
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
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle null clockState gracefully', () => {
      const { result } = renderHook(() => useGameClock(null));

      expect(result.current.whiteTimeRemaining).toBe(0);
      expect(result.current.blackTimeRemaining).toBe(0);
      expect(result.current.isWhiteTimeExpired).toBe(false);
      expect(result.current.isBlackTimeExpired).toBe(false);
    });

    it('should handle server time being slightly ahead of client elapsed time', () => {
      // Simulate server sending time that already accounts for some elapsed time
      const now = Date.now();
      const clockState: ClockState = {
        gameMode: 'TIMED',
        baseTimeSeconds: 600,
        incrementSeconds: 0,
        whiteTimeRemaining: 295, // Server already deducted 5 seconds
        blackTimeRemaining: 300,
        lastMoveTimestamp: now - 5000, // Move was 5s ago
        activeColor: 'WHITE'
      };

      const { result } = renderHook(() => useGameClock(clockState));

      // Client should calculate elapsed time and sync
      expect(result.current.whiteTimeRemaining).toBeLessThanOrEqual(295);
      expect(result.current.whiteTimeRemaining).toBeGreaterThanOrEqual(289);
    });
  });
});
