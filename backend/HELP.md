# Chess Coach Platform Backend - Development Guide

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+

### Running the Application

1. **Development Mode**:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend will start on `http://localhost:8080`

2. **Build for Production**:
   ```bash
   ./mvnw clean package
   java -jar target/backend-0.0.1-SNAPSHOT.jar
   ```

3. **Run Tests**:
   ```bash
   ./mvnw test
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Games
- `POST /api/games/create` - Create a new game
- `POST /api/games/join-by-code` - Join game by room code
- `GET /api/games/{gameId}` - Get game details

### Game Invitations
- `POST /api/invitations/send` - Send game invitation
- `POST /api/invitations/{invitationId}/accept` - Accept invitation
- `GET /api/invitations/pending` - Get pending invitations

### User Presence
- `GET /api/presence/online` - Get online users
- `POST /api/presence/heartbeat` - Update user presence

### WebSocket
- Connect to `/chess-websocket` for real-time game updates
- Subscribe to `/topic/game/{gameId}` for game-specific events

## Configuration

### Database
- **Development**: H2 in-memory database
- **Production**: Configure PostgreSQL in `application-prod.yml`

### CORS
Configured to allow frontend connections from:
- `http://localhost:3000` (Vite dev server)
- `http://localhost:8080` (local network)
- Production domains

## Troubleshooting

### Common Issues
1. **Port 8080 already in use**: Kill other processes or change port in `application.yml`
2. **Database connection issues**: Check database configuration in application properties
3. **CORS errors**: Verify allowed origins in `WebConfig.java`
4. **WebSocket connection fails**: Ensure SockJS and STOMP are properly configured

### Logging
- Application logs are written to console and `backend.log`
- Change log level in `application.yml` under `logging.level`

## Technology Stack
- **Spring Boot 3.5.3** with Java 17
- **Spring Security** with JWT authentication
- **Spring WebSocket** with STOMP messaging
- **JPA/Hibernate** for data persistence
- **H2/PostgreSQL** database support
- **Maven** for dependency management

