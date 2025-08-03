package com.chesscoach.controller;

import com.chesscoach.dto.GameMessage;
import com.chesscoach.entity.Game;
import com.chesscoach.entity.User;
import com.chesscoach.repository.GameRepository;
import com.chesscoach.repository.UserRepository;
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

    @Autowired
    public GameWebSocketController(SimpMessagingTemplate messagingTemplate, 
                                   GameRepository gameRepository, 
                                   UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/game/join")
    public void handleJoinGame(@Payload GameMessage message) {
        try {
            Optional<Game> gameOpt = gameRepository.findByGameId(message.getGameId());
            if (gameOpt.isEmpty()) {
                sendError(message.getGameId(), message.getPlayerId(), "Game not found");
                return;
            }

            Game game = gameOpt.get();
            
            // Send player joined message to all players in the game
            GameMessage joinMessage = GameMessage.joinMessage(message.getGameId(), message.getPlayerId());
            messagingTemplate.convertAndSend("/topic/game/" + message.getGameId(), joinMessage);

            // Send current game state to the joining player
            List<String> moveHistory = parseJsonArrayToList(game.getMoveHistory());
            GameMessage stateMessage = GameMessage.gameStateMessage(
                message.getGameId(), 
                game.getCurrentFen(), 
                moveHistory
            );
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
            boolean isCoach = game.getCoach().getId().equals(player.getId());
            boolean isStudent = game.getStudent() != null && game.getStudent().getId().equals(player.getId());

            if (!isCoach && !isStudent) {
                sendError(message.getGameId(), message.getPlayerId(), "Player not part of this game");
                return;
            }

            // Update game state in database
            game.setCurrentFen(message.getFen());
            
            // Add move to history
            List<String> currentMoves = parseJsonArrayToList(game.getMoveHistory());
            currentMoves.add(message.getMove());
            game.setMoveHistory(formatListToJsonArray(currentMoves));
            
            gameRepository.save(game);

            // Broadcast move to all players in the game
            GameMessage moveMessage = GameMessage.moveMessage(
                message.getGameId(), 
                message.getPlayerId(), 
                message.getMove(), 
                message.getFen()
            );
            moveMessage.setMoveHistory(currentMoves);
            
            messagingTemplate.convertAndSend("/topic/game/" + message.getGameId(), moveMessage);

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