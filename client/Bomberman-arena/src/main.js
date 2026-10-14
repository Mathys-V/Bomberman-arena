const boardSize = 13;
const tileSize = 32;
const arenaWidth = boardSize * tileSize;
const arenaHeight = boardSize * tileSize;

const gameBoard = document.querySelector("#game-board");
if (!gameBoard) {
  throw new Error("#game-board introuvable");
}

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  background: 0x0d1620,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

gameBoard.replaceChildren(app.view);

const arenaContainer = new PIXI.Container();
const layers = {
  floor: new PIXI.Container(),
  decor: new PIXI.Container(),
  dynamic: new PIXI.Container(),
  hud: new PIXI.Container(),
};

arenaContainer.addChild(layers.floor, layers.decor, layers.dynamic, layers.hud);
app.stage.addChild(arenaContainer);

function createFallbackTile(color) {
  const graphics = new PIXI.Graphics();
  graphics.beginFill(color);
  graphics.drawRect(0, 0, 8, 8);
  graphics.endFill();
  return app.renderer.generateTexture(graphics, PIXI.SCALE_MODES.NEAREST, 1);
}

async function loadTileset() {
  const tileSizeInAtlas = 16;

  try {
    const atlasTexture = await PIXI.Assets.load(
      new URL("./assets/ArenaAS.png", import.meta.url).href,
    );

    const base = atlasTexture.baseTexture;

    const tiles = {
      ground: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          1 * tileSizeInAtlas,
          1 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
      breakable: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          3 * tileSizeInAtlas,
          3 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
      limitsabs: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          1 * tileSizeInAtlas,
          2 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
      limitsord: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          0 * tileSizeInAtlas,
          1 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
      limitsHG: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          0 * tileSizeInAtlas,
          0 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
      limitsHD: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          2 * tileSizeInAtlas,
          0 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
      limitsBG: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          0 * tileSizeInAtlas,
          2 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
      limitsBD: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          2 * tileSizeInAtlas,
          2 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
  
      solid: new PIXI.Texture(
        base,
        new PIXI.Rectangle(
          2 * tileSizeInAtlas,
          1 * tileSizeInAtlas,
          tileSizeInAtlas,
          tileSizeInAtlas,
        ),
      ),
    };

    if (
      tiles.ground.valid &&
      tiles.breakable.valid &&
      tiles.limitsabs.valid &&
      tiles.limitsord.valid &&
      tiles.limitsHG.valid &&
      tiles.limitsHD.valid &&
      tiles.limitsBD.valid &&
      tiles.limitsBG.valid &&
      tiles.solid.valid
    ) {
      return tiles;
    }
  } catch (error) {
    console.warn("ArenaAS.png non chargé, fallback colorisé utilisé.", error);
  }

  return {
    ground: createFallbackTile(0x2f7d4a),
    breakable: createFallbackTile(0x9a5d2f),
    limitsabs: createFallbackTile(0x4d4f52),
    limitsord: createFallbackTile(0x4d4f52),
    limitsHG: createFallbackTile(0x4d4f52),
    limitsHD: createFallbackTile(0x4d4f52),
    limitsBD: createFallbackTile(0x4d4f52),
    limitsBG: createFallbackTile(0x4d4f52),
    solid: createFallbackTile(0x4d4f52),
  };
}

let groundTile = createFallbackTile(0x2f7d4a);
let breakableTile = createFallbackTile(0x9a5d2f);
let limitsabsTile = createFallbackTile(0x4d4f52);
let limitsordTile = createFallbackTile(0x4d4f52);
let limitsHGTile = createFallbackTile(0x4d4f52);
let limitsHDTile = createFallbackTile(0x4d4f52);
let limitsBDTile = createFallbackTile(0x4d4f52);
let limitsBGTile = createFallbackTile(0x4d4f52);
let solidTile = createFallbackTile(0x4d4f52);

function fitArenaToViewport() {
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

function placeTile(layer, texture, gridX, gridY) {
  const sprite = new PIXI.Sprite(texture);
  sprite.x = gridX * tileSize;
  sprite.y = gridY * tileSize;
  sprite.width = tileSize;
  sprite.height = tileSize;
  layer.addChild(sprite);
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

async function initArena() {
  const atlasTiles = await loadTileset();
  groundTile = atlasTiles.ground;
  breakableTile = atlasTiles.breakable;
  limitsabsTile = atlasTiles.limitsabs;
  limitsordTile = atlasTiles.limitsord;
  limitsHGTile = atlasTiles.limitsHG;
  limitsHDTile = atlasTiles.limitsHD;
  limitsBDTile = atlasTiles.limitsBD;
  limitsBGTile = atlasTiles.limitsBG;
  solidTile = atlasTiles.solid;

  const ground = new PIXI.TilingSprite(groundTile, arenaWidth, arenaHeight);
  ground.tileScale.set(2, 2);
  layers.floor.addChild(ground);

  const wall = solidTile;

  const crate = breakableTile;

  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const cell = map[y][x];
      const abscisse = x;
      const ordonnee = y;

      if (cell === "#") {
        if (abscisse === 0 && ordonnee === 0) {
          placeTile(layers.decor, limitsHGTile, abscisse, ordonnee);
        } else if (abscisse === boardSize - 1 && ordonnee === 0) {
          placeTile(layers.decor, limitsHDTile, abscisse, ordonnee);
        } else if (abscisse === 0 && ordonnee === boardSize - 1) {
          placeTile(layers.decor, limitsBGTile, abscisse, ordonnee);
        } else if (
          abscisse === boardSize - 1 &&
          ordonnee === boardSize - 1
        ) {
          placeTile(layers.decor, limitsBDTile, abscisse, ordonnee);
        } else if (ordonnee === 0 || ordonnee === boardSize - 1) {
          placeTile(layers.decor, limitsabsTile, abscisse, ordonnee);
        } else if (abscisse === 0 || abscisse === boardSize - 1) {
          placeTile(layers.decor, limitsordTile, abscisse, ordonnee);
        } else {
          placeTile(layers.decor, wall, abscisse, ordonnee);
        }
      } else if (cell === "B") {
        placeTile(layers.decor, crate, abscisse, ordonnee);
      }
    }
  }

  const player1 = new PIXI.Graphics();
  player1.beginFill(0x4fc3f7);
  player1.drawRoundedRect(0, 0, tileSize * 0.7, tileSize * 0.7, 5);
  player1.endFill();

  const player2 = new PIXI.Graphics();
  player2.beginFill(0xff6f61);
  player2.drawRoundedRect(0, 0, tileSize * 0.7, tileSize * 0.7, 5);
  player2.endFill();

  const player1Sprite = new PIXI.Sprite(
    app.renderer.generateTexture(player1, PIXI.SCALE_MODES.NEAREST, 1),
  );
  const player2Sprite = new PIXI.Sprite(
    app.renderer.generateTexture(player2, PIXI.SCALE_MODES.NEAREST, 1),
  );

  player1Sprite.x = 1 * tileSize + 4;
  player1Sprite.y = 1 * tileSize + 4;
  player2Sprite.x = (boardSize - 2) * tileSize + 4;
  player2Sprite.y = (boardSize - 2) * tileSize + 4;

  layers.dynamic.addChild(player1Sprite, player2Sprite);

  fitArenaToViewport();
  window.addEventListener("resize", fitArenaToViewport);
}

initArena();
