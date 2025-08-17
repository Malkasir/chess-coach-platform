package com.chesscoach.service;

import com.chesscoach.entity.Puzzle;
import com.chesscoach.entity.User;
import com.chesscoach.repository.PuzzleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PuzzleService {

    @Autowired
    private PuzzleRepository puzzleRepository;

    /**
     * Get all puzzles
     */
    public List<Puzzle> getAllPuzzles() {
        return puzzleRepository.findAll();
    }

    /**
     * Get puzzle by ID
     */
    public Optional<Puzzle> getPuzzleById(Long id) {
        return puzzleRepository.findById(id);
    }

    /**
     * Get a random puzzle
     */
    public Optional<Puzzle> getRandomPuzzle() {
        return puzzleRepository.findRandomPuzzle();
    }

    /**
     * Get puzzles by difficulty level
     */
    public List<Puzzle> getPuzzlesByDifficulty(Integer difficulty) {
        return puzzleRepository.findByDifficulty(difficulty);
    }

    /**
     * Get a random puzzle by difficulty
     */
    public Optional<Puzzle> getRandomPuzzleByDifficulty(Integer difficulty) {
        return puzzleRepository.findRandomPuzzleByDifficulty(difficulty);
    }

    /**
     * Get puzzles by theme
     */
    public List<Puzzle> getPuzzlesByTheme(String theme) {
        return puzzleRepository.findByTheme(theme);
    }

    /**
     * Get a random puzzle by theme
     */
    public Optional<Puzzle> getRandomPuzzleByTheme(String theme) {
        return puzzleRepository.findRandomPuzzleByTheme(theme);
    }

    /**
     * Get puzzles within a difficulty range
     */
    public List<Puzzle> getPuzzlesByDifficultyRange(Integer minDifficulty, Integer maxDifficulty) {
        return puzzleRepository.findByDifficultyBetween(minDifficulty, maxDifficulty);
    }

    /**
     * Get puzzles by difficulty and theme
     */
    public List<Puzzle> getPuzzlesByDifficultyAndTheme(Integer difficulty, String theme) {
        return puzzleRepository.findByDifficultyAndTheme(difficulty, theme);
    }

    /**
     * Get puzzles created by a specific user
     */
    public List<Puzzle> getPuzzlesByCreator(User user) {
        return puzzleRepository.findByCreatedBy(user);
    }

    /**
     * Get all available themes
     */
    public List<String> getAllThemes() {
        return puzzleRepository.findAllThemes();
    }

    /**
     * Create a new puzzle
     */
    public Puzzle createPuzzle(Puzzle puzzle) {
        return puzzleRepository.save(puzzle);
    }

    /**
     * Update an existing puzzle
     */
    public Optional<Puzzle> updatePuzzle(Long id, Puzzle updatedPuzzle) {
        return puzzleRepository.findById(id)
                .map(puzzle -> {
                    puzzle.setFen(updatedPuzzle.getFen());
                    puzzle.setSolution(updatedPuzzle.getSolution());
                    puzzle.setDifficulty(updatedPuzzle.getDifficulty());
                    puzzle.setDescription(updatedPuzzle.getDescription());
                    puzzle.setTheme(updatedPuzzle.getTheme());
                    puzzle.setSource(updatedPuzzle.getSource());
                    puzzle.setMoveCount(updatedPuzzle.getMoveCount());
                    return puzzleRepository.save(puzzle);
                });
    }

    /**
     * Delete a puzzle
     */
    public boolean deletePuzzle(Long id) {
        if (puzzleRepository.existsById(id)) {
            puzzleRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Get statistics about puzzles
     */
    public PuzzleStats getPuzzleStats() {
        PuzzleStats stats = new PuzzleStats();
        stats.setTotalPuzzles(puzzleRepository.count());
        
        // Count puzzles by difficulty
        for (int i = 1; i <= 10; i++) {
            long count = puzzleRepository.countByDifficulty(i);
            stats.addDifficultyCount(i, count);
        }
        
        // Count puzzles by theme
        List<String> themes = getAllThemes();
        for (String theme : themes) {
            long count = puzzleRepository.countByTheme(theme);
            stats.addThemeCount(theme, count);
        }
        
        return stats;
    }

    /**
     * Inner class for puzzle statistics
     */
    public static class PuzzleStats {
        private long totalPuzzles;
        private java.util.Map<Integer, Long> difficultyCount = new java.util.HashMap<>();
        private java.util.Map<String, Long> themeCount = new java.util.HashMap<>();

        public long getTotalPuzzles() {
            return totalPuzzles;
        }

        public void setTotalPuzzles(long totalPuzzles) {
            this.totalPuzzles = totalPuzzles;
        }

        public java.util.Map<Integer, Long> getDifficultyCount() {
            return difficultyCount;
        }

        public void addDifficultyCount(Integer difficulty, Long count) {
            this.difficultyCount.put(difficulty, count);
        }

        public java.util.Map<String, Long> getThemeCount() {
            return themeCount;
        }

        public void addThemeCount(String theme, Long count) {
            this.themeCount.put(theme, count);
        }
    }
}