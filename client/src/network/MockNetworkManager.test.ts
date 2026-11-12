import { MockNetworkManager } from "./MockNetworkManager";

describe("MockNetworkManager", () => {
  const testMap = [
    "###",
    "#.#",
    "###",
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("gère la connexion sans lever d'erreur", () => {
    const mock = new MockNetworkManager();
    expect(() => mock.connect()).not.toThrow();
  });

  it("répond avec POSITION_UPDATED lors de l'envoi d'un PLAYER_MOVE valide", () => {
    const freeMap = [
      "...",
      "...",
      "...",
    ];
    const mock = new MockNetworkManager(freeMap);
    const callback = jest.fn();
    mock.listen(callback);

    mock.sendMessage({
      type: "PLAYER_MOVE",
      payload: { direction: "RIGHT" },
    });

    expect(callback).toHaveBeenCalledWith({
      event: "POSITION_UPDATED",
      data: {
        playerId: "p1",
        x: 2,
        y: 1,
        direction: "RIGHT",
      },
    });
  });

  it("bloque le déplacement si la case cible est un obstacle", () => {
    const mock = new MockNetworkManager(testMap);
    const callback = jest.fn();
    mock.listen(callback);

    // Depuis (1, 1), aller à UP mène à (1, 0) qui est '#'
    mock.sendMessage({
      type: "PLAYER_MOVE",
      payload: { direction: "UP" },
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("permet d'injecter des déplacements distants pour le Joueur 2", () => {
    const mock = new MockNetworkManager();
    const callback = jest.fn();
    mock.listen(callback);

    mock.simulateRemoteMove({
      playerId: "p2",
      x: 10,
      y: 11,
      direction: "LEFT",
    });

    expect(callback).toHaveBeenCalledWith({
      event: "POSITION_UPDATED",
      data: {
        playerId: "p2",
        x: 10,
        y: 11,
        direction: "LEFT",
      },
    });
  });

  it("exécute la patrouille automatique du bot et peut être stoppée", () => {
    const mock = new MockNetworkManager();
    const callback = jest.fn();
    mock.listen(callback);

    mock.startBotSimulation(500);

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);

    mock.stopBotSimulation();
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("nettoie les écouteurs et le timer lors du disconnect()", () => {
    const mock = new MockNetworkManager();
    const callback = jest.fn();
    mock.listen(callback);
    mock.startBotSimulation(100);

    mock.disconnect();
    jest.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();
  });
});
