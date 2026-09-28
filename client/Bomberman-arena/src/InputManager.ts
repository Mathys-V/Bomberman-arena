// Définition de nos types basés sur le contrat JSON
type ActionType = "PLAYER_MOVE" | "PLACE_BOMB";
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

// On utilise le type 'Direction' ici pour corriger les deux erreurs :
// 1. Direction est maintenant utilisé.
// 2. On n'utilise plus le mot interdit 'any'.
interface GameMessage {
  type: ActionType;
  payload: { direction?: Direction };
}

export class InputManager {
  // Le callback qui sera appelé à chaque touche pressée
  // Cela permet de découpler totalement cette classe du réseau !
  private onMessageGenerated: (message: GameMessage) => void;

  constructor(onMessageGenerated: (message: GameMessage) => void) {
    this.onMessageGenerated = onMessageGenerated;
    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener("keydown", (event: KeyboardEvent) => {
      this.handleInput(event);
    });
  }

  private handleInput(event: KeyboardEvent): void {
    // On évite le comportement par défaut (comme le scroll de la page avec espace)
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
