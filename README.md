# Bomberman Arena

Bienvenue sur Bomberman Arena, un jeu multijoueur en temps réel basé sur une architecture Client-Serveur.

## Technologies utilisées

- Client : TypeScript, Vite, PixiJS (Moteur graphique), Tauri (Exécutables de bureau).
- Serveur : Node.js, TypeScript, WebSockets (ws), Docker.
- DevOps & Qualité : GitHub Actions, SonarCloud, Docker Compose, Jest (Tests unitaires), Cypress (Tests E2E), k6 (Tests de charge).

## Démarrage rapide

### Mode Standard (Node.js)

1. Installation des dépendances (à la racine) :
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. Lancement du Serveur (Port 8080) :
   ```bash
   cd server
   npm start
   ```

3. Lancement du Client (Port 5173) :
   ```bash
   cd client
   npm run dev
   ```

### Mode Conteneurisé (Docker - Serveur uniquement)

Conformément aux exigences du sujet, le serveur backend est entièrement conteneurisé :

```bash
# Démarrage du serveur conteneurisé via Docker Compose
docker compose up --build -d

# Vérification des logs
docker compose logs -f bomberman-server

# Arrêt du conteneur
docker compose down
```

## Documentation & Qualité

- [Architecture & Bilan Post-Mortem](docs/ARCHITECTURE.md) : Détail de l'architecture Client-Serveur, protocole WebSocket, conteneurisation et bilan qualitatif.
- [Plan de Test & Stratégie Qualité](docs/PLAN_DE_TEST.md) : Pyramide des tests, matrice de traçabilité, protocole de charge k6 et critères d'acceptation.

## Exécution des Tests

- **Tests Unitaires & Intégration Serveur** : `cd server && npm test`
- **Tests Unitaires Client Léger** : `cd client && npm test`
- **Analyse Dynamique & Test de Charge** : `k6 run tests/load/websocket-stress.js`
- **Validation Docker & Compose** : `docker compose config`
