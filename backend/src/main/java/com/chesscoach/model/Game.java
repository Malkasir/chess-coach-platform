package com.chesscoach.model;

import com.github.bhlangonijr.chesslib.*;
import com.github.bhlangonijr.chesslib.move.Move;
import com.github.bhlangonijr.chesslib.move.MoveGenerator;

import java.util.*;

public class Game {
    private final String id = UUID.randomUUID().toString().substring(0, 8);
    private final Board board = new Board();
    private final List<String> pgn = new ArrayList<>();
    private final Map<Side,String> tokens = Map.of(
            Side.WHITE, UUID.randomUUID().toString(),
            Side.BLACK, UUID.randomUUID().toString());

    public String getId()      { return id; }
    public String fen()        { return board.getFen(); }
    public Side turn()         { return board.getSideToMove(); }
    public String token(Side s){ return tokens.get(s); }
    public List<String> moves(){ return pgn; }

    /** @return null if illegal */
    public Move play(Move m){
        if (!MoveGenerator.generateLegalMoves(board).contains(m)) return null;
        board.doMove(m);
        pgn.add(m.toString());
        return m;
    }
}
