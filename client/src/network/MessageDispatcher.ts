import { EventBus } from "../core/EventBus";
import {
  parseBombExploded,
  parseBombPlaced,
  parseGameOver,
  parseGridUpdated,
  parseLobbyUpdated,
  parsePositionUpdated,
} from "../types/game";

/**
 * Répartiteur de messages réseau côté client (Pattern Dispatcher / SOLID SRP).
 * Analyse les trames JSON brutes (`unknown`) reçues du WebSocket ou du Mock
 * et publie les événements typés correspondants sur l'EventBus.
 */
export class MessageDispatcher {
  private readonly eventBus: EventBus;

  /**
   * Initialise le répartiteur avec le bus d'événements cible.
   *
   * @param eventBus Instance du bus d'événements du client.
   */
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Analyse une donnée brute reçue du réseau et émet l'événement associé sur l'EventBus.
   *
   * @param rawData Donnée brute issue de `JSON.parse` ou du mock.
   * @returns true si le message a été reconnu et distribué, false sinon.
   */
  public dispatch(rawData: unknown): boolean {
    const positionUpdate = parsePositionUpdated(rawData);
    if (positionUpdate) {
      this.eventBus.emit("player:moved", positionUpdate);
      return true;
    }

    const bombPlaced = parseBombPlaced(rawData);
    if (bombPlaced) {
      this.eventBus.emit("bomb:placed", bombPlaced);
      return true;
    }

    const bombExploded = parseBombExploded(rawData);
    if (bombExploded) {
      this.eventBus.emit("bomb:exploded", bombExploded);
      return true;
    }

    const gridUpdate = parseGridUpdated(rawData);
    if (gridUpdate) {
      this.eventBus.emit("grid:updated", gridUpdate);
      return true;
    }

    const lobbyUpdate = parseLobbyUpdated(rawData);
    if (lobbyUpdate) {
      this.eventBus.emit("lobby:updated", lobbyUpdate);
      return true;
    }

    const gameOver = parseGameOver(rawData);
    if (gameOver) {
      this.eventBus.emit("game:over", gameOver);
      return true;
    }

    return false;
  }
}
