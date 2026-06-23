// ============================================================
// The player moves freely around a world larger than the canvas.
// A smooth-follow camera keeps the player centred.
// Enemy waves are loaded from JSON and chase the player.
// A minimap in the bottom-right corner shows the player and
// enemy positions at all times.
// A giant orange blob boss spawns when the player enters the
// boss zone at the top of the world. Defeat it to win.
// Press B to skip straight to the boss for testing.
//
// Files:
//   sketch.js           — all game logic
//   data/enemies.json   — wave trigger positions, enemy data, boss data
//   data/obstacles.json — obstacle positions in world coordinates
// ============================================================

// ------------------------------------------------------------
// CAMERA
// camX and camY are the world coordinates at the top-left
// of the canvas. translate(-camX, -camY) shifts everything
// so the player appears centred on screen.
// ------------------------------------------------------------
let camX = 0;
let camY = 0;
const CAM_SMOOTHING = 0.5;
let camZoom = 0.7;

// ------------------------------------------------------------
// PLAYER CONFIGURATION
// ------------------------------------------------------------
const PLAYER_SPEED = 15;
let moveSpeed = PLAYER_SPEED;
const INVINCIBLE_FRAMES = 90; // ADDED — was referenced but never defined

// ------------------------------------------------------------
// FISH SPRITE CONFIGURATION
// ------------------------------------------------------------
const FISH_SPRITE = {
  frameWidth: 0, // Calculated dynamically in setup() to avoid grid bleed
  frameHeight: 0, // Calculated dynamically in setup()
  numFrames: 2, // Each row contains 2 frames for the swim animation
  animSpeed: 12, // Controls tail wag speed (lower = faster)
  scale: 0.15, // Scale factor to map image size nicely to player.r (22px)

  // Row mapping: row 0 is left, row 1 is right
  rows: {
    left: 1,
    right: 0,
  },
};

const BIRD_SPRITE = {
  frameWidth: 500,
  frameHeight: 500,
  animSpeed: 10,
  scale: 0.15, // Adjusted to match your game's world scale (~same size as fish)

  rows: {
    flying: 0,
    running: 1,
  },
  maxFrames: {
    flying: 4,
    running: 7,
  },
};

const GRAVITY = 3.0; // Calibrated downward pull
const FLAP_FORCE = -24; // Gives the exact velocity curve to hit 3 blocks high
const TERMINAL_VELOCITY = 20;

let player = {
  x: 15000,
  y: 3000,
  r: 22,

  // Animation state variables
  currentFrame: 0,
  frameTimer: 0,
  facing: "left", // Current look direction ("left" or "right")
  isMoving: false, // Tracks whether player is currently moving to trigger animation

  shootTimer: 0,
  health: 5,
  maxHealth: 5,
  invincible: false,
  invincibleTimer: 0,
  bounceVX: 0,
  bounceVY: 0,
};

// ------------------------------------------------------------
// BULLETS and ENEMIES
// Positions are in world coordinates.
// ------------------------------------------------------------
let bullets = [];
let enemies = [];

// ------------------------------------------------------------
// OBSTACLES
// Loaded from data/obstacles.json in preload().
// Positioned in world coordinates — drawn and collided in
// world space. Player takes damage and bounces on contact.
// ------------------------------------------------------------
let obstacleData;
let obstacles = [];

let tileData;
let tiles = [];

let waterTiles = [];
let seaweedImg;
let sandImg;
let sandrockImg;
let rockImg;
let spike1Img;
let spike2Img;
let spike3Img;
let spike4Img;
let fishareaBG;
let fishareaOverlay;
let fishSheet; //fish sprite sheet
let fishArea;
let birdSheet; //bird sprite sheet

// ------------------------------------------------------------
// ADDED — TILE PHYSICS
// Tiles are grouped by *behaviour* rather than by raw id, since
// the same id number means different things on different layers.
// Add/rename layer names here to match your map.json exactly.
// ------------------------------------------------------------
const SOLID_LAYERS = ["rock", "seaweed"]; // blocks movement CHANGE SEAWEED PROPERTES
const HAZARD_LAYERS = ["spikes"]; // kills on contact
const CHECKPOINT_LAYER = "checkpoint"; // respawn points
const COLLECTABLE_LAYER = "coins";
const WHIRLPOOL_LAYER = "whirlpool";
// "water" and "bg green" (and anything else) are treated as pure
// background — they're drawn but never checked for collision.

let solidTiles = []; // [{x,y,w,h}] world-space rects — rock + seaweed
let hazardTiles = []; // [{x,y,w,h}] world-space rects — spikes
let checkpoints = []; // [{x,y,w,h,spawnX,spawnY}] grouped checkpoint zones, sorted left→right
let activeCheckpointIndex = -1; // index into `checkpoints` of the furthest one reached
let lastCheckpoint = null; // {x,y} world coords the player respawns at
let playerStart = { x: 0, y: 0 }; // fallback spawn if no checkpoint reached yet
let coinMap = new Map(); // key: "tx,ty" -> collected boolean
let coinsTotal = 0;
let coinsCollected = 0;
let whirlpoolTiles = []; // [{x,y,w,h}]
let allCoinsCollected = false;

// ------------------------------------------------------------
// WAVE SYSTEM
// Each wave has a triggerY — spawns when player.y < triggerY.
// nextWave tracks which wave to check next.
// ------------------------------------------------------------
let enemyData;
let nextWave = 0;

