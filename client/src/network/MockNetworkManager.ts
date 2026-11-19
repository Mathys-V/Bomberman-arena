import { INetworkManager } from "./INetworkManager";
import {
  Direction,
  GridCoordinate,
  isDirection,
  PlayerPositionUpdate,
} from "../types/game";

const DIRECTION_OFFSETS: Readonly<Record<Direction, readonly [number, number]>> =
  {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0],
  };

const EXPLOSION_DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Simulateur réseau hors-ligne (MockNetworkManager).
 * Répond à l'exigence formelle du cahier des charges :
 * "Capacité à lancer et tester l'interface graphique hors ligne avec de fausses données".
 */
export class MockNetworkManager implements INetworkManager {
  private readonly listeners: Array<(data: unknown) => void>;
  private readonly bombTimers: Set<ReturnType<typeof setTimeout>>;
  private readonly mutableMap: string[][] | null;
  private readonly bombDelayMs: number;
  private readonly bombRadius: number;
  private p1X: number;
  private p1Y: number;
  private p2X: number;
  private p2Y: number;
  private bombSequence: number;
  private botTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialise le gestionnaire simulé.
   *
   * @param mapLayout Schéma de la carte optionnel pour les collisions et caisses destructibles.
   * @param bombDelayMs Délai en millisecondes avant explosion d'une bombe (défaut : 2000).
   * @param bombRadius Portée d'explosion en nombre de cases (défaut : 2).
   */
  constructor(
    mapLayout?: readonly string[],
    bombDelayMs: number = 2000,
    bombRadius: number = 2,
  ) {
    this.listeners = [];
    this.bombTimers = new Set();
    this.mutableMap = mapLayout ? mapLayout.map((row) => row.split("")) : null;
    this.bombDelayMs = bombDelayMs;
    this.bombRadius = bombRadius;
    this.p1X = 1;
    this.p1Y = 1;
    this.p2X = 11;
    this.p2Y = 11;
    this.bombSequence = 0;
  }

  /**
   * Simule la connexion réseau réussie.
   */
  public connect(): void {
    console.log(
      "[MockNetworkManager] Mode hors-ligne activé (simulation locale).",
    );
  }

