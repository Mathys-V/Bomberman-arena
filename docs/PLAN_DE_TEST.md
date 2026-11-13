# Plan de Test & Stratégie Qualité - Bomberman Arena

## 1. Introduction & Objectifs Qualité

Le projet **Bomberman Arena** est un jeu multijoueur en temps réel reposant sur une architecture client-serveur stricte :
- Le **Serveur (Node.js / TypeScript)** est l'unique source de vérité pour la simulation physique, la détection des collisions, la pose et l'explosion des bombes, ainsi que les règles de victoire et défaite afin d'empêcher toute triche.
- Le **Client (PixiJS / TypeScript / Tauri)** est un client léger gérant l'affichage graphique et la capture des entrées utilisateur.
- La communication s'effectue en flux continu bidirectionnel via le protocole **WebSocket**.

### Objectifs de la stratégie de test :
1. **Garantir l'intégrité de la logique métier** : s'assurer que les règles du jeu (grille, déplacements, poses de bombes, explosions en croix, collisions) s'exécutent avec une fiabilité absolue.
2. **Valider le contrat d'interface réseau (Protocole WebSocket)** : vérifier la sérialisation, le routage et le traitement correct des messages JSON échangés entre clients et serveur.
3. **Prouver la robustesse sous charge (Analyse Dynamique)** : démontrer la stabilité de l'Event Loop Node.js et des connexions concurrentes face à des montées en charge extrêmes.
4. **Assurer l'expérience utilisateur de bout-en-bout** : certifier l'enchaînement fluide des actions utilisateur dans le client lourd.
5. **Automatiser le contrôle qualité & packaging** : intégrer les tests, la mesure continue de couverture de code (LCOV) et la validation de la conteneurisation Docker dans le pipeline CI/CD GitHub Actions pour empêcher toute régression avant chaque merge sur `develop` ou `main`.

---

## 2. Pyramide des Tests & Périmètre

La stratégie adoptée applique le modèle de la **Pyramide des Tests** pour équilibrer rapidité de retour (feedback loop) et niveau de confiance :

```
          / \
         /   \       Tests E2E UI (Cypress)
        / E2E \      -> Parcours interface, interaction client
       /-------\
      / Intég.  \    Tests d'Intégration & Charge
     / & Charge  \   -> WebSocket (Jest + ws) & Stress (k6)
    /-------------\
   /   Unitaires   \ Tests Unitaires (Jest / Vitest)
  /_________________\-> Logique métier Grid, Player, Bomb, Input (Couverture LCOV > 95%)
```

### Répartition des responsabilités et outillage :

| Niveau de test | Cible | Outil principal | Responsable | Fréquence d'exécution |
| :--- | :--- | :--- | :--- | :--- |
| **Tests Unitaires Serveur** | Moteur de jeu (`Grid`, `Player`, `Bomb`, `EventRouter`, `WebSocketServer`) | Jest / `ts-jest` | Pôle Backend & DevOps | Chaque commit / PR (CI) |
| **Tests Unitaires Client** | Gestionnaires (`InputManager`, `NetworkManager`) | Jest / `ts-jest` | Pôle Frontend & DevOps | Chaque commit / PR (CI) |
| **Tests d'Intégration** | Échanges WebSocket réels (Client <-> Serveur) | Jest + client `ws` | Pôle DevOps & Qualité | Chaque commit / PR (CI) |
| **Tests de Charge / Dynamiques**| Tenue sous concurrence WebSocket (30 VUs) | k6 (Grafana k6) | Pôle DevOps (Mathys) | Jalons de release / CI ponctuelle |
| **Tests Bout-en-Bout (E2E)** | Rendu interface & interactions utilisateur | Cypress | Pôle DevOps (Kilian) | Jalons de release / Pre-release |
| **Mesure de Couverture** | Rapports LCOV (Backend & Frontend) | Jest `--coverage` -> SonarCloud | Pôle DevOps & Qualité | Chaque commit / PR (CI) |
| **Validation Packaging** | Image Docker Serveur & docker-compose | Docker Buildx / Compose | Pôle DevOps & Qualité | Chaque commit / PR (CI) |

