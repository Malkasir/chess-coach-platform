package com.chesscoach.controller;

import com.chesscoach.dto.GameMessage;
import com.chesscoach.model.ChessGame;
import com.chesscoach.repository.GameRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
public class GameWebSocketController {

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/game/join")
    public void joinGame(@Payload GameMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String gameId = message.getGameId();
        String playerId = message.getPlayerId();

        Optional<ChessGame> gameOpt = gameRepository.findById(gameId);
        if (gameOpt.isEmpty()) {
            sendErrorToPlayer(gameId, playerId, "Game not found");
            return;
        }

        ChessGame game = gameOpt.get();
        
        // Store player info in session
        headerAccessor.getSessionAttributes().put("gameId", gameId);
        headerAccessor.getSessionAttributes().put("playerId", playerId);

        // If it's a student joining
        if (!playerId.equals(game.getCoachId()) && game.getStudentId() == null) {
            game.joinStudent(playerId);
            gameRepository.save(game);
            
            // Notify both players
            broadcastToGame(gameId, GameMessage.joinMessage(gameId, playerId));
            broadcastToGame(gameId, GameMessage.gameStateMessage(gameId, game.getFen()));
        } else {
            // Just send current game state
            sendToPlayer(gameId, playerId, GameMessage.gameStateMessage(gameId, game.getFen()));
        }
    }

    @MessageMapping("/game/move")
    public void makeMove(@Payload GameMessage message) {
        String gameId = message.getGameId();
        String playerId = message.getPlayerId();
        String move = message.getMove();
        String fen = message.getFen();

        System.out.println("📥 Received move: " + move + " from player: " + playerId + " in game: " + gameId);

        Optional<ChessGame> gameOpt = gameRepository.findById(gameId);
        if (gameOpt.isEmpty()) {
            System.out.println("❌ Game not found: " + gameId);
            sendErrorToPlayer(gameId, playerId, "Game not found");
            return;
        }

        ChessGame game = gameOpt.get();
        
        if (game.makeMove(move, playerId, fen)) {
            gameRepository.save(game);
            
            // Broadcast move to all players in the game
            GameMessage moveMsg = GameMessage.moveMessage(gameId, playerId, move, game.getFen());
            System.out.println("📤 Broadcasting move to /topic/game/" + gameId + " - Move: " + move);
            broadcastToGame(gameId, moveMsg);
        } else {
            System.out.println("❌ Invalid move: " + move + " from player: " + playerId);
            sendErrorToPlayer(gameId, playerId, "Invalid move");
        }
    }

    private void broadcastToGame(String gameId, GameMessage message) {
        messagingTemplate.convertAndSend("/topic/game/" + gameId, message);
    }

    private void sendToPlayer(String gameId, String playerId, GameMessage message) {
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/" + playerId, message);
    }

    private void sendErrorToPlayer(String gameId, String playerId, String errorMessage) {
        GameMessage error = GameMessage.errorMessage(gameId, errorMessage);
        sendToPlayer(gameId, playerId, error);
    }
}