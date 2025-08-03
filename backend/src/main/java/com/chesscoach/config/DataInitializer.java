package com.chesscoach.config;

import com.chesscoach.entity.User;
import com.chesscoach.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Profile("dev") // Only run in development profile
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Only create test users if database is empty
        if (userRepository.count() == 0) {
            createTestUsers();
        }
    }

    private void createTestUsers() {
        String hashedPassword = passwordEncoder.encode("password123");

        // Create test student
        User student = new User();
        student.setEmail("student@test.com");
        student.setPassword(hashedPassword);
        student.setFirstName("Test");
        student.setLastName("Student");
        student.setRole(User.Role.STUDENT);
        student.setEnabled(true);
        student.setRating(1200);
        student.setCreatedAt(LocalDateTime.now());
        student.setUpdatedAt(LocalDateTime.now());
        userRepository.save(student);

        // Create test coach
        User coach = new User();
        coach.setEmail("coach@test.com");
        coach.setPassword(hashedPassword);
        coach.setFirstName("Test");
        coach.setLastName("Coach");
        coach.setRole(User.Role.COACH);
        coach.setEnabled(true);
        coach.setRating(1800);
        coach.setCreatedAt(LocalDateTime.now());
        coach.setUpdatedAt(LocalDateTime.now());
        userRepository.save(coach);

        // Create admin coach
        User admin = new User();
        admin.setEmail("admin@test.com");
        admin.setPassword(hashedPassword);
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setRole(User.Role.COACH);
        admin.setEnabled(true);
        admin.setRating(2000);
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        userRepository.save(admin);

        System.out.println("✅ Development test users created:");
        System.out.println("   📧 student@test.com / password123 (Student)");
        System.out.println("   📧 coach@test.com / password123 (Coach)");
        System.out.println("   📧 admin@test.com / password123 (Admin Coach)");
    }
}