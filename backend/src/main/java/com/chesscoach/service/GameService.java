package com.chesscoach.service;

import com.chesscoach.entity.Game;
import com.chesscoach.entity.User;
import com.chesscoach.repository.GameRepository;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

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
        game.setCoach(coach);
        game.setStatus(Game.GameStatus.WAITING_FOR_STUDENT);
        game.setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        game.setCoachColor(Game.PlayerColor.WHITE);

        Game savedGame = gameRepository.save(game);

        return Map.of(
                "gameId", savedGame.getGameId(),
                "coachColor", savedGame.getCoachColor().toString()
        );
    }
}
