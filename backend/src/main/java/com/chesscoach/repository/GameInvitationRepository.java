package com.chesscoach.repository;

import com.chesscoach.entity.GameInvitation;
import com.chesscoach.entity.GameInvitation.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GameInvitationRepository extends JpaRepository<GameInvitation, Long> {
    
    // Find invitations sent by a user
    List<GameInvitation> findBySenderIdOrderByCreatedAtDesc(Long senderId);
    
    // Find invitations received by a user
    List<GameInvitation> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    
    // Find pending invitations for a user (received)
    @Query("SELECT gi FROM GameInvitation gi WHERE gi.recipient.id = :userId AND gi.status = 'PENDING' AND gi.expiresAt > :now ORDER BY gi.createdAt DESC")
    List<GameInvitation> findPendingInvitationsForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    // Find pending invitations sent by a user
    @Query("SELECT gi FROM GameInvitation gi WHERE gi.sender.id = :userId AND gi.status = 'PENDING' AND gi.expiresAt > :now ORDER BY gi.createdAt DESC")
    List<GameInvitation> findPendingInvitationsBySender(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    // Find expired invitations for cleanup
    @Query("SELECT gi FROM GameInvitation gi WHERE gi.status = 'PENDING' AND gi.expiresAt <= :now")
    List<GameInvitation> findExpiredInvitations(@Param("now") LocalDateTime now);
    
    // Check if there's already a pending invitation between two users
    @Query("SELECT gi FROM GameInvitation gi WHERE " +
           "((gi.sender.id = :user1Id AND gi.recipient.id = :user2Id) OR " +
           "(gi.sender.id = :user2Id AND gi.recipient.id = :user1Id)) AND " +
           "gi.status = 'PENDING' AND gi.expiresAt > :now")
    List<GameInvitation> findExistingInvitationBetweenUsers(
        @Param("user1Id") Long user1Id, 
        @Param("user2Id") Long user2Id, 
        @Param("now") LocalDateTime now
    );
    
    // Find invitations by status
    List<GameInvitation> findByStatusOrderByCreatedAtDesc(InvitationStatus status);
    
    // Find recent invitations between two users (to prevent spam)
    @Query("SELECT gi FROM GameInvitation gi WHERE gi.sender.id = :senderId AND gi.recipient.id = :recipientId AND gi.createdAt > :since")
    List<GameInvitation> findRecentInvitationsBetweenUsers(
        @Param("senderId") Long senderId,
        @Param("recipientId") Long recipientId,
        @Param("since") LocalDateTime since
    );
}