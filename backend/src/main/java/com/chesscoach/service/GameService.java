package com.chesscoach.service;

import com.chesscoach.entity.Game;
import com.chesscoach.entity.User;
import com.chesscoach.repository.GameRepository;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.Random;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;

    @Autowired
    public GameService(GameRepository gameRepository, UserRepository userRepository) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> createGame(String coachId) {
        User coach = userRepository.findById(Long.parseLong(coachId))
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        Game game = new Game();
        game.setGameId(UUID.randomUUID().toString());
        game.setRoomCode(generateRoomCode());
        game.setCoach(coach);
        game.setStatus(Game.GameStatus.WAITING_FOR_STUDENT);
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        game.setCoachColor(Game.PlayerColor.WHITE);
        game.setStudentColor(Game.PlayerColor.BLACK);

        Game savedGame = gameRepository.save(game);

        return Map.of(
                "gameId", savedGame.getGameId(),
                "roomCode", savedGame.getRoomCode(),
                "coachColor", savedGame.getCoachColor().toString().toLowerCase()
        );
    }

    public Map<String, Object> joinGame(String gameId, String studentId) {
        Game game = gameRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (game.getStatus() != Game.GameStatus.WAITING_FOR_STUDENT) {
            throw new RuntimeException("Game is not waiting for a student");
        }

        User student = userRepository.findById(Long.parseLong(studentId))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        game.addStudent(student);
        Game savedGame = gameRepository.save(game);

        return buildGameStateResponse(savedGame);
    }

    public Map<String, Object> getGameState(String gameId) {
        Game game = gameRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        return buildGameStateResponse(game);
    }

    public Map<String, Object> joinGameByRoomCode(String roomCode, String studentId) {
        Game game = gameRepository.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Game not found with room code: " + roomCode));

        if (game.getStatus() != Game.GameStatus.WAITING_FOR_STUDENT) {
            throw new RuntimeException("Game is not waiting for a student");
        }

        User student = userRepository.findById(Long.parseLong(studentId))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        game.addStudent(student);
        Game savedGame = gameRepository.save(game);

        return buildGameStateResponse(savedGame);
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder code = new StringBuilder(6);
        
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        // Ensure uniqueness by checking if code already exists
        if (gameRepository.findByRoomCode(code.toString()).isPresent()) {
            return generateRoomCode(); // Recursively generate until unique
        }
        
        return code.toString();
    }

    private Map<String, Object> buildGameStateResponse(Game game) {
        return Map.of(
                "gameId", game.getGameId(),
                "roomCode", game.getRoomCode(),
                "coachId", game.getCoach().getId().toString(),
                "studentId", game.getStudent() != null ? game.getStudent().getId().toString() : "",
                "coachColor", game.getCoachColor().toString().toLowerCase(),
                "studentColor", game.getStudentColor().toString().toLowerCase(),
                "fen", game.getCurrentFen(),
                "status", game.getStatus().toString(),
                "moveHistory", parseJsonArray(game.getMoveHistory())
        );
    }

    private String[] parseJsonArray(String jsonArray) {
        if (jsonArray == null || jsonArray.equals("[]")) {
            return new String[0];
        }
        // Simple JSON array parsing - remove brackets and split by comma
        String cleaned = jsonArray.substring(1, jsonArray.length() - 1);
        if (cleaned.trim().isEmpty()) {
            return new String[0];
        }
        return cleaned.split(",");
    }
}
