package com.chesscoach.config;

import com.chesscoach.entity.User;
import com.chesscoach.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Profile("prod")
public class ProductionDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProductionDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
            createInitialUsers();
    }

    private void createInitialUsers() {
        // Coach user
        User coach = new User();
        coach.setEmail("coach@chesscoach.com");
        coach.setPassword(passwordEncoder.encode("coach2025"));
        coach.setFirstName("Chess");
        coach.setLastName("Coach");
        coach.setEnabled(true);
        coach.setRating(2200);
        coach.setCreatedAt(LocalDateTime.now());
        coach.setUpdatedAt(LocalDateTime.now());
        userRepository.save(coach);

        // Student user
        User student = new User();
        student.setEmail("student@chesscoach.com");
        student.setPassword(passwordEncoder.encode("student2025"));
        student.setFirstName("Chess");
        student.setLastName("Student");
        student.setEnabled(true);
        student.setRating(1400);
        student.setCreatedAt(LocalDateTime.now());
        student.setUpdatedAt(LocalDateTime.now());
        userRepository.save(student);

        // Demo user
        User demo = new User();
        demo.setEmail("demo@chesscoach.com");
        demo.setPassword(passwordEncoder.encode("demo2025"));
        demo.setFirstName("Demo");
        demo.setLastName("User");
        demo.setEnabled(true);
        demo.setRating(1600);
        demo.setCreatedAt(LocalDateTime.now());
        demo.setUpdatedAt(LocalDateTime.now());
        userRepository.save(demo);

        // Beginner user
        User beginner = new User();
        beginner.setEmail("Aram@chesscoach.com");
        beginner.setPassword(passwordEncoder.encode("aram2025"));
        beginner.setFirstName("Aram");
        beginner.setLastName("Adam");
        beginner.setEnabled(true);
        beginner.setRating(2400);
        beginner.setCreatedAt(LocalDateTime.now());
        beginner.setUpdatedAt(LocalDateTime.now());
        userRepository.save(beginner);

        // Advanced user
        User advanced = new User();
        advanced.setEmail("spinoza@chesscoach.com");
        advanced.setPassword(passwordEncoder.encode("spinoza2025"));
        advanced.setFirstName("Expert");
        advanced.setLastName("Player");
        advanced.setEnabled(true);
        advanced.setRating(1900);
        advanced.setCreatedAt(LocalDateTime.now());
        advanced.setUpdatedAt(LocalDateTime.now());
        userRepository.save(advanced);

        System.out.println("✅ Production users created:");
    }
}