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

  it("bloque le déplacement si la case cible est un obstacle ou hors limites", () => {
    const mock = new MockNetworkManager(testMap);
    const callback = jest.fn();
    mock.listen(callback);

    // Depuis (1, 1), aller à UP mène à (1, 0) qui est '#'
    mock.sendMessage({
      type: "PLAYER_MOVE",
      payload: { direction: "UP" },
    });

    expect(callback).not.toHaveBeenCalled();

    // Test avec une carte vide pour couvrir le cas row inexistant
    const emptyMapMock = new MockNetworkManager([]);
    const cbEmpty = jest.fn();
    emptyMapMock.listen(cbEmpty);
    emptyMapMock.sendMessage({
      event: "PLAYER_MOVE",
      data: { direction: "DOWN" },
    });
    expect(cbEmpty).not.toHaveBeenCalled();
  });

  it("simule la pose d'une bombe, son explosion en croix et la destruction d'une caisse", () => {
    const arenaMap = [
      "#####",
      "#..B#",
      "#.#.#",
      "#...#",
      "#####",
    ];
    const mock = new MockNetworkManager(arenaMap, 1500, 2);
    const callback = jest.fn();
    mock.listen(callback);

    // J1 est en (1,1) et pose une bombe
    mock.sendMessage({ type: "PLACE_BOMB", payload: {} });

    expect(callback).toHaveBeenCalledWith({
      event: "BOMB_PLACED",
      data: {
        bombId: "mock-bomb-1",
        playerId: "p1",
        x: 1,
        y: 1,
        radius: 2,
      },
    });

    // Avant expiration du délai, pas encore d'explosion
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Explosion déclenchée à 1500ms
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith({
      event: "BOMB_EXPLODED",
      data: {
        bombId: "mock-bomb-1",
        x: 1,
        y: 1,
        affectedTiles: [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 1, y: 2 },
          { x: 1, y: 3 },
        ],
        destroyedCrates: [{ x: 3, y: 1 }],
      },
    });

    // La caisse en (3,1) étant détruite, J1 peut maintenant s'y rendre
    mock.sendMessage({ type: "PLAYER_MOVE", payload: { direction: "RIGHT" } });
    mock.sendMessage({ type: "PLAYER_MOVE", payload: { direction: "RIGHT" } });
    expect(callback).toHaveBeenLastCalledWith({
      event: "POSITION_UPDATED",
      data: {
        playerId: "p1",
        x: 3,
        y: 1,
        direction: "RIGHT",
      },
    });
  });

  it("gère l'explosion de bombe même sans carte définie", () => {
    const mock = new MockNetworkManager(undefined, 500, 1);
    const callback = jest.fn();
    mock.listen(callback);

    mock.sendMessage({ event: "PLACE_BOMB", data: {} });
    jest.advanceTimersByTime(500);

    expect(callback).toHaveBeenLastCalledWith({
      event: "BOMB_EXPLODED",
      data: {
        bombId: "mock-bomb-1",
        x: 1,
        y: 1,
        affectedTiles: [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 0, y: 1 },
          { x: 1, y: 2 },
          { x: 1, y: 0 },
        ],
        destroyedCrates: [],
      },
    });
  });

  it("simule l'événement JOIN_LOBBY et répond avec LOBBY_UPDATED", () => {
    const mock = new MockNetworkManager();
    const callback = jest.fn();
    mock.listen(callback);

    mock.sendMessage({
      type: "JOIN_LOBBY",
      payload: { playerName: "Lukas" },
    });

    expect(callback).toHaveBeenCalledWith({
      event: "LOBBY_UPDATED",
      data: {
        lobbyId: "mock_room",
        status: "waiting",
        players: [{ id: "p1", name: "Lukas", ready: true }],
      },
    });

    // Sans pseudo fourni -> repli sur Player1
    mock.sendMessage({ event: "JOIN_LOBBY", data: {} });
    expect(callback).toHaveBeenLastCalledWith({
      event: "LOBBY_UPDATED",
      data: {
        lobbyId: "mock_room",
        status: "waiting",
        players: [{ id: "p1", name: "Player1", ready: true }],
      },
    });
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

  it("exécute la patrouille automatique du bot et ignore un second démarrage", () => {
    const mock = new MockNetworkManager();
    const callback = jest.fn();
    mock.listen(callback);

    mock.startBotSimulation(500);
    mock.startBotSimulation(500); // ne doit pas créer de second timer

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);

    mock.stopBotSimulation();
    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("nettoie les écouteurs, le bot et les minuteries de bombes lors du disconnect()", () => {
    const mock = new MockNetworkManager(undefined, 200, 1);
    const callback = jest.fn();
    mock.listen(callback);
    mock.startBotSimulation(100);
    mock.sendMessage({ type: "PLACE_BOMB", payload: {} });

    expect(callback).toHaveBeenCalledTimes(1); // BOMB_PLACED uniquement

    mock.disconnect();
    jest.advanceTimersByTime(500);

    // Aucun événement supplémentaire (ni bot, ni explosion) après disconnect
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
