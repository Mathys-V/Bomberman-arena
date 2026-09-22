import { WebSocketServer } from 'ws';

/**
 * Initialise le serveur WebSocket du moteur de jeu Bomberman.
 * @param {number} port - Le port d'écoute du serveur.
 * @returns {WebSocketServer} L'instance du serveur.
 */
export function startServer(port: number) {
    const wss = new WebSocketServer({ port });
    console.log(`Serveur WebSocket démarré sur le port ${port}`);
    return wss;
}

// Lancement automatique si exécuté directement
if (require.main === module) {
    startServer(8080);
}