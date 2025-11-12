package com.chesscoach.security;

import com.chesscoach.entity.User;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Interceptor that extracts JWT token from STOMP CONNECT frames and authenticates the user
 */
@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract Authorization header from STOMP CONNECT frame
            List<String> authHeaders = accessor.getNativeHeader("Authorization");

            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);

                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);

                    try {
                        // Validate token and extract email
                        String email = jwtUtil.extractUsername(token);

                        if (email != null && jwtUtil.validateToken(token)) {
                            // Load user from database
                            Optional<User> userOpt = userRepository.findByEmail(email);

                            if (userOpt.isPresent()) {
                                User user = userOpt.get();

                                // Create authentication token
                                UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                        email,
                                        null,
                                        new ArrayList<>()
                                    );

                                // Set the user as the principal for this WebSocket session
                                accessor.setUser(authentication);

                                System.out.println("✅ WebSocket authenticated: " + email + " (User ID: " + user.getId() + ")");
                            } else {
                                System.out.println("❌ User not found in database: " + email);
                            }
                        } else {
                            System.out.println("❌ Invalid JWT token");
                        }
                    } catch (Exception e) {
                        System.out.println("❌ JWT validation failed: " + e.getMessage());
                    }
                } else {
                    System.out.println("⚠️ Authorization header present but doesn't start with 'Bearer '");
                }
            } else {
                System.out.println("❌ No Authorization header in STOMP CONNECT frame");
            }
        }

        return message;
    }
}
