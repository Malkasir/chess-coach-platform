package com.chesscoach.dto;

import com.chesscoach.entity.GameInvitation;
import java.time.LocalDateTime;

public class InvitationMessage {
    public enum Type {
        NEW_INVITATION,
        INVITATION_ACCEPTED,
        INVITATION_DECLINED,
        INVITATION_EXPIRED,
        INVITATION_CANCELLED,
        GAME_READY,
        USER_STATUS_UPDATE
    }

    private Type type;
    private Long invitationId;
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String recipientName;
    private String gameType;
    private String senderColor;
    private String message;
    private String gameId;
    private String roomCode;
    private LocalDateTime timestamp;

    // Constructors
    public InvitationMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public InvitationMessage(Type type) {
        this();
        this.type = type;
    }

    // Static factory methods
    public static InvitationMessage newInvitation(GameInvitation invitation) {
        InvitationMessage message = new InvitationMessage(Type.NEW_INVITATION);
        message.setInvitationId(invitation.getId());
        message.setSenderId(invitation.getSender().getId());
        message.setSenderName(invitation.getSender().getFullName());
        message.setRecipientId(invitation.getRecipient().getId());
        message.setRecipientName(invitation.getRecipient().getFullName());
        message.setGameType(invitation.getType().toString());
        message.setSenderColor(invitation.getSenderColor() != null ? invitation.getSenderColor().toString() : null);
        message.setMessage(invitation.getMessage());
        return message;
    }

    public static InvitationMessage invitationAccepted(GameInvitation invitation) {
        InvitationMessage message = new InvitationMessage(Type.INVITATION_ACCEPTED);
        message.setInvitationId(invitation.getId());
        message.setSenderId(invitation.getSender().getId());
        message.setSenderName(invitation.getSender().getFullName());
        message.setRecipientId(invitation.getRecipient().getId());
        message.setRecipientName(invitation.getRecipient().getFullName());
        if (invitation.getGame() != null) {
            message.setGameId(invitation.getGame().getGameId());
            message.setRoomCode(invitation.getGame().getRoomCode());
        }
        return message;
    }

    public static InvitationMessage invitationDeclined(GameInvitation invitation) {
        InvitationMessage message = new InvitationMessage(Type.INVITATION_DECLINED);
        message.setInvitationId(invitation.getId());
        message.setSenderId(invitation.getSender().getId());
        message.setSenderName(invitation.getSender().getFullName());
        message.setRecipientId(invitation.getRecipient().getId());
        message.setRecipientName(invitation.getRecipient().getFullName());
        return message;
    }

    public static InvitationMessage invitationExpired(Long invitationId, Long senderId, Long recipientId) {
        InvitationMessage message = new InvitationMessage(Type.INVITATION_EXPIRED);
        message.setInvitationId(invitationId);
        message.setSenderId(senderId);
        message.setRecipientId(recipientId);
        return message;
    }

    public static InvitationMessage gameReady(String gameId, String roomCode, Long player1Id, Long player2Id) {
        InvitationMessage message = new InvitationMessage(Type.GAME_READY);
        message.setGameId(gameId);
        message.setRoomCode(roomCode);
        message.setSenderId(player1Id);
        message.setRecipientId(player2Id);
        return message;
    }

    public static InvitationMessage userStatusUpdate(Long userId, String status) {
        InvitationMessage message = new InvitationMessage(Type.USER_STATUS_UPDATE);
        message.setSenderId(userId);
        message.setMessage(status);
        return message;
    }

    // Getters and setters
    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public Long getInvitationId() {
        return invitationId;
    }

    public void setInvitationId(Long invitationId) {
        this.invitationId = invitationId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getGameType() {
        return gameType;
    }

    public void setGameType(String gameType) {
        this.gameType = gameType;
    }

    public String getSenderColor() {
        return senderColor;
    }

    public void setSenderColor(String senderColor) {
        this.senderColor = senderColor;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "InvitationMessage{" +
                "type=" + type +
                ", invitationId=" + invitationId +
                ", senderId=" + senderId +
                ", senderName='" + senderName + '\'' +
                ", recipientId=" + recipientId +
                ", recipientName='" + recipientName + '\'' +
                ", gameType='" + gameType + '\'' +
                ", senderColor='" + senderColor + '\'' +
                ", message='" + message + '\'' +
                ", gameId='" + gameId + '\'' +
                ", roomCode='" + roomCode + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}