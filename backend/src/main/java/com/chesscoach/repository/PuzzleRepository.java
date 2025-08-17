package com.chesscoach.repository;

import com.chesscoach.entity.Puzzle;
import com.chesscoach.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PuzzleRepository extends JpaRepository<Puzzle, Long> {
    
    /**
     * Find puzzles by difficulty level
     */
    List<Puzzle> findByDifficulty(Integer difficulty);
    
    /**
     * Find puzzles by theme
     */
    List<Puzzle> findByTheme(String theme);
    
    /**
     * Find puzzles by difficulty and theme
     */
    List<Puzzle> findByDifficultyAndTheme(Integer difficulty, String theme);
    
    /**
     * Get a random puzzle
     */
    @Query(value = "SELECT * FROM puzzles ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Puzzle> findRandomPuzzle();
    
    /**
     * Get a random puzzle by difficulty
     */
    @Query(value = "SELECT * FROM puzzles WHERE difficulty = :difficulty ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Puzzle> findRandomPuzzleByDifficulty(@Param("difficulty") Integer difficulty);
    
    /**
     * Get a random puzzle by theme
     */
    @Query(value = "SELECT * FROM puzzles WHERE theme = :theme ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Puzzle> findRandomPuzzleByTheme(@Param("theme") String theme);
    
    /**
     * Get puzzles within a difficulty range
     */
    List<Puzzle> findByDifficultyBetween(Integer minDifficulty, Integer maxDifficulty);
    
    /**
     * Get all unique themes
     */
    @Query("SELECT DISTINCT p.theme FROM Puzzle p WHERE p.theme IS NOT NULL ORDER BY p.theme")
    List<String> findAllThemes();
    
    /**
     * Count puzzles by difficulty
     */
    long countByDifficulty(Integer difficulty);
    
    /**
     * Count puzzles by theme
     */
    long countByTheme(String theme);
    
    /**
     * Find puzzles created by a specific user
     */
    List<Puzzle> findByCreatedBy(User createdBy);
    
    /**
     * Find puzzles created by a specific user ordered by creation date
     */
    List<Puzzle> findByCreatedByOrderByCreatedAtDesc(User createdBy);
}