package com.chesscoach.controller;

import com.chesscoach.entity.User;
import com.chesscoach.repository.UserRepository;
import com.chesscoach.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Remove AuthenticationManager for now since we have circular dependency
    public AuthController(UserRepository userRepository, 
                         PasswordEncoder passwordEncoder, 
                         JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // Check if user already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already registered"));
            }

            // Create new user
            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEnabled(true);

            User savedUser = userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(savedUser);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("token", token);
            response.put("user", Map.of(
                "id", savedUser.getId(),
                "email", savedUser.getEmail(),
                "firstName", savedUser.getFirstName(),
                "lastName", savedUser.getLastName()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // Log the actual error for debugging but don't expose it
            System.err.println("Registration error: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            // Find user by email
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid email or password"));
            }

            User user = userOpt.get();

            // Check password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid email or password"));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // Log the actual error for debugging but don't expose it
            System.err.println("Login error: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Login failed. Please check your credentials."));
        }
    }

    @GetMapping("/test-db")
    public ResponseEntity<?> testDatabase() {
        try {
            long userCount = userRepository.count();

            // Auto-detect database type from URL
            String dbUrl = System.getProperty("spring.datasource.url", "H2 In-Memory");
            String databaseType;
            if (dbUrl.contains("postgresql")) {
                databaseType = "Neon PostgreSQL";
            } else if (dbUrl.contains("h2:mem")) {
                databaseType = "H2 In-Memory (Development)";
            } else {
                databaseType = "Unknown Database";
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Database connection successful!");
            response.put("totalUsers", userCount);
            response.put("database", databaseType);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // Log the actual error for debugging but don't expose it
            System.err.println("Database test error: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Database connection test failed"));
        }
    }

    // Request DTOs
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;
        
        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;
        
        @NotBlank(message = "First name is required")
        @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
        private String firstName;
        
        @NotBlank(message = "Last name is required")
        @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
        private String lastName;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
    }

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;
        
        @NotBlank(message = "Password is required")
        private String password;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}