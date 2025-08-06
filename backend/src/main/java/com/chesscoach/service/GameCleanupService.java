package com.chesscoach.service;

import com.chesscoach.repository.GameRepository;
import com.chesscoach.entity.Game;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GameCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(GameCleanupService.class);

    @Autowired
    private GameRepository gameRepository;

    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    @Transactional
    public void cleanupStaleGames() {
        try {
            // Clean up games older than 24 hours that are still waiting or abandoned
            LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
            List<Game> staleGames = gameRepository.findStaleGames(cutoff);
            
            if (!staleGames.isEmpty()) {
                logger.info("Found {} stale games to clean up", staleGames.size());
                
                for (Game game : staleGames) {
                    logger.info("Cleaning up stale game: {} (status: {}, last updated: {})", 
                               game.getId(), game.getStatus(), game.getUpdatedAt());
                }
                
                gameRepository.deleteAll(staleGames);
                logger.info("Successfully cleaned up {} stale games", staleGames.size());
            }
        } catch (Exception e) {
            logger.error("Error during game cleanup: ", e);
        }
    }

    @Scheduled(fixedRate = 21600000) // Run every 6 hours (21600000 ms) 
    @Transactional
    public void cleanupCompletedGames() {
        try {
            // Clean up completed games older than 7 days
            LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
            List<Game> completedGames = gameRepository.findCompletedGamesBefore(cutoff);
            
            if (!completedGames.isEmpty()) {
                logger.info("Found {} completed games older than 7 days to archive/cleanup", completedGames.size());
                
                // In production, you might want to archive these instead of deleting
                // For now, we'll delete to prevent memory buildup
                gameRepository.deleteAll(completedGames);
                logger.info("Successfully cleaned up {} old completed games", completedGames.size());
            }
        } catch (Exception e) {
            logger.error("Error during completed game cleanup: ", e);
        }
    }

    @Scheduled(fixedRate = 1800000) // Run every 30 minutes (1800000 ms)
    @Transactional  
    public void cleanupGameMoveHistory() {
        try {
            // Find games with very long move histories (>1000 moves) and truncate them
            List<Game> gamesWithLongHistory = gameRepository.findGamesWithLongMoveHistory();
            
            if (!gamesWithLongHistory.isEmpty()) {
                logger.info("Found {} games with excessive move history", gamesWithLongHistory.size());
                
                for (Game game : gamesWithLongHistory) {
                    // Keep only the last 500 moves to prevent unbounded growth
                    truncateMoveHistory(game, 500);
                }
                
                gameRepository.saveAll(gamesWithLongHistory);
                logger.info("Truncated move history for {} games", gamesWithLongHistory.size());
            }
        } catch (Exception e) {
            logger.error("Error during move history cleanup: ", e);
        }
    }

    private void truncateMoveHistory(Game game, int maxMoves) {
        String moveHistory = game.getMoveHistory();
        if (moveHistory == null || moveHistory.trim().isEmpty()) {
            return;
        }

        try {
            // Simple JSON array parsing - assumes format like ["move1","move2",...]
            if (moveHistory.startsWith("[") && moveHistory.endsWith("]")) {
                String content = moveHistory.substring(1, moveHistory.length() - 1);
                if (content.trim().isEmpty()) {
                    return;
                }
                
                String[] moves = content.split(",");
                if (moves.length > maxMoves) {
                    // Keep only the last maxMoves moves
                    StringBuilder truncated = new StringBuilder("[");
                    int startIndex = moves.length - maxMoves;
                    for (int i = startIndex; i < moves.length; i++) {
                        if (i > startIndex) {
                            truncated.append(",");
                        }
                        truncated.append(moves[i].trim());
                    }
                    truncated.append("]");
                    
                    game.setMoveHistory(truncated.toString());
                    logger.info("Truncated game {} move history from {} to {} moves", 
                               game.getId(), moves.length, maxMoves);
                }
            }
        } catch (Exception e) {
            logger.error("Error truncating move history for game {}: ", game.getId(), e);
        }
    }
}