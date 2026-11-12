import { isDirection, parsePositionUpdated } from "./game";

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

  describe("parsePositionUpdated", () => {
    it("retourne null pour des données non-objets ou nulles", () => {
      expect(parsePositionUpdated(null)).toBeNull();
      expect(parsePositionUpdated("string")).toBeNull();
      expect(parsePositionUpdated(123)).toBeNull();
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
});