// ------------------------------------------------------------
// BOSS
// Spawns when player enters the boss zone (player.y < bossZoneY).
// ------------------------------------------------------------
let boss = null;
let bossData = null;
const BOSS_ZONE_Y = 300; // world Y — enter this zone to trigger boss

// ------------------------------------------------------------
// MINIMAP
// Drawn in screen coordinates after pop().
// Shows a scaled-down version of the world with dots for
// the player (teal) and enemies (orange).
// ------------------------------------------------------------
const MAP_W = 120; // minimap width in pixels
const MAP_H = 120; // minimap height in pixels
const MAP_X = 16; // screen position — bottom left
const MAP_Y_OFFSET = 16; // offset from bottom of screen

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------
let score = 0;

const STATE_PLAY = "play";
const STATE_BOSS = "boss";
const STATE_WIN = "win";
const STATE_OVER = "over";
let gameState = STATE_PLAY;

// ------------------------------------------------------------
// SOUNDS — uncomment and fill in paths to add audio
// ------------------------------------------------------------
// let shootSound;
// let hitSound;
// let playerHitSound;
// let bossHitSound;
// let bossMusic;
// let winSound;
// let music;

// ============================================================
// preload()
// ============================================================
function preload() {
  enemyData = loadJSON("data/enemies.json");
  obstacleData = loadJSON("data/obstacles.json");
  tileData = loadJSON("data/map.json");
  fishArea = loadJSON("data/fisharea.json");

  fishSheet = loadImage("assets/fish.png");
  seaweedImg = loadImage("assets/seaweed.png");
  sandImg = loadImage("assets/sand.png");
  sandrockImg = loadImage("assets/sandrock.png");
  rockImg = loadImage("assets/rock.png");
  spike1Img = loadImage("assets/spike1.png");
  spike2Img = loadImage("assets/spike2.png");
  spike3Img = loadImage("assets/spike3.png");
  spike4Img = loadImage("assets/spike4.png");
  fishareaBG = loadImage("assets/fishareaBG.png");
  fishareaOverlay = loadImage("assets/fishareaoverlay.png");
  birdSheet = loadImage("assets/bird.png");

  // Uncomment to load sounds:
  // shootSound     = loadSound("assets/sounds/shoot.wav");
  // hitSound       = loadSound("assets/sounds/hit.wav");
  // playerHitSound = loadSound("assets/sounds/playerhit.wav");
  // bossHitSound   = loadSound("assets/sounds/bosshit.wav");
  // bossMusic      = loadSound("assets/sounds/bossmusic.mp3");
  // winSound       = loadSound("assets/sounds/win.wav");
  // music          = loadSound("assets/sounds/music.mp3");
}

const TILE_SIZE = 50;

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(800, 450);
  WORLD_W = TILE_SIZE * (tileData.mapWidth + fishArea.mapWidth); // total world width in pixels
  WORLD_H = TILE_SIZE * (tileData.mapHeight + fishArea.mapHeight); // total world height in pixels
  bossData = enemyData.boss;
  console.log("tileData=", tileData);
  console.log("obstacleData=", obstacleData);

  FISH_SPRITE.frameWidth = fishSheet.width / 2;
  FISH_SPRITE.frameHeight = fishSheet.height / 2;

  // Build obstacle objects from JSON
  for (let i = 0; i < obstacleData.obstacles.length; i++) {
    let o = obstacleData.obstacles[i];
    obstacles.push({ x: o.x, y: o.y, size: o.size });
  }

  const tilesArray = tileData.layers?.[0]?.tiles || [];
  for (let i = 0; i < tilesArray.length; i++) {
    const t = tilesArray[i];
    tiles.push({ x: t.x, y: t.y, id: t.id });
  }

  // ADDED — sort solid/hazard/checkpoint tiles out of every layer
  // and group checkpoint tiles into discrete zones.
  buildTileCollision();

  // ADDED — remember the player's starting point as the fallback
  // respawn location for before any checkpoint has been reached.
  playerStart = { x: player.x, y: player.y };

  // Start camera so player is visible
  camX = player.x - width / 2;
  camY = player.y - height / 2;
  imageMode(CORNER);
  // Uncomment to start music:
  // music.loop();
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(20);
  console.log(player.x / 50, player.y / 50); // for troubleshooting

  updateCamera();
  updateInvincibility(); // ADDED — ticks down player.invincibleTimer

  // Everything inside push/pop is drawn in world coordinates
  push();
  translate(width / 2, height / 2);
  scale(camZoom); // translate to centre and scale the world translate
  translate(-width / 2, -height / 2); // then translate the world by camera top-left in world pixels
  translate(-camX, -camY);

  drawBackground();

  // if player is near y lvel of fish area
  if (player.y > TILE_SIZE * (tileData.mapHeight - tileData.mapHeight / 7)) {
    // add end of fish area boundary later
    drawTiles(fishArea); // fish area
    console.log("fish area drawn");
  }

  if (gameState === STATE_PLAY) {
    updateMoveSpeed();
    handleInput();
    animateCharacter();
    applyBounce();

    // ADDED — tile physics: solid blockage, hazards, checkpoints
    resolveSolidCollisions();
    checkWhirlpools();
    checkCollectables();
    checkHazardCollisions();
    checkCheckpoints();
    checkObstaclePlayerCollision(); // was defined but never called

    drawObstacles();
    drawTiles(tileData);

    drawPlayer();

    // ADDED: draw fish area overlay on top of everything (world coordinates)
    if (fishareaOverlay) {
      const fishAreaOffsetX = TILE_SIZE * (tileData.mapWidth - 33);
      const fishAreaOffsetY = TILE_SIZE * tileData.mapHeight;
      image(fishareaOverlay, fishAreaOffsetX, fishAreaOffsetY, 1900, 800);
    }
  }

  pop(); // restore screen coordinates

  drawMinimap();
}

