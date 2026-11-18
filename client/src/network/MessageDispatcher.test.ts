import { EventBus } from "../core/EventBus";
import { MessageDispatcher } from "./MessageDispatcher";

describe("MessageDispatcher", () => {
  let eventBus: EventBus;
  let dispatcher: MessageDispatcher;

  beforeEach(() => {
    eventBus = new EventBus();
    dispatcher = new MessageDispatcher(eventBus);
  });

  it("route POSITION_UPDATED vers 'player:moved'", () => {
    const handler = jest.fn();
    eventBus.on("player:moved", handler);

    const dispatched = dispatcher.dispatch({
      event: "POSITION_UPDATED",
      data: { playerId: "p1", x: 2, y: 3, direction: "RIGHT" },
    });

    expect(dispatched).toBe(true);
    expect(handler).toHaveBeenCalledWith({
      playerId: "p1",
      x: 2,
      y: 3,
      direction: "RIGHT",
    });
  });

  it("route BOMB_PLACED vers 'bomb:placed'", () => {
    const handler = jest.fn();
    eventBus.on("bomb:placed", handler);

    const dispatched = dispatcher.dispatch({
      event: "BOMB_PLACED",
      data: { bombId: "b1", playerId: "p1", x: 1, y: 1, radius: 2 },
    });

    expect(dispatched).toBe(true);
    expect(handler).toHaveBeenCalledWith({
      bombId: "b1",
      playerId: "p1",
      x: 1,
      y: 1,
      radius: 2,
    });
  });

  it("route BOMB_EXPLODED vers 'bomb:exploded'", () => {
    const handler = jest.fn();
    eventBus.on("bomb:exploded", handler);

    const dispatched = dispatcher.dispatch({
      event: "BOMB_EXPLODED",
      data: {
        bombId: "b1",
        x: 1,
        y: 1,
        affectedTiles: [{ x: 1, y: 1 }],
        destroyedCrates: [{ x: 2, y: 1 }],
      },
    });

    expect(dispatched).toBe(true);
    expect(handler).toHaveBeenCalledWith({
      bombId: "b1",
      x: 1,
      y: 1,
      affectedTiles: [{ x: 1, y: 1 }],
      destroyedCrates: [{ x: 2, y: 1 }],
    });
  });

  it("route GRID_UPDATED vers 'grid:updated'", () => {
    const handler = jest.fn();
    eventBus.on("grid:updated", handler);

    const dispatched = dispatcher.dispatch({
      type: "GRID_UPDATED",
      payload: {
        grid: [
          [1, 1],
          [1, 0],
        ],
      },
    });

    expect(dispatched).toBe(true);
    expect(handler).toHaveBeenCalledWith({
      grid: [
        [1, 1],
        [1, 0],
      ],
    });
  });

  it("route LOBBY_UPDATED vers 'lobby:updated'", () => {
    const handler = jest.fn();
    eventBus.on("lobby:updated", handler);

    const dispatched = dispatcher.dispatch({
      event: "LOBBY_UPDATED",
      data: {
        lobbyId: "room1",
        status: "waiting",
        players: [{ id: "p1", name: "Lukas", ready: true }],
      },
    });

    expect(dispatched).toBe(true);
    expect(handler).toHaveBeenCalledWith({
      lobbyId: "room1",
      status: "waiting",
      players: [{ id: "p1", name: "Lukas", ready: true }],
    });
  });

  it("route GAME_OVER vers 'game:over'", () => {
    const handler = jest.fn();
    eventBus.on("game:over", handler);

    const dispatched = dispatcher.dispatch({
      event: "GAME_OVER",
      data: { winnerId: "p2", reason: "elimination" },
    });

    expect(dispatched).toBe(true);
    expect(handler).toHaveBeenCalledWith({
      winnerId: "p2",
      reason: "elimination",
    });
  });

  it("retourne false pour un événement inconnu ou malformé", () => {
    expect(dispatcher.dispatch({ event: "UNKNOWN", data: {} })).toBe(false);
    expect(dispatcher.dispatch(null)).toBe(false);
    expect(dispatcher.dispatch("invalid")).toBe(false);
  });
});
