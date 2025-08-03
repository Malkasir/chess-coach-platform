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
            Map<String, Object> newGame = gameService.createGame(request.getCoachId());
            return ResponseEntity.ok(newGame);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/join")
    public ResponseEntity<?> joinGame(@PathVariable String gameId, @RequestBody JoinGameRequest request) {
        try {
            Map<String, Object> gameState = gameService.joinGame(gameId, request.getStudentId());
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
            Map<String, Object> gameState = gameService.joinGameByRoomCode(request.getRoomCode(), request.getStudentId());
            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class CreateGameRequest {
        private String coachId;

        public String getCoachId() {
            return coachId;
        }

        public void setCoachId(String coachId) {
            this.coachId = coachId;
        }
    }

    public static class JoinGameRequest {
        private String studentId;

        public String getStudentId() {
            return studentId;
        }

        public void setStudentId(String studentId) {
            this.studentId = studentId;
        }
    }

    public static class JoinByCodeRequest {
        private String roomCode;
        private String studentId;

        public String getRoomCode() {
            return roomCode;
        }

        public void setRoomCode(String roomCode) {
            this.roomCode = roomCode;
        }

        public String getStudentId() {
            return studentId;
        }

        public void setStudentId(String studentId) {
            this.studentId = studentId;
        }
    }
}