// ------------------------------------------------------------
// animateCharacter() — Dynamic state animation processing
// ------------------------------------------------------------
function animateCharacter() {
  let inSea = playerInWater();

  if (inSea) {
    // Fish Animation Logic
    if (player.isMoving) {
      player.frameTimer++;
      if (player.frameTimer >= FISH_SPRITE.animSpeed) {
        player.frameTimer = 0;
        player.currentFrame = (player.currentFrame + 1) % FISH_SPRITE.numFrames;
      }
    } else {
      player.currentFrame = 0;
      player.frameTimer = 0;
    }
  } else {
    // Bird Animation Logic
    let isFlapping = keyIsDown(32); // Check if spacebar is actively pressed
    let currentAnimMode = isFlapping ? "flying" : "running";
    let maxFrames = BIRD_SPRITE.maxFrames[currentAnimMode];

    // Only advance frames if the bird is running along the ground or actively flapping to fly
    if (isFlapping || player.isMoving) {
      player.frameTimer++;
      if (player.frameTimer >= BIRD_SPRITE.animSpeed) {
        player.frameTimer = 0;
        player.currentFrame = (player.currentFrame + 1) % maxFrames;
      }
    } else {
      // Idle on land: Freeze on the first frame of the running row
      player.currentFrame = 0;
      player.frameTimer = 0;
    }
  }
}

// ------------------------------------------------------------
// updateCamera()
// Smoothly moves the camera toward the player each frame.
// Clamps so the camera never shows outside the world.
// ------------------------------------------------------------
function updateCamera() {
  let visibleW = width / camZoom;
  let visibleH = height / camZoom;

  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  targetX = constrain(targetX, 0, WORLD_W - width);
  targetY = constrain(targetY, 0, WORLD_H - height);

  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);
}

// ------------------------------------------------------------
// ADDED — updateInvincibility()
// Counts down the player's invincibility window after taking a
// hit (from spikes or obstacles) and clears the flag at zero.
// If you already decrement invincibleTimer somewhere else in your
// full project, remove this function to avoid double-counting.
// ------------------------------------------------------------
function updateInvincibility() {
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
      player.invincibleTimer = 0;
    }
  }
}

// ============================================================
// ADDED — TILE PHYSICS
// ============================================================

// ------------------------------------------------------------
// processJsonLayers()
// Helper function to extract and categorize tiles from a JSON
// file's layers. Can be called for tileData, fishArea, or any
// other future JSON files to build a unified collision system.
// Applies world offsets so fishArea tiles are positioned correctly.
// ------------------------------------------------------------
function processJsonLayers(
  jsonFile,
  checkpointTiles,
  coinTiles,
  offsetX = 0,
  offsetY = 0
) {
  if (!jsonFile || !jsonFile.layers) return;

  for (const layer of jsonFile.layers) {
    const isWater = layer.name === "water";
    const isSolid = SOLID_LAYERS.includes(layer.name);
    const isHazard = HAZARD_LAYERS.includes(layer.name);
    const isCheckpoint = layer.name === CHECKPOINT_LAYER;
    const isCoin = layer.name === COLLECTABLE_LAYER;
    const isWhirlpool = layer.name === WHIRLPOOL_LAYER;

    if (
      !isSolid &&
      !isHazard &&
      !isCheckpoint &&
      !isCoin &&
      !isWhirlpool &&
      !isWater
    )
      continue;

    for (const t of layer.tiles) {
      const rect = {
        x: t.x * TILE_SIZE + offsetX,
        y: t.y * TILE_SIZE + offsetY,
        w: TILE_SIZE,
        h: TILE_SIZE,
        tx: t.x,
        ty: t.y,
      };
      if (isSolid) solidTiles.push(rect);
      else if (isHazard) hazardTiles.push(rect);
      else if (isCheckpoint) checkpointTiles.push(rect);
      else if (isCoin) coinTiles.push(rect);
      else if (isWhirlpool) whirlpoolTiles.push(rect);
      else if (isWater) waterTiles.push(rect);
    }
  }
}

// ============================================================
// ADDED — TILE PHYSICS
// ============================================================

// ------------------------------------------------------------
// buildTileCollision()
// Walks every layer in tileData once, sorting tiles into
// solidTiles / hazardTiles / raw checkpoint tiles based on the
// layer's name. Called once from setup(). Call it again if you
// ever swap tileData for a different scene/map at runtime.
// ------------------------------------------------------------
function buildTileCollision() {
  solidTiles = [];
  hazardTiles = [];
  const checkpointTiles = [];
  const coinTiles = [];
  whirlpoolTiles = [];
  waterTiles = [];

  // Process layers from tileData (no offset)
  processJsonLayers(tileData, checkpointTiles, coinTiles, 0, 0);

  // Process layers from fishArea with world offsets
  const fishAreaOffsetX = TILE_SIZE * (tileData.mapWidth - 33);
  const fishAreaOffsetY = TILE_SIZE * tileData.mapHeight;
  processJsonLayers(
    fishArea,
    checkpointTiles,
    coinTiles,
    fishAreaOffsetX,
    fishAreaOffsetY
  );

  function playerInWater() {
    for (const t of waterTiles) {
      const closestX = constrain(player.x, t.x, t.x + t.w);
      const closestY = constrain(player.y, t.y, t.y + t.h);

      if (dist(player.x, player.y, closestX, closestY) < player.r) {
        return true;
      }
    }
    return false;
  }

  checkpoints = groupCheckpointTiles(checkpointTiles);
  // register coins
  coinMap = new Map();
  coinsTotal = coinTiles.length;
  coinsCollected = 0;
  for (const c of coinTiles) {
    const k = c.tx + "," + c.ty;
    coinMap.set(k, false);
  }
}

