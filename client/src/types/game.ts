/**
 * Types, interfaces et parseurs de validation pour le protocole Bomberman Arena.
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
 * Coordonnées (x, y) d'une case sur la grille de l'arène.
 */
export interface GridCoordinate {
  readonly x: number;
  readonly y: number;
}

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
 * Données décrivant la pose d'une bombe sur la grille.
 */
export interface BombPlacedEvent {
  readonly bombId?: string;
  readonly playerId: string;
  readonly x: number;
  readonly y: number;
  readonly radius?: number;
}

/**
 * Données décrivant l'explosion d'une bombe et les cases impactées.
 */
export interface BombExplodedEvent {
  readonly bombId?: string;
  readonly x: number;
  readonly y: number;
  readonly affectedTiles: readonly GridCoordinate[];
  readonly destroyedCrates: readonly GridCoordinate[];
}

/**
 * Données décrivant une mise à jour de la grille de jeu (0: vide, 1: mur, 2: caisse).
 */
export interface GridUpdateEvent {
  readonly grid: readonly (readonly number[])[];
}

/**
 * Informations sur un joueur présent dans le lobby.
 */
export interface LobbyPlayerInfo {
  readonly id: string;
  readonly name: string;
  readonly ready: boolean;
}

/**
 * Données décrivant l'état courant du lobby d'attente.
 */
export interface LobbyUpdateEvent {
  readonly lobbyId: string;
  readonly status: string;
  readonly players: readonly LobbyPlayerInfo[];
}

/**
 * Données décrivant la fin d'une partie.
 */
export interface GameOverEvent {
  readonly winnerId: string | null;
  readonly reason?: string;
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
 * Enveloppe interne extraite d'un message brut serveur.
 */
interface ExtractedEnvelope {
  readonly eventName: string;
  readonly content: Record<string, unknown>;
}

/**
 * Vérifie si une valeur est un objet dictionnaire non nul.
 *
 * @param value Valeur inconnue à vérifier.
 * @returns true si value est un objet non nul.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
  if (isRecord(record.data)) {
    return record.data;
  }
  if (isRecord(record.payload)) {
    return record.payload;
  }
  return null;
}

/**
 * Extrait le nom d'événement et le contenu d'une trame brute JSON.
 *
 * @param raw Donnée brute reçue du réseau.
 * @returns L'enveloppe extraite ou null si la structure est invalide.
 */
function extractEnvelope(raw: unknown): ExtractedEnvelope | null {
  if (!isRecord(raw)) {
    return null;
  }

  let eventName: string | null = null;
  if (typeof raw.event === "string") {
    eventName = raw.event;
  } else if (typeof raw.type === "string") {
    eventName = raw.type;
  }

  if (!eventName) {
    return null;
  }

  const content = extractPayloadRecord(raw);
  if (!content) {
    return null;
  }

  return { eventName, content };
}

/**
 * Vérifie si une valeur est une coordonnée de grille valide `{ x: number, y: number }`.
 *
 * @param value Valeur inconnue à tester.
 * @returns true si la valeur est une GridCoordinate valide.
 */
export function isGridCoordinate(value: unknown): value is GridCoordinate {
  return (
    isRecord(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number"
  );
}

/**
 * Filtre et convertit un tableau inconnu en liste de coordonnées de grille valides.
 *
 * @param value Valeur inconnue censée être un tableau de coordonnées.
 * @returns Tableau de GridCoordinate valides.
 */
function parseCoordinateList(value: unknown): GridCoordinate[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const result: GridCoordinate[] = [];
  for (const item of value) {
    if (isGridCoordinate(item)) {
      result.push({ x: item.x, y: item.y });
    }
  }
  return result;
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
 * Extrait une chaîne non vide ou retourne une valeur par défaut.
 *
 * @param value Valeur inconnue.
 * @param fallback Valeur de repli.
 * @returns La chaîne valide ou fallback.
 */
function readNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return fallback;
}

/**
 * Analyse et extrait un événement de mise à jour de position depuis un message brut inconnu.
 * Gère de façon transparente les formats `{ event, data }` et `{ type, payload }`.
 *
 * @param raw Données brutes reçues du WebSocket ou du mock.
 * @returns Un objet PlayerPositionUpdate typé ou null si non valide.
 */
export function parsePositionUpdated(raw: unknown): PlayerPositionUpdate | null {
  const envelope = extractEnvelope(raw);
  if (envelope?.eventName !== "POSITION_UPDATED") {
    return null;
  }

  const { content } = envelope;
  if (typeof content.x !== "number" || typeof content.y !== "number") {
    return null;
  }

  const playerId = readNonEmptyString(content.playerId, "p1");
  const direction = isDirection(content.direction) ? content.direction : undefined;

  return {
    playerId,
    x: content.x,
    y: content.y,
    direction,
  };
}

/**
 * Analyse et extrait un événement de pose de bombe (`BOMB_PLACED`).
 *
 * @param raw Données brutes reçues du réseau.
 * @returns Un objet BombPlacedEvent typé ou null si non valide.
 */
export function parseBombPlaced(raw: unknown): BombPlacedEvent | null {
  const envelope = extractEnvelope(raw);
  if (envelope?.eventName !== "BOMB_PLACED") {
    return null;
  }

  const { content } = envelope;
  if (typeof content.x !== "number" || typeof content.y !== "number") {
    return null;
  }

  const playerId = readNonEmptyString(content.playerId, "p1");
  const bombId =
    typeof content.bombId === "string" && content.bombId.length > 0
      ? content.bombId
      : undefined;
  const radius = typeof content.radius === "number" ? content.radius : undefined;

  return {
    bombId,
    playerId,
    x: content.x,
    y: content.y,
    radius,
  };
}

/**
 * Analyse et extrait un événement d'explosion de bombe (`BOMB_EXPLODED`).
 *
 * @param raw Données brutes reçues du réseau.
 * @returns Un objet BombExplodedEvent typé ou null si non valide.
 */
export function parseBombExploded(raw: unknown): BombExplodedEvent | null {
  const envelope = extractEnvelope(raw);
  if (envelope?.eventName !== "BOMB_EXPLODED") {
    return null;
  }

  const { content } = envelope;
  if (typeof content.x !== "number" || typeof content.y !== "number") {
    return null;
  }

  const bombId =
    typeof content.bombId === "string" && content.bombId.length > 0
      ? content.bombId
      : undefined;

  return {
    bombId,
    x: content.x,
    y: content.y,
    affectedTiles: parseCoordinateList(content.affectedTiles),
    destroyedCrates: parseCoordinateList(content.destroyedCrates),
  };
}

/**
 * Vérifie qu'une valeur représente une matrice numérique 2D valide.
 *
 * @param value Valeur inconnue à vérifier.
 * @returns true si value est un tableau non vide de tableaux de nombres.
 */
function isNumericMatrix(value: unknown): value is number[][] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  return value.every(
    (row) => Array.isArray(row) && row.every((cell) => typeof cell === "number"),
  );
}

/**
 * Analyse et extrait une mise à jour de grille (`GRID_UPDATED` ou `GAME_STATE`).
 *
 * @param raw Données brutes reçues du réseau.
 * @returns Un objet GridUpdateEvent typé ou null si non valide.
 */
export function parseGridUpdated(raw: unknown): GridUpdateEvent | null {
  const envelope = extractEnvelope(raw);
  if (
    !envelope ||
    (envelope.eventName !== "GRID_UPDATED" && envelope.eventName !== "GAME_STATE")
  ) {
    return null;
  }

  const rawGrid = envelope.content.grid;
  if (!isNumericMatrix(rawGrid)) {
    return null;
  }

  return {
    grid: rawGrid.map((row) => [...row]),
  };
}

/**
 * Analyse un élément de la liste des joueurs du lobby.
 *
 * @param value Élément brut du tableau players.
 * @returns Un objet LobbyPlayerInfo ou null si invalide.
 */
function parseLobbyPlayer(value: unknown): LobbyPlayerInfo | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    ready: Boolean(value.ready),
  };
}

