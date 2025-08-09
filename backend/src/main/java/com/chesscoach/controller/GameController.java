package com.chesscoach.controller;

import com.chesscoach.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;

    @Autowired
    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createGame(@RequestBody CreateGameRequest request) {
        try {
            Map<String, Object> newGame = gameService.createGame(request.getHostId(), request.getColorPreference());
            return ResponseEntity.ok(newGame);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/join")
    public ResponseEntity<?> joinGame(@PathVariable String gameId, @RequestBody JoinGameRequest request) {
        try {
            Map<String, Object> gameState = gameService.joinGame(gameId, request.getGuestId());
            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<?> getGameState(@PathVariable String gameId) {
        try {
            Map<String, Object> gameState = gameService.getGameState(gameId);
            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/join-by-code")
    public ResponseEntity<?> joinByRoomCode(@RequestBody JoinByCodeRequest request) {
        try {
            Map<String, Object> gameState = gameService.joinGameByRoomCode(request.getRoomCode(), request.getGuestId());
            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/current")
    public ResponseEntity<?> getCurrentGameForUser(@PathVariable Long userId) {
        try {
            Map<String, Object> currentGame = gameService.getCurrentGameForUser(userId);
            if (currentGame != null) {
                return ResponseEntity.ok(currentGame);
            } else {
                return ResponseEntity.ok(Map.of("message", "No active game found"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class CreateGameRequest {
        private String hostId;
        private String colorPreference = "random"; // default to random

        public String getHostId() {
            return hostId;
        }

        public void setHostId(String hostId) {
            this.hostId = hostId;
        }

        public String getColorPreference() {
            return colorPreference;
        }

        public void setColorPreference(String colorPreference) {
            this.colorPreference = colorPreference;
        }
    }

    public static class JoinGameRequest {
        private String guestId;

        public String getGuestId() {
            return guestId;
        }

        public void setGuestId(String guestId) {
            this.guestId = guestId;
        }
    }

    public static class JoinByCodeRequest {
        private String roomCode;
        private String guestId;

        public String getRoomCode() {
            return roomCode;
        }

        public void setRoomCode(String roomCode) {
            this.roomCode = roomCode;
        }

        public String getGuestId() {
            return guestId;
        }

        public void setGuestId(String guestId) {
            this.guestId = guestId;
        }
    }
}