// ------------------------------------------------------------
// groupCheckpointTiles()
// Checkpoint tiles are usually placed as a small cluster (a
// flag/banner a few tiles wide). This flood-fills adjacent
// checkpoint tiles into a single zone so touching ANY tile in
// the cluster counts as reaching that checkpoint, and gives each
// zone one spawn point (top-centre of the cluster).
// ------------------------------------------------------------
function groupCheckpointTiles(tileRects) {
  const key = (tx, ty) => tx + "," + ty;
  const lookup = new Map();
  for (const r of tileRects) lookup.set(key(r.tx, r.ty), r);

  const visited = new Set();
  const groups = [];

  for (const start of tileRects) {
    const startKey = key(start.tx, start.ty);
    if (visited.has(startKey)) continue;

    const queue = [start];
    visited.add(startKey);
    const cluster = [];

    while (queue.length) {
      const cur = queue.shift();
      cluster.push(cur);

      const neighbours = [
        [cur.tx + 1, cur.ty],
        [cur.tx - 1, cur.ty],
        [cur.tx, cur.ty + 1],
        [cur.tx, cur.ty - 1],
      ];
      for (const [nx, ny] of neighbours) {
        const nk = key(nx, ny);
        if (lookup.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push(lookup.get(nk));
        }
      }
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const c of cluster) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.w);
      maxY = Math.max(maxY, c.y + c.h);
    }

    groups.push({
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      spawnX: (minX + maxX) / 2,
      spawnY: minY - player.r - 4, // spawn just above the checkpoint tiles
    });
  }

  // Left-to-right order so "furthest checkpoint reached" is just an index.
  groups.sort((a, b) => a.x - b.x);
  return groups;
}

// ------------------------------------------------------------
// resolveSolidCollisions()
// Pushes the player out of any overlapping rock/seaweed tile.
// Run AFTER handleInput()/applyBounce() so movement this frame
// has already been applied, then corrected.
// ------------------------------------------------------------
function resolveSolidCollisions() {
  for (const t of solidTiles) {
    resolveCircleRect(player, t);
  }
}

// ------------------------------------------------------------
// resolveCircleRect()
// Circle (player) vs axis-aligned rect (tile) overlap + push-out.
// Mutates p.x / p.y directly so the player can never end up
// inside a solid tile.
// ------------------------------------------------------------
function resolveCircleRect(p, rect) {
  const closestX = constrain(p.x, rect.x, rect.x + rect.w);
  const closestY = constrain(p.y, rect.y, rect.y + rect.h);
  const dx = p.x - closestX;
  const dy = p.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= p.r * p.r) return;
  const d = Math.sqrt(distSq);

  if (d > 0) {
    const overlap = p.r - d;
    p.x += (dx / d) * overlap;
    p.y += (dy / d) * overlap;
  } else {
    const left = p.x - rect.x;
    const right = rect.x + rect.w - p.x;
    const top = p.y - rect.y;
    const bottom = rect.y + rect.h - p.y;
    const min = Math.min(left, right, top, bottom);

    if (min === left) p.x = rect.x - p.r;
    else if (min === right) p.x = rect.x + rect.w + p.r;
    else if (min === top) {
      p.y = rect.y - p.r;
      if (p.vy > 0) p.vy = 0; // <-- Lands on top of a tile, stop gravity velocity accumulation
    } else p.y = rect.y + rect.h + p.r;
  }
}

// ------------------------------------------------------------
// checkHazardCollisions()
// Spikes kill on contact — same circle-vs-rect overlap test as
// the solid tiles, but on touch it kills/respawns instead of
// pushing the player out.
// ------------------------------------------------------------
function checkHazardCollisions() {
  if (player.invincible) return;

  for (const t of hazardTiles) {
    const closestX = constrain(player.x, t.x, t.x + t.w);
    const closestY = constrain(player.y, t.y, t.y + t.h);
    const d = dist(player.x, player.y, closestX, closestY);

    if (d < player.r) {
      // Respawn the player at the nearest checkpoint (no life loss)
      respawnFromHazard();
      break;
    }
  }
}

// ------------------------------------------------------------
// checkCheckpoints()
// Activates the furthest checkpoint the player has touched.
// activeCheckpointIndex only ever moves forward, so walking back
// over an earlier checkpoint doesn't undo your progress.
// ------------------------------------------------------------
function checkCheckpoints() {
  for (let i = activeCheckpointIndex + 1; i < checkpoints.length; i++) {
    const cp = checkpoints[i];

    const overlapsX =
      player.x + player.r > cp.x && player.x - player.r < cp.x + cp.w;
    const overlapsY =
      player.y + player.r > cp.y && player.y - player.r < cp.y + cp.h;

    if (overlapsX && overlapsY) {
      activeCheckpointIndex = i;
      lastCheckpoint = { x: cp.spawnX, y: cp.spawnY };
      // Hook a sound/flash/UI message here if you'd like to
      // celebrate reaching a checkpoint, e.g.:
      // checkpointSound.play();
    }
  }
}

