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
import "./styles.css";

// -----------------------------------------------------------------------------
// Configuration et types
// -----------------------------------------------------------------------------

const boardSize = 13;
const tileSize = 32;
const arenaWidth = boardSize * tileSize;
const arenaHeight = boardSize * tileSize;
const playerScale = 1.69;
const playerMoveDuration = 140;
const playerFrameDuration = 75;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

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

const map = [
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
// Références à la page, réseau et contrôles
// -----------------------------------------------------------------------------

const gameBoard = document.querySelector<HTMLElement>("#game-board");
if (!gameBoard) {
  throw new Error("#game-board introuvable");
}

const networkManager = new NetworkManager(
  import.meta.env.VITE_WS_URL || "ws://localhost:8080",
);
networkManager.connect();
networkManager.listen((data) => {
  console.log("Données traitées dans le main :", data);
});

let movePlayer: (direction: Direction) => void = () => {};

export const inputManager = new InputManager((message) => {
  networkManager.sendMessage(message);

  const direction = message.payload.direction;
  if (direction) movePlayer(direction);
});

// -----------------------------------------------------------------------------
// Couches graphiques
// -----------------------------------------------------------------------------

const layers: ArenaLayers = {
  floor: new Container(),
  decor: new Container(),
  dynamic: new Container(),
};

const arenaContainer = new Container();
arenaContainer.addChild(layers.floor, layers.decor, layers.dynamic);

// -----------------------------------------------------------------------------
// Chargement et préparation des textures
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

async function loadPlayerFrames(): Promise<Texture[]> {
  const walkSheet = await Assets.load<Texture>(
    new URL("./assets/BL walk.png", import.meta.url).href,
  );
  const frameSize = walkSheet.height;

  return Array.from({ length: 12 }, (_, index) =>
    cropTexture(walkSheet, index * frameSize, 0, frameSize),
  );
}

// -----------------------------------------------------------------------------
// Dessin du terrain et de la carte
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

let currentTiles: ArenaTiles;

function drawMap(): void {
  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const cell = map[y][x];

      if (cell === "#") {
        placeTile(layers.decor, getWallTexture(x, y), x, y);
      } else if (cell === "B") {
        placeTile(layers.decor, currentTiles.breakable, x, y);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Joueurs et déplacements
// -----------------------------------------------------------------------------

function drawSecondPlayer(app: Application): Sprite {
  const player = new Graphics()
    .roundRect(0, 0, tileSize * 0.7, tileSize * 0.7, 5)
    .fill(0xff6f61);
  const sprite = new Sprite(app.renderer.generateTexture({ target: player }));
  sprite.position.set(
    (boardSize - 2) * tileSize + 4,
    (boardSize - 2) * tileSize + 4,
  );
  return sprite;
}

function setupPlayerMovement(
  app: Application,
  sprite: Sprite,
  walkFrames: Texture[],
  playerInset: number,
): void {
  let gridX = 1;
  let gridY = 1;
  let moving = false;
  let elapsed = 0;
  let animationTime = 0;
  let startX = tileSize - playerInset;
  let startY = tileSize - playerInset;
  let targetX = startX;
  let targetY = startY;
  let frameBase = 0;

  const directionOffsets: Record<Direction, [number, number]> = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0],
  };
  const directionFrameBase: Record<Direction, number> = {
    DOWN: 0,
    UP: 3,
    LEFT: 6,
    RIGHT: 9,
  };

  movePlayer = (direction) => {
    if (moving) return;

    const [dx, dy] = directionOffsets[direction];
    const nextX = gridX + dx;
    const nextY = gridY + dy;
    if (map[nextY]?.[nextX] !== ".") return;

    gridX = nextX;
    gridY = nextY;
    startX = sprite.x;
    startY = sprite.y;
    targetX = gridX * tileSize - playerInset;
    targetY = gridY * tileSize - playerInset;
    elapsed = 0;
    moving = true;
    frameBase = directionFrameBase[direction];
  };

  app.ticker.add((ticker) => {
    if (!moving) return;

    elapsed += ticker.deltaMS;
    animationTime += ticker.deltaMS;
    const progress = Math.min(elapsed / playerMoveDuration, 1);
    sprite.position.set(
      startX + (targetX - startX) * progress,
      startY + (targetY - startY) * progress,
    );
    const frameIndex = Math.floor(animationTime / playerFrameDuration) % 3;
    sprite.texture = walkFrames[frameBase + frameIndex];

    if (progress === 1) {
      moving = false;
      sprite.texture = walkFrames[frameBase];
    }
  });
}

async function drawPlayers(app: Application): Promise<void> {
  const walkFrames = await loadPlayerFrames();
  const playerSize = tileSize * playerScale;
  const playerInset = (playerSize - tileSize) / 2;
  const player1Sprite = new Sprite(walkFrames[1]);
  player1Sprite.width = playerSize;
  player1Sprite.height = playerSize;
  player1Sprite.position.set(tileSize - playerInset, tileSize - playerInset);

  layers.dynamic.addChild(player1Sprite, drawSecondPlayer(app));
  setupPlayerMovement(app, player1Sprite, walkFrames, playerInset);
}

// -----------------------------------------------------------------------------
// Adaptation à la fenêtre et démarrage
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

void initArena();
