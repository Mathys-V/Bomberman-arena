// server/src/network/EventRouter.test.ts
import { EventRouter } from './EventRouter';

describe('EventRouter (WebSocket Logic)', () => {
  it('doit traiter correctement l événement JOIN_LOBBY', () => {
    const raw = JSON.stringify({
      event: 'JOIN_LOBBY',
      data: { lobbyId: 'room_123', playerId: 'p1', name: 'Player' }
    });

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('LOBBY_UPDATED');

    // Assertion de type pour satisfaire TypeScript
    const data = response?.data as {
      lobbyId: string;
      players: Array<{ name: string }>;
    };

    expect(data.lobbyId).toBe('room_123');
    expect(data.players[0].name).toBe('Player');
  });

  it('doit retourner une erreur si le JSON est mal formé', () => {
    const raw = 'Ceci n est pas du JSON';

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('ERROR');

    // Assertion de type pour l'erreur
    const data = response?.data as { code: string };
    expect(data.code).toBe('INVALID_JSON');
  });
});