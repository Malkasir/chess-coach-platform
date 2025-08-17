package com.chesscoach.controller;

import com.chesscoach.entity.Puzzle;
import com.chesscoach.entity.User;
import com.chesscoach.service.PuzzleService;
import com.chesscoach.service.UserService;
import com.chesscoach.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/puzzles")
@CrossOrigin(origins = "*")
public class PuzzleController {

    private final PuzzleService puzzleService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public PuzzleController(PuzzleService puzzleService, UserService userService, JwtUtil jwtUtil) {
        this.puzzleService = puzzleService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Get all puzzles
     */
    @GetMapping
    public ResponseEntity<List<Puzzle>> getAllPuzzles() {
        List<Puzzle> puzzles = puzzleService.getAllPuzzles();
        return ResponseEntity.ok(puzzles);
    }

    /**
     * Get puzzle by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPuzzleById(@PathVariable Long id) {
        Optional<Puzzle> puzzle = puzzleService.getPuzzleById(id);
        if (puzzle.isPresent()) {
            return ResponseEntity.ok(puzzle.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get a random puzzle
     */
    @GetMapping("/random")
    public ResponseEntity<?> getRandomPuzzle() {
        Optional<Puzzle> puzzle = puzzleService.getRandomPuzzle();
        if (puzzle.isPresent()) {
            return ResponseEntity.ok(puzzle.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get puzzles by difficulty level
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<List<Puzzle>> getPuzzlesByDifficulty(@PathVariable Integer level) {
        List<Puzzle> puzzles = puzzleService.getPuzzlesByDifficulty(level);
        return ResponseEntity.ok(puzzles);
    }

    /**
     * Get a random puzzle by difficulty
     */
    @GetMapping("/difficulty/{level}/random")
    public ResponseEntity<?> getRandomPuzzleByDifficulty(@PathVariable Integer level) {
        Optional<Puzzle> puzzle = puzzleService.getRandomPuzzleByDifficulty(level);
        if (puzzle.isPresent()) {
            return ResponseEntity.ok(puzzle.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get puzzles by theme
     */
    @GetMapping("/theme/{theme}")
    public ResponseEntity<List<Puzzle>> getPuzzlesByTheme(@PathVariable String theme) {
        List<Puzzle> puzzles = puzzleService.getPuzzlesByTheme(theme);
        return ResponseEntity.ok(puzzles);
    }

    /**
     * Get a random puzzle by theme
     */
    @GetMapping("/theme/{theme}/random")
    public ResponseEntity<?> getRandomPuzzleByTheme(@PathVariable String theme) {
        Optional<Puzzle> puzzle = puzzleService.getRandomPuzzleByTheme(theme);
        if (puzzle.isPresent()) {
            return ResponseEntity.ok(puzzle.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get puzzles within a difficulty range
     */
    @GetMapping("/difficulty-range")
    public ResponseEntity<List<Puzzle>> getPuzzlesByDifficultyRange(
            @RequestParam Integer min,
            @RequestParam Integer max) {
        List<Puzzle> puzzles = puzzleService.getPuzzlesByDifficultyRange(min, max);
        return ResponseEntity.ok(puzzles);
    }

    /**
     * Get all available themes
     */
    @GetMapping("/themes")
    public ResponseEntity<List<String>> getAllThemes() {
        List<String> themes = puzzleService.getAllThemes();
        return ResponseEntity.ok(themes);
    }

    /**
     * Get puzzle statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<PuzzleService.PuzzleStats> getPuzzleStats() {
        PuzzleService.PuzzleStats stats = puzzleService.getPuzzleStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Create a new puzzle (requires authentication)
     */
    @PostMapping
    public ResponseEntity<?> createPuzzle(@RequestBody CreatePuzzleRequest request, HttpServletRequest httpRequest) {
        try {
            // Extract user from JWT token
            User user = extractUserFromRequest(httpRequest);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            Puzzle puzzle = new Puzzle();
            puzzle.setFen(request.getFen());
            puzzle.setSolution(request.getSolution());
            puzzle.setDifficulty(request.getDifficulty());
            puzzle.setDescription(request.getDescription());
            puzzle.setTheme(request.getTheme());
            puzzle.setSource(user.getFirstName() + " " + user.getLastName()); // Set source to user's name
            puzzle.setMoveCount(request.getMoveCount());
            puzzle.setCreatedBy(user);

            Puzzle savedPuzzle = puzzleService.createPuzzle(puzzle);
            return ResponseEntity.ok(savedPuzzle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update an existing puzzle
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePuzzle(@PathVariable Long id, @RequestBody CreatePuzzleRequest request) {
        try {
            Puzzle updatedPuzzle = new Puzzle();
            updatedPuzzle.setFen(request.getFen());
            updatedPuzzle.setSolution(request.getSolution());
            updatedPuzzle.setDifficulty(request.getDifficulty());
            updatedPuzzle.setDescription(request.getDescription());
            updatedPuzzle.setTheme(request.getTheme());
            updatedPuzzle.setSource(request.getSource());
            updatedPuzzle.setMoveCount(request.getMoveCount());

            Optional<Puzzle> result = puzzleService.updatePuzzle(id, updatedPuzzle);
            if (result.isPresent()) {
                return ResponseEntity.ok(result.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a puzzle
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePuzzle(@PathVariable Long id) {
        boolean deleted = puzzleService.deletePuzzle(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Puzzle deleted successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Search puzzles by multiple criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<Puzzle>> searchPuzzles(
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) String theme) {
        
        List<Puzzle> puzzles;
        if (difficulty != null && theme != null) {
            puzzles = puzzleService.getPuzzlesByDifficultyAndTheme(difficulty, theme);
        } else if (difficulty != null) {
            puzzles = puzzleService.getPuzzlesByDifficulty(difficulty);
        } else if (theme != null) {
            puzzles = puzzleService.getPuzzlesByTheme(theme);
        } else {
            puzzles = puzzleService.getAllPuzzles();
        }
        
        return ResponseEntity.ok(puzzles);
    }

    /**
     * Get puzzles created by the current user
     */
    @GetMapping("/my-puzzles")
    public ResponseEntity<?> getMyPuzzles(HttpServletRequest httpRequest) {
        User user = extractUserFromRequest(httpRequest);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        List<Puzzle> userPuzzles = puzzleService.getPuzzlesByCreator(user);
        return ResponseEntity.ok(userPuzzles);
    }

    /**
     * Get puzzles created by a specific user
     */
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<Puzzle>> getPuzzlesByUser(@PathVariable Long userId) {
        Optional<User> user = userService.findById(userId);
        if (user.isPresent()) {
            List<Puzzle> userPuzzles = puzzleService.getPuzzlesByCreator(user.get());
            return ResponseEntity.ok(userPuzzles);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Helper method to extract user from JWT token
     */
    private User extractUserFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String email = jwtUtil.extractUsername(token);
                if (email != null && jwtUtil.validateToken(token)) {
                    Optional<User> user = userService.findByEmail(email);
                    return user.orElse(null);
                }
            } catch (Exception e) {
                // Token is invalid
                return null;
            }
        }
        return null;
    }

    /**
     * DTO for creating/updating puzzles
     */
    public static class CreatePuzzleRequest {
        private String fen;
        private String solution;
        private Integer difficulty;
        private String description;
        private String theme;
        private String source;
        private Integer moveCount;

        // Getters and setters
        public String getFen() { return fen; }
        public void setFen(String fen) { this.fen = fen; }

        public String getSolution() { return solution; }
        public void setSolution(String solution) { this.solution = solution; }

        public Integer getDifficulty() { return difficulty; }
        public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getTheme() { return theme; }
        public void setTheme(String theme) { this.theme = theme; }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public Integer getMoveCount() { return moveCount; }
        public void setMoveCount(Integer moveCount) { this.moveCount = moveCount; }
    }
}