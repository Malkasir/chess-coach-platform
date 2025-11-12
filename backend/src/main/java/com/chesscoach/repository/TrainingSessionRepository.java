package com.chesscoach.repository;

import com.chesscoach.entity.TrainingSession;
import com.chesscoach.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {

    Optional<TrainingSession> findBySessionId(String sessionId);

    Optional<TrainingSession> findByRoomCode(String roomCode);

    List<TrainingSession> findByCoach(User coach);

    List<TrainingSession> findByStatus(TrainingSession.SessionStatus status);

    @Query("SELECT ts FROM TrainingSession ts WHERE ts.coach = :coach AND ts.status = :status")
    List<TrainingSession> findByCoachAndStatus(User coach, TrainingSession.SessionStatus status);

    Optional<TrainingSession> findFirstByCoachAndStatusOrderByUpdatedAtDesc(User coach, TrainingSession.SessionStatus status);

    @Query("SELECT ts FROM TrainingSession ts JOIN ts.participants p WHERE p = :participant AND ts.status = 'ACTIVE'")
    List<TrainingSession> findActiveSessionsByParticipant(User participant);

    @Query("SELECT ts FROM TrainingSession ts WHERE ts.createdAt >= :fromDate ORDER BY ts.createdAt DESC")
    List<TrainingSession> findRecentSessions(LocalDateTime fromDate);

    // Find active sessions that haven't been updated in a while (for cleanup)
    @Query("SELECT ts FROM TrainingSession ts WHERE ts.status = 'ACTIVE' AND ts.updatedAt < :cutoffTime")
    List<TrainingSession> findStaleSessions(LocalDateTime cutoffTime);

    // Find ended sessions older than specified time (for cleanup)
    @Query("SELECT ts FROM TrainingSession ts WHERE ts.status = 'ENDED' AND ts.updatedAt < :cutoffTime")
    List<TrainingSession> findEndedSessionsBefore(LocalDateTime cutoffTime);
}
