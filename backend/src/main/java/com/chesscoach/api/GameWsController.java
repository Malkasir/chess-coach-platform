package com.chesscoach.api;

import com.chesscoach.model.Game;
import com.chesscoach.repo.GameRepo;
import com.github.bhlangonijr.chesslib.*;
import com.github.bhlangonijr.chesslib.move.Move;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

record ClientMove(String from, String to, String token){}
record ServerMove(String fen, String san, String turn){}

@Controller
public class GameWsController {

    private final GameRepo repo;
    private final SimpMessagingTemplate broker;

    public GameWsController(GameRepo repo, SimpMessagingTemplate broker) {
        this.repo = repo;
        this.broker = broker;
    }

    @MessageMapping("/game.{id}.move")
    public void onMove(@DestinationVariable String id,
                       ClientMove msg) {

        Game g = repo.get(id);
        if (g == null) return;

        // token must match side to move
        Side side = g.turn();
        if (!g.token(side).equals(msg.token())) return;

        Move mv = new Move(Square.valueOf(msg.from().toUpperCase()),
                           Square.valueOf(msg.to().toUpperCase()));

        if (g.play(mv) == null) return; // illegal

        broker.convertAndSend("/topic/game." + id,
                new ServerMove(g.fen(), mv.toString(), g.turn().name()));
    }
}
