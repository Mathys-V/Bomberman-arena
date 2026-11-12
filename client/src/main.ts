import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
  TilingSprite,
} from "pixi.js";
import { InputManager } from "./InputManager";
import { NetworkManager } from "./NetworkManager";
import { MockNetworkManager } from "./network/MockNetworkManager";
import { INetworkManager } from "./network/INetworkManager";
import { EventBus } from "./core/EventBus";
import {
  Direction,
  parsePositionUpdated,
  PlayerPositionUpdate,
} from "./types/game";
import "./styles.css";

// -----------------------------------------------------------------------------
// Configuration et constantes de l'arène
// -----------------------------------------------------------------------------

const boardSize = 13;
const tileSize = 32;
const arenaWidth = boardSize * tileSize;
const arenaHeight = boardSize * tileSize;
const playerScale = 1.69;
const playerMoveDuration = 140;
const playerFrameDuration = 75;

type ArenaTiles = Record<
  | "ground"
  | "breakable"
  | "limitsabs"
  | "limitsord"
  | "limitsHG"
  | "limitsHD"
  | "limitsBG"
  | "limitsBD"
  | "solid",
  Texture
>;

type ArenaLayers = {
  floor: Container;
  decor: Container;
  dynamic: Container;
};

/**
 * Carte statique par défaut (utilisée pour l'arène et les collisions de base).
 */
export const defaultMap: readonly string[] = [
  "#############",
  "#...........#",
  "#.B.B.B.B...#",
  "#...........#",
  "#...#...#...#",
  "#..B...B....#",
  "#...........#",
  "#....#......#",
  "#..B...B....#",
  "#...........#",
  "#...#...#...#",
  "#...........#",
  "#############",
];

// -----------------------------------------------------------------------------
// Éléments du DOM et Navigation
// -----------------------------------------------------------------------------

const gameBoard = document.querySelector<HTMLElement>("#game-board");
if (!gameBoard) {
  throw new Error("#game-board introuvable");
}

const homeScreen = document.querySelector<HTMLElement>("#home-screen");
const gameScreen = document.querySelector<HTMLElement>("#game-screen");
const playButton = document.querySelector<HTMLButtonElement>("#play-button");
const launchStatus = document.querySelector<HTMLElement>("#launch-status");
if (!homeScreen || !gameScreen || !playButton || !launchStatus) {
  throw new Error("Éléments de navigation introuvables");
}

let gameStarted = false;

// -----------------------------------------------------------------------------
// Bus d'événements et Instances Réseau / Contrôles
// -----------------------------------------------------------------------------

export const eventBus = new EventBus();
export let activeNetworkManager: INetworkManager | null = null;
export let activeInputManager: InputManager | null = null;

// -----------------------------------------------------------------------------
// Couches graphiques PixiJS
// -----------------------------------------------------------------------------

const layers: ArenaLayers = {
  floor: new Container(),
  decor: new Container(),
  dynamic: new Container(),
};

const arenaContainer = new Container();
arenaContainer.addChild(layers.floor, layers.decor, layers.dynamic);

let currentTiles: ArenaTiles;

// -----------------------------------------------------------------------------
// Entités Joueurs et Animations
// -----------------------------------------------------------------------------

interface PlayerEntity {
  readonly id: string;
  readonly sprite: Sprite;
  readonly walkFrames: Texture[];
  gridX: number;
  gridY: number;
  moving: boolean;
  elapsed: number;
  animationTime: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  frameBase: number;
}

const players = new Map<string, PlayerEntity>();
let playerInset = 0;

const directionFrameBase: Record<Direction, number> = {
  DOWN: 0,
  UP: 3,
  LEFT: 6,
  RIGHT: 9,
};

// -----------------------------------------------------------------------------
// Textures et Découpage
// -----------------------------------------------------------------------------

function cropTexture(
  texture: Texture,
  x: number,
  y: number,
  size: number,
): Texture {
  return new Texture({
    source: texture.source,
    frame: new Rectangle(x, y, size, size),
  });
}

function createFallbackTile(app: Application, color: number): Texture {
  const graphic = new Graphics().rect(0, 0, 8, 8).fill(color);
  return app.renderer.generateTexture({ target: graphic });
}

