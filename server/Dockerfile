# Utilisation d'une image Node.js officielle et allégée
FROM node:20-alpine

# Définition du répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copie des fichiers de dépendances (optimisation du cache Docker)
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source du serveur
COPY . .

# Exposition du port de communication (à adapter si votre serveur écoute sur un autre port, ex: 3000)
EXPOSE 8080

# Commande de lancement du serveur
CMD ["npm", "start"]