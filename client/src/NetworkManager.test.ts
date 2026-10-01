import { NetworkManager } from "./NetworkManager";

describe("NetworkManager", () => {
  let networkManager: NetworkManager;
  let mockSend: jest.Mock;

  beforeEach(() => {
    // Fabrique un faux WebSocket pour tromper la classe
    mockSend = jest.fn();
    global.WebSocket = jest.fn().mockImplementation(() => ({
      send: mockSend,
      readyState: 1, // 1 signifie que la connexion est ouverte (WebSocket.OPEN)
      OPEN: 1,
    })) as any;

    // Prépare une instance toute neuve avant chaque test
    networkManager = new NetworkManager("ws://localhost:8080");
  });

  afterEach(() => {
    // Nettoie les compteurs de notre faux WebSocket
    jest.clearAllMocks();
  });

  it("doit établir une connexion avec la bonne URL", () => {
    networkManager.connect();

    // Vérifie que 'new WebSocket' a bien été appelé avec notre port
    expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:8080");
  });

  it("doit envoyer un message JSON correctement formaté", () => {
    networkManager.connect();
    const testPayload = { type: "PLAYER_MOVE", payload: { direction: "UP" } };

    networkManager.sendMessage(testPayload);

    // Vérifie que la méthode d'envoi a bien reçu notre objet transformé en texte
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify(testPayload));
  });
});
