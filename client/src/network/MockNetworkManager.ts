import { INetworkManager } from "./INetworkManager";
import { Direction, isDirection, PlayerPositionUpdate } from "../types/game";

/**
 * Simulateur réseau hors-ligne (MockNetworkManager).
 * Répond à l'exigence formelle du cahier des charges :
 * "Capacité à lancer et tester l'interface graphique hors ligne avec de fausses données".
 */
export class MockNetworkManager implements INetworkManager {
  private readonly listeners: Array<(data: unknown) => void>;
  private p1X: number;
  private p1Y: number;
  private p2X: number;
  private p2Y: number;
  private botTimer: ReturnType<typeof setInterval> | null = null;
  private readonly mapLayout?: readonly string[];

  /**
   * Initialise le gestionnaire simulé.
   *
   * @param mapLayout Schéma de la carte optionnel pour la vérification des collisions hors-ligne.
   */
  constructor(mapLayout?: readonly string[]) {
    this.listeners = [];
    this.p1X = 1;
    this.p1Y = 1;
    this.p2X = 11;
    this.p2Y = 11;
    this.mapLayout = mapLayout;
  }

  /**
   * Simule la connexion réseau réussie.
   */
  public connect(): void {
    console.log("[MockNetworkManager] Mode hors-ligne activé (simulation locale).");
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
   * @param message Message émis par l'InputManager.
   */
  public sendMessage(message: object): void {
    const record = message as Record<string, unknown>;
    const actionType = typeof record.type === "string" ? record.type : record.event;

    if (actionType === "PLAYER_MOVE") {
      const payload = (record.payload ?? record.data) as Record<string, unknown> | undefined;
      const rawDirection = payload?.direction;

      if (isDirection(rawDirection)) {
        this.handlePlayerMove(rawDirection);
      }
    }
  }

  /**
   * Traite le déplacement de J1 en appliquant la détection d'obstacles.
   *
   * @param direction Direction souhaitée.
   */
  private handlePlayerMove(direction: Direction): void {
    const offsets: Record<Direction, [number, number]> = {
      UP: [0, -1],
      DOWN: [0, 1],
      LEFT: [-1, 0],
      RIGHT: [1, 0],
    };

    const [dx, dy] = offsets[direction];
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
   * Vérifie si une case cible est praticable.
   *
   * @param x Coordonnée X.
   * @param y Coordonnée Y.
   * @returns true si la case est libre.
   */
  private canMoveTo(x: number, y: number): boolean {
    if (!this.mapLayout) {
      return x >= 0 && y >= 0;
    }
    const row = this.mapLayout[y];
    if (!row) {
      return false;
    }
    const cell = row[x];
    return cell === ".";
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
      const offsets: Record<Direction, [number, number]> = {
        UP: [0, -1],
        DOWN: [0, 1],
        LEFT: [-1, 0],
        RIGHT: [1, 0],
      };
      const [dx, dy] = offsets[dir];
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
   * Ferme et nettoie la simulation.
   */
  public disconnect(): void {
    this.stopBotSimulation();
    this.listeners.length = 0;
  }
}
