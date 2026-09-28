import WebSocket from "ws";
// TODO: Tu devras importer ici la fonction qui démarre le serveur de tes collègues Back
// import { startServer } from '../server';

describe.skip("Intégration WebSockets : Communication Client-Serveur", () => {
  let wsClient: WebSocket;
  const TEST_PORT = 8085; // Un port différent du port de dev pour éviter les conflits

  beforeAll((done) => {
    // Démarrer le serveur de test (à adapter selon le code du Backend)
    // startServer(TEST_PORT);

    // Laisser un petit délai pour que le serveur démarre
    setTimeout(done, 500);
  });

  afterAll((done) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
    // TODO: Ajouter la fonction pour couper le serveur proprement
    // stopServer();
    done();
  });

  it.skip("devrait recevoir un GAME_STATE_UPDATE après avoir envoyé un PLAYER_MOVE", (done) => {
    // 1. Connexion du "faux" client au serveur
    wsClient = new WebSocket(`ws://localhost:${TEST_PORT}`);

    wsClient.on("open", () => {
      // 2. Le client est connecté, on simule une action du joueur
      const moveEvent = {
        type: "PLAYER_MOVE",
        payload: { direction: "RIGHT" },
      };
      wsClient.send(JSON.stringify(moveEvent));
    });

    // 3. On écoute la réponse du serveur
    wsClient.on("message", (data) => {
      const response = JSON.parse(data.toString());

      // 4. On vérifie que le contrat est respecté
      if (response.type === "GAME_STATE_UPDATE") {
        expect(response.payload).toBeDefined();
        expect(response.payload.players).toBeDefined();

        // Si on arrive ici, le test est réussi !
        done();
      }
    });
  });
});