// ------------------------------------------------------------
// killPlayer()
// Shared death handler for spikes (and reusable for enemies/boss
// attacks later). Loses a life, then either ends the game or
// respawns at the last checkpoint.
// ------------------------------------------------------------
function killPlayer() {
  player.health--;
  // playerHitSound.play();

  if (player.health <= 0) {
    gameState = STATE_OVER;
    // music.stop();
    return;
  }

  respawnPlayer();
}

// ------------------------------------------------------------
// respawnPlayer()
// Moves the player to the last checkpoint reached, or back to
// the original start position if none has been reached yet.
// Grants a short invincibility window so they don't immediately
// die again on the same hazard.
// ------------------------------------------------------------
function respawnPlayer() {
  const spawn =
    lastCheckpoint ||
    findClosestPassedCheckpoint(player.x, player.y) ||
    playerStart;

  player.x = spawn.x;
  player.y = spawn.y;
  player.bounceVX = 0;
  player.bounceVY = 0;
  player.invincible = true;
  player.invincibleTimer = INVINCIBLE_FRAMES;

  camX = constrain(player.x - width / 2, 0, WORLD_W - width);
  camY = constrain(player.y - height / 2, 0, WORLD_H - height);
}

// ------------------------------------------------------------
// findClosestPassedCheckpoint()
// Returns the nearest spawn point among checkpoints the player
// has already reached, or null if none have been reached.
// ------------------------------------------------------------
function findClosestPassedCheckpoint(px, py) {
  if (activeCheckpointIndex < 0) return null;

  let best = null;
  let minD = Infinity;
  for (let i = 0; i <= activeCheckpointIndex && i < checkpoints.length; i++) {
    const cp = checkpoints[i];
    const d = dist(px, py, cp.spawnX, cp.spawnY);
    if (d < minD) {
      minD = d;
      best = {
        x: cp.spawnX,
        y: cp.spawnY,
      };
    }
  }

  return best;
}

// ------------------------------------------------------------
// findClosestCheckpoint()
// Returns the spawn {x,y} of the nearest checkpoint zone, or
// the original playerStart if none exist.
// ------------------------------------------------------------
function findClosestCheckpoint(px, py) {
  let best = playerStart;
  let minD = dist(px, py, playerStart.x, playerStart.y);

  for (const cp of checkpoints) {
    const d = dist(px, py, cp.spawnX, cp.spawnY);
    if (d < minD) {
      minD = d;
      best = {
        x: cp.spawnX,
        y: cp.spawnY,
      };
    }
  }

  return best;
}

// ------------------------------------------------------------
// respawnFromHazard()
// Immediate respawn used for spike contacts: does NOT reduce
// player health and does NOT grant invincibility (no flicker).
// Respawns at the nearest passed checkpoint or start.
// ------------------------------------------------------------
function respawnFromHazard() {
  const spawn =
    findClosestPassedCheckpoint(player.x, player.y) ||
    lastCheckpoint ||
    playerStart;

  player.x = spawn.x;
  player.y = spawn.y;
  player.bounceVX = 0;
  player.bounceVY = 0;
  // no invincibility here — user requested no glitching/flicker

  camX = constrain(player.x - width / 2, 0, WORLD_W - width);
  camY = constrain(player.y - height / 2, 0, WORLD_H - height);
}

// ------------------------------------------------------------
// checkCollectables()
// Detects overlap with coin tiles and marks them collected.
// When all coins are collected sets `allCoinsCollected`.
// ------------------------------------------------------------
function checkCollectables() {
  if (coinsTotal === 0 || allCoinsCollected) return;

  for (const layer of tileData.layers) {
    if (layer.name !== COLLECTABLE_LAYER) continue;
    for (const t of layer.tiles) {
      const key = t.x + "," + t.y;
      if (coinMap.get(key)) continue; // already collected

      const cx = t.x * TILE_SIZE + TILE_SIZE / 2;
      const cy = t.y * TILE_SIZE + TILE_SIZE / 2;
      const d = dist(player.x, player.y, cx, cy);
      if (d < player.r + TILE_SIZE * 0.35) {
        coinMap.set(key, true);
        coinsCollected++;
        if (coinsCollected >= coinsTotal) {
          allCoinsCollected = true;
          // hook: unlock door / advance level
          console.log("All coins collected!");
        }
      }
    }
  }
}

// ------------------------------------------------------------
// checkWhirlpools()
// Applies a pulling force toward any whirlpool tile the player
// is near. If the player gets too close they are pulled in.
// ------------------------------------------------------------
function checkWhirlpools() {
  if (!whirlpoolTiles || whirlpoolTiles.length === 0) return;

  for (const t of whirlpoolTiles) {
    const cx = t.x + t.w / 2;
    const cy = t.y + t.h / 2;
    const dx = cx - player.x;
    const dy = cy - player.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    const influence = t.w * 2; // radius of effect
    if (d < influence && d > 0.1) {
      // pull strength increases as you get closer
      const pull = map(d, influence, 0, 0.4, 3.0);
      player.x += (dx / d) * pull;
      player.y += (dy / d) * pull;
    }

    // Optional: if the player is extremely close, respawn them
    if (d < 6) {
      respawnFromHazard();
      break;
    }
  }
}

function updateMoveSpeed() {
  moveSpeed = playerInWater() ? 4 : PLAYER_SPEED;
}

