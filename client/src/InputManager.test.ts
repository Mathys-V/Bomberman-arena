/**
 * @jest-environment jsdom
 */

import { InputManager } from "./InputManager";

describe("InputManager", () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    mockCallback = jest.fn();
    new InputManager(mockCallback);
  });

  it("devrait envoyer un PLAYER_MOVE UP lors de l'appui sur ArrowUp ou KeyW", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowUp" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "UP" },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "UP" },
    });
  });

  it("devrait envoyer un PLAYER_MOVE DOWN lors de l'appui sur ArrowDown ou KeyS", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowDown" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "DOWN" },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "DOWN" },
    });
  });

  it("devrait envoyer un PLAYER_MOVE LEFT lors de l'appui sur ArrowLeft ou KeyA", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "LEFT" },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "LEFT" },
    });
  });

  it("devrait envoyer un PLAYER_MOVE RIGHT lors de l'appui sur ArrowRight ou KeyD", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "RIGHT" },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyD" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLAYER_MOVE",
      payload: { direction: "RIGHT" },
    });
  });

  it("devrait envoyer un PLACE_BOMB lors de l'appui sur Espace", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    expect(mockCallback).toHaveBeenCalledWith({
      type: "PLACE_BOMB",
      payload: {},
    });
  });

  it("ne devrait rien émettre pour une touche non assignée", () => {
    mockCallback.mockClear();
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyQ" }));
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
