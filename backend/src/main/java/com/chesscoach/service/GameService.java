package com.chesscoach.service;

import com.chesscoach.entity.Game;
import com.chesscoach.entity.GameMode;
import com.chesscoach.entity.User;
import com.chesscoach.repository.GameRepository;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Random;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final UserPresenceService userPresenceService;
    private final ClockService clockService;

    @Autowired
    public GameService(GameRepository gameRepository, UserRepository userRepository,
                      UserPresenceService userPresenceService, ClockService clockService) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.userPresenceService = userPresenceService;
        this.clockService = clockService;
    }

    public Map<String, Object> createGame(String hostId) {
        return createGame(hostId, "random", null, null, null);
    }

    public Map<String, Object> createGame(String hostId, String colorPreference) {
        return createGame(hostId, colorPreference, null, null, null);
    }

    /**
     * Create a new game with full time control options
     * @param hostId The host user ID
     * @param colorPreference white, black, or random
     * @param gameMode TIMED or TRAINING (defaults to TIMED if null)
     * @param baseTimeSeconds Base time in seconds (required for TIMED, ignored for TRAINING)
     * @param incrementSeconds Increment per move (defaults to 0 if null)
     * @return Game state map
     */
    public Map<String, Object> createGame(String hostId, String colorPreference,
                                         String gameMode, Integer baseTimeSeconds, Integer incrementSeconds) {
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

        // Set game mode and initialize clocks
        GameMode mode = (gameMode != null && gameMode.equalsIgnoreCase("TRAINING"))
                ? GameMode.TRAINING : GameMode.TIMED;
        game.setGameMode(mode);

        if (mode == GameMode.TIMED) {
            // TIMED mode requires base time (default to 10 minutes if not provided)
            int baseTime = (baseTimeSeconds != null && baseTimeSeconds > 0) ? baseTimeSeconds : 600;
            int increment = (incrementSeconds != null && incrementSeconds >= 0) ? incrementSeconds : 0;

            // Validate time control
            if (baseTime < 60) {
                throw new RuntimeException("Base time must be at least 60 seconds (1 minute)");
            }
            if (increment < 0 || increment > 60) {
                throw new RuntimeException("Increment must be between 0 and 60 seconds");
            }

            clockService.initializeClocks(game, baseTime, increment);
        } else {
            // TRAINING mode - no clocks
            clockService.initializeClocks(game, null, null);
        }

        Game savedGame = gameRepository.save(game);

        // Analytics: Log game mode creation
        System.out.println("📊 ANALYTICS: Game created - Mode: " + savedGame.getGameMode() +
                ", BaseTime: " + savedGame.getBaseTimeSeconds() +
                ", Increment: " + savedGame.getIncrementSeconds() +
                ", GameId: " + savedGame.getGameId());

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

        // Prevent the host from joining as guest
        if (game.getHost().getId().equals(guest.getId())) {
            throw new RuntimeException("Host cannot join as guest");
        }

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
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("gameId", game.getGameId());
        response.put("roomCode", game.getRoomCode());
        response.put("hostId", game.getHost().getId().toString());
        response.put("guestId", game.getGuest() != null ? game.getGuest().getId().toString() : "");
        response.put("hostColor", game.getHostColor().toString().toLowerCase());
        response.put("guestColor", game.getGuestColor().toString().toLowerCase());
        response.put("fen", game.getCurrentFen());
        response.put("status", game.getStatus().toString());
        response.put("moveHistory", parseJsonArray(game.getMoveHistory()));

        // Add clock information
        response.put("gameMode", game.getGameMode().toString());
        if (game.getGameMode() == GameMode.TIMED) {
            response.put("baseTimeSeconds", game.getBaseTimeSeconds());
            response.put("incrementSeconds", game.getIncrementSeconds());
            response.put("whiteTimeRemaining", game.getWhiteTimeRemaining());
            response.put("blackTimeRemaining", game.getBlackTimeRemaining());
        }

        return response;
    }

    public Map<String, Object> getCurrentGameForUser(Long userId) {
        // Find the most recent active game where user is either host or guest
        Optional<Game> activeGame = gameRepository.findActiveGameByUser(userId);
        
        if (activeGame.isEmpty()) {
            return null;
        }
        
        return buildGameStateResponse(activeGame.get());
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

    public void leaveGame(String gameId, Long userId) {
        Game game = gameRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        // Verify the user is actually in this game
        boolean isHost = game.getHost() != null && game.getHost().getId().equals(userId);
        boolean isGuest = game.getGuest() != null && game.getGuest().getId().equals(userId);

        if (!isHost && !isGuest) {
            throw new RuntimeException("User is not part of this game");
        }

        // Only abandon games that are currently active or waiting for a guest
        if (game.getStatus() == Game.GameStatus.ACTIVE || game.getStatus() == Game.GameStatus.WAITING_FOR_GUEST) {
            game.abandonGame();
            gameRepository.save(game);
        }

        // Update user presence to ONLINE (from IN_GAME)
        userPresenceService.setUserOnline(userId, null);
    }
}
