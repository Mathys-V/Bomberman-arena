import { INetworkManager } from "./network/INetworkManager";

/**
 * Gestionnaire de communication WebSocket réel avec le serveur Node.js.
 * Implémente INetworkManager pour permettre l'interchangeabilité avec le Mock.
 */
export class NetworkManager implements INetworkManager {
  private socket: WebSocket | null = null;
  private readonly serverUrl: string;

  /**
   * Initialise le gestionnaire avec l'URL du serveur WebSocket.
   *
   * @param serverUrl URL de connexion WebSocket (défaut : ws://localhost:8080).
   */
  constructor(serverUrl: string = "ws://localhost:8080") {
    this.serverUrl = serverUrl;
  }

  /**
   * Établit la connexion WebSocket avec le serveur.
   */
  public connect(): void {
    console.log(`Tentative de connexion au serveur : ${this.serverUrl}...`);
    this.socket = new WebSocket(this.serverUrl);

    this.socket.onopen = () => {
      console.log("Connexion WebSocket établie avec succès !");
    };

    this.socket.onclose = () => {
      console.log("Déconnecté du serveur WebSocket.");
    };

    this.socket.onerror = (error: Event) => {
      console.error("Erreur de connexion WebSocket :", error);
    };
  }

  /**
   * Sérialise et transmet un objet message au serveur si le socket est ouvert.
   *
   * @param message Objet à envoyer en JSON.
   */
  public sendMessage(message: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const jsonString = JSON.stringify(message);
      this.socket.send(jsonString);
      console.log("Message envoyé au serveur :", jsonString);
    } else {
      console.warn("Message ignoré : le WebSocket n'est pas connecté.");
    }
  }

  /**
   * Enregistre la fonction de rappel appelée lors de la réception d'un message.
   *
   * @param callback Fonction recevant les données JSON analysées.
   */
  public listen(callback: (data: unknown) => void): void {
    if (!this.socket) {
      console.warn("Impossible d'écouter : le WebSocket n'est pas connecté.");
      return;
    }

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as unknown;
        console.log("Message reçu du serveur :", data);
        callback(data);
      } catch (error) {
        console.error("Erreur lors de la lecture du message serveur :", error);
      }
    };
  }

  /**
   * Ferme la connexion WebSocket si elle est active.
   */
  public disconnect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
      this.socket = null;
    }
  }
}
