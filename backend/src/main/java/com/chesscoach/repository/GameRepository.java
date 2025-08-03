package com.chesscoach.repository;

import com.chesscoach.entity.Game;
import com.chesscoach.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    
    Optional<Game> findByGameId(String gameId);
    
    List<Game> findByCoach(User coach);
    
    List<Game> findByStudent(User student);
    
    @Query("SELECT g FROM Game g WHERE g.coach = :user OR g.student = :user")
    List<Game> findByCoachOrStudent(User user);
    
    List<Game> findByStatus(Game.GameStatus status);
    
    @Query("SELECT g FROM Game g WHERE g.coach = :coach AND g.status = :status")
    List<Game> findByCoachAndStatus(User coach, Game.GameStatus status);
    
    @Query("SELECT g FROM Game g WHERE g.student = :student AND g.status = :status")
    List<Game> findByStudentAndStatus(User student, Game.GameStatus status);
    
    @Query("SELECT g FROM Game g WHERE g.createdAt >= :fromDate ORDER BY g.createdAt DESC")
    List<Game> findRecentGames(LocalDateTime fromDate);
    
    @Query("SELECT COUNT(g) FROM Game g WHERE g.coach = :coach AND g.status = 'ENDED'")
    long countCompletedGamesByCoach(User coach);
    
    @Query("SELECT COUNT(g) FROM Game g WHERE g.student = :student AND g.status = 'ENDED'")
    long countCompletedGamesByStudent(User student);
    
    // Find active games that haven't been updated in a while (for cleanup)
    @Query("SELECT g FROM Game g WHERE g.status IN ('ACTIVE', 'WAITING_FOR_STUDENT') AND g.updatedAt < :cutoffTime")
    List<Game> findStaleGames(LocalDateTime cutoffTime);
}