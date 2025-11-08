package com.chesscoach.service;

import com.chesscoach.dto.ClockState;
import com.chesscoach.entity.Game;
import com.chesscoach.entity.Game.PlayerColor;
import com.chesscoach.entity.GameMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for managing chess clock calculations.
 * Server-authoritative: all time calculations happen server-side to prevent cheating.
 */
@Service
public class ClockService {

    private static final Logger logger = LoggerFactory.getLogger(ClockService.class);

    /**
     * Initialize clocks for a new game
     * @param game The game to initialize
     * @param baseTimeSeconds Base time for each player in seconds
     * @param incrementSeconds Increment per move in seconds
     */
    public void initializeClocks(Game game, Integer baseTimeSeconds, Integer incrementSeconds) {
        if (game.getGameMode() != GameMode.TIMED) {
            // Training mode - no clocks
            game.setBaseTimeSeconds(null);
            game.setIncrementSeconds(0);
            game.setWhiteTimeRemaining(null);
            game.setBlackTimeRemaining(null);
            game.setLastMoveTimestamp(null);
            return;
        }

        // TIMED mode - initialize clocks BUT DON'T START THEM YET
        game.setBaseTimeSeconds(baseTimeSeconds);
        game.setIncrementSeconds(incrementSeconds != null ? incrementSeconds : 0);
        game.setWhiteTimeRemaining(baseTimeSeconds);
        game.setBlackTimeRemaining(baseTimeSeconds);
        // CRITICAL FIX: Keep lastMoveTimestamp null until first move is made
        // This prevents clock from running while waiting for opponent
        game.setLastMoveTimestamp(null);
    }

    /**
     * Update clock after a move is made.
     * CRITICAL: Checks timeout BEFORE applying increment to avoid "zombie clocks"
     *
     * @param game The game
     * @param movingColor The color that just moved
     * @return TimeoutResult indicating if timeout occurred
     */
    public TimeoutResult updateClockAfterMove(Game game, PlayerColor movingColor) {
        if (game.getGameMode() != GameMode.TIMED) {
            return new TimeoutResult(false, null); // No timeout in training mode
        }

        long currentTime = System.currentTimeMillis();
        Long lastMoveTime = game.getLastMoveTimestamp();

        if (lastMoveTime == null) {
            // First move of the game - START the clock now
            // No time should be deducted on the first move
            game.setLastMoveTimestamp(currentTime);
            logger.debug("Clock started on first move for game {} at timestamp {}", game.getId(), currentTime);
            return new TimeoutResult(false, null);
        }

        // Calculate elapsed time since last move (in seconds)
        long elapsedMillis = currentTime - lastMoveTime;
        int elapsedSeconds = (int) Math.ceil(elapsedMillis / 1000.0); // Round up to penalize slow moves

        // Get current time remaining for the moving player
        Integer timeRemaining = game.getTimeRemaining(movingColor);

        if (timeRemaining == null) {
            // Clock not initialized properly
            return new TimeoutResult(false, null);
        }

        // Subtract elapsed time from moving player's clock
        int newTimeRemaining = timeRemaining - elapsedSeconds;

        // CRITICAL: Check timeout BEFORE applying increment
        if (newTimeRemaining <= 0) {
            // Player ran out of time
            game.setTimeRemaining(movingColor, 0); // Set to exactly 0
            PlayerColor winner = (movingColor == PlayerColor.WHITE) ? PlayerColor.BLACK : PlayerColor.WHITE;
            return new TimeoutResult(true, winner);
        }

        // Player has time remaining - apply increment
        int increment = game.getIncrementSeconds() != null ? game.getIncrementSeconds() : 0;
        newTimeRemaining += increment;

        // Update the moving player's clock
        game.setTimeRemaining(movingColor, newTimeRemaining);

        // Update last move timestamp
        game.setLastMoveTimestamp(currentTime);

        return new TimeoutResult(false, null);
    }

