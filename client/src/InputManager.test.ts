/**
 * @jest-environment jsdom
 */

import { InputManager } from "./InputManager";

describe("InputManager", () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    // On crée un faux callback pour espionner ce que l'InputManager lui envoie
    mockCallback = jest.fn();
    new InputManager(mockCallback);
  });

  it("devrait envoyer un PLAYER_MOVE UP lors de l'appui sur ArrowUp", () => {
    // On simule l'appui sur la flèche du haut
    const event = new KeyboardEvent("keydown", { code: "ArrowUp" });
    window.dispatchEvent(event);

    // On vérifie que notre callback a bien été appelé avec le bon JSON
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "UP" },
    });
  });

  it("devrait envoyer un PLACE_BOMB lors de l'appui sur Espace", () => {
    const event = new KeyboardEvent("keydown", { code: "Space" });
    window.dispatchEvent(event);

    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLACE_BOMB",
      payload: {},
    });
  });
});
