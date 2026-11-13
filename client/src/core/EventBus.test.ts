import { EventBus } from "./EventBus";
import { PlayerPositionUpdate } from "../types/game";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it("permet d'émettre et de recevoir un événement 'player:moved'", () => {
    const received: PlayerPositionUpdate[] = [];

    bus.on("player:moved", (payload) => {
      received.push(payload);
    });

    const update: PlayerPositionUpdate = {
      playerId: "p1",
      x: 3,
      y: 5,
      direction: "DOWN",
    };

    bus.emit("player:moved", update);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(update);
  });

  it("gère plusieurs écouteurs pour un même événement", () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    bus.on("network:status", fn1);
    bus.on("network:status", fn2);

    bus.emit("network:status", "connected");

    expect(fn1).toHaveBeenCalledWith("connected");
    expect(fn2).toHaveBeenCalledWith("connected");
  });

  it("permet de se désabonner via la fonction retournée", () => {
    const callback = jest.fn();
    const unsubscribe = bus.on("network:status", callback);

    expect(bus.listenerCount("network:status")).toBe(1);

    unsubscribe();

    expect(bus.listenerCount("network:status")).toBe(0);

    bus.emit("network:status", "disconnected");
    expect(callback).not.toHaveBeenCalled();
  });

  it("nettoie tous les écouteurs avec clear()", () => {
    bus.on("player:moved", jest.fn());
    bus.on("network:status", jest.fn());

    bus.clear();

    expect(bus.listenerCount("player:moved")).toBe(0);
    expect(bus.listenerCount("network:status")).toBe(0);
  });

  it("ne lève pas d'erreur lors de l'émission sans écouteur", () => {
    expect(() => {
      bus.emit("player:moved", { playerId: "p1", x: 0, y: 0 });
    }).not.toThrow();
  });
});
