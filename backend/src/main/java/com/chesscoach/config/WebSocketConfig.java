package com.chesscoach.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import com.chesscoach.security.WebSocketAuthChannelInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    // Track active sessions and their game associations
    private final ConcurrentMap<String, String> sessionToGameMap = new ConcurrentHashMap<>();

    @Autowired
    public WebSocketConfig(@Lazy SimpMessagingTemplate messagingTemplate,
                          WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor) {
        this.messagingTemplate = messagingTemplate;
        this.webSocketAuthChannelInterceptor = webSocketAuthChannelInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for topics and user-specific destinations
        config.enableSimpleBroker("/topic", "/user");
        // Set prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");
        // Set user destination prefix for user-specific messaging
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint
        registry.addEndpoint("/chess-websocket")
                .setAllowedOriginPatterns("*") // Allow all origins
                .withSockJS(); // Enable SockJS fallback
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        String sessionId = event.getMessage().getHeaders().get("simpSessionId").toString();
        logger.info("WebSocket session connected: {}", sessionId);
        System.out.println("🔌 WebSocket connected - Session: " + sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        logger.info("WebSocket session disconnected: {}", sessionId);
        System.out.println("❌ WebSocket disconnected - Session: " + sessionId);
        
        // Clean up game association for this session
        String gameId = sessionToGameMap.remove(sessionId);
        if (gameId != null) {
            logger.info("Cleaning up session {} from game {}", sessionId, gameId);
            System.out.println("🧹 Cleaning up session " + sessionId + " from game " + gameId);
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
