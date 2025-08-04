import React, { useEffect, useRef } from 'react';

interface VideoCallProps {
  gameId: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ gameId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId || !containerRef.current) return;

    // Initialize Jitsi Meet
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.onload = () => {
      if (containerRef.current && (window as any).JitsiMeetExternalAPI) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: `chess-coach-${gameId}`,
          width: 400,
          height: 300,
          parentNode: containerRef.current,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'hangup', 'settings'
            ],
            SETTINGS_SECTIONS: ['devices', 'language']
          }
        };

        new (window as any).JitsiMeetExternalAPI(domain, options);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
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
    width: '400px',
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