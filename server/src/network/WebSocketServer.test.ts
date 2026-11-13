import { WebSocketServer } from './WebSocketServer';
import WebSocket from 'ws';

describe('WebSocketServer Wrapper', () => {
  const PORT = 8092;
  let wsServer: WebSocketServer;

  beforeEach(() => {
    wsServer = new WebSocketServer();
  });

  afterEach(() => {
    wsServer.stop();
  });

  it('devrait démarrer le serveur, router un message et s arrêter proprement', (done) => {
    wsServer.start(PORT);

    const client = new WebSocket(`ws://localhost:${PORT}`);

    client.on('open', () => {
      client.send(JSON.stringify({
        event: 'PLAYER_MOVE',
        data: { direction: 'UP', playerId: 'test_p1' }
      }));
    });

    client.on('message', (messageData) => {
      const response = JSON.parse(messageData.toString());
      expect(response.event).toBe('POSITION_UPDATED');
      expect(response.data.direction).toBe('UP');

      client.close();
    });

    client.on('close', () => {
      // Attendre un court délai pour que le serveur traite la fermeture côté socket
      setTimeout(() => {
        done();
      }, 50);
    });
  });

  it('ne devrait rien faire si stop() est appelé sans démarrage préalable', () => {
    expect(() => wsServer.stop()).not.toThrow();
  });
});
