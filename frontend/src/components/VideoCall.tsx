import React, { useEffect, useRef } from 'react';
import { debugError } from '../utils/debug';

interface VideoCallProps {
  gameId: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ gameId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  // Load Jitsi script once globally
  const loadJitsiScript = () => {
    if (scriptLoadedRef.current || document.querySelector('script[src*="external_api.js"]')) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://meet.ffmuc.net/external_api.js';
      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    if (!gameId || !containerRef.current) return;

    const initJitsi = async () => {
      try {
        await loadJitsiScript();
        
        if (containerRef.current && (window as any).JitsiMeetExternalAPI) {
          // Dispose previous instance if exists
          if (apiRef.current) {
            apiRef.current.dispose();
          }

          const domain = 'meet.ffmuc.net';
          const options = {
            roomName: `ChessCoach${gameId}`,
            width: '100%',
            height: 300,
            parentNode: containerRef.current,
            configOverwrite: {
              startWithAudioMuted: true,
              startWithVideoMuted: false,
              prejoinPageEnabled: false,
              requireDisplayName: false,
              enableWelcomePage: false,
              enableUserRolesBasedOnToken: false,
              enableNoAudioDetection: false,
              enableNoisyMicDetection: false
            },
            interfaceConfigOverwrite: {
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'hangup', 'settings'
              ],
              SETTINGS_SECTIONS: ['devices', 'language']
            }
          };

          apiRef.current = new (window as any).JitsiMeetExternalAPI(domain, options);
        }
      } catch (error) {
        debugError('Failed to load Jitsi API:', error);
      }
    };

    initJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [gameId]);

  if (!gameId) {
    return (
      <div style={styles.placeholder}>
        <p>Create or join a game to start video call</p>
      </div>
    );
  }

  // Fallback: Direct Jitsi link if embed fails
  const fallbackUrl = `https://meet.ffmuc.net/ChessCoach${gameId}`;

  return (
    <div style={styles.container}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={styles.fallback}>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
          Having video issues? 
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50', marginLeft: '5px' }}>
            Open video call in new tab
          </a>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '400px',
    height: '300px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative' as const
  },
  placeholder: {
    width: '400px',
    height: '300px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center' as const
  },
  fallback: {
    position: 'absolute' as const,
    bottom: '5px',
    left: '5px',
    right: '5px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: '4px',
    padding: '5px',
    color: 'white',
    textAlign: 'center' as const
  }
};