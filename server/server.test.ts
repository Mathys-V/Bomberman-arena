// server/server.test.ts
import { WebSocketServer } from './src/network/WebSocketServer';

describe('WebSocketServer', () => {
  it('doit pouvoir s instancier sans erreur', () => {
    const server = new WebSocketServer();
    expect(server).toBeDefined();
  });
});