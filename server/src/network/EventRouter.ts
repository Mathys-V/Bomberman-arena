// server/src/network/EventRouter.ts

export interface ClientMessage {
  event: string;
  data: Record<string, unknown>;
}

export interface ServerMessage {
  event: string;
  data: Record<string, unknown>;
}

export class EventRouter {
  public static handleMessage(rawMessage: string): ServerMessage | null {
    try {
      const message: ClientMessage = JSON.parse(rawMessage);
      const data = message.data || {};

      switch (message.event) {
        case "JOIN_LOBBY":
          return {
            event: "LOBBY_UPDATED",
            data: {
              lobbyId: (data.lobbyId as string) || "default_room",
              status: "waiting",
              players: [{ id: (data.playerId as string) || "unknown", name: (data.name as string) || "Player", ready: true }]
            }
          };

        case "PLAYER_MOVE":
          return {
            event: "POSITION_UPDATED",
            data: {
              playerId: data.playerId,
              x: data.x,
              y: data.y,
              direction: data.direction
            }
          };

        default:
          return {
            event: "ERROR",
            data: {
              code: "UNKNOWN_EVENT",
              message: `L'événement ${message.event} n'est pas reconnu.`
            }
          };
      }
    } catch {
      return {
        event: "ERROR",
        data: {
          code: "INVALID_JSON",
          message: "Le format du message JSON est invalide."
        }
      };
    }
  }
}