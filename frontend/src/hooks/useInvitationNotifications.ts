import { useEffect, useCallback, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../services/auth-service';
import { debugLog, debugError } from '../utils/debug';

export interface InvitationMessage {
  type: 'NEW_INVITATION' | 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED' | 'INVITATION_EXPIRED' | 'INVITATION_CANCELLED' | 'GAME_READY' | 'USER_STATUS_UPDATE';
  invitationId?: number;
  senderId?: number;
  senderName?: string;
  recipientId?: number;
  recipientName?: string;
  gameType?: string;
  senderColor?: string;
  message?: string;
  gameId?: string;
  roomCode?: string;
  timestamp: string;
}

export interface InvitationNotificationCallbacks {
  onNewInvitation?: (invitation: InvitationMessage) => void;
  onInvitationAccepted?: (invitation: InvitationMessage) => void;
  onInvitationDeclined?: (invitation: InvitationMessage) => void;
  onInvitationCancelled?: (invitation: InvitationMessage) => void;
  onGameReady?: (invitation: InvitationMessage) => void;
  onUserStatusUpdate?: (invitation: InvitationMessage) => void;
}

export const useInvitationNotifications = (
  userId: string | null,
  authService: AuthService | null,
  callbacks: InvitationNotificationCallbacks
) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Determine base URL for WebSocket connection
  const determineBaseUrl = useCallback((): string => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }

    console.error('VITE_API_BASE_URL is not set for production build!');
    return 'about:blank';
  }, []);

  const setupWebSocketClient = useCallback(() => {
    const baseUrl = determineBaseUrl();

    const client = new Client({
      webSocketFactory: () => {
        const sockJsUrl = `${baseUrl}/chess-websocket`;
        debugLog('🔗 Creating invitation notification WebSocket connection to:', sockJsUrl);
        return new SockJS(sockJsUrl);
      },
      debug: (str) => debugLog('🔔 Invitation WebSocket: ' + str),
      onConnect: (frame) => {
        debugLog('✅ Invitation notifications WebSocket connected', frame);
        setConnectionStatus('connected');
      },
      onDisconnect: (frame) => {
        debugLog('❌ Invitation notifications WebSocket disconnected', frame);
        setConnectionStatus('disconnected');
      },
      onStompError: (frame) => {
        debugError('💥 Invitation WebSocket STOMP error:', frame);
        setConnectionStatus('error');
      },
      onWebSocketError: (event) => {
        debugError('🔌 Invitation WebSocket error:', event);
        setConnectionStatus('error');
      },
      onWebSocketClose: (event) => {
        debugLog('🔌 Invitation WebSocket closed:', event);
        setConnectionStatus('disconnected');
      },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000
    });

    return client;
  }, [determineBaseUrl]);

  const handleInvitationMessage = useCallback((message: InvitationMessage) => {
    debugLog('📨 Received invitation notification:', message);

    switch (message.type) {
      case 'NEW_INVITATION':
        callbacks.onNewInvitation?.(message);
        break;
      case 'INVITATION_ACCEPTED':
        callbacks.onInvitationAccepted?.(message);
        break;
      case 'INVITATION_DECLINED':
        callbacks.onInvitationDeclined?.(message);
        break;
      case 'INVITATION_CANCELLED':
        callbacks.onInvitationCancelled?.(message);
        break;
      case 'GAME_READY':
        callbacks.onGameReady?.(message);
        break;
      case 'USER_STATUS_UPDATE':
        callbacks.onUserStatusUpdate?.(message);
        break;
      default:
        debugLog('⚠️ Unknown invitation message type:', message.type);
    }
  }, [callbacks]);

  const connectToNotifications = useCallback(async () => {
    if (!userId || !authService) {
      debugLog('⚠️ Cannot connect to invitation notifications: missing userId or authService');
      return;
    }

    if (clientRef.current?.connected) {
      debugLog('✅ Invitation notifications already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');

      const client = setupWebSocketClient();
      clientRef.current = client;

      client.activate();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        const checkConnection = () => {
          attempts++;
          if (client.connected) {
            debugLog('✅ Invitation WebSocket connected successfully!');
            resolve();
          } else if (attempts >= maxAttempts) {
            debugError('❌ Invitation WebSocket connection timeout after 5 seconds');
            reject(new Error('WebSocket connection timeout'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });

      // Subscribe to user-specific notification topic
      const topic = `/topic/user/${userId}/notifications`;
      debugLog('🔔 Subscribing to invitation notifications topic:', topic);

      subscriptionRef.current = client.subscribe(topic, (message) => {
        try {
          const invitationMessage: InvitationMessage = JSON.parse(message.body);
          handleInvitationMessage(invitationMessage);
        } catch (error) {
          debugError('❌ Error parsing invitation message:', error);
        }
      });

      debugLog('✅ Successfully subscribed to invitation notifications');

    } catch (error) {
      debugError('❌ Error connecting to invitation notifications:', error);
      setConnectionStatus('error');
    }
  }, [userId, authService, setupWebSocketClient, handleInvitationMessage]);

  const disconnectFromNotifications = useCallback(() => {
    debugLog('🔌 Disconnecting from invitation notifications...');

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (error) {
        debugError('⚠️ Error during invitation WebSocket disconnect:', error);
      }
      clientRef.current = null;
    }

    setConnectionStatus('disconnected');
    debugLog('✅ Invitation notifications disconnected and cleaned up');
  }, []);

  // Connect when userId and authService are available
  useEffect(() => {
    if (userId && authService) {
      connectToNotifications();
    } else {
      disconnectFromNotifications();
    }

    return () => {
      disconnectFromNotifications();
    };
  }, [userId, authService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromNotifications();
    };
  }, []);

  return {
    connectionStatus,
    reconnect: connectToNotifications,
    disconnect: disconnectFromNotifications
  };
};