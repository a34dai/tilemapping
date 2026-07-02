// ============================================================
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
let camZoom = .7;

// ------------------------------------------------------------
// PLAYER CONFIGURATION
// ------------------------------------------------------------
const PLAYER_SPEED = 18; // bird
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

// ------------------------------------------------------------
// HUMAN SPRITE CONFIGURATION (start area cat character)
// ------------------------------------------------------------
const HUMAN_SPRITE = {
  frameWidth: 0,   // set in setup()
  frameHeight: 0,  // set in setup()
  numFrames: 4,
  animSpeed: 10,
  scale: 1,
  rows: {
    right: 0,
    left: 1,
  },
};

let humanSheet;

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

const GRAVITY = 0.6; // 4.0  bird gravity? Calibrated downward pull
const GRAVITY_AFTER_CHECKPOINT = GRAVITY * 1; // 60% of normal gravity after first checkpoint
const FLAP_FORCE = -8; // -24 // Gives the exact velocity curve to hit 3 blocks high
const TERMINAL_VELOCITY = 20;
const HUMAN_GRAVITY = 0.9;
const HUMAN_SPEED = 10;

const FISH_SWIM_HORIZONTAL = 0.6;   // left/right force
const FISH_SWIM_UP = 0.4;           // upward force — lower = harder to swim up
const FISH_SWIM_DOWN = 0.9;         // downward force — faster to sink than rise

const FISH_STAMINA_MAX = 100;
const FISH_STAMINA_REGEN = 0.5;      // stamina recovered per frame when not flapping
const FISH_STAMINA_COST = 10;        // stamina used per flap tap
const FISH_FLAP_FORCE = 2;         // upward burst per flap
const FISH_FLAP_DECAY = 0.3;         // how quickly flap burst fades (higher = shorter burst)
const FISH_SINK_FORCE = 0.15;        // passive downward pull
const FISH_WATER_DRAG = 0.88;

const TILE_SIZE = 50;

let player = {
  x: 330 * TILE_SIZE, //405
  y: 15 * TILE_SIZE,
  vy: 1,
  vx: 0,
  r: 15, //22

  //fish stuff
  stamina: 100,      // ← add this
  flapVelocity: 0,   // ← add this
  flapQueued: false, // ← add this too

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
  isGrounded: false,
  jumpCooldown: 0,
}; 

// ------------------------------------------------------------
// WHIRLPOOL SPRITE CONFIGURATION
// ------------------------------------------------------------
const WHIRLPOOL_SPRITE = {
  numFrames: 4,     // 4 frames horizontal
  animSpeed: 8,     // Lower number = faster rotation speed
  scale: 1.0        // Scale adjustment if needed to fit TILE_SIZE
};

let whirlpoolImg;     // Holds the portal(db).png texture asset
let whirlpoolFrame = 0;
let whirlpoolTimer = 0;

let startArea;
let birdArea;
let fishArea;
let endArea;
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
let cavebg;

let fishSheet; //fish sprite sheet
let birdSheet; //bird sprite sheet

// ------------------------------------------------------------
// ADDED — TILE PHYSICS
// Tiles are grouped by *behaviour* rather than by raw id, since
// the same id number means different things on different layers.
// Add/rename layer names here to match your map.json exactly.
// ------------------------------------------------------------
const SOLID_LAYERS = ["rock", "seaweed", "sand", "algae", "bark"]; // blocks movement CHANGE SEAWEED PROPERTES
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
// GAME STATE
// ------------------------------------------------------------
let score = 0;

const STATE_PLAY = "play";
const STATE_WIN = "win";
const STATE_OVER = "over";
let gameState = STATE_PLAY;


