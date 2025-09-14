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
}