package com.chesscoach.config;

import com.chesscoach.entity.User;
import com.chesscoach.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
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
}