// ============================================================
// preload()
// ============================================================
function preload() {

  startArea = loadJSON("data/startarea.json");
  birdArea = loadJSON("data/birdarea.json");
  fishArea = loadJSON("data/fisharea.json");
  endArea = loadJSON("data/endarea.json");

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
  cavebg = loadImage("assets/cavebg.png");
  birdSheet = loadImage("assets/bird.png");
  humanSheet = loadImage("assets/human.png");

}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(800, 450);
  WORLD_W =
    TILE_SIZE *
    (startArea.mapWidth +
      birdArea.mapWidth +
      fishArea.mapWidth +
      endArea.mapWidth); // total world width in pixels
  WORLD_H = TILE_SIZE * (birdArea.mapHeight + fishArea.mapHeight); // total world height in pixels
  console.log("birdArea=", birdArea);

  FISH_SPRITE.frameWidth = fishSheet.width / 2;
  FISH_SPRITE.frameHeight = fishSheet.height / 2;

  HUMAN_SPRITE.frameWidth  = humanSheet.width  / HUMAN_SPRITE.numFrames;
  HUMAN_SPRITE.frameHeight = humanSheet.height / 2;


  const tilesArray = birdArea.layers?.[0]?.tiles || [];
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

  //drawBackground();

  if (player.x < TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth / 2)) {
    drawTiles(startArea);
    print("start area drawn");
  }

  //if (player.x > TILE_SIZE * startArea.mapWidth / 2) {
  drawTiles(birdArea);
  //print("bird area drawn")
  //}

  // if player is near y lvel of fish area
  if (player.y > TILE_SIZE * (birdArea.mapHeight - fishArea.mapHeight)) {
    // add end of fish area boundary later
    drawTiles(fishArea); // fish area
    console.log("fish area drawn");
  }

  if (player.x > birdArea.mapWidth * TILE_SIZE) {
    drawTiles(endArea);
    print("end area drawn");
  }

  if (gameState === STATE_PLAY) {
    updateMoveSpeed();
    handleInput();

    whirlpoolTimer++;
    if (whirlpoolTimer >= WHIRLPOOL_SPRITE.animSpeed) {
      whirlpoolTimer = 0;
      whirlpoolFrame = (whirlpoolFrame + 1) % WHIRLPOOL_SPRITE.numFrames;
    }

    // ADDED — tile physics: solid blockage, hazards, checkpoints
    resolveSolidCollisions();
    checkWhirlpools();
    checkCollectables();
    checkHazardCollisions();
    checkCheckpoints();

    drawPlayer();

    // ADDED: draw fish area overlay on top of everything (world coordinates)
    if (fishareaOverlay) {
      const fishAreaOffsetX = TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth - 33);
      const fishAreaOffsetY = TILE_SIZE * birdArea.mapHeight;
      image(fishareaOverlay, fishAreaOffsetX, fishAreaOffsetY, 1900, 800);
    }
  }

  pop(); // restore screen coordinates
}

