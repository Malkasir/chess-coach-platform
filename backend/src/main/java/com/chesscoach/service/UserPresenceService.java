package com.chesscoach.service;

import com.chesscoach.entity.User;
import com.chesscoach.entity.UserPresence;
import com.chesscoach.entity.UserPresence.PresenceStatus;
import com.chesscoach.repository.UserPresenceRepository;
import com.chesscoach.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserPresenceService {

    private final UserPresenceRepository presenceRepository;
    private final UserRepository userRepository;

    @Autowired
    public UserPresenceService(UserPresenceRepository presenceRepository, UserRepository userRepository) {
        this.presenceRepository = presenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void updateUserPresence(Long userId, PresenceStatus status, String sessionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<UserPresence> existingPresence = presenceRepository.findByUserId(userId);
        
        UserPresence presence;
        if (existingPresence.isPresent()) {
            presence = existingPresence.get();
            presence.setStatus(status);
            presence.setSessionId(sessionId);
            presence.setLastSeen(LocalDateTime.now());
        } else {
            presence = new UserPresence(user, status);
            presence.setSessionId(sessionId);
        }
        
        presenceRepository.save(presence);
    }

    @Transactional
    public void setUserOnline(Long userId, String sessionId) {
        updateUserPresence(userId, PresenceStatus.ONLINE, sessionId);
    }

    @Transactional
    public void setUserOffline(Long userId) {
        Optional<UserPresence> presence = presenceRepository.findByUserId(userId);
        if (presence.isPresent()) {
            UserPresence userPresence = presence.get();
            userPresence.setStatus(PresenceStatus.OFFLINE);
            userPresence.setSessionId(null);
            presenceRepository.save(userPresence);
        }
    }

    @Transactional
    public void setUserInGame(Long userId) {
        updateUserPresence(userId, PresenceStatus.IN_GAME, null);
    }

    @Transactional
    public void setUserTeaching(Long userId) {
        updateUserPresence(userId, PresenceStatus.TEACHING, null);
    }

    @Transactional
    public void updateStatusMessage(Long userId, String statusMessage) {
        Optional<UserPresence> presence = presenceRepository.findByUserId(userId);
        if (presence.isPresent()) {
            UserPresence userPresence = presence.get();
            userPresence.setStatusMessage(statusMessage);
            presenceRepository.save(userPresence);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOnlineUsers() {
        List<UserPresence> onlinePresences = presenceRepository.findByStatusInOrderByLastSeenDesc(
            List.of(PresenceStatus.ONLINE, PresenceStatus.IN_GAME, PresenceStatus.TEACHING)
        );

        return onlinePresences.stream()
                .map(this::buildPresenceResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailablePlayers() {
        List<UserPresence> availablePresences = presenceRepository.findAvailablePlayers();

        return availablePresences.stream()
                .map(this::buildPresenceResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<UserPresence> getUserPresence(Long userId) {
        return presenceRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchOnlineUsers(String searchTerm) {
        List<UserPresence> foundPresences = presenceRepository.findOnlineUsersByName(searchTerm);

        return foundPresences.stream()
                .map(this::buildPresenceResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getOnlineUsersCount() {
        return presenceRepository.countOnlineUsers();
    }

    private Map<String, Object> buildPresenceResponse(UserPresence presence) {
        Map<String, Object> response = new HashMap<>();
        User user = presence.getUser();
        
        response.put("userId", user.getId());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("status", presence.getStatus().toString().toLowerCase());
        response.put("statusMessage", presence.getStatusMessage());
        response.put("lastSeen", presence.getLastSeen().toString());
        response.put("isAvailable", presence.isAvailable());
        response.put("rating", user.getRating());
        
        return response;
    }

    // Clean up stale presences every 5 minutes
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void cleanupStalePresences() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(10);
        List<UserPresence> stalePresences = presenceRepository.findStalePresences(cutoff);
        
        for (UserPresence presence : stalePresences) {
            presence.setStatus(PresenceStatus.OFFLINE);
            presence.setSessionId(null);
            presenceRepository.save(presence);
        }
        
        if (!stalePresences.isEmpty()) {
            System.out.println("Cleaned up " + stalePresences.size() + " stale user presences");
        }
    }

    @Transactional
    public void handleUserDisconnected(String sessionId) {
        Optional<UserPresence> presence = presenceRepository.findBySessionId(sessionId);
        if (presence.isPresent()) {
            UserPresence userPresence = presence.get();
            userPresence.setStatus(PresenceStatus.OFFLINE);
            userPresence.setSessionId(null);
            presenceRepository.save(userPresence);
        }
    }
}