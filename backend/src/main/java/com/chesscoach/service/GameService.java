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

    public Map<String, Object> createGame(String hostId) {
        return createGame(hostId, "random");
    }

    public Map<String, Object> createGame(String hostId, String colorPreference) {
        User host = userRepository.findById(Long.parseLong(hostId))
                .orElseThrow(() -> new RuntimeException("Host not found"));

        Game game = new Game();
        game.setGameId(UUID.randomUUID().toString());
        game.setRoomCode(generateRoomCode());
        game.setHost(host);
        game.setStatus(Game.GameStatus.WAITING_FOR_GUEST);
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        
        // Assign colors based on preference
        Game.PlayerColor hostColor;
        Game.PlayerColor guestColor;
        
        switch (colorPreference.toLowerCase()) {
            case "white":
                hostColor = Game.PlayerColor.WHITE;
                guestColor = Game.PlayerColor.BLACK;
                break;
            case "black":
                hostColor = Game.PlayerColor.BLACK;
                guestColor = Game.PlayerColor.WHITE;
                break;
            case "random":
            default:
                // Randomly assign colors
                boolean hostIsWhite = new Random().nextBoolean();
                hostColor = hostIsWhite ? Game.PlayerColor.WHITE : Game.PlayerColor.BLACK;
                guestColor = hostIsWhite ? Game.PlayerColor.BLACK : Game.PlayerColor.WHITE;
                break;
        }
        
        game.setHostColor(hostColor);
        game.setGuestColor(guestColor);

        Game savedGame = gameRepository.save(game);
        
        return Map.of(
                "gameId", savedGame.getGameId(),
                "roomCode", savedGame.getRoomCode(),
                "hostColor", savedGame.getHostColor().toString().toLowerCase()
        );
    }

    public Map<String, Object> joinGame(String gameId, String guestId) {
        Game game = gameRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (game.getStatus() != Game.GameStatus.WAITING_FOR_GUEST) {
            throw new RuntimeException("Game is not waiting for a guest");
        }

        User guest = userRepository.findById(Long.parseLong(guestId))
                .orElseThrow(() -> new RuntimeException("Guest not found"));

        game.addGuest(guest);
        Game savedGame = gameRepository.save(game);

        return buildGameStateResponse(savedGame);
    }

    public Map<String, Object> getGameState(String gameId) {
        Game game = gameRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        return buildGameStateResponse(game);
    }

    public Map<String, Object> joinGameByRoomCode(String roomCode, String guestId) {
        Game game = gameRepository.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Game not found with room code: " + roomCode));

        if (game.getStatus() != Game.GameStatus.WAITING_FOR_GUEST) {
            throw new RuntimeException("Game is not waiting for a guest");
        }

        User guest = userRepository.findById(Long.parseLong(guestId))
                .orElseThrow(() -> new RuntimeException("Guest not found"));

        game.addGuest(guest);
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
                "hostId", game.getHost().getId().toString(),
                "guestId", game.getGuest() != null ? game.getGuest().getId().toString() : "",
                "hostColor", game.getHostColor().toString().toLowerCase(),
                "guestColor", game.getGuestColor().toString().toLowerCase(),
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
