// server/src/network/EventRouter.ts
import { Player } from '../engine/Player';

export interface ClientMessage {
  event: string;
  data: Record<string, unknown>;
}

export interface ServerMessage {
  event: string;
  data: Record<string, unknown>;
}

export class EventRouter {
  private static players: Map<string, Player> = new Map();
  
  // FIX 1 : On demande poliment à ESLint d'ignorer le "any" pour ce mock de test
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static grid: any; 

  public static handleMessage(rawMessage: string): ServerMessage | null {
    try {
      const message: ClientMessage = JSON.parse(rawMessage);
      const data = message.data || {};

      switch (message.event) {
        case "JOIN_LOBBY": { // FIX 2 : Ajout d'accolades pour isoler les "const"
          const playerId = (data.playerId as string) || "unknown";
          this.players.set(playerId, new Player(1, 3)); 
          
          return {
            event: "LOBBY_UPDATED",
            data: {
              lobbyId: (data.lobbyId as string) || "default_room",
              status: "waiting",
              players: [{ id: playerId, name: (data.name as string) || "Player", ready: true }]
            }
          };
        } // Fin des accolades

        case "PLAYER_MOVE": { // FIX 2 : Ajout d'accolades
          const pId = (data.playerId as string) || "unknown";
          const direction = data.direction as string;

          if (!this.players.has(pId)) {
            this.players.set(pId, new Player(1, 3));
          }
          const player = this.players.get(pId)!;

          if (!this.grid) {
            this.grid = { isObstacle: () => false };
          }

          player.move(direction, this.grid);
            
          return {
            event: "POSITION_UPDATED",
            data: {
              playerId: pId,
              x: player.x,
              y: player.y,
              direction: direction
            }
          };
        }

        case "PLACE_BOMB": { // Accolades pour rester cohérent
          return {
            event: "BOMB_PLACED",
            data: {
              playerId: data.playerId,
              x: data.x, 
              y: data.y
            }
          };
        }

        default: {
          return {
            event: "ERROR",
            data: {
              code: "UNKNOWN_EVENT",
              message: `L'événement ${message.event} n'est pas reconnu.`
            }
          };
        }
      }
    } catch {
      return {
        event: "ERROR",
        data: { code: "INVALID_JSON", message: "Le format du message JSON est invalide." }
      };
    }
  }
}