---

## 3. Matrice de Traçabilité & Scénarios de Test Détaillés

### 3.1. Logique Métier Serveur (Tests Unitaires Backend - Jest)

| ID | Composant cible | Scénario testé | Données d'entrée | Résultat attendu | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TU-SRV-01** | `Grid` | Initialisation des dimensions de la grille | `width = 15`, `height = 13` | Grille 2D `13x15` conforme | Validé |
| **TU-SRV-02** | `Grid` | Placement régulier des murs fixes | Coordonnées impaires `(x, y)` | Cellules `(1,1)`, `(1,3)`, `(3,1)` = type `1` (Fixe) | Validé |
| **TU-SRV-03** | `Grid` | Présence de caisses destructibles aléatoires | Génération pseudo-aléatoire sécurisée | Au moins une case de type `2` (Destructible) | Validé |
| **TU-SRV-04** | `Grid` | Protection de la zone de réapparition (Spawn) | Coin supérieur gauche `(0,0)` | Cases `(0,0)`, `(0,1)`, `(1,0)` = type `0` (Vide) | Validé |
| **TU-SRV-05** | `Grid` | Détection d'obstacles et limites de carte | `isObstacle(-1, 0)`, `(15, 0)`, `(1, 1)` | Renvoie `true` pour obstacles et sorties de grille | Validé |
| **TU-SRV-06** | `Player` | Positionnement initial du joueur | Coordonnées `(0, 0)` | `player.x = 0`, `player.y = 0` | Validé |
| **TU-SRV-07** | `Player` | Déplacements multidirectionnels libres | Directions `UP`, `DOWN`, `LEFT`, `RIGHT` | Coordonnées incrémentées / décrémentées | Validé |
| **TU-SRV-08** | `Player` | Détection de collision contre un mur | Direction avec obstacle simulé | Maintien des coordonnées initiales | Validé |
| **TU-SRV-09** | `Bomb` | Instanciation de la bombe | Coordonnées `(5, 5)`, `owner = 'player1'` | Propriétés initialisées, `isExploded = false` | Validé |
| **TU-SRV-10** | `Bomb` | Déclenchement de l'explosion par temporisation | Délai 3000 ms (via fake timers Jest) | `isExploded = true`, callback d'explosion appelé 1x | Validé |
| **TU-SRV-11** | `Bomb` | Calcul de la zone d'impact en croix | Bombe en `(5, 5)`, rayon de 2 cases | 9 cases générées : centre + 4 branches | Validé |
| **TU-SRV-12** | `EventRouter` | Routage des événements `JOIN_LOBBY` et `PLAYER_MOVE` | Payloads JSON valides | Messages de retour typés `LOBBY_UPDATED` / `POSITION_UPDATED` | Validé |
| **TU-SRV-13** | `EventRouter` | Gestion des événements inconnus et JSON invalides | Payload erroné ou chaîne corrompue | Message d'erreur avec code `UNKNOWN_EVENT` / `INVALID_JSON` | Validé |
| **TU-SRV-14** | `WebSocketServer` | Cycle de vie du serveur autonome (`start`/`stop`) | Port éphémère et client `ws` | Démarrage, routage message, déconnexion et arrêt propre | Validé |

---

### 3.2. Interface & Gestionnaires Client (Tests Unitaires Frontend - Jest & jsdom)

