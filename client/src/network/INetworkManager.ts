/**
 * Interface d'abstraction du gestionnaire réseau client.
 * Permet de découpler la communication réelle (WebSocket) et simulée (Mock)
 * pour répondre aux exigences de testabilité et de mocking hors-ligne du cahier des charges.
 */
export interface INetworkManager {
  /**
   * Établit la connexion avec le serveur ou initialise le mode mock.
   */
  connect(): void;

  /**
   * Envoie un message JSON au serveur ou au simulateur.
   *
   * @param message Objet à sérialiser et transmettre.
   */
  sendMessage(message: object): void;

  /**
   * Enregistre un écouteur pour traiter les messages entrants.
   *
   * @param callback Fonction de rappel invoquée à chaque réception.
   */
  listen(callback: (data: unknown) => void): void;

  /**
   * Ferme proprement la connexion si nécessaire.
   */
  disconnect?(): void;
}
