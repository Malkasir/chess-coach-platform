package com.chesscoach.controller;

import com.chesscoach.model.ChessGame;
import com.chesscoach.repository.GameRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*") // Allow all origins for development
public class GameRestController {

    @Autowired
    private GameRepository gameRepository;

    @PostMapping("/create")
    public ResponseEntity<Map<String, String>> createGame(@RequestBody Map<String, String> request) {
        String coachId = request.get("coachId");
        if (coachId == null || coachId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Coach ID is required"));
        }

        String gameId = generateGameId();
        ChessGame game = new ChessGame(gameId, coachId);
        gameRepository.save(game);

        return ResponseEntity.ok(Map.of(
            "gameId", gameId,
            "status", "created",
            "fen", game.getFen()
        ));
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<Map<String, Object>> getGame(@PathVariable String gameId) {
        Optional<ChessGame> gameOpt = gameRepository.findById(gameId);
        
        if (gameOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ChessGame game = gameOpt.get();
        return ResponseEntity.ok(Map.of(
            "gameId", game.getGameId(),
            "coachId", game.getCoachId(),
            "studentId", game.getStudentId() != null ? game.getStudentId() : "",
            "fen", game.getFen(),
            "status", game.getStatus().toString(),
            "moveHistory", game.getMoveHistory()
        ));
    }

    @PostMapping("/{gameId}/join")
    public ResponseEntity<Map<String, String>> joinGame(
            @PathVariable String gameId, 
            @RequestBody Map<String, String> request) {
        
        String studentId = request.get("studentId");
        if (studentId == null || studentId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student ID is required"));
        }

        Optional<ChessGame> gameOpt = gameRepository.findById(gameId);
        if (gameOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ChessGame game = gameOpt.get();
        if (game.getStudentId() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Game already has a student"));
        }

        game.joinStudent(studentId);
        gameRepository.save(game);

        return ResponseEntity.ok(Map.of(
            "status", "joined",
            "gameId", gameId,
            "fen", game.getFen()
        ));
    }

    private String generateGameId() {
        // Generate a short, readable game ID
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}