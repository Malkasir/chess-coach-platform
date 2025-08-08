package com.chesscoach.repository;

import com.chesscoach.entity.UserPresence;
import com.chesscoach.entity.UserPresence.PresenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPresenceRepository extends JpaRepository<UserPresence, Long> {
    
    Optional<UserPresence> findByUserId(Long userId);
    
    Optional<UserPresence> findBySessionId(String sessionId);
    
    @Query("SELECT up FROM UserPresence up JOIN up.user u WHERE up.status IN :statuses ORDER BY up.lastSeen DESC")
    List<UserPresence> findByStatusInOrderByLastSeenDesc(@Param("statuses") List<PresenceStatus> statuses);
    
    @Query("SELECT up FROM UserPresence up JOIN up.user u WHERE up.status = :status ORDER BY u.firstName, u.lastName")
    List<UserPresence> findByStatusOrderByUserName(@Param("status") PresenceStatus status);
    
    // Find users who haven't been seen recently (for cleanup)
    @Query("SELECT up FROM UserPresence up WHERE up.status != 'OFFLINE' AND up.lastSeen < :cutoffTime")
    List<UserPresence> findStalePresences(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    // Find available players (online but not in game)
    @Query("SELECT up FROM UserPresence up JOIN up.user u WHERE up.status = 'ONLINE' ORDER BY up.lastSeen DESC")
    List<UserPresence> findAvailablePlayers();
    
    // Count online users
    @Query("SELECT COUNT(up) FROM UserPresence up WHERE up.status IN ('ONLINE', 'IN_GAME', 'TEACHING')")
    long countOnlineUsers();
    
    // Find users by partial name match who are online
    @Query("SELECT up FROM UserPresence up JOIN up.user u WHERE " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "up.status IN ('ONLINE', 'IN_GAME', 'TEACHING')")
    List<UserPresence> findOnlineUsersByName(@Param("searchTerm") String searchTerm);
}