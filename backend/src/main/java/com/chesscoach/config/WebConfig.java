package com.chesscoach.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class WebConfig {
    // CORS configuration moved to SecurityConfig to avoid conflicts
    // SecurityConfig handles CORS properly with specific allowed origins
}