package com.chesscoach.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "games")
public class Game {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String gameId; // The public game ID used in frontend
    
    @Column(unique = true, nullable = false, length = 6)
    private String roomCode; // Short room code for easy sharing (e.g., "ABC123")
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id")
    private User guest;
    
    @Column(nullable = false)
    private String currentFen;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlayerColor hostColor;
    
    @Enumerated(EnumType.STRING)
    private PlayerColor guestColor;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    private LocalDateTime endedAt;
    
    // Game moves as JSON array
    @Column(columnDefinition = "TEXT")
    private String moveHistory;

    // Game result
    private String result;

    // Clock and time control fields
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameMode gameMode;

    // Base time in seconds for each player (null for TRAINING mode)
    private Integer baseTimeSeconds;

    // Increment in seconds added after each move (0 for no increment)
    private Integer incrementSeconds;

    // Current time remaining for white in seconds
    private Integer whiteTimeRemaining;

    // Current time remaining for black in seconds
    private Integer blackTimeRemaining;

    // Timestamp (epoch milliseconds) when the last move was made
    private Long lastMoveTimestamp;
    
    public enum GameStatus {
        WAITING_FOR_GUEST, ACTIVE, PAUSED, ENDED, ABANDONED
    }
    
    public enum PlayerColor {
        WHITE, BLACK
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (currentFen == null) {
            currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Starting position
        }
        if (moveHistory == null) {
            moveHistory = "[]"; // Empty JSON array
        }
        if (gameMode == null) {
            gameMode = GameMode.TIMED; // Default to TIMED mode
        }
        if (incrementSeconds == null) {
            incrementSeconds = 0; // Default to no increment
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Game() {}
    
    public Game(String gameId, User host, PlayerColor hostColor) {
        this.gameId = gameId;
        this.host = host;
        this.hostColor = hostColor;
        this.guestColor = (hostColor == PlayerColor.WHITE) ? PlayerColor.BLACK : PlayerColor.WHITE;
        this.status = GameStatus.WAITING_FOR_GUEST;
    }
    
    // Business methods
    public void addGuest(User guest) {
        this.guest = guest;
        this.status = GameStatus.ACTIVE;
    }
    
    public void endGame(String result) {
        this.status = GameStatus.ENDED;
        this.result = result;
        this.endedAt = LocalDateTime.now();
    }

    public void abandonGame() {
        this.status = GameStatus.ABANDONED;
        this.result = "abandoned";
        this.endedAt = LocalDateTime.now();
    }
    
    public boolean isActive() {
        return status == GameStatus.ACTIVE;
    }
    
    public boolean isWaitingForGuest() {
        return status == GameStatus.WAITING_FOR_GUEST;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public String getRoomCode() {
        return roomCode;
    }
    
    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }
    
    public User getHost() {
        return host;
    }
    
    public void setHost(User host) {
        this.host = host;
    }
    
    public User getGuest() {
        return guest;
    }
    
    public void setGuest(User guest) {
        this.guest = guest;
    }
    
    public String getCurrentFen() {
        return currentFen;
    }
    
    public void setCurrentFen(String currentFen) {
        this.currentFen = currentFen;
    }
    
    public GameStatus getStatus() {
        return status;
    }
    
    public void setStatus(GameStatus status) {
        this.status = status;
    }
    
    public PlayerColor getHostColor() {
        return hostColor;
    }
    
    public void setHostColor(PlayerColor hostColor) {
        this.hostColor = hostColor;
    }
    
    public PlayerColor getGuestColor() {
        return guestColor;
    }
    
    public void setGuestColor(PlayerColor guestColor) {
        this.guestColor = guestColor;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public LocalDateTime getEndedAt() {
        return endedAt;
    }
    
    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }
    
    public String getMoveHistory() {
        return moveHistory;
    }
    
    public void setMoveHistory(String moveHistory) {
        this.moveHistory = moveHistory;
    }
    
    public String getResult() {
        return result;
    }
    
    public void setResult(String result) {
        this.result = result;
    }

    public GameMode getGameMode() {
        return gameMode;
    }

    public void setGameMode(GameMode gameMode) {
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

    /**
     * Check if a player's clock has expired
     * @param color The player color to check
     * @return true if the player's time has expired
     */
    public boolean isTimeExpired(PlayerColor color) {
        if (gameMode != GameMode.TIMED) {
            return false; // No time limit in training mode
        }

        Integer timeRemaining = (color == PlayerColor.WHITE) ? whiteTimeRemaining : blackTimeRemaining;
        return timeRemaining != null && timeRemaining <= 0;
    }

    /**
     * Get time remaining for a specific player
     * @param color The player color
     * @return Time remaining in seconds, or null if not applicable
     */
    public Integer getTimeRemaining(PlayerColor color) {
        return (color == PlayerColor.WHITE) ? whiteTimeRemaining : blackTimeRemaining;
    }

    /**
     * Set time remaining for a specific player
     * @param color The player color
     * @param timeInSeconds Time remaining in seconds
     */
    public void setTimeRemaining(PlayerColor color, Integer timeInSeconds) {
        if (color == PlayerColor.WHITE) {
            this.whiteTimeRemaining = timeInSeconds;
        } else {
            this.blackTimeRemaining = timeInSeconds;
        }
    }
}