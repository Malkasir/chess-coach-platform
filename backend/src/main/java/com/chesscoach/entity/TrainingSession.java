package com.chesscoach.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "training_sessions")
public class TrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String sessionId; // The public session ID used in frontend

    @Column(unique = true, nullable = false, length = 10)
    private String roomCode; // Short room code for easy sharing (e.g., "TRAIN-ABC")

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach; // The user who created the training session

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "training_session_participants",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> participants = new ArrayList<>(); // All users in the session (coach + students)

    @Column(nullable = false)
    private String currentFen; // Current board position

    @Column(columnDefinition = "TEXT")
    private String moveHistory; // Game moves as JSON array

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    @Column(nullable = false)
    private Boolean interactiveMode = false; // Phase 2: Allow students to make moves when enabled

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime endedAt;

    public enum SessionStatus {
        ACTIVE, PAUSED, ENDED
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
        // Add coach to participants automatically
        if (coach != null && !participants.contains(coach)) {
            participants.add(coach);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public TrainingSession() {}

    public TrainingSession(String sessionId, String roomCode, User coach) {
        this.sessionId = sessionId;
        this.roomCode = roomCode;
        this.coach = coach;
        this.status = SessionStatus.ACTIVE;
        this.participants = new ArrayList<>();
        this.participants.add(coach); // Coach is always a participant
    }

    // Business methods
    public void addParticipant(User user) {
        if (!isParticipant(user)) {
            participants.add(user);
        }
    }

    public void removeParticipant(User user) {
        participants.removeIf(p -> p.getId().equals(user.getId()));
    }

    public void endSession() {
        this.status = SessionStatus.ENDED;
        this.endedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return status == SessionStatus.ACTIVE;
    }

    public boolean isCoach(User user) {
        return coach.getId().equals(user.getId());
    }

    public boolean isParticipant(User user) {
        return participants.stream().anyMatch(p -> p.getId().equals(user.getId()));
    }

    public int getParticipantCount() {
        return participants.size();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
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

    public List<User> getParticipants() {
        return participants;
    }

    public void setParticipants(List<User> participants) {
        this.participants = participants;
    }

    public String getCurrentFen() {
        return currentFen;
    }

    public void setCurrentFen(String currentFen) {
        this.currentFen = currentFen;
    }

    public String getMoveHistory() {
        return moveHistory;
    }

    public void setMoveHistory(String moveHistory) {
        this.moveHistory = moveHistory;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
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

    public Boolean getInteractiveMode() {
        return interactiveMode;
    }

    public void setInteractiveMode(Boolean interactiveMode) {
        this.interactiveMode = interactiveMode;
    }
}
