import { PlayerPositionUpdate } from "../types/game";

/**
 * Dictionnaire d'événements fortement typés pour le bus d'événements.
 * Garantit l'absence totale du type 'any'.
 */
export interface GameEvents {
  "player:moved": PlayerPositionUpdate;
  "network:status": "connected" | "disconnected" | "error";
}

/**
 * Signature d'un écouteur d'événement.
 */
export type EventListener<T> = (payload: T) => void;

/**
 * Bus d'événements assurant le découplage strict entre la couche réseau,
 * les contrôles d'entrée et le moteur de rendu graphique PixiJS.
 * Design pattern imposé par le cahier des charges officiel.
 */
export class EventBus {
  private readonly listeners: Map<
    keyof GameEvents,
    Set<EventListener<unknown>>
  >;

  /**
   * Initialise un nouveau bus d'événements.
   */
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Enregistre un écouteur sur un événement spécifique.
   *
   * @param event Nom de l'événement à écouter.
   * @param listener Fonction de rappel invoquée lors de l'émission.
   * @returns Une fonction permettant de se désabonner proprement.
   */
  public on<E extends keyof GameEvents>(
    event: E,
    listener: EventListener<GameEvents[E]>,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }

    const castedListener = listener as EventListener<unknown>;
    set.add(castedListener);

    return () => {
      set?.delete(castedListener);
    };
  }

  /**
   * Émet un événement à destination de tous les écouteurs abonnés.
   *
   * @param event Nom de l'événement à émettre.
   * @param payload Données associées à l'événement.
   */
  public emit<E extends keyof GameEvents>(
    event: E,
    payload: GameEvents[E],
  ): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) {
      return;
    }

    for (const listener of set) {
      listener(payload);
    }
  }

  /**
   * Supprime tous les écouteurs enregistrés.
   */
  public clear(): void {
    this.listeners.clear();
  }

  /**
   * Retourne le nombre d'écouteurs abonnés à un événement donné.
   *
   * @param event Nom de l'événement.
   * @returns Le nombre d'écouteurs actifs.
   */
  public listenerCount(event: keyof GameEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
