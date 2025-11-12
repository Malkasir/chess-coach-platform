package com.chesscoach.service;

import com.chesscoach.entity.TrainingSession;
import com.chesscoach.entity.User;
import com.chesscoach.repository.TrainingSessionRepository;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class TrainingSessionService {

    private final TrainingSessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Autowired
    public TrainingSessionService(TrainingSessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new training session
     * @param coach The authenticated coach user
     * @param initialFen Optional starting position (defaults to starting position)
     * @return Session state map
     */
    public Map<String, Object> createSession(User coach, String initialFen) {
        String sessionId = UUID.randomUUID().toString();
        String roomCode = generateRoomCode();

        TrainingSession session = new TrainingSession(sessionId, roomCode, coach);

        if (initialFen != null && !initialFen.isEmpty()) {
            session.setCurrentFen(initialFen);
        }

        TrainingSession savedSession = sessionRepository.save(session);

        System.out.println("📊 ANALYTICS: Training session created - SessionId: " + savedSession.getSessionId() +
                ", RoomCode: " + savedSession.getRoomCode() +
                ", Coach: " + coach.getEmail());

        return buildSessionStateResponse(savedSession, coach.getId());
    }

    /**
     * Join a training session by room code
     * @param roomCode The training session room code
     * @param participant The authenticated participant user
     * @return Session state map
     */
    public Map<String, Object> joinSession(String roomCode, User participant) {
        TrainingSession session = sessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Training session not found"));

        if (!session.isActive()) {
            throw new RuntimeException("Training session is not active");
        }

        session.addParticipant(participant);
        TrainingSession savedSession = sessionRepository.save(session);

        System.out.println("📊 ANALYTICS: User joined training session - SessionId: " + savedSession.getSessionId() +
                ", Participant: " + participant.getEmail() +
                ", Total participants: " + savedSession.getParticipantCount());

        return buildSessionStateResponse(savedSession, participant.getId());
    }

    /**
     * Update the position in a training session (coach only)
     * @param sessionId The session ID
     * @param user The authenticated user attempting the update
     * @param newFen The new board position
     * @param newMoveHistory The updated move history (JSON)
     * @return Session state map
     */
    public Map<String, Object> updatePosition(String sessionId, User user, String newFen, String newMoveHistory) {
        TrainingSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Training session not found"));

        // Only coach can update position
        if (!session.isCoach(user)) {
            throw new RuntimeException("Only the coach can update the position");
        }

        if (!session.isActive()) {
            throw new RuntimeException("Training session is not active");
        }

        session.setCurrentFen(newFen);
        if (newMoveHistory != null) {
            session.setMoveHistory(newMoveHistory);
        }

        TrainingSession savedSession = sessionRepository.save(session);

        return buildSessionStateResponse(savedSession, user.getId());
    }

    /**
     * End a training session (coach only)
     * @param sessionId The session ID
     * @param user The authenticated user attempting to end
     * @return Success message
     */
    public Map<String, Object> endSession(String sessionId, User user) {
        TrainingSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Training session not found"));

        // Only coach can end session
        if (!session.isCoach(user)) {
            throw new RuntimeException("Only the coach can end the session");
        }

        session.endSession();
        sessionRepository.save(session);

        System.out.println("📊 ANALYTICS: Training session ended - SessionId: " + sessionId +
                ", Duration: " + java.time.Duration.between(session.getCreatedAt(), session.getEndedAt()).toMinutes() + " minutes");

        return Map.of(
                "message", "Training session ended",
                "sessionId", sessionId,
                "status", "ENDED"
        );
    }

    /**
     * Get the current state of a training session
     * @param sessionId The session ID
     * @param user The authenticated user requesting state
     * @return Session state map
     */
    public Map<String, Object> getSessionState(String sessionId, User user) {
        TrainingSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Training session not found"));

        // Check if user is a participant
        if (!session.isParticipant(user)) {
            throw new RuntimeException("User is not a participant in this session");
        }

        return buildSessionStateResponse(session, user.getId());
    }

    /**
     * Find active training session by coach
     * @param coach The authenticated coach user
     * @return Optional session state map
     */
    public Optional<Map<String, Object>> findActiveSessionByCoach(User coach) {
        return sessionRepository.findFirstByCoachAndStatusOrderByUpdatedAtDesc(coach, TrainingSession.SessionStatus.ACTIVE)
                .map(session -> buildSessionStateResponse(session, coach.getId()));
    }

    /**
     * Build a session state response map
     */
    private Map<String, Object> buildSessionStateResponse(TrainingSession session, Long currentUserId) {
        List<Map<String, Object>> participants = session.getParticipants().stream()
                .map(participant -> Map.of(
                        "id", (Object) participant.getId(),
                        "firstName", participant.getFirstName(),
                        "lastName", participant.getLastName(),
                        "email", participant.getEmail(),
                        "isCoach", session.isCoach(participant)
                ))
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getSessionId());
        response.put("roomCode", session.getRoomCode());
        response.put("coachId", session.getCoach().getId());
        response.put("coachName", session.getCoach().getFirstName() + " " + session.getCoach().getLastName());
        response.put("currentFen", session.getCurrentFen());
        response.put("moveHistory", session.getMoveHistory());
        response.put("status", session.getStatus().toString());
        response.put("participants", participants);
        response.put("participantCount", session.getParticipantCount());
        response.put("isCoach", session.isCoach(userRepository.findById(currentUserId).orElseThrow()));
        response.put("createdAt", session.getCreatedAt().toString());
        response.put("updatedAt", session.getUpdatedAt().toString());

        return response;
    }

    /**
     * Generate a random room code for training sessions
     * Format: TRAIN-XXX (where XXX are uppercase letters)
     */
    private String generateRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        Random random = new Random();
        StringBuilder code = new StringBuilder("TRAIN-");

        for (int i = 0; i < 3; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }

        // Check if code already exists
        String roomCode = code.toString();
        if (sessionRepository.findByRoomCode(roomCode).isPresent()) {
            return generateRoomCode(); // Recursively generate new code
        }

        return roomCode;
    }
}
