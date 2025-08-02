package com.chesscoach.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ChessGame {
    private String gameId;
    private String coachId;
    private String studentId;
    private String currentFen;
    private List<String> moveHistory;
    private GameStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastMoveAt;
    private boolean whiteToMove;

    // Starting position FEN
    private static final String STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    public ChessGame(String gameId, String coachId) {
        this.gameId = gameId;
        this.coachId = coachId;
        this.currentFen = STARTING_FEN;
        this.moveHistory = new ArrayList<>();
        this.status = GameStatus.WAITING_FOR_STUDENT;
        this.createdAt = LocalDateTime.now();
        this.lastMoveAt = LocalDateTime.now();
        this.whiteToMove = true;
    }

    public boolean makeMove(String moveStr, String playerId, String newFen) {
        if (!isPlayerTurn(playerId)) {
            return false;
        }

        // For now, trust the frontend validation
        // In production, you'd want server-side validation
        this.currentFen = newFen;
        this.moveHistory.add(moveStr);
        this.lastMoveAt = LocalDateTime.now();
        this.whiteToMove = !this.whiteToMove;
        
        return true;
    }

    private boolean isPlayerTurn(String playerId) {
        // Allow coach to play even when waiting for student
        if (status == GameStatus.FINISHED || status == GameStatus.ABANDONED) return false;
        
        boolean isCoachWhite = true; // Coach always plays white for now
        
        // If no student yet, coach can always play
        if (studentId == null && playerId.equals(coachId)) return true;
        
        return (whiteToMove && playerId.equals(coachId)) || 
               (!whiteToMove && playerId.equals(studentId));
    }

    public void joinStudent(String studentId) {
        if (this.studentId == null && status == GameStatus.WAITING_FOR_STUDENT) {
            this.studentId = studentId;
            this.status = GameStatus.ACTIVE;
        }
    }

    public void updatePosition(String fen) {
        this.currentFen = fen;
        this.lastMoveAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getGameId() { return gameId; }
    public String getCoachId() { return coachId; }
    public String getStudentId() { return studentId; }
    public String getFen() { return currentFen; }
    public List<String> getMoveHistory() { return new ArrayList<>(moveHistory); }
    public GameStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastMoveAt() { return lastMoveAt; }
    public boolean isWhiteToMove() { return whiteToMove; }

    public enum GameStatus {
        WAITING_FOR_STUDENT,
        ACTIVE,
        FINISHED,
        ABANDONED
    }
}