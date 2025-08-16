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
      script.src = 'https://meet.jit.si/external_api.js';
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

          const domain = 'meet.jit.si';
          const options = {
            roomName: `room${gameId}`,
            width: '100%',
            height: 300,
            parentNode: containerRef.current,
            configOverwrite: {
              startWithAudioMuted: true,
              startWithVideoMuted: false,
              prejoinPageEnabled: false,
              requireDisplayName: false,
              enableWelcomePage: false,
              enableUserRolesBasedOnToken: false
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

  return <div ref={containerRef} style={styles.container} />;
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '400px',
    height: '300px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    overflow: 'hidden'
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
  }
};