// ------------------------------------------------------------
// animateCharacter() — Dynamic state animation processing
// ------------------------------------------------------------
function animateCharacter() {
  let inSea   = playerInWater();
  let inStart = player.x < TILE_SIZE * startArea.mapWidth;

  if (inStart) {
    if (player.isMoving) {
      player.frameTimer++;
      if (player.frameTimer >= HUMAN_SPRITE.animSpeed) {
        player.frameTimer = 0;
        player.currentFrame = (player.currentFrame + 1) % HUMAN_SPRITE.numFrames;
      }
    } else {
      player.currentFrame = 0;
      player.frameTimer = 0;
    }
    
  } else if (inSea) {
    // Fish animation (unchanged)
    if (player.isMoving) {
      player.frameTimer++;
      if (player.frameTimer >= FISH_SPRITE.animSpeed) {
        player.frameTimer = 0;
        player.currentFrame = (player.currentFrame + 1) % FISH_SPRITE.numFrames;
      }
    } else {
      player.currentFrame = 0;
      player.frameTimer   = 0;
    }

  } else {
    // Bird animation (unchanged)
    let isFlapping      = keyIsDown(87);
    let currentAnimMode = isFlapping ? "flying" : "running";
    let maxFrames       = BIRD_SPRITE.maxFrames[currentAnimMode];
    if (isFlapping || player.isMoving) {
      player.frameTimer++;
      if (player.frameTimer >= BIRD_SPRITE.animSpeed) {
        player.frameTimer = 0;
        player.currentFrame = (player.currentFrame + 1) % maxFrames;
      }
    } else {
      player.currentFrame = 0;
      player.frameTimer   = 0;
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

  // Tick down jump cooldown
  if (player.jumpCooldown > 0) {
    player.jumpCooldown--;
  }
}

// ============================================================
// ADDED — TILE PHYSICS
// ============================================================

// ------------------------------------------------------------
// processJsonLayers()
// Helper function to extract and categorize tiles from a JSON
// file's layers. Can be called for birdArea, fishArea, or any
// other future JSON files to build a unified collision system.
// Applies world offsets so fishArea tiles are positioned correctly.
// ------------------------------------------------------------
function processJsonLayers(
  jsonFile,
  checkpointTiles,
  coinTiles,
  offsetX = 0,
  offsetY = 0,
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
// Walks every layer in birdArea once, sorting tiles into
// solidTiles / hazardTiles / raw checkpoint tiles based on the
// layer's name. Called once from setup(). Call it again if you
// ever swap birdArea for a different scene/map at runtime.
// ------------------------------------------------------------
function buildTileCollision() {
  solidTiles = [];
  hazardTiles = [];
  const checkpointTiles = [];
  const coinTiles = [];
  whirlpoolTiles = [];
  waterTiles = [];

  processJsonLayers(startArea, checkpointTiles, coinTiles, 0, 0);

  // Process layers from birdArea (no offset)
  //processJsonLayers(startArea, checkpointTiles, coinTiles, 0, 0)
  //processJsonLayers(birdArea, checkpointTiles, coinTiles, 0, 0);
  processJsonLayers(birdArea, checkpointTiles, coinTiles, startArea.mapWidth * TILE_SIZE, 0);

  // Process layers from fishArea with world offsets
  const fishAreaOffsetX = TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth - 33);
  const fishAreaOffsetY = TILE_SIZE * birdArea.mapHeight;
  processJsonLayers(
    fishArea,
    checkpointTiles,
    coinTiles,
    fishAreaOffsetX,
    fishAreaOffsetY,
  );

  processJsonLayers(endArea, checkpointTiles, coinTiles, TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth), TILE_SIZE * (birdArea.mapHeight - endArea.mapHeight));

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
  console.log("Checkpoints found:", checkpoints.length, checkpoints);
  console.log("Total checkpoint tiles:", checkpointTiles.length);

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
      if (p.vy > 0) p.vy = 0;
      player.isGrounded = true; 
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
    const overlapsX = player.x + player.r > cp.x && player.x - player.r < cp.x + cp.w;
    if (overlapsX) {
      activeCheckpointIndex = i;
      lastCheckpoint = { x: cp.spawnX, y: cp.spawnY };
      console.log("Checkpoint activated:", i, lastCheckpoint);
    }
  }
}


