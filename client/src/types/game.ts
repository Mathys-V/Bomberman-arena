/**
 * Types et interfaces partagés pour le domaine du jeu Bomberman Arena.
 * Conforme aux règles d'architecture et de typage strict (zéro any).
 */

/**
 * Directions de déplacement autorisées sur la grille.
 */
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

/**
 * Types d'actions émises par le client.
 */
export type ActionType = "PLAYER_MOVE" | "PLACE_BOMB" | "JOIN_LOBBY";

/**
 * Données décrivant la position d'un joueur sur la grille.
 */
export interface PlayerPositionUpdate {
  readonly playerId: string;
  readonly x: number;
  readonly y: number;
  readonly direction?: Direction;
}

/**
 * Structure de message envoyée au serveur, supportant à la fois
 * le contrat type/payload (docs) et event/data (serveur).
 */
export interface GameMessage {
  readonly type: ActionType;
  readonly payload: {
    readonly direction?: Direction;
    readonly playerName?: string;
  };
  readonly event?: ActionType;
  readonly data?: {
    readonly direction?: Direction;
    readonly playerName?: string;
    readonly playerId?: string;
    readonly x?: number;
    readonly y?: number;
  };
}

/**
 * Vérifie si une chaîne est une direction valide.
 *
 * @param value Valeur inconnue à tester.
 * @returns true si la valeur est une Direction.
 */
export function isDirection(value: unknown): value is Direction {
  return (
    typeof value === "string" &&
    (value === "UP" || value === "DOWN" || value === "LEFT" || value === "RIGHT")
  );
}

/**
 * Extrait l'objet de données contenu dans le message (data ou payload).
 *
 * @param record Objet message brut sous forme de dictionnaire.
 * @returns Le sous-objet contenant les paramètres de l'action ou null.
 */
function extractPayloadRecord(
  record: Record<string, unknown>,
): Record<string, unknown> | null {
  if (typeof record.data === "object" && record.data !== null) {
    return record.data as Record<string, unknown>;
  }
  if (typeof record.payload === "object" && record.payload !== null) {
    return record.payload as Record<string, unknown>;
  }
  return null;
}

/**
 * Analyse et extrait un événement de mise à jour de position depuis un message brut inconnu.
 * Gère de façon transparente les deux formats de contrat :
 * - `{ event: "POSITION_UPDATED", data: { playerId, x, y, direction } }`
 * - `{ type: "POSITION_UPDATED", payload: { playerId, x, y, direction } }`
 *
 * @param raw Données brutes reçues du WebSocket ou du mock.
 * @returns Un objet PlayerPositionUpdate typé ou null si non valide.
 */
export function parsePositionUpdated(raw: unknown): PlayerPositionUpdate | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const eventName = typeof record.event === "string" ? record.event : record.type;

  if (eventName !== "POSITION_UPDATED") {
    return null;
  }

  const content = extractPayloadRecord(record);
  if (!content) {
    return null;
  }

  const x = typeof content.x === "number" ? content.x : null;
  const y = typeof content.y === "number" ? content.y : null;

  if (x === null || y === null) {
    return null;
  }

  const playerId =
    typeof content.playerId === "string" && content.playerId.length > 0
      ? content.playerId
      : "p1";

  const direction = isDirection(content.direction) ? content.direction : undefined;

  return {
    playerId,
    x,
    y,
    direction,
  };
}
