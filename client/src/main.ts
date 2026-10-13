import { NetworkManager } from "./NetworkManager";
import { InputManager } from "./InputManager";

// 1. Initialisation du réseau avec la syntaxe Vite (ou le port 8080 par défaut)
const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
const networkManager = new NetworkManager(wsUrl);
networkManager.connect();

// 2. Initialisation des contrôles
// À chaque touche pressée, on envoie le message généré directement au serveur
export const inputManager = new InputManager((message) => {
  networkManager.sendMessage(message);
});

console.log("Client Bomberman initialisé : Réseau et Inputs connectés.");