async function loadTileset(): Promise<ArenaTiles> {
  const atlasTileSize = 16;
  const atlas = await Assets.load<Texture>(
    new URL("./assets/ArenaAS.png", import.meta.url).href,
  );
  const tiles: ArenaTiles = {
    ground: cropTexture(atlas, 16, 16, atlasTileSize),
    breakable: cropTexture(atlas, 48, 48, atlasTileSize),
    limitsabs: cropTexture(atlas, 16, 32, atlasTileSize),
    limitsord: cropTexture(atlas, 0, 16, atlasTileSize),
    limitsHG: cropTexture(atlas, 0, 0, atlasTileSize),
    limitsHD: cropTexture(atlas, 32, 0, atlasTileSize),
    limitsBG: cropTexture(atlas, 0, 32, atlasTileSize),
    limitsBD: cropTexture(atlas, 32, 32, atlasTileSize),
    solid: cropTexture(atlas, 32, 16, atlasTileSize),
  };

  try {
    const grass = await Assets.load<Texture>(
      new URL("./assets/GRASS+.png", import.meta.url).href,
    );
    tiles.ground = cropTexture(grass, 0, atlasTileSize, atlasTileSize);
  } catch (error) {
    console.warn("GRASS+.png non chargé, sol de ArenaAS.png utilisé.", error);
  }

  try {
    const solidRock = await Assets.load<Texture>(
      new URL("./assets/Tiled_Rock_Wall.png", import.meta.url).href,
    );
    const weakRock = await Assets.load<Texture>(
      new URL("./assets/Wall_Rock_Moss.png", import.meta.url).href,
    );
    tiles.solid = cropTexture(solidRock, 0, 0, tileSize);
    tiles.breakable = cropTexture(weakRock, 0, tileSize, tileSize);
  } catch (error) {
    console.warn(
      "Textures de rochers non chargées, textures de ArenaAS.png utilisées.",
      error,
    );
  }

  return tiles;
}

async function loadTilesetWithFallback(app: Application): Promise<ArenaTiles> {
  try {
    return await loadTileset();
  } catch (error) {
    console.warn("ArenaAS.png failed to load; using fallback textures.", error);
    const fallback = createFallbackTile(app, 0x4d4f52);
    return {
      ground: createFallbackTile(app, 0x2f7d4a),
      breakable: createFallbackTile(app, 0x9a5d2f),
      limitsabs: fallback,
      limitsord: fallback,
      limitsHG: fallback,
      limitsHD: fallback,
      limitsBG: fallback,
      limitsBD: fallback,
      solid: fallback,
    };
  }
}

async function loadWalkFrames(assetUrl: string): Promise<Texture[]> {
  const walkSheet = await Assets.load<Texture>(assetUrl);
  const frameSize = walkSheet.height;

  return Array.from({ length: 12 }, (_, index) =>
    cropTexture(walkSheet, index * frameSize, 0, frameSize),
  );
}

// -----------------------------------------------------------------------------
// Dessin du terrain et de la grille
// -----------------------------------------------------------------------------

function placeTile(
  layer: Container,
  texture: Texture,
  gridX: number,
  gridY: number,
): void {
  const sprite = new Sprite(texture);
  sprite.position.set(gridX * tileSize, gridY * tileSize);
  sprite.width = tileSize;
  sprite.height = tileSize;
  layer.addChild(sprite);
}

function drawGround(): void {
  const ground = new TilingSprite({
    texture: currentTiles.ground,
    width: arenaWidth,
    height: arenaHeight,
  });
  ground.tileScale.set(2, 2);
  layers.floor.addChild(ground);
}

function getWallTexture(x: number, y: number): Texture {
  if (x === 0 && y === 0) return currentTiles.limitsHG;
  if (x === boardSize - 1 && y === 0) return currentTiles.limitsHD;
  if (x === 0 && y === boardSize - 1) return currentTiles.limitsBG;
  if (x === boardSize - 1 && y === boardSize - 1) return currentTiles.limitsBD;
  if (y === 0 || y === boardSize - 1) return currentTiles.limitsabs;
  if (x === 0 || x === boardSize - 1) return currentTiles.limitsord;
  return currentTiles.solid;
}

