package com.chesscoach.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_presence")
public class UserPresence {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PresenceStatus status;
    
    @Column(nullable = false)
    private LocalDateTime lastSeen;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Session information for WebSocket tracking
    @Column(length = 100)
    private String sessionId;
    
    // Optional status message
    @Column(length = 200)
    private String statusMessage;
    
    public enum PresenceStatus {
        ONLINE,
        AWAY,
        OFFLINE,
        IN_GAME,
        TEACHING  // For chess coaches
    }
    
    // Constructors
    public UserPresence() {}
    
    public UserPresence(User user, PresenceStatus status) {
        this.user = user;
        this.status = status;
        this.lastSeen = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (status == PresenceStatus.ONLINE || status == PresenceStatus.IN_GAME) {
            lastSeen = LocalDateTime.now();
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public PresenceStatus getStatus() {
        return status;
    }
    
    public void setStatus(PresenceStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getLastSeen() {
        return lastSeen;
    }
    
    public void setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public String getStatusMessage() {
        return statusMessage;
    }
    
    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
    
    // Helper methods
    public boolean isOnline() {
        return status == PresenceStatus.ONLINE || status == PresenceStatus.IN_GAME || status == PresenceStatus.TEACHING;
    }
    
    public boolean isAvailable() {
        return status == PresenceStatus.ONLINE;
    }
}