function playerInWater() {
  for (const t of waterTiles) {
    const closestX = constrain(player.x, t.x, t.x + t.w);
    const closestY = constrain(player.y, t.y, t.y + t.h);
    if (dist(player.x, player.y, closestX, closestY) < player.r) {
      return true;
    }
  }
  return false;
}

function drawTiles(jsonFile) {
  const layers = jsonFile.layers;
  let rockPositions = null;
  if (jsonFile === tileData) {
    rockPositions = new Set();
    for (const rockLayer of layers) {
      if (rockLayer.name === "rock") {
        for (const tile of rockLayer.tiles) {
          rockPositions.add(`${tile.x},${tile.y}`);
        }
      }
    }
  }

  // First pass: draw only water layers
  for (let l = layers.length - 1; l > -1; l--) {
    const layer = layers[l];
    if (layer.name !== "water") continue;

    for (let i = 0; i < layer.tiles.length; i++) {
      let t = layer.tiles[i];
      push();
      let mapXOffset = 0;
      let mapYOffset = 0;
      if (jsonFile == fishArea) {
        mapXOffset = TILE_SIZE * (tileData.mapWidth - 33);
        mapYOffset = TILE_SIZE * tileData.mapHeight;
      }
      let x = t.x * TILE_SIZE + mapXOffset;
      let y = t.y * TILE_SIZE + mapYOffset;
      fill(tileColor(layer.name, t.id));
      rect(x, y, TILE_SIZE, TILE_SIZE);
      pop();
    }
  }

  // Draw background image for fish area after water but before other tiles
  if (jsonFile === fishArea && fishareaBG) {
    const fishAreaOffsetX = TILE_SIZE * (tileData.mapWidth - 33);
    const fishAreaOffsetY = TILE_SIZE * tileData.mapHeight;
    image(fishareaBG, fishAreaOffsetX, fishAreaOffsetY, 1900, 800);
  }

  // Second pass: draw all non-water layers
  for (let l = layers.length - 1; l > -1; l--) {
    // for each layer we will....
    const layer = layers[l];
    if (layer.name === "water") continue; // skip water, already drawn
    let spikePositions = null;
    if (jsonFile === tileData && layer.name === "spikes") {
      spikePositions = new Set(
        layer.tiles.map((tile) => `${tile.x},${tile.y}`)
      );
    }
    for (let i = 0; i < layer.tiles.length; i++) {
      let t = layer.tiles[i];

      push();

      // drawing map

      let mapXOffset = 0; // where the json is in relation to 0,0
      let mapYOffset = 0;

      if (jsonFile == fishArea) {
        mapXOffset = TILE_SIZE * (tileData.mapWidth - 33);
        mapYOffset = TILE_SIZE * tileData.mapHeight;
      }

      let x = t.x * TILE_SIZE + mapXOffset;
      let y = t.y * TILE_SIZE + mapYOffset;

      // If this is a coin tile and it has been collected, skip drawing it
      if (layer.name === COLLECTABLE_LAYER) {
        const key = t.x + "," + t.y;
        if (coinMap.get(key)) {
          pop();
          continue;
        }
      }

      // CHANGED — colour now keys off the layer name first (since the
      // same id number means different things on different layers),
      // falling back to the old id-based colours for anything else.
      if (layer.name === COLLECTABLE_LAYER) {
        fill(tileColor(layer.name, t.id));
        ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.6);
      } else if (layer.name === WHIRLPOOL_LAYER) {
        fill(tileColor(layer.name, t.id));
        rect(x, y, TILE_SIZE, TILE_SIZE, TILE_SIZE * 0.25);
        fill(10, 50, 120, 160);
        ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.6);
      } else if (jsonFile === fishArea && layer.name === "sand") {
        if (sandImg) {
          image(sandImg, x, y, TILE_SIZE, TILE_SIZE);
        } else {
          fill(tileColor(layer.name, t.id));
          rect(x, y, TILE_SIZE, TILE_SIZE);
        }
      } else if (jsonFile === fishArea && layer.name === "rock") {
        if (sandrockImg) {
          image(sandrockImg, x, y, TILE_SIZE, TILE_SIZE);
        } else {
          fill(tileColor(layer.name, t.id));
          rect(x, y, TILE_SIZE, TILE_SIZE);
        }
      } else if (jsonFile === tileData && layer.name === "rock") {
        if (rockImg) {
          image(rockImg, x, y, TILE_SIZE, TILE_SIZE);
        } else {
          fill(tileColor(layer.name, t.id));
          rect(x, y, TILE_SIZE, TILE_SIZE);
        }
      } else if (jsonFile === tileData && layer.name === "spikes") {
        const leftNeighbor = spikePositions.has(`${t.x - 1},${t.y}`);
        const rightNeighbor = spikePositions.has(`${t.x + 1},${t.y}`);
        const rockAbove = rockPositions.has(`${t.x},${t.y - 1}`);
        const rockLeft = rockPositions.has(`${t.x - 1},${t.y}`);
        const rockRight = rockPositions.has(`${t.x + 1},${t.y}`);
        const rockBelow = rockPositions.has(`${t.x},${t.y + 1}`);

        let spikeImg = spike3Img;
        if (leftNeighbor) {
          spikeImg = spike2Img;
        } else if (rightNeighbor) {
          spikeImg = spike1Img;
        } else {
          const posHash = (t.x + t.y * 7) % 2;
          if (rockAbove) {
            spikeImg = posHash === 0 ? spike3Img : spike4Img;
          } else {
            spikeImg = posHash === 0 ? spike4Img : spike3Img;
          }
        }

        let rotation = 0;
        if (!rockBelow) {
          if (rockAbove) {
            rotation = PI;
          } else if (rockLeft) {
            rotation = HALF_PI;
          } else if (rockRight) {
            rotation = -HALF_PI;
          }
        }

        if (spikeImg) {
          push();
          translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
          rotate(rotation);
          imageMode(CENTER);
          image(spikeImg, 0, 0, TILE_SIZE, TILE_SIZE);
          imageMode(CORNER);
          pop();
        } else {
          fill(tileColor(layer.name, t.id));
          rect(x, y, TILE_SIZE, TILE_SIZE);
        }
      } else if (layer.name === "seaweed") {
        if (seaweedImg) {
          image(seaweedImg, x, y, TILE_SIZE, TILE_SIZE);
        } else {
          fill(tileColor(layer.name, t.id));
          rect(x, y, TILE_SIZE, TILE_SIZE);
        }
      } else {
        fill(tileColor(layer.name, t.id));
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }

      pop();
    }
  }
}

