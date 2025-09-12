package com.chesscoach.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl == null) {
            throw new IllegalStateException("DATABASE_URL environment variable is not set");
        }
        
        System.out.println("Original DATABASE_URL: " + databaseUrl);
        
        // Replace sslmode=disable with sslmode=require if present
        if (databaseUrl.contains("sslmode=disable")) {
            databaseUrl = databaseUrl.replace("sslmode=disable", "sslmode=require");
        } else if (databaseUrl.contains("postgresql") && !databaseUrl.contains("sslmode")) {
            // Add SSL parameters if they're not already present
            databaseUrl += (databaseUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }
        
        System.out.println("Modified DATABASE_URL: " + databaseUrl);
        
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(databaseUrl);
        
        // Set connection timeout and other properties
        config.setConnectionTimeout(20000);
        config.setMaximumPoolSize(5);
        
        return new HikariDataSource(config);
    }
}