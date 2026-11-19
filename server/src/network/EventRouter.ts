// src/network/EventRouter.ts
import { Player } from '../engine/Player';
import { Grid } from '../engine/Grid';

export interface ClientMessage {
  event: string;
  data: Record<string, unknown>;
}

export interface ServerMessage {
  event: string;
  data: Record<string, unknown>;
}

export class EventRouter {
  private static readonly players: Map<string, Player> = new Map();
  private static grid: Grid = new Grid(13, 13); // Dimension corrigée en 13x13

  public static setGrid(customGrid: Grid): void {
    this.grid = customGrid;
  }

  public static handleMessage(rawMessage: string): ServerMessage | null {
    try {
      const message: ClientMessage = JSON.parse(rawMessage);
      const data = message.data || {};

      switch (message.event) {
        case "JOIN_LOBBY": {
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
        }

        case "PLAYER_MOVE": {
          const pId = (data.playerId as string) || "unknown";
          const direction = data.direction as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

          if (!this.players.has(pId)) {
            const startX = typeof data.x === 'number' ? data.x : 0;
            const startY = typeof data.y === 'number' ? data.y : 0;
            this.players.set(pId, new Player(startX, startY));
          }
          
          const player = this.players.get(pId)!;
          
          // Suppression du bypass p1 : tout le monde utilise les vraies collisions
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

        case "PLACE_BOMB": {
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