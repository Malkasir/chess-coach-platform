package com.chesscoach.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    // Track active sessions and their game associations
    private final ConcurrentMap<String, String> sessionToGameMap = new ConcurrentHashMap<>();

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for topics
        config.enableSimpleBroker("/topic");
        // Set prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint
        registry.addEndpoint("/chess-websocket")
                .setAllowedOriginPatterns("*") // Allow all origins
                .withSockJS(); // Enable SockJS fallback
    }
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        String sessionId = event.getMessage().getHeaders().get("simpSessionId").toString();
        logger.info("WebSocket session connected: {}", sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        logger.info("WebSocket session disconnected: {}", sessionId);
        
        // Clean up game association for this session
        String gameId = sessionToGameMap.remove(sessionId);
        if (gameId != null) {
            logger.info("Cleaning up session {} from game {}", sessionId, gameId);
            // Notify other players in the game about disconnection
            messagingTemplate.convertAndSend("/topic/game/" + gameId, 
                new GameDisconnectMessage("Player disconnected"));
        }
    }
    
    public void associateSessionWithGame(String sessionId, String gameId) {
        sessionToGameMap.put(sessionId, gameId);
    }
    
    public void removeSessionFromGame(String sessionId) {
        sessionToGameMap.remove(sessionId);
    }
    
    // Message class for disconnect notifications
    public static class GameDisconnectMessage {
        private String message;
        private String type = "disconnect";
        
        public GameDisconnectMessage(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
        public String getType() { return type; }
    }
}