| ID | Composant cible | Scénario testé | Données d'entrée | Résultat attendu | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TU-CLI-01** | `InputManager` | Capture des entrées de déplacement complètes | `ArrowUp`/`KeyW`, `ArrowDown`/`KeyS`, `ArrowLeft`/`KeyA`, `ArrowRight`/`KeyD` | Émission de `PLAYER_MOVE` avec la direction adéquate | Validé |
| **TU-CLI-02** | `InputManager` | Capture de l'entrée de pose de bombe | Touche clavier `Space` (`keydown`) | Émission événement `{ type: "PLACE_BOMB", payload: {} }` | Validé |
| **TU-CLI-03** | `InputManager` | Filtrage des touches non assignées | Touche non configurée (`KeyQ`) | Aucun message émis, aucun effet secondaire | Validé |
| **TU-CLI-04** | `NetworkManager` | Initialisation avec URL explicite ou par défaut | URL paramétrée ou appel vide | `new WebSocket` appelé avec l'URL cible | Validé |
| **TU-CLI-05** | `NetworkManager` | Callbacks de connexion (`onopen`, `onclose`, `onerror`)| Simulation événements socket | Exécution des logs sans lever d'exception | Validé |
| **TU-CLI-06** | `NetworkManager` | Expédition de message conditionnelle | Socket ouvert vs socket fermé/déconnecté | Envoi réel si ouvert, rejet gracieux sinon | Validé |
| **TU-CLI-07** | `NetworkManager` | Réception et traitement de messages entrants | Message JSON valide vs invalide | Appel callback de mise à jour ou catch gracieux | Validé |

---

### 3.3. Intégration Réseau & Échanges Temps Réel (Tests d'Intégration - Jest + ws)

| ID | Périmètre | Scénario testé | Procédure de test | Résultat attendu | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TI-NET-01** | Communication Client-Serveur | Boucle complète de déplacement | Démarrage serveur sur port 8085, émission `PLAYER_MOVE` par client réel | Réception asynchrone d'un message `POSITION_UPDATED` | Validé |
| **TI-NET-02** | Cycle de vie connexion | Déconnexion propre d'un client | Fermeture socket client | Libération des ressources et fermeture sans fuite mémoire | Validé |

---

### 3.4. Analyse Dynamique & Test de Charge (k6 Stress Test)

- **Fichier de script** : `tests/load/websocket-stress.js`
- **Scénario d'exécution** :
  - Étape 1 (Ramp-up) : 0 à 30 utilisateurs virtuels (VUs) en 15 secondes.
  - Étape 2 (Plateau) : 30 VUs connectés simultanément pendant 30 secondes.
  - Étape 3 (Cool-down) : 30 à 0 VUs en 10 secondes.
- **Charge utile simulée** :
  - Déplacements constants (`PLAYER_MOVE` toutes les 500 ms par VU).
  - Poses de bombes cadencées (`PLACE_BOMB` toutes les 2 000 ms par VU).
- **Seuils d'acceptation (Thresholds SLA)** :
  - `ws_connecting : p(95) < 500 ms` (95% des poignées de main sous 500 ms).
  - Taux d'échec de négociation (Code 101 Switching Protocols) = 0%.
- **Bilan mesuré** :
  - **144 sessions WebSocket complètes** menées à leur terme.
  - **6 700+ messages JSON traités** sans dégradation de l'Event Loop Node.js.
  - **Latence de connexion p95 observée : 2.85 ms** (largement en-deçà des 500 ms autorisés).

---

### 3.5. Tests Bout-en-Bout Interface (Cypress E2E - Rôle DevOps Kilian)

- **Objectif** : Valider le parcours joueur dans l'interface graphique encapsulée.
- **Scénarios couverts** :
  - Affichage de l'arène de jeu et chargement des textures PixiJS.
  - Rendu initial des joueurs et des blocs de la grille.
  - Réactivité de l'affichage suite aux entrées clavier du joueur.

---

## 4. Environnement d'Exécution, Outillage & Intégration CI/CD

### 4.1. Commandes de reproduction locale (Guide Évaluateur / Développeur)

Afin de garantir la reproductibilité des tests sur n'importe quel poste de travail, les commandes normalisées sont les suivantes :

