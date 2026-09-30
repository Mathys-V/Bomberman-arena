// server/src/network/EventRouter.test.ts
import { EventRouter } from './EventRouter';

describe('EventRouter (WebSocket Logic)', () => {
  it('doit traiter correctement l événement JOIN_LOBBY', () => {
    const raw = JSON.stringify({
      event: 'JOIN_LOBBY',
      data: { lobbyId: 'room_123', playerId: 'p1', name: 'Alice' }
    });

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('LOBBY_UPDATED');
    expect(response?.data.lobbyId).toBe('room_123');
    expect(response?.data.players[0].name).toBe('Alice');
  });

  it('doit retourner une erreur si le JSON est mal formé', () => {
    const raw = 'Ceci n est pas du JSON';

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('ERROR');
    expect(response?.data.code).toBe('INVALID_JSON');
  });
});