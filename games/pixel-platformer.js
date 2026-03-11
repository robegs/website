const pixelPlatformerGame = {
  id: "pixel-platformer",
  title: "Pixel Platformer",
  description: "Mario-inspired side-scroller with enemies, coins, hazards, and multi-level progression.",
  difficulty: "Timing, jumps, and route planning",
  setup: setupPixelPlatformer,
};

function setupPixelPlatformer(container) {
  const width = 960;
  const height = 540;
  const tileSize = 36;
  const sourceTileSize = 18;
  const sourceCharSize = 24;
  const sourceGap = 1;

  const root = document.createElement("div");
  root.className = "lab-game pf-game";
  root.innerHTML = `
    <div class="pf-theme-banner">Sunset Dunes</div>
    <div class="hud">
      <div class="hud-item"><strong>Lives</strong><div id="pf-lives">3</div></div>
      <div class="hud-item"><strong>Coins</strong><div id="pf-coins">0 / 0</div></div>
      <div class="hud-item"><strong>Score</strong><div id="pf-score">0</div></div>
      <div class="hud-item"><strong>Level</strong><div id="pf-level">1 / 1</div></div>
      <div class="hud-item"><strong>Time</strong><div id="pf-time">0.0s</div></div>
      <div class="hud-item"><strong>Boost</strong><div id="pf-boost">Off</div></div>
      <div class="hud-item"><strong>Dash</strong><div id="pf-dash">Ready</div></div>
      <div class="hud-item"><strong>Best</strong><div id="pf-best">--</div></div>
    </div>
    <div class="action-row">
      <button type="button" id="pf-pause" class="btn ghost">Pause</button>
      <button type="button" id="pf-reset" class="btn ghost">Restart Run</button>
      <button type="button" id="pf-sfx" class="btn ghost">SFX: On</button>
      <button type="button" id="pf-music" class="btn ghost">Music: On</button>
      <button type="button" id="pf-editor-toggle" class="btn ghost">Editor: Off</button>
    </div>
    <div class="pf-settings">
      <label for="pf-sfx-volume">SFX Volume <span id="pf-sfx-volume-value">70%</span></label>
      <input id="pf-sfx-volume" type="range" min="0" max="100" step="1" value="70" />
      <label for="pf-music-volume">Music Volume <span id="pf-music-volume-value">60%</span></label>
      <input id="pf-music-volume" type="range" min="0" max="100" step="1" value="60" />
    </div>
    <div class="pf-editor-panel" id="pf-editor-panel" hidden>
      <div class="pf-editor-row">
        <strong>Palette</strong>
        <div id="pf-editor-palette" class="pf-editor-palette"></div>
      </div>
      <div class="pf-editor-row">
        <button type="button" id="pf-editor-prev" class="btn ghost">Prev Level</button>
        <button type="button" id="pf-editor-next" class="btn ghost">Next Level</button>
        <button type="button" id="pf-editor-clone" class="btn ghost">Clone Level</button>
        <button type="button" id="pf-editor-delete" class="btn ghost">Delete Level</button>
        <span id="pf-editor-level-label" class="pf-editor-level-label">Level 1 / 1</span>
      </div>
      <div class="pf-editor-row">
        <button type="button" id="pf-editor-pan-left" class="btn ghost">Pan Left</button>
        <input id="pf-editor-scroll" type="range" min="0" max="0" step="1" value="0" />
        <button type="button" id="pf-editor-pan-right" class="btn ghost">Pan Right</button>
      </div>
      <div class="pf-editor-row">
        <button type="button" id="pf-editor-share" class="btn ghost">Create Share Link</button>
        <button type="button" id="pf-editor-load-share" class="btn ghost">Load Share Link</button>
        <button type="button" id="pf-editor-export" class="btn ghost">Export JSON</button>
        <button type="button" id="pf-editor-import" class="btn ghost">Import JSON</button>
      </div>
      <p class="pf-editor-help">Visual editor: choose a tile in the palette, then click/drag on the canvas to paint. Use wheel or slider to pan across full level.</p>
      <details class="pf-editor-advanced">
        <summary>Advanced JSON Editor</summary>
        <textarea id="pf-editor-json" class="pf-editor-json" spellcheck="false"></textarea>
      </details>
    </div>
    <p class="status" id="pf-status">Loading assets...</p>
    <div class="pf-canvas-wrap">
      <canvas class="pf-canvas" id="pf-canvas" width="${width}" height="${height}"></canvas>
      <div class="pf-overlay" id="pf-overlay" aria-live="polite"></div>
    </div>
    <div class="pf-touch" id="pf-touch" aria-label="Touch controls">
      <button type="button" data-act="left" class="pf-touch-btn">Left</button>
      <button type="button" data-act="right" class="pf-touch-btn">Right</button>
      <button type="button" data-act="jump" class="pf-touch-btn">Jump</button>
      <button type="button" data-act="dash" class="pf-touch-btn">Dash</button>
    </div>
  `;
  container.appendChild(root);

  const canvas = root.querySelector("#pf-canvas");
  const ctx = canvas.getContext("2d");
  const statusEl = root.querySelector("#pf-status");
  const overlayEl = root.querySelector("#pf-overlay");
  const livesEl = root.querySelector("#pf-lives");
  const coinsEl = root.querySelector("#pf-coins");
  const scoreEl = root.querySelector("#pf-score");
  const levelEl = root.querySelector("#pf-level");
  const timeEl = root.querySelector("#pf-time");
  const boostEl = root.querySelector("#pf-boost");
  const dashEl = root.querySelector("#pf-dash");
  const bestEl = root.querySelector("#pf-best");
  const pauseBtn = root.querySelector("#pf-pause");
  const resetBtn = root.querySelector("#pf-reset");
  const sfxBtn = root.querySelector("#pf-sfx");
  const musicBtn = root.querySelector("#pf-music");
  const editorToggleBtn = root.querySelector("#pf-editor-toggle");
  const sfxVolumeInput = root.querySelector("#pf-sfx-volume");
  const musicVolumeInput = root.querySelector("#pf-music-volume");
  const sfxVolumeValueEl = root.querySelector("#pf-sfx-volume-value");
  const musicVolumeValueEl = root.querySelector("#pf-music-volume-value");
  const editorPanelEl = root.querySelector("#pf-editor-panel");
  const editorPaletteEl = root.querySelector("#pf-editor-palette");
  const editorPrevBtn = root.querySelector("#pf-editor-prev");
  const editorNextBtn = root.querySelector("#pf-editor-next");
  const editorCloneBtn = root.querySelector("#pf-editor-clone");
  const editorDeleteBtn = root.querySelector("#pf-editor-delete");
  const editorLevelLabelEl = root.querySelector("#pf-editor-level-label");
  const editorPanLeftBtn = root.querySelector("#pf-editor-pan-left");
  const editorPanRightBtn = root.querySelector("#pf-editor-pan-right");
  const editorScrollEl = root.querySelector("#pf-editor-scroll");
  const editorShareBtn = root.querySelector("#pf-editor-share");
  const editorLoadShareBtn = root.querySelector("#pf-editor-load-share");
  const editorExportBtn = root.querySelector("#pf-editor-export");
  const editorImportBtn = root.querySelector("#pf-editor-import");
  const editorJsonEl = root.querySelector("#pf-editor-json");
  const touchEl = root.querySelector("#pf-touch");

  ctx.imageSmoothingEnabled = false;
  const theme = {
    name: "Sunset Dunes",
    skyTop: "#ffd19b",
    skyMid: "#ffb58e",
    skyBottom: "#f9a8ad",
    farHill: "rgba(162, 97, 112, 0.26)",
    nearHill: "rgba(133, 78, 123, 0.3)",
    cloud: "rgba(255, 245, 232, 0.82)",
    sunCore: "rgba(255, 214, 125, 0.96)",
    sunMid: "rgba(255, 161, 112, 0.48)",
    sunOuter: "rgba(255, 125, 120, 0)",
    sparkle: "rgba(255, 239, 215, 0.3)",
    groundHighlight: "rgba(255, 241, 214, 0.22)",
    coinAura: "rgba(255, 202, 107, 0.34)",
    dashTrail: "rgba(251, 146, 60, 0.32)",
    vignetteOuter: "rgba(56, 18, 66, 0.22)",
    boostRing: "rgba(255, 198, 109, 0.86)",
  };

  const physics = {
    gravity: 1720,
    moveSpeed: 250,
    accelGround: 2200,
    accelAir: 1380,
    frictionGround: 2850,
    frictionAir: 740,
    jumpSpeed: 620,
    maxFall: 980,
    coyoteWindow: 0.12,
    jumpBuffer: 0.14,
  };

  const spriteIndices = {
    groundTop: { x: 0, y: 0 },
    groundFill: { x: 0, y: 2 },
    crate: { x: 9, y: 0 },
    question: { x: 11, y: 0 },
    spike: { x: 9, y: 7 },
    spring: { x: 10, y: 5 },
    coin: { x: 11, y: 8 },
    flag: { x: 14, y: 6 },
    playerIdle: { x: 4, y: 2 },
    playerRunA: { x: 5, y: 2 },
    playerRunB: { x: 6, y: 2 },
    playerJump: { x: 3, y: 2 },
    enemy: { x: 7, y: 2 },
    enemyVault: { x: 8, y: 2 },
  };

  const fallbackLevels = [
    [
      "....................................................................................",
      "....................................................................................",
      "....................................................................................",
      ".....................................................c...........................K..",
      "............................c.............?.......####..............................",
      "............####.......................XXXX....................####.................",
      "....................................................................................",
      "............................ccc.....................................................",
      "...............XXXX....................c....................####.........?..........",
      "..S..............v............J....................####.........................F....",
      "##########....##########....#####....##########....#####....##########....##########",
      "##########....##########....#####....##########....#####....##########....##########",
      "##########....##########....#####....##########....#####....##########....##########",
      "##########....##########....#####....##########....#####....##########....##########",
      "##########....##########....#####....##########....#####....##########....##########",
    ],
    [
      "....................................................................................",
      "....................................................................................",
      "....................................................................................",
      ".......................c....................c......................c.............K..",
      ".............####..............####....................####.........................",
      ".....c...............?....e...............XXXX....................v..................",
      ".................####.........................####...........####...................",
      "......................^..........c....................^.............................",
      "..........####..............####...............####..............####...............",
      "..S....................J....................e..............####.................F...",
      "##########....##########....######....##########....######....##########....########",
      "##########....##########....######....##########....######....##########....########",
      "##########....##########....######....##########....######....##########....########",
      "##########....##########....######....##########....######....##########....########",
      "##########....##########....######....##########....######....##########....########",
    ],
    [
      "....................................................................................",
      "....................................................................................",
      "....................................................................................",
      "....................c...............c..............c...............c............K..",
      "........####...........####..................####..........####....................",
      "....e...........v.............e........v.............e..............?..............",
      ".............XXXX.....................XXXX.....................XXXX................",
      "..........^...........####.......^...........####.......^..........................",
      "....####........####..........####........####..........####........####...........",
      "..S.........J.............e.............J.............v.............J...........F..",
      "########....######....########....######....########....######....########....#####",
      "########....######....########....######....########....######....########....#####",
      "########....######....########....######....########....######....########....#####",
      "########....######....########....######....########....######....########....#####",
      "########....######....########....######....########....######....########....#####",
    ],
  ];
  const configuredLevels =
    window.PixelPlatformerConfig &&
    Array.isArray(window.PixelPlatformerConfig.levels) &&
    window.PixelPlatformerConfig.levels.length
      ? window.PixelPlatformerConfig.levels
      : null;
  let levels = JSON.parse(JSON.stringify(configuredLevels || fallbackLevels));

  const keys = new Set();
  const touchState = { left: false, right: false, jump: false, dash: false };
  let jumpQueued = 0;
  let dashQueued = false;
  let levelCoinCounts = [];
  let campaignCoinTotal = 0;
  function recalcLevelStats() {
    levelCoinCounts = levels.map((rows) => rows.join("").split("").filter((ch) => ch === "c").length);
    campaignCoinTotal = levelCoinCounts.reduce((sum, value) => sum + value, 0);
  }
  recalcLevelStats();
  let loadedFromSharedHash = false;
  if (window.location.hash && window.location.hash.startsWith("#pflevel=")) {
    const encoded = window.location.hash.slice("#pflevel=".length);
    const sharedLevels = decodeLevelsFromShare(encoded);
    if (sharedLevels) {
      levels = sharedLevels;
      recalcLevelStats();
      loadedFromSharedHash = true;
    }
  }

  function replaceCharAt(input, idx, ch) {
    if (idx < 0 || idx >= input.length) {
      return input;
    }
    return `${input.slice(0, idx)}${ch}${input.slice(idx + 1)}`;
  }

  function normalizeLevels(rawLevels) {
    if (!Array.isArray(rawLevels) || !rawLevels.length) {
      return null;
    }
    const nextLevels = [];
    for (let i = 0; i < rawLevels.length; i += 1) {
      const rows = rawLevels[i];
      if (!Array.isArray(rows) || !rows.length) {
        return null;
      }
      const castRows = rows.map((r) => String(r));
      const width = castRows.reduce((m, row) => Math.max(m, row.length), 0);
      nextLevels.push(castRows.map((row) => row.padEnd(width, ".")));
    }
    return nextLevels;
  }

  function syncEditorJson() {
    if (!editorJsonEl) {
      return;
    }
    const payload = {
      version: 1,
      levels,
      tileLegend: window.PixelPlatformerConfig && window.PixelPlatformerConfig.tileLegend ? window.PixelPlatformerConfig.tileLegend : undefined,
    };
    editorJsonEl.value = JSON.stringify(payload, null, 2);
  }

  function syncLevelsToConfig() {
    if (window.PixelPlatformerConfig) {
      window.PixelPlatformerConfig.levels = JSON.parse(JSON.stringify(levels));
    }
  }

  function encodeLevelsForShare(levelSet) {
    const raw = JSON.stringify({ v: 1, levels: levelSet });
    return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeLevelsFromShare(encoded) {
    try {
      const base = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base + "===".slice((base.length + 3) % 4);
      const raw = decodeURIComponent(escape(atob(padded)));
      const parsed = JSON.parse(raw);
      const candidate = parsed && Array.isArray(parsed.levels) ? parsed.levels : null;
      return normalizeLevels(candidate);
    } catch (_) {
      return null;
    }
  }

  function setCameraX(next) {
    const maxCam = Math.max(0, world.width * tileSize - width);
    cameraX = Math.max(0, Math.min(maxCam, next));
    if (editorScrollEl) {
      editorScrollEl.max = String(Math.ceil(maxCam));
      editorScrollEl.value = String(Math.round(cameraX));
    }
  }

  function panEditorBy(delta) {
    if (!editorMode) {
      return;
    }
    setCameraX(cameraX + delta);
  }

  let assetsReady = false;
  let tilesImg = null;
  let charsImg = null;

  let currentLevelIndex = 0;
  let lives = 3;
  let runCoins = 0;
  let score = 0;
  let runCoinsTotal = 0;
  let levelTime = 0;
  let boostTimer = 0;
  let dashCooldown = 0;
  let dashTimer = 0;
  let gameState = "loading";
  let paused = false;
  let rafId = null;
  let lastTs = performance.now();
  let visualClock = 0;
  let soundEnabled = true;
  let musicEnabled = true;
  let audioCtx = null;
  let musicStep = 0;
  let musicNextAt = 0;
  let sfxVolume = 0.7;
  let musicVolume = 0.6;
  const volumeStoreKey = "pixelPlatformerAudioV1";
  const bestTimeStoreKey = "pixelPlatformerBestTimesV1";
  let bestTimesByLevel = Array(levels.length).fill(null);

  try {
    const saved = JSON.parse(window.localStorage.getItem(volumeStoreKey) || "null");
    if (saved && typeof saved === "object") {
      if (typeof saved.sfxVolume === "number") {
        sfxVolume = Math.max(0, Math.min(1, saved.sfxVolume));
      }
      if (typeof saved.musicVolume === "number") {
        musicVolume = Math.max(0, Math.min(1, saved.musicVolume));
      }
      if (typeof saved.soundEnabled === "boolean") {
        soundEnabled = saved.soundEnabled;
      }
      if (typeof saved.musicEnabled === "boolean") {
        musicEnabled = saved.musicEnabled;
      }
    }
  } catch (_) {}
  try {
    const savedBest = JSON.parse(window.localStorage.getItem(bestTimeStoreKey) || "null");
    if (Array.isArray(savedBest)) {
      bestTimesByLevel = savedBest.slice(0, levels.length).map((v) => (Number.isFinite(v) ? v : null));
      while (bestTimesByLevel.length < levels.length) {
        bestTimesByLevel.push(null);
      }
    }
  } catch (_) {}

  let world = {
    tiles: [],
    width: 0,
    height: 0,
    start: { x: tileSize, y: tileSize },
    respawn: { x: tileSize, y: tileSize },
    goalX: 0,
    coins: [],
    enemies: [],
    checkpoints: [],
  };
  const tutorialHintsShown = new Set();
  let editorMode = false;
  let editorBrush = ".";
  let editorPointerDown = false;
  const editorPalette = [
    { ch: ".", label: "Empty", cls: "empty" },
    { ch: "#", label: "Ground", cls: "ground" },
    { ch: "X", label: "Crate", cls: "crate" },
    { ch: "?", label: "Boost", cls: "boost" },
    { ch: "^", label: "Spike", cls: "spike" },
    { ch: "J", label: "Spring", cls: "spring" },
    { ch: "c", label: "Coin", cls: "coin" },
    { ch: "e", label: "Enemy", cls: "enemy" },
    { ch: "v", label: "Vault", cls: "vault" },
    { ch: "S", label: "Start", cls: "start" },
    { ch: "F", label: "Finish", cls: "finish" },
    { ch: "K", label: "Checkpoint", cls: "checkpoint" },
  ];

  function syncBestTimesLength() {
    if (bestTimesByLevel.length > levels.length) {
      bestTimesByLevel = bestTimesByLevel.slice(0, levels.length);
      return;
    }
    while (bestTimesByLevel.length < levels.length) {
      bestTimesByLevel.push(null);
    }
  }

  function renderEditorPalette() {
    if (!editorPaletteEl) {
      return;
    }
    editorPaletteEl.innerHTML = "";
    editorPalette.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `pf-editor-tile ${item.cls}${editorBrush === item.ch ? " active" : ""}`;
      btn.dataset.brush = item.ch;
      btn.innerHTML = `<span class=\"glyph\">${item.ch}</span><span class=\"label\">${item.label}</span>`;
      btn.addEventListener("click", () => {
        editorBrush = item.ch;
        renderEditorPalette();
        if (editorMode) {
          statusEl.textContent = `Editor mode: painting '${editorBrush}' on level ${currentLevelIndex + 1}.`;
        }
      });
      editorPaletteEl.appendChild(btn);
    });
  }

  const player = {
    x: 0,
    y: 0,
    w: 28,
    h: 32,
    vx: 0,
    vy: 0,
    dir: 1,
    onGround: false,
    coyote: 0,
    invuln: 0,
    runAnim: 0,
    canDash: true,
    trail: [],
  };

  let cameraX = 0;
  let fxParticles = [];
  const screenShake = { timer: 0, strength: 0 };
  const ambientSparkles = Array.from({ length: 28 }, (_, i) => ({
    x: (i * 137) % width,
    y: 40 + ((i * 79) % Math.floor(height * 0.62)),
    size: 1 + (i % 3),
    speed: 8 + (i % 5) * 2.4,
    phase: i * 0.73,
  }));
  const retroTheme = [
    { midi: 64, beat: 0.5 }, { midi: 67, beat: 0.5 }, { midi: 71, beat: 0.5 }, { midi: 72, beat: 0.5 },
    { midi: 71, beat: 0.5 }, { midi: 67, beat: 0.5 }, { midi: 64, beat: 0.5 }, { midi: 62, beat: 0.5 },
    { midi: 60, beat: 0.5 }, { midi: 64, beat: 0.5 }, { midi: 67, beat: 0.5 }, { midi: 69, beat: 0.5 },
    { midi: 67, beat: 0.5 }, { midi: 64, beat: 0.5 }, { midi: 62, beat: 0.5 }, { midi: 60, beat: 0.5 },
  ];

  function approach(current, target, delta) {
    if (current < target) {
      return Math.min(current + delta, target);
    }
    return Math.max(current - delta, target);
  }

  function midiToFreq(midi) {
    return 440 * (2 ** ((midi - 69) / 12));
  }

  function getAudioContext() {
    const ACtx = window.AudioContext || window.webkitAudioContext;
    if (!ACtx) {
      return null;
    }
    if (!audioCtx) {
      audioCtx = new ACtx();
      musicStep = 0;
      musicNextAt = audioCtx.currentTime + 0.08;
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function persistAudioSettings() {
    try {
      window.localStorage.setItem(
        volumeStoreKey,
        JSON.stringify({ sfxVolume, musicVolume, soundEnabled, musicEnabled })
      );
    } catch (_) {}
  }

  function playSfx(opts) {
    if (!soundEnabled) {
      return;
    }
    const aCtx = getAudioContext();
    if (!aCtx) {
      return;
    }
    const o = aCtx.createOscillator();
    const g = aCtx.createGain();
    const type = opts.type || "square";
    const duration = opts.duration || 0.08;
    const volume = (opts.volume || 0.05) * sfxVolume;
    const freq = opts.freq || 440;
    const slide = opts.slideTo || null;

    o.type = type;
    o.frequency.setValueAtTime(freq, aCtx.currentTime);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(24, slide), aCtx.currentTime + duration);
    }
    g.gain.setValueAtTime(volume, aCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, aCtx.currentTime + duration);
    o.connect(g);
    g.connect(aCtx.destination);
    o.start();
    o.stop(aCtx.currentTime + duration);
  }

  function scheduleToneAt(time, midi, duration, volume, type) {
    const aCtx = getAudioContext();
    if (!aCtx || !musicEnabled) {
      return;
    }
    const o = aCtx.createOscillator();
    const g = aCtx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(midiToFreq(midi), time);
    g.gain.setValueAtTime(volume * musicVolume, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g);
    g.connect(aCtx.destination);
    o.start(time);
    o.stop(time + duration);
  }

  function scheduleMusic() {
    const aCtx = getAudioContext();
    if (!aCtx || !musicEnabled || paused || gameState !== "running") {
      return;
    }
    const beatSeconds = 0.24;
    const lookAhead = 0.35;
    while (musicNextAt < aCtx.currentTime + lookAhead) {
      const note = retroTheme[musicStep % retroTheme.length];
      const dur = Math.max(0.08, note.beat * beatSeconds * 0.8);
      scheduleToneAt(musicNextAt, note.midi, dur, 0.018, musicStep % 4 === 0 ? "triangle" : "square");
      if (musicStep % 2 === 0) {
        scheduleToneAt(musicNextAt, note.midi - 12, dur * 0.95, 0.012, "triangle");
      }
      musicNextAt += note.beat * beatSeconds;
      musicStep += 1;
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }

  function parseLevel(index, options) {
    const opts = options || {};
    const rowsRaw = levels[index];
    const levelWidth = rowsRaw.reduce((max, row) => Math.max(max, row.length), 0);
    const rows = rowsRaw.map((row) => row.padEnd(levelWidth, "."));
    const mapHasGroundAt = (x, y) => {
      if (x < 0 || x >= levelWidth || y < 0 || y >= rows.length) {
        return false;
      }
      const ch = rows[y][x];
      return ch === "#" || ch === "?" || ch === "X" || ch === "J";
    };
    const parsed = [];
    const coins = [];
    const enemies = [];
    const checkpoints = [];
    let start = null;
    let goalX = rows[0].length * tileSize - tileSize * 2;

    for (let y = 0; y < rows.length; y += 1) {
      const row = rows[y];
      const outRow = [];
      for (let x = 0; x < row.length; x += 1) {
        const ch = row[x];
        if (ch === "S") {
          start = { x: x * tileSize + 4, y: y * tileSize - 6 };
          outRow.push(".");
        } else if (ch === "K") {
          checkpoints.push({ x: x * tileSize + 6, y: y * tileSize - tileSize * 2.8, active: false });
          outRow.push("K");
        } else if (ch === "c") {
          coins.push({ x: x * tileSize + tileSize * 0.5, y: y * tileSize + tileSize * 0.5, taken: false });
          outRow.push(".");
        } else if (ch === "e" || ch === "v") {
          // Keep enemy spawns intuitive: only place enemies with solid ground beneath.
          if (!mapHasGroundAt(x, y + 1)) {
            outRow.push(".");
            continue;
          }
          const allowEnemy = index === 0 ? (x + y) % 3 !== 0 : index === 1 ? (x + y) % 5 !== 0 : true;
          if (!allowEnemy) {
            outRow.push(".");
            continue;
          }
          const dir = (x + y) % 2 === 0 ? -1 : 1;
          enemies.push({
            x: x * tileSize + 4,
            y: y * tileSize + 4,
            w: 28,
            h: 26,
            vx: dir * (76 + index * 10),
            vy: 0,
            alive: true,
            type: ch === "v" ? "vault" : "walker",
          });
          outRow.push(".");
        } else if (ch === "^") {
          // Difficulty ramp: level 1 has no spikes, level 2 has reduced spike density.
          const keepSpike = index === 0 ? false : index === 1 ? x % 2 === 0 : true;
          outRow.push(keepSpike ? "^" : ".");
        } else if (ch === "F") {
          goalX = x * tileSize;
          outRow.push("F");
        } else {
          outRow.push(ch);
        }
      }
      parsed.push(outRow);
    }

    world = {
      tiles: parsed,
      width: levelWidth,
      height: rows.length,
      start: start || { x: tileSize * 2, y: tileSize * 8 },
      respawn: start || { x: tileSize * 2, y: tileSize * 8 },
      goalX,
      coins,
      enemies,
      checkpoints,
    };

    respawnPlayer();
    if (!opts.preserveTime) {
      levelTime = 0;
    }
    if (opts.keepCamera) {
      setCameraX(cameraX);
    } else {
      setCameraX(0);
    }
    gameState = "running";
    paused = Boolean(opts.editorMode);
    if (!opts.editorMode) {
      tutorialHintsShown.clear();
    }
    overlayEl.textContent = "";
    if (opts.editorMode) {
      statusEl.textContent = `Editor mode: painting '${editorBrush}' on level ${currentLevelIndex + 1}.`;
    } else {
      statusEl.textContent = index === 0
        ? "Level 1 tutorial: break crates, vault drones, springs, boost blocks, checkpoints, dash."
        : `Level ${currentLevelIndex + 1}: reach the flag.`;
    }
    syncHud();
  }

  function respawnPlayer() {
    player.x = world.respawn.x;
    player.y = world.respawn.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.coyote = 0;
    player.invuln = 1.2;
    player.canDash = true;
    dashTimer = 0;
    dashCooldown = Math.max(dashCooldown, 0.4);
  }

  function resetRun() {
    currentLevelIndex = 0;
    lives = 3;
    runCoins = 0;
    score = 0;
    runCoinsTotal = campaignCoinTotal;
    boostTimer = 0;
    dashCooldown = 0;
    dashTimer = 0;
    parseLevel(currentLevelIndex);
    playSfx({ freq: 330, slideTo: 520, duration: 0.12, volume: 0.05 });
  }

  function tileAt(tx, ty) {
    if (tx < 0 || tx >= world.width || ty < 0) {
      return "#";
    }
    if (ty >= world.height) {
      return ".";
    }
    return world.tiles[ty][tx];
  }

  function isSolid(ch) {
    return ch === "#" || ch === "?" || ch === "X" || ch === "J";
  }

  function isBreakable(ch) {
    return ch === "X";
  }

  function addScore(points) {
    score += Math.max(0, Math.floor(points));
  }

  function startShake(strength, duration) {
    screenShake.strength = Math.max(screenShake.strength, strength);
    screenShake.timer = Math.max(screenShake.timer, duration);
  }

  function emitParticles(x, y, opts) {
    const count = opts.count || 10;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.minSpeed || 40) + Math.random() * ((opts.maxSpeed || 180) - (opts.minSpeed || 40));
      fxParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (opts.vxBias || 0),
        vy: Math.sin(angle) * speed + (opts.vyBias || 0),
        life: (opts.life || 0.4) * (0.7 + Math.random() * 0.7),
        size: (opts.size || 2) * (0.8 + Math.random() * 0.7),
        color: opts.color || "rgba(255,255,255,0.8)",
      });
    }
  }

  function updateFxParticles(dt) {
    for (let i = 0; i < fxParticles.length; i += 1) {
      const p = fxParticles[i];
      p.vy += 420 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    fxParticles = fxParticles.filter((p) => p.life > 0);
    if (screenShake.timer > 0) {
      screenShake.timer -= dt;
      if (screenShake.timer <= 0) {
        screenShake.timer = 0;
        screenShake.strength = 0;
      }
    }
  }

  function triggerDash() {
    if (!player.canDash || dashCooldown > 0 || dashTimer > 0 || paused || gameState !== "running") {
      return false;
    }
    const moveLeft = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || touchState.left;
    const moveRight = keys.has("ArrowRight") || keys.has("d") || keys.has("D") || touchState.right;
    let dir = player.dir || 1;
    if (moveLeft && !moveRight) {
      dir = -1;
    } else if (moveRight && !moveLeft) {
      dir = 1;
    }
    player.dir = dir;
    dashTimer = 0.16;
    dashCooldown = 1.15;
    player.canDash = false;
    player.invuln = Math.max(player.invuln, 0.18);
    player.vx = dir * 560;
    player.vy *= 0.25;
    startShake(1.8, 0.08);
    emitParticles(player.x + player.w * 0.5, player.y + player.h * 0.55, {
      count: 10,
      minSpeed: 90,
      maxSpeed: 190,
      life: 0.26,
      color: "rgba(56,189,248,0.72)",
    });
    playSfx({ freq: 290, slideTo: 520, duration: 0.07, volume: 0.05, type: "sawtooth" });
    return true;
  }

  function activateRushBoost(duration) {
    boostTimer = Math.max(boostTimer, duration);
    startShake(1.4, 0.1);
    emitParticles(player.x + player.w * 0.5, player.y + player.h * 0.5, {
      count: 12,
      minSpeed: 70,
      maxSpeed: 180,
      life: 0.34,
      color: "rgba(250,204,21,0.78)",
    });
    playSfx({ freq: 710, slideTo: 910, duration: 0.11, volume: 0.045, type: "triangle" });
    statusEl.textContent = "Rush boost active: faster run and higher jump.";
    addScore(20);
  }

  function isHazard(ch) {
    return ch === "^";
  }

  function hasSolidAtWorld(x, y) {
    const tx = Math.floor(x / tileSize);
    const ty = Math.floor(y / tileSize);
    return isSolid(tileAt(tx, ty));
  }

  function resolveHorizontal(entity, dt) {
    entity.x += entity.vx * dt;
    const minX = Math.floor(entity.x / tileSize);
    const maxX = Math.floor((entity.x + entity.w - 0.001) / tileSize);
    const minY = Math.floor(entity.y / tileSize);
    const maxY = Math.floor((entity.y + entity.h - 0.001) / tileSize);

    for (let ty = minY; ty <= maxY; ty += 1) {
      for (let tx = minX; tx <= maxX; tx += 1) {
        if (!isSolid(tileAt(tx, ty))) {
          continue;
        }
        const tileX = tx * tileSize;
        if (entity.vx > 0) {
          entity.x = tileX - entity.w;
        } else if (entity.vx < 0) {
          entity.x = tileX + tileSize;
        }
        entity.vx = 0;
      }
    }
  }

  function resolveVertical(entity, dt) {
    entity.y += entity.vy * dt;
    const minX = Math.floor(entity.x / tileSize);
    const maxX = Math.floor((entity.x + entity.w - 0.001) / tileSize);
    const minY = Math.floor(entity.y / tileSize);
    const maxY = Math.floor((entity.y + entity.h - 0.001) / tileSize);

    for (let ty = minY; ty <= maxY; ty += 1) {
      for (let tx = minX; tx <= maxX; tx += 1) {
        if (!isSolid(tileAt(tx, ty))) {
          continue;
        }
        const tileCh = tileAt(tx, ty);
        const tileY = ty * tileSize;
        if (entity.vy > 0) {
          entity.y = tileY - entity.h;
          if (tileCh === "J" && entity === player) {
            const jumpBase = physics.jumpSpeed * (boostTimer > 0 ? 1.08 : 1);
            entity.vy = -jumpBase * 1.22;
            entity.onGround = false;
            emitParticles(entity.x + entity.w * 0.5, tileY + tileSize - 4, {
              count: 8,
              minSpeed: 40,
              maxSpeed: 140,
              vyBias: -40,
              life: 0.24,
              color: "rgba(74,222,128,0.68)",
            });
            playSfx({ freq: 430, slideTo: 670, duration: 0.11, volume: 0.05, type: "triangle" });
          } else {
            entity.vy = 0;
            if (entity === player) {
              entity.onGround = true;
            }
          }
        } else if (entity.vy < 0) {
          if (entity === player && tileCh === "?") {
            world.tiles[ty][tx] = "X";
            entity.vy = 110;
            activateRushBoost(5.4);
            continue;
          }
          if (entity === player && isBreakable(tileCh)) {
            world.tiles[ty][tx] = ".";
            entity.vy = 120;
            addScore(8);
            startShake(1.2, 0.07);
            emitParticles(tx * tileSize + tileSize * 0.5, ty * tileSize + tileSize * 0.5, {
              count: 14,
              minSpeed: 50,
              maxSpeed: 200,
              life: 0.34,
              color: "rgba(180,132,95,0.76)",
            });
            playSfx({ freq: 260, slideTo: 420, duration: 0.1, volume: 0.05, type: "square" });
            continue;
          }
          entity.y = tileY + tileSize;
          entity.vy = 0;
        }
      }
    }
  }

  function queueJump() {
    jumpQueued = physics.jumpBuffer;
  }

  function isJumpPressed() {
    return keys.has(" ") || keys.has("w") || keys.has("W") || keys.has("ArrowUp") || touchState.jump;
  }

  function updatePlayer(dt) {
    const moveLeft = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || touchState.left;
    const moveRight = keys.has("ArrowRight") || keys.has("d") || keys.has("D") || touchState.right;

    let moveDir = 0;
    if (moveLeft && !moveRight) {
      moveDir = -1;
    } else if (moveRight && !moveLeft) {
      moveDir = 1;
    }

    if (boostTimer > 0) {
      boostTimer = Math.max(0, boostTimer - dt);
    }
    if (dashCooldown > 0) {
      dashCooldown = Math.max(0, dashCooldown - dt);
    }
    if (dashQueued || touchState.dash) {
      triggerDash();
      dashQueued = false;
      touchState.dash = false;
    }
    const speedScale = boostTimer > 0 ? 1.28 : 1;
    const jumpScale = boostTimer > 0 ? 1.08 : 1;
    const targetVx = moveDir * physics.moveSpeed * speedScale;
    const accel = player.onGround ? physics.accelGround : physics.accelAir;
    const friction = player.onGround ? physics.frictionGround : physics.frictionAir;
    if (dashTimer > 0) {
      dashTimer = Math.max(0, dashTimer - dt);
      player.vx = player.dir * 560;
      player.vy = Math.max(player.vy, -120);
      player.trail.push({ x: player.x + player.w * 0.5, y: player.y + player.h * 0.5, life: 0.16 });
    } else if (moveDir !== 0) {
      player.vx = approach(player.vx, targetVx, accel * dt);
    } else {
      player.vx = approach(player.vx, 0, friction * dt);
    }
    for (let i = 0; i < player.trail.length; i += 1) {
      player.trail[i].life -= dt;
    }
    player.trail = player.trail.filter((t) => t.life > 0);
    if (dashTimer <= 0 && player.trail.length > 10) {
      player.trail = player.trail.slice(-10);
    }
    if (moveDir !== 0) {
      player.dir = moveDir;
      player.runAnim += dt * 10;
    }

    const wasOnGround = player.onGround;
    player.vy = Math.min(player.vy + physics.gravity * dt, physics.maxFall);
    player.onGround = false;

    player.coyote = wasOnGround ? physics.coyoteWindow : Math.max(0, player.coyote - dt);
    if (jumpQueued > 0) {
      jumpQueued -= dt;
    }

    if (jumpQueued > 0 && (wasOnGround || player.coyote > 0 || (isJumpPressed() && player.vy === 0))) {
      player.vy = -physics.jumpSpeed * jumpScale;
      jumpQueued = 0;
      player.onGround = false;
      player.coyote = 0;
      player.canDash = true;
      playSfx({ freq: 390, slideTo: 290, duration: 0.09, volume: 0.045 });
    }

    if (!isJumpPressed() && player.vy < -80) {
      player.vy += physics.gravity * dt * 1.3;
    }

    const preResolveVy = player.vy;
    resolveHorizontal(player, dt);
    resolveVertical(player, dt);

    if (player.onGround) {
      if (!wasOnGround && preResolveVy > 220) {
        emitParticles(player.x + player.w * 0.5, player.y + player.h, {
          count: 9,
          minSpeed: 40,
          maxSpeed: 140,
          vyBias: -30,
          life: 0.22,
          color: "rgba(148,163,184,0.54)",
        });
      }
      player.coyote = physics.coyoteWindow;
      player.canDash = true;
    }

    if (player.y > world.height * tileSize + 120) {
      damagePlayer("You fell into a pit.");
      return;
    }

    const footY = player.y + player.h;
    const leftX = player.x + 4;
    const rightX = player.x + player.w - 4;
    const hazardTiles = [
      tileAt(Math.floor(leftX / tileSize), Math.floor(footY / tileSize)),
      tileAt(Math.floor(rightX / tileSize), Math.floor(footY / tileSize)),
    ];
    if (hazardTiles.some((ch) => isHazard(ch))) {
      damagePlayer("Spikes hit you.");
      return;
    }

    if (player.invuln > 0) {
      player.invuln -= dt;
    }
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function updateCoins() {
    for (const coin of world.coins) {
      if (coin.taken) {
        continue;
      }
      const box = { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 };
      if (rectsOverlap(player, box)) {
        coin.taken = true;
        runCoins += 1;
        addScore(10);
        emitParticles(coin.x, coin.y, {
          count: 8,
          minSpeed: 50,
          maxSpeed: 160,
          life: 0.2,
          color: "rgba(253,224,71,0.8)",
        });
        playSfx({ freq: 960, slideTo: 1220, duration: 0.08, volume: 0.04, type: "triangle" });
      }
    }
  }

  function updateCheckpoints() {
    for (let i = 0; i < world.checkpoints.length; i += 1) {
      const cp = world.checkpoints[i];
      const zone = { x: cp.x - 10, y: cp.y + tileSize * 0.3, w: 22, h: tileSize * 2.5 };
      if (!cp.active && rectsOverlap(player, zone)) {
        world.checkpoints.forEach((other) => {
          other.active = false;
        });
        cp.active = true;
        world.respawn = { x: cp.x - 2, y: cp.y + tileSize * 1.5 };
        statusEl.textContent = "Checkpoint activated.";
        addScore(20);
        emitParticles(cp.x + 8, cp.y + tileSize * 0.35, {
          count: 10,
          minSpeed: 40,
          maxSpeed: 140,
          life: 0.28,
          color: "rgba(34,197,94,0.72)",
        });
        playSfx({ freq: 540, slideTo: 760, duration: 0.1, volume: 0.04, type: "triangle" });
      }
    }
  }

  function damagePlayer(reason) {
    if (player.invuln > 0) {
      return;
    }
    lives -= 1;
    if (lives <= 0) {
      lives = 0;
      gameState = "gameover";
      paused = true;
      statusEl.textContent = `${reason} Run over. Press Restart Run.`;
      overlayEl.textContent = "GAME OVER";
      startShake(4.8, 0.28);
      emitParticles(player.x + player.w * 0.5, player.y + player.h * 0.5, {
        count: 16,
        minSpeed: 80,
        maxSpeed: 220,
        life: 0.36,
        color: "rgba(248,113,113,0.78)",
      });
      playSfx({ freq: 240, slideTo: 100, duration: 0.24, volume: 0.06, type: "sawtooth" });
      syncHud();
      return;
    }
    statusEl.textContent = `${reason} Respawning...`;
    respawnPlayer();
    startShake(2.2, 0.12);
    playSfx({ freq: 180, slideTo: 130, duration: 0.13, volume: 0.055, type: "sawtooth" });
    syncHud();
  }

  function updateEnemies(dt) {
    for (const enemy of world.enemies) {
      if (!enemy.alive) {
        continue;
      }

      if (enemy.type === "vault") {
        const px = player.x + player.w * 0.5;
        const ex = enemy.x + enemy.w * 0.5;
        const passedAbove = Math.abs(px - ex) < enemy.w * 0.8 && player.y + player.h < enemy.y + 2 && player.vy !== 0;
        if (passedAbove) {
          enemy.alive = false;
          statusEl.textContent = "Vault drone disabled: jump over blue drones to defeat them.";
          addScore(35);
          startShake(1.4, 0.08);
          emitParticles(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, {
            count: 10,
            minSpeed: 70,
            maxSpeed: 190,
            life: 0.24,
            color: "rgba(96,165,250,0.76)",
          });
          playSfx({ freq: 520, slideTo: 880, duration: 0.12, volume: 0.045, type: "triangle" });
          continue;
        }
      }

      enemy.vy = Math.min(enemy.vy + physics.gravity * dt, physics.maxFall);
      const prevX = enemy.x;

      resolveHorizontal(enemy, dt);
      if (enemy.x === prevX) {
        enemy.vx *= -1;
      }

      resolveVertical(enemy, dt);

      const checkX = enemy.vx >= 0 ? enemy.x + enemy.w + 2 : enemy.x - 2;
      const groundY = enemy.y + enemy.h + 2;
      if (!hasSolidAtWorld(checkX, groundY)) {
        enemy.vx *= -1;
      }

      if (enemy.y > world.height * tileSize + 120) {
        enemy.alive = false;
        continue;
      }

      if (rectsOverlap(player, enemy)) {
        if (enemy.type === "vault") {
          damagePlayer("Vault drone: jump over it to disable it.");
          return;
        } else {
          const stomp = player.vy > 120 && player.y + player.h - enemy.y < 16;
          if (stomp) {
            enemy.alive = false;
            player.vy = -physics.jumpSpeed * 0.5;
            statusEl.textContent = "Enemy stomped.";
            addScore(25);
            startShake(1.2, 0.07);
            emitParticles(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, {
              count: 9,
              minSpeed: 60,
              maxSpeed: 170,
              life: 0.24,
              color: "rgba(167,243,208,0.74)",
            });
            playSfx({ freq: 190, slideTo: 120, duration: 0.07, volume: 0.045 });
          } else {
            damagePlayer("Enemy collision.");
            return;
          }
        }
      }
    }
  }

  function updateTutorialHints() {
    if (currentLevelIndex !== 0) {
      return;
    }
    if (player.x > tileSize * 10 && !tutorialHintsShown.has("break")) {
      tutorialHintsShown.add("break");
      statusEl.textContent = "Tutorial: jump into brown crates from below to break them.";
    }
    if (player.x > tileSize * 15 && !tutorialHintsShown.has("vault")) {
      tutorialHintsShown.add("vault");
      statusEl.textContent = "Tutorial: blue drones are defeated by jumping over them.";
    }
    if (player.x > tileSize * 22 && !tutorialHintsShown.has("spring")) {
      tutorialHintsShown.add("spring");
      statusEl.textContent = "Tutorial: green spring blocks launch you much higher.";
    }
    if (player.x > tileSize * 30 && !tutorialHintsShown.has("boost")) {
      tutorialHintsShown.add("boost");
      statusEl.textContent = "Tutorial: hit yellow ? blocks from below for a temporary rush boost.";
    }
    if (player.x > tileSize * 38 && !tutorialHintsShown.has("checkpoint")) {
      tutorialHintsShown.add("checkpoint");
      statusEl.textContent = "Tutorial: touch red checkpoint flags to update respawn point.";
    }
    if (player.x > tileSize * 46 && !tutorialHintsShown.has("dash")) {
      tutorialHintsShown.add("dash");
      statusEl.textContent = "Tutorial: press Shift (or Dash button) for a quick burst.";
    }
  }

  function updateGoalAndProgress() {
    const playerFront = player.x + player.w;
    if (playerFront >= world.goalX + tileSize * 0.4) {
      const finishedLevel = currentLevelIndex;
      const previousBest = bestTimesByLevel[finishedLevel];
      const timeBonus = Math.max(0, Math.round(280 - levelTime * 18));
      addScore(150 + timeBonus);
      if (previousBest === null || levelTime < previousBest) {
        bestTimesByLevel[finishedLevel] = levelTime;
        try {
          window.localStorage.setItem(bestTimeStoreKey, JSON.stringify(bestTimesByLevel));
        } catch (_) {}
      }
      if (currentLevelIndex >= levels.length - 1) {
        gameState = "cleared";
        paused = true;
        overlayEl.textContent = "CONGRATULATIONS!";
        const finalBest = bestTimesByLevel[finishedLevel];
        const bestLabel = Number.isFinite(finalBest) ? finalBest.toFixed(1) : "--";
        statusEl.textContent = `All levels completed. Score: ${score}. Coins: ${runCoins}/${runCoinsTotal}. L${finishedLevel + 1} best: ${bestLabel}s.`;
        const aCtx = getAudioContext();
        if (musicEnabled && aCtx) {
          const t = aCtx.currentTime + 0.02;
          scheduleToneAt(t, 72, 0.11, 0.04, "triangle");
          scheduleToneAt(t + 0.11, 76, 0.11, 0.04, "triangle");
          scheduleToneAt(t + 0.22, 79, 0.2, 0.05, "triangle");
        }
      } else {
        currentLevelIndex += 1;
        const improved = previousBest === null || levelTime <= previousBest;
        statusEl.textContent = improved
          ? `Level ${finishedLevel + 1} complete. New best time.`
          : `Level ${finishedLevel + 1} complete. Loading next level...`;
        playSfx({ freq: 540, slideTo: 760, duration: 0.12, volume: 0.05, type: "square" });
        parseLevel(currentLevelIndex);
      }
      syncHud();
    }
  }

  function updateCamera() {
    const worldWidth = world.width * tileSize;
    const maxCamX = Math.max(0, worldWidth - width);
    const target = player.x + player.w * 0.5 - width * 0.45;
    const lookAhead = player.vx * 0.28;
    cameraX += (target + lookAhead - cameraX) * 0.12;
    cameraX = Math.max(0, Math.min(maxCamX, cameraX));
  }

  function syncHud() {
    livesEl.textContent = String(lives);
    coinsEl.textContent = `${runCoins} / ${runCoinsTotal}`;
    scoreEl.textContent = String(score);
    levelEl.textContent = `${Math.min(currentLevelIndex + 1, levels.length)} / ${levels.length}`;
    timeEl.textContent = `${levelTime.toFixed(1)}s`;
    boostEl.textContent = boostTimer > 0 ? `${boostTimer.toFixed(1)}s` : "Off";
    dashEl.textContent = dashTimer > 0 ? "Active" : dashCooldown > 0 ? `${dashCooldown.toFixed(1)}s` : "Ready";
    const best = bestTimesByLevel[currentLevelIndex];
    bestEl.textContent = Number.isFinite(best) ? `${best.toFixed(1)}s` : "--";
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    sfxBtn.textContent = soundEnabled ? "SFX: On" : "SFX: Off";
    musicBtn.textContent = musicEnabled ? "Music: On" : "Music: Off";
    if (sfxVolumeValueEl) {
      sfxVolumeValueEl.textContent = `${Math.round(sfxVolume * 100)}%`;
    }
    if (musicVolumeValueEl) {
      musicVolumeValueEl.textContent = `${Math.round(musicVolume * 100)}%`;
    }
    if (editorToggleBtn) {
      editorToggleBtn.textContent = editorMode ? "Editor: On" : "Editor: Off";
    }
    if (editorPanelEl) {
      editorPanelEl.hidden = !editorMode;
    }
    if (editorLevelLabelEl) {
      editorLevelLabelEl.textContent = `Level ${currentLevelIndex + 1} / ${levels.length}`;
    }
    if (editorPrevBtn) {
      editorPrevBtn.disabled = currentLevelIndex <= 0;
    }
    if (editorNextBtn) {
      editorNextBtn.disabled = currentLevelIndex >= levels.length - 1;
    }
    if (editorDeleteBtn) {
      editorDeleteBtn.disabled = levels.length <= 1;
    }
    if (editorScrollEl) {
      const maxCam = Math.max(0, world.width * tileSize - width);
      editorScrollEl.max = String(Math.ceil(maxCam));
      editorScrollEl.value = String(Math.round(cameraX));
    }
    overlayEl.classList.toggle("show", paused && (gameState === "gameover" || gameState === "cleared"));
  }

  function drawSprite(sheet, idx, dx, dy, dw, dh, sourceSize) {
    const sx = idx.x * (sourceSize + sourceGap);
    const sy = idx.y * (sourceSize + sourceGap);
    ctx.drawImage(sheet, sx, sy, sourceSize, sourceSize, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(0.58, theme.skyMid);
    sky.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const hillOffset = -(cameraX * 0.16) % (width + 120);
    ctx.fillStyle = theme.farHill;
    for (let i = -2; i < 6; i += 1) {
      const x = hillOffset + i * 240;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.quadraticCurveTo(x + 110, height - 180, x + 220, height);
      ctx.fill();
    }

    ctx.fillStyle = theme.nearHill;
    for (let i = -2; i < 6; i += 1) {
      const x = hillOffset + i * 220;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.quadraticCurveTo(x + 90, height - 120, x + 180, height);
      ctx.fill();
    }

    ctx.fillStyle = theme.cloud;
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 260 - cameraX * 0.33) % (width + 180)) - 80;
      const y = 60 + (i % 2) * 35 + Math.sin(visualClock + i) * 2.6;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.arc(x + 24, y + 2, 18, 0, Math.PI * 2);
      ctx.arc(x - 22, y + 4, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    const sunR = 36 + Math.sin(visualClock * 0.7) * 1.8;
    const sun = ctx.createRadialGradient(width - 120, 84, 2, width - 120, 84, 130);
    sun.addColorStop(0, theme.sunCore);
    sun.addColorStop(0.24, theme.sunMid);
    sun.addColorStop(1, theme.sunOuter);
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(width - 120, 84, sunR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < ambientSparkles.length; i += 1) {
      const s = ambientSparkles[i];
      const x = (s.x - cameraX * 0.08 - visualClock * s.speed) % (width + 40);
      const drawX = x < -20 ? x + width + 40 : x;
      const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(visualClock * 2.1 + s.phase));
      ctx.fillStyle = `rgba(255,239,215,${0.06 + twinkle * 0.2})`;
      ctx.fillRect(Math.round(drawX), Math.round(s.y + Math.sin(visualClock + s.phase) * 2), s.size, s.size);
    }
  }

  function drawTiles() {
    const startX = Math.max(0, Math.floor(cameraX / tileSize) - 1);
    const endX = Math.min(world.width - 1, Math.ceil((cameraX + width) / tileSize) + 1);

    for (let y = 0; y < world.height; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const ch = world.tiles[y][x];
        if (ch === ".") {
          continue;
        }
        const dx = x * tileSize - cameraX;
        const dy = y * tileSize;

        if (ch === "#") {
          const aboveSolid = isSolid(tileAt(x, y - 1));
          drawSprite(tilesImg, aboveSolid ? spriteIndices.groundFill : spriteIndices.groundTop, dx, dy, tileSize, tileSize, sourceTileSize);
          if (!aboveSolid) {
            ctx.fillStyle = theme.groundHighlight;
            ctx.fillRect(dx + 2, dy + 1, tileSize - 4, 4);
          }
          continue;
        }
        if (ch === "?") {
          drawSprite(tilesImg, spriteIndices.question, dx, dy, tileSize, tileSize, sourceTileSize);
          continue;
        }
        if (ch === "X") {
          drawSprite(tilesImg, spriteIndices.crate, dx, dy, tileSize, tileSize, sourceTileSize);
          continue;
        }
        if (ch === "^") {
          drawSprite(tilesImg, spriteIndices.spike, dx, dy + 4, tileSize, tileSize - 4, sourceTileSize);
          continue;
        }
        if (ch === "J") {
          drawSprite(tilesImg, spriteIndices.spring, dx, dy, tileSize, tileSize, sourceTileSize);
          continue;
        }
        if (ch === "K") {
          const cp = world.checkpoints.find((item) => Math.abs(item.x - (x * tileSize + 6)) < 1);
          const active = Boolean(cp && cp.active);
          ctx.fillStyle = "#8b5a2b";
          ctx.fillRect(Math.round(dx + tileSize * 0.44), Math.round(dy - tileSize * 2.8), 5, tileSize * 2.8);
          ctx.fillStyle = active ? "#22c55e" : "#ef4444";
          ctx.beginPath();
          ctx.moveTo(dx + tileSize * 0.48, dy - tileSize * 2.45);
          ctx.lineTo(dx + tileSize * 0.48, dy - tileSize * 1.85);
          ctx.lineTo(dx + tileSize * 0.95, dy - tileSize * 2.15);
          ctx.closePath();
          ctx.fill();
          continue;
        }
        if (ch === "F") {
          ctx.fillStyle = "#8b5a2b";
          ctx.fillRect(Math.round(dx + tileSize * 0.42), Math.round(dy - tileSize * 4), 6, tileSize * 4);
          drawSprite(tilesImg, spriteIndices.flag, dx + tileSize * 0.45, dy - tileSize * 3.7, tileSize, tileSize, sourceTileSize);
        }
      }
    }
  }

  function drawCoins() {
    for (const coin of world.coins) {
      if (coin.taken) {
        continue;
      }
      const bob = Math.sin((performance.now() * 0.004) + coin.x * 0.01) * 2;
      const pulse = 0.55 + 0.45 * Math.sin(visualClock * 3.2 + coin.x * 0.014);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 202, 107, ${0.12 + pulse * 0.2})`;
      ctx.arc(coin.x - cameraX, coin.y + bob, 14 + pulse * 3, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(tilesImg, spriteIndices.coin, coin.x - cameraX - 14, coin.y - 14 + bob, 28, 28, sourceTileSize);
    }
  }

  function drawEnemies() {
    for (const enemy of world.enemies) {
      if (!enemy.alive) {
        continue;
      }
      drawSprite(
        charsImg,
        enemy.type === "vault" ? spriteIndices.enemyVault : spriteIndices.enemy,
        enemy.x - cameraX,
        enemy.y,
        enemy.w,
        enemy.h,
        sourceCharSize
      );
    }
  }

  function drawPlayer() {
    let sprite = spriteIndices.playerIdle;
    if (!player.onGround) {
      sprite = spriteIndices.playerJump;
    } else if (Math.abs(player.vx) > 8) {
      sprite = Math.floor(player.runAnim) % 2 === 0 ? spriteIndices.playerRunA : spriteIndices.playerRunB;
    }

    const dx = player.x - cameraX;
    const dy = player.y;

    if (player.trail.length) {
      for (let i = 0; i < player.trail.length; i += 1) {
        const t = player.trail[i];
        const a = Math.max(0, Math.min(1, t.life / 0.16));
        ctx.fillStyle = `rgba(251, 146, 60, ${a * 0.34})`;
        ctx.fillRect(Math.round(t.x - cameraX - player.w * 0.28), Math.round(t.y - player.h * 0.3), Math.round(player.w * 0.56), Math.round(player.h * 0.62));
      }
    }

    ctx.save();
    if (player.dir < 0) {
      ctx.translate(Math.round(dx + player.w), 0);
      ctx.scale(-1, 1);
      drawSprite(charsImg, sprite, 0, dy, player.w, player.h, sourceCharSize);
    } else {
      drawSprite(charsImg, sprite, dx, dy, player.w, player.h, sourceCharSize);
    }
    ctx.restore();

    if (player.invuln > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.strokeRect(Math.round(dx), Math.round(dy), player.w, player.h);
    }
    if (boostTimer > 0) {
      ctx.strokeStyle = theme.boostRing;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(dx - 2), Math.round(dy - 2), player.w + 4, player.h + 4);
      ctx.lineWidth = 1;
    }
  }

  function drawAtmosphereOverlay() {
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.4, 120, width * 0.5, height * 0.4, width * 0.78);
    vignette.addColorStop(0, "rgba(15, 23, 42, 0)");
    vignette.addColorStop(1, theme.vignetteOuter);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  function drawEditorOverlay() {
    if (!editorMode) {
      return;
    }
    const startX = Math.max(0, Math.floor(cameraX / tileSize) - 1);
    const endX = Math.min(world.width - 1, Math.ceil((cameraX + width) / tileSize) + 1);
    ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
    ctx.lineWidth = 1;
    for (let y = 0; y < world.height; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const dx = x * tileSize - cameraX;
        const dy = y * tileSize;
        ctx.strokeRect(Math.round(dx) + 0.5, Math.round(dy) + 0.5, tileSize, tileSize);
      }
    }
    ctx.fillStyle = "rgba(15, 23, 42, 0.62)";
    ctx.fillRect(12, 12, 270, 24);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 12px Space Grotesk, sans-serif";
    ctx.fillText(`Editor ON | Brush '${editorBrush}' | Click/drag to paint`, 20, 28);
  }

  function drawFxParticles() {
    for (let i = 0; i < fxParticles.length; i += 1) {
      const p = fxParticles[i];
      const a = Math.max(0, Math.min(1, p.life / 0.4));
      const px = Math.round(p.x - cameraX);
      const py = Math.round(p.y);
      const size = Math.max(1, Math.round(p.size));
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py, size, size);
    }
    ctx.globalAlpha = 1;
  }

  function drawPauseOverlay() {
    if (!paused || (gameState !== "running" && gameState !== "loading")) {
      return;
    }
    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 42px Space Grotesk, sans-serif";
    ctx.fillText("PAUSED", width / 2 - 80, height / 2);
  }

  function draw() {
    const sx = screenShake.timer > 0 ? (Math.random() - 0.5) * 2 * screenShake.strength : 0;
    const sy = screenShake.timer > 0 ? (Math.random() - 0.5) * 2 * screenShake.strength : 0;
    ctx.save();
    ctx.translate(sx, sy);
    drawBackground();
    if (!assetsReady) {
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 26px Space Grotesk, sans-serif";
      ctx.fillText("Loading assets...", 350, 270);
      ctx.restore();
      return;
    }
    drawTiles();
    drawCoins();
    drawEnemies();
    drawFxParticles();
    drawPlayer();
    drawEditorOverlay();
    drawAtmosphereOverlay();
    drawPauseOverlay();
    ctx.restore();
  }

  function tick(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.033);
    lastTs = ts;
    visualClock = ts * 0.001;

    if (assetsReady && !paused && gameState === "running") {
      levelTime += dt;
      scheduleMusic();
      updatePlayer(dt);
      if (gameState === "running") {
        updateCoins();
        updateCheckpoints();
        updateEnemies(dt);
        updateTutorialHints();
      }
      if (gameState === "running") {
        updateGoalAndProgress();
      }
      updateCamera();
      syncHud();
    }
    updateFxParticles(dt);

    draw();
    rafId = window.requestAnimationFrame(tick);
  }

  function paintEditorAt(clientX, clientY) {
    if (!editorMode) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const localX = ((clientX - rect.left) / rect.width) * width;
    const localY = ((clientY - rect.top) / rect.height) * height;
    const tx = Math.floor((localX + cameraX) / tileSize);
    const ty = Math.floor(localY / tileSize);
    if (ty < 0 || ty >= levels[currentLevelIndex].length || tx < 0) {
      return;
    }
    const row = levels[currentLevelIndex][ty];
    if (tx >= row.length) {
      return;
    }
    const allowed = new Set([".", "#", "X", "?", "^", "J", "c", "e", "v", "S", "F", "K"]);
    if (!allowed.has(editorBrush)) {
      return;
    }
    const nextRows = levels[currentLevelIndex].slice();
    if (editorBrush === "S" || editorBrush === "F") {
      for (let y = 0; y < nextRows.length; y += 1) {
        nextRows[y] = nextRows[y].replace(new RegExp(editorBrush, "g"), ".");
      }
    }
    nextRows[ty] = replaceCharAt(nextRows[ty], tx, editorBrush);
    levels[currentLevelIndex] = nextRows;
    recalcLevelStats();
    syncLevelsToConfig();
    runCoinsTotal = campaignCoinTotal;
    parseLevel(currentLevelIndex, { editorMode: true, preserveTime: true, keepCamera: true });
    syncEditorJson();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
    }
    if (editorMode) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        panEditorBy(-tileSize * 2);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        panEditorBy(tileSize * 2);
        return;
      }
      if (e.key === "Escape") {
        editorMode = false;
        paused = false;
        statusEl.textContent = `Level ${currentLevelIndex + 1}: reach the flag.`;
        syncHud();
        return;
      }
    }
    getAudioContext();
    keys.add(e.key);
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      queueJump();
    }
    if (e.key === "Shift" || e.key === "ShiftLeft" || e.key === "ShiftRight") {
      dashQueued = true;
    }
    if (e.key === "p" || e.key === "P") {
      togglePause();
    }
  }

  function handleKeyUp(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
    }
    keys.delete(e.key);
  }

  function togglePause() {
    if (gameState !== "running") {
      return;
    }
    paused = !paused;
    statusEl.textContent = paused ? "Paused." : `Level ${currentLevelIndex + 1}: reach the flag.`;
    syncHud();
  }

  function updateTouchFromEvent(e, isDown) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const act = target.dataset.act;
    if (!act) {
      return;
    }
    e.preventDefault();
    touchState[act] = isDown;
    if (act === "jump" && isDown) {
      queueJump();
    }
    if (act === "dash" && isDown) {
      dashQueued = true;
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    touchState.left = false;
    touchState.right = false;
    touchState.jump = false;
    touchState.dash = false;
  }

  if (sfxVolumeInput) {
    sfxVolumeInput.value = String(Math.round(sfxVolume * 100));
  }
  if (musicVolumeInput) {
    musicVolumeInput.value = String(Math.round(musicVolume * 100));
  }

  pauseBtn.addEventListener("click", togglePause);

  const handleResetClick = () => {
    getAudioContext();
    overlayEl.textContent = "";
    resetRun();
  };

  const handleSfxClick = () => {
    getAudioContext();
    soundEnabled = !soundEnabled;
    persistAudioSettings();
    syncHud();
  };

  const handleMusicClick = () => {
    getAudioContext();
    musicEnabled = !musicEnabled;
    if (audioCtx) {
      musicNextAt = audioCtx.currentTime + 0.08;
      musicStep = 0;
    }
    persistAudioSettings();
    syncHud();
  };

  const handleSfxVolumeInput = () => {
    const next = Number(sfxVolumeInput.value);
    if (Number.isFinite(next)) {
      sfxVolume = Math.max(0, Math.min(1, next / 100));
      persistAudioSettings();
      syncHud();
    }
  };

  const handleMusicVolumeInput = () => {
    const next = Number(musicVolumeInput.value);
    if (Number.isFinite(next)) {
      musicVolume = Math.max(0, Math.min(1, next / 100));
      persistAudioSettings();
      syncHud();
    }
  };

  const handleEditorToggle = () => {
    editorMode = !editorMode;
    if (editorMode) {
      paused = true;
      renderEditorPalette();
      syncEditorJson();
      statusEl.textContent = `Editor mode: painting '${editorBrush}' on level ${currentLevelIndex + 1}.`;
    } else {
      paused = false;
      statusEl.textContent = `Level ${currentLevelIndex + 1}: reach the flag.`;
    }
    syncHud();
  };

  const handleEditorPrev = () => {
    if (currentLevelIndex <= 0) {
      return;
    }
    currentLevelIndex -= 1;
    parseLevel(currentLevelIndex, { editorMode: true, preserveTime: false });
  };

  const handleEditorNext = () => {
    if (currentLevelIndex >= levels.length - 1) {
      return;
    }
    currentLevelIndex += 1;
    parseLevel(currentLevelIndex, { editorMode: true, preserveTime: false });
  };

  const handleEditorClone = () => {
    const source = levels[currentLevelIndex];
    levels.splice(currentLevelIndex + 1, 0, source.slice());
    currentLevelIndex += 1;
    recalcLevelStats();
    syncBestTimesLength();
    syncLevelsToConfig();
    parseLevel(currentLevelIndex, { editorMode: true, preserveTime: false });
    syncEditorJson();
    statusEl.textContent = `Cloned level. Now editing level ${currentLevelIndex + 1}.`;
  };

  const handleEditorDelete = () => {
    if (levels.length <= 1) {
      return;
    }
    levels.splice(currentLevelIndex, 1);
    currentLevelIndex = Math.max(0, Math.min(currentLevelIndex, levels.length - 1));
    recalcLevelStats();
    syncBestTimesLength();
    syncLevelsToConfig();
    runCoinsTotal = campaignCoinTotal;
    parseLevel(currentLevelIndex, { editorMode: true, preserveTime: false });
    syncEditorJson();
    statusEl.textContent = `Deleted level. Now editing level ${currentLevelIndex + 1}.`;
  };

  const handleEditorPanLeft = () => {
    panEditorBy(-tileSize * 4);
  };

  const handleEditorPanRight = () => {
    panEditorBy(tileSize * 4);
  };

  const handleEditorScrollInput = () => {
    const next = Number(editorScrollEl.value);
    if (Number.isFinite(next)) {
      setCameraX(next);
    }
  };

  const handleEditorShare = async () => {
    const encoded = encodeLevelsForShare(levels);
    const url = new URL(window.location.href);
    url.hash = `pflevel=${encoded}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url.toString());
      } else if (editorJsonEl) {
        editorJsonEl.value = url.toString();
      }
      statusEl.textContent = "Share link copied. Send it so friends can play your level pack.";
    } catch (_) {
      if (editorJsonEl) {
        editorJsonEl.value = url.toString();
      }
      statusEl.textContent = "Share link generated in advanced JSON panel (clipboard unavailable).";
    }
  };

  const handleEditorLoadShare = () => {
    const hash = window.location.hash || "";
    if (!hash.startsWith("#pflevel=")) {
      statusEl.textContent = "No shared level hash found in current URL.";
      return;
    }
    const encoded = hash.slice("#pflevel=".length);
    const sharedLevels = decodeLevelsFromShare(encoded);
    if (!sharedLevels) {
      statusEl.textContent = "Shared level hash is invalid.";
      return;
    }
    levels = sharedLevels;
    recalcLevelStats();
    syncBestTimesLength();
    runCoinsTotal = campaignCoinTotal;
    currentLevelIndex = 0;
    syncLevelsToConfig();
    parseLevel(currentLevelIndex, { editorMode: true, preserveTime: false });
    renderEditorPalette();
    syncEditorJson();
    statusEl.textContent = "Loaded shared level pack from URL.";
  };

  const handleEditorExport = () => {
    syncEditorJson();
    if (editorJsonEl) {
      editorJsonEl.focus();
      editorJsonEl.select();
    }
    statusEl.textContent = "Level config exported to editor JSON panel.";
  };

  const handleEditorImport = () => {
    if (!editorJsonEl) {
      return;
    }
    try {
      const parsed = JSON.parse(editorJsonEl.value);
      const candidate = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.levels) ? parsed.levels : null;
      const normalized = normalizeLevels(candidate);
      if (!normalized) {
        statusEl.textContent = "Import failed: invalid level format.";
        return;
      }
      levels = normalized;
      recalcLevelStats();
      syncBestTimesLength();
      runCoinsTotal = campaignCoinTotal;
      currentLevelIndex = Math.max(0, Math.min(currentLevelIndex, levels.length - 1));
      syncLevelsToConfig();
      parseLevel(currentLevelIndex, { editorMode, preserveTime: false });
      renderEditorPalette();
      syncEditorJson();
      statusEl.textContent = "Level config imported successfully.";
    } catch (err) {
      statusEl.textContent = `Import failed: ${err.message}`;
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!editorMode) {
      return;
    }
    editorPointerDown = true;
    paintEditorAt(e.clientX, e.clientY);
  };

  const handleCanvasMouseMove = (e) => {
    if (!editorMode || !editorPointerDown) {
      return;
    }
    paintEditorAt(e.clientX, e.clientY);
  };

  const handleCanvasMouseUp = () => {
    editorPointerDown = false;
  };

  const handleCanvasTouchStart = (e) => {
    if (!editorMode) {
      return;
    }
    const touch = e.touches && e.touches[0];
    if (!touch) {
      return;
    }
    e.preventDefault();
    paintEditorAt(touch.clientX, touch.clientY);
  };

  const handleCanvasTouchMove = (e) => {
    if (!editorMode) {
      return;
    }
    const touch = e.touches && e.touches[0];
    if (!touch) {
      return;
    }
    e.preventDefault();
    paintEditorAt(touch.clientX, touch.clientY);
  };

  const handleCanvasWheel = (e) => {
    if (!editorMode) {
      return;
    }
    e.preventDefault();
    panEditorBy(e.deltaY * 0.9);
  };

  resetBtn.addEventListener("click", handleResetClick);
  sfxBtn.addEventListener("click", handleSfxClick);
  musicBtn.addEventListener("click", handleMusicClick);
  sfxVolumeInput.addEventListener("input", handleSfxVolumeInput);
  musicVolumeInput.addEventListener("input", handleMusicVolumeInput);
  editorToggleBtn.addEventListener("click", handleEditorToggle);
  editorPrevBtn.addEventListener("click", handleEditorPrev);
  editorNextBtn.addEventListener("click", handleEditorNext);
  editorCloneBtn.addEventListener("click", handleEditorClone);
  editorDeleteBtn.addEventListener("click", handleEditorDelete);
  editorPanLeftBtn.addEventListener("click", handleEditorPanLeft);
  editorPanRightBtn.addEventListener("click", handleEditorPanRight);
  editorScrollEl.addEventListener("input", handleEditorScrollInput);
  editorShareBtn.addEventListener("click", handleEditorShare);
  editorLoadShareBtn.addEventListener("click", handleEditorLoadShare);
  editorExportBtn.addEventListener("click", handleEditorExport);
  editorImportBtn.addEventListener("click", handleEditorImport);
  renderEditorPalette();

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  const handleTouchStart = (e) => {
    getAudioContext();
    updateTouchFromEvent(e, true);
  };
  const handleTouchMouseDown = (e) => {
    getAudioContext();
    updateTouchFromEvent(e, true);
  };
  const handleTouchMouseUp = (e) => updateTouchFromEvent(e, false);
  const handleTouchLeave = () => {
    touchState.left = false;
    touchState.right = false;
    touchState.jump = false;
    touchState.dash = false;
  };

  touchEl.addEventListener("touchstart", handleTouchStart, { passive: false });
  touchEl.addEventListener("touchend", handleTouchEnd, { passive: false });
  touchEl.addEventListener("touchcancel", handleTouchEnd, { passive: false });
  touchEl.addEventListener("mousedown", handleTouchMouseDown);
  touchEl.addEventListener("mouseup", handleTouchMouseUp);
  touchEl.addEventListener("mouseleave", handleTouchLeave);
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  window.addEventListener("mouseup", handleCanvasMouseUp);
  canvas.addEventListener("touchstart", handleCanvasTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleCanvasTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleCanvasMouseUp, { passive: false });
  canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });

  Promise.all([
    loadImage("assets/games/platformer/kenney_pixel-platformer/Tilemap/tilemap.png"),
    loadImage("assets/games/platformer/kenney_pixel-platformer/Tilemap/tilemap-characters.png"),
  ])
    .then(([tiles, chars]) => {
      tilesImg = tiles;
      charsImg = chars;
      assetsReady = true;
      overlayEl.textContent = "";
      resetRun();
      statusEl.textContent = loadedFromSharedHash
        ? "Loaded shared levels from URL hash."
        : "Use Arrow keys (or A/D) + Jump (Space/W/Up). Reach the flag.";
      setCameraX(0);
      syncEditorJson();
      syncHud();
    })
    .catch((err) => {
      gameState = "error";
      paused = true;
      statusEl.textContent = `Asset loading failed: ${err.message}`;
      overlayEl.textContent = "ASSET LOAD ERROR";
      syncHud();
    });

  rafId = window.requestAnimationFrame(tick);

  return function cleanup() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    pauseBtn.removeEventListener("click", togglePause);
    resetBtn.removeEventListener("click", handleResetClick);
    sfxBtn.removeEventListener("click", handleSfxClick);
    musicBtn.removeEventListener("click", handleMusicClick);
    sfxVolumeInput.removeEventListener("input", handleSfxVolumeInput);
    musicVolumeInput.removeEventListener("input", handleMusicVolumeInput);
    editorToggleBtn.removeEventListener("click", handleEditorToggle);
    editorPrevBtn.removeEventListener("click", handleEditorPrev);
    editorNextBtn.removeEventListener("click", handleEditorNext);
    editorCloneBtn.removeEventListener("click", handleEditorClone);
    editorDeleteBtn.removeEventListener("click", handleEditorDelete);
    editorPanLeftBtn.removeEventListener("click", handleEditorPanLeft);
    editorPanRightBtn.removeEventListener("click", handleEditorPanRight);
    editorScrollEl.removeEventListener("input", handleEditorScrollInput);
    editorShareBtn.removeEventListener("click", handleEditorShare);
    editorLoadShareBtn.removeEventListener("click", handleEditorLoadShare);
    editorExportBtn.removeEventListener("click", handleEditorExport);
    editorImportBtn.removeEventListener("click", handleEditorImport);
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close().catch(() => {});
    }
    touchEl.removeEventListener("touchstart", handleTouchStart);
    touchEl.removeEventListener("touchend", handleTouchEnd);
    touchEl.removeEventListener("touchcancel", handleTouchEnd);
    touchEl.removeEventListener("mousedown", handleTouchMouseDown);
    touchEl.removeEventListener("mouseup", handleTouchMouseUp);
    touchEl.removeEventListener("mouseleave", handleTouchLeave);
    canvas.removeEventListener("mousedown", handleCanvasMouseDown);
    canvas.removeEventListener("mousemove", handleCanvasMouseMove);
    window.removeEventListener("mouseup", handleCanvasMouseUp);
    canvas.removeEventListener("touchstart", handleCanvasTouchStart);
    canvas.removeEventListener("touchmove", handleCanvasTouchMove);
    canvas.removeEventListener("touchend", handleCanvasMouseUp);
    canvas.removeEventListener("wheel", handleCanvasWheel);
  };
}

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(pixelPlatformerGame);
