import { NetworkManager } from "./NetworkManager";

describe("NetworkManager", () => {
  let networkManager: NetworkManager;
  let mockSend: jest.Mock;
  let fakeSocket: {
    send: jest.Mock;
    readyState: number;
    OPEN: number;
    onopen: (() => void) | null;
    onclose: (() => void) | null;
    onerror: ((err: Event) => void) | null;
    onmessage: ((event: { data: string }) => void) | null;
  };

  beforeEach(() => {
    mockSend = jest.fn();
    fakeSocket = {
      send: mockSend,
      readyState: 1, // WebSocket.OPEN
      OPEN: 1,
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    };

    const mockWebSocketConstructor = jest.fn().mockImplementation(() => fakeSocket);
    (mockWebSocketConstructor as unknown as { OPEN: number; CLOSED: number }).OPEN = 1;
    (mockWebSocketConstructor as unknown as { OPEN: number; CLOSED: number }).CLOSED = 3;

    globalThis.WebSocket = mockWebSocketConstructor as unknown as typeof WebSocket;
    networkManager = new NetworkManager("ws://localhost:8080");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("doit initialiser avec l'URL par défaut si non renseignée", () => {
    const defaultManager = new NetworkManager();
    defaultManager.connect();
    expect(globalThis.WebSocket).toHaveBeenCalledWith("ws://localhost:8080");
  });

  it("doit établir une connexion et déclencher les callbacks réseau", () => {
    networkManager.connect();
    expect(globalThis.WebSocket).toHaveBeenCalledWith("ws://localhost:8080");

    if (fakeSocket.onopen) fakeSocket.onopen();
    if (fakeSocket.onclose) fakeSocket.onclose();
    if (fakeSocket.onerror) fakeSocket.onerror(new Event("error"));
  });

  it("doit envoyer un message JSON lorsque le socket est ouvert", () => {
    networkManager.connect();
    const testPayload = { type: "PLAYER_MOVE", payload: { direction: "UP" } };

    networkManager.sendMessage(testPayload);
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify(testPayload));
  });

  it("doit ignorer l'envoi si le socket n'est pas connecté ou fermé", () => {
    // Sans connect()
    networkManager.sendMessage({ type: "PLACE_BOMB" });
    expect(mockSend).not.toHaveBeenCalled();

    // Avec socket fermé
    networkManager.connect();
    fakeSocket.readyState = 3; // CLOSED
    networkManager.sendMessage({ type: "PLACE_BOMB" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("doit avertir si listen() est appelé sans connexion préalable", () => {
    const callback = jest.fn();
    networkManager.listen(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("doit écouter et parser les messages entrants valides", () => {
    networkManager.connect();
    const callback = jest.fn();
    networkManager.listen(callback);

    const incomingData = { event: "POSITION_UPDATED", data: { x: 1, y: 1 } };
    if (fakeSocket.onmessage) {
      fakeSocket.onmessage({ data: JSON.stringify(incomingData) });
    }

    expect(callback).toHaveBeenCalledWith(incomingData);
  });

  it("doit gérer les erreurs de parsing JSON dans onmessage sans planter", () => {
    networkManager.connect();
    const callback = jest.fn();
    networkManager.listen(callback);

    if (fakeSocket.onmessage) {
      fakeSocket.onmessage({ data: "INVALID_JSON_STRING" });
    }

    expect(callback).not.toHaveBeenCalled();
  });
});
