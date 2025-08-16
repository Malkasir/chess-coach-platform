package com.chesscoach.config;

import com.chesscoach.entity.User;
import com.chesscoach.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Profile({"prod", "default"})
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
        if (!userRepository.existsByEmail("coach@chesscoach.com")) {
            User coach = new User();
            coach.setEmail("coach@chesscoach.com");
            coach.setPassword(passwordEncoder.encode("coach2025"));
            coach.setFirstName("Chess");
            coach.setLastName("Coach");
            coach.setEnabled(true);
            coach.setRating(2200);
            coach.setRole("COACH");
            coach.setCreatedAt(LocalDateTime.now());
            coach.setUpdatedAt(LocalDateTime.now());
            userRepository.save(coach);
            System.out.println("✅ Created coach@chesscoach.com");
        }

        // Student user
        if (!userRepository.existsByEmail("student@chesscoach.com")) {
            User student = new User();
            student.setEmail("student@chesscoach.com");
            student.setPassword(passwordEncoder.encode("student2025"));
            student.setFirstName("Chess");
            student.setLastName("Student");
            student.setEnabled(true);
            student.setRating(1400);
            student.setRole("USER");
            student.setCreatedAt(LocalDateTime.now());
            student.setUpdatedAt(LocalDateTime.now());
            userRepository.save(student);
            System.out.println("✅ Created student@chesscoach.com");
        }

        // Demo user
        if (!userRepository.existsByEmail("demo@chesscoach.com")) {
            User demo = new User();
            demo.setEmail("demo@chesscoach.com");
            demo.setPassword(passwordEncoder.encode("demo2025"));
            demo.setFirstName("Demo");
            demo.setLastName("User");
            demo.setEnabled(true);
            demo.setRating(1600);
            demo.setRole("USER");
            demo.setCreatedAt(LocalDateTime.now());
            demo.setUpdatedAt(LocalDateTime.now());
            userRepository.save(demo);
            System.out.println("✅ Created demo@chesscoach.com");
        }

        // Aram user
        if (!userRepository.existsByEmail("Aram@chesscoach.com")) {
            User aram = new User();
            aram.setEmail("Aram@chesscoach.com");
            aram.setPassword(passwordEncoder.encode("aram2025"));
            aram.setFirstName("Aram");
            aram.setLastName("Adam");
            aram.setEnabled(true);
            aram.setRating(2400);
            aram.setRole("USER");
            aram.setCreatedAt(LocalDateTime.now());
            aram.setUpdatedAt(LocalDateTime.now());
            userRepository.save(aram);
            System.out.println("✅ Created Aram@chesscoach.com");
        }

        // Spinoza user
        if (!userRepository.existsByEmail("Spinoza@chesscoach.com")) {
            User spinoza = new User();
            spinoza.setEmail("Spinoza@chesscoach.com");
            spinoza.setPassword(passwordEncoder.encode("spinoza2025"));
            spinoza.setFirstName("Spinoza");
            spinoza.setLastName("Gambit");
            spinoza.setEnabled(true);
            spinoza.setRating(1900);
            spinoza.setRole("USER");
            spinoza.setCreatedAt(LocalDateTime.now());
            spinoza.setUpdatedAt(LocalDateTime.now());
            userRepository.save(spinoza);
            System.out.println("✅ Created Spinoza@chesscoach.com");
        }

        System.out.println("🎯 Production user initialization complete");
    }
}