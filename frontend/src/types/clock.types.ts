/**
 * Type definitions for chess clock feature
 */

export type GameMode = 'TIMED' | 'TRAINING';

export interface TimeControl {
  mode: GameMode;
  baseTimeSeconds: number | null; // null for TRAINING mode
  incrementSeconds: number;
  label?: string; // Display label like "Blitz 3+2"
}

export interface ClockState {
  gameMode: GameMode;
  baseTimeSeconds: number | null;
  incrementSeconds: number;
  whiteTimeRemaining: number | null;
  blackTimeRemaining: number | null;
  lastMoveTimestamp: number | null; // Server timestamp in milliseconds
  activeColor: 'WHITE' | 'BLACK';
}

// Preset time controls
export const TIME_CONTROL_PRESETS: TimeControl[] = [
  // Bullet
  { mode: 'TIMED', baseTimeSeconds: 60, incrementSeconds: 0, label: 'Bullet 1+0' },
  { mode: 'TIMED', baseTimeSeconds: 120, incrementSeconds: 1, label: 'Bullet 2+1' },

  // Blitz
  { mode: 'TIMED', baseTimeSeconds: 180, incrementSeconds: 0, label: 'Blitz 3+0' },
  { mode: 'TIMED', baseTimeSeconds: 180, incrementSeconds: 2, label: 'Blitz 3+2' },
  { mode: 'TIMED', baseTimeSeconds: 300, incrementSeconds: 0, label: 'Blitz 5+0' },
  { mode: 'TIMED', baseTimeSeconds: 300, incrementSeconds: 3, label: 'Blitz 5+3' },

  // Rapid
  { mode: 'TIMED', baseTimeSeconds: 600, incrementSeconds: 0, label: 'Rapid 10+0' },
  { mode: 'TIMED', baseTimeSeconds: 600, incrementSeconds: 5, label: 'Rapid 10+5' },
  { mode: 'TIMED', baseTimeSeconds: 900, incrementSeconds: 10, label: 'Rapid 15+10' },

  // Training (no clock)
  { mode: 'TRAINING', baseTimeSeconds: null, incrementSeconds: 0, label: 'Training (No Clock)' },
];

export const DEFAULT_TIME_CONTROL: TimeControl = {
  mode: 'TIMED',
  baseTimeSeconds: 600,
  incrementSeconds: 0,
  label: 'Rapid 10+0'
};

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}

/**
 * Get urgency level based on remaining time
 */
export function getTimeUrgency(seconds: number): 'normal' | 'low' | 'warning' | 'critical' {
  if (seconds <= 10) return 'critical';  // Red + pulse
  if (seconds <= 30) return 'warning';    // Red
  if (seconds <= 60) return 'low';        // Orange
  return 'normal';                         // White
}
