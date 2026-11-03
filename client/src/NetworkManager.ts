export class NetworkManager {
  private socket: WebSocket | null = null;
  private readonly serverUrl: string;

  // On permet de passer l'URL en paramètre, avec une valeur par défaut pour le local
  constructor(serverUrl: string = "ws://localhost:8080") {
    this.serverUrl = serverUrl;
  }

  public connect(): void {
    console.log(`Tentative de connexion au serveur : ${this.serverUrl}...`);
    this.socket = new WebSocket(this.serverUrl);

    this.socket.onopen = () => {
      console.log("Connexion WebSocket établie avec succès !");
    };

    this.socket.onclose = () => {
      console.log("Déconnecté du serveur WebSocket.");
    };

    // On type bien l'erreur avec 'Event' pour éviter que le linter ne rouspète
    this.socket.onerror = (error: Event) => {
      console.error("Erreur de connexion WebSocket :", error);
    };
  }

  // Cette méthode prend n'importe quel objet, le transforme en texte JSON et l'envoie
  public sendMessage(message: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const jsonString = JSON.stringify(message);
      this.socket.send(jsonString);
      console.log("Message envoyé au serveur :", jsonString);
    } else {
      console.warn("Message ignoré : le WebSocket n'est pas connecté.");
    }
  }

  // Écoute les messages entrants et les transmet au reste du jeu via un callback
  public listen(callback: (data: unknown) => void): void {
    if (!this.socket) {
      console.warn("Impossible d'écouter : le WebSocket n'est pas connecté.");
      return;
    }

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        // On transforme le texte JSON reçu en objet utilisable
        const data = JSON.parse(event.data) as unknown;
        console.log("Message reçu du serveur :", data);

        // On déclenche la fonction callback pour alerter le moteur graphique
        callback(data);
      } catch (error) {
        console.error("Erreur lors de la lecture du message serveur :", error);
      }
    };
  }
}
