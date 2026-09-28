export class NetworkManager {
  private socket: WebSocket | null = null;
  private serverUrl: string;

  // On permet de passer l'URL en paramètre, avec une valeur par défaut pour le local
  constructor(serverUrl: string = "ws://localhost:3000") {
    this.serverUrl = serverUrl;
  }

  public connect(): void {
    console.log(`Tentative de connexion au serveur : ${this.serverUrl}...`);
    this.socket = new WebSocket(this.serverUrl);

    this.socket.onopen = () => {
      console.log("✅ Connexion WebSocket établie avec succès !");
    };

    this.socket.onclose = () => {
      console.log("🔌 Déconnecté du serveur WebSocket.");
    };

    // On type bien l'erreur avec 'Event' pour éviter que le linter ne rouspète
    this.socket.onerror = (error: Event) => {
      console.error("⚠️ Erreur de connexion WebSocket :", error);
    };
  }
}
