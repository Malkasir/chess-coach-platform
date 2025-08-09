package com.chesscoach.service;

import com.chesscoach.entity.Game;
import com.chesscoach.entity.GameInvitation;
import com.chesscoach.entity.GameInvitation.InvitationStatus;
import com.chesscoach.entity.GameInvitation.InvitationType;
import com.chesscoach.entity.User;
import com.chesscoach.repository.GameInvitationRepository;
import com.chesscoach.repository.GameRepository;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GameInvitationService {

    private final GameInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public GameInvitationService(
            GameInvitationRepository invitationRepository,
            UserRepository userRepository,
            GameRepository gameRepository,
            GameService gameService,
            SimpMessagingTemplate messagingTemplate) {
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.gameService = gameService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Map<String, Object> sendGameInvitation(Long senderId, Long recipientId, InvitationType type, 
                                                  String colorPreference, String message) {
        
        // Validate users exist
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        // Prevent self-invitations
        if (senderId.equals(recipientId)) {
            throw new RuntimeException("Cannot send invitation to yourself");
        }

        // Check for existing pending invitations
        List<GameInvitation> existingInvitations = invitationRepository.findExistingInvitationBetweenUsers(
                senderId, recipientId, LocalDateTime.now()
        );
        if (!existingInvitations.isEmpty()) {
            throw new RuntimeException("A pending invitation already exists between these users");
        }

        // Check for recent invitations to prevent spam
        List<GameInvitation> recentInvitations = invitationRepository.findRecentInvitationsBetweenUsers(
                senderId, recipientId, LocalDateTime.now().minusMinutes(2)
        );
        if (recentInvitations.size() >= 3) {
            throw new RuntimeException("Too many recent invitations. Please wait before sending another.");
        }

        // Create the invitation
        GameInvitation invitation = new GameInvitation(sender, recipient, type);
        invitation.setMessage(message);
        
        // Set color preference if provided
        if (colorPreference != null && !colorPreference.equals("random")) {
            try {
                invitation.setSenderColor(Game.PlayerColor.valueOf(colorPreference.toUpperCase()));
            } catch (IllegalArgumentException e) {
                invitation.setSenderColor(null); // Default to random
            }
        }

        GameInvitation savedInvitation = invitationRepository.save(invitation);

        // Send real-time notification to recipient
        sendInvitationNotification(savedInvitation);

        return buildInvitationResponse(savedInvitation);
    }

    @Transactional
    public Map<String, Object> acceptInvitation(Long invitationId, Long userId) {
        GameInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        // Validate the user is the recipient
        if (!invitation.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to accept this invitation");
        }

        // Check if invitation is still valid
        if (!invitation.isPending()) {
            throw new RuntimeException("Invitation is no longer valid");
        }

        // Accept the invitation
        invitation.accept();
        invitationRepository.save(invitation);

        // Create the game
        try {
            String hostColorPreference = "random";
            Game.PlayerColor senderColor = invitation.getSenderColor();
            
            if (senderColor != null) {
                hostColorPreference = senderColor.toString().toLowerCase();
            }

            Map<String, Object> gameResponse = gameService.createGame(
                    invitation.getSender().getId().toString(), 
                    hostColorPreference
            );
            
            // Store game reference in invitation for future queries
            String gameId = (String) gameResponse.get("gameId");
            if (gameId != null) {
                // Find the created game entity and link it to the invitation
                // This allows both players to find the same game through the invitation
                Optional<com.chesscoach.entity.Game> gameEntity = gameRepository.findByGameId(gameId);
                if (gameEntity.isPresent()) {
                    invitation.setGame(gameEntity.get());
                    System.out.println("✅ Linked game " + gameId + " to invitation " + invitation.getId());
                } else {
                    System.out.println("⚠️ Could not find game entity for gameId: " + gameId);
                }
            }
            
            // Save the updated invitation with game reference
            invitation = invitationRepository.save(invitation);
            
            // Notify both users about the game creation
            sendGameCreatedNotification(invitation, gameResponse);

            Map<String, Object> response = buildInvitationResponse(invitation);
            response.put("game", gameResponse);
            
            return response;
            
        } catch (Exception e) {
            // If game creation fails, revert invitation status
            invitation.setStatus(InvitationStatus.PENDING);
            invitationRepository.save(invitation);
            throw new RuntimeException("Failed to create game: " + e.getMessage());
        }
    }

    @Transactional
    public Map<String, Object> declineInvitation(Long invitationId, Long userId) {
        GameInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        // Validate the user is the recipient
        if (!invitation.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to decline this invitation");
        }

        // Check if invitation is still valid
        if (!invitation.isPending()) {
            throw new RuntimeException("Invitation is no longer valid");
        }

        // Decline the invitation
        invitation.decline();
        invitationRepository.save(invitation);

        // Notify sender about the decline
        sendInvitationDeclinedNotification(invitation);

        return buildInvitationResponse(invitation);
    }

    @Transactional
    public void cancelInvitation(Long invitationId, Long userId) {
        GameInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        // Validate the user is the sender
        if (!invitation.getSender().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to cancel this invitation");
        }

        // Check if invitation is still valid
        if (!invitation.isPending()) {
            throw new RuntimeException("Invitation is no longer valid");
        }

        // Cancel the invitation
        invitation.cancel();
        invitationRepository.save(invitation);

        // Notify recipient about the cancellation
        sendInvitationCancelledNotification(invitation);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingInvitationsForUser(Long userId) {
        List<GameInvitation> invitations = invitationRepository.findPendingInvitationsForUser(userId, LocalDateTime.now());
        return invitations.stream()
                .map(this::buildInvitationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSentInvitationsByUser(Long userId) {
        // Get all recent invitations sent by the user (not just pending ones)
        // This allows the sender to detect when their invitations are accepted
        List<GameInvitation> invitations = invitationRepository.findBySenderIdOrderByCreatedAtDesc(userId);
        
        // Filter to only recent invitations (last 24 hours) to avoid returning too much data
        LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
        List<GameInvitation> recentInvitations = invitations.stream()
                .filter(inv -> inv.getCreatedAt().isAfter(yesterday))
                .toList();
        
        return recentInvitations.stream()
                .map(this::buildInvitationResponse)
                .toList();
    }

    private Map<String, Object> buildInvitationResponse(GameInvitation invitation) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", invitation.getId());
        response.put("type", invitation.getType().toString().toLowerCase());
        response.put("status", invitation.getStatus().toString().toLowerCase());
        response.put("message", invitation.getMessage());
        response.put("createdAt", invitation.getCreatedAt().toString());
        response.put("expiresAt", invitation.getExpiresAt().toString());
        
        // Sender info
        User sender = invitation.getSender();
        Map<String, Object> senderInfo = new HashMap<>();
        senderInfo.put("id", sender.getId());
        senderInfo.put("firstName", sender.getFirstName());
        senderInfo.put("lastName", sender.getLastName());
        senderInfo.put("fullName", sender.getFullName());
        response.put("sender", senderInfo);
        
        // Recipient info
        User recipient = invitation.getRecipient();
        Map<String, Object> recipientInfo = new HashMap<>();
        recipientInfo.put("id", recipient.getId());
        recipientInfo.put("firstName", recipient.getFirstName());
        recipientInfo.put("lastName", recipient.getLastName());
        recipientInfo.put("fullName", recipient.getFullName());
        response.put("recipient", recipientInfo);
        
        // Game preferences
        if (invitation.getSenderColor() != null) {
            response.put("senderColor", invitation.getSenderColor().toString().toLowerCase());
        }
        
        // If invitation is accepted and has a linked game, include game info
        if (invitation.getStatus() == InvitationStatus.ACCEPTED && invitation.getGame() != null) {
            Game game = invitation.getGame();
            Map<String, Object> gameInfo = new HashMap<>();
            gameInfo.put("gameId", game.getGameId());
            gameInfo.put("roomCode", game.getRoomCode());
            gameInfo.put("status", game.getStatus().toString().toLowerCase());
            gameInfo.put("hostColor", game.getHostColor() != null ? game.getHostColor().toString().toLowerCase() : null);
            gameInfo.put("guestColor", game.getGuestColor() != null ? game.getGuestColor().toString().toLowerCase() : null);
            response.put("game", gameInfo);
            System.out.println("✅ Including game info in invitation response: " + game.getGameId());
        }
        
        return response;
    }

    private void sendInvitationNotification(GameInvitation invitation) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "GAME_INVITATION");
        notification.put("invitation", buildInvitationResponse(invitation));
        
        messagingTemplate.convertAndSendToUser(
                invitation.getRecipient().getId().toString(),
                "/queue/notifications",
                notification
        );
    }

    private void sendGameCreatedNotification(GameInvitation invitation, Map<String, Object> gameResponse) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "GAME_CREATED");
        notification.put("game", gameResponse);
        notification.put("invitation", buildInvitationResponse(invitation));
        
        // Notify both sender and recipient
        messagingTemplate.convertAndSendToUser(
                invitation.getSender().getId().toString(),
                "/queue/notifications",
                notification
        );
        messagingTemplate.convertAndSendToUser(
                invitation.getRecipient().getId().toString(),
                "/queue/notifications",
                notification
        );
    }

    private void sendInvitationDeclinedNotification(GameInvitation invitation) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "INVITATION_DECLINED");
        notification.put("invitation", buildInvitationResponse(invitation));
        
        messagingTemplate.convertAndSendToUser(
                invitation.getSender().getId().toString(),
                "/queue/notifications",
                notification
        );
    }

    private void sendInvitationCancelledNotification(GameInvitation invitation) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "INVITATION_CANCELLED");
        notification.put("invitation", buildInvitationResponse(invitation));
        
        messagingTemplate.convertAndSendToUser(
                invitation.getRecipient().getId().toString(),
                "/queue/notifications",
                notification
        );
    }

    // Clean up expired invitations every minute
    @Scheduled(fixedRate = 60000) // 1 minute
    @Transactional
    public void cleanupExpiredInvitations() {
        List<GameInvitation> expiredInvitations = invitationRepository.findExpiredInvitations(LocalDateTime.now());
        
        for (GameInvitation invitation : expiredInvitations) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
        }
        
        if (!expiredInvitations.isEmpty()) {
            System.out.println("Expired " + expiredInvitations.size() + " game invitations");
        }
    }
}