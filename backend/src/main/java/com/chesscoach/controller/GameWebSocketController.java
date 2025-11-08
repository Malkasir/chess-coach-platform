package com.chesscoach.controller;

import com.chesscoach.dto.ClockState;
import com.chesscoach.dto.GameMessage;
import com.chesscoach.entity.Game;
import com.chesscoach.entity.User;
import com.chesscoach.repository.GameRepository;
import com.chesscoach.repository.UserRepository;
import com.chesscoach.service.ClockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Controller
public class GameWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final ClockService clockService;

    @Autowired
    public GameWebSocketController(SimpMessagingTemplate messagingTemplate,
                                   GameRepository gameRepository,
                                   UserRepository userRepository,
                                   ClockService clockService) {
        this.messagingTemplate = messagingTemplate;
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.clockService = clockService;
    }

    @MessageMapping("/game/join")
    public void handleJoinGame(@Payload GameMessage message) {
        try {
            System.out.println("🔌 Player " + message.getPlayerId() + " joining game " + message.getGameId());
            
            Optional<Game> gameOpt = gameRepository.findByGameId(message.getGameId());
            if (gameOpt.isEmpty()) {
                System.out.println("❌ Game not found: " + message.getGameId());
                sendError(message.getGameId(), message.getPlayerId(), "Game not found");
                return;
            }

            Game game = gameOpt.get();
            System.out.println("✅ Game found - Host: " + game.getHost().getId() + ", Guest: " + 
                (game.getGuest() != null ? game.getGuest().getId() : "null"));
            
            // Send player joined message to all players in the game
            GameMessage joinMessage = GameMessage.joinMessage(message.getGameId(), message.getPlayerId());
            System.out.println("📢 Broadcasting join message to /topic/game/" + message.getGameId());
            messagingTemplate.convertAndSend("/topic/game/" + message.getGameId(), joinMessage);

            // Send current game state to the joining player (with clock state)
            List<String> moveHistory = parseJsonArrayToList(game.getMoveHistory());
            GameMessage stateMessage = GameMessage.gameStateMessage(
                message.getGameId(),
                game.getCurrentFen(),
                moveHistory
            );

            // Include authoritative clock state
            ClockState clockState = clockService.buildClockState(game);
            stateMessage.setClockState(clockState);

            messagingTemplate.convertAndSend("/topic/game/" + message.getGameId() + "/" + message.getPlayerId(), stateMessage);

        } catch (Exception e) {
            sendError(message.getGameId(), message.getPlayerId(), "Failed to join game: " + e.getMessage());
        }
    }

    @MessageMapping("/game/move")
    public void handleMove(@Payload GameMessage message) {
        try {
            Optional<Game> gameOpt = gameRepository.findByGameId(message.getGameId());
            if (gameOpt.isEmpty()) {
                sendError(message.getGameId(), message.getPlayerId(), "Game not found");
                return;
            }

            Game game = gameOpt.get();
            
            // Validate that the game is active
            if (game.getStatus() != Game.GameStatus.ACTIVE) {
                sendError(message.getGameId(), message.getPlayerId(), "Game is not active");
                return;
            }

            // Validate that the player is part of this game
            Optional<User> playerOpt = userRepository.findById(Long.parseLong(message.getPlayerId()));
            if (playerOpt.isEmpty()) {
                sendError(message.getGameId(), message.getPlayerId(), "Player not found");
                return;
            }

            User player = playerOpt.get();
            boolean isHost = game.getHost().getId().equals(player.getId());
            boolean isGuest = game.getGuest() != null && game.getGuest().getId().equals(player.getId());

            if (!isHost && !isGuest) {
                sendError(message.getGameId(), message.getPlayerId(), "Player not part of this game");
                return;
            }

            // Determine which player is making the move
            Game.PlayerColor movingColor = isHost ? game.getHostColor() : game.getGuestColor();

            // CRITICAL: Check if the moving player's clock has expired BEFORE accepting the move
            if (clockService.isTimeExpired(game, movingColor)) {
                // Player ran out of time - reject the move and end the game
                Game.PlayerColor winner = (movingColor == Game.PlayerColor.WHITE)
                    ? Game.PlayerColor.BLACK : Game.PlayerColor.WHITE;

                game.endGame(winner + " wins on time");
                gameRepository.save(game);

                // Broadcast timeout message
                GameMessage timeoutMsg = GameMessage.timeoutMessage(
                    message.getGameId(),
                    movingColor.toString(),
                    winner.toString()
                );

                // Include final clock state
                ClockState finalClockState = clockService.buildClockState(game);
                timeoutMsg.setClockState(finalClockState);

                messagingTemplate.convertAndSend("/topic/game/" + message.getGameId(), timeoutMsg);

                System.out.println("⏰ Game " + message.getGameId() + " ended - " + winner + " wins on time!");
                return;
            }

            // Update game state in database
            game.setCurrentFen(message.getFen());
            
            // Add move to history
            List<String> currentMoves = parseJsonArrayToList(game.getMoveHistory());
            currentMoves.add(message.getMove());
            game.setMoveHistory(formatListToJsonArray(currentMoves));

            // Update clock after the move (server-authoritative)
            ClockService.TimeoutResult timeoutResult = clockService.updateClockAfterMove(game, movingColor);

            // Save game with updated clock state
            gameRepository.save(game);

            // Check if timeout occurred AFTER clock update
            if (timeoutResult.isTimeout()) {
                // Player ran out of time during their move
                Game.PlayerColor winner = timeoutResult.getWinner();

                game.endGame(winner + " wins on time");
                gameRepository.save(game);

                // Broadcast timeout message
                GameMessage timeoutMsg = GameMessage.timeoutMessage(
                    message.getGameId(),
                    movingColor.toString(),
                    winner.toString()
                );

                // Include final clock state
                ClockState finalClockState = clockService.buildClockState(game);
                timeoutMsg.setClockState(finalClockState);

                messagingTemplate.convertAndSend("/topic/game/" + message.getGameId(), timeoutMsg);

                System.out.println("⏰ Game " + message.getGameId() + " ended - " + winner + " wins on time!");
                return;
            }

            // Build move message with updated clock state
            GameMessage moveMessage = GameMessage.moveMessage(
                message.getGameId(),
                message.getPlayerId(),
                message.getMove(),
                message.getFen()
            );
            moveMessage.setMoveHistory(currentMoves);

            // Include authoritative clock state in every move broadcast
            ClockState clockState = clockService.buildClockState(game);
            moveMessage.setClockState(clockState);

            System.out.println("🚀 Broadcasting move to /topic/game/" + message.getGameId());
            System.out.println("📤 Move message: " + moveMessage.toString());
            System.out.println("🎯 Player " + message.getPlayerId() + " made move: " + message.getMove());
            System.out.println("⏱️ Clock state: " + clockState.toString());

            messagingTemplate.convertAndSend("/topic/game/" + message.getGameId(), moveMessage);
            
            System.out.println("✅ Move broadcast completed for game " + message.getGameId());

        } catch (Exception e) {
            sendError(message.getGameId(), message.getPlayerId(), "Failed to make move: " + e.getMessage());
        }
    }

    private void sendError(String gameId, String playerId, String errorMessage) {
        GameMessage errorMsg = GameMessage.errorMessage(gameId, errorMessage);
        if (playerId != null) {
            messagingTemplate.convertAndSend("/topic/game/" + gameId + "/" + playerId, errorMsg);
        } else {
            messagingTemplate.convertAndSend("/topic/game/" + gameId, errorMsg);
        }
    }

    private List<String> parseJsonArrayToList(String jsonArray) {
        if (jsonArray == null || jsonArray.equals("[]")) {
            return new java.util.ArrayList<>();
        }
        // Simple JSON array parsing - remove brackets and split by comma
        String cleaned = jsonArray.substring(1, jsonArray.length() - 1);
        if (cleaned.trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // Split by comma and trim quotes
        String[] moves = cleaned.split(",");
        List<String> result = new java.util.ArrayList<>();
        for (String move : moves) {
            result.add(move.trim().replaceAll("\"", ""));
        }
        return result;
    }

    private String formatListToJsonArray(List<String> moves) {
        if (moves.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < moves.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(moves.get(i)).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}