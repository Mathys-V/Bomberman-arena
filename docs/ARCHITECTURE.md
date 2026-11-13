# Documentation Technique & Qualité - Bomberman Arena

## 1. Architecture Client-Serveur

Le projet Bomberman Arena repose sur une architecture "Monorepo" séparant distinctement la logique métier et l'interface :

- Le Serveur (Node.js) agit comme la source de vérité. Il gère la grille, les collisions, les algorithmes d'explosion (ex: explosion en croix) et valide les actions des joueurs.
- Le Client (Vite + PixiJS) est un client dit "léger". Il se contente de capter les inputs (clavier) via un InputManager, d'envoyer ces intentions au serveur, et d'afficher le rendu graphique en fonction des états reçus.
- Le packaging final en application de bureau (Windows/Mac/Linux) est assuré par Tauri.

## 2. Protocole de Communication (WebSocket)

Les communications s'effectuent en temps réel via le protocole WebSocket (port 8080). Les payloads sont au format JSON.

Messages envoyés par le Client vers le Serveur :

- Déplacement : `{ "type": "PLAYER_MOVE", "payload": { "direction": "UP" } }`
- Poser une bombe : `{ "type": "PLACE_BOMB", "payload": {} }`

Messages envoyés par le Serveur vers le Client :

- Mise à jour globale : `{ "type": "GAME_STATE", "payload": { "players": [...], "grid": [...] } }`
- Déconnexion : `{ "type": "PLAYER_DISCONNECT", "payload": { "playerId": "1234" } }`

## 3. Guide de Déploiement et d'Exécution

Prérequis : Node.js (v18+) et npm (ou Docker pour le serveur).
La reproductibilité des environnements est assurée par nos fichiers lock. Pour déployer le projet :

### 3.1. Démarrage Local Standard
1. Cloner le dépôt et se rendre à la racine.
2. Synchroniser l'environnement Serveur : `cd server && npm ci`
3. Synchroniser l'environnement Client : `cd client && npm ci`
4. Démarrer le backend : `npm start` (depuis le dossier `server`)
5. Démarrer le frontend : `npm run dev` (depuis le dossier `client`)

### 3.2. Démarrage Conteneurisé (Docker Serveur)
Conformément au sujet, seul le serveur est conteneurisé (le client ne doit pas l'être) :
```bash
# Démarrage du serveur isolé sur le port 8080
docker compose up --build -d

# Visualisation des flux temps réel
docker compose logs -f bomberman-server

# Arrêt et nettoyage
docker compose down
```

## 4. Bilan Qualitatif (Post-Mortem)

- Gestion de Projet & GitFlow :
  L'utilisation stricte de GitFlow (branches feature, develop) avec protection de branche a très bien fonctionné. L'obligation d'obtenir 2 approbations (reviews) avant chaque merge a considérablement réduit la dette technique.

- Usine logicielle et CI/CD (GitHub Actions) :
  L'automatisation via GitHub Actions (Lint, Tests avec couverture, Build Tauri, Validation Docker) a permis de sécuriser les livraisons. La conteneurisation du serveur est testée et validée à chaque PR grâce au job `build-docker-serveur` qui vérifie le Dockerfile et la configuration Docker Compose. Nous avons également surmonté les défis liés à `npm ci` via des branches hotfix dédiées pour la synchronisation des lockfiles.

- Analyse statique & Couverture de code (SonarQube) :
  SonarCloud s'est révélé redoutable pour maintenir la qualité du code. Il a notamment permis d'identifier et de corriger une vulnérabilité de sécurité sur la génération aléatoire de la grille (remplacement de Math.random par node:crypto), ainsi que d'optimiser l'allocation de la mémoire (push multiples).
  Grâce à la génération continue des rapports LCOV via Jest et leur transfert automatisé à SonarCloud, le moteur de jeu backend et les gestionnaires clients atteignent un taux de couverture de code de 96% (100% sur Bomb.ts, Grid.ts, Player.ts, EventRouter.ts, WebSocketServer.ts, InputManager.ts et NetworkManager.ts), validant avec succès le Quality Gate SonarCloud (exigence >= 80%).

- Stratégie de Tests & Performances :
  Le projet est couvert par trois niveaux de tests :

1. Tests unitaires (Jest) : Validation de la logique métier (dimensions de la grille, algorithme d'explosion, entité joueur).
2. Tests E2E (Cypress) : Validation de l'interface utilisateur.
3. Tests dynamiques (k6) : Un test de charge WebSocket a été réalisé sur le serveur Node.js. En simulant 30 joueurs simultanés (ramp-up sur 15s, plateau de 30s) spammant déplacements et bombes, le serveur a encaissé 100% des requêtes (144 sessions complètes, plus de 6700 messages échangés) avec une latence p95 de seulement 2.85ms, sans crasher l'Event Loop.

*(Pour le détail exhaustif de la matrice des tests, des scénarios et de l'outillage CI/CD, consulter le [Plan de Test & Stratégie Qualité](PLAN_DE_TEST.md).)*
