package com.chesscoach.dto;

import java.util.List;

public class GameMessage {
    private String type;
    private String gameId;
    private String playerId;
    private String move;
    private String fen;
    private String message;
    private List<String> moveHistory;
    private ClockState clockState; // Clock state for timed games

    public GameMessage() {}

    public GameMessage(String type, String gameId) {
        this.type = type;
        this.gameId = gameId;
    }

    // Static factory methods for different message types
    public static GameMessage moveMessage(String gameId, String playerId, String move, String fen) {
        GameMessage msg = new GameMessage("MOVE", gameId);
        msg.setPlayerId(playerId);
        msg.setMove(move);
        msg.setFen(fen);
        return msg;
    }

    public static GameMessage joinMessage(String gameId, String playerId) {
        GameMessage msg = new GameMessage("PLAYER_JOINED", gameId);
        msg.setPlayerId(playerId);
        return msg;
    }

    public static GameMessage errorMessage(String gameId, String message) {
        GameMessage msg = new GameMessage("ERROR", gameId);
        msg.setMessage(message);
        return msg;
    }

    public static GameMessage gameStateMessage(String gameId, String fen, List<String> moveHistory) {
        GameMessage msg = new GameMessage("GAME_STATE", gameId);
        msg.setFen(fen);
        msg.setMoveHistory(moveHistory);
        return msg;
    }

    public static GameMessage timeoutMessage(String gameId, String losingColor, String winningColor) {
        GameMessage msg = new GameMessage("GAME_OVER", gameId);
        msg.setMessage(winningColor + " wins on time! " + losingColor + " ran out of time.");
        return msg;
    }

    // Getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getMove() { return move; }
    public void setMove(String move) { this.move = move; }

    public String getFen() { return fen; }
    public void setFen(String fen) { this.fen = fen; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<String> getMoveHistory() { return moveHistory; }
    public void setMoveHistory(List<String> moveHistory) { this.moveHistory = moveHistory; }

    public ClockState getClockState() { return clockState; }
    public void setClockState(ClockState clockState) { this.clockState = clockState; }
}