package com.chesscoach.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_invitations")
public class GameInvitation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status;
    
    // Game preferences
    @Enumerated(EnumType.STRING)
    private Game.PlayerColor senderColor;

    // Time control preferences
    @Enumerated(EnumType.STRING)
    private GameMode gameMode; // TIMED or TRAINING

    private Integer baseTimeSeconds; // Base time for TIMED mode

    private Integer incrementSeconds; // Increment for TIMED mode

    @Column(length = 500)
    private String message;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column
    private LocalDateTime expiresAt;
    
    // If accepted, link to the created game
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;
    
    public enum InvitationType {
        QUICK_GAME,     // Standard chess game
        LESSON,         // Coach-student lesson
        PUZZLE_SESSION  // Collaborative puzzle solving
    }
    
    public enum InvitationStatus {
        PENDING,
        ACCEPTED,
        DECLINED,
        EXPIRED,
        CANCELLED
    }
    
    // Constructors
    public GameInvitation() {}
    
    public GameInvitation(User sender, User recipient, InvitationType type) {
        this.sender = sender;
        this.recipient = recipient;
        this.type = type;
        this.status = InvitationStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        // Default expiration: 5 minutes
        this.expiresAt = LocalDateTime.now().plusMinutes(5);
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getSender() {
        return sender;
    }
    
    public void setSender(User sender) {
        this.sender = sender;
    }
    
    public User getRecipient() {
        return recipient;
    }
    
    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }
    
    public InvitationType getType() {
        return type;
    }
    
    public void setType(InvitationType type) {
        this.type = type;
    }
    
    public InvitationStatus getStatus() {
        return status;
    }
    
    public void setStatus(InvitationStatus status) {
        this.status = status;
    }
    
    public Game.PlayerColor getSenderColor() {
        return senderColor;
    }
    
    public void setSenderColor(Game.PlayerColor senderColor) {
        this.senderColor = senderColor;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
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
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Game getGame() {
        return game;
    }
    
    public void setGame(Game game) {
        this.game = game;
    }
    
    // Helper methods
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isPending() {
        return status == InvitationStatus.PENDING && !isExpired();
    }
    
    public void accept() {
        this.status = InvitationStatus.ACCEPTED;
    }
    
    public void decline() {
        this.status = InvitationStatus.DECLINED;
    }
    
    public void cancel() {
        this.status = InvitationStatus.CANCELLED;
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
}