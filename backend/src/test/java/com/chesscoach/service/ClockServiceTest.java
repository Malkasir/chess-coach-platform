package com.chesscoach.service;

import com.chesscoach.dto.ClockState;
import com.chesscoach.entity.Game;
import com.chesscoach.entity.Game.PlayerColor;
import com.chesscoach.entity.GameMode;
import com.chesscoach.service.ClockService.TimeoutResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ClockService
 * Tests critical clock logic including:
 * - Timeout detection before increment application
 * - First-move handling (clock doesn't start until first move)
 * - Training mode bypasses
 * - Time calculation edge cases
 */
class ClockServiceTest {

    private ClockService clockService;

    @BeforeEach
    void setUp() {
        clockService = new ClockService();
    }

    // ==================== Clock Initialization Tests ====================

    @Test
    @DisplayName("TIMED mode: Initialize clocks with base time but don't start")
    void testInitializeClocks_TimedMode_DoesNotStartClock() {
        // Given
        Game game = createGame(GameMode.TIMED);

        // When
        clockService.initializeClocks(game, 600, 5);

        // Then
        assertEquals(600, game.getWhiteTimeRemaining(), "White should have base time");
        assertEquals(600, game.getBlackTimeRemaining(), "Black should have base time");
        assertEquals(600, game.getBaseTimeSeconds(), "Base time should be set");
        assertEquals(5, game.getIncrementSeconds(), "Increment should be set");
        assertNull(game.getLastMoveTimestamp(), "Clock should NOT start until first move");
    }

    @Test
    @DisplayName("TRAINING mode: Nulls out all time fields")
    void testInitializeClocks_TrainingMode_NullsAllFields() {
        // Given
        Game game = createGame(GameMode.TRAINING);

        // When
        clockService.initializeClocks(game, 600, 5);

        // Then
        assertNull(game.getWhiteTimeRemaining(), "White time should be null in training");
        assertNull(game.getBlackTimeRemaining(), "Black time should be null in training");
        assertNull(game.getBaseTimeSeconds(), "Base time should be null in training");
        assertEquals(0, game.getIncrementSeconds(), "Increment should be 0 in training");
        assertNull(game.getLastMoveTimestamp(), "Timestamp should be null in training");
    }

    @Test
    @DisplayName("TIMED mode with null increment defaults to 0")
    void testInitializeClocks_NullIncrement_DefaultsToZero() {
        // Given
        Game game = createGame(GameMode.TIMED);

        // When
        clockService.initializeClocks(game, 300, null);

        // Then
        assertEquals(0, game.getIncrementSeconds(), "Null increment should default to 0");
    }

    // ==================== First Move Handling Tests ====================

    @Test
    @DisplayName("First move starts the clock without deducting time")
    void testUpdateClockAfterMove_FirstMove_StartsClockWithoutDeduction() {
        // Given
        Game game = createTimedGame(300, 0);
        clockService.initializeClocks(game, 300, 0);
        assertNull(game.getLastMoveTimestamp(), "Clock not started yet");

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.WHITE);

        // Then
        assertFalse(result.isTimeout(), "First move should not timeout");
        assertNull(result.getWinner(), "No winner on first move");
        assertNotNull(game.getLastMoveTimestamp(), "Clock should now be started");
        assertEquals(300, game.getWhiteTimeRemaining(), "White time unchanged on first move");
        assertEquals(300, game.getBlackTimeRemaining(), "Black time unchanged on first move");
    }

    @Test
    @DisplayName("Second move deducts elapsed time from first player")
    void testUpdateClockAfterMove_SecondMove_DeductsElapsedTime() throws InterruptedException {
        // Given
        Game game = createTimedGame(300, 0);
        clockService.initializeClocks(game, 300, 0);

        // Simulate first move (starts clock)
        clockService.updateClockAfterMove(game, PlayerColor.WHITE);

        // Wait ~1 second for black's move
        Thread.sleep(1100);

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.BLACK);

        // Then
        assertFalse(result.isTimeout(), "Should not timeout");
        assertTrue(game.getBlackTimeRemaining() < 300, "Black should have lost time");
        assertTrue(game.getBlackTimeRemaining() >= 298, "Should lose ~1-2 seconds (rounded up)");
        assertEquals(300, game.getWhiteTimeRemaining(), "White time unchanged");
    }

    // ==================== Timeout Detection Tests ====================

    @Test
    @DisplayName("Timeout when elapsed time exceeds remaining time (before increment)")
    void testUpdateClockAfterMove_Timeout_BeforeIncrementApplied() {
        // Given: Player has 5s remaining, 10s elapsed
        Game game = createTimedGame(5, 3); // 3s increment (should NOT be applied)
        game.setWhiteTimeRemaining(5);
        game.setBlackTimeRemaining(300);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 10_000); // 10s ago

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.WHITE);

        // Then
        assertTrue(result.isTimeout(), "Should timeout when elapsed > remaining");
        assertEquals(PlayerColor.BLACK, result.getWinner(), "Black should win on white timeout");
        assertEquals(0, game.getWhiteTimeRemaining(), "White time set to exactly 0");
    }

    @Test
    @DisplayName("No timeout when remaining time + increment > elapsed time")
    void testUpdateClockAfterMove_NoTimeout_IncrementSavesPlayer() {
        // Given: Player has 10s, 8s elapsed, 3s increment → survives with 5s
        Game game = createTimedGame(10, 3);
        game.setWhiteTimeRemaining(10);
        game.setBlackTimeRemaining(300);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 8_000); // 8s ago

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.WHITE);

        // Then
        assertFalse(result.isTimeout(), "Should NOT timeout with increment");
        assertNull(result.getWinner(), "No winner");
        // 10s - 8s + 3s = 5s
        assertTrue(game.getWhiteTimeRemaining() >= 4, "Should have ~5s remaining");
        assertTrue(game.getWhiteTimeRemaining() <= 5, "Should have ~5s remaining");
    }

    @Test
    @DisplayName("Exact timeout at 0 seconds remaining")
    void testUpdateClockAfterMove_ExactTimeout_AtZeroSeconds() {
        // Given: Player has 3s, exactly 3s elapsed
        Game game = createTimedGame(3, 0);
        game.setWhiteTimeRemaining(3);
        game.setBlackTimeRemaining(300);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 3_000); // 3s ago

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.WHITE);

        // Then
        assertTrue(result.isTimeout(), "Should timeout at exactly 0");
        assertEquals(PlayerColor.BLACK, result.getWinner(), "Black wins");
    }

    // ==================== Training Mode Bypass Tests ====================

    @Test
    @DisplayName("Training mode: updateClockAfterMove never times out")
    void testUpdateClockAfterMove_TrainingMode_NeverTimesOut() {
        // Given
        Game game = createGame(GameMode.TRAINING);
        clockService.initializeClocks(game, null, 0);

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.WHITE);

        // Then
        assertFalse(result.isTimeout(), "Training mode should never timeout");
        assertNull(result.getWinner(), "No winner in training mode");
    }

    @Test
    @DisplayName("Training mode: isTimeExpired always returns false")
    void testIsTimeExpired_TrainingMode_AlwaysFalse() {
        // Given
        Game game = createGame(GameMode.TRAINING);
        clockService.initializeClocks(game, null, 0);

        // When/Then
        assertFalse(clockService.isTimeExpired(game, PlayerColor.WHITE), "Training never expires");
        assertFalse(clockService.isTimeExpired(game, PlayerColor.BLACK), "Training never expires");
    }

    // ==================== isTimeExpired Tests ====================

    @Test
    @DisplayName("isTimeExpired: Active player with expired clock returns true")
    void testIsTimeExpired_ActivePlayer_ExpiredClock() {
        // Given: White's turn, white has 5s, 10s elapsed
        Game game = createTimedGame(5, 0);
        game.setWhiteTimeRemaining(5);
        game.setBlackTimeRemaining(300);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 10_000); // 10s ago
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"); // White's turn

        // When
        boolean expired = clockService.isTimeExpired(game, PlayerColor.WHITE);

        // Then
        assertTrue(expired, "White's time should be expired");
    }

    @Test
    @DisplayName("isTimeExpired: Waiting player uses stored time (not calculated)")
    void testIsTimeExpired_WaitingPlayer_UsesStoredTime() {
        // Given: White's turn, black is waiting with 300s stored
        Game game = createTimedGame(300, 0);
        game.setWhiteTimeRemaining(100);
        game.setBlackTimeRemaining(300);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 50_000); // 50s ago (irrelevant for black)
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"); // White's turn

        // When
        boolean expired = clockService.isTimeExpired(game, PlayerColor.BLACK);

        // Then
        assertFalse(expired, "Black's stored time is 300s, not expired");
    }

    @Test
    @DisplayName("isTimeExpired: Returns false when time is null")
    void testIsTimeExpired_NullTime_ReturnsFalse() {
        // Given
        Game game = createTimedGame(null, 0);
        game.setWhiteTimeRemaining(null);

        // When
        boolean expired = clockService.isTimeExpired(game, PlayerColor.WHITE);

        // Then
        assertFalse(expired, "Null time should not be considered expired");
    }

    // ==================== buildClockState Tests ====================

    @Test
    @DisplayName("buildClockState: Creates correct DTO for TIMED mode")
    void testBuildClockState_TimedMode() {
        // Given
        Game game = createTimedGame(600, 5);
        game.setWhiteTimeRemaining(580);
        game.setBlackTimeRemaining(590);
        game.setLastMoveTimestamp(System.currentTimeMillis());
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"); // White's turn

        // When
        ClockState clockState = clockService.buildClockState(game);

        // Then
        assertEquals("TIMED", clockState.getGameMode());
        assertEquals(600, clockState.getBaseTimeSeconds());
        assertEquals(5, clockState.getIncrementSeconds());
        assertEquals(580, clockState.getWhiteTimeRemaining());
        assertEquals(590, clockState.getBlackTimeRemaining());
        assertEquals("WHITE", clockState.getActiveColor());
        assertNotNull(clockState.getLastMoveTimestamp());
    }

    @Test
    @DisplayName("buildClockState: Handles null lastMoveTimestamp (before first move)")
    void testBuildClockState_NullTimestamp() {
        // Given
        Game game = createTimedGame(600, 0);
        game.setWhiteTimeRemaining(600);
        game.setBlackTimeRemaining(600);
        game.setLastMoveTimestamp(null); // Clock not started yet

        // When
        ClockState clockState = clockService.buildClockState(game);

        // Then
        assertNull(clockState.getLastMoveTimestamp(), "Should handle null timestamp");
    }

    @Test
    @DisplayName("buildClockState: Determines activeColor from FEN")
    void testBuildClockState_ActiveColorFromFen() {
        // Given: Black's turn
        Game game = createTimedGame(300, 0);
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");

        // When
        ClockState clockState = clockService.buildClockState(game);

        // Then
        assertEquals("BLACK", clockState.getActiveColor());
    }

    // ==================== calculateCurrentTimeRemaining Tests ====================

    @Test
    @DisplayName("calculateCurrentTimeRemaining: Active player gets elapsed time subtracted")
    void testCalculateCurrentTimeRemaining_ActivePlayer() {
        // Given: White's turn, 100s stored, 5s elapsed
        Game game = createTimedGame(300, 0);
        game.setWhiteTimeRemaining(100);
        game.setBlackTimeRemaining(200);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 5_000); // 5s ago
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

        // When
        int whiteTime = clockService.calculateCurrentTimeRemaining(game, PlayerColor.WHITE);

        // Then
        assertTrue(whiteTime <= 95, "Should be ~95s (100 - 5)");
        assertTrue(whiteTime >= 94, "Should be ~95s (allowing for timing variance)");
    }

    @Test
    @DisplayName("calculateCurrentTimeRemaining: Waiting player gets stored time")
    void testCalculateCurrentTimeRemaining_WaitingPlayer() {
        // Given: White's turn, black is waiting
        Game game = createTimedGame(300, 0);
        game.setWhiteTimeRemaining(100);
        game.setBlackTimeRemaining(200);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 5_000); // 5s ago (irrelevant for black)
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

        // When
        int blackTime = clockService.calculateCurrentTimeRemaining(game, PlayerColor.BLACK);

        // Then
        assertEquals(200, blackTime, "Waiting player should get exact stored time");
    }

    @Test
    @DisplayName("calculateCurrentTimeRemaining: Returns -1 for training mode")
    void testCalculateCurrentTimeRemaining_TrainingMode() {
        // Given
        Game game = createGame(GameMode.TRAINING);
        clockService.initializeClocks(game, null, 0);

        // When
        int time = clockService.calculateCurrentTimeRemaining(game, PlayerColor.WHITE);

        // Then
        assertEquals(-1, time, "Training mode should return -1");
    }

    @Test
    @DisplayName("calculateCurrentTimeRemaining: Returns -1 when time is null")
    void testCalculateCurrentTimeRemaining_NullTime() {
        // Given
        Game game = createTimedGame(null, 0);
        game.setWhiteTimeRemaining(null);

        // When
        int time = clockService.calculateCurrentTimeRemaining(game, PlayerColor.WHITE);

        // Then
        assertEquals(-1, time, "Null time should return -1");
    }

    // ==================== Edge Cases ====================

    @Test
    @DisplayName("Increment applied correctly after time deduction")
    void testUpdateClockAfterMove_IncrementAppliedAfterDeduction() throws InterruptedException {
        // Given: 100s base, 5s increment, ~2s elapsed
        Game game = createTimedGame(100, 5);
        clockService.initializeClocks(game, 100, 5);
        clockService.updateClockAfterMove(game, PlayerColor.WHITE); // Start clock

        Thread.sleep(2100); // Wait ~2s

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.BLACK);

        // Then
        assertFalse(result.isTimeout());
        // Black: 100 - 2 + 5 = 103s (approximately)
        assertTrue(game.getBlackTimeRemaining() >= 102, "Should be ~103s");
        assertTrue(game.getBlackTimeRemaining() <= 103, "Should be ~103s");
    }

    @Test
    @DisplayName("Ceiling rounding penalizes slow moves")
    void testUpdateClockAfterMove_CeilingRounding() {
        // Given: 100s, 1.1s elapsed (should round up to 2s)
        Game game = createTimedGame(100, 0);
        game.setWhiteTimeRemaining(100);
        game.setBlackTimeRemaining(100);
        game.setLastMoveTimestamp(System.currentTimeMillis() - 1100); // 1.1s ago

        // When
        TimeoutResult result = clockService.updateClockAfterMove(game, PlayerColor.WHITE);

        // Then
        assertFalse(result.isTimeout());
        assertEquals(98, game.getWhiteTimeRemaining(), "Should round up: 100 - 2 = 98");
    }

    // ==================== Helper Methods ====================

    private Game createGame(GameMode mode) {
        Game game = new Game();
        game.setId(1L);
        game.setGameMode(mode);
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        return game;
    }

    private Game createTimedGame(Integer baseTime, Integer increment) {
        Game game = createGame(GameMode.TIMED);
        if (baseTime != null) {
            game.setBaseTimeSeconds(baseTime);
            game.setWhiteTimeRemaining(baseTime);
            game.setBlackTimeRemaining(baseTime);
        }
        game.setIncrementSeconds(increment);
        return game;
    }
}
