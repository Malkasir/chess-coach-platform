package com.chesscoach.repo;

import com.chesscoach.model.Game;
import org.springframework.stereotype.Repository;

import java.util.concurrent.ConcurrentHashMap;

@Repository
public class GameRepo {
    private final ConcurrentHashMap<String, Game> games = new ConcurrentHashMap<>();

    public Game create() {
        Game g = new Game();
        games.put(g.getId(), g);
        return g;
    }
    public Game get(String id) { return games.get(id); }
}
