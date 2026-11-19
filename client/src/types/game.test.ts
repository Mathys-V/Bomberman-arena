import {
  isDirection,
  isGridCoordinate,
  parseBombExploded,
  parseBombPlaced,
  parseGameOver,
  parseGridUpdated,
  parseLobbyUpdated,
  parsePositionUpdated,
} from "./game";

describe("game types & validators", () => {
  describe("isDirection", () => {
    it("valide les directions autorisées", () => {
      expect(isDirection("UP")).toBe(true);
      expect(isDirection("DOWN")).toBe(true);
      expect(isDirection("LEFT")).toBe(true);
      expect(isDirection("RIGHT")).toBe(true);
    });

    it("rejette les valeurs invalides", () => {
      expect(isDirection("JUMP")).toBe(false);
      expect(isDirection(42)).toBe(false);
      expect(isDirection(null)).toBe(false);
      expect(isDirection(undefined)).toBe(false);
      expect(isDirection({})).toBe(false);
    });
  });

  describe("isGridCoordinate", () => {
    it("valide un couple { x, y } numérique", () => {
      expect(isGridCoordinate({ x: 0, y: 5 })).toBe(true);
    });

    it("rejette les objets incomplets ou non-objets", () => {
      expect(isGridCoordinate(null)).toBe(false);
      expect(isGridCoordinate({ x: 1 })).toBe(false);
      expect(isGridCoordinate({ x: "1", y: 2 })).toBe(false);
    });
  });

  describe("parsePositionUpdated", () => {
    it("retourne null pour des données non-objets, nulles ou sans nom d'événement", () => {
      expect(parsePositionUpdated(null)).toBeNull();
      expect(parsePositionUpdated("string")).toBeNull();
      expect(parsePositionUpdated(123)).toBeNull();
      expect(parsePositionUpdated({ data: { x: 1, y: 1 } })).toBeNull();
      expect(parsePositionUpdated({ event: "POSITION_UPDATED" })).toBeNull();
    });

    it("retourne null si l'événement n'est pas POSITION_UPDATED", () => {
      expect(
        parsePositionUpdated({
          event: "OTHER_EVENT",
          data: { x: 1, y: 1 },
        }),
      ).toBeNull();
    });

    it("analyse le format { event, data }", () => {
      const parsed = parsePositionUpdated({
        event: "POSITION_UPDATED",
        data: {
          playerId: "p1",
          x: 2,
          y: 4,
          direction: "RIGHT",
        },
      });

      expect(parsed).toEqual({
        playerId: "p1",
        x: 2,
        y: 4,
        direction: "RIGHT",
      });
    });

    it("analyse le format { type, payload }", () => {
      const parsed = parsePositionUpdated({
        type: "POSITION_UPDATED",
        payload: {
          playerId: "p2",
          x: 10,
          y: 10,
          direction: "LEFT",
        },
      });

      expect(parsed).toEqual({
        playerId: "p2",
        x: 10,
        y: 10,
        direction: "LEFT",
      });
    });

    it("fournit 'p1' par défaut si playerId est absent", () => {
      const parsed = parsePositionUpdated({
        event: "POSITION_UPDATED",
        data: { x: 3, y: 3 },
      });

      expect(parsed?.playerId).toBe("p1");
      expect(parsed?.direction).toBeUndefined();
    });

    it("retourne null si les coordonnées x ou y sont manquantes", () => {
      expect(
        parsePositionUpdated({
          event: "POSITION_UPDATED",
          data: { x: 1 },
        }),
      ).toBeNull();
      expect(
        parsePositionUpdated({
          event: "POSITION_UPDATED",
          data: { y: 2 },
        }),
      ).toBeNull();
    });
  });

  describe("parseBombPlaced", () => {
    it("analyse un message BOMB_PLACED complet", () => {
      const parsed = parseBombPlaced({
        event: "BOMB_PLACED",
        data: {
          bombId: "b1",
          playerId: "p2",
          x: 4,
          y: 6,
          radius: 3,
        },
      });

      expect(parsed).toEqual({
        bombId: "b1",
        playerId: "p2",
        x: 4,
        y: 6,
        radius: 3,
      });
    });

    it("applique les valeurs par défaut si bombId, playerId ou radius sont omis", () => {
      const parsed = parseBombPlaced({
        type: "BOMB_PLACED",
        payload: { x: 1, y: 2 },
      });

      expect(parsed).toEqual({
        bombId: undefined,
        playerId: "p1",
        x: 1,
        y: 2,
        radius: undefined,
      });
    });

    it("retourne null pour un événement autre ou des coordonnées manquantes", () => {
      expect(parseBombPlaced({ event: "OTHER", data: { x: 1, y: 1 } })).toBeNull();
      expect(parseBombPlaced({ event: "BOMB_PLACED", data: { x: 1 } })).toBeNull();
    });
  });

  describe("parseBombExploded", () => {
    it("analyse un message BOMB_EXPLODED avec cases touchées et caisses détruites", () => {
      const parsed = parseBombExploded({
        event: "BOMB_EXPLODED",
        data: {
          bombId: "b1",
          x: 3,
          y: 3,
          affectedTiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }, "invalid"],
          destroyedCrates: [{ x: 4, y: 3 }],
        },
      });

      expect(parsed).toEqual({
        bombId: "b1",
        x: 3,
        y: 3,
        affectedTiles: [
          { x: 3, y: 3 },
          { x: 4, y: 3 },
        ],
        destroyedCrates: [{ x: 4, y: 3 }],
      });
    });

    it("retourne des tableaux vides si affectedTiles/destroyedCrates ne sont pas des tableaux", () => {
      const parsed = parseBombExploded({
        type: "BOMB_EXPLODED",
        payload: { x: 2, y: 2 },
      });

      expect(parsed).toEqual({
        bombId: undefined,
        x: 2,
        y: 2,
        affectedTiles: [],
        destroyedCrates: [],
      });
    });

    it("retourne null si invalide", () => {
      expect(parseBombExploded({ event: "OTHER", data: { x: 1, y: 1 } })).toBeNull();
      expect(parseBombExploded({ event: "BOMB_EXPLODED", data: { y: 1 } })).toBeNull();
    });
  });

  describe("parseGridUpdated", () => {
    it("analyse GRID_UPDATED et GAME_STATE avec une matrice valide", () => {
      const matrix = [
        [1, 1, 1],
        [1, 0, 2],
      ];
      expect(
        parseGridUpdated({ event: "GRID_UPDATED", data: { grid: matrix } }),
      ).toEqual({ grid: matrix });
      expect(
        parseGridUpdated({ type: "GAME_STATE", payload: { grid: matrix } }),
      ).toEqual({ grid: matrix });
    });

    it("retourne null si la grille est absente, vide ou mal typée", () => {
      expect(parseGridUpdated({ event: "OTHER", data: { grid: [[0]] } })).toBeNull();
      expect(parseGridUpdated({ event: "GRID_UPDATED", data: { grid: [] } })).toBeNull();
      expect(
        parseGridUpdated({ event: "GRID_UPDATED", data: { grid: [["#"]] } }),
      ).toBeNull();
      expect(parseGridUpdated({ event: "GRID_UPDATED", data: {} })).toBeNull();
    });
  });

  describe("parseLobbyUpdated", () => {
    it("analyse LOBBY_UPDATED et LOBBY_UPDATE et filtre les joueurs invalides", () => {
      const parsed = parseLobbyUpdated({
        event: "LOBBY_UPDATED",
        data: {
          lobbyId: "room_42",
          status: "ready",
          players: [
            { id: "p1", name: "Lukas", ready: true },
            { id: "p2", name: "Julie", ready: false },
            null,
            { id: 123, name: "Bad" },
          ],
        },
      });

      expect(parsed).toEqual({
        lobbyId: "room_42",
        status: "ready",
        players: [
          { id: "p1", name: "Lukas", ready: true },
          { id: "p2", name: "Julie", ready: false },
        ],
      });
    });

    it("applique les valeurs par défaut si lobbyId/status/players sont absents", () => {
      const parsed = parseLobbyUpdated({
        type: "LOBBY_UPDATE",
        payload: {},
      });

      expect(parsed).toEqual({
        lobbyId: "default_room",
        status: "waiting",
        players: [],
      });
    });

    it("retourne null si ce n'est pas un événement lobby", () => {
      expect(parseLobbyUpdated({ event: "OTHER", data: {} })).toBeNull();
    });
  });

  describe("parseGameOver", () => {
    it("analyse GAME_OVER avec vainqueur et raison", () => {
      expect(
        parseGameOver({
          event: "GAME_OVER",
          data: { winnerId: "p1", reason: "last_standing" },
        }),
      ).toEqual({ winnerId: "p1", reason: "last_standing" });
    });

    it("gère un match nul (winnerId null)", () => {
      expect(
        parseGameOver({
          type: "GAME_OVER",
          payload: { winnerId: null },
        }),
      ).toEqual({ winnerId: null, reason: undefined });
    });

    it("retourne null pour un autre événement", () => {
      expect(parseGameOver({ event: "OTHER", data: {} })).toBeNull();
    });
  });
});
