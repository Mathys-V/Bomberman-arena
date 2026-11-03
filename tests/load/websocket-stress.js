import ws from "k6/ws";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "15s", target: 30 },
    { duration: "30s", target: 30 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    // Le test échouera si 95% des joueurs mettent plus de 500ms à se connecter
    ws_connecting: ["p(95)<500"],
  },
};

export default function () {
  const url = "ws://localhost:8080";

  const res = ws.connect(url, null, function (socket) {
    socket.on("open", () => {
      socket.setInterval(function () {
        socket.send(
          JSON.stringify({ type: "PLAYER_MOVE", payload: { direction: "UP" } }),
        );
      }, 500);

      socket.setInterval(function () {
        socket.send(JSON.stringify({ type: "PLACE_BOMB", payload: {} }));
      }, 2000);

      // On ferme proprement la connexion après 10 secondes
      socket.setTimeout(function () {
        socket.close();
      }, 10000);
    });

    socket.on("error", function (e) {
      if (e.error() != "websocket: close sent") {
        console.log("Erreur WebSocket: ", e.error());
      }
    });
  });

  check(res, { "Connexion WS réussie (101)": (r) => r && r.status === 101 });
}
