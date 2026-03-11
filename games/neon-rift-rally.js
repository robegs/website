const neonRiftRallyGame = {
  id: "neon-rift-rally",
  title: "Neon Rift Rally",
  description: "High-speed hover sprint through a shifting neon canyon.",
  difficulty: "Reaction speed, jump timing, and lane discipline",
  setup: setupNeonRiftRally,
};

function setupNeonRiftRally(container) {
  const width = 1120;
  const height = 620;
  const visibleDepth = 520;
  const sectorLength = 1500;
  const bestKey = "neonRiftRallyBest";
  const enemyProfiles = {
    raider: {
      laneW: 0.25,
      iconScale: 0.56,
      hitboxFactor: 0.56,
      driftMin: 0.14,
      driftMax: 0.24,
      freqMin: 3.2,
      freqMax: 4.4,
      approach: 14,
      chase: 0.08,
      damage: 22,
      nearMissPad: 0.17,
      label: "AVOID RAIDER",
      sprite: "enemyRaider",
      zHit: 0.22,
    },
    drone: {
      laneW: 0.23,
      iconScale: 0.52,
      hitboxFactor: 0.54,
      driftMin: 0.18,
      driftMax: 0.28,
      freqMin: 4.2,
      freqMax: 5.5,
      approach: 18,
      chase: 0.05,
      damage: 24,
      nearMissPad: 0.16,
      label: "AVOID DRONE",
      sprite: "enemyBug",
      zHit: 0.24,
    },
    wraith: {
      laneW: 0.33,
      iconScale: 0.72,
      hitboxFactor: 0.6,
      driftMin: 0.03,
      driftMax: 0.07,
      freqMin: 1.1,
      freqMax: 1.7,
      approach: -10,
      chase: 0,
      damage: 28,
      nearMissPad: 0.18,
      label: "AVOID WRAITH",
      sprite: "enemySkull",
      zHit: 0.3,
    },
    mine: {
      laneW: 0.2,
      iconScale: 0.45,
      hitboxFactor: 0.48,
      driftMin: 0,
      driftMax: 0,
      freqMin: 0.8,
      freqMax: 1.2,
      approach: 2,
      chase: 0,
      damage: 21,
      nearMissPad: 0.14,
      label: "AVOID MINE",
      sprite: "enemyBug",
      zHit: 0.18,
    },
    interceptor: {
      laneW: 0.24,
      iconScale: 0.6,
      hitboxFactor: 0.54,
      driftMin: 0.26,
      driftMax: 0.34,
      freqMin: 5.0,
      freqMax: 6.5,
      approach: 24,
      chase: 0.22,
      damage: 26,
      nearMissPad: 0.17,
      label: "AVOID INTERCEPTOR",
      sprite: "enemyInterceptor",
      zHit: 0.24,
    },
  };
  const gameModes = [
    { name: "Arcade", spawnScale: 1, scoreScale: 1, energyRegen: 16 },
    { name: "Precision", spawnScale: 0.94, scoreScale: 1.15, energyRegen: 14 },
    { name: "Chaos", spawnScale: 0.86, scoreScale: 1.32, energyRegen: 12 },
  ];
  const themeDefs = [
    {
      name: "Nebula Violet",
      skyTop: "#030515",
      skyMid: "#0a1136",
      skyBottom: "#231447",
      haloA: "rgba(56,189,248,0.34)",
      haloB: "rgba(217,70,239,0.32)",
      leftWall: "45,212,191",
      rightWall: "168,85,247",
      bgSprite: "bgPurple",
    },
    {
      name: "Solar Storm",
      skyTop: "#13050b",
      skyMid: "#2c0c24",
      skyBottom: "#3b1024",
      haloA: "rgba(251,146,60,0.32)",
      haloB: "rgba(244,63,94,0.32)",
      leftWall: "251,146,60",
      rightWall: "244,63,94",
      bgSprite: "bgBlue",
    },
    {
      name: "Cryo Dusk",
      skyTop: "#04131b",
      skyMid: "#0b2438",
      skyBottom: "#102b46",
      haloA: "rgba(34,211,238,0.32)",
      haloB: "rgba(99,102,241,0.32)",
      leftWall: "34,211,238",
      rightWall: "99,102,241",
      bgSprite: "bgBlack",
    },
  ];

  const root = document.createElement("div");
  root.className = "lab-game nr-game";
  root.innerHTML = `
    <div class="hud">
      <div class="hud-item"><strong>Integrity</strong><div id="nr-integrity">100%</div></div>
      <div class="hud-item"><strong>Energy</strong><div id="nr-energy">100%</div></div>
      <div class="hud-item"><strong>Sector</strong><div id="nr-sector">1</div></div>
      <div class="hud-item"><strong>Distance</strong><div id="nr-distance">0m</div></div>
      <div class="hud-item"><strong>Multiplier</strong><div id="nr-mult">x1.0</div></div>
      <div class="hud-item"><strong>Score</strong><div id="nr-score">0</div></div>
      <div class="hud-item"><strong>Best</strong><div id="nr-best">0</div></div>
    </div>
    <div class="action-row">
      <button type="button" id="nr-start" class="btn primary">Start Run</button>
      <button type="button" id="nr-pause" class="btn ghost">Pause</button>
      <button type="button" id="nr-restart" class="btn ghost">Restart</button>
      <button type="button" id="nr-mode" class="btn ghost">Mode: Arcade</button>
      <label class="bb-level-picker-label" for="nr-seed">Seed</label>
      <input id="nr-seed" class="bb-level-picker" style="width:120px" value="" />
      <button type="button" id="nr-daily" class="btn ghost">Daily</button>
    </div>
    <p class="status" id="nr-status">Avoid red enemies. Jump to collect high cyan gates and dodge hazards.</p>
    <p class="status nr-legend" id="nr-legend">
      <img src="assets/games/neon-rift-rally/hazard-icon.svg" alt="" />
      Avoid red enemies
      <img src="assets/games/neon-rift-rally/energy-icon.svg" alt="" />
      Pass through cyan energy gates to charge jump thrusters
      <img src="assets/games/neon-rift-rally/pickup-shield.svg" alt="" />
      Green gates repair integrity
      <img src="assets/games/neon-rift-rally/pickup-coins.svg" alt="" />
      Gold gates grant score burst
      <img src="assets/games/neon-rift-rally/pickup-shield.svg" alt="" />
      Violet gates grant temporary phase shield
      <img src="assets/games/neon-rift-rally/goal-icon.svg" alt="" />
      Survive and push to higher sectors
    </p>
    <div class="bb-canvas-wrap">
      <canvas class="bb-canvas" id="nr-canvas" width="${width}" height="${height}"></canvas>
      <div class="lab-finish-overlay" id="nr-overlay" aria-live="polite">
        <div class="lab-finish-card">
          <p class="lab-finish-title" id="nr-overlay-title">Neon Rift Rally</p>
          <p class="lab-finish-text" id="nr-overlay-text">Press Start Run to launch.</p>
          <button type="button" id="nr-play-again" class="btn primary">Play Again</button>
        </div>
      </div>
    </div>
    <div class="pf-touch" id="nr-touch" aria-label="Touch controls">
      <button type="button" data-act="left" class="pf-touch-btn">Left</button>
      <button type="button" data-act="right" class="pf-touch-btn">Right</button>
      <button type="button" data-act="boost" class="pf-touch-btn">Jump</button>
    </div>
  `;
  container.appendChild(root);

  const canvas = root.querySelector("#nr-canvas");
  const ctx = canvas.getContext("2d");
  const integrityEl = root.querySelector("#nr-integrity");
  const energyEl = root.querySelector("#nr-energy");
  const sectorEl = root.querySelector("#nr-sector");
  const distanceEl = root.querySelector("#nr-distance");
  const multEl = root.querySelector("#nr-mult");
  const scoreEl = root.querySelector("#nr-score");
  const bestEl = root.querySelector("#nr-best");
  const startBtn = root.querySelector("#nr-start");
  const pauseBtn = root.querySelector("#nr-pause");
  const restartBtn = root.querySelector("#nr-restart");
  const modeBtn = root.querySelector("#nr-mode");
  const seedEl = root.querySelector("#nr-seed");
  const dailyBtn = root.querySelector("#nr-daily");
  const statusEl = root.querySelector("#nr-status");
  const overlayEl = root.querySelector("#nr-overlay");
  const overlayTitleEl = root.querySelector("#nr-overlay-title");
  const overlayTextEl = root.querySelector("#nr-overlay-text");
  const playAgainBtn = root.querySelector("#nr-play-again");
  const touchEl = root.querySelector("#nr-touch");

  const keys = new Set();
  let rafId = null;
  let lastTs = performance.now();

  let state = "ready";
  let running = false;
  let paused = false;
  let distance = 0;
  let score = 0;
  let best = Number(window.localStorage.getItem(bestKey) || "0");
  let integrity = 100;
  let energy = 100;
  let speed = 115;
  let baseSpeed = 115;
  let playerX = 0;
  let playerVX = 0;
  let currentCurve = 0;
  let targetCurve = 0;
  let curveTimer = 0;
  let spawnCursor = visibleDepth + 24;
  let pickupCursor = 120;
  let obstacles = [];
  let pickups = [];
  let particles = [];
  let visualClock = 0;
  let flashTimer = 0;
  let pickupFlashTimer = 0;
  let pickupFlashColor = "34,211,238";
  let shakeTimer = 0;
  let hitPulseTimer = 0;
  let hitPulseColor = "248,113,133";
  let shieldTimer = 0;
  let sector = 1;
  let startedAt = 0;
  let jumpActive = false;
  let playerZ = 0;
  let playerVZ = 0;
  let riftPulse = 0;
  let scoreMult = 1;
  let comboTimer = 0;
  let nextEventDistance = 980;
  let eventEndDistance = -1;
  let thrusterHintTimer = 0;
  let lastSectorAnnounced = 1;
  let gameModeIndex = 0;
  let seed = "";
  let rngState = 1;
  let currentTheme = themeDefs[0];

  const touchState = { left: false, right: false, boost: false };
  const spritePaths = {
    player: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Cars/car_blue_1.png",
    enemyBug: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Enemies/enemyRed3.png",
    enemyRaider: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Enemies/enemyBlack3.png",
    enemyInterceptor: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Enemies/enemyBlue5.png",
    enemySkull: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Meteors/meteorGrey_big2.png",
    pickupShield: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Power-ups/powerupGreen_shield.png",
    pickupPhase: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Power-ups/powerupRed_shield.png",
    pickupCoins: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Power-ups/powerupYellow_star.png",
    pickupEnergy: "assets/games/neon-rift-rally/kenney/space-shooter-redux/PNG/Power-ups/powerupBlue_bolt.png",
    bgPurple: "assets/games/neon-rift-rally/kenney/space-shooter-redux/Backgrounds/purple.png",
    bgBlue: "assets/games/neon-rift-rally/kenney/space-shooter-redux/Backgrounds/blue.png",
    bgBlack: "assets/games/neon-rift-rally/kenney/space-shooter-redux/Backgrounds/black.png",
  };
  const sprites = {};

  bestEl.textContent = String(best);

  let stars = [];

  function loadSprites() {
    Object.keys(spritePaths).forEach((key) => {
      const img = new Image();
      img.src = spritePaths[key];
      sprites[key] = img;
    });
  }

  function buildStarfield() {
    stars = Array.from({ length: 90 }, () => ({
      x: rand() * width,
      y: rand() * (height * 0.62),
      s: 0.5 + rand() * 2.2,
      p: rand() * Math.PI * 2,
    }));
  }

  function setOverlay(visible, title, text) {
    if (title) {
      overlayTitleEl.textContent = title;
    }
    if (text) {
      overlayTextEl.textContent = text;
    }
    overlayEl.classList.toggle("show", Boolean(visible));
  }

  function getSectorFromDistance(value) {
    return Math.max(1, Math.floor(value / sectorLength) + 1);
  }

  function getDifficultyScale() {
    return 1 + Math.min(9, (sector - 1) * 0.4);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pulseVibration(pattern) {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
      return;
    }
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }

  function hashSeed(input) {
    let h = 2166136261 >>> 0;
    const text = String(input || "1");
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function setSeed(nextSeed) {
    seed = String(nextSeed || "").trim() || String(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
    rngState = hashSeed(seed) || 1;
    currentTheme = themeDefs[Math.floor(rand() * themeDefs.length)];
    if (seedEl && seedEl !== document.activeElement) {
      seedEl.value = seed;
    }
  }

  function rand() {
    rngState = (Math.imul(rngState ^ (rngState >>> 15), 1 | rngState) + 0x6d2b79f5) >>> 0;
    let t = Math.imul(rngState ^ (rngState >>> 7), 61 | rngState);
    t ^= t + Math.imul(t ^ (t >>> 14), 4 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function syncHud() {
    integrityEl.textContent = `${Math.max(0, Math.round(integrity))}%`;
    energyEl.textContent = `${Math.round(energy)}%`;
    sectorEl.textContent = String(sector);
    distanceEl.textContent = `${Math.floor(distance)}m`;
    scoreEl.textContent = String(Math.floor(score));
    multEl.textContent = `x${scoreMult.toFixed(1)}`;
    bestEl.textContent = String(best);
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    if (modeBtn) {
      modeBtn.textContent = `Mode: ${gameModes[gameModeIndex].name}`;
    }
  }

  function resetRun() {
    setSeed(seedEl ? seedEl.value : seed);
    buildStarfield();
    state = "ready";
    running = false;
    paused = false;
    distance = 0;
    score = 0;
    integrity = 100;
    energy = 100;
    baseSpeed = 115;
    speed = baseSpeed;
    playerX = 0;
    playerVX = 0;
    playerZ = 0;
    playerVZ = 0;
    currentCurve = 0;
    targetCurve = 0;
    curveTimer = 0;
    spawnCursor = visibleDepth + 24;
    pickupCursor = 120;
    obstacles = [];
    pickups = [];
    particles = [];
    flashTimer = 0;
    pickupFlashTimer = 0;
    pickupFlashColor = "34,211,238";
    shakeTimer = 0;
    hitPulseTimer = 0;
    hitPulseColor = "248,113,133";
    shieldTimer = 0;
    sector = 1;
    startedAt = 0;
    scoreMult = 1;
    comboTimer = 0;
    nextEventDistance = 980;
    eventEndDistance = -1;
    lastSectorAnnounced = 1;
    setOverlay(false);
    statusEl.textContent = `Avoid red enemies, jump for higher gates, collect violet gates for phase shield. Mode: ${gameModes[gameModeIndex].name}.`;
    syncHud();
  }

  function startRun() {
    if (state === "running") {
      return;
    }
    if (state !== "ready") {
      resetRun();
    }
    state = "running";
    running = true;
    paused = false;
    startedAt = performance.now();
    statusEl.textContent = "Rift drive online. Jump for high gates and use violet phase gates for shield.";
    setOverlay(false);
    syncHud();
  }

  function gameOver() {
    state = "gameover";
    running = false;
    paused = false;
    const finalScore = Math.floor(score + distance * 0.08 + sector * 50);
    score = finalScore;
    if (finalScore > best) {
      best = finalScore;
      window.localStorage.setItem(bestKey, String(best));
    }
    statusEl.textContent = "Hull failure. Press Restart or Play Again.";
    setOverlay(true, "GAME OVER", `Sector ${sector} | Distance ${Math.floor(distance)}m | Score ${finalScore}`);
    syncHud();
  }

  function addParticles(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: (rand() - 0.5) * 280,
        vy: (rand() - 0.5) * 260,
        life: 0.25 + rand() * 0.45,
        color,
      });
    }
  }

  function createObstacle(worldD, laneX, laneW, type) {
    const profile = enemyProfiles[type] || enemyProfiles.drone;
    const diff = getDifficultyScale();
    return {
      d: worldD,
      x: laneX,
      w: laneW,
      type,
      z:
        type === "mine"
          ? 0.04 + rand() * 0.06
          : type === "interceptor"
          ? 0.64 + rand() * 0.18
          : type === "wraith"
          ? 0.26 + rand() * 0.14
          : type === "raider"
          ? 0.12 + rand() * 0.14
          : 0.32 + rand() * 0.2,
      passed: false,
      drift: profile.driftMin + rand() * (profile.driftMax - profile.driftMin),
      freq: profile.freqMin + rand() * (profile.freqMax - profile.freqMin),
      approach: profile.approach * (0.9 + Math.min(0.55, diff * 0.05)),
      chase: profile.chase,
      phase: rand() * Math.PI * 2,
    };
  }

  function getObstacleX(obstacle, rel) {
    const profile = enemyProfiles[obstacle.type] || enemyProfiles.drone;
    if (!obstacle.drift) {
      return obstacle.x;
    }
    const wobble = Math.sin(obstacle.phase + rel * 0.06 + visualClock * obstacle.freq);
    const chaseZone = clamp((260 - rel) / 260, 0, 1);
    const chaseOffset = (playerX - obstacle.x) * profile.chase * chaseZone;
    return clamp(obstacle.x + wobble * obstacle.drift + chaseOffset, -0.9, 0.9);
  }

  function pickHazardType() {
    const pressure = getDifficultyScale();
    const roll = rand();
    if (pressure > 3.8 && roll > 0.87) {
      return "wraith";
    }
    if (pressure > 2.4 && roll > 0.66) {
      return "interceptor";
    }
    if (pressure > 1.6 && roll > 0.52) {
      return "mine";
    }
    if (roll > 0.34) {
      return "drone";
    }
    return "raider";
  }

  function spawnObstaclePattern(startDistance) {
    const pattern = Math.floor(rand() * 4);
    const hazardType = pickHazardType();
    const profile = enemyProfiles[hazardType] || enemyProfiles.drone;
    const laneW = profile.laneW;
    if (pattern === 0) {
      obstacles.push(createObstacle(startDistance, -0.62, laneW + 0.02, hazardType));
      obstacles.push(createObstacle(startDistance, 0.62, laneW + 0.02, hazardType));
    } else if (pattern === 1) {
      obstacles.push(createObstacle(startDistance, 0, hazardType === "mine" ? 0.24 : 0.34, hazardType));
    } else if (pattern === 2) {
      obstacles.push(createObstacle(startDistance, -0.68, laneW + 0.04, hazardType));
      obstacles.push(createObstacle(startDistance + 24, 0.68, laneW + 0.04, hazardType));
    } else {
      const lane = rand() < 0.5 ? -0.72 : 0.72;
      obstacles.push(createObstacle(startDistance, lane, laneW, hazardType));
      obstacles.push(createObstacle(startDistance, 0, laneW, hazardType));
    }
  }

  function inRiftEvent() {
    return eventEndDistance > 0 && distance < eventEndDistance;
  }

  function spawnPickup(distancePoint) {
    const roll = rand();
    const type = roll < 0.52 ? "energy" : roll < 0.76 ? "repair" : roll < 0.94 ? "score" : "phase";
    const z =
      type === "energy"
        ? (rand() < 0.65 ? 0.62 : 0.24) + rand() * 0.12
        : type === "phase"
        ? 0.58 + rand() * 0.24
        : type === "score"
        ? 0.52 + rand() * 0.22
        : 0.2 + rand() * 0.2;
    pickups.push({
      d: distancePoint,
      x: (rand() - 0.5) * 1.2,
      z: clamp(z, 0.06, 0.9),
      type,
      taken: false,
    });
  }

  function getRoadCenter(depthNear) {
    const bend = currentCurve * depthNear * depthNear * 300;
    const sway = Math.sin(visualClock * 0.9 + depthNear * 8) * 18;
    return width * 0.5 + bend + sway - playerX * depthNear * 55;
  }

  function getRoadHalfWidth(depthNear) {
    return 64 + depthNear * 430;
  }

  function projectDistance(worldDistance) {
    const rel = worldDistance - distance;
    if (rel <= 3 || rel >= visibleDepth) {
      return null;
    }
    const depthNear = 1 - rel / visibleDepth;
    const y = 88 + depthNear * depthNear * (height - 96);
    const center = getRoadCenter(depthNear);
    const half = getRoadHalfWidth(depthNear);
    const scale = 0.3 + depthNear * 1.5;
    return { rel, depthNear, y, center, half, scale };
  }

  function handleInput(dt) {
    const left = touchState.left || keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
    const right = touchState.right || keys.has("ArrowRight") || keys.has("d") || keys.has("D");
    const jumping = touchState.boost || keys.has("Shift") || keys.has(" ");

    let steer = 0;
    if (left) {
      steer -= 1;
    }
    if (right) {
      steer += 1;
    }

    playerVX += steer * 8.4 * dt;
    playerVX *= Math.exp(-8.2 * dt);
    playerX += playerVX * dt;
    playerX = clamp(playerX, -1.06, 1.06);

    jumpActive = jumping && energy > 0;
    thrusterHintTimer = Math.max(0, thrusterHintTimer - dt);
    if (jumping && energy <= 0 && thrusterHintTimer <= 0) {
      statusEl.textContent = "Thrusters empty. Collect cyan gates to recharge.";
      thrusterHintTimer = 1.2;
    }

    if (jumpActive && playerZ < 1.2) {
      energy = Math.max(0, energy - 30 * dt);
      playerVZ += 11.5 * dt;
      addParticles(width * 0.5 + playerX * 180, height - 74, 2, "rgba(125,211,252,0.8)");
    } else {
      energy = Math.min(100, energy + gameModes[gameModeIndex].energyRegen * dt);
    }
    playerVZ -= 13.5 * dt;
    playerZ = clamp(playerZ + playerVZ * dt, 0, 1.22);
    if (playerZ <= 0.001 && playerVZ < 0) {
      playerZ = 0;
      playerVZ = 0;
    }

    const jumpSpeedBonus = 0.1 + Math.min(0.16, playerZ * 0.12);
    const targetSpeed = baseSpeed * (1 + playerZ * jumpSpeedBonus);
    speed += (targetSpeed - speed) * Math.min(1, dt * 6);
  }

  function updateCurve(dt) {
    curveTimer -= dt;
    if (curveTimer <= 0) {
      curveTimer = 1.4 + rand() * 1.5;
      targetCurve = (rand() - 0.5) * (0.75 + sector * 0.15 + (inRiftEvent() ? 0.35 : 0));
    }
    currentCurve += (targetCurve - currentCurve) * Math.min(1, dt * 1.3);
    riftPulse = Math.max(0, riftPulse - dt);
  }

  function updateProgress(dt) {
    distance += speed * dt;
    score += speed * dt * 0.42 * scoreMult * gameModes[gameModeIndex].scoreScale;
    sector = getSectorFromDistance(distance);
    baseSpeed = 115 + Math.min(90, (sector - 1) * 6.5);
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer <= 0) {
      scoreMult += (1 - scoreMult) * Math.min(1, dt * 5);
      if (Math.abs(scoreMult - 1) < 0.02) {
        scoreMult = 1;
      }
    }
    if (distance >= nextEventDistance && !inRiftEvent()) {
      eventEndDistance = distance + 360 + rand() * 220;
      nextEventDistance = distance + 900 + rand() * 450;
      riftPulse = 1.2;
      statusEl.textContent = "Rift storm incoming: heavier bends and denser hazards.";
    }
    if (sector > lastSectorAnnounced) {
      lastSectorAnnounced = sector;
      statusEl.textContent = `Sector ${sector} reached. Hazards are getting faster.`;
    }
  }

  function updateSpawns() {
    const rift = inRiftEvent();
    const pressure = getDifficultyScale();
    while (spawnCursor < distance + visibleDepth + 30) {
      spawnObstaclePattern(spawnCursor);
      const baseGap = rift ? 92 : 124;
      const gapDrop = Math.min(58, pressure * 8);
      spawnCursor += (baseGap - gapDrop + rand() * (rift ? 36 : 56)) * gameModes[gameModeIndex].spawnScale;
    }
    while (pickupCursor < distance + visibleDepth + 20) {
      if (rand() < (rift ? 0.62 : 0.82)) {
        spawnPickup(pickupCursor);
      }
      pickupCursor += (rift ? 150 : 124) + rand() * 90;
    }
  }

  function updateWorld(dt) {
    for (const obstacle of obstacles) {
      if (obstacle.passed) {
        continue;
      }
      obstacle.d -= obstacle.approach * dt;
      const rel = obstacle.d - distance;
      if (rel < -18) {
        obstacle.passed = true;
        continue;
      }
      if (rel < 12 && rel > -8) {
        const obstacleX = getObstacleX(obstacle, rel);
        const distX = Math.abs(playerX - obstacleX);
        const profile = enemyProfiles[obstacle.type] || enemyProfiles.drone;
        const enemyBoxHalfWidth = obstacle.w * profile.hitboxFactor;
        const hazardHitbox = enemyBoxHalfWidth * 0.88; // 12% smaller than the enemy red box
        const verticalGap = Math.abs(playerZ - obstacle.z);
        const verticalHit = verticalGap < profile.zHit;
        if (distX < hazardHitbox && verticalHit) {
          obstacle.passed = true;
          if (shieldTimer > 0) {
            shieldTimer = Math.max(0, shieldTimer - 1.1);
            score += 65;
            scoreMult = clamp(scoreMult + 0.08, 1, 3.4);
            comboTimer = 1.8;
            hitPulseTimer = 0.2;
            hitPulseColor = "167,139,250";
            pickupFlashTimer = 0.14;
            pickupFlashColor = "167,139,250";
            addParticles(width * 0.5 + playerX * 120, height - 86, 14, "rgba(167,139,250,0.95)");
            statusEl.textContent = "Phase shield absorbed impact.";
            pulseVibration(10);
          } else {
            integrity -= profile.damage;
            flashTimer = 0.2;
            shakeTimer = 0.26;
            hitPulseTimer = 0.28;
            hitPulseColor = "248,113,133";
            addParticles(width * 0.5 + playerX * 120, height - 86, 18, "rgba(248,113,113,0.9)");
            if (obstacle.type === "wraith") {
              statusEl.textContent = "Wraith impact! Heavy integrity loss.";
            } else if (obstacle.type === "interceptor") {
              statusEl.textContent = "Interceptor clipped you in the air.";
            } else if (obstacle.type === "mine") {
              statusEl.textContent = "Mine detonation!";
            } else if (obstacle.type === "raider") {
              statusEl.textContent = "Raider contact.";
            } else {
              statusEl.textContent = "Impact! Stabilize and keep moving.";
            }
            pulseVibration([22, 30, 40]);
            scoreMult = 1;
            comboTimer = 0;
          }
        } else if (distX < enemyBoxHalfWidth + profile.nearMissPad && rel < -2 && verticalGap < profile.zHit + 0.2) {
          obstacle.passed = true;
          scoreMult = clamp(scoreMult + 0.16, 1, 3.4);
          comboTimer = 2.2;
          score += 28 * scoreMult;
          addParticles(width * 0.5 + playerX * 180, height - 88, 8, "rgba(250,204,21,0.9)");
          if (scoreMult >= 2.2) {
            statusEl.textContent = `Near miss chain x${scoreMult.toFixed(1)}.`;
          }
        }
      }
    }
    obstacles = obstacles.filter((o) => o.d - distance > -40 && !o.passed);

    for (const pickup of pickups) {
      if (pickup.taken) {
        continue;
      }
      const rel = pickup.d - distance;
      if (rel < -18) {
        pickup.taken = true;
        continue;
      }
      if (rel < 12 && rel > -8) {
        const pickupHitbox = pickup.type === "score" ? 0.34 : 0.38;
        const pickupZHit = pickup.type === "score" ? 0.2 : 0.23;
        if (Math.abs(playerX - pickup.x) < pickupHitbox && Math.abs(playerZ - pickup.z) < pickupZHit) {
          pickup.taken = true;
          if (pickup.type === "energy") {
            energy = clamp(energy + 25, 0, 100);
            score += 60;
            addParticles(width * 0.5 + playerX * 120, height - 92, 14, "rgba(34,211,238,0.92)");
            statusEl.textContent = "Thruster energy charged.";
            pickupFlashTimer = 0.16;
            pickupFlashColor = "34,211,238";
          } else if (pickup.type === "repair") {
            integrity = clamp(integrity + 16, 0, 100);
            score += 75;
            addParticles(width * 0.5 + playerX * 120, height - 92, 14, "rgba(74,222,128,0.92)");
            statusEl.textContent = "Repair gate collected.";
            pickupFlashTimer = 0.16;
            pickupFlashColor = "74,222,128";
          } else if (pickup.type === "phase") {
            shieldTimer = Math.min(9.5, shieldTimer + 4.2);
            score += 120;
            addParticles(width * 0.5 + playerX * 120, height - 92, 16, "rgba(167,139,250,0.95)");
            statusEl.textContent = "Phase shield online.";
            pickupFlashTimer = 0.2;
            pickupFlashColor = "167,139,250";
          } else {
            score += 200;
            scoreMult = clamp(scoreMult + 0.12, 1, 3.4);
            comboTimer = 2.6;
            addParticles(width * 0.5 + playerX * 120, height - 92, 16, "rgba(250,204,21,0.95)");
            statusEl.textContent = "Score gate collected.";
            pickupFlashTimer = 0.18;
            pickupFlashColor = "250,204,21";
          }
          hitPulseTimer = 0.2;
          hitPulseColor = pickupFlashColor;
          shakeTimer = Math.max(shakeTimer, 0.08);
          pulseVibration(12);
        }
      }
    }
    pickups = pickups.filter((p) => p.d - distance > -40 && !p.taken);

    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);

    flashTimer = Math.max(0, flashTimer - dt);
    pickupFlashTimer = Math.max(0, pickupFlashTimer - dt);
    shakeTimer = Math.max(0, shakeTimer - dt);
    hitPulseTimer = Math.max(0, hitPulseTimer - dt);
    shieldTimer = Math.max(0, shieldTimer - dt);

    if (integrity <= 0) {
      integrity = 0;
      gameOver();
    }
  }

  function drawBackground() {
    const sectorTint = sector === 1 ? 1 : sector === 2 ? 1.15 : 1.3;
    const rift = inRiftEvent() ? 1 : 0;
    const pulse = 0.4 + 0.6 * Math.sin(visualClock * 1.2 + sector * 0.7);
    const top = ctx.createLinearGradient(0, 0, 0, height);
    top.addColorStop(0, currentTheme.skyTop);
    top.addColorStop(0.45, currentTheme.skyMid);
    top.addColorStop(1, currentTheme.skyBottom);
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, height);
    const bgSprite = sprites[currentTheme.bgSprite];
    if (bgSprite && bgSprite.complete && bgSprite.naturalWidth) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(bgSprite, 0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    const haloA = ctx.createRadialGradient(width * 0.2, height * 0.2, 12, width * 0.2, height * 0.2, 280);
    haloA.addColorStop(0, currentTheme.haloA.replace(/0\.\d+\)/, `${(0.2 + pulse * 0.16).toFixed(2)})`));
    haloA.addColorStop(1, "rgba(56,189,248,0)");
    ctx.fillStyle = haloA;
    ctx.fillRect(0, 0, width, height);

    const haloB = ctx.createRadialGradient(width * 0.78, height * 0.14, 12, width * 0.78, height * 0.14, 260);
    haloB.addColorStop(0, currentTheme.haloB.replace(/0\.\d+\)/, `${(0.18 + pulse * 0.18).toFixed(2)})`));
    haloB.addColorStop(1, "rgba(217,70,239,0)");
    ctx.fillStyle = haloB;
    ctx.fillRect(0, 0, width, height);
    if (inRiftEvent()) {
      ctx.fillStyle = `rgba(217,70,239,${0.04 + riftPulse * 0.08})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function drawStars() {
    for (const star of stars) {
      const drift = (distance * 0.06 * star.s) % width;
      const x = (star.x - drift + width) % width;
      const twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(visualClock * 1.8 + star.p));
      ctx.fillStyle = `rgba(226,232,240,${0.12 + twinkle * 0.65})`;
      ctx.fillRect(x, star.y, star.s, star.s);
      if (jumpActive && star.s > 1.3) {
        ctx.fillStyle = "rgba(165,243,252,0.22)";
        ctx.fillRect(x + 2, star.y, 8 + star.s * 3, 1);
      }
    }
  }

  function drawCanyon() {
    const rows = 95;
    const ys = [];
    const centers = [];
    const halves = [];
    for (let i = 0; i <= rows; i += 1) {
      const d = i / rows;
      ys.push(88 + d * d * (height - 92));
      centers.push(getRoadCenter(d));
      halves.push(getRoadHalfWidth(d));
    }

    for (let i = 0; i < rows; i += 1) {
      const band = i / rows;
      const alpha = 0.08 + band * 0.35;
      const leftColor = `rgba(${currentTheme.leftWall},${alpha * (0.7 + sector * 0.08)})`;
      const rightColor = `rgba(${currentTheme.rightWall},${alpha * (0.65 + sector * 0.08)})`;
      const roadColor = i % 2 === 0 ? `rgba(15,23,42,${0.8 - band * 0.1})` : `rgba(30,41,59,${0.78 - band * 0.1})`;

      const y0 = ys[i];
      const y1 = ys[i + 1];
      const c0 = centers[i];
      const c1 = centers[i + 1];
      const h0 = halves[i];
      const h1 = halves[i + 1];

      ctx.beginPath();
      ctx.moveTo(c0 - h0 * 1.7, y0);
      ctx.lineTo(c0 - h0, y0);
      ctx.lineTo(c1 - h1, y1);
      ctx.lineTo(c1 - h1 * 1.7, y1);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(c0 + h0, y0);
      ctx.lineTo(c0 + h0 * 1.7, y0);
      ctx.lineTo(c1 + h1 * 1.7, y1);
      ctx.lineTo(c1 + h1, y1);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(c0 - h0, y0);
      ctx.lineTo(c0 + h0, y0);
      ctx.lineTo(c1 + h1, y1);
      ctx.lineTo(c1 - h1, y1);
      ctx.closePath();
      ctx.fillStyle = roadColor;
      ctx.fill();

      if (i % 4 === 0) {
        ctx.strokeStyle = `rgba(125,211,252,${0.06 + band * 0.14})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c0 - h0, y0);
        ctx.lineTo(c0 + h0, y0);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "rgba(34,211,238,0.45)";
    ctx.lineWidth = 2;
    for (let lane = -1; lane <= 1; lane += 1) {
      if (lane === 0) {
        continue;
      }
      ctx.beginPath();
      for (let i = 0; i <= rows; i += 1) {
        const x = centers[i] + halves[i] * lane * 0.66;
        const y = ys[i];
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  function drawObstaclesAndPickups() {
    for (const obstacle of obstacles) {
      const proj = projectDistance(obstacle.d);
      if (!proj) {
        continue;
      }
      const profile = enemyProfiles[obstacle.type] || enemyProfiles.drone;
      const movingX = getObstacleX(obstacle, proj.rel);
      const x = proj.center + movingX * proj.half * 0.75;
      const w = proj.scale * 36 + obstacle.w * proj.half * 0.65;
      const h = proj.scale * 44;
      const lift = obstacle.z * (14 + proj.scale * 48);
      const icon = sprites[profile.sprite] || sprites.enemyBug;
      if (icon && icon.complete && icon.naturalWidth) {
        ctx.globalAlpha = 0.9;
        const iconW = w * profile.iconScale;
        const iconH = h * profile.iconScale;
        const iconX = x - iconW * 0.5;
        const iconY = proj.y - h * 0.78 - lift;

        const glow = ctx.createRadialGradient(x, iconY + iconH * 0.45, 2, x, iconY + iconH * 0.45, iconW * 0.8);
        glow.addColorStop(0, "rgba(251,113,133,0.35)");
        glow.addColorStop(1, "rgba(251,113,133,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(iconX - iconW * 0.35, iconY - iconH * 0.25, iconW * 1.7, iconH * 1.55);

        ctx.drawImage(icon, iconX, iconY, iconW, iconH);
        ctx.globalAlpha = 1;
      }
      if (proj.depthNear > 0.75) {
        ctx.fillStyle = "rgba(251,113,133,0.15)";
        ctx.fillRect(x - w * 0.36, proj.y - h * 0.2, w * 0.72, h * 0.18);
      }
    }

    for (const pickup of pickups) {
      const proj = projectDistance(pickup.d);
      if (!proj) {
        continue;
      }
      const x = proj.center + pickup.x * proj.half * 0.75;
      const gateW = proj.scale * 38;
      const gateH = proj.scale * 48;
      const lift = pickup.z * (16 + proj.scale * 52);
      const gateTopY = proj.y - gateH - lift;
      const pulse = 0.6 + 0.4 * Math.sin(visualClock * 6 + pickup.d * 0.02);
      const colorMap = {
        energy: `rgba(34,211,238,${0.6 + pulse * 0.35})`,
        repair: `rgba(74,222,128,${0.6 + pulse * 0.35})`,
        score: `rgba(250,204,21,${0.6 + pulse * 0.35})`,
        phase: `rgba(167,139,250,${0.6 + pulse * 0.35})`,
      };
      const fillMap = {
        energy: `rgba(34,211,238,${0.1 + pulse * 0.16})`,
        repair: `rgba(74,222,128,${0.1 + pulse * 0.16})`,
        score: `rgba(250,204,21,${0.12 + pulse * 0.17})`,
        phase: `rgba(167,139,250,${0.12 + pulse * 0.17})`,
      };
      ctx.strokeStyle = colorMap[pickup.type] || colorMap.energy;
      ctx.lineWidth = Math.max(1.2, proj.scale * 2.4);
      ctx.strokeRect(x - gateW * 0.5, gateTopY, gateW, gateH);
      ctx.fillStyle = fillMap[pickup.type] || fillMap.energy;
      ctx.fillRect(x - gateW * 0.5, gateTopY, gateW, gateH);
      ctx.beginPath();
      ctx.arc(x, gateTopY + gateH * 0.45, gateW * 0.18, 0, Math.PI * 2);
      ctx.fillStyle =
        pickup.type === "repair"
          ? "rgba(187,247,208,0.95)"
          : pickup.type === "score"
          ? "rgba(254,240,138,0.95)"
          : pickup.type === "phase"
          ? "rgba(221,214,254,0.95)"
          : "rgba(165,243,252,0.95)";
      ctx.fill();
      const pickupIcon =
        pickup.type === "repair"
          ? sprites.pickupShield
          : pickup.type === "score"
          ? sprites.pickupCoins
          : pickup.type === "phase"
          ? sprites.pickupPhase
          : sprites.pickupEnergy;
      if (pickupIcon && pickupIcon.complete && pickupIcon.naturalWidth) {
        ctx.globalAlpha = 0.95;
        ctx.drawImage(pickupIcon, x - gateW * 0.18, gateTopY + gateH * 0.26, gateW * 0.36, gateH * 0.36);
        ctx.globalAlpha = 1;
      }
      if (proj.depthNear > 0.35) {
        ctx.fillStyle =
          pickup.type === "repair"
            ? "rgba(187,247,208,0.95)"
            : pickup.type === "score"
            ? "rgba(254,240,138,0.95)"
            : pickup.type === "phase"
            ? "rgba(221,214,254,0.95)"
            : "rgba(165,243,252,0.95)";
        ctx.font = `700 ${Math.max(9, proj.scale * 9)}px Space Grotesk, sans-serif`;
        ctx.textAlign = "center";
        const text =
          pickup.type === "repair" ? "+REPAIR" : pickup.type === "score" ? "+SCORE" : pickup.type === "phase" ? "+PHASE" : "+ENERGY";
        ctx.fillText(text, x, gateTopY - 4);
      }
    }
    ctx.textAlign = "start";
  }

  function drawPlayer() {
    const near = 0.985;
    const center = getRoadCenter(near);
    const half = getRoadHalfWidth(near);
    const x = center + playerX * half * 0.74;
    const baseY = height - 82;
    const y = baseY - playerZ * 88;
    const widthShip = 46;
    const heightShip = 24;

    if (sprites.player && sprites.player.complete && sprites.player.naturalWidth) {
      const glow = ctx.createRadialGradient(x, y, 4, x, y, widthShip * 1.4);
      glow.addColorStop(0, "rgba(125,211,252,0.45)");
      glow.addColorStop(1, "rgba(125,211,252,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - widthShip * 1.5, y - heightShip * 1.6, widthShip * 3, heightShip * 3);
      if (hitPulseTimer > 0) {
        const duration = hitPulseColor === "248,113,133" ? 0.28 : 0.2;
        const ring = Math.max(0, Math.min(1, hitPulseTimer / duration));
        ctx.beginPath();
        ctx.arc(x, y + 2, widthShip * (0.7 + (1 - ring) * 0.7), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${hitPulseColor},${0.55 * ring})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      ctx.globalAlpha = 0.95;
      ctx.drawImage(sprites.player, x - widthShip * 0.8, y - heightShip * 1.05, widthShip * 1.6, heightShip * 1.9);
      ctx.globalAlpha = 1;
    } else {
      const core = ctx.createLinearGradient(x - widthShip, y, x + widthShip, y);
      core.addColorStop(0, "rgba(56,189,248,0.95)");
      core.addColorStop(1, "rgba(217,70,239,0.95)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.moveTo(x - widthShip * 0.7, y + heightShip * 0.32);
      ctx.lineTo(x - widthShip * 0.25, y - heightShip * 0.4);
      ctx.lineTo(x + widthShip * 0.58, y - heightShip * 0.15);
      ctx.lineTo(x + widthShip * 0.78, y + heightShip * 0.36);
      ctx.closePath();
      ctx.fill();
    }

    const trailLen = 24 + (speed - baseSpeed) * 0.5;
    ctx.fillStyle = "rgba(15,23,42,0.4)";
    ctx.beginPath();
    ctx.ellipse(x, baseY + 8, widthShip * (0.55 + playerZ * 0.1), heightShip * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(103,232,249,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - widthShip * 0.68, y + heightShip * 0.3);
    ctx.lineTo(x - widthShip * 0.68 - trailLen, y + heightShip * 0.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + widthShip * 0.72, y + heightShip * 0.33);
    ctx.lineTo(x + widthShip * 0.72 - trailLen, y + heightShip * 0.43);
    ctx.stroke();
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, particle.life * 2));
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawCockpitHud() {
    const panelX = 14;
    const panelY = 14;
    const panelW = 320;
    const panelH = 128;
    ctx.fillStyle = "rgba(2,6,23,0.56)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "rgba(148,163,184,0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    const labelColor = "rgba(226,232,240,0.92)";
    ctx.fillStyle = labelColor;
    ctx.font = "700 12px Space Grotesk, sans-serif";
    ctx.fillText("INTEGRITY", panelX + 12, panelY + 21);
    ctx.fillText("ENERGY", panelX + 12, panelY + 54);
    ctx.fillText("PHASE", panelX + 12, panelY + 87);

    const barX = panelX + 92;
    const barW = 208;
    const barH = 12;
    const integrityRatio = clamp(integrity / 100, 0, 1);
    const energyRatio = clamp(energy / 100, 0, 1);

    ctx.fillStyle = "rgba(15,23,42,0.88)";
    ctx.fillRect(barX, panelY + 11, barW, barH);
    ctx.fillRect(barX, panelY + 44, barW, barH);
    ctx.fillRect(barX, panelY + 77, barW, barH);

    ctx.fillStyle = integrityRatio < 0.35 ? "rgba(248,113,113,0.95)" : "rgba(74,222,128,0.95)";
    ctx.fillRect(barX, panelY + 11, barW * integrityRatio, barH);
    ctx.fillStyle = energyRatio < 0.25 ? "rgba(251,191,36,0.95)" : "rgba(34,211,238,0.95)";
    ctx.fillRect(barX, panelY + 44, barW * energyRatio, barH);
    const phaseRatio = clamp(shieldTimer / 8, 0, 1);
    ctx.fillStyle = phaseRatio > 0 ? "rgba(167,139,250,0.95)" : "rgba(100,116,139,0.55)";
    ctx.fillRect(barX, panelY + 77, barW * phaseRatio, barH);

    ctx.fillStyle = "rgba(248,250,252,0.95)";
    ctx.font = "700 11px Space Grotesk, sans-serif";
    ctx.fillText(`${Math.round(integrity)}%`, barX + barW - 38, panelY + 21);
    ctx.fillText(`${Math.round(energy)}%`, barX + barW - 38, panelY + 54);
    ctx.fillText(`${shieldTimer > 0 ? `${shieldTimer.toFixed(1)}s` : "OFF"}`, barX + barW - 38, panelY + 87);

    const infoX = panelX + 12;
    const infoY = panelY + 111;
    ctx.fillStyle = "rgba(191,219,254,0.95)";
    ctx.font = "700 11px Space Grotesk, sans-serif";
    ctx.fillText(`S${sector}  MUL x${scoreMult.toFixed(1)}  SPD ${Math.round(speed)}`, infoX, infoY);

    const tipW = 255;
    const tipH = 32;
    const tipX = width - tipW - 14;
    const tipY = 14;
    ctx.fillStyle = "rgba(2,6,23,0.48)";
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = "rgba(148,163,184,0.32)";
    ctx.strokeRect(tipX, tipY, tipW, tipH);
    ctx.fillStyle = "rgba(226,232,240,0.92)";
    ctx.font = "700 10px Space Grotesk, sans-serif";
    ctx.fillText("SHIFT/SPACE = jump thrusters", tipX + 10, tipY + 20);
    if (jumpActive || playerZ > 0.05) {
      ctx.fillStyle = "rgba(56,189,248,0.86)";
      ctx.fillRect(tipX, tipY + tipH + 6, tipW, 20);
      ctx.fillStyle = "rgba(2,6,23,0.95)";
      ctx.font = "700 11px Space Grotesk, sans-serif";
      ctx.fillText(`AIRBORNE: ${Math.round(playerZ * 100)}% LIFT`, tipX + 8, tipY + tipH + 20);
    }

    const danger = obstacles.some((o) => {
      const rel = o.d - distance;
      const xGap = Math.abs(playerX - getObstacleX(o, rel));
      const zGap = Math.abs(playerZ - o.z);
      const p = enemyProfiles[o.type] || enemyProfiles.drone;
      return rel > 22 && rel < 80 && xGap < 0.26 && zGap < p.zHit + 0.2;
    });
    if (danger) {
      ctx.fillStyle = "rgba(248,113,113,0.92)";
      ctx.font = "700 12px Space Grotesk, sans-serif";
      ctx.fillText("INCOMING THREAT", tipX + 106, tipY + tipH + 44);
      ctx.fillText("< < <", tipX + 12, tipY + tipH + 44);
      ctx.fillText("> > >", tipX + tipW - 44, tipY + tipH + 44);
    }
  }

  function drawReadyOverlay() {
    if (state !== "ready" || running) {
      return;
    }
    const boxW = 520;
    const boxH = 154;
    const boxX = Math.round((width - boxW) / 2);
    const boxY = Math.round(height * 0.56 - boxH / 2);
    ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "rgba(248, 250, 252, 0.98)";
    ctx.font = "700 20px Space Grotesk, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Neon Rift Rally", width / 2, boxY + 34);

    ctx.font = "700 13px Space Grotesk, sans-serif";
    ctx.fillStyle = "rgba(191, 219, 254, 0.95)";
    ctx.fillText("Click the canvas to start", width / 2, boxY + 60);

    ctx.font = "600 12px Space Grotesk, sans-serif";
    ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
    ctx.fillText("A/D or Left/Right: steer", width / 2, boxY + 86);
    ctx.fillText("Hold Shift or Space: JUMP THRUSTERS", width / 2, boxY + 104);
    ctx.fillText("Use jump for high gates. Violet gates grant phase shield.", width / 2, boxY + 122);
    ctx.fillText("No finish line: survive as long as you can", width / 2, boxY + 140);
    ctx.textAlign = "start";
  }

  function drawEffects() {
    if (flashTimer > 0) {
      const a = flashTimer / 0.2;
      ctx.fillStyle = `rgba(248,113,113,${0.18 * a})`;
      ctx.fillRect(0, 0, width, height);
    }
    if (pickupFlashTimer > 0) {
      const duration = pickupFlashColor === "250,204,21" ? 0.18 : 0.16;
      const a = pickupFlashTimer / duration;
      ctx.fillStyle = `rgba(${pickupFlashColor},${0.11 * a})`;
      ctx.fillRect(0, 0, width, height);
    }
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.55, 160, width * 0.5, height * 0.55, 640);
    vignette.addColorStop(0, "rgba(2,6,23,0)");
    vignette.addColorStop(1, "rgba(2,6,23,0.34)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    if (jumpActive || playerZ > 0.05) {
      ctx.fillStyle = "rgba(56,189,248,0.06)";
      ctx.fillRect(0, 0, width, height);
    }
    if (inRiftEvent()) {
      const stormPulse = 0.5 + 0.5 * Math.sin(visualClock * 9);
      ctx.fillStyle = `rgba(217,70,239,${0.04 + stormPulse * 0.08})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = "rgba(148,163,184,0.05)";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y + ((visualClock * 10) % 4));
      ctx.lineTo(width, y + ((visualClock * 10) % 4));
      ctx.stroke();
    }
  }

  function render() {
    ctx.save();
    if (shakeTimer > 0) {
      const mag = 3.4 * (shakeTimer / 0.26);
      ctx.translate((rand() - 0.5) * mag, (rand() - 0.5) * mag);
    }
    drawBackground();
    drawStars();
    drawCanyon();
    drawObstaclesAndPickups();
    drawPlayer();
    drawParticles();
    drawCockpitHud();
    drawReadyOverlay();
    drawEffects();
    ctx.restore();
  }

  function tick(ts) {
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    visualClock = ts * 0.001;

    if (running && state === "running" && !paused) {
      handleInput(dt);
      updateCurve(dt);
      updateProgress(dt);
      updateSpawns();
      updateWorld(dt);
      syncHud();
    }

    render();
    rafId = window.requestAnimationFrame(tick);
  }

  function onKeyDown(event) {
    keys.add(event.key);
    if (event.key === "p" || event.key === "P") {
      if (!running || state !== "running") {
        return;
      }
      paused = !paused;
      statusEl.textContent = paused ? "Paused." : "Resumed.";
      syncHud();
    }
    if (event.key === "r" || event.key === "R") {
      resetRun();
    }
    if (event.key === "Enter" && state !== "running") {
      startRun();
    }
  }

  function onKeyUp(event) {
    keys.delete(event.key);
  }

  startBtn.addEventListener("click", function () {
    startRun();
  });
  canvas.addEventListener("click", function () {
    if (state !== "running") {
      startRun();
    }
  });
  canvas.addEventListener(
    "touchstart",
    function (event) {
      if (state !== "running") {
        event.preventDefault();
        startRun();
      }
    },
    { passive: false }
  );

  pauseBtn.addEventListener("click", function () {
    if (!running || state !== "running") {
      return;
    }
    paused = !paused;
    statusEl.textContent = paused ? "Paused." : "Resumed.";
    syncHud();
  });

  restartBtn.addEventListener("click", function () {
    resetRun();
  });
  if (modeBtn) {
    modeBtn.addEventListener("click", function () {
      gameModeIndex = (gameModeIndex + 1) % gameModes.length;
      statusEl.textContent = `Mode switched to ${gameModes[gameModeIndex].name}.`;
      syncHud();
    });
  }

  if (seedEl) {
    seedEl.addEventListener("change", function () {
      setSeed(seedEl.value);
      statusEl.textContent = `Seed set to ${seed}. Press Start Run.`;
    });
  }
  if (dailyBtn) {
    dailyBtn.addEventListener("click", function () {
      setSeed(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
      statusEl.textContent = `Daily seed loaded: ${seed}.`;
    });
  }

  playAgainBtn.addEventListener("click", function () {
    resetRun();
    startRun();
  });

  if (touchEl) {
    const mapButtonAct = function (act, down) {
      if (act === "left") {
        touchState.left = down;
      } else if (act === "right") {
        touchState.right = down;
      } else if (act === "boost") {
        touchState.boost = down;
      }
    };
    touchEl.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("touchstart", function (event) {
        event.preventDefault();
        mapButtonAct(btn.dataset.act, true);
      }, { passive: false });
      btn.addEventListener("touchend", function () {
        mapButtonAct(btn.dataset.act, false);
      });
      btn.addEventListener("mousedown", function () {
        mapButtonAct(btn.dataset.act, true);
      });
      btn.addEventListener("mouseup", function () {
        mapButtonAct(btn.dataset.act, false);
      });
      btn.addEventListener("mouseleave", function () {
        mapButtonAct(btn.dataset.act, false);
      });
    });
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  setSeed(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  loadSprites();
  resetRun();
  lastTs = performance.now();
  rafId = window.requestAnimationFrame(tick);

  return function cleanup() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(neonRiftRallyGame);
