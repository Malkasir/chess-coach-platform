/**
 * Chess AI Personality System Types
 * 
 * Defines the structure for chess AI personalities that exhibit
 * different playing styles and behaviors.
 */

export interface PlayingStyle {
  /** Aggression level: -100 (very passive) to +100 (very aggressive) */
  aggression: number;
  
  /** Tactical vs Positional preference: 0 (positional) to 100 (tactical) */
  tacticalPreference: number;
  
  /** Risk tolerance: 0 (safe) to 100 (risk-taking) */
  riskTolerance: number;
  
  /** Development speed: 0 (slow/solid) to 100 (fast/sharp) */
  developmentSpeed: number;
}

export interface AdaptiveConfig {
  /** Whether this personality adapts to player performance */
  enabled: boolean;
  
  /** Speed of adaptation: 0 (slow) to 100 (fast) */
  adaptationRate: number;
  
  /** Minimum skill level (prevents AI from becoming too weak) */
  minSkillLevel: number;
  
  /** Maximum skill level (prevents AI from becoming too strong) */
  maxSkillLevel: number;
}

export interface ChessPersonality {
  /** Unique identifier for the personality */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Brief description of the personality's style */
  description: string;
  
  /** Emoji or icon representing the personality */
  avatar: string;
  
  /** Stockfish skill level: 0-20 (0 = weakest, 20 = strongest) */
  skillLevel: number;
  
  /** Target ELO rating for display purposes */
  targetElo: number;
  
  /** Playing style characteristics */
  playingStyle: PlayingStyle;
  
  /** Adaptive difficulty settings */
  adaptiveSettings: AdaptiveConfig;
  
  /** Flavor text/quotes that represent the personality */
  quotes: string[];
  
  /** Background color for UI theming */
  color: string;
}

export interface EngineSettings {
  /** Stockfish skill level */
  skillLevel: number;
  
  /** Time per move in milliseconds */
  thinkTime: number;
  
  /** Search depth limit */
  depth?: number;
  
  /** Additional UCI options */
  uciOptions?: Record<string, string | number>;
}

export interface GameSession {
  /** Currently selected personality */
  personality: ChessPersonality;
  
  /** Current engine settings */
  engineSettings: EngineSettings;
  
  /** Game statistics */
  stats: {
    movesPlayed: number;
    playerAccuracy: number;
    averageThinkTime: number;
  };
}