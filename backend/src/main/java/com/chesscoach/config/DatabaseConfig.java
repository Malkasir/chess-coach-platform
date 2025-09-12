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
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String url = properties.getUrl();
        
        // Add SSL parameters if they're not already present
        if (url != null && url.contains("postgresql") && !url.contains("sslmode")) {
            url += (url.contains("?") ? "&" : "?") + "sslmode=require&ssl=true";
        }
        
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(properties.getUsername());
        config.setPassword(properties.getPassword());
        
        // Additional SSL properties for PostgreSQL
        config.addDataSourceProperty("ssl", "true");
        config.addDataSourceProperty("sslmode", "require");
        
        return new HikariDataSource(config);
    }
}