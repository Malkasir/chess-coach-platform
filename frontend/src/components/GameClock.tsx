import React from 'react';
import { ClockState, formatTime, getTimeUrgency } from '../types/clock.types';
import styles from '../styles/shared.module.css';

interface GameClockProps {
  clockState: ClockState | null;
  playerColor: 'white' | 'black' | null;
  whiteTimeRemaining: number; // Local countdown value
  blackTimeRemaining: number; // Local countdown value
  layout?: 'default' | 'side-panel'; // Layout mode
  showClock?: 'white' | 'black'; // For side-panel: which clock to show
}

export const GameClock: React.FC<GameClockProps> = ({
  clockState,
  playerColor,
  whiteTimeRemaining,
  blackTimeRemaining,
  layout = 'default',
  showClock
}) => {
  // Training mode - no clock
  if (!clockState || clockState.gameMode === 'TRAINING') {
    if (layout === 'side-panel') {
      return null; // Don't show anything in side panel for training mode
    }
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--space-md)',
        color: 'var(--text-muted)',
        fontSize: 'var(--text-sm)'
      }}>
        Training Mode - No Clock
      </div>
    );
  }

  const isWhiteActive = clockState.activeColor === 'WHITE';
  const isBlackActive = clockState.activeColor === 'BLACK';

  // Side-panel layout: Show single clock
  if (layout === 'side-panel' && showClock) {
    const timeRemaining = showClock === 'white' ? whiteTimeRemaining : blackTimeRemaining;
    const isActive = showClock === 'white' ? isWhiteActive : isBlackActive;
    const isPlayerClock = showClock === playerColor;
    const urgency = getTimeUrgency(timeRemaining);

    let backgroundColor = 'var(--bg-card)';
    let borderColor = 'var(--border-subtle)';
    let textColor = 'var(--text-primary)';

    if (isActive) {
      borderColor = 'var(--border-focus)';
      backgroundColor = 'var(--bg-card-hover)';
    }

    if (urgency === 'low') {
      textColor = 'var(--warning-color)';
      if (isActive) borderColor = 'rgba(255, 152, 0, 0.5)';
    } else if (urgency === 'warning') {
      textColor = 'var(--error-color)';
      if (isActive) borderColor = 'var(--error-color)';
    } else if (urgency === 'critical') {
      textColor = 'var(--error-color)';
      if (isActive) borderColor = 'var(--error-color)';
    }

    const shouldPulse = urgency === 'critical' && isActive;

    return (
      <>
        <style>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.9;
            }
          }
        `}</style>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-lg)',
            backgroundColor,
            border: `2px solid ${borderColor}`,
            borderRadius: '8px',
            width: '100%',
            transition: 'all 0.2s ease',
            animation: shouldPulse ? 'pulse 1s ease-in-out infinite' : undefined,
            opacity: isPlayerClock ? 1 : 0.9
          }}
          role="timer"
          aria-label={`${showClock} time remaining: ${formatTime(timeRemaining)}`}
          aria-live={shouldPulse ? 'assertive' : 'polite'}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-sm)',
              fontWeight: 'var(--font-medium)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {showClock === 'white' ? '⚪' : '⚫'} {showClock.charAt(0).toUpperCase() + showClock.slice(1)}
            {isPlayerClock && ' (You)'}
          </div>
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 'var(--font-bold)',
              fontFamily: 'monospace',
              color: textColor,
              lineHeight: 1
            }}
          >
            {formatTime(timeRemaining)}
          </div>
          {clockState.incrementSeconds > 0 && (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-subtle)',
                marginTop: 'var(--space-sm)'
              }}
            >
              +{clockState.incrementSeconds}s
            </div>
          )}
        </div>
      </>
    );
  }

  // Default layout: Show both clocks side by side
  const getClockStyle = (color: 'white' | 'black', timeRemaining: number, isActive: boolean) => {
    const urgency = getTimeUrgency(timeRemaining);

    let backgroundColor = 'var(--bg-card)';
    let borderColor = 'var(--border-subtle)';
    let textColor = 'var(--text-primary)';

    if (isActive) {
      borderColor = 'var(--border-focus)';
      backgroundColor = 'var(--bg-card-hover)';
    }

    if (urgency === 'low') {
      // Orange for <60 seconds
      textColor = 'var(--warning-color)';
      if (isActive) borderColor = 'rgba(255, 152, 0, 0.5)';
    } else if (urgency === 'warning') {
      // Red for <30 seconds
      textColor = 'var(--error-color)';
      if (isActive) borderColor = 'var(--error-color)';
    } else if (urgency === 'critical') {
      // Red + pulse for <10 seconds
      textColor = 'var(--error-color)';
      if (isActive) borderColor = 'var(--error-color)';
    }

    return {
      backgroundColor,
      borderColor,
      textColor,
      shouldPulse: urgency === 'critical' && isActive
    };
  };

  const whiteStyle = getClockStyle('white', whiteTimeRemaining, isWhiteActive);
  const blackStyle = getClockStyle('black', blackTimeRemaining, isBlackActive);

  const ClockDisplay = ({
    label,
    timeRemaining,
    style,
    isPlayerClock
  }: {
    label: string;
    timeRemaining: number;
    style: ReturnType<typeof getClockStyle>;
    isPlayerClock: boolean;
  }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-md)',
        backgroundColor: style.backgroundColor,
        border: `2px solid ${style.borderColor}`,
        borderRadius: '8px',
        minWidth: '120px',
        position: 'relative',
        transition: 'all 0.2s ease',
        animation: style.shouldPulse ? 'pulse 1s ease-in-out infinite' : undefined,
        opacity: isPlayerClock ? 1 : 0.8
      }}
      role="timer"
      aria-label={`${label} time remaining: ${formatTime(timeRemaining)}`}
      aria-live={style.shouldPulse ? 'assertive' : 'polite'}
    >
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-xs)',
          fontWeight: 'var(--font-medium)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        {label}
        {isPlayerClock && ' (You)'}
      </div>
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 'var(--font-bold)',
          fontFamily: 'monospace',
          color: style.textColor,
          lineHeight: 1
        }}
      >
        {formatTime(timeRemaining)}
      </div>
      {clockState.incrementSeconds > 0 && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-subtle)',
            marginTop: 'var(--space-xs)'
          }}
        >
          +{clockState.incrementSeconds}s
        </div>
      )}
    </div>
  );

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-lg)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--space-md)',
          flexWrap: 'wrap'
        }}
      >
        <ClockDisplay
          label="White"
          timeRemaining={whiteTimeRemaining}
          style={whiteStyle}
          isPlayerClock={playerColor === 'white'}
        />

        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-subtle)',
            fontWeight: 'var(--font-medium)'
          }}
          aria-hidden="true"
        >
          VS
        </div>

        <ClockDisplay
          label="Black"
          timeRemaining={blackTimeRemaining}
          style={blackStyle}
          isPlayerClock={playerColor === 'black'}
        />
      </div>

      {/* Time control info */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          marginTop: 'var(--space-sm)'
        }}
      >
        {clockState.baseTimeSeconds && (
          <>
            {Math.floor(clockState.baseTimeSeconds / 60)} min
            {clockState.incrementSeconds > 0 && ` + ${clockState.incrementSeconds}s`}
          </>
        )}
      </div>
    </div>
  );
};
