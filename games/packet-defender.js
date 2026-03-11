const packetDefenderGame = {
  id: "packet-defender",
  title: "Path Guardians TD",
  description: "Canvas tower defense with tower classes, pathing enemies, and escalating waves.",
  difficulty: "Planning and timing",
  setup: setupPacketDefender,
};

function setupPacketDefender(container) {
  const width = 1120;
  const height = 620;
  const maxWaves = 15;
  const baseStartGold = 220;
  const baseStartLives = 20;

  const difficultyDefs = {
    casual: { label: "Casual", enemyHp: 0.86, enemySpeed: 0.92, enemyArmor: 0.9, reward: 1.08, startGold: 260, startLives: 24 },
    normal: { label: "Normal", enemyHp: 1, enemySpeed: 1, enemyArmor: 1, reward: 1, startGold: 220, startLives: 20 },
    hard: { label: "Hard", enemyHp: 1.2, enemySpeed: 1.1, enemyArmor: 1.1, reward: 0.92, startGold: 190, startLives: 17 },
  };

  const towerTypes = {
    arrow: {
      id: "arrow",
      name: "Arrow",
      cost: 70,
      color: "#38bdf8",
      range: 172,
      cooldown: 0.48,
      damage: 16,
      projectileSpeed: 500,
      projectileColor: "#bae6fd",
      splash: 0,
      slowMult: 1,
      slowDuration: 0,
    },
    cannon: {
      id: "cannon",
      name: "Cannon",
      cost: 110,
      color: "#f97316",
      range: 145,
      cooldown: 1.25,
      damage: 36,
      projectileSpeed: 340,
      projectileColor: "#fdba74",
      splash: 52,
      slowMult: 1,
      slowDuration: 0,
    },
    frost: {
      id: "frost",
      name: "Frost",
      cost: 95,
      color: "#22d3ee",
      range: 155,
      cooldown: 0.72,
      damage: 9,
      projectileSpeed: 390,
      projectileColor: "#67e8f9",
      splash: 0,
      slowMult: 0.5,
      slowDuration: 1.7,
    },
    sniper: {
      id: "sniper",
      name: "Sniper",
      cost: 130,
      color: "#a78bfa",
      range: 255,
      cooldown: 1.5,
      damage: 64,
      projectileSpeed: 720,
      projectileColor: "#ddd6fe",
      splash: 0,
      slowMult: 1,
      slowDuration: 0,
    },
    ember: {
      id: "ember",
      name: "Ember",
      cost: 120,
      color: "#fb7185",
      range: 162,
      cooldown: 0.98,
      damage: 22,
      projectileSpeed: 420,
      projectileColor: "#fda4af",
      splash: 34,
      slowMult: 1,
      slowDuration: 0,
    },
  };

  const enemyArchetypes = {
    scout: { name: "Scout", hpMult: 0.68, speedMult: 1.38, rewardMult: 0.85, radius: 9, armor: 0 },
    raider: { name: "Raider", hpMult: 1, speedMult: 1, rewardMult: 1, radius: 11, armor: 0 },
    brute: { name: "Brute", hpMult: 1.95, speedMult: 0.72, rewardMult: 1.45, radius: 14, armor: 0.18 },
    swarm: { name: "Swarm", hpMult: 0.45, speedMult: 1.18, rewardMult: 0.58, radius: 7, armor: 0 },
    jammer: {
      name: "Jammer",
      hpMult: 1.15,
      speedMult: 0.92,
      rewardMult: 1.25,
      radius: 12,
      armor: 0.06,
      freezeRadius: 95,
      freezeDuration: 1.2,
      abilityCooldown: 4.6,
    },
    warden: {
      name: "Warden",
      hpMult: 1.4,
      speedMult: 0.95,
      rewardMult: 1.2,
      radius: 12,
      armor: 0.1,
      shield: 34,
    },
    mender: {
      name: "Mender",
      hpMult: 1.05,
      speedMult: 0.88,
      rewardMult: 1.18,
      radius: 11,
      armor: 0.05,
      healRadius: 86,
      healAmount: 14,
      abilityCooldown: 4.2,
    },
    splitter: {
      name: "Splitter",
      hpMult: 0.95,
      speedMult: 1.02,
      rewardMult: 1.12,
      radius: 11,
      armor: 0.05,
      splitCount: 2,
    },
    specter: {
      name: "Specter",
      hpMult: 0.82,
      speedMult: 1.2,
      rewardMult: 1.16,
      radius: 10,
      armor: 0,
      stealthDuration: 2.7,
      stealthCooldown: 4.6,
    },
    juggernaut: {
      name: "Juggernaut",
      hpMult: 4.6,
      speedMult: 0.58,
      rewardMult: 2.7,
      radius: 18,
      armor: 0.28,
      shield: 60,
    },
  };

  const pathPoints = [
    { x: -40, y: 318 },
    { x: 120, y: 318 },
    { x: 250, y: 184 },
    { x: 420, y: 184 },
    { x: 560, y: 410 },
    { x: 730, y: 410 },
    { x: 860, y: 250 },
    { x: 1020, y: 250 },
    { x: 1160, y: 250 },
  ];
  const altPathPoints = [
    { x: -40, y: 320 },
    { x: 120, y: 320 },
    { x: 260, y: 420 },
    { x: 430, y: 420 },
    { x: 560, y: 210 },
    { x: 730, y: 210 },
    { x: 860, y: 360 },
    { x: 1020, y: 360 },
    { x: 1160, y: 360 },
  ];
  const canyonMainPath = [
    { x: -40, y: 242 },
    { x: 120, y: 242 },
    { x: 260, y: 150 },
    { x: 450, y: 150 },
    { x: 610, y: 332 },
    { x: 790, y: 332 },
    { x: 960, y: 200 },
    { x: 1160, y: 200 },
  ];
  const canyonAltPath = [
    { x: -40, y: 386 },
    { x: 140, y: 386 },
    { x: 300, y: 500 },
    { x: 520, y: 500 },
    { x: 680, y: 286 },
    { x: 860, y: 286 },
    { x: 1040, y: 424 },
    { x: 1160, y: 424 },
  ];
  const mapDefs = {
    estuary: { label: "Estuary", routes: [pathPoints, altPathPoints] },
    canyon: { label: "Canyon", routes: [canyonMainPath, canyonAltPath] },
  };
  let selectedMap = "estuary";
  let activeRoutes = mapDefs[selectedMap].routes;
  const roadHalfWidth = 26;
  const towerRadius = 16;
  const towerMinDistance = 22;

  const root = document.createElement("div");
  root.className = "lab-game";
  root.innerHTML = `
    <div class="hud">
      <div class="hud-item"><strong>Lives</strong><div id="pd-lives">${baseStartLives}</div></div>
      <div class="hud-item"><strong>Gold</strong><div id="pd-gold">${baseStartGold}</div></div>
      <div class="hud-item"><strong>Wave</strong><div id="pd-wave">0 / ${maxWaves}</div></div>
      <div class="hud-item"><strong>Enemies</strong><div id="pd-enemies">0</div></div>
      <div class="hud-item"><strong>Kills</strong><div id="pd-kills">0</div></div>
    </div>
    <div class="action-row">
      <button type="button" id="pd-start" class="btn primary">Start Wave</button>
      <button type="button" id="pd-pause" class="btn ghost">Pause</button>
      <button type="button" id="pd-reset" class="btn ghost">Reset Run</button>
      <label class="bb-level-picker-label" for="pd-difficulty">Difficulty</label>
      <select id="pd-difficulty" class="bb-level-picker"></select>
      <label class="bb-level-picker-label" for="pd-speed">Speed</label>
      <select id="pd-speed" class="bb-level-picker">
        <option value="1">1x</option>
        <option value="2">2x</option>
        <option value="3">3x</option>
      </select>
      <label class="bb-level-picker-label" for="pd-branch">Upgrade Path</label>
      <select id="pd-branch" class="bb-level-picker">
        <option value="power">Power</option>
        <option value="control">Control</option>
      </select>
      <label class="bb-level-picker-label" for="pd-map">Map</label>
      <select id="pd-map" class="bb-level-picker"></select>
      <label class="bb-level-picker-label" for="pd-seed">Seed</label>
      <input id="pd-seed" class="bb-level-picker" style="width:110px" value="" />
      <button type="button" id="pd-daily" class="btn ghost">Daily</button>
    </div>
    <div class="action-row">
      <button type="button" id="pd-emp" class="btn ghost">EMP</button>
      <button type="button" id="pd-meteor" class="btn ghost">Meteor</button>
      <button type="button" id="pd-overclock" class="btn ghost">Overclock</button>
    </div>
    <div class="choice-grid" id="pd-tower-picker"></div>
    <p class="status" id="pd-status">Select a tower and place it on the field. Do not place over the road or another tower.</p>
    <p class="status" id="pd-combat">Damage dealt: 0 | Best tower: -</p>
    <div class="bb-canvas-wrap">
      <canvas class="bb-canvas" id="pd-canvas" width="${width}" height="${height}"></canvas>
    </div>
  `;
  container.appendChild(root);

  const canvas = root.querySelector("#pd-canvas");
  const ctx = canvas.getContext("2d");
  const livesEl = root.querySelector("#pd-lives");
  const goldEl = root.querySelector("#pd-gold");
  const waveEl = root.querySelector("#pd-wave");
  const enemiesEl = root.querySelector("#pd-enemies");
  const killsEl = root.querySelector("#pd-kills");
  const startBtn = root.querySelector("#pd-start");
  const pauseBtn = root.querySelector("#pd-pause");
  const resetBtn = root.querySelector("#pd-reset");
  const difficultyEl = root.querySelector("#pd-difficulty");
  const speedEl = root.querySelector("#pd-speed");
  const branchEl = root.querySelector("#pd-branch");
  const mapEl = root.querySelector("#pd-map");
  const seedEl = root.querySelector("#pd-seed");
  const dailyBtn = root.querySelector("#pd-daily");
  const empBtn = root.querySelector("#pd-emp");
  const meteorBtn = root.querySelector("#pd-meteor");
  const overclockBtn = root.querySelector("#pd-overclock");
  const statusEl = root.querySelector("#pd-status");
  const combatEl = root.querySelector("#pd-combat");
  const towerPickerEl = root.querySelector("#pd-tower-picker");

  let selectedDifficulty = "normal";
  let difficulty = difficultyDefs[selectedDifficulty];
  let gameSpeed = 1;
  let selectedUpgradeBranch = "power";
  let selectedAbility = null;
  let abilityCooldowns = { emp: 0, meteor: 0, overclock: 0 };
  let overclockTimer = 0;
  let selectedSeed = String(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  let rngState = 1;
  let lives = difficulty.startLives;
  let gold = difficulty.startGold;
  let wave = 0;
  let kills = 0;
  let selectedTower = "arrow";
  const hasMousePointer =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    (window.matchMedia("(pointer: fine)").matches || window.matchMedia("(any-pointer: fine)").matches);
  const useDragPlacement = !!hasMousePointer;
  let paused = false;
  let running = true;
  let rafId = null;
  let lastTs = performance.now();
  let visualClock = 0;
  let enemyIdSeq = 1;
  let towerIdSeq = 1;

  let towers = [];
  let enemies = [];
  let projectiles = [];
  let particles = [];
  let spawnQueue = null;
  let waveIntel = null;
  let interWaveCountdown = 0;
  const clearedWaveBonus = new Set();
  let hoveredTowerId = null;
  let totalDamageDealt = 0;
  let firstSeenEnemyKinds = new Set();
  let endRunSummary = null;
  let hoverPlacement = { x: 0, y: 0, inCanvas: false };
  let dragState = {
    active: false,
    towerType: null,
    clientX: 0,
    clientY: 0,
    x: 0,
    y: 0,
    valid: false,
    reason: "",
    inCanvas: false,
  };

  function syncHud() {
    livesEl.textContent = String(lives);
    goldEl.textContent = String(Math.floor(gold));
    waveEl.textContent = `${wave} / ${maxWaves}`;
    enemiesEl.textContent = String(enemies.length + (spawnQueue ? spawnQueue.remaining : 0));
    killsEl.textContent = String(kills);
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    if (difficultyEl) {
      difficultyEl.value = selectedDifficulty;
    }
    if (speedEl) {
      speedEl.value = String(gameSpeed);
    }
    if (branchEl) {
      branchEl.value = selectedUpgradeBranch;
    }
    if (mapEl) {
      mapEl.value = selectedMap;
    }
    if (seedEl && seedEl !== document.activeElement) {
      seedEl.value = selectedSeed;
    }
    if (empBtn) {
      empBtn.textContent = abilityCooldowns.emp > 0 ? `EMP ${abilityCooldowns.emp.toFixed(1)}s` : "EMP";
      empBtn.classList.toggle("active", selectedAbility === "emp");
    }
    if (meteorBtn) {
      meteorBtn.textContent = abilityCooldowns.meteor > 0 ? `Meteor ${abilityCooldowns.meteor.toFixed(1)}s` : "Meteor";
      meteorBtn.classList.toggle("active", selectedAbility === "meteor");
    }
    if (overclockBtn) {
      overclockBtn.textContent = abilityCooldowns.overclock > 0 ? `Overclock ${abilityCooldowns.overclock.toFixed(1)}s` : "Overclock";
      overclockBtn.classList.toggle("active", selectedAbility === "overclock");
    }
    if (combatEl) {
      const bestLabel = getBestTowerLabel();
      combatEl.textContent = `Damage dealt: ${Math.round(totalDamageDealt)} | Best tower: ${bestLabel}`;
    }
  }

  function getBestTowerLabel() {
    let best = null;
    for (const tower of towers) {
      if (!best || tower.totalDamage > best.totalDamage) {
        best = tower;
      }
    }
    return best ? `${towerTypes[best.type].name} (${Math.round(best.totalDamage)})` : "-";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function getPlacementHint() {
    if (useDragPlacement) {
      return "Select a tower, then drag from the tower button to the field to place it. Do not place over the road or another tower.";
    }
    return "Tap a tower button, then tap the field to place it. Tap the selected tower button again to unselect and upgrade existing towers.";
  }

  function hashSeed(text) {
    let h = 2166136261 >>> 0;
    const s = String(text || "1");
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) || 1;
  }

  function rand() {
    rngState ^= rngState << 13;
    rngState ^= rngState >>> 17;
    rngState ^= rngState << 5;
    return ((rngState >>> 0) % 1000000) / 1000000;
  }

  function populateDifficultyOptions() {
    if (!difficultyEl) {
      return;
    }
    difficultyEl.innerHTML = "";
    for (const key of Object.keys(difficultyDefs)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = difficultyDefs[key].label;
      if (key === selectedDifficulty) {
        opt.selected = true;
      }
      difficultyEl.appendChild(opt);
    }
  }

  function populateMapOptions() {
    if (!mapEl) {
      return;
    }
    mapEl.innerHTML = "";
    for (const key of Object.keys(mapDefs)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = mapDefs[key].label;
      if (key === selectedMap) {
        opt.selected = true;
      }
      mapEl.appendChild(opt);
    }
  }

  function getDifficultyTuning() {
    if (selectedDifficulty === "casual") {
      return {
        waveCount: 0.9,
        waveHp: 0.9,
        waveSpeed: 0.94,
        waveReward: 1.12,
        waveInterval: 1.08,
        clearBonus: 1.2,
        interestCap: 55,
        abilityCd: 0.9,
      };
    }
    if (selectedDifficulty === "hard") {
      return {
        waveCount: 1.15,
        waveHp: 1.18,
        waveSpeed: 1.08,
        waveReward: 0.92,
        waveInterval: 0.92,
        clearBonus: 0.88,
        interestCap: 28,
        abilityCd: 1.1,
      };
    }
    return {
      waveCount: 1,
      waveHp: 1,
      waveSpeed: 1,
      waveReward: 1,
      waveInterval: 1,
      clearBonus: 1,
      interestCap: 40,
      abilityCd: 1,
    };
  }

  function distance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.hypot(dx, dy);
  }

  function pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const ab2 = abx * abx + aby * aby || 1;
    const apx = px - ax;
    const apy = py - ay;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return distance(px, py, cx, cy);
  }

  function isOnRoad(x, y) {
    for (const route of activeRoutes) {
      for (let i = 0; i < route.length - 1; i += 1) {
        const a = route[i];
        const b = route[i + 1];
        if (pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y) <= roadHalfWidth + towerRadius + 2) {
          return true;
        }
      }
    }
    return false;
  }

  function canPlaceTowerAt(x, y) {
    if (x < towerRadius + 6 || x > width - towerRadius - 6 || y < towerRadius + 6 || y > height - towerRadius - 6) {
      return { ok: false, reason: "Out of bounds." };
    }
    if (isOnRoad(x, y)) {
      return { ok: false, reason: "Cannot place on the road." };
    }
    for (const tower of towers) {
      if (distance(x, y, tower.x, tower.y) < towerMinDistance) {
        return { ok: false, reason: "Too close to another tower." };
      }
    }
    return { ok: true, reason: "" };
  }

  function findNearestValidPlacement(x, y) {
    const direct = canPlaceTowerAt(x, y);
    if (direct.ok) {
      return { x, y, adjusted: false };
    }

    const maxRadius = 160;
    const radiusStep = 8;
    for (let r = radiusStep; r <= maxRadius; r += radiusStep) {
      const samples = Math.max(16, Math.ceil((Math.PI * 2 * r) / 12));
      for (let i = 0; i < samples; i += 1) {
        const ang = (Math.PI * 2 * i) / samples;
        const cx = x + Math.cos(ang) * r;
        const cy = y + Math.sin(ang) * r;
        const check = canPlaceTowerAt(cx, cy);
        if (check.ok) {
          return { x: cx, y: cy, adjusted: true };
        }
      }
    }
    return null;
  }

  function clientToCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
      inCanvas: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom,
    };
  }

  function pickWeightedArchetype(pool) {
    const total = pool.reduce((acc, item) => acc + item.weight, 0);
    let roll = rand() * total;
    for (const item of pool) {
      roll -= item.weight;
      if (roll <= 0) {
        return item.kind;
      }
    }
    return pool[pool.length - 1].kind;
  }

  function spawnEnemy(stats) {
    const archetype = enemyArchetypes[stats.kind] || enemyArchetypes.raider;
    const hp = Math.max(8, Math.round(stats.hp * archetype.hpMult * difficulty.enemyHp));
    const speed = Math.max(18, stats.speed * archetype.speedMult);
    const reward = Math.max(1, Math.round(stats.reward * archetype.rewardMult * difficulty.reward));
    const armor = Math.max(0, (archetype.armor || 0) * difficulty.enemyArmor);
    const route = rand() < 0.5 ? activeRoutes[0] : activeRoutes[1];
    enemies.push({
      id: enemyIdSeq += 1,
      x: route[0].x,
      y: route[0].y,
      pathIndex: 0,
      speed: speed * difficulty.enemySpeed,
      baseSpeed: speed * difficulty.enemySpeed,
      hp,
      maxHp: hp,
      reward,
      radius: archetype.radius,
      armor,
      kind: stats.kind,
      route,
      freezeRadius: archetype.freezeRadius || 0,
      freezeDuration: archetype.freezeDuration || 0,
      abilityTimer: archetype.abilityCooldown || 0,
      abilityCooldown: archetype.abilityCooldown || 0,
      healRadius: archetype.healRadius || 0,
      healAmount: archetype.healAmount || 0,
      splitCount: archetype.splitCount || 0,
      stealthTimer: 0,
      stealthDuration: archetype.stealthDuration || 0,
      stealthCooldown: archetype.stealthCooldown || 0,
      shield: archetype.shield || 0,
      burnStacks: 0,
      burnTimer: 0,
      frostMarkTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      slowMult: 1,
      progress: 0,
    });

    if (!firstSeenEnemyKinds.has(stats.kind)) {
      firstSeenEnemyKinds.add(stats.kind);
      if (stats.kind === "jammer") {
        setStatus("New enemy: Jammer. It can freeze nearby towers.");
      } else if (stats.kind === "mender") {
        setStatus("New enemy: Mender. It heals nearby enemies.");
      } else if (stats.kind === "warden") {
        setStatus("New enemy: Warden. It has a shield.");
      } else if (stats.kind === "splitter") {
        setStatus("New enemy: Splitter. It splits into smaller units on death.");
      } else if (stats.kind === "specter") {
        setStatus("New enemy: Specter. It phases into stealth.");
      } else if (stats.kind === "juggernaut") {
        setStatus("Boss wave: Juggernaut incoming.");
      }
    }
  }

  function buildWaveConfig(w) {
    const t = getDifficultyTuning();
    let count = Math.max(4, Math.round((6 + Math.floor(w * 2.2)) * t.waveCount));
    const hp = (54 + w * 15 + Math.floor((w - 1) * (w - 1) * 1.1)) * t.waveHp;
    const speed = (46 + w * 3 + Math.floor(w / 4) * 2) * t.waveSpeed;
    const reward = Math.max(1, Math.round((9 + Math.floor(w * 0.9)) * t.waveReward));
    const interval = Math.max(0.36, (1.12 - w * 0.035) * t.waveInterval);
    const pool = (function () {
      const p = [{ kind: "raider", weight: 48 }, { kind: "scout", weight: 24 }];
      if (w >= 3) {
        p.push({ kind: "swarm", weight: 18 });
      }
      if (w >= 4) {
        p.push({ kind: "brute", weight: 12 + Math.min(18, w) });
      }
      if (w >= 6) {
        p.push({ kind: "jammer", weight: 8 + Math.min(8, Math.floor(w / 2)) });
      }
      if (w >= 7) {
        p.push({ kind: "warden", weight: 10 + Math.min(10, Math.floor(w / 2)) });
      }
      if (w >= 8) {
        p.push({ kind: "mender", weight: 8 + Math.min(8, Math.floor(w / 2)) });
      }
      if (w >= 7) {
        p.push({ kind: "splitter", weight: 10 + Math.min(8, Math.floor(w / 2)) });
      }
      if (w >= 9) {
        p.push({ kind: "specter", weight: 9 + Math.min(8, Math.floor(w / 2)) });
      }
      if (w % 5 === 0) {
        count = Math.max(10, Math.floor(count * 0.72));
        return [
          { kind: "juggernaut", weight: 24 },
          { kind: "brute", weight: 26 },
          { kind: "raider", weight: 18 },
          { kind: "jammer", weight: 12 },
          { kind: "mender", weight: 10 },
          { kind: "splitter", weight: 10 },
        ];
      }
      return p;
    })();
    return { count, hp, speed, reward, interval, pool };
  }

  function startNextWave() {
    if (spawnQueue || enemies.length > 0) {
      setStatus("Wave already running.");
      return;
    }
    if (wave >= maxWaves) {
      setStatus("All waves completed.");
      return;
    }

    wave += 1;
    const spec = buildWaveConfig(wave);

    spawnQueue = {
      remaining: spec.count,
      timer: 0.01,
      interval: spec.interval,
      hp: spec.hp,
      speed: spec.speed,
      reward: spec.reward,
      pool: spec.pool,
    };
    waveIntel = {
      hp: spec.hp,
      speed: spec.speed,
      pool: spec.pool,
      count: spec.count,
    };
    interWaveCountdown = 0;
    setStatus(`Wave ${wave} started. Prepare defenses.`);
    syncHud();
  }

  function pickTargets(tower, limit) {
    const inRange = enemies
      .filter((enemy) => {
        const d = distance(tower.x, tower.y, enemy.x, enemy.y);
        if (d > tower.range) {
          return false;
        }
        if (enemy.stealthTimer > 0 && d > 85) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.progress - a.progress);
    return inRange.slice(0, Math.max(1, limit || 1));
  }

  function spawnProjectile(tower, target, damageScale) {
    const scale = typeof damageScale === "number" ? damageScale : 1;
    projectiles.push({
      x: tower.x,
      y: tower.y,
      speed: tower.projectileSpeed,
      damage: tower.damage * scale,
      color: tower.projectileColor,
      targetId: target.id,
      splash: tower.splash,
      slowMult: tower.slowMult,
      slowDuration: tower.slowDuration,
      sourceType: tower.type,
      sourceTowerId: tower.id,
      alive: true,
    });
  }

  function getTowerById(id) {
    return towers.find((tower) => tower.id === id) || null;
  }

  function findTowerAtPoint(x, y) {
    for (let i = towers.length - 1; i >= 0; i -= 1) {
      const tower = towers[i];
      if (distance(x, y, tower.x, tower.y) <= towerRadius + 3) {
        return tower;
      }
    }
    return null;
  }

  function levelUpTower(tower) {
    if (!tower || tower.level >= 3) {
      return;
    }
    const branch = tower.branch || "power";
    tower.level += 1;
    if (branch === "control") {
      tower.damage = Math.round(tower.damage * 1.25);
      tower.range += 18;
      tower.cooldown = Math.max(0.2, tower.cooldown * 0.86);
      tower.projectileSpeed += 36;
      if (tower.splash > 0) {
        tower.splash += 20;
      }
      if (tower.slowMult < 1) {
        tower.slowMult = Math.max(0.24, tower.slowMult - 0.12);
        tower.slowDuration += 0.45;
      }
      tower.maxShots = Math.max(tower.maxShots, tower.level >= 2 ? 2 : 1);
    } else {
      tower.damage = Math.round(tower.damage * 1.52);
      tower.range += 10;
      tower.cooldown = Math.max(0.2, tower.cooldown * 0.8);
      tower.projectileSpeed += 58;
      if (tower.splash > 0) {
        tower.splash += 12;
      }
      if (tower.slowMult < 1) {
        tower.slowMult = Math.max(0.28, tower.slowMult - 0.08);
        tower.slowDuration += 0.25;
      }
      tower.maxShots = Math.max(tower.maxShots, 1);
    }
    if (tower.level === 3 && branch === "power") {
      if (tower.type === "sniper") {
        tower.maxShots = Math.max(tower.maxShots, 2);
      } else if (tower.type === "cannon") {
        tower.maxShots = Math.max(tower.maxShots, 1);
        tower.splash += 10;
      } else {
        tower.maxShots = Math.max(tower.maxShots, 3);
      }
    } else if (tower.level === 3 && branch === "control") {
      tower.maxShots = Math.max(tower.maxShots, tower.type === "sniper" ? 2 : 3);
    }
    if (tower.level < 3) {
      tower.nextLevelAt += 7;
    } else {
      tower.nextLevelAt = Number.POSITIVE_INFINITY;
    }
    tower.upgradeReady = false;
    tower.upgradeReadyNotified = false;
  }

  function isUpgradeReady(tower) {
    return Boolean(tower && tower.level < 3 && tower.kills >= tower.nextLevelAt);
  }

  function getUpgradeCost(tower) {
    const base = towerTypes[tower.type] ? towerTypes[tower.type].cost : 100;
    return Math.round(base * (tower.level === 1 ? 0.55 : 0.8));
  }

  function tryUpgradeTower(tower) {
    if (!tower) {
      return;
    }
    if (!isUpgradeReady(tower)) {
      return;
    }
    const cost = getUpgradeCost(tower);
    if (gold < cost) {
      setStatus(`Need ${cost} gold to upgrade ${towerTypes[tower.type].name} tower.`);
      return;
    }
    if (!tower.branch) {
      tower.branch = selectedUpgradeBranch;
    }
    gold -= cost;
    levelUpTower(tower);
    syncHud();
    setStatus(`${towerTypes[tower.type].name} upgraded to level ${tower.level} (${tower.branch}) for ${cost} gold.`);
  }

  function castAbility(name, x, y) {
    if (abilityCooldowns[name] > 0) {
      return false;
    }
    if (!running || paused) {
      return false;
    }
    const t = getDifficultyTuning();
    if (name === "overclock") {
      overclockTimer = 8;
      abilityCooldowns.overclock = 24 * t.abilityCd;
      createImpact(width * 0.5, height * 0.58, "rgba(196, 181, 253, 0.85)", 24);
      setStatus("Overclock active: all towers fire faster for 8s.");
      return true;
    }

    if (typeof x !== "number" || typeof y !== "number") {
      return false;
    }
    if (name === "emp") {
      const r = 110;
      let hits = 0;
      for (const enemy of enemies) {
        if (distance(x, y, enemy.x, enemy.y) <= r) {
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, 2);
          hits += 1;
        }
      }
      abilityCooldowns.emp = 16 * t.abilityCd;
      createImpact(x, y, "rgba(125, 211, 252, 0.95)", 26);
      setStatus(`EMP deployed${hits ? `, stunned ${hits} enemies` : ""}.`);
      return true;
    }
    if (name === "meteor") {
      const r = 120;
      for (const enemy of enemies) {
        if (distance(x, y, enemy.x, enemy.y) <= r) {
          enemy.hp -= 56;
          enemy.burnStacks = Math.min(3, enemy.burnStacks + 2);
          enemy.burnTimer = Math.max(enemy.burnTimer, 4.4);
          if (enemy.hp <= 0) {
            enemy.hp = 0;
            gold += enemy.reward;
            kills += 1;
            if (enemy.splitCount > 0) {
              spawnSplitEnemies(enemy);
            }
          }
        }
      }
      abilityCooldowns.meteor = 20 * t.abilityCd;
      createImpact(x, y, "rgba(251, 113, 133, 0.95)", 34);
      setStatus("Meteor strike impacted.");
      return true;
    }
    return false;
  }

  function registerTowerKill(towerId) {
    const tower = getTowerById(towerId);
    if (!tower) {
      return;
    }
    if (isUpgradeReady(tower)) {
      return;
    }
    tower.kills += 1;
    if (isUpgradeReady(tower)) {
      tower.upgradeReady = true;
      if (!tower.upgradeReadyNotified) {
        setStatus(`${towerTypes[tower.type].name} ready to upgrade. Click the tower and spend gold.`);
        tower.upgradeReadyNotified = true;
      }
    }
  }

  function createImpact(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: (rand() - 0.5) * 220,
        vy: (rand() - 0.5) * 220,
        life: 0.25 + rand() * 0.28,
        color,
      });
    }
  }

  function spawnSplitEnemies(parent) {
    if (!parent || !parent.splitCount) {
      return;
    }
    for (let i = 0; i < parent.splitCount; i += 1) {
      const childHp = Math.max(10, Math.round(parent.maxHp * 0.34));
      enemies.push({
        id: enemyIdSeq += 1,
        x: parent.x + (i === 0 ? -8 : 8),
        y: parent.y + (i === 0 ? -6 : 6),
        pathIndex: parent.pathIndex,
        speed: parent.baseSpeed * 1.18,
        baseSpeed: parent.baseSpeed * 1.18,
        hp: childHp,
        maxHp: childHp,
        reward: Math.max(1, Math.round(parent.reward * 0.45)),
        radius: 7,
        armor: 0,
        kind: "swarm",
        route: parent.route,
        freezeRadius: 0,
        freezeDuration: 0,
        abilityTimer: 0,
        abilityCooldown: 0,
        healRadius: 0,
        healAmount: 0,
        splitCount: 0,
        stealthTimer: 0,
        stealthDuration: 0,
        stealthCooldown: 0,
        shield: 0,
        burnStacks: 0,
        burnTimer: 0,
        frostMarkTimer: 0,
        stunTimer: 0,
        slowTimer: 0,
        slowMult: 1,
        progress: parent.progress,
      });
    }
  }

  function applyDamage(enemy, projectile) {
    if (enemy.hp <= 0) {
      return false;
    }
    let damage = projectile.damage;
    if (projectile.sourceType === "sniper" && enemy.frostMarkTimer > 0) {
      damage *= 1.4;
    }
    if (projectile.sourceType === "arrow" && enemy.burnStacks > 0) {
      damage += enemy.burnStacks * 6;
      enemy.burnStacks = 0;
      enemy.burnTimer = 0;
    }
    if (projectile.sourceType === "ember") {
      enemy.burnStacks = Math.min(3, enemy.burnStacks + 1);
      enemy.burnTimer = Math.max(enemy.burnTimer, 3.2);
    }
    if (projectile.slowMult < 1) {
      enemy.frostMarkTimer = Math.max(enemy.frostMarkTimer, 2.2);
    }
    if (enemy.shield > 0) {
      const blocked = Math.min(enemy.shield, damage);
      enemy.shield -= blocked;
      damage -= blocked;
      if (damage <= 0) {
        return false;
      }
    }
    const mitigated = damage * (1 - (enemy.armor || 0));
    enemy.hp -= mitigated;
    totalDamageDealt += mitigated;
    const sourceTower = getTowerById(projectile.sourceTowerId);
    if (sourceTower) {
      sourceTower.totalDamage += mitigated;
    }
    if (projectile.slowMult < 1) {
      enemy.slowMult = Math.min(enemy.slowMult, projectile.slowMult);
      enemy.slowTimer = Math.max(enemy.slowTimer, projectile.slowDuration);
    }
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      gold += enemy.reward;
      kills += 1;
      if (enemy.splitCount > 0) {
        spawnSplitEnemies(enemy);
      }
      createImpact(enemy.x, enemy.y, "rgba(74, 222, 128, 0.8)", 14);
      return true;
    }
    return false;
  }

  function updateSpawnQueue(dt) {
    if (!spawnQueue) {
      return;
    }
    spawnQueue.timer -= dt;
    if (spawnQueue.timer > 0) {
      return;
    }
    const kind = pickWeightedArchetype(spawnQueue.pool);
    spawnEnemy({ ...spawnQueue, kind });
    spawnQueue.remaining -= 1;
    if (spawnQueue.remaining <= 0) {
      spawnQueue = null;
    } else {
      spawnQueue.timer = spawnQueue.interval;
    }
  }

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        if (enemy.slowTimer <= 0) {
          enemy.slowTimer = 0;
          enemy.slowMult = 1;
        }
      }
      if (enemy.stunTimer > 0) {
        enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      }
      if (enemy.stealthCooldown > 0) {
        enemy.abilityTimer -= dt;
        if (enemy.abilityTimer <= 0) {
          enemy.abilityTimer = enemy.stealthCooldown;
          enemy.stealthTimer = enemy.stealthDuration;
        }
      }
      if (enemy.stealthTimer > 0) {
        enemy.stealthTimer = Math.max(0, enemy.stealthTimer - dt);
      }
      if (enemy.frostMarkTimer > 0) {
        enemy.frostMarkTimer = Math.max(0, enemy.frostMarkTimer - dt);
      }
      if (enemy.hp > 0 && enemy.burnTimer > 0 && enemy.burnStacks > 0) {
        enemy.burnTimer -= dt;
        const dot = enemy.burnStacks * 3.2 * dt;
        enemy.hp -= dot;
        totalDamageDealt += dot;
        if (enemy.hp <= 0) {
          enemy.hp = 0;
          gold += enemy.reward;
          kills += 1;
          if (enemy.splitCount > 0) {
            spawnSplitEnemies(enemy);
          }
          createImpact(enemy.x, enemy.y, "rgba(251, 113, 133, 0.78)", 10);
        }
        if (enemy.burnTimer <= 0) {
          enemy.burnTimer = 0;
          enemy.burnStacks = 0;
        }
      }

      const speed = enemy.stunTimer > 0 ? 0 : enemy.baseSpeed * enemy.slowMult;
      let remainingMove = speed * dt;

      while (remainingMove > 0 && enemy.pathIndex < enemy.route.length - 1) {
        const from = enemy.route[enemy.pathIndex];
        const to = enemy.route[enemy.pathIndex + 1];
        const segDx = to.x - from.x;
        const segDy = to.y - from.y;
        const segLen = Math.hypot(segDx, segDy) || 1;
        const ux = segDx / segLen;
        const uy = segDy / segLen;
        const distToTarget = Math.hypot(to.x - enemy.x, to.y - enemy.y);

        if (remainingMove >= distToTarget) {
          enemy.x = to.x;
          enemy.y = to.y;
          enemy.pathIndex += 1;
          enemy.progress += distToTarget;
          remainingMove -= distToTarget;
        } else {
          enemy.x += ux * remainingMove;
          enemy.y += uy * remainingMove;
          enemy.progress += remainingMove;
          remainingMove = 0;
        }
      }

      if (enemy.abilityCooldown > 0 && enemy.freezeDuration > 0 && towers.length) {
        enemy.abilityTimer -= dt;
        if (enemy.abilityTimer <= 0) {
          enemy.abilityTimer = enemy.abilityCooldown;
          let affected = 0;
          for (const tower of towers) {
            if (distance(enemy.x, enemy.y, tower.x, tower.y) <= enemy.freezeRadius) {
              tower.disabledTimer = Math.max(tower.disabledTimer || 0, enemy.freezeDuration);
              affected += 1;
            }
          }
          if (affected > 0) {
            createImpact(enemy.x, enemy.y, "rgba(125, 211, 252, 0.85)", 12);
            setStatus(`Jammer pulse: ${affected} tower${affected > 1 ? "s" : ""} frozen.`);
          }
        }
      }

      if (enemy.abilityCooldown > 0 && enemy.healAmount > 0) {
        enemy.abilityTimer -= dt;
        if (enemy.abilityTimer <= 0) {
          enemy.abilityTimer = enemy.abilityCooldown;
          let healed = 0;
          for (const other of enemies) {
            if (other.id === enemy.id || other.hp <= 0) {
              continue;
            }
            if (distance(enemy.x, enemy.y, other.x, other.y) <= enemy.healRadius) {
              other.hp = Math.min(other.maxHp, other.hp + enemy.healAmount);
              healed += 1;
            }
          }
          if (healed > 0) {
            createImpact(enemy.x, enemy.y, "rgba(134, 239, 172, 0.78)", 10);
          }
        }
      }
    }

    let breaches = 0;
    enemies = enemies.filter((enemy) => {
      const escaped = enemy.pathIndex >= enemy.route.length - 1;
      if (escaped) {
        breaches += 1;
      }
      return !escaped && enemy.hp > 0;
    });

    if (breaches > 0) {
      lives -= breaches;
      const exit = activeRoutes[0][activeRoutes[0].length - 1];
      createImpact(width - 40, exit.y, "rgba(248, 113, 113, 0.9)", 20);
      setStatus(`The core took ${breaches} hit${breaches > 1 ? "s" : ""}.`);
    }
  }

  function updateTowers(dt) {
    for (const tower of towers) {
      if (tower.disabledTimer > 0) {
        tower.disabledTimer = Math.max(0, tower.disabledTimer - dt);
        continue;
      }
      const haste = overclockTimer > 0 ? 1.5 : 1;
      tower.cooldownLeft -= dt * haste;
      if (tower.cooldownLeft > 0) {
        continue;
      }
      const targets = pickTargets(tower, tower.maxShots || 1);
      if (!targets.length) {
        continue;
      }
      for (let i = 0; i < targets.length; i += 1) {
        const damageScale = i === 0 ? 1 : 0.72;
        spawnProjectile(tower, targets[i], damageScale);
      }
      tower.cooldownLeft = tower.cooldown;
    }
  }

  function updateProjectiles(dt) {
    for (const projectile of projectiles) {
      if (!projectile.alive) {
        continue;
      }
      const target = enemies.find((enemy) => enemy.id === projectile.targetId);
      if (!target) {
        projectile.alive = false;
        continue;
      }

      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = projectile.speed * dt;

      if (step >= dist || dist <= target.radius + 3) {
        projectile.x = target.x;
        projectile.y = target.y;

        if (projectile.splash > 0) {
          for (const enemy of enemies) {
            if (distance(enemy.x, enemy.y, projectile.x, projectile.y) <= projectile.splash) {
              const killed = applyDamage(enemy, projectile);
              if (killed) {
                registerTowerKill(projectile.sourceTowerId);
              }
            }
          }
          createImpact(projectile.x, projectile.y, "rgba(251, 146, 60, 0.85)", 16);
        } else {
          const killed = applyDamage(target, projectile);
          if (killed) {
            registerTowerKill(projectile.sourceTowerId);
          }
          createImpact(projectile.x, projectile.y, "rgba(56, 189, 248, 0.8)", 9);
        }
        projectile.alive = false;
      } else {
        projectile.x += (dx / dist) * step;
        projectile.y += (dy / dist) * step;
      }
    }

    projectiles = projectiles.filter((p) => p.alive);
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function updateGame(dt) {
    if (paused || !running) {
      return;
    }

    overclockTimer = Math.max(0, overclockTimer - dt);
    abilityCooldowns.emp = Math.max(0, abilityCooldowns.emp - dt);
    abilityCooldowns.meteor = Math.max(0, abilityCooldowns.meteor - dt);
    abilityCooldowns.overclock = Math.max(0, abilityCooldowns.overclock - dt);

    updateSpawnQueue(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updateParticles(dt);

    if (wave > 0 && !spawnQueue && enemies.length === 0 && !clearedWaveBonus.has(wave) && lives > 0) {
      const t = getDifficultyTuning();
      const bonus = Math.round((16 + wave * 3) * t.clearBonus);
      const interest = Math.min(t.interestCap, Math.floor(gold * 0.08));
      gold += bonus + interest;
      clearedWaveBonus.add(wave);
      if (wave < maxWaves) {
        interWaveCountdown = 5;
        setStatus(`Wave ${wave} cleared. Bonus +${bonus}, interest +${interest}. Next wave in ${interWaveCountdown}s.`);
      }
    }

    if (running && !spawnQueue && enemies.length === 0 && wave > 0 && wave < maxWaves && interWaveCountdown > 0) {
      interWaveCountdown -= dt;
      const left = Math.max(0, Math.ceil(interWaveCountdown));
      if (left > 0) {
        setStatus(`Next wave starts in ${left}s. Press Pause to stop auto-start.`);
      } else {
        interWaveCountdown = 0;
        startNextWave();
      }
    }

    if (lives <= 0) {
      running = false;
      paused = false;
      endRunSummary = {
        wave,
        outcome: "Defeat",
        totalDamage: Math.round(totalDamageDealt),
        bestTower: getBestTowerLabel(),
        kills,
        gold: Math.floor(gold),
      };
      setStatus(`Defeat at wave ${wave}. Reset and try a new build.`);
    } else if (wave >= maxWaves && !spawnQueue && enemies.length === 0) {
      running = false;
      paused = false;
      endRunSummary = {
        wave,
        outcome: "Victory",
        totalDamage: Math.round(totalDamageDealt),
        bestTower: getBestTowerLabel(),
        kills,
        gold: Math.floor(gold),
      };
      setStatus("Victory! All waves cleared.");
    }

    syncHud();
  }

  function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#030b18");
    bg.addColorStop(0.55, "#0a1d34");
    bg.addColorStop(1, "#0f2f3c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const halo = ctx.createRadialGradient(width * 0.77, height * 0.18, 10, width * 0.77, height * 0.18, 260);
    halo.addColorStop(0, "rgba(56, 189, 248, 0.2)");
    halo.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    const warm = ctx.createRadialGradient(width * 0.22, height * 0.84, 10, width * 0.22, height * 0.84, 280);
    warm.addColorStop(0, "rgba(251, 146, 60, 0.14)");
    warm.addColorStop(1, "rgba(251, 146, 60, 0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    for (let i = 0; i < 17; i += 1) {
      const x = i * 72 + ((visualClock * 6) % 72);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 120, height);
      ctx.stroke();
    }
  }

  function drawPath() {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const route of activeRoutes) {
      ctx.shadowColor = "rgba(56, 189, 248, 0.2)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "rgba(14, 165, 233, 0.2)";
      ctx.lineWidth = roadHalfWidth * 2;
      ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y);
      for (let i = 1; i < route.length; i += 1) {
        ctx.lineTo(route[i].x, route[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "rgba(186, 230, 253, 0.44)";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y);
      for (let i = 1; i < route.length; i += 1) {
        ctx.lineTo(route[i].x, route[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
    ctx.beginPath();
    const primaryRoute = activeRoutes[0];
    ctx.arc(primaryRoute[0].x + 20, primaryRoute[0].y, 9, 0, Math.PI * 2);
    ctx.fill();

    const exit = primaryRoute[primaryRoute.length - 1];
    ctx.fillStyle = "rgba(74, 222, 128, 0.9)";
    ctx.beginPath();
    ctx.arc(exit.x - 20, exit.y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "700 12px Space Grotesk, sans-serif";
    ctx.fillStyle = "rgba(254, 226, 226, 0.9)";
    ctx.fillText("ENTRY", primaryRoute[0].x + 34, primaryRoute[0].y - 12);
    ctx.fillStyle = "rgba(220, 252, 231, 0.9)";
    ctx.fillText("CORE", exit.x - 62, exit.y - 14);
  }

  function drawTowerIcon(type, x, y, r) {
    ctx.save();
    ctx.strokeStyle = "rgba(15, 23, 42, 0.88)";
    ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
    ctx.lineWidth = 2;
    if (type === "arrow") {
      ctx.beginPath();
      ctx.moveTo(x - r * 0.9, y + r * 0.25);
      ctx.lineTo(x + r * 0.45, y + r * 0.25);
      ctx.moveTo(x + r * 0.45, y + r * 0.25);
      ctx.lineTo(x + r * 0.1, y - r * 0.1);
      ctx.moveTo(x + r * 0.45, y + r * 0.25);
      ctx.lineTo(x + r * 0.1, y + r * 0.6);
      ctx.moveTo(x - r * 0.9, y + r * 0.25);
      ctx.lineTo(x - r * 0.5, y - r * 0.2);
      ctx.stroke();
    } else if (type === "cannon") {
      ctx.beginPath();
      ctx.rect(x - r * 0.55, y - r * 0.35, r * 1.1, r * 0.9);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + r * 0.3, y - r * 0.1);
      ctx.lineTo(x + r * 1.05, y - r * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - r * 0.1, y + r * 0.2, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(203, 213, 225, 0.8)";
      ctx.fill();
    } else if (type === "frost") {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.95);
      ctx.lineTo(x, y + r * 0.95);
      ctx.moveTo(x - r * 0.95, y);
      ctx.lineTo(x + r * 0.95, y);
      ctx.moveTo(x - r * 0.62, y - r * 0.62);
      ctx.lineTo(x + r * 0.62, y + r * 0.62);
      ctx.moveTo(x + r * 0.62, y - r * 0.62);
      ctx.lineTo(x - r * 0.62, y + r * 0.62);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(224, 242, 254, 0.9)";
      ctx.fill();
    } else if (type === "sniper") {
      ctx.beginPath();
      ctx.rect(x - r * 0.85, y - r * 0.22, r * 1.7, r * 0.44);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - r * 0.15, y - r * 0.22);
      ctx.lineTo(x + r * 0.95, y - r * 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y + r * 0.15, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
      ctx.fill();
    } else if (type === "ember") {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.95);
      ctx.quadraticCurveTo(x + r * 0.78, y - r * 0.2, x + r * 0.35, y + r * 0.78);
      ctx.quadraticCurveTo(x, y + r * 0.28, x - r * 0.35, y + r * 0.78);
      ctx.quadraticCurveTo(x - r * 0.78, y - r * 0.2, x, y - r * 0.95);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.35);
      ctx.quadraticCurveTo(x + r * 0.25, y + r * 0.05, x, y + r * 0.32);
      ctx.quadraticCurveTo(x - r * 0.25, y + r * 0.05, x, y - r * 0.35);
      ctx.fillStyle = "rgba(254, 242, 242, 0.85)";
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTowerBody(type, x, y, r, alpha) {
    const def = towerTypes[type];
    if (!def) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = typeof alpha === "number" ? alpha : 1;
    const ring = ctx.createRadialGradient(x - r * 0.3, y - r * 0.5, 2, x, y, r * 1.3);
    ring.addColorStop(0, "rgba(255,255,255,0.6)");
    ring.addColorStop(1, def.color);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = ring;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
    ctx.stroke();
    drawTowerIcon(type, x, y, r * 0.8);
    ctx.restore();
  }

  function drawTowers() {
    for (const tower of towers) {
      drawTowerBody(tower.type, tower.x, tower.y, towerRadius, 1);
      if (tower.disabledTimer > 0) {
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, towerRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(219, 234, 254, 0.92)";
        ctx.font = "700 10px Space Grotesk, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ICE", tower.x, tower.y - towerRadius - 10);
      }
      if (isUpgradeReady(tower)) {
        const pulse = 0.55 + 0.45 * Math.sin(visualClock * 7 + tower.id);
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, towerRadius + 6 + pulse * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.45 + pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(254, 240, 138, 0.95)";
        ctx.font = "700 11px Space Grotesk, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("UP", tower.x, tower.y - towerRadius - 10);
      }
      ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
      ctx.font = "700 10px Space Grotesk, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + towerRadius + 12);

      if (tower === towers[towers.length - 1]) {
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(125, 211, 252, 0.14)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.textAlign = "start";
  }

  function drawTowerHoverCard() {
    const tower = getTowerById(hoveredTowerId);
    if (!tower || dragState.active) {
      return;
    }
    const def = towerTypes[tower.type];
    if (!def) {
      return;
    }
    const dps = (tower.damage / Math.max(0.001, tower.cooldown)).toFixed(1);
    const special =
      tower.splash > 0
        ? `Splash ${Math.round(tower.splash)}`
        : tower.slowMult < 1
        ? `Slow ${Math.round(tower.slowMult * 100)}% / ${tower.slowDuration.toFixed(1)}s`
        : "Single target";

    const cardW = 230;
    const cardH = 136;
    const cardX = Math.max(12, Math.min(width - cardW - 12, tower.x + 20));
    const cardY = Math.max(12, Math.min(height - cardH - 12, tower.y - 64));

    ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.42)";
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 13px Space Grotesk, sans-serif";
    const branchLabel = tower.branch ? ` | ${tower.branch}` : "";
    ctx.fillText(`${def.name}  L${tower.level}${branchLabel}`, cardX + 10, cardY + 18);
    ctx.font = "600 12px Space Grotesk, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`Damage ${tower.damage}   Range ${Math.round(tower.range)}`, cardX + 10, cardY + 38);
    ctx.fillText(`Rate ${(1 / tower.cooldown).toFixed(2)}/s   DPS ${dps}`, cardX + 10, cardY + 56);
    ctx.fillText(`Shots/volley ${tower.maxShots || 1}`, cardX + 10, cardY + 72);
    ctx.fillStyle = "#93c5fd";
    ctx.fillText(special, cardX + 10, cardY + 90);
    ctx.fillStyle = "#f8fafc";
    const nextText = Number.isFinite(tower.nextLevelAt)
      ? `Kills ${tower.kills}/${tower.nextLevelAt}`
      : `Kills ${tower.kills} (MAX)`;
    ctx.fillText(nextText, cardX + 10, cardY + 108);
    if (isUpgradeReady(tower)) {
      const cost = getUpgradeCost(tower);
      ctx.fillStyle = gold >= cost ? "#86efac" : "#fca5a5";
      ctx.fillText(`Upgrade ready: click tower (${cost}g)`, cardX + 10, cardY + 124);
    } else if (tower.level < 3) {
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Upgrade unlocks at next kill threshold", cardX + 10, cardY + 124);
    }
  }

  function drawPlacementPreview() {
    const previewType = dragState.active ? dragState.towerType : selectedTower;
    if (!previewType || selectedAbility) {
      return;
    }
    const def = towerTypes[previewType];
    if (!def) {
      return;
    }
    const x = dragState.active ? dragState.x : hoverPlacement.x;
    const y = dragState.active ? dragState.y : hoverPlacement.y;
    const inCanvas = dragState.active ? dragState.inCanvas : hoverPlacement.inCanvas;
    if (!inCanvas) {
      return;
    }
    const check = canPlaceTowerAt(x, y);
    const valid = inCanvas && check.ok && running && !paused && gold >= def.cost;
    const rangeColor = valid ? "rgba(125, 211, 252, 0.22)" : "rgba(248, 113, 113, 0.2)";

    ctx.beginPath();
    ctx.arc(x, y, def.range, 0, Math.PI * 2);
    ctx.fillStyle = rangeColor;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = valid ? "rgba(125, 211, 252, 0.48)" : "rgba(248, 113, 113, 0.45)";
    ctx.stroke();
    drawTowerBody(previewType, x, y, towerRadius, valid ? 0.86 : 0.62);
    if (!valid) {
      ctx.beginPath();
      ctx.arc(x, y, towerRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.28)";
      ctx.fill();
    }
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      ctx.save();
      if (enemy.stealthTimer > 0) {
        ctx.globalAlpha = 0.42;
      }
      const pulse = 0.75 + 0.25 * Math.sin(visualClock * 7 + enemy.id);
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = enemy.slowMult < 1 ? "rgba(103, 232, 249, 0.2)" : `rgba(244, 63, 94, ${0.18 * pulse})`;
      ctx.fill();

      if (enemy.kind === "scout" || enemy.kind === "swarm") {
        ctx.beginPath();
        const sides = enemy.kind === "swarm" ? 6 : 4;
        for (let i = 0; i < sides; i += 1) {
          const ang = (Math.PI * 2 * i) / sides + visualClock * 0.6;
          const px = enemy.x + Math.cos(ang) * enemy.radius;
          const py = enemy.y + Math.sin(ang) * enemy.radius;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fillStyle = enemy.kind === "swarm" ? "#fb7185" : "#f43f5e";
        ctx.fill();
      } else if (enemy.kind === "jammer") {
        ctx.beginPath();
        for (let i = 0; i < 3; i += 1) {
          const ang = (Math.PI * 2 * i) / 3 - Math.PI / 2 + visualClock * 0.8;
          const px = enemy.x + Math.cos(ang) * enemy.radius;
          const py = enemy.y + Math.sin(ang) * enemy.radius;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        if (enemy.abilityCooldown > 0) {
          const t = enemy.abilityTimer / enemy.abilityCooldown;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - t));
          ctx.strokeStyle = "rgba(186, 230, 253, 0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (enemy.kind === "mender") {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        if (enemy.abilityCooldown > 0) {
          const t = enemy.abilityTimer / enemy.abilityCooldown;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - t));
          ctx.strokeStyle = "rgba(134, 239, 172, 0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        const body = ctx.createRadialGradient(
          enemy.x - enemy.radius * 0.35,
          enemy.y - enemy.radius * 0.5,
          2,
          enemy.x,
          enemy.y,
          enemy.radius
        );
        if (enemy.kind === "brute") {
          body.addColorStop(0, "#fed7aa");
          body.addColorStop(1, "#b45309");
        } else if (enemy.kind === "warden") {
          body.addColorStop(0, "#e2e8f0");
          body.addColorStop(1, "#64748b");
        } else if (enemy.kind === "mender") {
          body.addColorStop(0, "#dcfce7");
          body.addColorStop(1, "#16a34a");
        } else if (enemy.kind === "specter") {
          body.addColorStop(0, "#cffafe");
          body.addColorStop(1, "#0891b2");
        } else if (enemy.kind === "juggernaut") {
          body.addColorStop(0, "#ddd6fe");
          body.addColorStop(1, "#6d28d9");
        } else if (enemy.slowMult < 1) {
          body.addColorStop(0, "#dbeafe");
          body.addColorStop(1, "#06b6d4");
        } else {
          body.addColorStop(0, "#fecdd3");
          body.addColorStop(1, "#e11d48");
        }
        ctx.fillStyle = body;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(enemy.x + 2, enemy.y - 2, 2.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.fill();

      const barW = 28;
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 12, barW, 4);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 12, barW * ratio, 4);
      if (enemy.shield > 0) {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(191, 219, 254, 0.82)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawEnemyIntel() {
    const intel = waveIntel || (wave < maxWaves ? buildWaveConfig(wave + 1) : null);
    const intelWave = waveIntel ? wave : wave + 1;
    if (!intel) {
      return;
    }
    const boxX = width - 414;
    const boxY = 18;
    const boxW = 396;
    const boxH = 230;
    ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 14px Space Grotesk, sans-serif";
    ctx.fillText(`Enemy Intel - Wave ${intelWave}`, boxX + 12, boxY + 20);
    ctx.font = "600 12px Space Grotesk, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`Base HP: ${Math.round(intel.hp)}   Base Speed: ${Math.round(intel.speed)}`, boxX + 12, boxY + 40);

    const mix = intel.pool
      .map((item) => `${enemyArchetypes[item.kind].name} ${item.weight}%`)
      .join(" | ");
    ctx.fillText("Mix:", boxX + 12, boxY + 62);
    ctx.fillStyle = "#93c5fd";
    ctx.fillText(mix, boxX + 12, boxY + 80);

    ctx.fillStyle = "#f1f5f9";
    ctx.fillText("Scout=fast   Brute=tanky armor   Swarm=low HP", boxX + 12, boxY + 102);

    const legendY = boxY + 124;
    ctx.font = "600 11px Space Grotesk, sans-serif";
    ctx.textAlign = "left";

    function drawLegendSymbol(kind, x, y) {
      ctx.save();
      if (kind === "scout" || kind === "swarm") {
        const sides = kind === "swarm" ? 6 : 4;
        ctx.beginPath();
        for (let i = 0; i < sides; i += 1) {
          const ang = (Math.PI * 2 * i) / sides;
          const px = x + Math.cos(ang) * 5;
          const py = y + Math.sin(ang) * 5;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fillStyle = kind === "swarm" ? "#fb7185" : "#f43f5e";
        ctx.fill();
      } else if (kind === "jammer") {
        ctx.beginPath();
        for (let i = 0; i < 3; i += 1) {
          const ang = (Math.PI * 2 * i) / 3 - Math.PI / 2;
          const px = x + Math.cos(ang) * 5;
          const py = y + Math.sin(ang) * 5;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle =
          kind === "brute"
            ? "#b45309"
            : kind === "warden"
            ? "#64748b"
            : kind === "mender"
            ? "#22c55e"
            : kind === "splitter"
            ? "#fb7185"
            : kind === "specter"
            ? "#22d3ee"
            : kind === "juggernaut"
            ? "#7c3aed"
            : "#e11d48";
        ctx.fill();
      }
      ctx.restore();
    }

    const legend = [
      { kind: "raider", text: "Raider: balanced" },
      { kind: "scout", text: "Scout: very fast, low HP" },
      { kind: "brute", text: "Brute: armored, high HP" },
      { kind: "swarm", text: "Swarm: weak but numerous" },
      { kind: "jammer", text: "Jammer: freezes nearby towers" },
      { kind: "warden", text: "Warden: starts with shield" },
      { kind: "mender", text: "Mender: heals nearby units" },
      { kind: "splitter", text: "Splitter: splits on death" },
      { kind: "specter", text: "Specter: temporary stealth" },
      { kind: "juggernaut", text: "Juggernaut: milestone boss" },
    ];
    const colX = [boxX + 12, boxX + 204];
    for (let i = 0; i < legend.length; i += 1) {
      const item = legend[i];
      const lx = colX[i % 2];
      const ly = legendY + Math.floor(i / 2) * 22;
      drawLegendSymbol(item.kind, lx, ly);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(item.text, lx + 12, ly + 4);
    }
    ctx.textAlign = "start";
  }

  function drawProjectiles() {
    for (const projectile of projectiles) {
      if (projectile.sourceType === "arrow") {
        ctx.beginPath();
        ctx.moveTo(projectile.x - 4, projectile.y);
        ctx.lineTo(projectile.x + 4, projectile.y);
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (projectile.sourceType === "cannon") {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
      } else if (projectile.sourceType === "sniper") {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 6.4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(221, 214, 254, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (projectile.sourceType === "ember") {
        ctx.beginPath();
        ctx.moveTo(projectile.x, projectile.y - 6);
        ctx.quadraticCurveTo(projectile.x + 4, projectile.y - 1, projectile.x, projectile.y + 6);
        ctx.quadraticCurveTo(projectile.x - 4, projectile.y - 1, projectile.x, projectile.y - 6);
        ctx.fillStyle = projectile.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(projectile.x, projectile.y - 5);
        ctx.lineTo(projectile.x + 4, projectile.y);
        ctx.lineTo(projectile.x, projectile.y + 5);
        ctx.lineTo(projectile.x - 4, projectile.y);
        ctx.closePath();
        ctx.fillStyle = projectile.color;
        ctx.fill();
      }
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawOverlay() {
    if (running) {
      if (paused) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 44px Space Grotesk, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", width / 2, height / 2);
        ctx.textAlign = "start";
      }
      return;
    }

    ctx.fillStyle = "rgba(2, 6, 23, 0.46)";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.fillStyle = lives > 0 ? "#86efac" : "#fca5a5";
    ctx.font = "bold 40px Space Grotesk, sans-serif";
    ctx.fillText(lives > 0 ? "CONGRATULATIONS!" : "DEFEAT", width / 2, height / 2 - 4);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 18px Space Grotesk, sans-serif";
    ctx.fillText("Press Reset Run to play again.", width / 2, height / 2 + 28);
    if (endRunSummary) {
      ctx.font = "600 14px Space Grotesk, sans-serif";
      ctx.fillText(`Wave ${endRunSummary.wave} | Kills ${endRunSummary.kills} | Gold ${endRunSummary.gold}`, width / 2, height / 2 + 52);
      ctx.fillText(`Damage ${endRunSummary.totalDamage} | Best ${endRunSummary.bestTower}`, width / 2, height / 2 + 72);
    }
    ctx.textAlign = "start";
  }

  function render() {
    drawBackground();
    drawPath();
    drawEnemyIntel();
    drawTowers();
    drawTowerHoverCard();
    drawPlacementPreview();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawOverlay();
  }

  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.033) * gameSpeed;
    lastTs = ts;
    visualClock = ts * 0.001;
    updateGame(dt);
    render();
    rafId = window.requestAnimationFrame(loop);
  }

  function beginDrag(towerType, clientX, clientY) {
    dragState.active = true;
    dragState.towerType = towerType;
    dragState.clientX = clientX;
    dragState.clientY = clientY;
    updateDragPosition(clientX, clientY);
  }

  function updateDragPosition(clientX, clientY) {
    if (!dragState.active) {
      return;
    }
    const p = clientToCanvas(clientX, clientY);
    dragState.clientX = clientX;
    dragState.clientY = clientY;
    dragState.x = p.x;
    dragState.y = p.y;
    dragState.inCanvas = p.inCanvas;
    const placeCheck = canPlaceTowerAt(p.x, p.y);
    dragState.valid = placeCheck.ok;
    dragState.reason = placeCheck.reason;
  }

  function placeTowerAtPosition(type, x, y) {
    if (!running || paused) {
      setStatus("Cannot place towers while paused or after game end.");
      return false;
    }
    const def = towerTypes[type];
    if (!def) {
      return false;
    }
    if (gold < def.cost) {
      setStatus(`Not enough gold for ${def.name} tower.`);
      return false;
    }
    const placement = findNearestValidPlacement(x, y);
    if (!placement) {
      const check = canPlaceTowerAt(x, y);
      setStatus(check.reason || "Invalid placement.");
      return false;
    }

    gold -= def.cost;
    towers.push({
      id: towerIdSeq++,
      x: placement.x,
      y: placement.y,
      type,
      range: def.range,
      cooldown: def.cooldown,
      damage: def.damage,
      projectileSpeed: def.projectileSpeed,
      projectileColor: def.projectileColor,
      splash: def.splash,
      slowMult: def.slowMult,
      slowDuration: def.slowDuration,
      level: 1,
      branch: null,
      kills: 0,
      totalDamage: 0,
      maxShots: 1,
      nextLevelAt: 4,
      upgradeReady: false,
      upgradeReadyNotified: false,
      disabledTimer: 0,
      cooldownLeft: 0.05,
    });
    selectedTower = type;
    if (placement.adjusted) {
      setStatus(`${def.name} tower placed at nearest valid spot.`);
    } else {
      setStatus(`${def.name} tower placed.`);
    }
    syncHud();
    renderTowerButtons();
    return true;
  }

  function finalizeDrag(clientX, clientY) {
    if (!dragState.active || !dragState.towerType) {
      return;
    }
    updateDragPosition(clientX, clientY);
    const type = dragState.towerType;
    if (!running || paused) {
      cancelDrag();
      return;
    }
    if (!dragState.inCanvas) {
      cancelDrag();
      return;
    }
    if (!dragState.valid) {
      cancelDrag();
      return;
    }
    placeTowerAtPosition(type, dragState.x, dragState.y);
    cancelDrag();
  }

  function cancelDrag() {
    dragState.active = false;
    dragState.towerType = null;
    dragState.valid = false;
    dragState.reason = "";
    dragState.inCanvas = false;
  }

  function resetGame() {
    difficulty = difficultyDefs[selectedDifficulty] || difficultyDefs.normal;
    activeRoutes = (mapDefs[selectedMap] || mapDefs.estuary).routes;
    rngState = hashSeed(selectedSeed);
    lives = difficulty.startLives;
    gold = difficulty.startGold;
    wave = 0;
    kills = 0;
    totalDamageDealt = 0;
    selectedTower = "arrow";
    paused = false;
    running = true;
    enemyIdSeq = 1;
    towerIdSeq = 1;
    towers = [];
    enemies = [];
    projectiles = [];
    particles = [];
    spawnQueue = null;
    waveIntel = null;
    interWaveCountdown = 0;
    abilityCooldowns = { emp: 0, meteor: 0, overclock: 0 };
    overclockTimer = 0;
    selectedAbility = null;
    hoveredTowerId = null;
    firstSeenEnemyKinds = new Set();
    endRunSummary = null;
    clearedWaveBonus.clear();
    setStatus(getPlacementHint());
    syncHud();
    renderTowerButtons();
  }

  function renderTowerButtons() {
    towerPickerEl.innerHTML = "";
    for (const key of Object.keys(towerTypes)) {
      const def = towerTypes[key];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.draggable = false;
      btn.className = `choice ${selectedTower === key ? "active" : ""}`;
      const icon =
        key === "arrow"
          ? "&#10148;"
          : key === "cannon"
          ? "&#11042;"
          : key === "frost"
          ? "&#10038;"
          : key === "sniper"
          ? "&#9678;"
          : "&#10023;";
      btn.innerHTML = `${icon} ${def.name}<br><small>${def.cost}g</small>`;
      const special =
        def.splash > 0
          ? `Splash radius ${Math.round(def.splash)}`
          : def.slowMult < 1
          ? `Slows enemies to ${Math.round(def.slowMult * 100)}% for ${def.slowDuration.toFixed(1)}s`
          : "Single target";
      const placementText = useDragPlacement
        ? "Drag from this button to the field to place."
        : "Tap this button, then tap the field to place.";
      const tooltip = `${def.name}: range ${Math.round(def.range)}, damage ${def.damage}, ${special}. ${placementText} Unlocks upgrades at 4 and 11 kills; click/tap placed tower to buy. First upgrade uses selected path.`;
      btn.title = tooltip;
      btn.addEventListener("click", function () {
        if (!useDragPlacement && selectedTower === key) {
          selectedTower = null;
          setStatus("Tower selection cleared. Tap a placed tower to inspect/upgrade.");
        } else {
          selectedTower = key;
        }
        renderTowerButtons();
      });
      btn.addEventListener("mouseenter", function () {
        setStatus(tooltip);
      });
      btn.addEventListener("mouseleave", function () {
        if (!dragState.active) {
          setStatus(getPlacementHint());
        }
      });
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (useDragPlacement) {
          selectedTower = key;
          renderTowerButtons();
          beginDrag(key, e.clientX, e.clientY);
          setStatus(`${def.name} selected. Drag to the field and release to place.`);
          return;
        }
        if (selectedTower === key) {
          selectedTower = null;
          renderTowerButtons();
          cancelDrag();
          setStatus("Tower selection cleared. Tap a placed tower to inspect/upgrade.");
          return;
        }
        selectedTower = key;
        renderTowerButtons();
        cancelDrag();
        setStatus(`${def.name} selected. Tap on the field to place.`);
      });
      btn.addEventListener("dragstart", function (e) {
        e.preventDefault();
      });
      towerPickerEl.appendChild(btn);
    }
  }

  startBtn.addEventListener("click", function () {
    if (!running) {
      return;
    }
    startNextWave();
  });

  pauseBtn.addEventListener("click", function () {
    if (!running) {
      return;
    }
    paused = !paused;
    if (paused && interWaveCountdown > 0) {
      interWaveCountdown = 0;
      setStatus("Paused. Auto-start canceled. Press Start Wave when ready.");
    } else {
      setStatus(paused ? "Paused." : "Resumed.");
    }
    syncHud();
  });

  resetBtn.addEventListener("click", function () {
    resetGame();
  });
  if (difficultyEl) {
    difficultyEl.addEventListener("change", function () {
      const key = difficultyEl.value;
      if (!difficultyDefs[key]) {
        return;
      }
      selectedDifficulty = key;
      resetGame();
      setStatus(`Difficulty set to ${difficultyDefs[key].label}.`);
    });
  }
  if (speedEl) {
    speedEl.addEventListener("change", function () {
      const s = Number(speedEl.value);
      if (!Number.isFinite(s) || s < 1 || s > 3) {
        return;
      }
      gameSpeed = s;
      setStatus(`Simulation speed: ${s}x.`);
      syncHud();
    });
  }
  if (branchEl) {
    branchEl.addEventListener("change", function () {
      const b = branchEl.value;
      if (b !== "power" && b !== "control") {
        return;
      }
      selectedUpgradeBranch = b;
      setStatus(`Upgrade path set to ${b}. Applies on first upgrade for each tower.`);
      syncHud();
    });
  }

  function onGlobalPointerMove(e) {
    if (dragState.active) {
      updateDragPosition(e.clientX, e.clientY);
      return;
    }
    const p = clientToCanvas(e.clientX, e.clientY);
    hoverPlacement.x = p.x;
    hoverPlacement.y = p.y;
    hoverPlacement.inCanvas = p.inCanvas;
    if (!p.inCanvas) {
      hoveredTowerId = null;
      return;
    }
    const tower = findTowerAtPoint(p.x, p.y);
    hoveredTowerId = tower ? tower.id : null;
  }

  function onGlobalTouchMove(e) {
    if (!dragState.active) {
      return;
    }
    // Prevent page scroll/pull-to-refresh while dragging a tower on touch devices.
    e.preventDefault();
  }

  function onGlobalPointerUp(e) {
    if (!dragState.active) {
      return;
    }
    finalizeDrag(e.clientX, e.clientY);
  }

  function onCanvasPointerDown(e) {
    if (dragState.active) {
      return;
    }
    const p = clientToCanvas(e.clientX, e.clientY);
    if (!p.inCanvas) {
      return;
    }
    if (selectedAbility) {
      if (castAbility(selectedAbility, p.x, p.y)) {
        selectedAbility = null;
        syncHud();
      }
      return;
    }
    if (useDragPlacement) {
      const tower = findTowerAtPoint(p.x, p.y);
      if (tower) {
        tryUpgradeTower(tower);
      }
      return;
    }
    if (selectedTower && placeTowerAtPosition(selectedTower, p.x, p.y)) {
      return;
    }
    const tappedTower = findTowerAtPoint(p.x, p.y);
    if (tappedTower) {
      tryUpgradeTower(tappedTower);
    }
  }

  if (mapEl) {
    mapEl.addEventListener("change", function () {
      const key = mapEl.value;
      if (!mapDefs[key]) {
        return;
      }
      selectedMap = key;
      activeRoutes = mapDefs[key].routes;
      resetGame();
      setStatus(`Map set to ${mapDefs[key].label}.`);
    });
  }
  if (seedEl) {
    seedEl.addEventListener("change", function () {
      selectedSeed = seedEl.value.trim() || selectedSeed;
      resetGame();
      setStatus(`Seed set to ${selectedSeed}.`);
    });
  }
  if (dailyBtn) {
    dailyBtn.addEventListener("click", function () {
      selectedSeed = String(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
      resetGame();
      setStatus(`Daily challenge seed loaded: ${selectedSeed}.`);
    });
  }
  if (empBtn) {
    empBtn.addEventListener("click", function () {
      if (abilityCooldowns.emp > 0) {
        return;
      }
      selectedAbility = selectedAbility === "emp" ? null : "emp";
      setStatus(selectedAbility ? "EMP selected. Click on canvas to cast." : "EMP selection canceled.");
      syncHud();
    });
  }
  if (meteorBtn) {
    meteorBtn.addEventListener("click", function () {
      if (abilityCooldowns.meteor > 0) {
        return;
      }
      selectedAbility = selectedAbility === "meteor" ? null : "meteor";
      setStatus(selectedAbility ? "Meteor selected. Click on canvas to cast." : "Meteor selection canceled.");
      syncHud();
    });
  }
  if (overclockBtn) {
    overclockBtn.addEventListener("click", function () {
      if (castAbility("overclock")) {
        selectedAbility = null;
        syncHud();
      }
    });
  }

  window.addEventListener("pointermove", onGlobalPointerMove);
  window.addEventListener("pointerup", onGlobalPointerUp);
  window.addEventListener("touchmove", onGlobalTouchMove, { passive: false });
  canvas.addEventListener("pointerdown", onCanvasPointerDown);

  populateDifficultyOptions();
  populateMapOptions();
  renderTowerButtons();
  resetGame();
  rafId = window.requestAnimationFrame(loop);

  return function cleanup() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    window.removeEventListener("pointermove", onGlobalPointerMove);
    window.removeEventListener("pointerup", onGlobalPointerUp);
    window.removeEventListener("touchmove", onGlobalTouchMove);
    canvas.removeEventListener("pointerdown", onCanvasPointerDown);
  };
}

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(packetDefenderGame);


