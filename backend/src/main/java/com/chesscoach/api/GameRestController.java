package com.chesscoach.api;

import com.chesscoach.model.Game;
import com.chesscoach.repo.GameRepo;
import org.springframework.web.bind.annotation.*;

record GameDTO(String id, String fen, String whiteToken, String blackToken) {}

@RestController
@RequestMapping("/games")
public class GameRestController {

    private final GameRepo repo;

    public GameRestController(GameRepo repo) { this.repo = repo; }

    @PostMapping
    public GameDTO create() {
        Game g = repo.create();
        return toDto(g);
    }

    @GetMapping("/{id}")
    public GameDTO fetch(@PathVariable String id) {
        return toDto(repo.get(id));
    }

    private static GameDTO toDto(Game g) {
        return new GameDTO(g.getId(), g.fen(),
                g.token(com.github.bhlangonijr.chesslib.Side.WHITE),
                g.token(com.github.bhlangonijr.chesslib.Side.BLACK));
    }
}