// ------------------------------------------------------------
// ADDED — tileColor()
// Centralises tile colour lookup by layer name. Swap any of
// these for image()/sprite drawing later without touching the
// physics code above.
// ------------------------------------------------------------
function tileColor(layerName, id) {
  switch (layerName) {
    case "spikes":
      return color(200, 40, 40); // red — danger
    case "checkpoint":
      return color(255, 215, 0); // gold — flag
    case "rock":
      return color(90, 90, 90); // grey — solid
    case "seaweed":
      return color(40, 140, 60); // green — solid
    case "coins":
      return color(255, 215, 0); // gold coin
    case "whirlpool":
      return color(30, 100, 200); // blue whirlpool
    case "water":
      return color(20, 60, 160, 160); // blue — background
    case "bg green":
      return color(140, 200, 140, 160); // pale green — background
  }

  // fallback: old id-based colours, for any layer name not listed above
  switch (id) {
    case "0":
      return color("gray");
    case "1":
      return color("lightblue");
    case "2":
      return color("purple");
    case "3":
      return color("orange");
    case "4":
      return color("yellow");
    case "5":
      return color(0);
    case "6":
      return color(0, 0, 200);
    case "7":
      return color("blue");
    case "8":
      return color(80, 80, 100);
    case "9":
      return color(200, 240, 255);
    case "10":
      return color("pink");
    default:
      return color("green");
  }
}

// ------------------------------------------------------------
// drawObstacles()
// Drawn in world coordinates inside push/pop.
// Only draws obstacles near the camera for performance.
// ------------------------------------------------------------
function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    // Skip if off screen
    if (
      o.x + o.size < camX ||
      o.x - o.size > camX + width ||
      o.y + o.size < camY ||
      o.y - o.size > camY + height
    )
      continue;

    let x = o.x - o.size / 2;
    let y = o.y - o.size / 2;
    let s = o.size;

    push();

    pop();
  }
}

// ------------------------------------------------------------
// checkObstaclePlayerCollision()
// Circle-rectangle overlap test — same as Example 1.
// Obstacle contact is no longer harmful; obstacles are treated
// like a reward/interaction point instead of a death hazard.
// ------------------------------------------------------------
function checkObstaclePlayerCollision() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    let closestX = constrain(player.x, o.x - o.size / 2, o.x + o.size / 2);
    let closestY = constrain(player.y, o.y - o.size / 2, o.y + o.size / 2);
    let d = dist(player.x, player.y, closestX, closestY);

    if (d < player.r) {
      // Keep a small bounce off obstacles for feedback,
      // but do not reduce health or end the game.
      let dx = player.x - o.x;
      let dy = player.y - o.y;
      let len = dist(0, 0, dx, dy);
      if (len > 0) {
        player.bounceVX = (dx / len) * 8;
        player.bounceVY = (dy / len) * 8;
      }
      break;
    }
  }
}

// ------------------------------------------------------------
// applyBounce()
// Applies and decays bounce velocity each frame.
// ------------------------------------------------------------
function applyBounce() {
  if (abs(player.bounceVX) > 0.1 || abs(player.bounceVY) > 0.1) {
    player.x += player.bounceVX;
    player.y += player.bounceVY;
    player.bounceVX *= 0.75;
    player.bounceVY *= 0.75;

    player.x = constrain(player.x, player.r, WORLD_W - player.r);
    player.y = constrain(player.y, player.r, WORLD_H - player.r);
  }
}

// ------------------------------------------------------------
// drawBackground()
// Draws background shapes in world coordinates.
// ------------------------------------------------------------
function drawBackground() {
  noStroke();

  // World boundary outline
  noFill();
  stroke(60, 50, 80);
  strokeWeight(4);
  rect(0, 0, WORLD_W, WORLD_H);
  noStroke();
}

