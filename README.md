# Bomberman Arena

Bienvenue sur Bomberman Arena, un jeu multijoueur en temps réel basé sur une architecture Client-Serveur.

## Technologies utilisées

- Client : TypeScript, Vite, PixiJS (Moteur graphique), Tauri (Exécutables de bureau).
- Serveur : Node.js, TypeScript, WebSockets (ws).
- DevOps & Qualité : GitHub Actions, SonarCloud, Jest (Tests unitaires), Cypress (Tests E2E), k6 (Tests de charge).

## Démarrage rapide

1. Installation des dépendances (à la racine) :
   cd client && npm install
   cd ../server && npm install

2. Lancement du Serveur (Port 8080) :
   cd server
   npm start

3. Lancement du Client (Port 5173) :
   cd client
   npm run dev
