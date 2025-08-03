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

    public static class CreateGameRequest {
        private String coachId;

        public String getCoachId() {
            return coachId;
        }

        public void setCoachId(String coachId) {
            this.coachId = coachId;
        }
    }
}
