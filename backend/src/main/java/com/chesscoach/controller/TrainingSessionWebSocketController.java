package com.chesscoach.controller;

import com.chesscoach.dto.TrainingMessage;
import com.chesscoach.entity.TrainingSession;
import com.chesscoach.entity.User;
import com.chesscoach.repository.TrainingSessionRepository;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
public class TrainingSessionWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final TrainingSessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Autowired
    public TrainingSessionWebSocketController(SimpMessagingTemplate messagingTemplate,
                                              TrainingSessionRepository sessionRepository,
                                              UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/training/join")
    @Transactional(readOnly = true)
    public void handleJoinSession(@Payload TrainingMessage message, Principal principal) {
        try {
            if (principal == null) {
                System.out.println("❌ No authenticated user found");
                sendError(message.getSessionId(), null, "Authentication required");
                return;
            }

            // Get authenticated user from Principal
            String username = principal.getName();
            Optional<User> userOpt = userRepository.findByEmail(username);
            if (userOpt.isEmpty()) {
                System.out.println("❌ Authenticated user not found: " + username);
                sendError(message.getSessionId(), null, "User not found");
                return;
            }

            User participant = userOpt.get();
            System.out.println("🔌 Participant " + participant.getId() + " joining training session " + message.getSessionId());

            Optional<TrainingSession> sessionOpt = sessionRepository.findBySessionId(message.getSessionId());
            if (sessionOpt.isEmpty()) {
                System.out.println("❌ Training session not found: " + message.getSessionId());
                sendError(message.getSessionId(), String.valueOf(participant.getId()), "Training session not found");
                return;
            }

            TrainingSession session = sessionOpt.get();

            if (!session.isActive()) {
                System.out.println("❌ Training session is not active: " + message.getSessionId());
                sendError(message.getSessionId(), String.valueOf(participant.getId()), "Training session is not active");
                return;
            }

            // Check if user is already a participant
            if (!session.isParticipant(participant)) {
                System.out.println("❌ User is not a participant in this session: " + participant.getId());
                sendError(message.getSessionId(), String.valueOf(participant.getId()), "You are not a participant in this training session");
                return;
            }

            System.out.println("✅ Training session found - Coach: " + session.getCoach().getId() +
                    ", Participants: " + session.getParticipantCount());

            // Send participant joined message to all participants
            String participantName = participant.getFirstName() + " " + participant.getLastName();
            TrainingMessage joinMessage = TrainingMessage.participantJoinedMessage(
                    message.getSessionId(),
                    String.valueOf(participant.getId()),
                    participantName,
                    session.getParticipantCount()
            );

            System.out.println("📢 Broadcasting join message to /topic/training/" + message.getSessionId());
            messagingTemplate.convertAndSend("/topic/training/" + message.getSessionId(), joinMessage);

            // Send current session state to the joining participant
            List<Map<String, Object>> participants = session.getParticipants().stream()
                    .map(p -> Map.of(
                            "id", (Object) p.getId(),
                            "firstName", p.getFirstName(),
                            "lastName", p.getLastName(),
                            "email", p.getEmail(),
                            "isCoach", session.isCoach(p)
                    ))
                    .collect(Collectors.toList());

            TrainingMessage stateMessage = TrainingMessage.sessionStateMessage(
                    message.getSessionId(),
                    session.getCurrentFen(),
                    session.getMoveHistory(),
                    participants,
                    session.getParticipantCount()
            );

            messagingTemplate.convertAndSend(
                    "/topic/training/" + message.getSessionId() + "/" + participant.getId(),
                    stateMessage
            );

            System.out.println("✅ Participant " + participant.getId() + " successfully joined training session");

        } catch (Exception e) {
            System.out.println("❌ Error joining training session: " + e.getMessage());
            sendError(message.getSessionId(), null, "Failed to join training session: " + e.getMessage());
        }
    }

    @MessageMapping("/training/position-update")
    public void handlePositionUpdate(@Payload TrainingMessage message, Principal principal) {
        try {
            if (principal == null) {
                System.out.println("❌ No authenticated user found");
                sendError(message.getSessionId(), null, "Authentication required");
                return;
            }

            // Get authenticated user from Principal
            String username = principal.getName();
            Optional<User> userOpt = userRepository.findByEmail(username);
            if (userOpt.isEmpty()) {
                System.out.println("❌ Authenticated user not found: " + username);
                sendError(message.getSessionId(), null, "User not found");
                return;
            }

            User user = userOpt.get();
            System.out.println("🎯 Position update for training session " + message.getSessionId() +
                    " from user " + user.getId());

            Optional<TrainingSession> sessionOpt = sessionRepository.findBySessionId(message.getSessionId());
            if (sessionOpt.isEmpty()) {
                sendError(message.getSessionId(), String.valueOf(user.getId()), "Training session not found");
                return;
            }

            TrainingSession session = sessionOpt.get();

            // Validate that the session is active
            if (!session.isActive()) {
                sendError(message.getSessionId(), String.valueOf(user.getId()), "Training session is not active");
                return;
            }

            // Validate that the user is the coach (only coach can update position)
            if (!session.isCoach(user)) {
                System.out.println("❌ User " + user.getId() + " is not the coach - permission denied");
                sendError(message.getSessionId(), String.valueOf(user.getId()), "Only the coach can update the position");
                return;
            }

            // Update session state in database
            session.setCurrentFen(message.getFen());

            if (message.getMoveHistory() != null) {
                session.setMoveHistory(message.getMoveHistory());
            }

            sessionRepository.save(session);

            // Broadcast position update to all participants
            TrainingMessage updateMessage = TrainingMessage.positionUpdateMessage(
                    message.getSessionId(),
                    message.getFen(),
                    message.getMoveHistory()
            );

            System.out.println("📢 Broadcasting position update to /topic/training/" + message.getSessionId());
            messagingTemplate.convertAndSend("/topic/training/" + message.getSessionId(), updateMessage);

            System.out.println("✅ Position update broadcast completed for session " + message.getSessionId());

        } catch (Exception e) {
            System.out.println("❌ Error updating position: " + e.getMessage());
            sendError(message.getSessionId(), null, "Failed to update position: " + e.getMessage());
        }
    }

    @MessageMapping("/training/end")
    public void handleEndSession(@Payload TrainingMessage message, Principal principal) {
        try {
            if (principal == null) {
                System.out.println("❌ No authenticated user found");
                sendError(message.getSessionId(), null, "Authentication required");
                return;
            }

            // Get authenticated user from Principal
            String username = principal.getName();
            Optional<User> userOpt = userRepository.findByEmail(username);
            if (userOpt.isEmpty()) {
                System.out.println("❌ Authenticated user not found: " + username);
                sendError(message.getSessionId(), null, "User not found");
                return;
            }

            User user = userOpt.get();
            System.out.println("🛑 Ending training session " + message.getSessionId() +
                    " by user " + user.getId());

            Optional<TrainingSession> sessionOpt = sessionRepository.findBySessionId(message.getSessionId());
            if (sessionOpt.isEmpty()) {
                sendError(message.getSessionId(), String.valueOf(user.getId()), "Training session not found");
                return;
            }

            TrainingSession session = sessionOpt.get();

            // Validate that the user is the coach (only coach can end session)
            if (!session.isCoach(user)) {
                System.out.println("❌ User " + user.getId() + " is not the coach - permission denied");
                sendError(message.getSessionId(), String.valueOf(user.getId()), "Only the coach can end the session");
                return;
            }

            // End the session
            session.endSession();
            sessionRepository.save(session);

            // Broadcast session ended message to all participants
            TrainingMessage endMessage = TrainingMessage.sessionEndedMessage(
                    message.getSessionId(),
                    "Training session has been ended by the coach"
            );

            System.out.println("📢 Broadcasting session end to /topic/training/" + message.getSessionId());
            messagingTemplate.convertAndSend("/topic/training/" + message.getSessionId(), endMessage);

            System.out.println("✅ Training session " + message.getSessionId() + " ended successfully");

        } catch (Exception e) {
            System.out.println("❌ Error ending training session: " + e.getMessage());
            sendError(message.getSessionId(), null, "Failed to end session: " + e.getMessage());
        }
    }

    private void sendError(String sessionId, String userId, String errorMessage) {
        TrainingMessage errorMsg = TrainingMessage.errorMessage(sessionId, errorMessage);
        if (userId != null) {
            messagingTemplate.convertAndSend("/topic/training/" + sessionId + "/" + userId, errorMsg);
        } else {
            messagingTemplate.convertAndSend("/topic/training/" + sessionId, errorMsg);
        }
    }
}