// ------------------------------------------------------------
// handleInput()
// WASD moves the player in world coordinates.
// Constrained to world boundaries.
// Spacebar fires in the current facing direction.
// ------------------------------------------------------------
// ------------------------------------------------------------
// handleInput() — Updates player position and tracking direction
// ------------------------------------------------------------
function handleInput() {
  player.isMoving = false;
  let inSea = playerInWater();

  // --- Horizontal Movement (Shared by both forms) ---
  if (keyIsDown(65)) {
    // A - Left
    player.x -= moveSpeed;
    player.facing = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    // D - Right
    player.x += moveSpeed;
    player.facing = "right";
    player.isMoving = true;
  }

  // --- Vertical Movement (Context Dependent) ---
  if (inSea) {
    // Standard swimming mechanics inside the water
    player.vy = 0; // Cancel out residual gravity values
    if (keyIsDown(87)) {
      // W - Up
      player.y -= moveSpeed;
      player.isMoving = true;
    }
    if (keyIsDown(83)) {
      // S - Down
      player.y += moveSpeed;
      player.isMoving = true;
    }
  } else {
    // Air/Land mechanics: Apply gravity over time
    player.vy += GRAVITY;
    player.vy = constrain(player.vy, -TERMINAL_VELOCITY, TERMINAL_VELOCITY);
    player.y += player.vy;

    // Press SPACEBAR to fly/flap upward
    if (keyIsDown(32)) {
      // Spacebar
      player.vy = FLAP_FORCE;
    }
  }

  // Constrain to world bounds
  player.x = constrain(player.x, player.r, WORLD_W - player.r);
  player.y = constrain(player.y, player.r, WORLD_H - player.r);
}

// ------------------------------------------------------------
// updateBullets()
// Bullets travel in world coordinates.
// Removed when they leave the world bounds.
// ------------------------------------------------------------
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;

    if (
      bullets[i].x < 0 ||
      bullets[i].x > WORLD_W ||
      bullets[i].y < 0 ||
      bullets[i].y > WORLD_H
    ) {
      bullets.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// drawPlayer() — Slices active state asset based on environment
// ------------------------------------------------------------
function drawPlayer() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) return;

  let inSea = playerInWater();

  push();
  imageMode(CENTER); // Safely isolate centering mechanics inside push/pop

  if (inSea) {
    // --- Render Fish ---
    let row = FISH_SPRITE.rows[player.facing];
    let sx = player.currentFrame * FISH_SPRITE.frameWidth;
    let sy = row * FISH_SPRITE.frameHeight;
    let dw = FISH_SPRITE.frameWidth * FISH_SPRITE.scale;
    let dh = FISH_SPRITE.frameHeight * FISH_SPRITE.scale;

    image(
      fishSheet,
      player.x,
      player.y,
      dw,
      dh,
      sx,
      sy,
      FISH_SPRITE.frameWidth,
      FISH_SPRITE.frameHeight
    );
  } else {
    // --- Render Bird ---
    let isFlapping = keyIsDown(32);
    let animMode = isFlapping ? "flying" : "running";
    let row = BIRD_SPRITE.rows[animMode];

    // If we just stopped flapping, make sure our frame target doesn't exceed the running row's max frames
    let safeFrame = player.currentFrame % BIRD_SPRITE.maxFrames[animMode];

    let sx = safeFrame * BIRD_SPRITE.frameWidth;
    let sy = row * BIRD_SPRITE.frameHeight;
    let dw = BIRD_SPRITE.frameWidth * BIRD_SPRITE.scale;
    let dh = BIRD_SPRITE.frameHeight * BIRD_SPRITE.scale;

    translate(player.x, player.y);
    if (player.facing === "left") {
      scale(-1, 1);
    }

    image(
      birdSheet,
      0,
      0,
      dw,
      dh,
      sx,
      sy,
      BIRD_SPRITE.frameWidth,
      BIRD_SPRITE.frameHeight
    );
  }

  pop();
}

// ------------------------------------------------------------
// drawMinimap()
// Drawn in screen coordinates after pop().
// Shows a scaled-down view of the world with:
//   Teal dot  — player position
//   Orange dots — enemy positions
//   Red dot   — boss position (when active)
//   Orange zone — boss zone indicator at top of minimap
// ------------------------------------------------------------
function drawMinimap() {
  let mapX = MAP_X;
  let mapY = height - MAP_H - MAP_Y_OFFSET;

  // Background
  fill(0, 0, 0, 180);
  stroke(80, 60, 120);
  strokeWeight(1);
  rect(mapX, mapY, MAP_W, MAP_H, 4);
  noStroke();

  // Helper — converts world position to minimap screen position
  function worldToMap(wx, wy) {
    return {
      x: mapX + map(wx, 0, WORLD_W, 0, MAP_W),
      y: mapY + map(wy, 0, WORLD_H, 0, MAP_H),
    };
  }

  // Player dot — drawn last so it's always on top
  fill(0, 200, 180);
  let pp = worldToMap(player.x, player.y);
  ellipse(pp.x, pp.y, 7);

  // Camera viewport rectangle — shows what's currently visible
  noFill();
  stroke(255, 255, 255, 60);
  strokeWeight(1);
  let vp = worldToMap(camX, camY);
  let vpW = map(width, 0, WORLD_W, 0, MAP_W);
  let vpH = map(height, 0, WORLD_H, 0, MAP_H);
  rect(vp.x, vp.y, vpW, vpH);
  noStroke();

  // Label
  fill(120);
  textSize(9);
  textAlign(LEFT);
  textFont("monospace");
  text("MAP", mapX + 4, mapY + MAP_H - 4);
}

// ------------------------------------------------------------
// keyPressed()
// R restarts. B skips to boss fight.
// ------------------------------------------------------------
function keyPressed() {
  // B — skip to boss fight for testing
  if (key === "b" || key === "B") {
    player.y = BOSS_ZONE_Y - 10;
    if (!boss) spawnBoss();
  }

  // music.loop();
}
