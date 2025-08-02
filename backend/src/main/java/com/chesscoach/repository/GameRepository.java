package com.chesscoach.repository;

import com.chesscoach.model.ChessGame;
import java.util.Optional;
import java.util.List;

public interface GameRepository {
    ChessGame save(ChessGame game);
    Optional<ChessGame> findById(String gameId);
    List<ChessGame> findByCoachId(String coachId);
    List<ChessGame> findByStudentId(String studentId);
    void deleteById(String gameId);
    List<ChessGame> findAll();
}