import { NetworkManager } from "./NetworkManager";
import { InputManager } from "./InputManager";

// 1. Initialisation du réseau avec la syntaxe Vite (ou le port 8080 par défaut)
const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
const networkManager = new NetworkManager(wsUrl);
networkManager.connect();

//2. On branche l'écouteur pour recevoir les données du serveur
networkManager.listen((data) => {
  console.log("Données traitées dans le main :", data);
  // Plus tard, on enverra ces données au moteur graphique (PixiJS) ici
});

// 3. Initialisation des contrôles
// À chaque touche pressée, on envoie le message généré directement au serveur
export const inputManager = new InputManager((message) => {
  networkManager.sendMessage(message);
});

console.log("Client Bomberman initialisé : Réseau et Inputs connectés.");
