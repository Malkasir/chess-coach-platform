package com.chesscoach.config;

import com.chesscoach.entity.User;
import com.chesscoach.entity.Puzzle;
import com.chesscoach.repository.UserRepository;
import com.chesscoach.repository.PuzzleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PuzzleRepository puzzleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PuzzleRepository puzzleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.puzzleRepository = puzzleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Only create test users if database is empty
        if (userRepository.count() == 0) {
            createTestUsers();
        }
        
        // Only create test puzzles if database is empty
        if (puzzleRepository.count() == 0) {
            createTestPuzzles();
        }
    }

    private void createTestUsers() {
        // Create test user 1
        User user1 = new User();
        user1.setEmail("user1@test.com");
        user1.setPassword(passwordEncoder.encode("SecureP@ssw0rd1"));
        user1.setFirstName("Test");
        user1.setLastName("User1");
        user1.setEnabled(true);
        user1.setRating(1200);
        user1.setCreatedAt(LocalDateTime.now());
        user1.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user1);

        // Create test user 2
        User user2 = new User();
        user2.setEmail("user2@test.com");
        user2.setPassword(passwordEncoder.encode("AnotherS3cureP@ss!"));
        user2.setFirstName("Test");
        user2.setLastName("User2");
        user2.setEnabled(true);
        user2.setRating(1800);
        user2.setCreatedAt(LocalDateTime.now());
        user2.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user2);

        // Create admin user
        User admin = new User();
        admin.setEmail("admin@test.com");
        admin.setPassword(passwordEncoder.encode("AdminP@ssw0rd!23"));
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setEnabled(true);
        admin.setRating(2000);
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        userRepository.save(admin);

        System.out.println("✅ Development test users created with secure passwords.");
        System.out.println("   📧 user1@test.com / SecureP@ssw0rd1");
        System.out.println("   📧 user2@test.com / AnotherS3cureP@ss!");
        System.out.println("   📧 admin@test.com / AdminP@ssw0rd!23");
    }

    private void createTestPuzzles() {
        // Puzzle 1: Basic fork (easy)
        Puzzle puzzle1 = new Puzzle();
        puzzle1.setFen("rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3");
        puzzle1.setSolution("Qh5");
        puzzle1.setDifficulty(1);
        puzzle1.setDescription("White to move. Find the winning move that attacks both the king and knight.");
        puzzle1.setTheme("Fork");
        puzzle1.setSource("Test");
        puzzle1.setMoveCount(1);
        puzzleRepository.save(puzzle1);

        // Puzzle 2: Pin attack (intermediate)
        Puzzle puzzle2 = new Puzzle();
        puzzle2.setFen("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
        puzzle2.setSolution("Bxf7+");
        puzzle2.setDifficulty(3);
        puzzle2.setDescription("White to move. Win material with a powerful pin.");
        puzzle2.setTheme("Pin");
        puzzle2.setSource("Test");
        puzzle2.setMoveCount(1);
        puzzleRepository.save(puzzle2);

        // Puzzle 3: Back rank mate (intermediate)
        Puzzle puzzle3 = new Puzzle();
        puzzle3.setFen("6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1");
        puzzle3.setSolution("Re8#");
        puzzle3.setDifficulty(4);
        puzzle3.setDescription("White to move. Deliver checkmate in one move.");
        puzzle3.setTheme("Checkmate");
        puzzle3.setSource("Test");
        puzzle3.setMoveCount(1);
        puzzleRepository.save(puzzle3);

        // Puzzle 4: Discovered attack (advanced)
        Puzzle puzzle4 = new Puzzle();
        puzzle4.setFen("r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 6 6");
        puzzle4.setSolution("Nd4");
        puzzle4.setDifficulty(6);
        puzzle4.setDescription("White to move. Use a discovered attack to win material.");
        puzzle4.setTheme("Discovered Attack");
        puzzle4.setSource("Test");
        puzzle4.setMoveCount(1);
        puzzleRepository.save(puzzle4);

        // Puzzle 5: Smothered mate (advanced)
        Puzzle puzzle5 = new Puzzle();
        puzzle5.setFen("6rk/6pp/8/8/8/8/5PPP/5RK1 w - - 0 1");
        puzzle5.setSolution("Rf8+ Rxf8 Ne7#");
        puzzle5.setDifficulty(7);
        puzzle5.setDescription("White to move. Execute a beautiful smothered mate in 3 moves.");
        puzzle5.setTheme("Smothered Mate");
        puzzle5.setSource("Test");
        puzzle5.setMoveCount(3);
        puzzleRepository.save(puzzle5);

        // Puzzle 6: Endgame technique (easy)
        Puzzle puzzle6 = new Puzzle();
        puzzle6.setFen("8/8/8/8/8/3K4/3P4/3k4 w - - 0 1");
        puzzle6.setSolution("Kc4");
        puzzle6.setDifficulty(2);
        puzzle6.setDescription("White to move. Win this pawn endgame with proper king play.");
        puzzle6.setTheme("Endgame");
        puzzle6.setSource("Test");
        puzzle6.setMoveCount(1);
        puzzleRepository.save(puzzle6);

        // Puzzle 7: Tactical combination (expert)
        Puzzle puzzle7 = new Puzzle();
        puzzle7.setFen("r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 8");
        puzzle7.setSolution("Nxe5 dxe5 Bxf7+ Kh8 Qd5");
        puzzle7.setDifficulty(8);
        puzzle7.setDescription("White to move. Win material with a complex tactical sequence.");
        puzzle7.setTheme("Combination");
        puzzle7.setSource("Test");
        puzzle7.setMoveCount(5);
        puzzleRepository.save(puzzle7);

        // Puzzle 8: Opening trap (intermediate)
        Puzzle puzzle8 = new Puzzle();
        puzzle8.setFen("rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3");
        puzzle8.setSolution("Ng5");
        puzzle8.setDifficulty(3);
        puzzle8.setDescription("White to move. Exploit Black's weakened kingside.");
        puzzle8.setTheme("Opening");
        puzzle8.setSource("Test");
        puzzle8.setMoveCount(1);
        puzzleRepository.save(puzzle8);

        System.out.println("🧩 Development test puzzles created successfully.");
        System.out.println("   📊 8 puzzles across difficulty levels 1-8");
        System.out.println("   🎯 Themes: Fork, Pin, Checkmate, Discovered Attack, Smothered Mate, Endgame, Combination, Opening");
    }
}