/**
 * Analyse et extrait une mise à jour du lobby (`LOBBY_UPDATED` ou `LOBBY_UPDATE`).
 *
 * @param raw Données brutes reçues du réseau.
 * @returns Un objet LobbyUpdateEvent typé ou null si non valide.
 */
export function parseLobbyUpdated(raw: unknown): LobbyUpdateEvent | null {
  const envelope = extractEnvelope(raw);
  if (
    !envelope ||
    (envelope.eventName !== "LOBBY_UPDATED" &&
      envelope.eventName !== "LOBBY_UPDATE")
  ) {
    return null;
  }

  const { content } = envelope;
  const players: LobbyPlayerInfo[] = [];
  if (Array.isArray(content.players)) {
    for (const entry of content.players) {
      const parsed = parseLobbyPlayer(entry);
      if (parsed) {
        players.push(parsed);
      }
    }
  }

  return {
    lobbyId: readNonEmptyString(content.lobbyId, "default_room"),
    status: readNonEmptyString(content.status, "waiting"),
    players,
  };
}

/**
 * Analyse et extrait un événement de fin de partie (`GAME_OVER`).
 *
 * @param raw Données brutes reçues du réseau.
 * @returns Un objet GameOverEvent typé ou null si non valide.
 */
export function parseGameOver(raw: unknown): GameOverEvent | null {
  const envelope = extractEnvelope(raw);
  if (envelope?.eventName !== "GAME_OVER") {
    return null;
  }

  const { content } = envelope;
  const winnerId =
    typeof content.winnerId === "string" && content.winnerId.length > 0
      ? content.winnerId
      : null;
  const reason =
    typeof content.reason === "string" && content.reason.length > 0
      ? content.reason
      : undefined;

  return {
    winnerId,
    reason,
  };
}
