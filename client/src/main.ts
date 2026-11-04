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

const boardSize = 13;
const tileSize = 32;
const arenaWidth = boardSize * tileSize;
const arenaHeight = boardSize * tileSize;
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

const gameBoard = document.querySelector<HTMLElement>("#game-board");
if (!gameBoard) {
  throw new Error("#game-board introuvable");
}

const networkManager = new NetworkManager(
  import.meta.env.VITE_WS_URL || "ws://localhost:8080",
);
networkManager.connect();
//2. On branche l'écouteur pour recevoir les données du serveur
networkManager.listen((data) => {
  console.log("Données traitées dans le main :", data);
  // Plus tard, on enverra ces données au moteur graphique (PixiJS) ici
});

// 3. Initialisation des contrôles
// À chaque touche pressée, on envoie le message généré directement au serveur
export const inputManager = new InputManager((message) => {
  networkManager.sendMessage(message);
});

const layers: ArenaLayers = {
  floor: new Container(),
  decor: new Container(),
  dynamic: new Container(),
};
const arenaContainer = new Container();
arenaContainer.addChild(layers.floor, layers.decor, layers.dynamic);

function createFallbackTile(app: Application, color: number): Texture {
  const graphic = new Graphics().rect(0, 0, 8, 8).fill(color);
  return app.renderer.generateTexture({ target: graphic });
}

function cropTexture(texture: Texture, x: number, y: number, size: number): Texture {
  return new Texture({
    source: texture.source,
    frame: new Rectangle(x, y, size, size),
  });
}

async function loadTileset(): Promise<ArenaTiles> {
  const atlasTileSize = 16;
  const atlas = await Assets.load<Texture>(
    new URL("./assets/ArenaAS.png", import.meta.url).href,
  );
  const tiles = {
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
    // Tuile d'herbe vert foncé, située sous la tuile en haut à gauche.
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

function fitArenaToViewport(app: Application): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 40;
  const scale = Math.min(
    (viewportWidth - padding) / arenaWidth,
    (viewportHeight - padding) / arenaHeight,
  );

  app.renderer.resize(viewportWidth, viewportHeight);
  arenaContainer.scale.set(scale);
  arenaContainer.x = (viewportWidth - arenaWidth * scale) / 2;
  arenaContainer.y = (viewportHeight - arenaHeight * scale) / 2;
}

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

function drawGround(layers: ArenaLayers, tiles: ArenaTiles): void {
  const ground = new TilingSprite({
    texture: tiles.ground,
    width: arenaWidth,
    height: arenaHeight,
  });
  ground.tileScale.set(2, 2);
  layers.floor.addChild(ground);
}

function getWallTexture(x: number, y: number, tiles: ArenaTiles): Texture {
  if (x === 0 && y === 0) return tiles.limitsHG;
  if (x === boardSize - 1 && y === 0) return tiles.limitsHD;
  if (x === 0 && y === boardSize - 1) return tiles.limitsBG;
  if (x === boardSize - 1 && y === boardSize - 1) return tiles.limitsBD;
  if (y === 0 || y === boardSize - 1) return tiles.limitsabs;
  if (x === 0 || x === boardSize - 1) return tiles.limitsord;
  return tiles.solid;
}

function drawMap(layers: ArenaLayers, tiles: ArenaTiles): void {
  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const cell = map[y][x];
      if (cell === "#") {
        placeTile(layers.decor, getWallTexture(x, y, tiles), x, y);
      } else if (cell === "B") {
        placeTile(layers.decor, tiles.breakable, x, y);
      }
    }
  }
}

function drawPlayers(app: Application, layers: ArenaLayers): void {
  const player1 = new Graphics()
    .roundRect(0, 0, tileSize * 0.7, tileSize * 0.7, 5)
    .fill(0x4fc3f7);
  const player2 = new Graphics()
    .roundRect(0, 0, tileSize * 0.7, tileSize * 0.7, 5)
    .fill(0xff6f61);
  const player1Sprite = new Sprite(
    app.renderer.generateTexture({ target: player1 }),
  );
  const player2Sprite = new Sprite(
    app.renderer.generateTexture({ target: player2 }),
  );
  player1Sprite.position.set(tileSize + 4, tileSize + 4);
  player2Sprite.position.set(
    (boardSize - 2) * tileSize + 4,
    (boardSize - 2) * tileSize + 4,
  );
  layers.dynamic.addChild(player1Sprite, player2Sprite);
}

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

async function initArena(): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: 0x0d1620,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  gameBoard.replaceChildren(app.canvas);
  app.stage.addChild(arenaContainer);

  const tiles = await loadTilesetWithFallback(app);
  drawGround(layers, tiles);
  drawMap(layers, tiles);
  drawPlayers(app, layers);

  fitArenaToViewport(app);
  window.addEventListener("resize", () => fitArenaToViewport(app));
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
void initArena();
