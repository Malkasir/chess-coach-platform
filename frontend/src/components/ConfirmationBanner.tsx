import React, { useState } from 'react';
import styles from '../styles/shared.module.css';

interface ConfirmationBannerProps {
  message: string;
  roomCode?: string;
  onCopyRoomCode?: () => void;
  onDismiss?: () => void;
  variant?: 'success' | 'info' | 'warning';
}

export const ConfirmationBanner: React.FC<ConfirmationBannerProps> = ({
  message,
  roomCode,
  onCopyRoomCode,
  onDismiss,
  variant = 'success',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (roomCode && onCopyRoomCode) {
      onCopyRoomCode();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'info':
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px', // Below header
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: '600px',
        width: '90%',
        animation: 'slideDown 0.3s ease-out',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div
        style={{
          background: getBackgroundColor(),
          color: 'white',
          padding: 'var(--space-lg)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-md)'
        }}
      >
        {/* Message */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: roomCode ? 'var(--space-sm)' : 0
          }}>
            {message}
          </div>

          {/* Room Code Display */}
          {roomCode && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginTop: 'var(--space-sm)'
            }}>
              <span style={{ fontSize: 'var(--text-sm)', opacity: 0.9 }}>
                Room Code:
              </span>
              <code
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-bold)',
                  letterSpacing: '0.2em',
                  padding: 'var(--space-xs) var(--space-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  fontFamily: 'monospace'
                }}
              >
                {roomCode}
              </code>
              {onCopyRoomCode && (
                <button
                  onClick={handleCopy}
                  style={{
                    padding: 'var(--space-xs) var(--space-md)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: 'var(--space-sm)',
              fontSize: 'var(--text-lg)',
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
