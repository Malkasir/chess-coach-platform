import { useState, useEffect, useRef, useCallback } from 'react';
import { ClockState } from '../types/clock.types';
import { debugLog } from '../utils/debug';

export interface GameClockValues {
  whiteTimeRemaining: number;
  blackTimeRemaining: number;
  isWhiteTimeExpired: boolean;
  isBlackTimeExpired: boolean;
}

/**
 * Custom hook for managing chess clock state with local countdown and server sync
 *
 * Features:
 * - Local countdown updates every 100ms for smooth animation
 * - Accepts server updates to resync authoritative state
 * - Calculates elapsed time for active player
 * - Returns current time values for both players
 */
export function useGameClock(
  serverClockState: ClockState | null
): GameClockValues {
  const [whiteTimeRemaining, setWhiteTimeRemaining] = useState<number>(0);
  const [blackTimeRemaining, setBlackTimeRemaining] = useState<number>(0);

  const countdownIntervalRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());

  /**
   * Sync local state with server-authoritative clock state
   */
  const syncWithServer = useCallback((clockState: ClockState) => {
    if (!clockState || clockState.gameMode === 'TRAINING') {
      // CRITICAL FIX: Set times to -1 (not 0) for training mode
      // This signals "no clock" and prevents isTimeExpired from triggering
      setWhiteTimeRemaining(-1);
      setBlackTimeRemaining(-1);
      return;
    }

    const now = Date.now();
    lastSyncTimeRef.current = now;

    // Get server-provided times
    const serverWhiteTime = clockState.whiteTimeRemaining ?? 0;
    const serverBlackTime = clockState.blackTimeRemaining ?? 0;

    // CRITICAL FIX: If clock hasn't started yet (lastMoveTimestamp is null),
    // don't start countdown - just display the initial time
    if (!clockState.lastMoveTimestamp || clockState.lastMoveTimestamp === 0) {
      setWhiteTimeRemaining(serverWhiteTime);
      setBlackTimeRemaining(serverBlackTime);
      debugLog('⏱️ Clock not started yet (waiting for first move):', {
        white: serverWhiteTime,
        black: serverBlackTime
      });
      return;
    }

    // Calculate client-side elapsed time since server's lastMoveTimestamp
    let adjustedWhiteTime = serverWhiteTime;
    let adjustedBlackTime = serverBlackTime;

    const serverElapsed = Math.floor((now - clockState.lastMoveTimestamp) / 1000);

    // Subtract elapsed time from the active player's clock
    if (clockState.activeColor === 'WHITE') {
      adjustedWhiteTime = Math.max(0, serverWhiteTime - serverElapsed);
    } else {
      adjustedBlackTime = Math.max(0, serverBlackTime - serverElapsed);
    }

    setWhiteTimeRemaining(adjustedWhiteTime);
    setBlackTimeRemaining(adjustedBlackTime);

    debugLog('⏱️ Clock synced with server:', {
      white: adjustedWhiteTime,
      black: adjustedBlackTime,
      active: clockState.activeColor
    });
  }, []);

  /**
   * Start local countdown for the active player
   */
  const startCountdown = useCallback((clockState: ClockState) => {
    // Clear existing countdown
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
    }

    if (!clockState || clockState.gameMode === 'TRAINING') {
      return;
    }

    // Don't start countdown if clock hasn't been started yet
    if (!clockState.lastMoveTimestamp || clockState.lastMoveTimestamp === 0) {
      debugLog('⏱️ Not starting countdown - clock not started yet');
      return;
    }

    // Update countdown every 100ms for smooth animation
    countdownIntervalRef.current = window.setInterval(() => {
      const elapsedSinceSync = (Date.now() - lastSyncTimeRef.current) / 1000;

      setWhiteTimeRemaining(prev => {
        if (clockState.activeColor === 'WHITE') {
          const newTime = Math.max(0, prev - 0.1);
          return Math.floor(newTime * 10) / 10; // Round to 1 decimal
        }
        return prev;
      });

      setBlackTimeRemaining(prev => {
        if (clockState.activeColor === 'BLACK') {
          const newTime = Math.max(0, prev - 0.1);
          return Math.floor(newTime * 10) / 10;
        }
        return prev;
      });
    }, 100); // 100ms for smooth countdown
  }, []);

  /**
   * Sync with server when clockState changes
   */
  useEffect(() => {
    if (serverClockState) {
      syncWithServer(serverClockState);
      startCountdown(serverClockState);
    } else {
      // No clock state - set to -1 to indicate "no clock"
      setWhiteTimeRemaining(-1);
      setBlackTimeRemaining(-1);
    }

    return () => {
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [serverClockState, syncWithServer, startCountdown]);

  /**
   * Periodic server resync every 3 seconds to prevent drift
   */
  useEffect(() => {
    if (!serverClockState || serverClockState.gameMode === 'TRAINING') {
      return;
    }

    const resyncInterval = setInterval(() => {
      debugLog('⏱️ Periodic server resync');
      syncWithServer(serverClockState);
    }, 3000); // Resync every 3 seconds

    return () => clearInterval(resyncInterval);
  }, [serverClockState, syncWithServer]);

  // CRITICAL FIX: Don't report time expired for training mode or before clock starts
  // -1 means "no clock" (training mode or waiting for first move)
  // 0 means "time expired"
  const isTrainingOrNotStarted = whiteTimeRemaining < 0 || blackTimeRemaining < 0;

  return {
    whiteTimeRemaining: Math.max(0, Math.floor(whiteTimeRemaining)),
    blackTimeRemaining: Math.max(0, Math.floor(blackTimeRemaining)),
    isWhiteTimeExpired: !isTrainingOrNotStarted && whiteTimeRemaining <= 0,
    isBlackTimeExpired: !isTrainingOrNotStarted && blackTimeRemaining <= 0
  };
}
