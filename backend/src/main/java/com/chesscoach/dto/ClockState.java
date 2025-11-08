package com.chesscoach.dto;

/**
 * Data Transfer Object for chess clock state.
 * Used in WebSocket payloads to keep clients synchronized with server-authoritative time.
 */
public class ClockState {
    private String gameMode; // TIMED or TRAINING
    private Integer baseTimeSeconds; // Base time for each player (null for TRAINING)
    private Integer incrementSeconds; // Increment per move
    private Integer whiteTimeRemaining; // White's remaining time in seconds
    private Integer blackTimeRemaining; // Black's remaining time in seconds
    private Long lastMoveTimestamp; // Server timestamp when last move was made
    private String activeColor; // WHITE or BLACK - whose clock is currently running

    public ClockState() {}

    public ClockState(String gameMode, Integer baseTimeSeconds, Integer incrementSeconds,
                      Integer whiteTimeRemaining, Integer blackTimeRemaining,
                      Long lastMoveTimestamp, String activeColor) {
        this.gameMode = gameMode;
        this.baseTimeSeconds = baseTimeSeconds;
        this.incrementSeconds = incrementSeconds;
        this.whiteTimeRemaining = whiteTimeRemaining;
        this.blackTimeRemaining = blackTimeRemaining;
        this.lastMoveTimestamp = lastMoveTimestamp;
        this.activeColor = activeColor;
    }

    // Getters and Setters
    public String getGameMode() {
        return gameMode;
    }

    public void setGameMode(String gameMode) {
        this.gameMode = gameMode;
    }

    public Integer getBaseTimeSeconds() {
        return baseTimeSeconds;
    }

    public void setBaseTimeSeconds(Integer baseTimeSeconds) {
        this.baseTimeSeconds = baseTimeSeconds;
    }

    public Integer getIncrementSeconds() {
        return incrementSeconds;
    }

    public void setIncrementSeconds(Integer incrementSeconds) {
        this.incrementSeconds = incrementSeconds;
    }

    public Integer getWhiteTimeRemaining() {
        return whiteTimeRemaining;
    }

    public void setWhiteTimeRemaining(Integer whiteTimeRemaining) {
        this.whiteTimeRemaining = whiteTimeRemaining;
    }

    public Integer getBlackTimeRemaining() {
        return blackTimeRemaining;
    }

    public void setBlackTimeRemaining(Integer blackTimeRemaining) {
        this.blackTimeRemaining = blackTimeRemaining;
    }

    public Long getLastMoveTimestamp() {
        return lastMoveTimestamp;
    }

    public void setLastMoveTimestamp(Long lastMoveTimestamp) {
        this.lastMoveTimestamp = lastMoveTimestamp;
    }

    public String getActiveColor() {
        return activeColor;
    }

    public void setActiveColor(String activeColor) {
        this.activeColor = activeColor;
    }

    @Override
    public String toString() {
        return "ClockState{" +
                "gameMode='" + gameMode + '\'' +
                ", baseTimeSeconds=" + baseTimeSeconds +
                ", incrementSeconds=" + incrementSeconds +
                ", whiteTimeRemaining=" + whiteTimeRemaining +
                ", blackTimeRemaining=" + blackTimeRemaining +
                ", lastMoveTimestamp=" + lastMoveTimestamp +
                ", activeColor='" + activeColor + '\'' +
                '}';
    }
}
