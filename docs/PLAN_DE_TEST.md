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
5. **Automatiser le contrôle qualité** : intégrer les tests dans le pipeline CI/CD GitHub Actions pour empêcher toute régression avant chaque merge sur `develop` ou `main`.

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
  /_________________\-> Logique métier Grid, Player, Bomb, Input
```

### Répartition des responsabilités et outillage :

| Niveau de test | Cible | Outil principal | Responsable | Fréquence d'exécution |
| :--- | :--- | :--- | :--- | :--- |
| **Tests Unitaires Serveur** | Moteur de jeu (`Grid`, `Player`, `Bomb`) | Jest / `ts-jest` | Pôle Backend & DevOps | Chaque commit / PR (CI) |
| **Tests Unitaires Client** | Gestionnaires (`InputManager`, `NetworkManager`) | Jest / `ts-jest` | Pôle Frontend & DevOps | Chaque commit / PR (CI) |
| **Tests d'Intégration** | Échanges WebSocket réels (Client <-> Serveur) | Jest + client `ws` | Pôle DevOps & Qualité | Chaque commit / PR (CI) |
| **Tests de Charge / Dynamiques**| Tenue sous concurrence WebSocket (30 VUs) | k6 (Grafana k6) | Pôle DevOps (Mathys) | Jalons de release / CI ponctuelle |
| **Tests Bout-en-Bout (E2E)** | Rendu interface & interactions utilisateur | Cypress | Pôle DevOps (Kilian) | Jalons de release / Pre-release |
