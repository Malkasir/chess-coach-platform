package com.chesscoach.controller;

import com.chesscoach.entity.User;
import com.chesscoach.service.TrainingSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/training")
@CrossOrigin(origins = "*")
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;

    @Autowired
    public TrainingSessionController(TrainingSessionService trainingSessionService) {
        this.trainingSessionService = trainingSessionService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createSession(
            @AuthenticationPrincipal User authenticatedUser,
            @RequestBody CreateSessionRequest request) {
        try {
            Map<String, Object> newSession = trainingSessionService.createSession(
                authenticatedUser,
                request.getInitialFen()
            );
            return ResponseEntity.ok(newSession);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/join-by-code")
    public ResponseEntity<?> joinByRoomCode(
            @AuthenticationPrincipal User authenticatedUser,
            @RequestBody JoinSessionRequest request) {
        try {
            Map<String, Object> sessionState = trainingSessionService.joinSession(
                request.getRoomCode(),
                authenticatedUser
            );
            return ResponseEntity.ok(sessionState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSessionState(
            @AuthenticationPrincipal User authenticatedUser,
            @PathVariable String sessionId) {
        try {
            Map<String, Object> sessionState = trainingSessionService.getSessionState(sessionId, authenticatedUser);
            return ResponseEntity.ok(sessionState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/update-position")
    public ResponseEntity<?> updatePosition(
            @AuthenticationPrincipal User authenticatedUser,
            @PathVariable String sessionId,
            @RequestBody UpdatePositionRequest request) {
        try {
            Map<String, Object> sessionState = trainingSessionService.updatePosition(
                sessionId,
                authenticatedUser,
                request.getNewFen(),
                request.getNewMoveHistory()
            );
            return ResponseEntity.ok(sessionState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<?> endSession(
            @AuthenticationPrincipal User authenticatedUser,
            @PathVariable String sessionId) {
        try {
            Map<String, Object> result = trainingSessionService.endSession(sessionId, authenticatedUser);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveSessionForCoach(@AuthenticationPrincipal User authenticatedUser) {
        try {
            return trainingSessionService.findActiveSessionByCoach(authenticatedUser)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.ok(Map.of("message", "No active training session found")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Request DTOs
    public static class CreateSessionRequest {
        private String initialFen;

        public String getInitialFen() {
            return initialFen;
        }

        public void setInitialFen(String initialFen) {
            this.initialFen = initialFen;
        }
    }

    public static class JoinSessionRequest {
        private String roomCode;

        public String getRoomCode() {
            return roomCode;
        }

        public void setRoomCode(String roomCode) {
            this.roomCode = roomCode;
        }
    }

    public static class UpdatePositionRequest {
        private String newFen;
        private String newMoveHistory;

        public String getNewFen() {
            return newFen;
        }

        public void setNewFen(String newFen) {
            this.newFen = newFen;
        }

        public String getNewMoveHistory() {
            return newMoveHistory;
        }

        public void setNewMoveHistory(String newMoveHistory) {
            this.newMoveHistory = newMoveHistory;
        }
    }
}
