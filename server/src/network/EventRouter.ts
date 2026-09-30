// server/src/network/EventRouter.ts

export interface ClientMessage {
  event: string;
  data: any;
}

export interface ServerMessage {
  event: string;
  data: any;
}

export class EventRouter {
  public static handleMessage(rawMessage: string): ServerMessage | null {
    try {
      const message: ClientMessage = JSON.parse(rawMessage);

      switch (message.event) {
        case "JOIN_LOBBY":
          return {
            event: "LOBBY_UPDATED",
            data: {
              lobbyId: message.data?.lobbyId || "default_room",
              status: "waiting",
              players: [{ id: message.data?.playerId || "unknown", name: message.data?.name || "Player", ready: true }]
            }
          };

        case "PLAYER_MOVE":
          return {
            event: "POSITION_UPDATED",
            data: {
              playerId: message.data?.playerId,
              x: message.data?.x,
              y: message.data?.y,
              direction: message.data?.direction
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
    } catch (error) {
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