    /**
     * Check if a player's clock has expired (without making a move)
     * Used for validation before accepting a move
     *
     * @param game The game
     * @param color The player color to check
     * @return true if the player's time has expired
     */
    public boolean isTimeExpired(Game game, PlayerColor color) {
        if (game.getGameMode() != GameMode.TIMED) {
            return false;
        }

        // For the currently moving player, we need to calculate elapsed time
        String currentTurn = getCurrentTurnFromFen(game.getCurrentFen());
        PlayerColor currentTurnColor = currentTurn.equals("w") ? PlayerColor.WHITE : PlayerColor.BLACK;

        if (currentTurnColor == color && game.getLastMoveTimestamp() != null) {
            // Calculate current time for the active player
            long currentTime = System.currentTimeMillis();
            long elapsedMillis = currentTime - game.getLastMoveTimestamp();
            int elapsedSeconds = (int) Math.ceil(elapsedMillis / 1000.0);

            Integer timeRemaining = game.getTimeRemaining(color);
            if (timeRemaining == null) {
                return false;
            }

            return (timeRemaining - elapsedSeconds) <= 0;
        } else {
            // For the waiting player, just check stored time
            return game.isTimeExpired(color);
        }
    }

    /**
     * Build a ClockState DTO from a Game entity
     * @param game The game
     * @return ClockState DTO for WebSocket transmission
     */
    public ClockState buildClockState(Game game) {
        String currentTurn = getCurrentTurnFromFen(game.getCurrentFen());
        String activeColor = currentTurn.equals("w") ? "WHITE" : "BLACK";

        // Note: lastMoveTimestamp will be null before first move - this is intentional
        // Frontend will handle this by not starting countdown until timestamp is set
        return new ClockState(
            game.getGameMode().toString(),
            game.getBaseTimeSeconds(),
            game.getIncrementSeconds(),
            game.getWhiteTimeRemaining(),
            game.getBlackTimeRemaining(),
            game.getLastMoveTimestamp(), // Can be null before first move
            activeColor
        );
    }

    /**
     * Extract current turn from FEN string
     * @param fen FEN string
     * @return "w" or "b"
     */
    private String getCurrentTurnFromFen(String fen) {
        if (fen == null || fen.isEmpty()) {
            return "w"; // Default to white
        }
        String[] parts = fen.split(" ");
        return parts.length > 1 ? parts[1] : "w";
    }

    /**
     * Calculate time remaining for a player including elapsed time
     * (Used for real-time clock display)
     *
     * @param game The game
     * @param color The player color
     * @return Current time remaining in seconds (may be negative if expired)
     */
    public int calculateCurrentTimeRemaining(Game game, PlayerColor color) {
        if (game.getGameMode() != GameMode.TIMED) {
            return -1; // Not applicable
        }

        Integer storedTime = game.getTimeRemaining(color);
        if (storedTime == null) {
            return -1;
        }

        // Check if this player's clock is currently running
        String currentTurn = getCurrentTurnFromFen(game.getCurrentFen());
        PlayerColor currentTurnColor = currentTurn.equals("w") ? PlayerColor.WHITE : PlayerColor.BLACK;

        if (currentTurnColor == color && game.getLastMoveTimestamp() != null) {
            // This player's clock is running - subtract elapsed time
            long currentTime = System.currentTimeMillis();
            long elapsedMillis = currentTime - game.getLastMoveTimestamp();
            int elapsedSeconds = (int) (elapsedMillis / 1000);
            return storedTime - elapsedSeconds;
        } else {
            // This player's clock is not running - return stored time
            return storedTime;
        }
    }

    /**
     * Result of a timeout check
     */
    public static class TimeoutResult {
        private final boolean timeout;
        private final PlayerColor winner;

        public TimeoutResult(boolean timeout, PlayerColor winner) {
            this.timeout = timeout;
            this.winner = winner;
        }

        public boolean isTimeout() {
            return timeout;
        }

        public PlayerColor getWinner() {
            return winner;
        }
    }
}
