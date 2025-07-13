package com.chesscoach.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker                     // <-- enables STOMP
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry r) {
        r.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173") // dev front-end
                .withSockJS();                              // fallback if WS blocked
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry r) {
        r.enableSimpleBroker("/topic", "/queue");    // in-memory broker
        r.setApplicationDestinationPrefixes("/app"); // client → server
    }
}