```bash
# 1. Tests Unitaires & Intégration Serveur (Node.js / Jest)
cd server
npm test

# 2. Tests avec Couverture LCOV Serveur (> 95%)
cd server
npm run test:coverage

# 3. Tests Unitaires Client Léger (Jest / jsdom)
cd client
npm test

# 4. Tests avec Couverture LCOV Client (100%)
cd client
npm run test:coverage

# 5. Vérification de la conformité du style et règles statiques (ESLint)
cd server && npm run lint
cd ../client && npm run lint

# 6. Exécution du test de charge dynamique (k6)
# Prérequis : Serveur démarré en arrière-plan via 'cd server && npm start'
k6 run tests/load/websocket-stress.js

# 7. Validation de la conteneurisation Docker Serveur
docker compose config
docker compose up --build -d
```

### 4.2. Pipeline d'Intégration Continue (GitHub Actions)

Tous les scénarios de test et de validation de packaging sont intégrés dans le workflow `.github/workflows/ci.yml` et s'exécutent automatiquement à chaque proposition de Pull Request ou de Push vers les branches `develop` et `main` :

1. **Job `qualite-serveur`** : installe les dépendances via `npm install`, applique les règles ESLint, puis exécute l'intégralité de la suite Jest backend avec génération du rapport de couverture LCOV (`npm run test:coverage`). Le rapport est sauvegardé comme artefact GitHub Actions.
2. **Job `qualite-client`** : vérifie la compilation TypeScript, le linting et les tests Jest avec couverture LCOV de l'interface client, puis sauvegarde le rapport comme artefact.
3. **Job `analyse-sonarqube`** : s'exécute après la fin des jobs de test, télécharge les artefacts de couverture LCOV serveur et client, et déclenche le scanner SonarCloud pour alimenter le Quality Gate avec les métriques réelles.
4. **Job `build-docker-serveur`** : valide la construction de l'image Docker du serveur (`server/Dockerfile`) via Buildx et vérifie l'intégrité syntaxique du fichier `docker-compose.yml`.
5. **Job `build-tauri`** : compile l'application cliente et vérifie l'intégrité du binaire de bureau généré.

---

## 5. Critères d'Acceptation & Métriques de Qualité (Quality Gate)

### 5.1. Critères d'entrée et de sortie (Definition of Done)

Pour qu'une fonctionnalité ou un correctif soit accepté dans la branche d'intégration `develop` :
- [x] **Succès des tests automatisés** : 100% des tests unitaires et d'intégration doivent être passants (aucun test ignoré ou en échec).
- [x] **Couverture de code Backend & Client** : Le taux de couverture global dépasse 80% (exigence Quality Gate SonarCloud) avec un résultat réel supérieur à 95% sur l'ensemble des modules cibles (100% sur Grid, Player, Bomb, EventRouter, WebSocketServer, InputManager et NetworkManager).
- [x] **Conformité statique** : Zéro erreur de linting retournée par ESLint / Prettier.
- [x] **Validation SonarCloud** : La Pull Request doit obligatoirement obtenir le statut **Quality Gate : PASSED**.
- [x] **Packaging Serveur & Client au vert** : Le build Docker serveur et la compilation Tauri client doivent réussir sans avertissement bloquant.
- [x] **Double revue par les pairs** : Approbation formelle d'au moins 2 relecteurs, dont au moins 1 membre de l'équipe Qualité/DevOps.
- [x] **Non-régression des performances** : En cas de modification réseau, la latence moyenne de handshake doit demeurer inférieure à 5 ms sous charge k6.

### 5.2. Gestion des anomalies et processus Hotfix

En cas de défaillance détectée par la CI ou lors des sessions de test de charge :
1. **Isolation immédiate** : gel du merge de la PR concernée ou création d'une branche `hotfix/<nom-anomalie>` issue de `develop`.
2. **Reproduction par un test (TDD)** : écriture préalable d'un cas de test unitaire ou d'intégration reproduisant fidèlement le bogue constaté.
3. **Correction & vérification** : résolution de l'anomalie, validation locale complète de la suite Jest, puis réintégration via Pull Request dédiée.