function drawMap(): void {
  for (let y = 0; y < defaultMap.length; y += 1) {
    for (let x = 0; x < defaultMap[y].length; x += 1) {
      const cell = defaultMap[y][x];

      if (cell === "#") {
        placeTile(layers.decor, getWallTexture(x, y), x, y);
      } else if (cell === "B") {
        placeTile(layers.decor, currentTiles.breakable, x, y);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Gestion des Déplacements et Rendu des Joueurs
// -----------------------------------------------------------------------------

/**
 * Déplace et anime un joueur vers une case cible suite à un événement réseau.
 *
 * @param playerId Identifiant du joueur (ex: "p1", "p2").
 * @param targetGridX Coordonnée X sur la grille.
 * @param targetGridY Coordonnée Y sur la grille.
 * @param direction Direction explicite optionnelle.
 */
export function animatePlayerTo(
  playerId: string,
  targetGridX: number,
  targetGridY: number,
  direction?: Direction,
): void {
  const normalizedId = playerId === "player1" ? "p1" : playerId === "player2" ? "p2" : playerId;
  const entity = players.get(normalizedId) ?? players.get("p1");

  if (!entity || entity.moving) {
    return;
  }

  let resolvedDirection: Direction = direction ?? "DOWN";
  if (!direction) {
    if (targetGridX > entity.gridX) resolvedDirection = "RIGHT";
    else if (targetGridX < entity.gridX) resolvedDirection = "LEFT";
    else if (targetGridY > entity.gridY) resolvedDirection = "DOWN";
    else if (targetGridY < entity.gridY) resolvedDirection = "UP";
  }

  entity.startX = entity.sprite.x;
  entity.startY = entity.sprite.y;
  entity.targetX = targetGridX * tileSize - playerInset;
  entity.targetY = targetGridY * tileSize - playerInset;
  entity.gridX = targetGridX;
  entity.gridY = targetGridY;
  entity.elapsed = 0;
  entity.moving = true;
  entity.frameBase = directionFrameBase[resolvedDirection];
}

async function drawPlayers(app: Application): Promise<void> {
  const playerSize = tileSize * playerScale;
  playerInset = (playerSize - tileSize) / 2;

  // Joueur 1 (bleu)
  const p1Frames = await loadWalkFrames(
    new URL("./assets/BL walk.png", import.meta.url).href,
  );
  const p1Sprite = new Sprite(p1Frames[1]);
  p1Sprite.width = playerSize;
  p1Sprite.height = playerSize;
  p1Sprite.position.set(tileSize - playerInset, tileSize - playerInset);

  players.set("p1", {
    id: "p1",
    sprite: p1Sprite,
    walkFrames: p1Frames,
    gridX: 1,
    gridY: 1,
    moving: false,
    elapsed: 0,
    animationTime: 0,
    startX: tileSize - playerInset,
    startY: tileSize - playerInset,
    targetX: tileSize - playerInset,
    targetY: tileSize - playerInset,
    frameBase: 0,
  });

  // Joueur 2 (rouge)
  const p2Frames = await loadWalkFrames(
    new URL("./assets/BL walk 2.png", import.meta.url).href,
  );
  const p2Sprite = new Sprite(p2Frames[1]);
  p2Sprite.width = playerSize;
  p2Sprite.height = playerSize;
  const p2StartX = (boardSize - 2) * tileSize - playerInset;
  const p2StartY = (boardSize - 2) * tileSize - playerInset;
  p2Sprite.position.set(p2StartX, p2StartY);

  players.set("p2", {
    id: "p2",
    sprite: p2Sprite,
    walkFrames: p2Frames,
    gridX: boardSize - 2,
    gridY: boardSize - 2,
    moving: false,
    elapsed: 0,
    animationTime: 0,
    startX: p2StartX,
    startY: p2StartY,
    targetX: p2StartX,
    targetY: p2StartY,
    frameBase: 0,
  });

  layers.dynamic.addChild(p1Sprite, p2Sprite);

  // Boucle de mise à jour des animations PixiJS
  app.ticker.add((ticker) => {
    for (const entity of players.values()) {
      if (!entity.moving) {
        continue;
      }

      entity.elapsed += ticker.deltaMS;
      entity.animationTime += ticker.deltaMS;

      const progress = Math.min(entity.elapsed / playerMoveDuration, 1);
      entity.sprite.position.set(
        entity.startX + (entity.targetX - entity.startX) * progress,
        entity.startY + (entity.targetY - entity.startY) * progress,
      );

      const frameIndex = Math.floor(entity.animationTime / playerFrameDuration) % 3;
      entity.sprite.texture = entity.walkFrames[entity.frameBase + frameIndex];

      if (progress === 1) {
        entity.moving = false;
        entity.sprite.texture = entity.walkFrames[entity.frameBase];
      }
    }
  });

  // Abonnement de l'arène au bus d'événements : réception de POSITION_UPDATED
  eventBus.on("player:moved", (update: PlayerPositionUpdate) => {
    animatePlayerTo(update.playerId, update.x, update.y, update.direction);
  });
}

// -----------------------------------------------------------------------------
// Adaptation à la fenêtre et Démarrage
// -----------------------------------------------------------------------------

function fitArenaToViewport(app: Application): void {
  const padding = 40;
  const scale = Math.min(
    (window.innerWidth - padding) / arenaWidth,
    (window.innerHeight - padding) / arenaHeight,
  );

  app.renderer.resize(window.innerWidth, window.innerHeight);
  arenaContainer.scale.set(scale);
  arenaContainer.x = (window.innerWidth - arenaWidth * scale) / 2;
  arenaContainer.y = (window.innerHeight - arenaHeight * scale) / 2;
}

async function initArena(): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: 0x0d1620,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  gameBoard!.replaceChildren(app.canvas);
  app.stage.addChild(arenaContainer);

  currentTiles = await loadTilesetWithFallback(app);
  drawGround();
  drawMap();
  await drawPlayers(app);

  fitArenaToViewport(app);
  window.addEventListener("resize", () => fitArenaToViewport(app));
}

/**
 * Crée le gestionnaire réseau approprié (Mock ou Réel).
 * Activé avec ?mock=true dans l'URL pour les tests hors-ligne exigés par le cahier des charges.
 */
export function createNetworkManager(): INetworkManager {
  const urlParams = new URLSearchParams(window.location.search);
  const isMock = urlParams.get("mock") === "true";

  if (isMock) {
    const mock = new MockNetworkManager(defaultMap);
    // Active une patrouille automatique pour le Joueur 2 en mode mock
    mock.startBotSimulation(1400);
    return mock;
  }

  return new NetworkManager(import.meta.env.VITE_WS_URL || "ws://localhost:8080");
}

playButton.addEventListener("click", async () => {
  if (gameStarted) return;

  playButton.disabled = true;
  playButton.querySelector("span")!.textContent = "Chargement…";
  delete launchStatus.dataset.error;
  launchStatus.textContent = "Préparation de l’arène…";

  try {
    await initArena();

    // 1. Initialisation du gestionnaire réseau (réel ou mockable)
    activeNetworkManager = createNetworkManager();
    activeNetworkManager.connect();

    // 2. Écoute des trames entrantes et acheminement vers l'EventBus
    activeNetworkManager.listen((rawData: unknown) => {
      console.log("Données reçues du réseau :", rawData);
      const positionUpdate = parsePositionUpdated(rawData);
      if (positionUpdate) {
        eventBus.emit("player:moved", positionUpdate);
      }
    });

    // 3. Initialisation des contrôles (capture clavier -> envoi réseau)
    activeInputManager = new InputManager((message) => {
      const enrichedMessage = {
        ...message,
        event: message.type,
        data: {
          ...message.payload,
          playerId: "p1",
        },
      };
      activeNetworkManager?.sendMessage(enrichedMessage);
    });

    gameStarted = true;
    homeScreen.hidden = true;
    gameScreen.hidden = false;
  } catch (error) {
    console.error("Impossible de démarrer la partie.", error);
    playButton.disabled = false;
    playButton.querySelector("span")!.textContent = "Jouer";
    launchStatus.dataset.error = "true";
    launchStatus.textContent =
      "Le jeu n’a pas pu démarrer. Vérifiez le chargement puis réessayez.";
  }
});
