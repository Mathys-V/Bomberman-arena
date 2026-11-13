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

    const data = response?.data as {
      lobbyId: string;
      players: Array<{ name: string }>;
    };

    expect(data.lobbyId).toBe('room_123');
    expect(data.players[0].name).toBe('Player');
  });

  it('doit appliquer les valeurs par défaut pour JOIN_LOBBY si data est incomplet', () => {
    const raw = JSON.stringify({
      event: 'JOIN_LOBBY',
      data: {}
    });

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('LOBBY_UPDATED');

    const data = response?.data as {
      lobbyId: string;
      players: Array<{ id: string; name: string }>;
    };

    expect(data.lobbyId).toBe('default_room');
    expect(data.players[0].id).toBe('unknown');
    expect(data.players[0].name).toBe('Player');
  });

  it('doit traiter correctement l événement PLAYER_MOVE', () => {
    const raw = JSON.stringify({
      event: 'PLAYER_MOVE',
      data: { direction: 'RIGHT', playerId: 'p1', x: 2, y: 3 }
    });

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('POSITION_UPDATED');

    const data = response?.data as {
      direction: string;
      playerId: string;
      x: number;
      y: number;
    };

    expect(data.direction).toBe('RIGHT');
    expect(data.playerId).toBe('p1');
    expect(data.x).toBe(2);
    expect(data.y).toBe(3);
  });

  it('doit renvoyer UNKNOWN_EVENT pour un événement non reconnu', () => {
    const raw = JSON.stringify({
      event: 'NON_EXISTING_EVENT',
      data: {}
    });

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('ERROR');

    const data = response?.data as { code: string };
    expect(data.code).toBe('UNKNOWN_EVENT');
  });

  it('doit retourner une erreur si le JSON est mal formé', () => {
    const raw = 'Ceci n est pas du JSON';

    const response = EventRouter.handleMessage(raw);

    expect(response).not.toBeNull();
    expect(response?.event).toBe('ERROR');

    const data = response?.data as { code: string };
    expect(data.code).toBe('INVALID_JSON');
  });
});
