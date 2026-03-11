const brickBreakerGame = {
  id: "brick-breaker",
  title: "Brick Breaker",
  description: "Campaign mode with combos, power-ups, multi-ball, boss levels, and polish.",
  difficulty: "Reflexes and control",
  setup: setupBrickBreaker,
};

function setupBrickBreaker(container) {
  const width = 1120;
  const height = 620;
  const cols = 10;
  const baseRows = 6;
  const brickGap = 6;
  const brickPaddingX = 28;
  const brickPaddingTop = 72;
  const brickHeight = 22;
  const brickWidth = (width - brickPaddingX * 2 - (cols - 1) * brickGap) / cols;
  const comboWindow = 2.2;
  const maxLives = 5;
  const maxCampaignLevel = 10;

  const root = document.createElement("div");
  root.className = "lab-game";
  root.innerHTML = `
    <div class="hud">
      <div class="hud-item"><strong>Lives</strong><div id="bb-lives">3</div></div>
      <div class="hud-item"><strong>Balls</strong><div id="bb-balls">1</div></div>
      <div class="hud-item"><strong>Score</strong><div id="bb-score">0</div></div>
      <div class="hud-item"><strong>Level</strong><div id="bb-level">1 / ${maxCampaignLevel}</div></div>
      <div class="hud-item"><strong>Combo</strong><div id="bb-combo">x1</div></div>
      <div class="hud-item"><strong>Power</strong><div id="bb-power">-</div></div>
      <div class="hud-item"><strong>Best</strong><div id="bb-best">0</div></div>
    </div>
    <div class="action-row">
      <button type="button" id="bb-sound" class="btn ghost">Sound: On</button>
      <button type="button" id="bb-pause" class="btn ghost">Pause</button>
      <button type="button" id="bb-reset" class="btn ghost">Reset</button>
      <label class="bb-level-picker-label" for="bb-level-picker">Debug level</label>
      <select id="bb-level-picker" class="bb-level-picker"></select>
    </div>
    <p class="status" id="bb-status">Use Left/Right or A/D. Click board (or press Space) to launch.</p>
    <div class="bb-canvas-wrap">
      <canvas class="bb-canvas" id="bb-canvas" width="${width}" height="${height}"></canvas>
      <button type="button" id="bb-resume-overlay" class="bb-resume-overlay" aria-label="Resume game">Resume</button>
      <div class="lab-finish-overlay" id="bb-finish-overlay" aria-live="polite">
        <div class="lab-finish-card">
          <p class="lab-finish-title">Congratulations!</p>
          <p class="lab-finish-text" id="bb-finish-text">Campaign complete.</p>
          <button type="button" id="bb-play-again" class="btn primary">Play Again</button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(root);

  const canvas = root.querySelector("#bb-canvas");
  const ctx = canvas.getContext("2d");
  const livesEl = root.querySelector("#bb-lives");
  const ballsEl = root.querySelector("#bb-balls");
  const scoreEl = root.querySelector("#bb-score");
  const levelEl = root.querySelector("#bb-level");
  const comboEl = root.querySelector("#bb-combo");
  const powerEl = root.querySelector("#bb-power");
  const bestEl = root.querySelector("#bb-best");
  const statusEl = root.querySelector("#bb-status");
  const soundBtn = root.querySelector("#bb-sound");
  const pauseBtn = root.querySelector("#bb-pause");
  const resetBtn = root.querySelector("#bb-reset");
  const resumeOverlayBtn = root.querySelector("#bb-resume-overlay");
  const finishOverlayEl = root.querySelector("#bb-finish-overlay");
  const finishTextEl = root.querySelector("#bb-finish-text");
  const playAgainBtn = root.querySelector("#bb-play-again");
  const levelPickerEl = root.querySelector("#bb-level-picker");

  const keys = new Set();
  const paddleBaseWidth = 144;
  const paddle = { x: width / 2 - 72, y: height - 36, w: paddleBaseWidth, h: 14, speed: 520 };
  const ballRadius = 7;
  const brickPalette = { 1: "#fb923c", 2: "#22d3ee", 3: "#a78bfa" };
  const powerDefs = {
    expand: { name: "wide paddle", tier: "common", color: "#34d399", duration: 8 },
    slow: { name: "slow ball", tier: "common", color: "#22d3ee", duration: 7 },
    catch: { name: "sticky paddle", tier: "common", color: "#60a5fa", duration: 8 },
    multiball: { name: "multiball", tier: "uncommon", color: "#facc15", duration: 5.5 },
    laser: { name: "laser shots", tier: "uncommon", color: "#c084fc", duration: 8.5 },
    life: { name: "+1 life", tier: "rare", color: "#f43f5e", duration: 0 },
    pierce: { name: "pierce walls", tier: "rare", color: "#fb7185", duration: 6.5 },
  };

  let balls = [];
  let bricks = [];
  let particles = [];
  let powerDrops = [];
  let lives = 3;
  let score = 0;
  let level = 1;
  let combo = 1;
  let comboTimer = 0;
  let selectedStartLevel = 1;
  let best = Number(window.localStorage.getItem("brickBreakerBest") || "0");
  let running = false;
  let paused = false;
  let rafId = null;
  let lastTs = 0;
  let activePower = { name: "-", timer: 0, type: "none", tier: "none" };
  let speedScale = 1;
  let laserShots = [];
  let laserCooldown = 0;
  let screenShake = { timer: 0, strength: 0 };
  let cameraOffset = { x: 0, y: 0 };
  let comboPops = [];
  let reinforcementQueue = [];
  let reinforcementTimer = 0;
  let visualClock = 0;
  let soundEnabled = true;
  let audioCtx = null;
  let bossState = null;
  let miniBosses = [];
  let miniBossSpawnTimer = 0;

  function createBall(stuck) {
    return {
      x: paddle.x + paddle.w / 2,
      y: paddle.y - ballRadius - 1,
      r: ballRadius,
      vx: 220 + level * 20,
      vy: -220 - level * 14,
      stuck: Boolean(stuck),
      alive: true,
      trail: [],
    };
  }

  function isBossLevel() {
    return level % 5 === 0;
  }

  function syncHud() {
    livesEl.textContent = String(lives);
    ballsEl.textContent = String(balls.filter((b) => b.alive).length);
    scoreEl.textContent = String(score);
    levelEl.textContent = `${level} / ${maxCampaignLevel}`;
    comboEl.textContent = `x${combo}`;
    powerEl.textContent = activePower.tier && activePower.tier !== "none" ? `${activePower.name} (${activePower.tier})` : activePower.name;
    bestEl.textContent = String(best);
    pauseBtn.textContent = "Pause";
    pauseBtn.disabled = paused;
    soundBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
    if (resumeOverlayBtn) {
      resumeOverlayBtn.classList.toggle("show", paused);
    }
  }

  function getAudioContext() {
    if (!soundEnabled) {
      return null;
    }
    if (!audioCtx) {
      const ACtx = window.AudioContext || window.webkitAudioContext;
      if (!ACtx) {
        return null;
      }
      audioCtx = new ACtx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function playTone(freq, duration, volume) {
    const aCtx = getAudioContext();
    if (!aCtx) {
      return;
    }
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, aCtx.currentTime);
    gain.gain.setValueAtTime(volume, aCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, aCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(aCtx.destination);
    osc.start();
    osc.stop(aCtx.currentTime + duration);
  }

  function startShake(strength, duration) {
    screenShake.strength = Math.max(screenShake.strength, strength);
    screenShake.timer = Math.max(screenShake.timer, duration);
  }

  function spawnBricks() {
    bricks = [];
    bossState = null;
    miniBosses = [];
    miniBossSpawnTimer = 0;
    reinforcementQueue = [];
    reinforcementTimer = 0;
    if (isBossLevel()) {
      const hp = 16 + level * 2;
      if (level === 5) {
        bossState = {
          kind: "sentinel-orbit",
          x: width * 0.5,
          y: 124,
          baseY: 124,
          w: width * 0.34,
          h: 128,
          hp,
          maxHp: hp,
          coreRadius: 26,
          weakRadius: 14,
          weakSpots: [{ angle: 0 }, { angle: (2 * Math.PI) / 3 }, { angle: (4 * Math.PI) / 3 }],
          pulse: 0,
        };
      } else {
        bossState = {
          kind: "hydra-gate",
          x: width * 0.5,
          y: 138,
          baseY: 138,
          w: width * 0.45,
          h: 144,
          hp: hp + 8,
          maxHp: hp + 8,
          coreRadius: 24,
          weakRadius: 13,
          weakSpots: [{ angle: 0 }, { angle: Math.PI }],
          pulse: 0,
        };
      }
      miniBossSpawnTimer = 3.2 + Math.random() * 2.2;
      return;
    }

    const rows = Math.min(baseRows + Math.floor((level - 1) / 2), 8);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (level >= 3 && (r + c + level) % 7 === 0) {
          continue;
        }
        const hp = level >= 5 && r < 2 ? 3 : level >= 2 && r < 3 ? 2 : 1;
        bricks.push({
          x: brickPaddingX + c * (brickWidth + brickGap),
          y: brickPaddingTop + r * (brickHeight + brickGap),
          w: brickWidth,
          h: brickHeight,
          hp,
          maxHp: hp,
          alive: true,
          isBoss: false,
          dropPower: Math.random() < 0.14,
          indestructible: false,
        });
      }
    }

    // Special tactical level: indestructible walls with playable lanes.
    if (level === 7) {
      const wallCols = [2, 7];
      const safeRows = new Set([1, 4, 6]);
      bricks.forEach((b, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        if (wallCols.includes(col) && !safeRows.has(row)) {
          b.indestructible = true;
          b.hp = 999999;
          b.maxHp = 999999;
          b.dropPower = false;
        }
      });
      statusEl.textContent = "Level 7: armored walls. Use the open lanes.";
    }

    // Reinforcement mechanic on higher levels: delayed extra bricks.
    if (level >= 8) {
      const reinforcementRows = 2;
      for (let r = 0; r < reinforcementRows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if ((r + c + level) % 3 === 0) {
            continue;
          }
          reinforcementQueue.push({
            x: brickPaddingX + c * (brickWidth + brickGap),
            y: brickPaddingTop + (rows + r + 1) * (brickHeight + brickGap),
            w: brickWidth,
            h: brickHeight,
            hp: 1 + (r % 2),
            maxHp: 1 + (r % 2),
            alive: true,
            isBoss: false,
            dropPower: Math.random() < 0.08,
            indestructible: false,
          });
        }
      }
      reinforcementTimer = 5.8;
    }
  }

  function resetSingleBall() {
    balls = [createBall(true)];
  }

  function clearTransientEffects() {
    activePower = { name: "-", timer: 0, type: "none", tier: "none" };
    speedScale = 1;
    paddle.w = paddleBaseWidth;
    laserShots = [];
    laserCooldown = 0;
    powerDrops = [];
    bossState = null;
    miniBosses = [];
    miniBossSpawnTimer = 0;
    reinforcementQueue = [];
    reinforcementTimer = 0;
  }

  function resetTimedModifiers() {
    speedScale = 1;
    paddle.w = paddleBaseWidth;
    laserShots = [];
    laserCooldown = 0;
  }

  function restartRun() {
    if (finishOverlayEl) {
      finishOverlayEl.classList.remove("show");
    }
    lives = 3;
    score = 0;
    level = selectedStartLevel;
    combo = 1;
    comboTimer = 0;
    particles = [];
    comboPops = [];
    clearTransientEffects();
    spawnBricks();
    resetSingleBall();
    running = false;
    paused = false;
    if (isBossLevel()) {
      statusEl.textContent = "Boss stage: weak points take any hit. Mini bosses may appear and drop power-ups.";
    } else if (level === 7) {
      statusEl.textContent = "Level 7: armored walls. Use the open lanes.";
    } else {
      statusEl.textContent = "Use Left/Right or A/D. Click board (or press Space) to launch.";
    }
    syncHud();
  }

  function populateLevelPicker() {
    if (!levelPickerEl) {
      return;
    }
    levelPickerEl.innerHTML = "";
    for (let i = 1; i <= maxCampaignLevel; i += 1) {
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = `L${i}`;
      if (i === selectedStartLevel) {
        option.selected = true;
      }
      levelPickerEl.appendChild(option);
    }
  }

  function endRun(message) {
    running = false;
    paused = false;
    statusEl.textContent = message;
    if (score > best) {
      best = score;
      window.localStorage.setItem("brickBreakerBest", String(best));
    }
    syncHud();
  }

  function showFinishScreen(text) {
    if (!finishOverlayEl || !finishTextEl) {
      return;
    }
    finishTextEl.textContent = text;
    finishOverlayEl.classList.add("show");
  }

  function makeParticles(x, y, color, amount) {
    const count = amount || 10;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        life: 0.45 + Math.random() * 0.6,
        color,
      });
    }
  }

  function updateParticles(dt) {
    particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0);
  }

  function updateShake(dt) {
    if (screenShake.timer <= 0) {
      return;
    }
    screenShake.timer -= dt;
    if (screenShake.timer <= 0) {
      screenShake.timer = 0;
      screenShake.strength = 0;
    }
  }

  function updateCombo(dt) {
    if (combo <= 1) {
      return;
    }
    comboTimer -= dt;
    if (comboTimer <= 0) {
      combo = 1;
      comboTimer = 0;
    }
  }

  function updateInput(dt) {
    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
      paddle.x -= paddle.speed * dt;
    }
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
      paddle.x += paddle.speed * dt;
    }
    paddle.x = Math.max(0, Math.min(width - paddle.w, paddle.x));
    const paddleCenterNorm = (paddle.x + paddle.w / 2) / width - 0.5;
    const targetX = paddleCenterNorm * 16;
    const targetY = Math.abs(paddleCenterNorm) * 3;
    cameraOffset.x += (targetX - cameraOffset.x) * Math.min(1, dt * 10);
    cameraOffset.y += (targetY - cameraOffset.y) * Math.min(1, dt * 8);

    balls.forEach((ball) => {
      if (!ball.stuck) {
        return;
      }
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 1;
      ball.trail = [];
    });
  }

  function rectCircleHit(rect, circle) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function registerBrickHit(points, x, y) {
    const gained = Math.round(points * combo);
    score += gained;
    comboPops.push({
      x: typeof x === "number" ? x : width * 0.5,
      y: typeof y === "number" ? y : height * 0.4,
      text: combo > 1 ? `+${gained} x${combo}` : `+${gained}`,
      life: 0.85,
      color: combo > 2 ? "#fef08a" : "#e2e8f0",
    });
    combo = Math.min(8, combo + 1);
    comboTimer = comboWindow;
  }

  function maybeSpawnPower(brick) {
    if (!brick.dropPower || brick.hp > 0 || brick.isBoss) {
      return;
    }
    const tierRoll = Math.random();
    const rareChance = Math.min(0.16, 0.04 + level * 0.01);
    const uncommonChance = 0.28;
    const tier = tierRoll < rareChance ? "rare" : tierRoll < rareChance + uncommonChance ? "uncommon" : "common";
    spawnPowerDropAt(brick.x + brick.w / 2, brick.y + brick.h / 2, tier);
  }

  function pickPowerTypeByTier(tier) {
    const byTier = Object.keys(powerDefs).filter((k) => powerDefs[k].tier === tier);
    if (!byTier.length) {
      const fallback = Object.keys(powerDefs);
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
    return byTier[Math.floor(Math.random() * byTier.length)];
  }

  function spawnPowerDropAt(x, y, forcedTier) {
    let tier = forcedTier;
    if (!tier) {
      const roll = Math.random();
      tier = roll < 0.12 ? "rare" : roll < 0.42 ? "uncommon" : "common";
    }
    const type = pickPowerTypeByTier(tier);
    const def = powerDefs[type];
    powerDrops.push({
      x,
      y,
      vy: 120 + Math.random() * 45,
      type,
      tier: def.tier,
      alive: true,
    });
  }

  function applyPower(type) {
    const def = powerDefs[type];
    if (!def) {
      return;
    }
    if (type === "life") {
      lives = Math.min(maxLives, lives + 1);
      activePower = { name: def.name, timer: 1.2, type, tier: def.tier };
      playTone(740, 0.12, 0.06);
      return;
    }
    if (type === "laser") {
      resetTimedModifiers();
      activePower = { name: def.name, timer: def.duration, type, tier: def.tier };
      laserShots = [];
      laserCooldown = 0;
      playTone(680, 0.12, 0.06);
      return;
    }
    if (type === "expand") {
      resetTimedModifiers();
      paddle.w = Math.min(paddleBaseWidth * 1.45, 230);
      activePower = { name: def.name, timer: def.duration, type, tier: def.tier };
      playTone(620, 0.1, 0.06);
      return;
    }
    if (type === "slow") {
      resetTimedModifiers();
      speedScale = 0.72;
      activePower = { name: def.name, timer: def.duration, type, tier: def.tier };
      playTone(520, 0.1, 0.06);
      return;
    }
    if (type === "catch") {
      resetTimedModifiers();
      activePower = { name: def.name, timer: def.duration, type, tier: def.tier };
      playTone(570, 0.11, 0.06);
      return;
    }
    if (type === "multiball") {
      resetTimedModifiers();
      const newBalls = [];
      balls.forEach((b) => {
        if (!b.alive || b.stuck) {
          return;
        }
        newBalls.push({ x: b.x, y: b.y, r: b.r, vx: b.vx * 0.8 + 130, vy: b.vy, stuck: false, alive: true, trail: [] });
        newBalls.push({ x: b.x, y: b.y, r: b.r, vx: b.vx * 0.8 - 130, vy: b.vy, stuck: false, alive: true, trail: [] });
      });
      if (!newBalls.length) {
        const baseBall = balls[0] || createBall(false);
        newBalls.push(
          { x: baseBall.x, y: baseBall.y, r: baseBall.r, vx: 260, vy: -260, stuck: false, alive: true, trail: [] },
          { x: baseBall.x, y: baseBall.y, r: baseBall.r, vx: -260, vy: -260, stuck: false, alive: true, trail: [] }
        );
      }
      balls = balls.concat(newBalls.slice(0, 4));
      activePower = { name: def.name, timer: def.duration, type, tier: def.tier };
      playTone(430, 0.1, 0.06);
      return;
    }
    if (type === "pierce") {
      resetTimedModifiers();
      activePower = { name: def.name, timer: def.duration, type, tier: def.tier };
      playTone(300, 0.12, 0.07);
    }
  }

  function updatePowers(dt) {
    powerDrops.forEach((drop) => {
      if (!drop.alive) {
        return;
      }
      drop.y += drop.vy * dt;
      const hitPaddle =
        drop.x >= paddle.x &&
        drop.x <= paddle.x + paddle.w &&
        drop.y >= paddle.y &&
        drop.y <= paddle.y + paddle.h + 12;

      if (hitPaddle) {
        drop.alive = false;
        applyPower(drop.type);
        const def = powerDefs[drop.type];
        if (def) {
          statusEl.textContent = `Power-up: ${def.name} (${def.tier})`;
        }
        makeParticles(drop.x, drop.y, "rgba(110, 231, 183, 0.85)", 16);
      } else if (drop.y > height + 20) {
        drop.alive = false;
      }
    });
    powerDrops = powerDrops.filter((d) => d.alive);

    if (activePower.timer <= 0) {
      return;
    }
    activePower.timer -= dt;
    if (activePower.timer > 0) {
      return;
    }
    activePower = { name: "-", timer: 0, type: "none", tier: "none" };
    resetTimedModifiers();
  }

  function updateComboPops(dt) {
    comboPops.forEach((pop) => {
      pop.y -= 42 * dt;
      pop.life -= dt;
    });
    comboPops = comboPops.filter((pop) => pop.life > 0);
  }

  function spawnLaserPair() {
    laserShots.push(
      { x: paddle.x + 10, y: paddle.y - 2, vy: -780, alive: true },
      { x: paddle.x + paddle.w - 10, y: paddle.y - 2, vy: -780, alive: true }
    );
    playTone(760, 0.03, 0.03);
  }

  function updateLasers(dt) {
    if (activePower.type === "laser") {
      laserCooldown -= dt;
      if (laserCooldown <= 0) {
        spawnLaserPair();
        laserCooldown = 0.28;
      }
    }

    laserShots.forEach((shot) => {
      if (!shot.alive) {
        return;
      }
      shot.y += shot.vy * dt;
      if (shot.y < -10) {
        shot.alive = false;
        return;
      }

      if (bossState) {
        for (const mini of miniBosses) {
          if (!mini.alive) {
            continue;
          }
          const dxMini = shot.x - mini.x;
          const dyMini = shot.y - mini.y;
          if (dxMini * dxMini + dyMini * dyMini <= (mini.r + 2) * (mini.r + 2)) {
            defeatMiniBoss(mini, shot.x, shot.y);
            shot.alive = false;
            break;
          }
        }
        if (!shot.alive) {
          return;
        }
        for (const spot of bossState.weakSpots) {
          const p = bossWeakSpotPosition(spot);
          const dx = shot.x - p.x;
          const dy = shot.y - p.y;
          if (dx * dx + dy * dy <= (bossState.weakRadius + 2) * (bossState.weakRadius + 2)) {
            bossState.hp -= 1;
            registerBrickHit(8, shot.x, shot.y);
            makeParticles(shot.x, shot.y, "rgba(253, 224, 71, 0.75)", 8);
            shot.alive = false;
            if (bossState.hp <= 0) {
              registerBrickHit(260, bossState.x, bossState.y);
              makeParticles(bossState.x, bossState.y, "rgba(251, 113, 133, 0.95)", 60);
              bossState = null;
            }
            break;
          }
        }
      }
      if (!shot.alive) {
        return;
      }

      for (const brick of bricks) {
        if (!brick.alive) {
          continue;
        }
        if (shot.x >= brick.x && shot.x <= brick.x + brick.w && shot.y >= brick.y && shot.y <= brick.y + brick.h) {
          if (brick.indestructible) {
            makeParticles(shot.x, shot.y, "rgba(148, 163, 184, 0.7)", 6);
            playTone(180, 0.03, 0.02);
          } else {
            brick.hp -= 1;
            registerBrickHit(brick.hp <= 0 ? 10 : 4, shot.x, shot.y);
            makeParticles(shot.x, shot.y, "rgba(196, 132, 252, 0.72)", 9);
            if (brick.hp <= 0) {
              brick.alive = false;
              maybeSpawnPower(brick);
            }
          }
          shot.alive = false;
          break;
        }
      }
    });

    laserShots = laserShots.filter((shot) => shot.alive);
  }

  function updateReinforcements(dt) {
    if (!reinforcementQueue.length || reinforcementTimer <= 0) {
      return;
    }
    reinforcementTimer -= dt;
    if (reinforcementTimer > 0) {
      return;
    }
    const batch = reinforcementQueue.splice(0, Math.min(4, reinforcementQueue.length));
    if (batch.length) {
      bricks = bricks.concat(batch);
      statusEl.textContent = "Reinforcements incoming.";
      playTone(510, 0.08, 0.05);
      startShake(2.2, 0.12);
    }
    reinforcementTimer = reinforcementQueue.length ? 4.6 : 0;
  }

  function resolveBrickCollision(ball, prevX, prevY, brick) {
    const fromLeft = prevX + ball.r <= brick.x;
    const fromRight = prevX - ball.r >= brick.x + brick.w;
    const fromTop = prevY + ball.r <= brick.y;
    const fromBottom = prevY - ball.r >= brick.y + brick.h;

    if (fromLeft) {
      ball.x = brick.x - ball.r;
      ball.vx = -Math.abs(ball.vx);
      return;
    }
    if (fromRight) {
      ball.x = brick.x + brick.w + ball.r;
      ball.vx = Math.abs(ball.vx);
      return;
    }
    if (fromTop) {
      ball.y = brick.y - ball.r;
      ball.vy = -Math.abs(ball.vy);
      return;
    }
    if (fromBottom) {
      ball.y = brick.y + brick.h + ball.r;
      ball.vy = Math.abs(ball.vy);
      return;
    }

    const overlapLeft = Math.abs(ball.x + ball.r - brick.x);
    const overlapRight = Math.abs(brick.x + brick.w - (ball.x - ball.r));
    const overlapTop = Math.abs(ball.y + ball.r - brick.y);
    const overlapBottom = Math.abs(brick.y + brick.h - (ball.y - ball.r));
    if (Math.min(overlapLeft, overlapRight) < Math.min(overlapTop, overlapBottom)) {
      ball.vx *= -1;
    } else {
      ball.vy *= -1;
    }
  }

  function bossWeakSpotPosition(spot) {
    if (!bossState) {
      return { x: 0, y: 0 };
    }
    const orbitRadius = bossState.kind === "hydra-gate" ? bossState.w * 0.26 : bossState.w * 0.31;
    const verticalRadius = bossState.kind === "hydra-gate" ? bossState.h * 0.16 : bossState.h * 0.24;
    return {
      x: bossState.x + Math.cos(spot.angle + bossState.pulse * 0.6) * orbitRadius,
      y: bossState.y + Math.sin(spot.angle + bossState.pulse * 0.6) * verticalRadius,
    };
  }

  function updateBossState(dt) {
    if (!bossState) {
      return;
    }
    bossState.pulse += dt * 2.2;
    if (bossState.kind === "hydra-gate") {
      bossState.x = width * 0.5 + Math.sin(visualClock * 0.45) * 80;
      bossState.y = bossState.baseY + Math.sin(visualClock * 1.1) * 8;
    } else {
      bossState.x = width * 0.5 + Math.sin(visualClock * 0.75) * 110;
      bossState.y = bossState.baseY + Math.sin(visualClock * 1.7) * 12;
    }
  }

  function spawnMiniBoss() {
    if (!bossState) {
      return;
    }
    const left = bossState.x - bossState.w * 0.44;
    const right = bossState.x + bossState.w * 0.44;
    miniBosses.push({
      x: left + Math.random() * (right - left),
      y: bossState.y + bossState.h * 0.2 + Math.random() * 24,
      r: 16 + Math.random() * 2,
      vx: (Math.random() < 0.5 ? -1 : 1) * (110 + Math.random() * 70),
      vy: 36 + Math.random() * 30,
      phase: Math.random() * Math.PI * 2,
      alive: true,
    });
  }

  function defeatMiniBoss(mini, hitX, hitY) {
    mini.alive = false;
    registerBrickHit(36, hitX, hitY);
    makeParticles(hitX, hitY, "rgba(110, 231, 183, 0.9)", 18);
    spawnPowerDropAt(hitX, hitY, Math.random() < 0.28 ? "rare" : "uncommon");
    playTone(690, 0.08, 0.06);
    statusEl.textContent = "Mini boss destroyed: power-up dropped.";
    startShake(2.5, 0.1);
  }

  function updateMiniBosses(dt) {
    if (!bossState) {
      miniBosses = [];
      miniBossSpawnTimer = 0;
      return;
    }
    miniBossSpawnTimer -= dt;
    if (miniBossSpawnTimer <= 0) {
      if (miniBosses.filter((m) => m.alive).length < 3) {
        spawnMiniBoss();
      }
      miniBossSpawnTimer = 3.8 + Math.random() * 3.4;
    }

    const minX = 28;
    const maxX = width - 28;
    const minY = 94;
    const maxY = height * 0.58;
    miniBosses.forEach((mini) => {
      if (!mini.alive) {
        return;
      }
      mini.phase += dt * 4.2;
      mini.x += mini.vx * dt;
      mini.y += mini.vy * dt + Math.sin(mini.phase) * 14 * dt;
      if (mini.x - mini.r < minX) {
        mini.x = minX + mini.r;
        mini.vx = Math.abs(mini.vx);
      } else if (mini.x + mini.r > maxX) {
        mini.x = maxX - mini.r;
        mini.vx = -Math.abs(mini.vx);
      }
      if (mini.y - mini.r < minY) {
        mini.y = minY + mini.r;
        mini.vy = Math.abs(mini.vy);
      } else if (mini.y + mini.r > maxY) {
        mini.y = maxY - mini.r;
        mini.vy = -Math.abs(mini.vy);
      }
    });
    miniBosses = miniBosses.filter((mini) => mini.alive);
  }

  function collideBallWithMiniBoss(ball) {
    for (const mini of miniBosses) {
      if (!mini.alive) {
        continue;
      }
      const dx = ball.x - mini.x;
      const dy = ball.y - mini.y;
      const rr = mini.r + ball.r;
      if (dx * dx + dy * dy > rr * rr) {
        continue;
      }
      const n = Math.sqrt(dx * dx + dy * dy) || 1;
      ball.vx = (dx / n) * Math.max(240, Math.abs(ball.vx));
      ball.vy = (dy / n) * Math.max(240, Math.abs(ball.vy));
      defeatMiniBoss(mini, mini.x, mini.y);
      return true;
    }
    return false;
  }

  function collideBallWithBoss(ball) {
    if (!bossState) {
      return false;
    }

    for (const spot of bossState.weakSpots) {
      const p = bossWeakSpotPosition(spot);
      const dx = ball.x - p.x;
      const dy = ball.y - p.y;
      const rr = bossState.weakRadius + ball.r;
      if (dx * dx + dy * dy <= rr * rr) {
        const lateralHit = Math.abs(ball.vx) > Math.abs(ball.vy) * 1.15;
        const damage = lateralHit ? 2 : 1;
        bossState.hp -= damage;
        const n = Math.sqrt(dx * dx + dy * dy) || 1;
        ball.vx = (dx / n) * Math.max(220, Math.abs(ball.vx));
        ball.vy = (dy / n) * Math.max(220, Math.abs(ball.vy));
        makeParticles(p.x, p.y, lateralHit ? "rgba(251, 113, 133, 0.9)" : "rgba(253, 224, 71, 0.82)", lateralHit ? 24 : 15);
        registerBrickHit(lateralHit ? 28 : 20, p.x, p.y);
        playTone(lateralHit ? 260 : 220, 0.08, 0.07);
        startShake(lateralHit ? 4.5 : 3.2, 0.11);
        if (!lateralHit) {
          statusEl.textContent = "Boss weak points can be hit from any angle. Side hits deal extra damage.";
        }
        if (bossState.hp <= 0) {
          registerBrickHit(260, bossState.x, bossState.y);
          makeParticles(bossState.x, bossState.y, "rgba(251, 113, 133, 0.95)", 60);
          bossState = null;
        }
        return true;
      }
    }

    const left = bossState.x - bossState.w / 2;
    const top = bossState.y - bossState.h / 2;
    if (rectCircleHit({ x: left, y: top, w: bossState.w, h: bossState.h }, ball)) {
      // Allow diving into the boss from above so weak points remain reachable.
      if (ball.y < bossState.y && ball.vy > 0) {
        return false;
      }
      // Boss armor body bounces on other directions.
      if (ball.y < bossState.y) {
        ball.vy = -Math.abs(ball.vy);
      } else if (ball.y > bossState.y) {
        ball.vy = Math.abs(ball.vy);
      } else {
        ball.vx *= -1;
      }
      startShake(1.7, 0.08);
      playTone(200, 0.045, 0.03);
      return true;
    }
    return false;
  }

  function updateOneBall(ball, dt) {
    if (!ball.alive || ball.stuck) {
      return;
    }
    const prevX = ball.x;
    const prevY = ball.y;

    ball.x += ball.vx * dt * speedScale;
    ball.y += ball.vy * dt * speedScale;
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 12) {
      ball.trail.shift();
    }

    if (ball.x - ball.r <= 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      playTone(340, 0.035, 0.02);
    } else if (ball.x + ball.r >= width) {
      ball.x = width - ball.r;
      ball.vx = -Math.abs(ball.vx);
      playTone(340, 0.035, 0.02);
    }
    if (ball.y - ball.r <= 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      playTone(340, 0.035, 0.02);
    }

    if (ball.y - ball.r > height) {
      ball.alive = false;
      return;
    }

    if (rectCircleHit({ x: paddle.x, y: paddle.y, w: paddle.w, h: paddle.h }, ball) && ball.vy > 0) {
      const hitPoint = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      ball.vx = hitPoint * 360;
      ball.vy = -Math.abs(ball.vy);
      makeParticles(ball.x, paddle.y, "rgba(125, 211, 252, 0.85)", 9);
      playTone(300, 0.045, 0.03);
      if (activePower.type === "catch") {
        ball.stuck = true;
        ball.y = paddle.y - ball.r - 1;
        ball.trail = [];
        statusEl.textContent = "Sticky paddle active. Click board (or press Space) to relaunch.";
      }
    }

    if (collideBallWithMiniBoss(ball)) {
      return;
    }

    if (collideBallWithBoss(ball)) {
      return;
    }

    for (const brick of bricks) {
      if (!brick.alive || !rectCircleHit(brick, ball)) {
        continue;
      }
      if (brick.indestructible) {
        resolveBrickCollision(ball, prevX, prevY, brick);
        makeParticles(ball.x, ball.y, "rgba(148, 163, 184, 0.75)", 8);
        playTone(170, 0.04, 0.03);
        break;
      }
      brick.hp -= 1;
      if (activePower.type !== "pierce") {
        resolveBrickCollision(ball, prevX, prevY, brick);
      }
      makeParticles(ball.x, ball.y, "rgba(251, 146, 60, 0.78)", 12);
      playTone(430, 0.04, 0.03);

      if (brick.hp <= 0) {
        brick.alive = false;
        registerBrickHit(12, ball.x, ball.y);
        maybeSpawnPower(brick);
      } else {
        registerBrickHit(5, ball.x, ball.y);
      }
      break;
    }
  }

  function updateBalls(dt) {
    balls.forEach((ball) => updateOneBall(ball, dt));
    balls = balls.filter((b) => b.alive);

    if (!balls.length && running) {
      lives -= 1;
      combo = 1;
      comboTimer = 0;
      clearTransientEffects();
      if (lives <= 0) {
        playTone(120, 0.25, 0.08);
        endRun("Game over. Click the board to start a new run.");
        return;
      }
      playTone(160, 0.15, 0.06);
      startShake(7, 0.25);
      statusEl.textContent = "Life lost. Click board (or press Space) to relaunch.";
      resetSingleBall();
    }
  }

  function updateLevelProgress() {
    const regularCleared = bricks.length === 0 || !bricks.some((b) => b.alive && !b.indestructible);
    const bossCleared = bossState === null;
    if (!regularCleared || !bossCleared) {
      return;
    }

    if (level >= maxCampaignLevel) {
      playTone(780, 0.2, 0.08);
      playTone(980, 0.22, 0.07);
      endRun("Campaign complete. You finished all levels. Click board to replay.");
      showFinishScreen(`Campaign complete. Final score: ${score}.`);
      return;
    }

    level += 1;
    combo = 1;
    comboTimer = 0;
    clearTransientEffects();
    spawnBricks();
    resetSingleBall();
    if (isBossLevel()) {
      statusEl.textContent =
        bossState && bossState.kind === "hydra-gate"
          ? `Boss level ${level} (Hydra). Weak points take any hit; mini bosses drop power-ups.`
          : `Boss level ${level} (Sentinel). Weak points take any hit; mini bosses drop power-ups.`;
    } else if (level === 7) {
      statusEl.textContent = "Level 7: armored walls active. Use lane gaps.";
    } else if (level >= 8) {
      statusEl.textContent = `Level ${level}: expect reinforcement bricks over time.`;
    } else {
      statusEl.textContent = `Level ${level} ready. Click board (or press Space) to launch.`;
    }
    playTone(620, 0.1, 0.05);
  }

  function drawRoundedRect(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    const pulse = 0.5 + 0.5 * Math.sin(visualClock * 0.9);
    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0, "#060b1f");
    grd.addColorStop(0.55, "#11224d");
    grd.addColorStop(1, "#172554");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    const halo = ctx.createRadialGradient(width * 0.76, height * 0.12, 10, width * 0.76, height * 0.12, 260);
    halo.addColorStop(0, "rgba(56, 189, 248, 0.18)");
    halo.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `rgba(147, 197, 253, ${0.06 + pulse * 0.04})`;
    for (let x = 40; x < width; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 120, height);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(2, 6, 23, 0.33)";
    ctx.fillRect(0, height - 50, width, 50);
  }

  function drawBricks() {
    if (bossState) {
      const bx = bossState.x - bossState.w / 2;
      const by = bossState.y - bossState.h / 2;
      const pulse = 0.5 + 0.5 * Math.sin(visualClock * 3.2);
      const shell = ctx.createLinearGradient(bx, by, bx, by + bossState.h);
      if (bossState.kind === "hydra-gate") {
        shell.addColorStop(0, "#4c1d95");
        shell.addColorStop(1, "#1e1b4b");
      } else {
        shell.addColorStop(0, "#881337");
        shell.addColorStop(1, "#7f1d1d");
      }
      drawRoundedRect(bx, by, bossState.w, bossState.h, 20);
      ctx.fillStyle = shell;
      ctx.fill();
      ctx.strokeStyle = "rgba(251, 113, 133, 0.45)";
      ctx.lineWidth = 2;
      drawRoundedRect(bx, by, bossState.w, bossState.h, 20);
      ctx.stroke();

      // core
      ctx.beginPath();
      ctx.arc(bossState.x, bossState.y, bossState.coreRadius + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = bossState.kind === "hydra-gate" ? "rgba(168, 85, 247, 0.22)" : "rgba(251, 113, 133, 0.18)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bossState.x, bossState.y, bossState.coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = bossState.kind === "hydra-gate" ? "#a855f7" : "#fb7185";
      ctx.fill();

      // weak spots
      bossState.weakSpots.forEach((spot) => {
        const p = bossWeakSpotPosition(spot);
        ctx.beginPath();
        ctx.arc(p.x, p.y, bossState.weakRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(253, 224, 71, 0.18)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, bossState.weakRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#fde047";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, bossState.weakRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = "#7c2d12";
        ctx.fill();
      });

      miniBosses.forEach((mini) => {
        const glow = ctx.createRadialGradient(mini.x, mini.y, 3, mini.x, mini.y, mini.r + 10);
        glow.addColorStop(0, "rgba(52, 211, 153, 0.35)");
        glow.addColorStop(1, "rgba(52, 211, 153, 0)");
        ctx.beginPath();
        ctx.arc(mini.x, mini.y, mini.r + 8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mini.x, mini.y, mini.r, 0, Math.PI * 2);
        const body = ctx.createLinearGradient(mini.x - mini.r, mini.y - mini.r, mini.x + mini.r, mini.y + mini.r);
        body.addColorStop(0, "#86efac");
        body.addColorStop(1, "#059669");
        ctx.fillStyle = body;
        ctx.fill();
        ctx.strokeStyle = "rgba(236, 253, 245, 0.85)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mini.x, mini.y, mini.r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6, 78, 59, 0.8)";
        ctx.fill();
      });

      // HP bar
      const ratio = Math.max(0, bossState.hp / bossState.maxHp);
      drawRoundedRect(bx + 12, by + 10, bossState.w - 24, 12, 6);
      ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
      ctx.fill();
      drawRoundedRect(bx + 12, by + 10, (bossState.w - 24) * ratio, 12, 6);
      ctx.fillStyle = "#f43f5e";
      ctx.fill();
      ctx.fillStyle = "#fecaca";
      ctx.font = "bold 14px Space Grotesk, sans-serif";
      ctx.fillText(bossState.kind === "hydra-gate" ? "BOSS: HYDRA GATE" : "BOSS: SENTINEL", bx + 14, by + bossState.h - 12);
      ctx.fillStyle = "rgba(254, 242, 242, 0.95)";
      ctx.font = "bold 12px Space Grotesk, sans-serif";
      ctx.fillText("Weak points: any hit works. Mini bosses spawn with guaranteed power-up drops.", bx + 14, by + bossState.h + 5);
    }

    bricks.forEach((b) => {
      if (!b.alive) {
        return;
      }
      if (b.indestructible) {
        const ig = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        ig.addColorStop(0, "#94a3b8");
        ig.addColorStop(1, "#334155");
        drawRoundedRect(b.x, b.y, b.w, b.h, 7);
        ctx.fillStyle = ig;
        ctx.fill();
        ctx.strokeStyle = "rgba(226,232,240,0.35)";
        drawRoundedRect(b.x, b.y, b.w, b.h, 7);
        ctx.stroke();
        ctx.fillStyle = "rgba(15,23,42,0.7)";
        ctx.fillRect(b.x + b.w * 0.45, b.y + 4, 2, b.h - 8);
        return;
      }
      const base = brickPalette[b.hp] || brickPalette[1];
      const hi = b.hp > 2 ? "#c4b5fd" : b.hp > 1 ? "#67e8f9" : "#fdba74";
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      grad.addColorStop(0, hi);
      grad.addColorStop(1, base);
      drawRoundedRect(b.x, b.y, b.w, b.h, 7);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      drawRoundedRect(b.x, b.y, b.w, b.h, 7);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      drawRoundedRect(b.x + 2, b.y + 2, b.w - 4, 5, 3);
      ctx.fill();
      if (b.dropPower && b.hp === 1) {
        ctx.fillStyle = "rgba(16,185,129,0.55)";
        ctx.fillRect(b.x + b.w / 2 - 4, b.y + 5, 8, 8);
      }
    });
  }

  function drawPaddleBalls() {
    ctx.shadowColor = activePower.type === "expand" ? "rgba(134, 239, 172, 0.6)" : "rgba(125, 211, 252, 0.45)";
    ctx.shadowBlur = 16;
    const pGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
    pGrad.addColorStop(0, activePower.type === "expand" ? "#a7f3d0" : "#f8fafc");
    pGrad.addColorStop(1, activePower.type === "expand" ? "#4ade80" : "#cbd5e1");
    drawRoundedRect(paddle.x, paddle.y, paddle.w, paddle.h, 7);
    ctx.fillStyle = pGrad;
    ctx.fill();
    ctx.shadowBlur = 0;

    balls.forEach((ball) => {
      if (ball.trail && ball.trail.length) {
        for (let i = 0; i < ball.trail.length; i += 1) {
          const t = ball.trail[i];
          const alpha = (i + 1) / ball.trail.length;
          ctx.beginPath();
          ctx.arc(t.x, t.y, Math.max(1, ball.r - 2), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${0.05 + alpha * 0.12})`;
          ctx.fill();
        }
      }
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.shadowColor = activePower.type === "pierce" ? "rgba(251, 113, 133, 0.8)" : "rgba(125, 211, 252, 0.7)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = activePower.type === "pierce" ? "#fb7185" : speedScale < 1 ? "#67e8f9" : "#f8fafc";
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function drawPowerDrops() {
    powerDrops.forEach((drop) => {
      const pulse = 0.65 + 0.35 * Math.sin(visualClock * 6 + drop.x * 0.02);
      const auraRadius = 13 + pulse * 5;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle =
        drop.tier === "rare"
          ? "rgba(251, 113, 133, 0.16)"
          : drop.tier === "uncommon"
          ? "rgba(250, 204, 21, 0.14)"
          : "rgba(103, 232, 249, 0.12)";
      ctx.fill();
      const def = powerDefs[drop.type];
      drawPowerDropShape(drop, 11);
      ctx.fillStyle = def ? def.color : "#22d3ee";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle =
        drop.tier === "rare" ? "#fef2f2" : drop.tier === "uncommon" ? "#fef9c3" : "rgba(255,255,255,0.75)";
      ctx.stroke();
      drawPowerIcon(drop.type, drop.x, drop.y, 7.2);
    });
  }

  function drawLasers() {
    laserShots.forEach((shot) => {
      const grad = ctx.createLinearGradient(shot.x, shot.y + 16, shot.x, shot.y - 16);
      grad.addColorStop(0, "rgba(196, 132, 252, 0.0)");
      grad.addColorStop(0.35, "rgba(216, 180, 254, 0.9)");
      grad.addColorStop(1, "rgba(244, 228, 255, 0.95)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y + 10);
      ctx.lineTo(shot.x, shot.y - 12);
      ctx.stroke();
    });
  }

  function drawPowerDropShape(drop, radius) {
    const x = drop.x;
    const y = drop.y;
    if (drop.tier === "uncommon") {
      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius, y);
      ctx.lineTo(x, y + radius);
      ctx.lineTo(x - radius, y);
      ctx.closePath();
      return;
    }
    if (drop.tier === "rare") {
      const r = radius;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.8, y - r * 0.45);
      ctx.lineTo(x + r * 0.8, y + r * 0.45);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.8, y + r * 0.45);
      ctx.lineTo(x - r * 0.8, y - r * 0.45);
      ctx.closePath();
      return;
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }

  function drawPowerIcon(type, x, y, s) {
    ctx.save();
    ctx.strokeStyle = "#0b132b";
    ctx.fillStyle = "#0b132b";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (type === "multiball") {
      ctx.beginPath();
      ctx.arc(x - s * 0.9, y + s * 0.2, s * 0.45, 0, Math.PI * 2);
      ctx.arc(x + s * 0.9, y + s * 0.2, s * 0.45, 0, Math.PI * 2);
      ctx.arc(x, y - s * 0.6, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (type === "pierce") {
      ctx.beginPath();
      ctx.moveTo(x - s * 1.3, y);
      ctx.lineTo(x + s * 0.7, y);
      ctx.moveTo(x + s * 0.35, y - s * 0.45);
      ctx.lineTo(x + s * 0.8, y);
      ctx.lineTo(x + s * 0.35, y + s * 0.45);
      ctx.moveTo(x + s * 1.05, y - s * 0.95);
      ctx.lineTo(x + s * 1.05, y + s * 0.95);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (type === "life") {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 1.0);
      ctx.bezierCurveTo(x - s * 1.5, y + s * 0.1, x - s * 1.2, y - s * 1.1, x, y - s * 0.35);
      ctx.bezierCurveTo(x + s * 1.2, y - s * 1.1, x + s * 1.5, y + s * 0.1, x, y + s * 1.0);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (type === "laser") {
      ctx.beginPath();
      ctx.moveTo(x - s * 1.1, y + s * 0.9);
      ctx.lineTo(x + s * 1.1, y + s * 0.9);
      ctx.moveTo(x - s * 0.65, y + s * 0.9);
      ctx.lineTo(x - s * 0.65, y - s * 0.8);
      ctx.moveTo(x + s * 0.65, y + s * 0.9);
      ctx.lineTo(x + s * 0.65, y - s * 0.8);
      ctx.moveTo(x - s * 0.65, y - s * 0.2);
      ctx.lineTo(x + s * 0.65, y - s * 0.2);
      ctx.moveTo(x, y - s * 0.2);
      ctx.lineTo(x, y - s * 1.1);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (type === "expand") {
      ctx.beginPath();
      ctx.moveTo(x - s * 1.2, y);
      ctx.lineTo(x + s * 1.2, y);
      ctx.moveTo(x - s * 1.2, y);
      ctx.lineTo(x - s * 0.7, y - s * 0.45);
      ctx.moveTo(x - s * 1.2, y);
      ctx.lineTo(x - s * 0.7, y + s * 0.45);
      ctx.moveTo(x + s * 1.2, y);
      ctx.lineTo(x + s * 0.7, y - s * 0.45);
      ctx.moveTo(x + s * 1.2, y);
      ctx.lineTo(x + s * 0.7, y + s * 0.45);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (type === "catch") {
      ctx.beginPath();
      ctx.moveTo(x - s * 0.9, y - s * 0.9);
      ctx.lineTo(x - s * 0.9, y + s * 0.55);
      ctx.arc(x, y + s * 0.55, s * 0.9, Math.PI, 0, false);
      ctx.lineTo(x + s * 0.9, y - s * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - s * 0.9, y - s * 0.95, s * 0.25, 0, Math.PI * 2);
      ctx.arc(x + s * 0.9, y - s * 0.95, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (type === "slow") {
      ctx.beginPath();
      ctx.arc(x, y, s * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - s * 0.55);
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * 0.45, y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.arc(x, y, s * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawComboPops() {
    ctx.save();
    comboPops.forEach((pop) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, pop.life));
      ctx.fillStyle = pop.color;
      ctx.strokeStyle = "rgba(15,23,42,0.55)";
      ctx.lineWidth = 2;
      ctx.font = "bold 15px Space Grotesk, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.globalAlpha = 1;
    });
    ctx.restore();
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  function drawPauseOverlay() {
    if (!paused) {
      return;
    }
    ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 44px Space Grotesk, sans-serif";
    ctx.fillText("PAUSED", width / 2 - 90, height / 2);
  }

  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.033);
    lastTs = ts;
    visualClock = ts * 0.001;

    if (running && !paused) {
      updateInput(dt);
      updateBossState(dt);
      updateMiniBosses(dt);
      updateBalls(dt);
      updatePowers(dt);
      updateReinforcements(dt);
      updateLasers(dt);
      updateParticles(dt);
      updateComboPops(dt);
      updateCombo(dt);
      updateLevelProgress();
      updateShake(dt);
      syncHud();
    } else if (screenShake.timer > 0) {
      updateShake(dt);
    }

    ctx.save();
    let shakeX = 0;
    let shakeY = 0;
    if (screenShake.timer > 0) {
      shakeX = (Math.random() - 0.5) * 2 * screenShake.strength;
      shakeY = (Math.random() - 0.5) * 2 * screenShake.strength;
    }
    ctx.translate(cameraOffset.x + shakeX, cameraOffset.y + shakeY);
    drawBackground();
    drawBricks();
    drawPowerDrops();
    drawLasers();
    drawPaddleBalls();
    drawParticles();
    drawComboPops();
    drawPauseOverlay();
    ctx.restore();

    rafId = window.requestAnimationFrame(loop);
  }

  function launchFromBoard() {
    if (paused) {
      return;
    }
    if (lives <= 0 || level > maxCampaignLevel) {
      restartRun();
    }
    if (!running) {
      running = true;
    }
    balls.forEach((ball) => {
      if (ball.stuck) {
        ball.stuck = false;
      }
    });
    statusEl.textContent = "Ball launched.";
    playTone(520, 0.05, 0.04);
    syncHud();
  }

  function togglePause() {
    if (!running) {
      return;
    }
    paused = !paused;
    statusEl.textContent = paused ? "Paused. Press P or button to resume." : "Resumed.";
    syncHud();
  }

  function onKeyDown(e) {
    keys.add(e.key);
    if (e.key === " ") {
      launchFromBoard();
    }
    if (e.key === "p" || e.key === "P") {
      togglePause();
    }
  }

  function onKeyUp(e) {
    keys.delete(e.key);
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    paddle.x = Math.max(0, Math.min(width - paddle.w, x - paddle.w / 2));
    balls.forEach((ball) => {
      if (ball.stuck) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 1;
      }
    });
  }

  soundBtn.addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    if (!soundEnabled && audioCtx && audioCtx.state !== "closed") {
      audioCtx.suspend().catch(function () {});
    }
    syncHud();
  });

  pauseBtn.addEventListener("click", function () {
    togglePause();
  });
  if (resumeOverlayBtn) {
    resumeOverlayBtn.addEventListener("click", function () {
      if (paused) {
        togglePause();
      }
    });
  }
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", function () {
      restartRun();
    });
  }

  resetBtn.addEventListener("click", function () {
    restartRun();
  });
  if (levelPickerEl) {
    levelPickerEl.addEventListener("change", function () {
      const nextLevel = Number(levelPickerEl.value);
      if (!Number.isFinite(nextLevel) || nextLevel < 1 || nextLevel > maxCampaignLevel) {
        return;
      }
      selectedStartLevel = nextLevel;
      restartRun();
      statusEl.textContent = `Debug level set to ${selectedStartLevel}. Click board to launch.`;
    });
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  const onTouchMove = function (e) {
    const touch = e.touches[0];
    if (touch) {
      onPointerMove(touch);
    }
  };
  const onTouchStart = function (e) {
    e.preventDefault();
    launchFromBoard();
  };

  canvas.addEventListener("mousemove", onPointerMove);
  canvas.addEventListener("touchmove", onTouchMove);
  canvas.addEventListener("click", launchFromBoard);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });

  populateLevelPicker();
  restartRun();
  lastTs = performance.now();
  rafId = window.requestAnimationFrame(loop);

  return function cleanup() {
    running = false;
    paused = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("mousemove", onPointerMove);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("click", launchFromBoard);
    canvas.removeEventListener("touchstart", onTouchStart);
  };
}

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(brickBreakerGame);
