import React, { useState } from 'react';
import { TimeControl, TIME_CONTROL_PRESETS, DEFAULT_TIME_CONTROL } from '../types/clock.types';
import styles from '../styles/shared.module.css';

interface TimeControlSelectorProps {
  value: TimeControl;
  onChange: (timeControl: TimeControl) => void;
  disabled?: boolean;
}

export const TimeControlSelector: React.FC<TimeControlSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('10');
  const [customIncrement, setCustomIncrement] = useState('0');

  const handlePresetClick = (preset: TimeControl) => {
    if (disabled) return;

    if (preset.mode === 'TRAINING') {
      setShowCustom(false);
    }
    onChange(preset);
  };

  const handleCustomClick = () => {
    if (disabled) return;
    setShowCustom(true);
  };

  const applyCustomTime = () => {
    const minutes = parseInt(customMinutes, 10);
    const increment = parseInt(customIncrement, 10);

    // Validate inputs
    if (isNaN(minutes) || minutes < 1 || minutes > 180) {
      alert('Please enter base time between 1 and 180 minutes');
      return;
    }

    if (isNaN(increment) || increment < 0 || increment > 60) {
      alert('Please enter increment between 0 and 60 seconds');
      return;
    }

    const customControl: TimeControl = {
      mode: 'TIMED',
      baseTimeSeconds: minutes * 60,
      incrementSeconds: increment,
      label: `Custom ${minutes}+${increment}`
    };

    onChange(customControl);
    setShowCustom(false);
  };

  const groupedPresets = {
    bullet: TIME_CONTROL_PRESETS.filter(p => p.baseTimeSeconds && p.baseTimeSeconds <= 180),
    blitz: TIME_CONTROL_PRESETS.filter(p => p.baseTimeSeconds && p.baseTimeSeconds > 180 && p.baseTimeSeconds <= 480),
    rapid: TIME_CONTROL_PRESETS.filter(p => p.baseTimeSeconds && p.baseTimeSeconds > 480),
    training: TIME_CONTROL_PRESETS.filter(p => p.mode === 'TRAINING')
  };

  const isPresetSelected = (preset: TimeControl) => {
    return preset.mode === value.mode &&
           preset.baseTimeSeconds === value.baseTimeSeconds &&
           preset.incrementSeconds === value.incrementSeconds;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <div>
        <h3 style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          marginBottom: 'var(--space-sm)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Time Control
        </h3>
      </div>

      {/* Bullet */}
      {groupedPresets.bullet.length > 0 && (
        <div>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-xs)',
            fontWeight: 'var(--font-medium)'
          }}>
            Bullet
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {groupedPresets.bullet.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className={styles.secondaryButton}
                style={{
                  backgroundColor: isPresetSelected(preset) ? 'var(--accent-color)' : undefined,
                  borderColor: isPresetSelected(preset) ? 'var(--accent-color)' : undefined
                }}
                aria-pressed={isPresetSelected(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blitz */}
      {groupedPresets.blitz.length > 0 && (
        <div>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-xs)',
            fontWeight: 'var(--font-medium)'
          }}>
            Blitz
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {groupedPresets.blitz.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className={styles.secondaryButton}
                style={{
                  backgroundColor: isPresetSelected(preset) ? 'var(--accent-color)' : undefined,
                  borderColor: isPresetSelected(preset) ? 'var(--accent-color)' : undefined
                }}
                aria-pressed={isPresetSelected(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rapid */}
      {groupedPresets.rapid.length > 0 && (
        <div>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-xs)',
            fontWeight: 'var(--font-medium)'
          }}>
            Rapid
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {groupedPresets.rapid.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className={styles.secondaryButton}
                style={{
                  backgroundColor: isPresetSelected(preset) ? 'var(--accent-color)' : undefined,
                  borderColor: isPresetSelected(preset) ? 'var(--accent-color)' : undefined
                }}
                aria-pressed={isPresetSelected(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Training */}
      {groupedPresets.training.length > 0 && (
        <div>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-xs)',
            fontWeight: 'var(--font-medium)'
          }}>
            Training
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {groupedPresets.training.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className={styles.secondaryButton}
                style={{
                  backgroundColor: isPresetSelected(preset) ? 'var(--success-color)' : undefined,
                  borderColor: isPresetSelected(preset) ? 'var(--success-color)' : undefined
                }}
                aria-pressed={isPresetSelected(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom */}
      <div>
        <div style={{
          color: 'var(--text-muted)',
          fontSize: 'var(--text-xs)',
          marginBottom: 'var(--space-xs)',
          fontWeight: 'var(--font-medium)'
        }}>
          Custom
        </div>
        {!showCustom ? (
          <button
            onClick={handleCustomClick}
            className={styles.secondaryButton}
            aria-label="Set custom time control"
          >
            Custom Time
          </button>
        ) : (
          <div style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            alignItems: 'flex-end',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label
                htmlFor="custom-minutes"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)'
                }}
              >
                Minutes (1-180)
              </label>
              <input
                id="custom-minutes"
                type="number"
                min="1"
                max="180"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className={styles.input}
                style={{ width: '100px' }}
                aria-label="Base time in minutes"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label
                htmlFor="custom-increment"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)'
                }}
              >
                Increment (0-60s)
              </label>
              <input
                id="custom-increment"
                type="number"
                min="0"
                max="60"
                value={customIncrement}
                onChange={(e) => setCustomIncrement(e.target.value)}
                className={styles.input}
                style={{ width: '100px' }}
                aria-label="Increment in seconds"
              />
            </div>
            <button
              onClick={applyCustomTime}
              className={styles.primaryButton}
              aria-label="Apply custom time control"
            >
              Apply
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className={styles.secondaryButton}
              aria-label="Cancel custom time control"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
