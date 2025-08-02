package com.chesscoach.repository;

import com.chesscoach.model.ChessGame;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryGameRepository implements GameRepository {
    private final Map<String, ChessGame> games = new ConcurrentHashMap<>();

    @Override
    public ChessGame save(ChessGame game) {
        games.put(game.getGameId(), game);
        return game;
    }

    @Override
    public Optional<ChessGame> findById(String gameId) {
        return Optional.ofNullable(games.get(gameId));
    }

    @Override
    public List<ChessGame> findByCoachId(String coachId) {
        return games.values().stream()
                .filter(game -> coachId.equals(game.getCoachId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChessGame> findByStudentId(String studentId) {
        return games.values().stream()
                .filter(game -> studentId.equals(game.getStudentId()))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String gameId) {
        games.remove(gameId);
    }

    @Override
    public List<ChessGame> findAll() {
        return new ArrayList<>(games.values());
    }
}