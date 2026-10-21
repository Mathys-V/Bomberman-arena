// server/src/network/WebSocket.integration.test.ts
import WebSocket from "ws";
import { server, wss } from "../../server";

describe("Intégration WebSockets : Communication Client-Serveur", () => {
  let wsClient: WebSocket;
  const TEST_PORT = 8085;

  beforeAll((done) => {
    server.listen(TEST_PORT, () => {
      setTimeout(done, 500);
    });
  });

  afterAll((done) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
    wss.close(() => {
      server.close(() => {
        done();
      });
    });
  });

  it("devrait recevoir un POSITION_UPDATED après avoir envoyé un PLAYER_MOVE", (done) => {
    wsClient = new WebSocket(`ws://localhost:${TEST_PORT}`);

    wsClient.on("open", () => {
      const moveEvent = {
        event: "PLAYER_MOVE",
        data: { direction: "RIGHT", playerId: "p1", x: 0, y: 0 },
      };
      wsClient.send(JSON.stringify(moveEvent));
    });

    wsClient.on("message", (messageData) => {
      const response = JSON.parse(messageData.toString());

      if (response.event === "POSITION_UPDATED") {
        expect(response.data).toBeDefined();
        done();
      }
    });
  });
});