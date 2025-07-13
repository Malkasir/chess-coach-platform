import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const connectWS = (gameId: string,
                          onMove: (fen: string) => void) => {

  const client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    debug: () => {}        // silence logs
  });

  client.onConnect = () => {
    client.subscribe(`/topic/game.${gameId}`, msg => {
      const { fen } = JSON.parse(msg.body);
      onMove(fen);
    });
  };

  client.activate();
  return client;
};
