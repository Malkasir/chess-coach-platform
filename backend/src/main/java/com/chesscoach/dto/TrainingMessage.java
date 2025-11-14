package com.chesscoach.dto;

import java.util.List;
import java.util.Map;

public class TrainingMessage {
    private String type;
    private String sessionId;
    private String userId;
    private String userName;
    private String fen;
    private String moveHistory;
    private String message;
    private Integer participantCount;
    private List<Map<String, Object>> participants;
    private Boolean interactiveMode; // Phase 2: Interactive mode state

    public TrainingMessage() {}

    public TrainingMessage(String type, String sessionId) {
        this.type = type;
        this.sessionId = sessionId;
    }

    // Static factory methods for different message types
    public static TrainingMessage participantJoinedMessage(String sessionId, String userId, String userName, Integer participantCount) {
        TrainingMessage msg = new TrainingMessage("PARTICIPANT_JOINED", sessionId);
        msg.setUserId(userId);
        msg.setUserName(userName);
        msg.setParticipantCount(participantCount);
        return msg;
    }

    public static TrainingMessage positionUpdateMessage(String sessionId, String fen, String moveHistory) {
        TrainingMessage msg = new TrainingMessage("POSITION_UPDATE", sessionId);
        msg.setFen(fen);
        msg.setMoveHistory(moveHistory);
        return msg;
    }

    public static TrainingMessage sessionStateMessage(String sessionId, String fen, String moveHistory,
                                                      List<Map<String, Object>> participants, Integer participantCount) {
        TrainingMessage msg = new TrainingMessage("SESSION_STATE", sessionId);
        msg.setFen(fen);
        msg.setMoveHistory(moveHistory);
        msg.setParticipants(participants);
        msg.setParticipantCount(participantCount);
        return msg;
    }

    public static TrainingMessage sessionEndedMessage(String sessionId, String message) {
        TrainingMessage msg = new TrainingMessage("SESSION_ENDED", sessionId);
        msg.setMessage(message);
        return msg;
    }

    public static TrainingMessage errorMessage(String sessionId, String message) {
        TrainingMessage msg = new TrainingMessage("ERROR", sessionId);
        msg.setMessage(message);
        return msg;
    }

    public static TrainingMessage modeChangedMessage(String sessionId, Boolean interactiveMode) {
        TrainingMessage msg = new TrainingMessage("MODE_CHANGED", sessionId);
        msg.setInteractiveMode(interactiveMode);
        return msg;
    }

    // Getters and setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getFen() {
        return fen;
    }

    public void setFen(String fen) {
        this.fen = fen;
    }

    public String getMoveHistory() {
        return moveHistory;
    }

    public void setMoveHistory(String moveHistory) {
        this.moveHistory = moveHistory;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getParticipantCount() {
        return participantCount;
    }

    public void setParticipantCount(Integer participantCount) {
        this.participantCount = participantCount;
    }

    public List<Map<String, Object>> getParticipants() {
        return participants;
    }

    public void setParticipants(List<Map<String, Object>> participants) {
        this.participants = participants;
    }

    public Boolean getInteractiveMode() {
        return interactiveMode;
    }

    public void setInteractiveMode(Boolean interactiveMode) {
        this.interactiveMode = interactiveMode;
    }
}
