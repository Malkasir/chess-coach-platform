package com.chesscoach.entity;

/**
 * Represents the role a participant can have in a training session.
 * Phase 2: Used for interactive mode role assignments.
 */
public enum PlayerRole {
    /**
     * The coach who created the session (can always move, has full control)
     */
    COACH,

    /**
     * Can only move white pieces (when it's white's turn)
     */
    WHITE,

    /**
     * Can only move black pieces (when it's black's turn)
     */
    BLACK,

    /**
     * Can move both white and black pieces (for demonstrating lines)
     */
    BOTH,

    /**
     * Cannot move pieces, only watch (default role for students)
     */
    SPECTATOR;

    /**
     * Convert string to PlayerRole enum
     */
    public static PlayerRole fromString(String role) {
        if (role == null) {
            return SPECTATOR;
        }
        try {
            return PlayerRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return SPECTATOR;
        }
    }

    /**
     * Check if this role can move pieces on the given turn
     */
    public boolean canMovePieces(String turn) {
        switch (this) {
            case COACH:
            case BOTH:
                return true;
            case WHITE:
                return "w".equals(turn);
            case BLACK:
                return "b".equals(turn);
            case SPECTATOR:
            default:
                return false;
        }
    }
}
