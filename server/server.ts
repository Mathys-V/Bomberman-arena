// server/server.ts
import http from 'http';
import { WebSocketServer } from 'ws';
import { EventRouter } from './src/network/EventRouter';

// Serveur HTTP de base pour Jest
export const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bomberman Arena Server\n');
});

export const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Nouveau client connecté');

  ws.on('message', (rawMessage) => {
    const messageString = rawMessage.toString();
    console.log(`[WebSocket] Message reçu : ${messageString}`);

    // Routage du message via EventRouter
    const response = EventRouter.handleMessage(messageString);

    // Envoi de la réponse au client
    if (response) {
      ws.send(JSON.stringify(response));
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client déconnecté');
  });
});

const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[WebSocket] Serveur démarré sur le port ${PORT}`);
  });
}