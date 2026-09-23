# Protocole WebSocket - Bomberman Arena

L'architecture isole strictement la logique (Serveur) de l'affichage (Client).

## 1. Requêtes : Client -> Serveur
Les clients envoient des intentions d'actions.
- Rejoindre le lobby : `{"type": "JOIN_LOBBY", "payload": { "playerName": "Joueur1" }}`
- Déplacement : `{"type": "PLAYER_MOVE", "payload": { "direction": "UP" }}`

## 2. Réponses : Serveur -> Client
Le serveur centralise les règles et diffuse l'état officiel (Game State).
- Mise à jour Lobby : `{"type": "LOBBY_UPDATE", "payload": { "playersCount": 2, "isReady": true }}`
- État du jeu : `{"type": "GAME_STATE_UPDATE", "payload": { "players": { "p1": { "x": 5, "y": 5 } } }}`