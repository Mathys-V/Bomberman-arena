// server/src/network/WebSocketServer.ts
import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { EventRouter } from './EventRouter';

export class WebSocketServer {
  private wss: WSServer | null = null;

  public start(port: number): void {
    this.wss = new WSServer({ port });

    console.log(`[WebSocket] Serveur démarré sur le port ${port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Nouveau client connecté.');

      ws.on('message', (rawMessage: string) => {
        console.log(`[WebSocket] Reçu : ${rawMessage}`);

        const response = EventRouter.handleMessage(rawMessage.toString());

        if (response) {
          ws.send(JSON.stringify(response));
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client déconnecté.');
      });
    });
  }

  public stop(): void {
    if (this.wss) {
      this.wss.close();
      console.log('[WebSocket] Serveur arrêté.');
    }
  }
}