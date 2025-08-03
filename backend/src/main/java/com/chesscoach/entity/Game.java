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
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;
    
    @Column(nullable = false)
    private String currentFen;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlayerColor coachColor;
    
    @Enumerated(EnumType.STRING)
    private PlayerColor studentColor;
    
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
        WAITING_FOR_STUDENT, ACTIVE, PAUSED, ENDED
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
    
    public Game(String gameId, User coach, PlayerColor coachColor) {
        this.gameId = gameId;
        this.coach = coach;
        this.coachColor = coachColor;
        this.studentColor = (coachColor == PlayerColor.WHITE) ? PlayerColor.BLACK : PlayerColor.WHITE;
        this.status = GameStatus.WAITING_FOR_STUDENT;
    }
    
    // Business methods
    public void addStudent(User student) {
        this.student = student;
        this.status = GameStatus.ACTIVE;
    }
    
    public void endGame(String result) {
        this.status = GameStatus.ENDED;
        this.result = result;
        this.endedAt = LocalDateTime.now();
    }
    
    public boolean isActive() {
        return status == GameStatus.ACTIVE;
    }
    
    public boolean isWaitingForStudent() {
        return status == GameStatus.WAITING_FOR_STUDENT;
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
    
    public User getCoach() {
        return coach;
    }
    
    public void setCoach(User coach) {
        this.coach = coach;
    }
    
    public User getStudent() {
        return student;
    }
    
    public void setStudent(User student) {
        this.student = student;
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
    
    public PlayerColor getCoachColor() {
        return coachColor;
    }
    
    public void setCoachColor(PlayerColor coachColor) {
        this.coachColor = coachColor;
    }
    
    public PlayerColor getStudentColor() {
        return studentColor;
    }
    
    public void setStudentColor(PlayerColor studentColor) {
        this.studentColor = studentColor;
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