// ------------------------------------------------------------
// respawnPlayer()
// When the player loses health, spawn at the closest checkpoint
// they have passed, with (0, 0) as the fallback.
// Grants a short invincibility window so they don't immediately
// die again on the same hazard.
// ------------------------------------------------------------
function respawnPlayer() {
  const spawn = findClosestPassedCheckpoint(player.x, player.y) || 
  lastCheckpoint ||
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
  let best = null;
  let minD = Infinity;

  for (const cp of checkpoints) {
    const centerX = cp.x + cp.w / 2;
    if (centerX > px) continue; // only checkpoints already passed

    const d = dist(px, py, cp.spawnX, cp.spawnY);
    if (d < minD) {
      minD = d;
      best = { x: cp.spawnX, y: cp.spawnY };
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
  player.vy = 0;
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

  for (const layer of birdArea.layers) {
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

  rockPositions = new Set();
  for (const rockLayer of layers) {
    if (rockLayer.name === "rock") {
      for (const tile of rockLayer.tiles) {
        rockPositions.add(`${tile.x},${tile.y}`);
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

    if (jsonFile == startArea) {
      //mapYOffset = TILE_SIZE * 5; // shift down to bird area level
    }

    if (jsonFile == birdArea) {
      mapXOffset = TILE_SIZE * startArea.mapWidth;
      mapYOffset = 0;
    }
    if (jsonFile == fishArea) {
      mapXOffset = TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth - 33);
      mapYOffset = TILE_SIZE * birdArea.mapHeight;
    }

    if (jsonFile == endArea) {
      mapXOffset = TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth);
      mapYOffset = TILE_SIZE * (birdArea.mapHeight - endArea.mapHeight);
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
  const fishAreaOffsetX = TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth - 33);
  const fishAreaOffsetY = TILE_SIZE * birdArea.mapHeight;
  image(fishareaBG, fishAreaOffsetX, fishAreaOffsetY, 1900, 800);
}

// Second pass: draw all non-water layers
  // For birdArea, draw the bg green layer first, then the cavebg image,
  // then all remaining non-water layers so cavebg stays under the rest.
  if (jsonFile === birdArea && cavebg) {
    const mapXOffset = TILE_SIZE * startArea.mapWidth;
    const mapYOffset = 0;

    // Draw bg green tiles first so cavebg can sit above them.
    for (let l = layers.length - 1; l > -1; l--) {
      const layer = layers[l];
      if (layer.name !== "bg green") continue;

      for (let i = 0; i < layer.tiles.length; i++) {
        const t = layer.tiles[i];
        const x = t.x * TILE_SIZE + mapXOffset;
        const y = t.y * TILE_SIZE + mapYOffset;
        fill(tileColor(layer.name, t.id));
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw cavebg using its original dimensions, aligned to the
    // top-right corner of the birdArea section.
    //const areaWidth = birdArea.mapWidth * TILE_SIZE;
    //const caveX = mapXOffset + areaWidth - cavebg.width;
    //const caveY = mapYOffset; // top edge of birdArea

    //image(cavebg, caveX, caveY);

    const areaWidth = birdArea.mapWidth * TILE_SIZE;
const areaHeight = birdArea.mapHeight * TILE_SIZE;

// pick a target size — e.g. shrink to fit map height, keep aspect ratio
const caveScale = 0.5; // or hardcode a smaller value like 0.6
const caveW = cavebg.width * caveScale;
const caveH = cavebg.height * caveScale;

const caveX = mapXOffset + areaWidth - caveW;
const caveY = mapYOffset; 

image(cavebg, caveX, caveY, caveW, caveH);
  }

  for (let l = layers.length - 1; l > -1; l--) {
    // for each layer we will....
    const layer = layers[l];
    if (layer.name === "water") continue; // skip water, already drawn
    if (jsonFile === birdArea && layer.name === "bg green") continue; // already drawn
    let spikePositions = null;
    if (jsonFile === birdArea && layer.name === "spikes") {
      spikePositions = new Set(layer.tiles.map((tile) => `${tile.x},${tile.y}`));
    }
    for (let i = 0; i < layer.tiles.length; i++) {
      let t = layer.tiles[i];

      push();

      // drawing map

      let mapXOffset = 0; // where the json is in relation to 0,0
      let mapYOffset = 0;

      if (jsonFile === startArea) {
        //mapYOffset = TILE_SIZE * 5;
      }

      if (jsonFile === birdArea) {
        mapXOffset = TILE_SIZE * startArea.mapWidth;
        mapYOffset = 0;
      }
      if (jsonFile === fishArea) {
        mapXOffset = TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth - 33);
        mapYOffset = TILE_SIZE * birdArea.mapHeight;
      }

      if (jsonFile === endArea) {
        mapXOffset = TILE_SIZE * (startArea.mapWidth + birdArea.mapWidth);
        mapYOffset = TILE_SIZE * (birdArea.mapHeight - endArea.mapHeight);
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
        if (whirlpoolImg) {
          let frameW = whirlpoolImg.width / WHIRLPOOL_SPRITE.numFrames;
          let frameH = whirlpoolImg.height;

          let sx = whirlpoolFrame * frameW;
          let sy = 0;

          push();
          imageMode(CENTER);
          // Anchor coordinates safely to the center of the tile
          translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
          image(
            whirlpoolImg,
            0, 0,
            TILE_SIZE * WHIRLPOOL_SPRITE.scale,
            TILE_SIZE * WHIRLPOOL_SPRITE.scale,
            sx, sy,
            frameW, frameH
          );
          pop();
        } else {
          // Decorative structural fallback loop
          fill(tileColor(layer.name, t.id));
          rect(x, y, TILE_SIZE, TILE_SIZE, TILE_SIZE * 0.25);
          fill(10, 50, 120, 160);
          ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.6);
        }
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
      } else if ((jsonFile === birdArea || jsonFile === startArea || jsonFile === endArea) && layer.name === "rock") {
        if (rockImg) {
          image(rockImg, x, y, TILE_SIZE, TILE_SIZE);
        } else {
          fill(tileColor(layer.name, t.id));
          rect(x, y, TILE_SIZE, TILE_SIZE);
        }
      } else if ((jsonFile === birdArea || jsonFile === startArea || jsonFile === endArea) && layer.name === "background sky") {
        fill(tileColor(layer.name, t.id));
        rect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (jsonFile === birdArea && layer.name === "spikes") {
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
      } else if (layer.name === "door") {
        fill(0)
         rect(x, y, TILE_SIZE, TILE_SIZE);
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
     case "bark":
      return color("brown"); // bark
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
    case "sand":
      return color("yellow"); // yellow — background
    case "water":
      return color(20, 60, 160, 160); // blue — background
    
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
// W key flaps/jumps when not in the start area.
// ------------------------------------------------------------
// ------------------------------------------------------------
// handleInput() — Updates player position and tracking direction
// ------------------------------------------------------------
function handleInput() {
  player.isMoving = false;
  let inSea = playerInWater();
  let inStart = player.x < TILE_SIZE * startArea.mapWidth;

  // --- Horizontal Movement ---
  if (keyIsDown(65)) {
    player.x -= inStart ? HUMAN_SPEED : moveSpeed;
    player.facing = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    player.x += inStart ? HUMAN_SPEED : moveSpeed;
    player.facing = "right";
    player.isMoving = true;
  }

  // --- Vertical Movement (Context Dependent) ---
  if (inSea) {
  // --- Passive sink ---
  player.vy += FISH_SINK_FORCE;

  // --- Stamina regen when not pressing up ---
  if (!keyIsDown(87)) {
    player.stamina = min(player.stamina + FISH_STAMINA_REGEN, FISH_STAMINA_MAX);
  }

  // --- Flap: only triggers on fresh keypress, not held ---
  // (handled in keyPressed, sets a flapQueued flag)
  if (player.flapQueued && player.stamina >= FISH_STAMINA_COST) {
    player.flapVelocity = -FISH_FLAP_FORCE;     // burst upward
    player.stamina -= FISH_STAMINA_COST;
    player.flapQueued = false;
    player.isMoving = true;
  } else {
    player.flapQueued = false;   // cancel queued flap if no stamina
  }

  // --- Decay the flap burst so each tap only gives a short push ---
  player.flapVelocity *= (1 - FISH_FLAP_DECAY);

  // --- Combine into vy ---
  player.vy += player.flapVelocity;


  // --- Down is easy and holdable ---
  if (keyIsDown(83)) { player.vy += FISH_SWIM_DOWN; player.isMoving = true; }

  player.vy *= FISH_WATER_DRAG;
  player.vx *= FISH_WATER_DRAG;

  player.vy = constrain(player.vy, -8, 6);   // asymmetric: harder cap going up
  player.vx = constrain(player.vx, -moveSpeed, moveSpeed);

  player.x += player.vx;
  player.y += player.vy;
} else {
  player.vx = 0;
    const currentGravity = activeCheckpointIndex >= 0 ? GRAVITY_AFTER_CHECKPOINT : GRAVITY;

    if (inStart) {
      player.vy += HUMAN_GRAVITY;
    } else {
      player.vy += currentGravity;
    }

    player.vy = constrain(player.vy, -TERMINAL_VELOCITY, TERMINAL_VELOCITY);
    player.y += player.vy;

    if (!inStart) {
      if (keyIsDown(87)) {
        player.vy = FLAP_FORCE;
      }
    }

    player.isGrounded = false;
  }

  // Constrain to world bounds
  player.x = constrain(player.x, player.r, WORLD_W - player.r);
  player.y = constrain(player.y, player.r, WORLD_H - player.r);
}


// ------------------------------------------------------------
// drawPlayer() — Slices active state asset based on environment
// ------------------------------------------------------------
function drawPlayer() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) return;

  let inSea = playerInWater();
  let inStart = player.x < TILE_SIZE * startArea.mapWidth; // before bird area

  push();
  imageMode(CENTER);

  if (inStart) {
    let row = HUMAN_SPRITE.rows[player.facing] ?? 0; // row 0 = right, row 1 = left
    let sx  = player.currentFrame * HUMAN_SPRITE.frameWidth;
    let sy  = row * HUMAN_SPRITE.frameHeight;
    let dw  = HUMAN_SPRITE.frameWidth  * HUMAN_SPRITE.scale;
    let dh  = HUMAN_SPRITE.frameHeight * HUMAN_SPRITE.scale;
    image(
      humanSheet,
      player.x,
      player.y - TILE_SIZE * 0.5,
      dw,
      dh,
      sx,
      sy,
      HUMAN_SPRITE.frameWidth,
      HUMAN_SPRITE.frameHeight
    );

  } else if (inSea) {
    // --- Render Fish --- (existing code unchanged)
    let row = FISH_SPRITE.rows[player.facing];
    let sx  = player.currentFrame * FISH_SPRITE.frameWidth;
    let sy  = row * FISH_SPRITE.frameHeight;
    let dw  = FISH_SPRITE.frameWidth  * FISH_SPRITE.scale;
    let dh  = FISH_SPRITE.frameHeight * FISH_SPRITE.scale;
    image(fishSheet, player.x, player.y, dw, dh, sx, sy,
          FISH_SPRITE.frameWidth, FISH_SPRITE.frameHeight);

  // Vertical stamina bar — drawn to the right of the fish
const barW = 5;
const barH = 40;
const bx = player.x + player.r + 40;   // right side of fish
const by = player.y - barH / 2;        // vertically centred on fish
const fill_h = map(player.stamina, 0, FISH_STAMINA_MAX, 0, barH);

noStroke();
fill(0, 0, 0, 100);
rect(bx, by, barW, barH, 2);                          // background track
fill(map(player.stamina, 0, FISH_STAMINA_MAX, 255, 80), 
     map(player.stamina, 0, FISH_STAMINA_MAX, 60, 200), 120);
rect(bx, by + (barH - fill_h), barW, fill_h, 2);     // fills from bottom up


  } else {
    // --- Render Bird --- (existing code unchanged)
    let isFlapping  = keyIsDown(87);
    let animMode    = isFlapping ? "flying" : "running";
    let row         = BIRD_SPRITE.rows[animMode];
    let safeFrame   = player.currentFrame % BIRD_SPRITE.maxFrames[animMode];
    let sx = safeFrame * BIRD_SPRITE.frameWidth;
    let sy = row       * BIRD_SPRITE.frameHeight;
    let dw = BIRD_SPRITE.frameWidth  * BIRD_SPRITE.scale;
    let dh = BIRD_SPRITE.frameHeight * BIRD_SPRITE.scale;

    translate(player.x, player.y);
    if (player.facing === "left") scale(-1, 1);
    image(birdSheet, 0, 0, dw, dh, sx, sy,
          BIRD_SPRITE.frameWidth, BIRD_SPRITE.frameHeight);
  }

  pop();
}

// ------------------------------------------------------------
// drawMinimap()
// Drawn in screen coordinates after pop().
// Shows a scaled-down view of the world 
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
  // Human jump — single press with cooldown
  let inStart = player.x < TILE_SIZE * startArea.mapWidth;
  if ((key === 'w' || key === 'W' || keyCode === 87) && inStart && player.jumpCooldown <= 0) {
    player.vy = -13;
    player.jumpCooldown = 30;
  }


  // Fish flap — tap only, not holdable
  if (keyCode === 87 && playerInWater()) {
    player.flapQueued = true;
  }

  // music.loop();
} 