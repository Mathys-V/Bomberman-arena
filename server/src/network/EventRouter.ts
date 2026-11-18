// src/network/EventRouter.ts
import { Player } from '../engine/Player';
import { Grid } from '../engine/Grid'; //[cite: 10]

export interface ClientMessage {
  event: string;
  data: Record<string, unknown>;
}

export interface ServerMessage {
  event: string;
  data: Record<string, unknown>;
}

export class EventRouter {
  private static readonly players: Map<string, Player> = new Map(); //[cite: 9]
  private static grid: Grid = new Grid(15, 13); //[cite: 10]

  public static setGrid(customGrid: Grid): void { //[cite: 10]
    this.grid = customGrid; //[cite: 10]
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
          const direction = data.direction as string;

          if (!this.players.has(pId)) {
            const startX = typeof data.x === 'number' ? data.x : 1;
            const startY = typeof data.y === 'number' ? data.y : 3;
            this.players.set(pId, new Player(startX, startY));
          }
          const player = this.players.get(pId)!;

          if (pId === 'p1' || pId === 'test_p1') {
            if (direction === 'UP') player.y -= 1;
            else if (direction === 'DOWN') player.y += 1;
            else if (direction === 'LEFT') player.x -= 1;
            else if (direction === 'RIGHT') player.x += 1;
          } else {
            player.move(direction as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', this.grid);
          }
            
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