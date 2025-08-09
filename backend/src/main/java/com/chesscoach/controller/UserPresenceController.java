package com.chesscoach.controller;

import com.chesscoach.service.UserPresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presence")
@CrossOrigin(origins = "*")
public class UserPresenceController {

    private final UserPresenceService presenceService;

    @Autowired
    public UserPresenceController(UserPresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @GetMapping("/online")
    public ResponseEntity<List<Map<String, Object>>> getOnlineUsers() {
        try {
            List<Map<String, Object>> onlineUsers = presenceService.getOnlineUsers();
            return ResponseEntity.ok(onlineUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Map<String, Object>>> getAvailablePlayers() {
        try {
            List<Map<String, Object>> availablePlayers = presenceService.getAvailablePlayers();
            return ResponseEntity.ok(availablePlayers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchOnlineUsers(@RequestParam String q) {
        try {
            List<Map<String, Object>> foundUsers = presenceService.searchOnlineUsers(q);
            return ResponseEntity.ok(foundUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getOnlineUsersCount() {
        try {
            long count = presenceService.getOnlineUsersCount();
            return ResponseEntity.ok(Map.of("onlineCount", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/online")
    public ResponseEntity<Map<String, Object>> setOnline(@RequestBody SetOnlineRequest request) {
        try {
            presenceService.setUserOnline(request.getUserId(), request.getSessionId());
            return ResponseEntity.ok(Map.of("message", "User set online successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/offline")
    public ResponseEntity<Map<String, Object>> setOffline(@RequestBody SetOfflineRequest request) {
        try {
            presenceService.setUserOffline(request.getUserId());
            return ResponseEntity.ok(Map.of("message", "User set offline successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@RequestBody UpdateStatusRequest request) {
        try {
            presenceService.updateStatusMessage(request.getUserId(), request.getStatusMessage());
            return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class SetOnlineRequest {
        private Long userId;
        private String sessionId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getSessionId() {
            return sessionId;
        }

        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }
    }

    public static class SetOfflineRequest {
        private Long userId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }

    public static class UpdateStatusRequest {
        private Long userId;
        private String statusMessage;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getStatusMessage() {
            return statusMessage;
        }

        public void setStatusMessage(String statusMessage) {
            this.statusMessage = statusMessage;
        }
    }
}