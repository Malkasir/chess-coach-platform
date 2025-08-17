package com.chesscoach.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.time.LocalDateTime;

@Entity
@Table(name = "puzzles")
public class Puzzle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String fen;
    
    @NotBlank
    @Size(max = 500)
    @Column(nullable = false, length = 500)
    private String solution;
    
    @Min(1)
    @Max(10)
    @Column(nullable = false)
    private Integer difficulty;
    
    @Size(max = 1000)
    @Column(length = 1000)
    private String description;
    
    @Size(max = 50)
    @Column(length = 50)
    private String theme;
    
    @Size(max = 50)
    @Column(length = 50)
    private String source;
    
    @Column(name = "move_count")
    private Integer moveCount;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = true)
    private User createdBy;
    
    // Default constructor
    public Puzzle() {}
    
    // Constructor with essential fields
    public Puzzle(String fen, String solution, Integer difficulty, String description) {
        this.fen = fen;
        this.solution = solution;
        this.difficulty = difficulty;
        this.description = description;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
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
    
    public String getFen() {
        return fen;
    }
    
    public void setFen(String fen) {
        this.fen = fen;
    }
    
    public String getSolution() {
        return solution;
    }
    
    public void setSolution(String solution) {
        this.solution = solution;
    }
    
    public Integer getDifficulty() {
        return difficulty;
    }
    
    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getTheme() {
        return theme;
    }
    
    public void setTheme(String theme) {
        this.theme = theme;
    }
    
    public String getSource() {
        return source;
    }
    
    public void setSource(String source) {
        this.source = source;
    }
    
    public Integer getMoveCount() {
        return moveCount;
    }
    
    public void setMoveCount(Integer moveCount) {
        this.moveCount = moveCount;
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
    
    public User getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
    
    @Override
    public String toString() {
        return "Puzzle{" +
                "id=" + id +
                ", fen='" + fen + '\'' +
                ", difficulty=" + difficulty +
                ", theme='" + theme + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}