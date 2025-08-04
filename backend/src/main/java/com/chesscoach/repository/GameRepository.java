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
    
    Optional<Game> findByRoomCode(String roomCode);
    
    List<Game> findByHost(User host);
    
    List<Game> findByGuest(User guest);
    
    @Query("SELECT g FROM Game g WHERE g.host = :user OR g.guest = :user")
    List<Game> findByHostOrGuest(User user);
    
    List<Game> findByStatus(Game.GameStatus status);
    
    @Query("SELECT g FROM Game g WHERE g.host = :host AND g.status = :status")
    List<Game> findByHostAndStatus(User host, Game.GameStatus status);
    
    @Query("SELECT g FROM Game g WHERE g.guest = :guest AND g.status = :status")
    List<Game> findByGuestAndStatus(User guest, Game.GameStatus status);
    
    @Query("SELECT g FROM Game g WHERE g.createdAt >= :fromDate ORDER BY g.createdAt DESC")
    List<Game> findRecentGames(LocalDateTime fromDate);
    
    @Query("SELECT COUNT(g) FROM Game g WHERE g.host = :host AND g.status = 'ENDED'")
    long countCompletedGamesByHost(User host);
    
    @Query("SELECT COUNT(g) FROM Game g WHERE g.guest = :guest AND g.status = 'ENDED'")
    long countCompletedGamesByGuest(User guest);
    
    // Find active games that haven't been updated in a while (for cleanup)
    @Query("SELECT g FROM Game g WHERE g.status IN ('ACTIVE', 'WAITING_FOR_GUEST') AND g.updatedAt < :cutoffTime")
    List<Game> findStaleGames(LocalDateTime cutoffTime);
}