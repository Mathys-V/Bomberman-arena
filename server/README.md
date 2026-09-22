# Backend - Bomberman Arena

## Lancement du projet
1. Installer les dépendances : `npm install`
2. Lancer le serveur : `npm start`
3. Lancer les tests : `npm test`

## Architecture et Protocole WebSocket
Le serveur centralise la logique métier pour éviter la triche. Le client envoie des intentions, le serveur diffuse l'état officiel.

### Client -> Serveur (Intentions)
- Déplacement : `{"action": "MOVE", "payload": {"direction": "UP", "playerId": "p1"}}`
- Bombe : `{"action": "PLACE_BOMB", "payload": {"playerId": "p1"}}`

### Serveur -> Client (État officiel)
- Mise à jour de la grille : 
```json
{
  "type": "GAME_STATE_UPDATE",
  "payload": {
    "players": { "p1": { "x": 5, "y": 2 } }
  }
}