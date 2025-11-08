package com.chesscoach.controller;

import com.chesscoach.entity.GameInvitation.InvitationType;
import com.chesscoach.service.GameInvitationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "*")
public class GameInvitationController {

    private final GameInvitationService invitationService;

    @Autowired
    public GameInvitationController(GameInvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendInvitation(@RequestBody SendInvitationRequest request) {
        try {
            InvitationType type = InvitationType.valueOf(request.getType().toUpperCase());
            Map<String, Object> invitation = invitationService.sendGameInvitation(
                    request.getSenderId(),
                    request.getRecipientId(),
                    type,
                    request.getColorPreference(),
                    request.getMessage(),
                    request.getGameMode(),
                    request.getBaseTimeSeconds(),
                    request.getIncrementSeconds()
            );
            return ResponseEntity.ok(invitation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid invitation type"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<Map<String, Object>> acceptInvitation(
            @PathVariable Long invitationId,
            @RequestBody AcceptInvitationRequest request) {
        try {
            System.out.println("🎮 Accepting invitation " + invitationId + " for user " + request.getUserId());
            Map<String, Object> result = invitationService.acceptInvitation(invitationId, request.getUserId());
            System.out.println("✅ Invitation accepted successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("❌ Error accepting invitation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{invitationId}/decline")
    public ResponseEntity<Map<String, Object>> declineInvitation(
            @PathVariable Long invitationId,
            @RequestBody DeclineInvitationRequest request) {
        try {
            Map<String, Object> result = invitationService.declineInvitation(invitationId, request.getUserId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{invitationId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelInvitation(
            @PathVariable Long invitationId,
            @RequestBody CancelInvitationRequest request) {
        try {
            invitationService.cancelInvitation(invitationId, request.getUserId());
            return ResponseEntity.ok(Map.of("message", "Invitation cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPendingInvitations(@PathVariable Long userId) {
        try {
            List<Map<String, Object>> invitations = invitationService.getPendingInvitationsForUser(userId);
            return ResponseEntity.ok(invitations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getSentInvitations(@PathVariable Long userId) {
        try {
            List<Map<String, Object>> invitations = invitationService.getSentInvitationsByUser(userId);
            return ResponseEntity.ok(invitations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Request DTOs
    public static class SendInvitationRequest {
        private Long senderId;
        private Long recipientId;
        private String type; // "quick_game", "lesson", "puzzle_session"
        private String colorPreference; // "white", "black", "random"
        private String message;
        private String gameMode; // "TIMED", "TRAINING"
        private Integer baseTimeSeconds;
        private Integer incrementSeconds;

        public Long getSenderId() {
            return senderId;
        }

        public void setSenderId(Long senderId) {
            this.senderId = senderId;
        }

        public Long getRecipientId() {
            return recipientId;
        }

        public void setRecipientId(Long recipientId) {
            this.recipientId = recipientId;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getColorPreference() {
            return colorPreference;
        }

        public void setColorPreference(String colorPreference) {
            this.colorPreference = colorPreference;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getGameMode() {
            return gameMode;
        }

        public void setGameMode(String gameMode) {
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

    public static class AcceptInvitationRequest {
        private Long userId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }

    public static class DeclineInvitationRequest {
        private Long userId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }

    public static class CancelInvitationRequest {
        private Long userId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }
}