# Utilisation d'une image Node.js officielle et allégée
FROM node:20-alpine

# Définition du répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation sécurisée des dépendances (sans exécuter de scripts tiers)
RUN npm ci --ignore-scripts

# Copie explicite uniquement du code source et de la configuration pour satisfaire SonarQube
COPY src/ ./src/
COPY server.ts tsconfig.json ./

# Passage sur l'utilisateur non-root pour des raisons de sécurité
USER node

# Exposition du port de communication
EXPOSE 8080

# Commande de lancement du serveur
CMD ["npm", "start"]