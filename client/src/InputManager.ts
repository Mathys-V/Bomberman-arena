import { ActionType, Direction } from "./types/game";

/**
 * Message généré par l'InputManager lors d'une action utilisateur.
 */
export interface GameMessage {
  type: ActionType;
  payload: { direction?: Direction };
}

/**
 * Gestionnaire des entrées utilisateur (clavier).
 * Isole totalement la capture des touches de la logique réseau grâce à un callback injecté.
 */
export class InputManager {
  private readonly onMessageGenerated: (message: GameMessage) => void;

  /**
   * Initialise l'InputManager avec la fonction de rappel appelée à chaque action.
   *
   * @param onMessageGenerated Callback recevant le message généré.
   */
  constructor(onMessageGenerated: (message: GameMessage) => void) {
    this.onMessageGenerated = onMessageGenerated;
    this.initListeners();
  }

  /**
   * Enregistre l'écouteur d'événements clavier sur l'objet window.
   */
  private initListeners(): void {
    window.addEventListener("keydown", (event: KeyboardEvent) => {
      this.handleInput(event);
    });
  }

  /**
   * Traite l'événement clavier et produit l'intention de jeu appropriée.
   *
   * @param event Événement clavier déclenché.
   */
  private handleInput(event: KeyboardEvent): void {
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        event.code,
      )
    ) {
      event.preventDefault();
    }

    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.onMessageGenerated({
          type: "PLAYER_MOVE",
          payload: { direction: "UP" },
        });
        break;
      case "ArrowDown":
      case "KeyS":
        this.onMessageGenerated({
          type: "PLAYER_MOVE",
          payload: { direction: "DOWN" },
        });
        break;
      case "ArrowLeft":
      case "KeyA":
        this.onMessageGenerated({
          type: "PLAYER_MOVE",
          payload: { direction: "LEFT" },
        });
        break;
      case "ArrowRight":
      case "KeyD":
        this.onMessageGenerated({
          type: "PLAYER_MOVE",
          payload: { direction: "RIGHT" },
        });
        break;
      case "Space":
        this.onMessageGenerated({ type: "PLACE_BOMB", payload: {} });
        break;
    }
  }
}
