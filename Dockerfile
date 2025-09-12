# Multi-stage build for smaller final image
FROM eclipse-temurin:17-jdk-alpine AS builder

# Set working directory to /app
WORKDIR /app

# Copy the entire backend directory
COPY backend/ .

# Grant execute permission to the maven wrapper
RUN chmod +x ./mvnw

# Build the application
RUN ./mvnw clean package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