  /**
   * Enregistre un écouteur de messages simulés.
   *
   * @param callback Fonction recevant les données générées.
   */
  public listen(callback: (data: unknown) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Diffuse un message simulé à tous les écouteurs enregistrés.
   *
   * @param data Objet de données simulé.
   */
  private broadcast(data: unknown): void {
    for (const listener of this.listeners) {
      listener(data);
    }
  }

  /**
   * Intercepte un message envoyé par le client et simule la réponse du serveur.
   *
   * @param message Message émis par l'InputManager ou le Lobby.
   */
  public sendMessage(message: object): void {
    const record = message as Record<string, unknown>;
    const actionType =
      typeof record.type === "string" ? record.type : record.event;
    const payload = (record.payload ?? record.data) as
      | Record<string, unknown>
      | undefined;

    if (actionType === "PLAYER_MOVE") {
      const rawDirection = payload?.direction;
      if (isDirection(rawDirection)) {
        this.handlePlayerMove(rawDirection);
      }
      return;
    }

    if (actionType === "PLACE_BOMB") {
      this.handlePlaceBomb();
      return;
    }

    if (actionType === "JOIN_LOBBY") {
      this.handleJoinLobby(payload);
    }
  }

  /**
   * Traite le déplacement de J1 en appliquant la détection d'obstacles.
   *
   * @param direction Direction souhaitée.
   */
  private handlePlayerMove(direction: Direction): void {
    const [dx, dy] = DIRECTION_OFFSETS[direction];
    const nextX = this.p1X + dx;
    const nextY = this.p1Y + dy;

    if (this.canMoveTo(nextX, nextY)) {
      this.p1X = nextX;
      this.p1Y = nextY;

      this.broadcast({
        event: "POSITION_UPDATED",
        data: {
          playerId: "p1",
          x: this.p1X,
          y: this.p1Y,
          direction,
        },
      });
    }
  }

  /**
   * Simule la pose d'une bombe aux coordonnées courantes du Joueur 1
   * et programme son explosion asynchrone.
   */
  private handlePlaceBomb(): void {
    this.bombSequence += 1;
    const bombId = `mock-bomb-${this.bombSequence}`;
    const bombX = this.p1X;
    const bombY = this.p1Y;

    this.broadcast({
      event: "BOMB_PLACED",
      data: {
        bombId,
        playerId: "p1",
        x: bombX,
        y: bombY,
        radius: this.bombRadius,
      },
    });

    const timer = setTimeout(() => {
      this.bombTimers.delete(timer);
      const { affectedTiles, destroyedCrates } = this.computeExplosion(
        bombX,
        bombY,
      );

      this.broadcast({
        event: "BOMB_EXPLODED",
        data: {
          bombId,
          x: bombX,
          y: bombY,
          affectedTiles,
          destroyedCrates,
        },
      });
    }, this.bombDelayMs);

    this.bombTimers.add(timer);
  }

  /**
   * Calcule la propagation en croix d'une explosion en respectant murs (#) et caisses (B).
   * Détruit également les caisses touchées dans la carte locale simulée.
   *
   * @param originX Coordonnée X de la bombe.
   * @param originY Coordonnée Y de la bombe.
   * @returns Cases affectées et caisses détruites.
   */
  private computeExplosion(
    originX: number,
    originY: number,
  ): { affectedTiles: GridCoordinate[]; destroyedCrates: GridCoordinate[] } {
    const affectedTiles: GridCoordinate[] = [{ x: originX, y: originY }];
    const destroyedCrates: GridCoordinate[] = [];

    for (const [dx, dy] of EXPLOSION_DIRECTIONS) {
      this.propagateDirection(
        originX,
        originY,
        dx,
        dy,
        affectedTiles,
        destroyedCrates,
      );
    }

    return { affectedTiles, destroyedCrates };
  }

  /**
   * Propage le souffle d'explosion dans une direction donnée jusqu'au rayon ou un obstacle.
   */
  private propagateDirection(
    originX: number,
    originY: number,
    dx: number,
    dy: number,
    affectedTiles: GridCoordinate[],
    destroyedCrates: GridCoordinate[],
  ): void {
    for (let step = 1; step <= this.bombRadius; step += 1) {
      const checkX = originX + dx * step;
      const checkY = originY + dy * step;

      if (!this.mutableMap) {
        if (checkX >= 0 && checkY >= 0) {
          affectedTiles.push({ x: checkX, y: checkY });
        }
        continue;
      }

      const cell = this.mutableMap[checkY]?.[checkX];
      if (!cell || cell === "#") {
        break;
      }

      affectedTiles.push({ x: checkX, y: checkY });
      if (cell === "B") {
        this.mutableMap[checkY][checkX] = ".";
        destroyedCrates.push({ x: checkX, y: checkY });
        break;
      }
    }
  }

  /**
   * Simule la réponse du lobby lorsqu'un joueur rejoint la partie.
   *
   * @param payload Données d'entrée contenant le pseudo du joueur.
   */
  private handleJoinLobby(payload?: Record<string, unknown>): void {
    const rawName = payload?.playerName ?? payload?.name;
    const playerName =
      typeof rawName === "string" && rawName.length > 0 ? rawName : "Player1";

    this.broadcast({
      event: "LOBBY_UPDATED",
      data: {
        lobbyId: "mock_room",
        status: "waiting",
        players: [{ id: "p1", name: playerName, ready: true }],
      },
    });
  }

  /**
   * Vérifie si une case cible est praticable.
   *
   * @param x Coordonnée X.
   * @param y Coordonnée Y.
   * @returns true si la case est libre.
   */
  private canMoveTo(x: number, y: number): boolean {
    if (!this.mutableMap) {
      return x >= 0 && y >= 0;
    }
    const row = this.mutableMap[y];
    if (!row) {
      return false;
    }
    return row[x] === ".";
  }

  /**
   * Injecte directement un déplacement simulé d'un joueur tiers (ex: Joueur 2).
   * Très utile pour les tests d'intégration hors-ligne et les scénarios Cypress.
   *
   * @param update Données de position à injecter.
   */
  public simulateRemoteMove(update: PlayerPositionUpdate): void {
    this.broadcast({
      event: "POSITION_UPDATED",
      data: update,
    });
  }

  /**
   * Démarre une patrouille automatique pour simuler le Joueur 2 en direct.
   *
   * @param intervalMs Intervalle de déplacement en millisecondes.
   */
  public startBotSimulation(intervalMs: number = 1000): void {
    if (this.botTimer) {
      return;
    }

    let step = 0;
    const patrolMoves: Direction[] = ["LEFT", "UP", "RIGHT", "DOWN"];

    this.botTimer = setInterval(() => {
      const dir = patrolMoves[step % patrolMoves.length];
      const [dx, dy] = DIRECTION_OFFSETS[dir];
      const nextX = this.p2X + dx;
      const nextY = this.p2Y + dy;

      if (this.canMoveTo(nextX, nextY)) {
        this.p2X = nextX;
        this.p2Y = nextY;
      }
      step += 1;

      this.simulateRemoteMove({
        playerId: "p2",
        x: this.p2X,
        y: this.p2Y,
        direction: dir,
      });
    }, intervalMs);
  }

  /**
   * Arrête la simulation du bot.
   */
  public stopBotSimulation(): void {
    if (this.botTimer) {
      clearInterval(this.botTimer);
      this.botTimer = null;
    }
  }

  /**
   * Ferme et nettoie la simulation (bot, minuteries de bombes et écouteurs).
   */
  public disconnect(): void {
    this.stopBotSimulation();
    for (const timer of this.bombTimers) {
      clearTimeout(timer);
    }
    this.bombTimers.clear();
    this.listeners.length = 0;
  }
}
