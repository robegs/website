const sketchRigChallengeGame = {
  id: "sketch-rig-challenge",
  title: "Sketch Rig Challenge",
  description: "Draw any silhouette. The exact shape is the moving physics body.",
  difficulty: "Shape design, stability, and level adaptation",
  setup: setupSketchRigChallenge,
};

function setupSketchRigChallenge(container) {
  const drawWidth = 360;
  const drawHeight = 240;
  const worldWidth = 980;
  const worldHeight = 520;
  const gravity = 760;
  const artPaths = {
    treeSmall: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/tree_small.png",
    treeLarge: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/tree_large.png",
    rock1: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/rock1.png",
    rock2: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/rock2.png",
    rock3: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/rock3.png",
    barrel: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/barrel_red.png",
    tires: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/tires_white_alt.png",
    barrier: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/barrier_red_race.png",
    barrierWhite: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/barrier_white_race.png",
    cone: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/cone_straight.png",
    arrow: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/arrow_yellow.png",
    light: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/light_yellow.png",
    tentBlue: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/tent_blue_large.png",
    tribune: "assets/games/neon-rift-rally/kenney/racing-pack/PNG/Objects/tribune_overhang_striped.png",
  };

  const levels = [
    { name: "Warmup", hint: "Any shape can move here.", finishX: 980, timeLimit: 38, challenges: [{ type: "rough", x: 340, width: 170, roughness: 1.2, label: "Rough patch" }] },
    { name: "Steps", hint: "Compact stable shapes climb better.", finishX: 1140, timeLimit: 44, challenges: [{ type: "step", x: 360, width: 110, height: 24, label: "Step A" }, { type: "step", x: 560, width: 120, height: 35, label: "Step B" }] },
    { name: "Gap", hint: "Long/fast rigs clear jumps better.", finishX: 1260, timeLimit: 48, challenges: [{ type: "gap", x: 500, width: 150, label: "Gap" }] },
    { name: "Low Tunnel", hint: "Tall shapes hit the ceiling bar.", finishX: 1320, timeLimit: 50, challenges: [{ type: "ceiling", x: 530, width: 230, clearance: 66, label: "Tunnel" }, { type: "rough", x: 800, width: 150, roughness: 1.35, label: "Gravel" }] },
    { name: "Mixed", hint: "Needs balance: grip + speed + low profile.", finishX: 1530, timeLimit: 56, challenges: [{ type: "step", x: 330, width: 120, height: 28, label: "Step" }, { type: "gap", x: 640, width: 120, label: "Split" }, { type: "ceiling", x: 920, width: 200, clearance: 72, label: "Gate" }] },
  ];
  const levelThemes = [
    { skyTop: "#b7ecff", skyMid: "#d7f6ff", skyBottom: "#fff3d7", farHill: "#c7dcb8", nearHill: "#86b17d", cloud: "rgba(255,255,255,0.72)", sunCore: "rgba(255,249,196,0.95)", sunMid: "rgba(255,208,122,0.42)", sunOuter: "rgba(255,208,122,0)" },
    { skyTop: "#d9dcff", skyMid: "#f0ddff", skyBottom: "#ffe0c4", farHill: "#c7b5df", nearHill: "#8f79ba", cloud: "rgba(255,247,255,0.68)", sunCore: "rgba(255,229,176,0.92)", sunMid: "rgba(255,156,169,0.34)", sunOuter: "rgba(255,156,169,0)" },
    { skyTop: "#a6d8ff", skyMid: "#d0f1ff", skyBottom: "#eaffd1", farHill: "#aad6cb", nearHill: "#5ea993", cloud: "rgba(243,255,255,0.64)", sunCore: "rgba(240,255,210,0.94)", sunMid: "rgba(129,226,217,0.34)", sunOuter: "rgba(129,226,217,0)" },
    { skyTop: "#15213d", skyMid: "#28456d", skyBottom: "#5f87a7", farHill: "#26365b", nearHill: "#162540", cloud: "rgba(220,236,255,0.16)", sunCore: "rgba(255,255,244,0.78)", sunMid: "rgba(156,196,255,0.22)", sunOuter: "rgba(156,196,255,0)" },
    { skyTop: "#ffe0c7", skyMid: "#ffd0df", skyBottom: "#fff4c5", farHill: "#d9b2b8", nearHill: "#b46b79", cloud: "rgba(255,248,239,0.62)", sunCore: "rgba(255,243,196,0.94)", sunMid: "rgba(255,166,103,0.32)", sunOuter: "rgba(255,166,103,0)" },
  ];
  const fixtureCatalog = [
    { id: "wheel-cart", label: "Wheel Cart" },
    { id: "uneven-cart", label: "Uneven Cart" },
    { id: "walker", label: "Walker" },
    { id: "trike", label: "Trike" },
    { id: "crawler", label: "Crawler" },
    { id: "glider", label: "Glider" },
    { id: "climber", label: "Climber" },
  ];
  const fixtureExpectations = {
    "wheel-cart": {
      summary: "Both wheels stay planted on flat ground and roll the cart forward without hopping.",
      minProgress: 1,
      maxAbsAngleDeg: 26,
      minGroundedWheelRatio: 1.75,
      minFramesWithTwoWheels: 0.72,
      minAvgSpeed: 36,
      maxSingleSupportPeak: 0.22,
    },
    "uneven-cart": {
      summary: "A cart with different wheel sizes still keeps both wheels grounded on flat terrain.",
      minProgress: 1,
      maxAbsAngleDeg: 28,
      minGroundedWheelRatio: 1.8,
      minFramesWithTwoWheels: 0.76,
      minAvgSpeed: 34,
      maxSingleSupportPeak: 0.24,
    },
    walker: {
      summary: "Two legs alternate support, with frequent double-support moments and steady walking progress.",
      minProgress: 1,
      maxAbsAngleDeg: 32,
      minGroundedLegRatio: 1.1,
      minFramesWithTwoLegs: 0.22,
      minAvgSpeed: 26,
      maxSingleSupportPeak: 0.5,
    },
    trike: {
      summary: "At least two wheels stay down almost all the time, keeping a stable rolling platform.",
      minProgress: 1,
      maxAbsAngleDeg: 24,
      minGroundedWheelRatio: 2.05,
      minFramesWithTwoWheels: 0.85,
      minAvgSpeed: 40,
      maxSingleSupportPeak: 0.18,
    },
    crawler: {
      summary: "Multiple legs maintain broad support and crawl steadily with little lift-off.",
      minProgress: 1,
      maxAbsAngleDeg: 28,
      minGroundedLegRatio: 1.45,
      minFramesWithTwoLegs: 0.5,
      minAvgSpeed: 24,
      maxSingleSupportPeak: 0.3,
    },
    glider: {
      summary: "Tail-and-fin rigs do not self-propel on flat ground; they only stabilize if external speed exists.",
      maxProgress: 0.2,
      maxAbsAngleDeg: 30,
      maxAvgSpeed: 10,
      maxSingleSupportPeak: 40,
      requiresWarmupClear: false,
    },
    climber: {
      summary: "Legs provide the main support on flat ground while arms do not destabilize the chassis.",
      minProgress: 1,
      maxAbsAngleDeg: 30,
      minGroundedLegRatio: 1.1,
      minFramesWithTwoLegs: 0.2,
      minAvgSpeed: 24,
      maxSingleSupportPeak: 0.42,
    },
  };

  const root = document.createElement("div");
  root.className = "lab-game src-game src-game--workshop";
  root.innerHTML = `
    <section class="src-mission-card" aria-labelledby="src-mission-title">
      <div class="src-mission-copy">
        <p class="src-mission-kicker" id="src-mission-kicker">Start here · Level 1</p>
        <h4 id="src-mission-title">Build a rig that reaches the finish flag.</h4>
        <p>Use a proven starter rig first, or make your own by choosing a part and tapping the blueprint.</p>
      </div>
      <div class="src-starter-rigs" aria-label="Starter rigs">
        <button type="button" class="src-starter-rig is-recommended" data-src-fixture="wheel-cart" data-src-run="true">
          <span>01</span><strong>Starter Cart</strong><small>Fastest way to learn</small>
        </button>
        <button type="button" class="src-starter-rig" data-src-fixture="trike" data-src-run="false">
          <span>02</span><strong>Stable Trike</strong><small>Extra ground support</small>
        </button>
        <button type="button" class="src-starter-rig" id="src-build-own">
          <span>03</span><strong>Build Your Own</strong><small>Start from the body</small>
        </button>
      </div>
      <ol class="src-steps" aria-label="Play steps"><li><b>1</b> Pick or build</li><li><b>2</b> Analyze</li><li><b>3</b> Run and refine</li></ol>
    </section>
    <section class="src-command-bar" aria-label="Rig controls">
      <div class="src-level-control">
        <button type="button" class="btn ghost" id="src-prev" aria-label="Previous test track">Previous</button>
        <div class="src-level-readout"><span>Test track</span><strong id="src-level-name">Warmup</strong><small id="src-level">1 / ${levels.length}</small></div>
        <button type="button" class="btn ghost" id="src-next" aria-label="Next test track">Next</button>
      </div>
      <div class="src-run-control">
        <button type="button" class="btn ghost" id="src-analyze">Analyze rig</button>
        <button type="button" class="btn primary src-run-button" id="src-run" aria-pressed="false">Run test</button>
        <button type="button" class="btn ghost" id="src-retry">Retry</button>
      </div>
      <div class="src-edit-control">
        <button type="button" class="btn ghost" id="src-undo">Undo</button>
        <button type="button" class="btn ghost" id="src-clear">Reset design</button>
      </div>
      <div class="src-dev-tools">
        <button type="button" class="btn ghost" id="src-debug-toggle" aria-expanded="false">Developer tools</button>
        <div class="src-debug-panel" id="src-debug-panel" hidden>
          <label class="src-debug-label" for="src-fixture-select">Fixture</label>
          <select id="src-fixture-select" class="src-debug-select">
            ${fixtureCatalog.map((fixture) => `<option value="${fixture.id}">${fixture.label}</option>`).join("")}
          </select>
          <button type="button" class="btn ghost" id="src-load-fixture">Load Fixture</button>
          <button type="button" class="btn ghost" id="src-run-fixture">Load + Run</button>
          <button type="button" class="btn ghost" id="src-run-regression">Run Regression</button>
          <button type="button" class="btn ghost" id="src-tune-physics">Tune Physics</button>
        </div>
      </div>
    </section>
    <section class="src-course-brief" aria-label="Current course objective">
      <div><span class="src-course-label">Mission</span><strong id="src-course-objective">Reach the finish flag before time runs out.</strong></div>
      <ol class="src-course-preview" id="src-course-preview" aria-label="Course obstacles"></ol>
    </section>
    <div class="src-layout">
      <section class="src-panel src-builder-panel" aria-labelledby="src-builder-title">
        <p class="src-panel-kicker">1 · Build</p>
        <h4 id="src-builder-title">Rig Blueprint</h4>
        <p class="src-help" id="src-help">The blue oval is the starter chassis. Choose a part, then tap the blueprint once to place it. Desktop players can also drag parts.</p>
        <div class="src-part-palette" id="src-part-palette" role="toolbar" aria-label="Rig parts">
          <button type="button" class="btn ghost src-part-chip src-part-chip--structure" data-part-type="structure" draggable="true" aria-pressed="false"><b>Brace</b><small>stiffens</small></button>
          <button type="button" class="btn ghost src-part-chip src-part-chip--wheel" data-part-type="wheel" draggable="true" aria-pressed="false"><b>Wheel</b><small>rolls</small></button>
          <button type="button" class="btn ghost src-part-chip src-part-chip--leg" data-part-type="leg" draggable="true" aria-pressed="false"><b>Leg</b><small>steps</small></button>
          <button type="button" class="btn ghost src-part-chip src-part-chip--fin" data-part-type="fin" draggable="true" aria-pressed="false"><b>Fin</b><small>balances air</small></button>
          <button type="button" class="btn ghost src-part-chip src-part-chip--tail" data-part-type="tail" draggable="true" aria-pressed="false"><b>Tail</b><small>steadies</small></button>
          <button type="button" class="btn ghost src-part-chip src-part-chip--arm" data-part-type="arm" draggable="true" aria-pressed="false"><b>Arm</b><small>grips</small></button>
        </div>
        <p class="src-placement-note" id="src-placement-note" aria-live="polite">Choose one part, then tap the blueprint once. Select an item below to edit it without drawing precision.</p>
        <canvas id="src-draw" width="${drawWidth}" height="${drawHeight}" class="src-draw" tabindex="0" role="img" aria-label="Rig blueprint. The large blue oval is the chassis. Use the part buttons and rig elements list to build and edit it." aria-describedby="src-help src-placement-note"></canvas>
        <div class="src-canvas-legend" aria-label="Blueprint legend"><span class="src-legend-chassis">Chassis</span><span class="src-legend-wheel">Wheel</span><span class="src-legend-leg">Leg</span><span class="src-legend-stability">Stabilizer</span><span class="src-legend-com">Centre of mass</span></div>
        <p class="src-hint" id="src-level-hint"></p>
        <section class="src-inspect-panel" aria-labelledby="src-inspect-title">
          <div class="src-inspect-heading"><div><p class="src-panel-kicker">2 · Inspect</p><h4 id="src-inspect-title">Rig intelligence</h4></div><span class="src-readiness-badge" id="src-readiness-badge">Draft</span></div>
          <p class="src-readiness-copy" id="src-readiness" aria-live="polite">Add two wheels or legs to give the chassis a stable support base.</p>
          <div class="src-analysis-summary" id="src-analysis-summary"></div>
          <div class="src-selection-inspector" id="src-selection-inspector"></div>
          <div class="src-element-actions"><button type="button" class="btn ghost" id="src-delete-selected" disabled>Remove selected</button><button type="button" class="btn ghost" id="src-duplicate-selected" disabled>Duplicate</button></div>
          <ol class="src-elements-list" id="src-elements-list" aria-label="Rig elements"></ol>
          <details class="src-metrics-details"><summary>Engineering metrics</summary><div class="hud src-engineering-hud">
            <div class="hud-item"><strong>Time</strong><div id="src-timer">--</div></div>
            <div class="hud-item"><strong>Parts</strong><div id="src-parts">none</div></div>
            <div class="hud-item"><strong>Build load</strong><div id="src-mass">0</div></div>
            <div class="hud-item"><strong>Grip</strong><div id="src-grip">0</div></div>
            <div class="hud-item"><strong>Balance</strong><div id="src-stability">0</div></div>
            <div class="hud-item"><strong>Drive</strong><div id="src-engine">0</div></div>
            <div class="hud-item"><strong>Height</strong><div id="src-height">0px</div></div>
          </div></details>
        </section>
      </section>
      <section class="src-world-wrap" aria-labelledby="src-track-title">
        <div class="src-track-heading"><div><p class="src-panel-kicker">3 · Test</p><h4 id="src-track-title">Test Track</h4></div><span id="src-track-goal">Reach the finish</span></div>
        <canvas id="src-world" width="${worldWidth}" height="${worldHeight}" class="src-world" role="img" aria-label="Animated test track showing the rig, terrain, and finish flag."></canvas>
        <section class="src-run-result" id="src-run-result" hidden aria-live="assertive" aria-labelledby="src-run-result-title">
          <span class="src-result-kicker" id="src-result-kicker">Test result</span><h4 id="src-run-result-title">Ready to test</h4><p id="src-run-result-copy"></p>
          <div><button type="button" class="btn primary" id="src-result-retry">Try again</button><button type="button" class="btn ghost" id="src-result-next">Next track</button></div>
        </section>
      </section>
    </div>
    <p class="status src-status-card" id="src-status" role="status" aria-live="polite" aria-atomic="true">Draw, analyze, run, iterate.</p>
  `;
  container.appendChild(root);

  const levelEl = root.querySelector("#src-level");
  const levelNameEl = root.querySelector("#src-level-name");
  const timerEl = root.querySelector("#src-timer");
  const partsEl = root.querySelector("#src-parts");
  const massEl = root.querySelector("#src-mass");
  const gripEl = root.querySelector("#src-grip");
  const stabilityEl = root.querySelector("#src-stability");
  const engineEl = root.querySelector("#src-engine");
  const heightEl = root.querySelector("#src-height");
  const hintEl = root.querySelector("#src-level-hint");
  const helpEl = root.querySelector("#src-help");
  const placementNoteEl = root.querySelector("#src-placement-note");
  const trackGoalEl = root.querySelector("#src-track-goal");
  const courseObjectiveEl = root.querySelector("#src-course-objective");
  const coursePreviewEl = root.querySelector("#src-course-preview");
  const missionKickerEl = root.querySelector("#src-mission-kicker");
  const statusEl = root.querySelector("#src-status");
  const readinessEl = root.querySelector("#src-readiness");
  const readinessBadgeEl = root.querySelector("#src-readiness-badge");
  const analysisSummaryEl = root.querySelector("#src-analysis-summary");
  const selectionInspectorEl = root.querySelector("#src-selection-inspector");
  const elementsListEl = root.querySelector("#src-elements-list");
  const deleteSelectedEl = root.querySelector("#src-delete-selected");
  const duplicateSelectedEl = root.querySelector("#src-duplicate-selected");
  const runButtonEl = root.querySelector("#src-run");
  const runResultEl = root.querySelector("#src-run-result");
  const resultKickerEl = root.querySelector("#src-result-kicker");
  const resultTitleEl = root.querySelector("#src-run-result-title");
  const resultCopyEl = root.querySelector("#src-run-result-copy");
  const debugPanelEl = root.querySelector("#src-debug-panel");
  const debugToggleEl = root.querySelector("#src-debug-toggle");
  const fixtureSelectEl = root.querySelector("#src-fixture-select");
  const partPaletteEl = root.querySelector("#src-part-palette");
  const drawCanvas = root.querySelector("#src-draw");
  const drawCtx = drawCanvas.getContext("2d");
  const worldCanvas = root.querySelector("#src-world");
  const worldCtx = worldCanvas.getContext("2d");

  const sim = {
    x: 84,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    omega: 0,
    onGround: false,
    contacts: 0,
    attachStates: [],
    gaitTimer: 0,
    swingRight: false,
    stanceX: null,
    stanceTargetVx: 0,
    singleSupportTime: 0,
    backend: "custom",
    planck: null,
  };
  const planckLib = typeof window !== "undefined" ? window.planck : null;
  const pixelsPerMeter = 30;
  let strokes = [];
  let currentStroke = null;
  let placedParts = [];
  let rig = null;
  let baseLocked = false;
  let levelIndex = 0;
  let running = false;
  let paused = false;
  let timer = levels[0].timeLimit;
  let cameraX = 0;
  let phase = 0;
  let lastTs = performance.now();
  let frameAccumulator = 0;
  let rafId = null;
  let messageFlash = 0;
  let stuckTimer = 0;
  let bestProgress = 0;
  let calibration = null;
  let physicsTuning = null;
  let inSelfTest = false;
  let debugOpen = false;
  let selectedPartType = null;
  let selectedElement = null;
  const completedLevels = new Set();
  let draggingPartIndex = -1;
  let resizingPartIndex = -1;
  let dragPartOffset = { x: 0, y: 0 };
  let resizePartStart = null;
  const calibrationStorageKey = "sketchRigChallengeCalibrationV2";
  const physicsTuningStorageKey = "sketchRigChallengePhysicsTuningV1";
  const art = {};

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function currentLevel() { return levels[levelIndex]; }
  function partDisplayName(type) {
    return type === "loop" || type === "wheel" ? "Wheel"
      : type === "leg" ? "Leg"
      : type === "structure" ? "Brace"
      : type === "fin" ? "Fin"
      : type === "tail" ? "Tail"
      : type === "arm" ? "Arm"
      : "Connector";
  }
  function partPurpose(type) {
    return type === "loop" || type === "wheel" ? "rolls and adds ground traction"
      : type === "leg" ? "steps and supports the chassis"
      : type === "structure" ? "stiffens the chassis"
      : type === "fin" ? "balances the rig in the air"
      : type === "tail" ? "steadies the rig"
      : type === "arm" ? "can grip while climbing"
      : "links shapes to the chassis";
  }
  function challengeName(challenge) {
    return challenge.type === "step" ? "Step"
      : challenge.type === "gap" ? "Gap"
      : challenge.type === "ceiling" ? "Low tunnel"
      : challenge.type === "rough" ? "Rough ground"
      : challenge.label || "Obstacle";
  }
  function challengeAdvice(challenge) {
    return challenge.type === "step" ? "A compact rig with two supports climbs more reliably."
      : challenge.type === "gap" ? "A stable, quick rig carries momentum across the gap."
      : challenge.type === "ceiling" ? `Keep the rig below ${challenge.clearance}px to fit the tunnel.`
      : challenge.type === "rough" ? "A wider support base keeps traction over rough ground."
      : "Build for the upcoming obstacle.";
  }
  function setStatus(msg, pulse) {
    if (inSelfTest) return;
    statusEl.textContent = msg;
    if (pulse) messageFlash = 0.5;
  }
  function syncDebugPanel() {
    if (!debugPanelEl) return;
    debugPanelEl.hidden = !debugOpen;
    if (debugToggleEl) debugToggleEl.setAttribute("aria-expanded", String(debugOpen));
  }
  function syncPartSelection() {
    partPaletteEl.querySelectorAll(".src-part-chip").forEach(function (chip) {
      chip.classList.toggle("is-selected", chip.dataset.partType === selectedPartType);
      chip.setAttribute("aria-pressed", String(chip.dataset.partType === selectedPartType));
    });
    if (selectedPartType) {
      helpEl.textContent = `${partDisplayName(selectedPartType)} selected. Tap the blueprint once to place it, then use the elements list to refine it.`;
      if (placementNoteEl) placementNoteEl.textContent = `${partDisplayName(selectedPartType)} is armed for one placement. Press Escape or select it again to cancel.`;
    } else {
      helpEl.textContent = "The blue oval is your starter chassis. Choose a part, then tap the blueprint once to place it. Desktop players can also drag parts.";
      if (placementNoteEl) placementNoteEl.textContent = "Choose one part, then tap the blueprint once. Select an item below to edit it without drawing precision.";
    }
  }
  function selectPartType(type) {
    selectedPartType = selectedPartType === type ? null : type;
    if (selectedPartType) selectedElement = null;
    syncPartSelection();
    syncElementInspector();
    if (selectedPartType) setStatus(`${partDisplayName(selectedPartType)} selected. Tap the blueprint to place one.`, true);
  }
  function syncTrackGoal() {
    if (trackGoalEl) trackGoalEl.textContent = `${currentLevel().name} · ${currentLevel().timeLimit}s`;
    if (missionKickerEl) missionKickerEl.textContent = `Build for · ${currentLevel().name}`;
    if (levelNameEl) levelNameEl.textContent = `${currentLevel().name}${completedLevels.has(levelIndex) ? " · cleared" : ""}`;
    if (courseObjectiveEl) courseObjectiveEl.textContent = `Reach the finish in ${currentLevel().timeLimit}s. ${currentLevel().hint}`;
    if (coursePreviewEl) {
      coursePreviewEl.textContent = "";
      currentLevel().challenges.forEach(function (challenge) {
        const item = document.createElement("li");
        item.className = challenge.done ? "is-cleared" : "";
        item.textContent = challengeName(challenge);
        item.title = challengeAdvice(challenge);
        coursePreviewEl.appendChild(item);
      });
    }
    const prevButton = root.querySelector("#src-prev");
    const nextButton = root.querySelector("#src-next");
    if (prevButton) prevButton.disabled = levelIndex <= 0;
    if (nextButton) nextButton.disabled = levelIndex >= levels.length - 1;
  }
  function defaultPhysicsTuning() {
    return {
      wheelDrive: 1,
      wheelTraction: 1,
      wheelCruise: 1,
      legDrive: 1,
      legStride: 1,
      legPlant: 1,
      legCruise: 1,
      legLift: 1,
      suspensionRide: 1,
      suspensionSnap: 1,
      airBalance: 1,
      armPull: 1,
      frictionGrip: 1,
    };
  }

  function loadArt() {
    Object.keys(artPaths).forEach((key) => {
      const img = new Image();
      img.decoding = "async";
      img.src = artPaths[key];
      art[key] = img;
    });
  }

  function hasArt(key) {
    return !!(art[key] && art[key].complete && art[key].naturalWidth > 0);
  }

  function drawArt(key, x, y, w, h, options) {
    if (!hasArt(key)) return false;
    const opts = options || {};
    worldCtx.save();
    worldCtx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    if (opts.rotate) {
      worldCtx.translate(x + w * 0.5, y + h * 0.5);
      worldCtx.rotate(opts.rotate);
      worldCtx.drawImage(art[key], -w * 0.5, -h * 0.5, w, h);
    } else {
      worldCtx.drawImage(art[key], x, y, w, h);
    }
    worldCtx.restore();
    return true;
  }

  function hashSeed(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function createRng(seedText) { let s = hashSeed(seedText || "1") || 1; return function rand() { s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 7), 61 | s); t ^= t + Math.imul(t ^ (t >>> 14), 4 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function partStyle(type) {
    if (type === "structure") return { color: "rgba(100,116,139,0.98)", size: 18, label: "structure" };
    if (type === "wheel") return { color: "rgba(251,191,36,0.98)", size: 18, label: "wheel" };
    if (type === "leg") return { color: "rgba(74,222,128,0.98)", size: 16, label: "leg" };
    if (type === "fin") return { color: "rgba(96,165,250,0.98)", size: 18, label: "fin" };
    if (type === "arm") return { color: "rgba(244,114,182,0.98)", size: 16, label: "arm" };
    return { color: "rgba(167,139,250,0.98)", size: 18, label: "tail" };
  }

  function placedPartScale(part) {
    return clamp(part && typeof part.scale === "number" ? part.scale : 1, 0.65, 1.8);
  }

  function placedPartRadius(part) {
    return partStyle(part.type).size * placedPartScale(part);
  }

  function pointFromEvent(event) {
    const rect = drawCanvas.getBoundingClientRect();
    const touch = event.touches && event.touches[0] ? event.touches[0] : null;
    const cx = touch ? touch.clientX : event.clientX;
    const cy = touch ? touch.clientY : event.clientY;
    const scaleX = drawCanvas.width / Math.max(1, rect.width);
    const scaleY = drawCanvas.height / Math.max(1, rect.height);
    return {
      x: clamp((cx - rect.left) * scaleX, 0, drawWidth),
      y: clamp((cy - rect.top) * scaleY, 0, drawHeight),
    };
  }

  function drawGrid() {
    drawCtx.clearRect(0, 0, drawWidth, drawHeight);
    drawCtx.fillStyle = "#f8fafc";
    drawCtx.fillRect(0, 0, drawWidth, drawHeight);
    drawCtx.strokeStyle = "rgba(148,163,184,0.24)";
    for (let x = 0; x <= drawWidth; x += 24) { drawCtx.beginPath(); drawCtx.moveTo(x + 0.5, 0); drawCtx.lineTo(x + 0.5, drawHeight); drawCtx.stroke(); }
    for (let y = 0; y <= drawHeight; y += 24) { drawCtx.beginPath(); drawCtx.moveTo(0, y + 0.5); drawCtx.lineTo(drawWidth, y + 0.5); drawCtx.stroke(); }
  }

  function renderDrawing() {
    drawGrid();
    const previewScale = rig ? Math.min(122 / rig.bounds.w, 88 / rig.bounds.h) : 1;
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";
    drawCtx.lineWidth = 5;
    const bodyStrokeIndex = rig ? rig.bodyStrokeIndex : 0;
    for (let strokeIndex = 0; strokeIndex < strokes.length; strokeIndex += 1) {
      const stroke = strokes[strokeIndex];
      if (!stroke.length) continue;
      const selectedStroke = !!selectedElement && selectedElement.kind === "stroke" && selectedElement.index === strokeIndex;
      const isBody = strokeIndex === bodyStrokeIndex;
      drawCtx.strokeStyle = selectedStroke ? "#7c3aed" : isBody ? "#0284c7" : "#0f172a";
      drawCtx.lineWidth = selectedStroke ? 7 : isBody ? 4.4 : 5;
      drawCtx.beginPath();
      drawCtx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) drawCtx.lineTo(stroke[i].x, stroke[i].y);
      drawCtx.stroke();
      if (isBody) {
        const bodyBounds = strokeBounds(stroke);
        drawCtx.fillStyle = "rgba(2,132,199,0.92)";
        drawCtx.font = "700 10px Space Grotesk, sans-serif";
        drawCtx.fillText("CHASSIS", bodyBounds.minX + 4, bodyBounds.minY - 8);
      }
    }
    for (let i = 0; i < placedParts.length; i += 1) {
      const part = placedParts[i];
      const style = partStyle(part.type);
      const scale = placedPartScale(part);
      const size = style.size * scale;
      drawCtx.strokeStyle = style.color;
      drawCtx.fillStyle = style.color;
      drawCtx.lineWidth = 2.5;
      if (part.type === "structure") {
        drawCtx.beginPath();
        drawCtx.moveTo(part.x - 18 * scale, part.y + 10 * scale);
        drawCtx.lineTo(part.x, part.y - 12 * scale);
        drawCtx.lineTo(part.x + 18 * scale, part.y + 10 * scale);
        drawCtx.stroke();
        drawCtx.beginPath();
        drawCtx.moveTo(part.x - 12 * scale, part.y + 2 * scale);
        drawCtx.lineTo(part.x + 12 * scale, part.y + 2 * scale);
        drawCtx.stroke();
      } else if (part.type === "wheel") {
        drawCtx.beginPath();
        drawCtx.arc(part.x, part.y, size, 0, Math.PI * 2);
        drawCtx.stroke();
        drawCtx.beginPath();
        drawCtx.arc(part.x, part.y, Math.max(3, size * 0.18), 0, Math.PI * 2);
        drawCtx.fill();
      } else if (part.type === "leg") {
        drawCtx.beginPath();
        drawCtx.moveTo(part.x, part.y - 14 * scale);
        drawCtx.lineTo(part.x - 4 * scale, part.y + 4 * scale);
        drawCtx.lineTo(part.x + 4 * scale, part.y + 18 * scale);
        drawCtx.stroke();
      } else if (part.type === "arm") {
        drawCtx.beginPath();
        drawCtx.moveTo(part.x - 12 * scale, part.y + 10 * scale);
        drawCtx.lineTo(part.x, part.y - 4 * scale);
        drawCtx.lineTo(part.x + 14 * scale, part.y - 12 * scale);
        drawCtx.stroke();
      } else if (part.type === "fin") {
        drawCtx.beginPath();
        drawCtx.moveTo(part.x - 16 * scale, part.y + 8 * scale);
        drawCtx.lineTo(part.x, part.y - 14 * scale);
        drawCtx.lineTo(part.x + 16 * scale, part.y + 8 * scale);
        drawCtx.closePath();
        drawCtx.stroke();
      } else {
        drawCtx.beginPath();
        drawCtx.moveTo(part.x - 14 * scale, part.y - 4 * scale);
        drawCtx.lineTo(part.x + 10 * scale, part.y + 2 * scale);
        drawCtx.lineTo(part.x + 16 * scale, part.y + 10 * scale);
        drawCtx.stroke();
      }
      drawCtx.font = "600 10px Space Grotesk, sans-serif";
      drawCtx.fillText(style.label, part.x + 14, part.y - 10);
      drawCtx.strokeStyle = "rgba(15,23,42,0.18)";
      drawCtx.lineWidth = 1.2;
      drawCtx.beginPath();
      drawCtx.arc(part.x, part.y, size + 8, 0, Math.PI * 2);
      drawCtx.stroke();
      drawCtx.fillStyle = "rgba(15,23,42,0.62)";
      drawCtx.beginPath();
      drawCtx.arc(part.x + size + 6, part.y - size - 6, 3.2, 0, Math.PI * 2);
      drawCtx.fill();
      if (selectedElement && selectedElement.kind === "part" && selectedElement.index === i) {
        drawCtx.strokeStyle = "#7c3aed";
        drawCtx.lineWidth = 2.4;
        if (drawCtx.setLineDash) drawCtx.setLineDash([4, 3]);
        drawCtx.beginPath();
        drawCtx.arc(part.x, part.y, size + 13, 0, Math.PI * 2);
        drawCtx.stroke();
        if (drawCtx.setLineDash) drawCtx.setLineDash([]);
        drawCtx.fillStyle = "#7c3aed";
        drawCtx.fillRect(part.x + size + 8, part.y - size - 12, 8, 8);
      }
    }
    if (!rig) return;
    if (rig.bodyOval) {
      drawCtx.strokeStyle = "rgba(14,165,233,0.96)";
      drawCtx.lineWidth = 2.5;
      drawCtx.beginPath();
      drawCtx.ellipse(
        rig.centerX + rig.bodyOval.center.x / previewScale,
        rig.centerY + rig.bodyOval.center.y / previewScale,
        rig.bodyOval.rx / previewScale,
        rig.bodyOval.ry / previewScale,
        0,
        0,
        Math.PI * 2
      );
      drawCtx.stroke();
    }
    drawCtx.strokeStyle = "rgba(14,165,233,0.88)";
    drawCtx.lineWidth = 2;
    drawCtx.strokeRect(rig.bounds.minX, rig.bounds.minY, rig.bounds.w, rig.bounds.h);
    for (const part of rig.detectedAttachments || rig.attachments || []) {
      if (!part.preview || !part.preview.anchorDraw) continue;
      const ax = rig.centerX + part.preview.anchorDraw.x / previewScale;
      const ay = rig.centerY + part.preview.anchorDraw.y / previewScale;
      const isInactive = part.classification && part.classification.connected === false;
      const isSelected = !!selectedElement && selectedElement.kind === "stroke" && selectedElement.index === part.sourceStrokeIndex;
      drawCtx.fillStyle =
        part.type === "leg"
          ? "rgba(74,222,128,0.95)"
          : part.type === "loop"
          ? "rgba(251,191,36,0.95)"
          : part.type === "structure"
          ? "rgba(100,116,139,0.95)"
          : part.type === "fin"
          ? "rgba(96,165,250,0.95)"
          : part.type === "arm"
          ? "rgba(244,114,182,0.95)"
          : "rgba(167,139,250,0.95)";
      if (isInactive) drawCtx.globalAlpha = 0.44;
      drawCtx.beginPath();
      drawCtx.arc(ax, ay, isSelected ? 6 : 4, 0, Math.PI * 2);
      drawCtx.fill();
      drawCtx.globalAlpha = 1;
      drawCtx.font = "600 10px Space Grotesk, sans-serif";
      drawCtx.fillStyle = isInactive ? "rgba(71,85,105,0.92)" : "rgba(15,23,42,0.88)";
      const confidence = part.classification && part.classification.source === "freehand" ? ` ${Math.round(part.classification.confidence * 100)}%` : "";
      drawCtx.fillText(`${partDisplayName(part.type)}${confidence}${isInactive ? " · connect" : ""}`, ax + 7, ay - 5);
      if (isSelected) {
        drawCtx.strokeStyle = "#7c3aed";
        drawCtx.lineWidth = 2;
        drawCtx.beginPath();
        drawCtx.arc(ax, ay, 9, 0, Math.PI * 2);
        drawCtx.stroke();
      }
    }
    if (rig.comLocal) {
      const comX = rig.centerX + (rig.bodyOval.center.x + rig.comLocal.x) / previewScale;
      const comY = rig.centerY + (rig.bodyOval.center.y + rig.comLocal.y) / previewScale;
      drawCtx.strokeStyle = "rgba(239,68,68,0.96)";
      drawCtx.lineWidth = 2;
      drawCtx.beginPath();
      drawCtx.moveTo(comX - 6, comY);
      drawCtx.lineTo(comX + 6, comY);
      drawCtx.moveTo(comX, comY - 6);
      drawCtx.lineTo(comX, comY + 6);
      drawCtx.stroke();
      drawCtx.fillStyle = "rgba(239,68,68,0.96)";
      drawCtx.font = "600 10px Space Grotesk, sans-serif";
      drawCtx.fillText("COM", comX + 8, comY - 8);
    }
    if (baseLocked) {
      drawCtx.fillStyle = "rgba(14,165,233,0.12)";
      drawCtx.fillRect(rig.bounds.minX - 18, rig.bounds.minY - 18, rig.bounds.w + 36, rig.bounds.h + 36);
    }
  }

  function sampleStroke(stroke, gap) {
    if (!stroke || stroke.length < 2) return stroke ? stroke.slice() : [];
    const spacing = Math.max(1, gap || 5);
    const out = [{ x: stroke[0].x, y: stroke[0].y }];
    let sinceLastSample = 0;
    let start = { x: stroke[0].x, y: stroke[0].y };
    for (let i = 1; i < stroke.length; i += 1) {
      const end = stroke[i];
      let dx = end.x - start.x;
      let dy = end.y - start.y;
      let remaining = Math.hypot(dx, dy);
      while (remaining > 1e-6 && sinceLastSample + remaining >= spacing) {
        const needed = spacing - sinceLastSample;
        const t = needed / remaining;
        start = { x: start.x + dx * t, y: start.y + dy * t };
        out.push(start);
        dx = end.x - start.x;
        dy = end.y - start.y;
        remaining = Math.hypot(dx, dy);
        sinceLastSample = 0;
      }
      sinceLastSample += remaining;
      start = { x: end.x, y: end.y };
    }
    const last = stroke[stroke.length - 1];
    if (Math.hypot(out[out.length - 1].x - last.x, out[out.length - 1].y - last.y) > 0.25) {
      out.push({ x: last.x, y: last.y });
    }
    return out;
  }

  function smoothStroke(stroke, passes) {
    let out = stroke.slice();
    for (let p = 0; p < passes; p += 1) {
      if (out.length < 3) break;
      const next = [out[0]];
      for (let i = 0; i < out.length - 1; i += 1) {
        const a = out[i];
        const b = out[i + 1];
        next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
        next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
      }
      next.push(out[out.length - 1]);
      out = next;
    }
    return out;
  }

  function flatten(strokeList) { const p = []; for (const s of strokeList) for (const v of s) p.push(v); return p; }
  function strokeBounds(stroke) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY),
      cx: (minX + maxX) * 0.5,
      cy: (minY + maxY) * 0.5,
    };
  }

  function makeOvalPoints(cx, cy, rx, ry, count) {
    const out = [];
    const n = Math.max(12, count || 48);
    for (let i = 0; i < n; i += 1) {
      const t = (i / n) * Math.PI * 2;
      out.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    return out;
  }

  function makeDefaultBodyStroke() {
    return makeOvalStroke(drawWidth * 0.5, drawHeight * 0.48, 54, 34, 28);
  }

  function fitBodyOval(stroke) {
    const b = strokeBounds(stroke);
    const rx = Math.max(12, b.w * 0.42);
    const ry = Math.max(10, b.h * 0.38);
    return {
      center: { x: b.cx, y: b.cy },
      rx,
      ry,
      points: makeOvalPoints(b.cx, b.cy, rx, ry, 56),
      drawBounds: b,
    };
  }

  function attachmentLocalPoints(attachment) {
    return attachment.relPoints.map(function (p) {
      return { x: attachment.anchor.x + p.x, y: attachment.anchor.y + p.y };
    });
  }

  function buildRigMassModel(bodyOval, attachments) {
    const points = [];
    const pushPoint = function (x, y, w) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || w <= 0) return;
      points.push({ x, y, w });
    };

    const bodyArea = Math.PI * bodyOval.rx * bodyOval.ry;
    const bodyMass = Math.max(24, bodyArea * 0.016);
    pushPoint(bodyOval.center.x, bodyOval.center.y, bodyMass * 0.34);
    const bodyRing = [
      { x: bodyOval.center.x + bodyOval.rx * 0.55, y: bodyOval.center.y, w: bodyMass * 0.08 },
      { x: bodyOval.center.x - bodyOval.rx * 0.55, y: bodyOval.center.y, w: bodyMass * 0.08 },
      { x: bodyOval.center.x, y: bodyOval.center.y + bodyOval.ry * 0.7, w: bodyMass * 0.11 },
      { x: bodyOval.center.x, y: bodyOval.center.y - bodyOval.ry * 0.6, w: bodyMass * 0.06 },
      { x: bodyOval.center.x + bodyOval.rx * 0.4, y: bodyOval.center.y + bodyOval.ry * 0.46, w: bodyMass * 0.08 },
      { x: bodyOval.center.x - bodyOval.rx * 0.4, y: bodyOval.center.y + bodyOval.ry * 0.46, w: bodyMass * 0.08 },
      { x: bodyOval.center.x + bodyOval.rx * 0.38, y: bodyOval.center.y - bodyOval.ry * 0.38, w: bodyMass * 0.045 },
      { x: bodyOval.center.x - bodyOval.rx * 0.38, y: bodyOval.center.y - bodyOval.ry * 0.38, w: bodyMass * 0.045 },
    ];
    bodyRing.forEach(function (p) { pushPoint(p.x, p.y, p.w); });

    for (const attachment of attachments) {
      const pts = attachmentLocalPoints(attachment);
      if (attachment.type === "loop") {
        const r = Math.max(8, attachment.wheelRadius || 12);
        const mass = Math.max(8, Math.PI * r * r * 0.018);
        pushPoint(attachment.anchor.x, attachment.anchor.y, mass * 0.42);
        for (let i = 0; i < 6; i += 1) {
          const t = (i / 6) * Math.PI * 2;
          pushPoint(
            attachment.anchor.x + Math.cos(t) * r * 0.78,
            attachment.anchor.y + Math.sin(t) * r * 0.78,
            mass * 0.096
          );
        }
        continue;
      }
      const density =
        attachment.type === "leg" ? 0.46
        : attachment.type === "arm" ? 0.36
        : attachment.type === "fin" ? 0.28
        : attachment.type === "tail" ? 0.24
        : 0.3;
      for (let i = 1; i < pts.length; i += 1) {
        const a = pts[i - 1];
        const b = pts[i];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        const segMass = Math.max(1.2, segLen * density);
        pushPoint((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, segMass * 0.55);
        pushPoint(a.x * 0.33 + b.x * 0.67, a.y * 0.33 + b.y * 0.67, segMass * 0.225);
        pushPoint(a.x * 0.67 + b.x * 0.33, a.y * 0.67 + b.y * 0.33, segMass * 0.225);
      }
      if (attachment.type === "leg" && pts.length) {
        const foot = pts[pts.length - 1];
        pushPoint(foot.x, foot.y, 4.8);
      } else if (attachment.type === "arm" && pts.length) {
        const hand = pts[pts.length - 1];
        pushPoint(hand.x, hand.y, 3.6);
      }
    }

    let totalMass = 0;
    let sumX = 0;
    let sumY = 0;
    for (const p of points) {
      totalMass += p.w;
      sumX += p.x * p.w;
      sumY += p.y * p.w;
    }
    const com = totalMass > 0
      ? { x: sumX / totalMass, y: sumY / totalMass }
      : { x: bodyOval.center.x, y: bodyOval.center.y };
    let inertia = 0;
    for (const p of points) {
      const dx = p.x - com.x;
      const dy = p.y - com.y;
      inertia += p.w * (dx * dx + dy * dy);
    }
    const supportPolygon = attachmentLocalPoints({ anchor: { x: 0, y: 0 }, relPoints: bodyOval.points });
    return {
      totalMass,
      center: com,
      inertia: Math.max(48, inertia),
      points,
      supportPolygon,
    };
  }

  function ovalAnchorPoint(oval, p) {
    const dx = p.x - oval.center.x;
    const dy = p.y - oval.center.y;
    const angle = Math.atan2(dy / Math.max(1, oval.ry), dx / Math.max(1, oval.rx));
    return {
      x: oval.center.x + Math.cos(angle) * oval.rx,
      y: oval.center.y + Math.sin(angle) * oval.ry,
      angle,
    };
  }

  function extractAttachmentFeatures(stroke, oval) {
    const b = strokeBounds(stroke);
    const first = stroke[0];
    const last = stroke[stroke.length - 1];
    const closeDist = Math.hypot(last.x - first.x, last.y - first.y);
    let strokeLen = 0;
    let bend = 0;
    let lowestY = -Infinity;
    let highestY = Infinity;
    let farthestX = 0;
    for (let i = 0; i < stroke.length; i += 1) {
      const p = stroke[i];
      if (p.y > lowestY) lowestY = p.y;
      if (p.y < highestY) highestY = p.y;
      farthestX = Math.max(farthestX, Math.abs(p.x - oval.center.x));
      if (i > 0) strokeLen += Math.hypot(p.x - stroke[i - 1].x, p.y - stroke[i - 1].y);
      if (i > 1) {
        const a = stroke[i - 2], bb = stroke[i - 1], c = stroke[i];
        const v1x = bb.x - a.x, v1y = bb.y - a.y;
        const v2x = c.x - bb.x, v2y = c.y - bb.y;
        const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
        if (m1 > 0.2 && m2 > 0.2) {
          const dot = (v1x * v2x + v1y * v2y) / (m1 * m2);
          bend += Math.acos(clamp(dot, -1, 1));
        }
      }
    }
    const aspect = Math.max(b.w, b.h) / Math.max(1, Math.min(b.w, b.h));
    const downwardReach = lowestY - (oval.center.y + oval.ry);
    const upwardReach = (oval.center.y - oval.ry) - highestY;
    const lateralReach = farthestX - oval.rx;
    const bodyScale = Math.max(1, Math.sqrt(Math.max(1, oval.rx * oval.ry)));
    let connectionDistance = Infinity;
    for (const p of stroke) {
      const dx = (p.x - oval.center.x) / Math.max(1, oval.rx);
      const dy = (p.y - oval.center.y) / Math.max(1, oval.ry);
      connectionDistance = Math.min(connectionDistance, Math.abs(Math.hypot(dx, dy) - 1) * bodyScale);
    }
    return {
      bounds: b,
      closeDist,
      strokeLen,
      bend,
      lowestY,
      highestY,
      aspect,
      downwardReach,
      upwardReach,
      lateralReach,
      bodyScale,
      relativeWidth: b.w / bodyScale,
      relativeHeight: b.h / bodyScale,
      relativeLength: strokeLen / bodyScale,
      closureRatio: closeDist / Math.max(1, strokeLen),
      downwardReachRatio: downwardReach / bodyScale,
      upwardReachRatio: upwardReach / bodyScale,
      lateralReachRatio: lateralReach / bodyScale,
      connectionDistance,
      connected: connectionDistance <= Math.max(8, bodyScale * 0.34),
    };
  }

  function getAttachmentPrototypes() {
    if (setupSketchRigChallenge._attachmentPrototypes) return setupSketchRigChallenge._attachmentPrototypes;
    const oval = { center: { x: 0, y: 0 }, rx: 48, ry: 24 };
    const prototypes = [];
    for (const fixture of fixtureCatalog) {
      const blueprint = buildFixtureBlueprint(fixture.id);
      const localBodyBounds = strokeBounds(blueprint.body);
      const cx = localBodyBounds.cx;
      const cy = localBodyBounds.cy;
      const scale = 1;
      for (const part of blueprint.parts) {
        const localStroke = part.stroke.map(function (p) { return { x: (p.x - cx) * scale, y: (p.y - cy) * scale }; });
        const features = extractAttachmentFeatures(localStroke, oval);
        prototypes.push({
          type: part.type === "wheel" ? "loop" : part.type,
          features,
        });
      }
    }
    setupSketchRigChallenge._attachmentPrototypes = prototypes;
    return prototypes;
  }

  function matchAttachmentPrototype(features) {
    const prototypes = getAttachmentPrototypes();
    let best = null;
    let bestScore = Infinity;
    let secondScore = Infinity;
    for (const proto of prototypes) {
      const score =
        Math.abs(features.aspect - proto.features.aspect) * 0.55 +
        Math.abs(features.closureRatio - proto.features.closureRatio) * 1.7 +
        Math.abs(features.relativeLength - proto.features.relativeLength) * 0.3 +
        Math.abs(features.relativeWidth - proto.features.relativeWidth) * 0.35 +
        Math.abs(features.relativeHeight - proto.features.relativeHeight) * 0.35 +
        Math.abs(features.bend - proto.features.bend) * 0.7 +
        Math.abs(features.downwardReachRatio - proto.features.downwardReachRatio) * 0.75 +
        Math.abs(features.upwardReachRatio - proto.features.upwardReachRatio) * 0.75 +
        Math.abs(features.lateralReachRatio - proto.features.lateralReachRatio) * 0.55;
      if (score < bestScore) {
        secondScore = bestScore;
        bestScore = score;
        best = proto.type;
      } else if (score < secondScore) {
        secondScore = score;
      }
    }
    const margin = Number.isFinite(secondScore) ? secondScore - bestScore : 0.8;
    const confidence = clamp((1 - bestScore / 2.8) * 0.72 + clamp(margin / 0.7, 0, 1) * 0.28, 0.1, 0.98);
    return { type: best || "structure", score: bestScore, secondScore, confidence };
  }

  function classifyAttachment(stroke, oval, si) {
    const features = extractAttachmentFeatures(stroke, oval);
    const b = features.bounds;
    const prototypeMatch = matchAttachmentPrototype(features);
    const prototypeTrusted = prototypeMatch.confidence >= 0.52;
    const isLoop =
      (features.closureRatio < 0.18 && features.aspect < 1.8 && features.relativeWidth > 0.24 && features.relativeHeight > 0.24)
      || (prototypeMatch.type === "loop" && prototypeTrusted && features.closureRatio < 0.32);
    const isLeg = !isLoop && (
      (features.relativeHeight > features.relativeWidth * 1.3 && features.downwardReachRatio > 0.16)
      || (prototypeMatch.type === "leg" && prototypeTrusted && features.downwardReachRatio > 0.05)
    );
    const isStructure = !isLoop && !isLeg && (
      (features.relativeWidth > features.relativeHeight * 2.8 && Math.max(Math.abs(features.downwardReachRatio), Math.abs(features.upwardReachRatio)) < 0.42)
      || (prototypeMatch.type === "structure" && prototypeTrusted)
    );
    const isArm = !isLoop && !isLeg && !isStructure && (
      (prototypeMatch.type === "arm" && prototypeTrusted)
      || (features.upwardReachRatio > 0.14 && features.bend > 0.75 && features.relativeWidth > 0.5)
    );
    const isWing = !isLoop && !isLeg && !isStructure && !isArm && (
      (prototypeMatch.type === "fin" && prototypeTrusted)
      || (features.relativeWidth > features.relativeHeight * 1.7 && features.upwardReachRatio > -0.08)
    );
    const isTail = !isLoop && !isLeg && !isStructure && !isArm && !isWing && (
      (prototypeMatch.type === "tail" && prototypeTrusted)
      || (features.lateralReachRatio > 0.28 && features.bend < 2.8)
    );
    const anchorHint = stroke.reduce(function (best, p) {
      const d = Math.hypot(p.x - oval.center.x, p.y - oval.center.y);
      return d < best.d ? { d, p } : best;
    }, { d: Infinity, p: stroke[0] }).p;
    const anchorInfo = ovalAnchorPoint(oval, anchorHint);
    const relPoints = stroke.map(function (p) {
      return { x: p.x - anchorHint.x, y: p.y - anchorHint.y };
    });
    const maxRelY = relPoints.reduce(function (best, p) { return Math.max(best, p.y); }, -Infinity);
    const minRelY = relPoints.reduce(function (best, p) { return Math.min(best, p.y); }, Infinity);
    const contactRelPoints = relPoints.filter(function (p) {
      if (isLoop) return p.y >= maxRelY - Math.max(3, b.h * 0.12);
      if (isLeg) return p.y >= maxRelY - Math.max(4, b.h * 0.16);
      if (isArm) return p.y <= minRelY + Math.max(4, b.h * 0.18);
      return p.y >= maxRelY - Math.max(5, b.h * 0.14);
    });
    const type = isLoop ? "loop" : isLeg ? "leg" : isStructure ? "structure" : isArm ? "arm" : isWing ? "fin" : isTail ? "tail" : "structure";
    const reason = type === "loop" ? "closed, round stroke"
      : type === "leg" ? "vertical stroke reaches below the chassis"
      : type === "structure" ? "straight structural connection"
      : type === "arm" ? "bent, upward-reaching connector"
      : type === "fin" ? "wide, upward-facing surface"
      : "long lateral stabilizer";
    const amp = type === "leg" ? 0.78 : type === "loop" ? 0.2 : type === "fin" ? 0.3 : type === "tail" ? 0.24 : 0.38;
    const freq = type === "leg" ? 3.1 : type === "loop" ? 6 : type === "fin" ? 2.3 : type === "tail" ? 2.6 : 2.2;
    const drive = type === "leg" ? 1.02 : type === "loop" ? 0.82 : type === "fin" ? 0.44 : type === "tail" ? 0.34 : 0.66;
    const stiffness = type === "leg" ? 22 : type === "loop" ? 28 : type === "fin" ? 15 : type === "tail" ? 13 : 20;
    const damping = type === "leg" ? 6.6 : type === "loop" ? 7.2 : type === "fin" ? 5.7 : type === "tail" ? 5.4 : 6.4;
    const stickiness = type === "leg" ? 1 : type === "loop" ? 0.42 : type === "fin" ? 0.22 : type === "tail" ? 0.16 : 0.8;
    const muscleAmp = type === "leg" ? 0.22 : type === "loop" ? 0.05 : type === "fin" ? 0.1 : type === "tail" ? 0.08 : 0.12;
    const muscleFreq = type === "leg" ? 2.3 : type === "loop" ? 5.1 : type === "fin" ? 2 : type === "tail" ? 1.8 : 2;
    return {
      anchor: { x: anchorInfo.x, y: anchorInfo.y },
      relPoints,
      contactRelPoints: contactRelPoints.length ? contactRelPoints : relPoints.slice(),
      type,
      wheelRadius: isLoop ? Math.max(b.w, b.h) * 0.5 : 0,
      legReach: isLeg ? maxRelY - minRelY : 0,
      swingAmp: amp,
      swingFreq: freq,
      driveGain: drive,
      stiffness,
      damping,
      stickiness,
      muscleAmp,
      muscleFreq,
      phaseOffset: si * 0.7,
      features: {
        aspect: features.aspect,
        strokeLen: features.strokeLen,
        bend: features.bend,
        downwardReach: features.downwardReach,
        upwardReach: features.upwardReach,
        lateralReach: features.lateralReach,
        closureRatio: features.closureRatio,
        relativeWidth: features.relativeWidth,
        relativeHeight: features.relativeHeight,
        relativeLength: features.relativeLength,
        connectionDistance: features.connectionDistance,
        isLoop,
        isLeg,
        isStructure,
        isWing,
        isArm,
        isTail,
        prototypeType: prototypeMatch.type,
        prototypeScore: prototypeMatch.score,
        prototypeConfidence: prototypeMatch.confidence,
      },
      classification: {
        type,
        confidence: clamp(prototypeMatch.confidence + (features.connected ? 0.08 : -0.16), 0.08, 0.99),
        connected: features.connected,
        source: "freehand",
        reason,
      },
      preview: {
        label: type === "loop" ? "wheel" : type,
        anchorDraw: anchorInfo,
      },
    };
  }

  function hitTestPlacedPart(point) {
    for (let i = placedParts.length - 1; i >= 0; i -= 1) {
      const part = placedParts[i];
      const radius = placedPartRadius(part);
      const dist = Math.hypot(point.x - part.x, point.y - part.y);
      if (dist <= radius * 0.82) return { index: i, mode: "move" };
      if (dist <= radius + 12) return { index: i, mode: "resize" };
    }
    return null;
  }

  function cursorForInteraction(hit) {
    if (resizingPartIndex >= 0) return "nwse-resize";
    if (draggingPartIndex >= 0) return "grabbing";
    if (!hit) return "crosshair";
    return hit.mode === "resize" ? "nwse-resize" : "grab";
  }

  function syncDrawCursor(point) {
    const hit = point ? hitTestPlacedPart(point) : null;
    drawCanvas.style.cursor = cursorForInteraction(hit);
  }

  function buildAttachmentFromPlacedPart(part, cx, cy, scale, bodyOval, si) {
    const localX = (part.x - cx) * scale;
    const localY = (part.y - cy) * scale;
    const sizeScale = placedPartScale(part);
    const partLocal = { x: localX, y: localY };
    const anchorInfo = ovalAnchorPoint(bodyOval, partLocal);
    let relPoints = [];
    let type = "arm";
    let wheelRadius = 0;
    let legReach = 0;
    if (part.type === "wheel") {
      type = "loop";
      wheelRadius = 15 * sizeScale;
      relPoints = makeOvalPoints(partLocal.x, partLocal.y, wheelRadius, wheelRadius, 20).map(function (p) {
        return { x: p.x - anchorInfo.x, y: p.y - anchorInfo.y };
      });
    } else if (part.type === "leg") {
      type = "leg";
      const footY = Math.max(partLocal.y + 26 * sizeScale, bodyOval.center.y + bodyOval.ry + 34 * sizeScale);
      legReach = footY - anchorInfo.y;
      relPoints = [
        { x: 0, y: 0 },
        { x: (partLocal.x - anchorInfo.x) * 0.45, y: legReach * 0.52 },
        { x: partLocal.x - anchorInfo.x, y: legReach },
      ];
    } else if (part.type === "structure") {
      type = "structure";
      relPoints = [
        { x: 0, y: 0 },
        { x: (partLocal.x - anchorInfo.x) * 0.5, y: Math.max(8, (partLocal.y - anchorInfo.y) * 0.5) },
        { x: partLocal.x - anchorInfo.x, y: partLocal.y - anchorInfo.y },
      ];
    } else if (part.type === "fin") {
      type = "fin";
      relPoints = [
        { x: -12 * sizeScale, y: 6 * sizeScale },
        { x: 0, y: -16 * sizeScale },
        { x: 12 * sizeScale, y: 6 * sizeScale },
      ];
    } else if (part.type === "arm") {
      type = "arm";
      relPoints = [
        { x: 0, y: 0 },
        { x: (partLocal.x - anchorInfo.x) * 0.55, y: -10 * sizeScale },
        { x: partLocal.x - anchorInfo.x, y: -18 * sizeScale },
      ];
    } else {
      type = "tail";
      relPoints = [
        { x: -8 * sizeScale, y: -2 * sizeScale },
        { x: 10 * sizeScale, y: 2 * sizeScale },
        { x: 18 * sizeScale, y: 10 * sizeScale },
      ];
    }
    const pseudoStroke = relPoints.map(function (p) { return { x: p.x + anchorInfo.x, y: p.y + anchorInfo.y }; });
    const classified = classifyAttachment(pseudoStroke, bodyOval, si);
    const maxRelY = relPoints.reduce(function (best, p) { return Math.max(best, p.y); }, -Infinity);
    classified.anchor = { x: anchorInfo.x, y: anchorInfo.y };
    classified.relPoints = relPoints;
    classified.contactRelPoints = type === "loop"
      ? relPoints.filter(function (p) { return p.y >= maxRelY - 3; })
      : type === "leg"
      ? [relPoints[relPoints.length - 1]]
      : type === "arm"
      ? [relPoints[relPoints.length - 1]]
      : relPoints.slice();
    classified.type = type;
    classified.wheelRadius = type === "loop" ? wheelRadius : 0;
    classified.legReach = type === "leg" ? legReach : 0;
    if (type === "structure") {
      classified.swingAmp = 0;
      classified.swingFreq = 0;
      classified.driveGain = 0;
      classified.stiffness = 42;
      classified.damping = 11;
      classified.stickiness = 0;
      classified.muscleAmp = 0;
      classified.muscleFreq = 0;
    }
    classified.preview = {
      label: part.type,
      anchorDraw: anchorInfo,
    };
    classified.classification = {
      type,
      confidence: 1,
      connected: true,
      source: "placed",
      reason: `placed ${partDisplayName(part.type).toLowerCase()}`,
    };
    return classified;
  }

  function chooseBodyStroke(localEntries) {
    let best = null;
    for (let i = 0; i < localEntries.length; i += 1) {
      const entry = localEntries[i];
      const stroke = entry.stroke;
      if (!stroke || stroke.length < 6) continue;
      const bounds = strokeBounds(stroke);
      let perimeter = 0;
      for (let pi = 1; pi < stroke.length; pi += 1) perimeter += Math.hypot(stroke[pi].x - stroke[pi - 1].x, stroke[pi].y - stroke[pi - 1].y);
      const closure = Math.hypot(stroke[0].x - stroke[stroke.length - 1].x, stroke[0].y - stroke[stroke.length - 1].y) / Math.max(1, perimeter);
      const area = bounds.w * bounds.h;
      const ovalLike = closure < 0.2 && bounds.w > 18 && bounds.h > 14;
      // A first body remains a gentle tie-breaker, but a clear larger closed shape wins.
      const score = area * (ovalLike ? 1.8 : 0.55) + perimeter * (ovalLike ? 0.45 : 0.08) + (entry.sourceIndex === 0 ? 26 : 0);
      if (!best || score > best.score) best = { ...entry, score };
    }
    return best || localEntries[0] || null;
  }

  function analyzeDrawing() {
    const sampledEntries = strokes
      .map((stroke, sourceIndex) => ({ stroke: smoothStroke(sampleStroke(stroke, 5), 1), sourceIndex }))
      .filter((entry) => entry.stroke.length >= 2);
    const sampled = sampledEntries.map((entry) => entry.stroke);
    const pts = flatten(sampled);
    if (pts.length < 18) { rig = null; syncHud(); setStatus("Draw a larger shape first.", true); return null; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y; }
    const bounds = { minX, minY, maxX, maxY, w: Math.max(20, maxX - minX), h: Math.max(20, maxY - minY) };
    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    const scale = Math.min(122 / bounds.w, 88 / bounds.h);
    const localEntries = sampledEntries.map((entry) => ({
      sourceIndex: entry.sourceIndex,
      stroke: entry.stroke.map((p) => ({ x: (p.x - cx) * scale, y: (p.y - cy) * scale })),
    }));
    const bodyEntry = chooseBodyStroke(localEntries);
    const localStrokes = localEntries.map((entry) => entry.stroke);
    const mainBodyStroke = bodyEntry ? bodyEntry.stroke : [];
    if (mainBodyStroke.length < 6) {
      rig = null;
      syncHud();
      setStatus("First stroke must sketch a clear body area.", true);
      return null;
    }
    const bodyOval = fitBodyOval(mainBodyStroke);
    const bodyPoints = bodyOval.points;
    const bodySamplePoints = bodyPoints;
    const attachments = [];
    for (let pi = 0; pi < placedParts.length; pi += 1) {
      const attachment = buildAttachmentFromPlacedPart(placedParts[pi], cx, cy, scale, bodyOval, pi + 1);
      attachment.sourcePartIndex = pi;
      attachments.push(attachment);
    }
    for (let si = 0; si < localEntries.length; si += 1) {
      const entry = localEntries[si];
      if (!bodyEntry || entry.sourceIndex === bodyEntry.sourceIndex) continue;
      const stroke = entry.stroke;
      if (!stroke.length) continue;
      const attachment = classifyAttachment(stroke, bodyOval, placedParts.length + si);
      attachment.sourceStrokeIndex = entry.sourceIndex;
      attachments.push(attachment);
    }

    const activeAttachments = attachments.filter(function (attachment) {
      return !attachment.classification || attachment.classification.connected !== false;
    });
    const activeStrokeIndexes = new Set(activeAttachments
      .filter(function (attachment) { return typeof attachment.sourceStrokeIndex === "number"; })
      .map(function (attachment) { return attachment.sourceStrokeIndex; }));
    const metricStrokes = [bodyPoints].concat(localEntries
      .filter((entry) => (!bodyEntry || entry.sourceIndex !== bodyEntry.sourceIndex) && activeStrokeIndexes.has(entry.sourceIndex))
      .map((entry) => entry.stroke));
    const localPoints = flatten(metricStrokes);
    let lMinX = Infinity, lMinY = Infinity, lMaxX = -Infinity, lMaxY = -Infinity, perimeter = 0, sumAbsX = 0, sumX = 0;
    for (const stroke of metricStrokes) {
      for (let i = 0; i < stroke.length; i += 1) {
        const p = stroke[i];
        if (p.x < lMinX) lMinX = p.x; if (p.y < lMinY) lMinY = p.y; if (p.x > lMaxX) lMaxX = p.x; if (p.y > lMaxY) lMaxY = p.y;
        sumAbsX += Math.abs(p.x); sumX += p.x;
        if (i > 0) perimeter += Math.hypot(p.x - stroke[i - 1].x, p.y - stroke[i - 1].y);
      }
    }
    const w = Math.max(16, lMaxX - lMinX);
    const h = Math.max(14, lMaxY - lMinY);
    const areaProxy = w * h;
    const compactness = clamp((perimeter * perimeter) / Math.max(1, areaProxy * 22), 0.4, 5.4);
    const bottom = localPoints.filter((p) => p.y > lMaxY - h * 0.23);
    const xs = bottom.map((p) => p.x).sort((a, b) => a - b);
    const span = xs.length > 3 ? xs[xs.length - 1] - xs[0] : w * 0.4;
    let rough = 0; for (let i = 1; i < bottom.length; i += 1) rough += Math.abs(bottom[i].y - bottom[i - 1].y);
    rough = clamp((rough / Math.max(1, bottom.length - 1)) * 0.22, 0, 18);
    const symmetry = clamp(1 - Math.abs(sumX / Math.max(1, sumAbsX * 0.7)), 0.1, 1.2);
    const partStats = { loops: 0, supports: 0, spikes: 0, complex: 0 };
    for (const part of activeAttachments) {
      if (part.type === "loop") partStats.loops += 1;
      else if (part.type === "leg") partStats.supports += 1;
      else if (part.type === "tail") partStats.spikes += 1;
      else partStats.complex += 1;
    }

    const mass = clamp(24 + perimeter * 0.16 + areaProxy * 0.0024 + partStats.loops * 1.8, 22, 140);
    const grip = clamp(38 + span * 0.68 + rough * 3.2 - h * 0.12, 20, 170);
    const stability = clamp(92 + symmetry * 34 - compactness * 9 + partStats.supports * 4 - partStats.spikes * 2, 24, 168);
    const enginePotential = clamp(62 + compactness * 22 + (span / Math.max(1, w)) * 36 + symmetry * 14 - mass * 0.2 + partStats.loops * 5 + partStats.spikes * 2, 24, 220);
    const massModel = buildRigMassModel(bodyOval, activeAttachments);
    const readableParts = [];
    if (partStats.loops) readableParts.push(`${partStats.loops} ${partStats.loops === 1 ? "wheel" : "wheels"}`);
    if (partStats.supports) readableParts.push(`${partStats.supports} ${partStats.supports === 1 ? "leg" : "legs"}`);
    const stabilizers = activeAttachments.filter((part) => part.type === "fin" || part.type === "tail" || part.type === "arm" || part.type === "structure").length;
    if (stabilizers) readableParts.push(`${stabilizers} ${stabilizers === 1 ? "stabilizer" : "stabilizers"}`);

    rig = {
      bounds,
      centerX: cx,
      centerY: cy,
      localStrokes,
      inputBodyStroke: mainBodyStroke,
      bodyStroke: bodyPoints,
      bodyStrokeIndex: bodyEntry ? bodyEntry.sourceIndex : 0,
      bodyOval,
      bodySamplePoints,
      attachments: activeAttachments,
      detectedAttachments: attachments,
      width: w,
      height: h,
      mass,
      physicalMass: massModel.totalMass,
      massCenter: massModel.center,
      massPoints: massModel.points,
      inertia: massModel.inertia,
      grip,
      stability,
      enginePotential,
      compactness,
      rough,
      centroidX: sumX / localPoints.length,
      centroidY: localPoints.reduce(function (acc, p) { return acc + p.y; }, 0) / Math.max(1, localPoints.length),
      partStats,
      partText: readableParts.length ? `Body + ${readableParts.join(", ")}` : "Body only",
    };
    rig.comLocal = {
      x: massModel.center.x - bodyOval.center.x,
      y: massModel.center.y - bodyOval.center.y,
    };
    rig.physicsProfile = inferPhysicsProfile(rig);
    rig.readiness = assessRigReadiness(rig);
    baseLocked = true;
    syncHud();
    syncElementInspector();
    setStatus(`Rig analyzed: ${rig.partText}. ${rig.readiness.advice}`, true);
    renderDrawing();
    return rig;
  }

  function getGroundY(x) {
    const base = worldHeight - 96 + Math.sin(x * 0.009) * 8 + Math.sin(x * 0.026) * 4;
    let y = base;
    for (const ch of currentLevel().challenges) {
      if (ch.type === "step" && x >= ch.x && x <= ch.x + ch.width) y = Math.min(y, base - ch.height);
      else if (ch.type === "rough" && x >= ch.x && x <= ch.x + ch.width) y += Math.sin(x * 0.28) * 4 * (ch.roughness || 1);
    }
    return y;
  }

  function getCeilingY(x) {
    for (const ch of currentLevel().challenges) if (ch.type === "ceiling" && x >= ch.x && x <= ch.x + ch.width) return getGroundY(x) - ch.clearance;
    return -Infinity;
  }
  function traceGroundPath(ctx, startScreenX, endScreenX, worldOffsetX, step) {
    const sampleStep = Math.max(1, step || 1);
    let first = true;
    for (let sx = startScreenX; sx <= endScreenX; sx += sampleStep) {
      const y = getGroundY(sx + worldOffsetX);
      if (first) {
        ctx.moveTo(sx, y);
        first = false;
      } else {
        ctx.lineTo(sx, y);
      }
    }
    if ((endScreenX - startScreenX) % sampleStep !== 0) {
      ctx.lineTo(endScreenX, getGroundY(endScreenX + worldOffsetX));
    }
  }
  function groundSlope(x) { return (getGroundY(x + 2) - getGroundY(x - 2)) / 4; }
  function groundNormal(x) {
    const slope = groundSlope(x);
    const nx = -slope;
    const ny = 1;
    const mag = Math.hypot(nx, ny) || 1;
    return { x: nx / mag, y: ny / mag };
  }

  function solveSupportAngle(supportA, supportB, anchorA, anchorB, minAngle, maxAngle) {
    let bestAngle = 0;
    let bestError = Infinity;
    const steps = 48;
    const lo = minAngle == null ? -0.75 : minAngle;
    const hi = maxAngle == null ? 0.75 : maxAngle;
    for (let i = 0; i <= steps; i += 1) {
      const theta = lo + ((hi - lo) * i) / steps;
      const predictedDy =
        (anchorB.x - anchorA.x) * Math.sin(theta)
        + (anchorB.y - anchorA.y) * Math.cos(theta);
      const targetDy = supportB.y - supportA.y;
      const err = Math.abs(predictedDy - targetDy);
      if (err < bestError) {
        bestError = err;
        bestAngle = theta;
      }
    }
    return bestAngle;
  }
  function roughnessAt(x) { for (const ch of currentLevel().challenges) if (ch.type === "rough" && x >= ch.x && x <= ch.x + ch.width) return ch.roughness || 1.2; return 1; }
  function getUpcomingChallenge(x, lookahead) {
    const reach = lookahead == null ? 120 : lookahead;
    let best = null;
    let bestDx = Infinity;
    for (const ch of currentLevel().challenges) {
      const dx = ch.x - x;
      if (dx < -20 || dx > reach) continue;
      if (dx < bestDx) {
        bestDx = dx;
        best = ch;
      }
    }
    return best ? { challenge: best, dx: bestDx } : null;
  }
  function driveParams() { return calibration || { driveGain: 1.14, gripGain: 0.54, shapeGain: 0.56, spinGain: 0.82, dampingGain: 0.43 }; }

  function inferPhysicsProfile(r) {
    const legCount = r.attachments.filter((a) => a.type === "leg").length;
    const loopCount = r.attachments.filter((a) => a.type === "loop").length;
    const finCount = r.attachments.filter((a) => a.type === "fin").length;
    const tailCount = r.attachments.filter((a) => a.type === "tail").length;
    const armCount = r.attachments.filter((a) => a.type === "arm").length;
    const supportLayout = measureSupportLayout(r);
    const supportBias = clamp((legCount * 1.25 + loopCount * 0.9 + finCount * 0.45) / Math.max(1, r.attachments.length), 0.35, 1.6);
    const stanceWidth = clamp(r.width * (0.34 + supportBias * 0.18), 24, 130);
    const cadence = clamp(1.5 + supportBias * 1.15 + r.compactness * 0.22, 1.6, 4.5);
    return {
      legCount,
      loopCount,
      finCount,
      tailCount,
      armCount,
      supportBias,
      stanceWidth,
      cadence,
      staticFriction: clamp(0.72 + r.grip / 240 + legCount * 0.05, 0.74, 1.42),
      dynamicFriction: clamp(0.36 + r.grip / 360 + loopCount * 0.03, 0.3, 0.95),
      recoveryTorque: clamp(0.18 + r.stability / 460 + supportBias * 0.08, 0.16, 0.6),
      suspension: clamp(0.32 + r.stability / 320 + loopCount * 0.08, 0.3, 0.9),
      airControl: clamp(0.16 + finCount * 0.12 + tailCount * 0.08, 0.12, 0.6),
      rollBias: clamp(0.2 + loopCount * 0.16, 0.2, 0.9),
      grabStrength: clamp(0.28 + armCount * 0.22, 0.22, 0.92),
      supportLayout,
      locomotionMode:
        loopCount >= 3 ? "trike"
        : loopCount >= 2 && legCount === 0 ? "cart"
        : legCount >= 3 && loopCount === 0 ? "crawler"
        : legCount >= 2 && armCount >= 2 && loopCount === 0 ? "climber"
        : legCount >= 2 && loopCount === 0 ? "walker"
        : finCount >= 2 && loopCount === 0 && legCount === 0 ? "glider"
        : "hybrid",
    };
  }

  function measureSupportLayout(nextRig) {
    const supports = (nextRig.attachments || []).filter(function (attachment) {
      return attachment.type === "loop" || attachment.type === "leg";
    }).map(function (attachment) {
      if (attachment.type === "loop") return attachmentCenterLocal(attachment);
      const foot = attachment.relPoints && attachment.relPoints.length ? attachment.relPoints[attachment.relPoints.length - 1] : { x: 0, y: 0 };
      return { x: attachment.anchor.x + foot.x, y: attachment.anchor.y + foot.y };
    }).sort(function (a, b) { return a.x - b.x; });
    const count = supports.length;
    const minX = count ? supports[0].x : nextRig.bodyOval.center.x;
    const maxX = count ? supports[count - 1].x : nextRig.bodyOval.center.x;
    const span = Math.max(0, maxX - minX);
    const midpoint = (minX + maxX) * 0.5;
    const comX = nextRig.bodyOval.center.x + (nextRig.comLocal ? nextRig.comLocal.x : 0);
    const coverage = clamp(span / Math.max(1, nextRig.width), 0, 1.4);
    const comOffset = comX - midpoint;
    const centred = count >= 2 && comX >= minX - 8 && comX <= maxX + 8;
    const quality = clamp((count >= 2 ? 0.45 : count * 0.18) + coverage * 0.34 + (centred ? 0.23 : 0), 0, 1);
    return { count, supports, minX, maxX, span, midpoint, comX, comOffset, coverage, centred, quality };
  }

  function assessRigReadiness(nextRig) {
    const profile = nextRig.physicsProfile || inferPhysicsProfile(nextRig);
    const support = measureSupportLayout(nextRig);
    const courseFit = currentLevel().challenges.map(function (challenge) {
      let state = "ready";
      let text = "Ready";
      let advice = challengeAdvice(challenge);
      if (challenge.type === "ceiling" && nextRig.height > challenge.clearance - 6) {
        state = "attention";
        text = "Too tall";
        advice = `Lower or shrink the rig: it is ${Math.round(nextRig.height)}px high and this tunnel allows ${challenge.clearance}px.`;
      } else if (challenge.type === "gap" && (nextRig.enginePotential < 72 || support.count < 2)) {
        state = "attention";
        text = "Needs momentum";
        advice = "Use at least two supports and a compact rolling or walking rig for a steadier jump.";
      } else if (challenge.type === "step" && (support.count < 2 || support.quality < 0.38)) {
        state = "attention";
        text = "Narrow support";
        advice = "Add or spread supports so the chassis stays level at the step.";
      } else if (challenge.type === "rough" && (support.count < 2 || support.span < Math.max(22, nextRig.width * 0.22))) {
        state = "attention";
        text = "Needs stability";
        advice = "Place a second wheel or leg farther from the first for rough ground.";
      }
      return { challenge, label: challengeName(challenge), state, text, advice };
    });
    const warnings = [];
    if (support.count < 2) warnings.push("Add a second wheel or leg so the chassis has a stable ground base.");
    else if (support.span < Math.max(22, nextRig.width * 0.22)) warnings.push("Spread the ground supports farther apart to reduce tipping.");
    if (!support.centred && support.count >= 2) warnings.push("Move a support toward the centre of mass (red cross) to balance the chassis.");
    const courseWarning = courseFit.find(function (fit) { return fit.state === "attention"; });
    if (courseWarning) warnings.push(courseWarning.advice);
    const grade = warnings.length === 0 ? "Ready" : support.count < 2 ? "Needs support" : "Refine design";
    const mode = profile.locomotionMode === "cart" || profile.locomotionMode === "trike" ? "Rolling rig"
      : profile.locomotionMode === "walker" || profile.locomotionMode === "crawler" ? "Walking rig"
      : profile.locomotionMode === "climber" ? "Climbing rig"
      : profile.locomotionMode === "glider" ? "Gliding rig"
      : "Hybrid rig";
    return {
      grade,
      advice: warnings[0] || "Balanced support and course clearance look good. Run a test and refine from the result.",
      support,
      courseFit,
      mode,
      drive: nextRig.enginePotential >= 115 ? "strong" : nextRig.enginePotential >= 70 ? "workable" : "weak",
      balance: support.centred && support.quality >= 0.58 ? "stable" : support.count >= 2 ? "workable" : "unstable",
    };
  }

  function analysisItem(label, value, tone) {
    const item = document.createElement("div");
    item.className = `src-analysis-item${tone ? ` is-${tone}` : ""}`;
    const name = document.createElement("span");
    const result = document.createElement("strong");
    name.textContent = label;
    result.textContent = value;
    item.appendChild(name);
    item.appendChild(result);
    return item;
  }

  function getElementRecords() {
    const bodyIndex = rig ? rig.bodyStrokeIndex : 0;
    const records = [{ kind: "chassis", index: bodyIndex, label: "Chassis", detail: "Main body · carries every attached component", type: "chassis", active: true }];
    placedParts.forEach(function (part, index) {
      records.push({
        kind: "part",
        index,
        label: `${partDisplayName(part.type)} ${index + 1}`,
        detail: `Placed part · ${partPurpose(part.type)}`,
        type: part.type,
        active: true,
      });
    });
    for (let sourceIndex = 0; sourceIndex < strokes.length; sourceIndex += 1) {
      if (sourceIndex === bodyIndex) continue;
      const attachment = rig && (rig.detectedAttachments || rig.attachments || []).find(function (item) { return item.sourceStrokeIndex === sourceIndex; });
      const type = attachment ? attachment.type : "connector";
      const confidence = attachment && attachment.classification ? attachment.classification.confidence : 0;
      const connected = !attachment || !attachment.classification || attachment.classification.connected !== false;
      records.push({
        kind: "stroke",
        index: sourceIndex,
        label: attachment ? `${partDisplayName(type)} sketch` : `Connector sketch ${sourceIndex}`,
        detail: attachment
          ? `${Math.round(confidence * 100)}% confidence · ${attachment.classification.reason}${connected ? "" : " · not connected to chassis"}`
          : "Analyze to identify this freehand stroke.",
        type,
        active: connected,
      });
    }
    return records;
  }

  function selectionMatches(record) {
    return !!selectedElement && selectedElement.kind === record.kind && selectedElement.index === record.index;
  }

  function selectElement(kind, index) {
    selectedElement = { kind, index };
    selectedPartType = null;
    syncPartSelection();
    syncElementInspector();
    renderDrawing();
  }

  function selectedElementRecord() {
    return getElementRecords().find(selectionMatches) || null;
  }

  function syncElementInspector() {
    if (inSelfTest) return;
    if (!elementsListEl) return;
    const records = getElementRecords();
    const selected = selectedElementRecord();
    if (selectedElement && !selected) selectedElement = null;
    const readiness = rig && rig.readiness ? rig.readiness : null;
    if (readinessEl) readinessEl.textContent = readiness ? readiness.advice : "Add two wheels or legs to give the chassis a stable support base, then analyze the design.";
    if (readinessBadgeEl) {
      readinessBadgeEl.textContent = readiness ? readiness.grade : "Draft";
      readinessBadgeEl.dataset.state = readiness ? (readiness.grade === "Ready" ? "ready" : "attention") : "draft";
    }
    if (analysisSummaryEl) {
      analysisSummaryEl.textContent = "";
      if (readiness) {
        analysisSummaryEl.appendChild(analysisItem("Type", readiness.mode, "info"));
        analysisSummaryEl.appendChild(analysisItem("Drive", readiness.drive, readiness.drive === "strong" ? "ready" : readiness.drive === "weak" ? "attention" : "info"));
        analysisSummaryEl.appendChild(analysisItem("Balance", readiness.balance, readiness.balance === "stable" ? "ready" : readiness.balance === "unstable" ? "attention" : "info"));
        analysisSummaryEl.appendChild(analysisItem("Support base", `${Math.round(readiness.support.span)}px`, readiness.support.quality >= 0.5 ? "ready" : "attention"));
        readiness.courseFit.forEach(function (fit) {
          analysisSummaryEl.appendChild(analysisItem(fit.label, fit.text, fit.state === "ready" ? "ready" : "attention"));
        });
      } else {
        analysisSummaryEl.appendChild(analysisItem("Detected", `${placedParts.length} placed ${placedParts.length === 1 ? "part" : "parts"}`, "info"));
        analysisSummaryEl.appendChild(analysisItem("Next", "Analyze rig", "info"));
      }
    }
    if (selectionInspectorEl) {
      selectionInspectorEl.textContent = "";
      const heading = document.createElement("strong");
      const copy = document.createElement("span");
      if (selected) {
        heading.textContent = selected.label;
        copy.textContent = selected.detail;
      } else {
        heading.textContent = "Select an element";
        copy.textContent = "Use this list to inspect or edit parts and freehand connector strokes.";
      }
      selectionInspectorEl.appendChild(heading);
      selectionInspectorEl.appendChild(copy);
    }
    if (deleteSelectedEl) deleteSelectedEl.disabled = !selected || selected.kind === "chassis";
    if (duplicateSelectedEl) duplicateSelectedEl.disabled = !selected || selected.kind !== "part";
    elementsListEl.textContent = "";
    records.forEach(function (record) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = `src-element-button src-element-button--${record.type}${selectionMatches(record) ? " is-selected" : ""}${record.active ? "" : " is-inactive"}`;
      button.setAttribute("aria-pressed", String(selectionMatches(record)));
      const title = document.createElement("strong");
      const detail = document.createElement("span");
      title.textContent = record.label;
      detail.textContent = record.detail;
      button.appendChild(title);
      button.appendChild(detail);
      button.addEventListener("click", function () { selectElement(record.kind, record.index); });
      item.appendChild(button);
      elementsListEl.appendChild(item);
    });
  }

  function removeSelectedElement() {
    const selected = selectedElementRecord();
    if (!selected || selected.kind === "chassis") return;
    if (selected.kind === "part") placedParts.splice(selected.index, 1);
    else if (selected.kind === "stroke") strokes.splice(selected.index, 1);
    selectedElement = null;
    selectedPartType = null;
    rig = null;
    baseLocked = false;
    running = false;
    paused = false;
    hideRunResult();
    syncPartSelection();
    syncElementInspector();
    renderDrawing();
    setStatus("Selected element removed. Analyze again when the design is ready.", true);
  }

  function duplicateSelectedPart() {
    const selected = selectedElementRecord();
    if (!selected || selected.kind !== "part" || !placedParts[selected.index]) return;
    const original = placedParts[selected.index];
    placedParts.push({
      type: original.type,
      x: clamp(original.x + 26, 12, drawWidth - 12),
      y: clamp(original.y + 14, 12, drawHeight - 12),
      scale: placedPartScale(original),
    });
    selectedElement = { kind: "part", index: placedParts.length - 1 };
    rig = null;
    baseLocked = false;
    hideRunResult();
    syncElementInspector();
    renderDrawing();
    setStatus(`${partDisplayName(original.type)} duplicated. Drag the highlighted copy to position it.`, true);
  }

  function worldPoint(local) {
    const c = Math.cos(sim.angle), s = Math.sin(sim.angle);
    return { x: sim.x + local.x * c - local.y * s, y: sim.y + local.x * s + local.y * c };
  }

  function worldCenterOfMass() {
    if (sim.backend === "planck" && sim.planck && sim.planck.chassis) {
      const pos = sim.planck.chassis.getPosition();
      return {
        x: pos.x * pixelsPerMeter,
        y: pos.y * pixelsPerMeter,
      };
    }
    return worldPoint(rig && rig.comLocal ? rig.comLocal : { x: 0, y: 0 });
  }

  function pxToM(v) {
    return v / pixelsPerMeter;
  }

  function mToPx(v) {
    return v * pixelsPerMeter;
  }

  function shouldUsePlanckBackend(r) {
    if (!planckLib || !r || !r.physicsProfile) return false;
    if (!(typeof window !== "undefined" && window.__usePlanckRigBackend === true)) return false;
    return r.physicsProfile.locomotionMode === "cart" || r.physicsProfile.locomotionMode === "trike";
  }

  function attachmentCenterLocal(a) {
    if (!a.relPoints || !a.relPoints.length) return { x: a.anchor.x, y: a.anchor.y };
    let sumX = 0;
    let sumY = 0;
    for (const p of a.relPoints) {
      sumX += p.x;
      sumY += p.y;
    }
    return {
      x: a.anchor.x + sumX / a.relPoints.length,
      y: a.anchor.y + sumY / a.relPoints.length,
    };
  }

  function createPlanckGround(world, maxX) {
    const body = world.createBody();
    let prev = null;
    for (let x = 0; x <= maxX; x += 14) {
      const p = planckLib.Vec2(pxToM(x), pxToM(getGroundY(x)));
      if (prev) body.createFixture(planckLib.Edge(prev, p), { friction: 0.9, restitution: 0 });
      prev = p;
    }
    return body;
  }

  function syncFromPlanck() {
    if (!sim.planck || !sim.planck.chassis) return;
    const chassis = sim.planck.chassis;
    const pos = chassis.getPosition();
    const vel = chassis.getLinearVelocity();
    sim.x = mToPx(pos.x);
    sim.y = mToPx(pos.y);
    sim.vx = mToPx(vel.x);
    sim.vy = mToPx(vel.y);
    sim.angle = chassis.getAngle();
    sim.omega = chassis.getAngularVelocity();
    let contacts = 0;
    sim.onGround = false;
    const bodies = [chassis].concat(sim.planck.wheels.map(function (w) { return w.body; }));
    bodies.forEach(function (body) {
      for (let ce = body.getContactList(); ce; ce = ce.next) {
        if (ce.contact && ce.contact.isTouching()) {
          contacts += 1;
          sim.onGround = true;
        }
      }
    });
    sim.contacts = contacts;
  }

  function initPlanckRig() {
    if (!shouldUsePlanckBackend(rig)) return false;
    const world = new planckLib.World(planckLib.Vec2(0, pxToM(gravity)));
    createPlanckGround(world, currentLevel().finishX + worldWidth);
    const chassis = world.createDynamicBody({
      position: planckLib.Vec2(pxToM(84), pxToM(getGroundY(84) - rig.height * 0.56)),
      angle: 0,
      linearDamping: 0.45,
      angularDamping: 1.6,
    });
    chassis.createFixture(planckLib.Box(pxToM(rig.bodyOval.rx), pxToM(rig.bodyOval.ry)), {
      density: Math.max(0.6, rig.mass / 90),
      friction: 0.6,
      restitution: 0,
    });
    rig.attachments.forEach(function (a) {
      if (a.type === "structure") {
        const start = a.anchor;
        const end = a.relPoints && a.relPoints.length ? { x: a.anchor.x + a.relPoints[a.relPoints.length - 1].x, y: a.anchor.y + a.relPoints[a.relPoints.length - 1].y } : a.anchor;
        const midX = (start.x + end.x) * 0.5;
        const midY = (start.y + end.y) * 0.5;
        const len = Math.max(10, Math.hypot(end.x - start.x, end.y - start.y));
        const ang = Math.atan2(end.y - start.y, end.x - start.x);
        chassis.createFixture(planckLib.Box(pxToM(len * 0.5), pxToM(4), planckLib.Vec2(pxToM(midX), pxToM(midY)), ang), {
          density: 0.18,
          friction: 0.5,
        });
      }
    });
    const wheels = [];
    for (let ai = 0; ai < rig.attachments.length; ai += 1) {
      const a = rig.attachments[ai];
      if (a.type !== "loop") continue;
      const centerLocal = attachmentCenterLocal(a);
      const wheel = world.createDynamicBody({
        position: planckLib.Vec2(pxToM(sim.x + centerLocal.x), pxToM(sim.y + centerLocal.y)),
        linearDamping: 0.18,
        angularDamping: 0.08,
      });
      wheel.createFixture(planckLib.Circle(pxToM(a.wheelRadius || 12)), {
        density: 1.1,
        friction: 1.25,
        restitution: 0,
      });
      const joint = world.createJoint(planckLib.RevoluteJoint({
        enableMotor: true,
        maxMotorTorque: 120,
        motorSpeed: 0,
      }, chassis, wheel, wheel.getWorldCenter()));
      wheels.push({ ai, body: wheel, joint, radius: a.wheelRadius || 12 });
    }
    sim.backend = "planck";
    sim.planck = { world, chassis, wheels };
    return wheels.length >= 2;
  }

  function massPointWorld(point) {
    return worldPoint({
      x: point.x - rig.bodyOval.center.x,
      y: point.y - rig.bodyOval.center.y,
    });
  }

  function worldPointAround(local, anchor, localAngle) {
    const ca = Math.cos(localAngle), sa = Math.sin(localAngle);
    const rx = local.x * ca - local.y * sa;
    const ry = local.x * sa + local.y * ca;
    const c = Math.cos(sim.angle), s = Math.sin(sim.angle);
    const ax = anchor.x * c - anchor.y * s;
    const ay = anchor.x * s + anchor.y * c;
    return {
      x: sim.x + ax + (rx * c - ry * s),
      y: sim.y + ay + (rx * s + ry * c),
    };
  }

  function attachmentWorldPoint(a, state, rel, globalPhase) {
    const muscle = 1 + Math.sin(globalPhase * a.muscleFreq + a.phaseOffset) * a.muscleAmp;
    const scaled = { x: rel.x, y: rel.y * muscle };
    return worldPointAround(scaled, a.anchor, state.angle || 0);
  }

  function resetSim() {
    if (!rig && !analyzeDrawing()) return false;
    sim.x = 84; sim.vx = 0; sim.vy = 0; sim.angle = 0; sim.omega = 0; sim.onGround = false; sim.contacts = 0; sim.backend = "custom"; sim.planck = null;
    sim.attachStates = rig.attachments.map(function () {
      return {
        angle: 0,
        omega: 0,
        spinAngle: 0,
        spinOmega: 0,
        plantedX: null,
        plantedY: null,
        plantedFor: 0,
        grabFor: 0,
        grabCooldown: 0,
        grabLength: 0,
        lastGroundX: null,
      };
    });
    sim.gaitTimer = 0;
    sim.swingRight = false;
    sim.stanceX = null;
    sim.stanceTargetVx = 0;
    sim.singleSupportTime = 0;
    sim.y = getGroundY(sim.x) - rig.height * 0.54;
    if (shouldUsePlanckBackend(rig) && initPlanckRig()) {
      syncFromPlanck();
    }
    timer = currentLevel().timeLimit; cameraX = 0; phase = 0; frameAccumulator = 0; stuckTimer = 0; bestProgress = sim.x;
    for (const ch of currentLevel().challenges) ch.done = false;
    return true;
  }

  function syncRunControls() {
    if (!runButtonEl) return;
    const label = running ? (paused ? "Resume test" : "Pause test") : "Run test";
    runButtonEl.textContent = label;
    runButtonEl.setAttribute("aria-pressed", String(running && paused));
    runButtonEl.setAttribute("aria-label", label);
  }

  function hideRunResult() {
    if (runResultEl) runResultEl.hidden = true;
  }

  function showRunResult(kind, title, copy) {
    if (inSelfTest || !runResultEl) return;
    runResultEl.hidden = false;
    runResultEl.dataset.outcome = kind;
    if (resultKickerEl) resultKickerEl.textContent = kind === "success" ? "Track cleared" : "Test result";
    if (resultTitleEl) resultTitleEl.textContent = title;
    if (resultCopyEl) resultCopyEl.textContent = copy;
  }

  function failureAdvice(message) {
    const readiness = rig && rig.readiness;
    if (message.indexOf("Time") >= 0) return readiness && readiness.drive === "weak"
      ? "Build more drive: add a wheel or leg, then keep the rig compact."
      : "Try a more compact support layout to keep momentum over the course.";
    if (message.indexOf("fell") >= 0) return readiness && readiness.support.count < 2
      ? "Add a second wheel or leg below the chassis before trying again."
      : "Widen the support base or move a support toward the red centre-of-mass cross.";
    if (message.indexOf("Stuck") >= 0) return readiness ? readiness.advice : "Add two wheels or legs with contact below the chassis.";
    return readiness ? readiness.advice : "Analyze the design, then make one focused change.";
  }

  function failRun(msg) {
    running = false;
    paused = false;
    const advice = failureAdvice(msg);
    setStatus(`Run failed: ${msg} ${advice}`, true);
    showRunResult("failure", msg, advice);
    syncRunControls();
    syncElementInspector();
  }
  function winRun() {
    running = false;
    paused = false;
    if (!inSelfTest) completedLevels.add(levelIndex);
    const nextText = levelIndex < levels.length - 1 ? "Try the next track when you are ready." : "You cleared every current track—try refining the rig for a faster run.";
    setStatus(`Level cleared: ${currentLevel().name}. ${nextText}`, true);
    showRunResult("success", `${currentLevel().name} cleared`, nextText);
    syncTrackGoal();
    syncRunControls();
    syncElementInspector();
  }
  function startRun() {
    if (!resetSim()) return;
    running = true;
    paused = false;
    hideRunResult();
    syncRunControls();
    setStatus(`Simulation running. ${rig && rig.readiness ? rig.readiness.mode : "Watch the support base and refine after the test."}`);
    syncHud();
  }

  function updateSimulation(dt) {
    if (!running || paused || !rig) return;
    timer = Math.max(0, timer - dt); if (timer <= 0) { failRun("Time expired."); return; }
    if (sim.backend === "planck" && sim.planck) {
      phase += dt * 2;
      const profile = rig.physicsProfile || inferPhysicsProfile(rig);
      const desiredWheelSpeed = clamp(42 + rig.enginePotential * 0.16 + profile.rollBias * 18 - rig.mass * 0.04, 28, 96);
      sim.planck.wheels.forEach(function (wheel) {
        const radiusM = Math.max(0.18, pxToM(wheel.radius));
        const targetOmega = -(desiredWheelSpeed / pixelsPerMeter) / radiusM;
        wheel.joint.setMotorSpeed(targetOmega);
        wheel.joint.setMaxMotorTorque(90 + rig.enginePotential * 0.4);
        const state = sim.attachStates[wheel.ai];
        if (state) {
          state.spinAngle = wheel.body.getAngle();
          state.spinOmega = wheel.body.getAngularVelocity();
        }
      });
      sim.planck.world.step(dt, 10, 6);
      syncFromPlanck();
      for (const ch of currentLevel().challenges) if (!ch.done && sim.x > ch.x + (ch.width || 0)) ch.done = true;
      if (sim.y > worldHeight + 220) { failRun("You fell out."); return; }
      if (sim.x > bestProgress + 6) { bestProgress = sim.x; stuckTimer = 0; } else { stuckTimer += dt; if (stuckTimer > 3.8) { failRun("Stuck. Redraw with better ground contact."); return; } }
      if (sim.x >= currentLevel().finishX) { winRun(); return; }
      cameraX = clamp(sim.x - worldWidth * 0.24, 0, Math.max(0, currentLevel().finishX - worldWidth * 0.56));
      return;
    }
    const p = driveParams();
    const slope = groundSlope(sim.x);
    const rough = roughnessAt(sim.x);
    const gripNorm = clamp(rig.grip / 120, 0.2, 1.8);
    const massNorm = clamp(rig.mass / 80, 0.5, 2.2);
    const stabilityNorm = clamp(rig.stability / 120, 0.2, 1.8);
    const profile = rig.physicsProfile || inferPhysicsProfile(rig);
    const tune = physicsTuning || defaultPhysicsTuning();
    const requiresGroundDrive = profile.locomotionMode !== "glider";
    const baseDriveFactor =
      profile.locomotionMode === "cart" || profile.locomotionMode === "trike" ? 0.18
      : profile.locomotionMode === "walker" || profile.locomotionMode === "crawler" || profile.locomotionMode === "climber" ? 0.12
      : profile.locomotionMode === "hybrid" ? 0.05
      : 0;
    phase += dt * (2.1 + rig.compactness * 0.12 + rig.rough * 0.03);
    const pulse = 0.68 + 0.32 * Math.sin(phase + rig.centroidX * 0.03) + 0.12 * Math.sin(phase * 2.3);
    const engineForce = rig.enginePotential * p.driveGain * (0.5 + pulse) * (0.55 + p.shapeGain * clamp(rig.compactness / 2.8, 0.2, 1.9));
    const drag = (0.018 + p.dampingGain * 0.01 + rough * 0.005) * (1 / Math.max(0.25, gripNorm));
    const inertiaNorm = clamp((rig.inertia || 3200) / 3600, 0.55, 3.2);
    const upcoming = getUpcomingChallenge(sim.x, 160);
    sim.vx += (((engineForce * baseDriveFactor) * gripNorm) / (rig.mass * 0.22) - slope * (55 / Math.max(0.5, stabilityNorm))) * dt;
    sim.vx *= Math.exp(-drag * dt * 8);
    sim.vx = clamp(sim.vx, -70, 250);
    sim.vy += gravity * dt;
    sim.x += sim.vx * dt; sim.y += sim.vy * dt; sim.angle += sim.omega * dt;
    sim.omega *= Math.exp(-dt * (1.45 + stabilityNorm * 0.24 + 0.1 / inertiaNorm));
    let comWorld = worldCenterOfMass();

    let maxPen = 0, contacts = 0, torqueAcc = 0;
    let attachmentDriveBoost = 0;
    let attachmentSpinBoost = 0;
    const footContacts = [];
    const allGroundContacts = [];
    const wheelContacts = [];
    const wheelSupports = [];
    const legSupports = [];
    const wheelCandidates = [];
    const legCandidates = [];
    let bodySupported = false;
    let supportUnits = 0;
    let supportGroundY = 0;
    let supportGroundWeight = 0;
    for (const lp of rig.bodySamplePoints) {
      const wp = worldPoint(lp);
      const groundY = getGroundY(wp.x);
      const pen = wp.y - groundY;
      if (pen > 0) {
        contacts += 1;
        bodySupported = true;
        allGroundContacts.push({ x: wp.x, y: wp.y, source: "body" });
        supportGroundY += groundY * 1.15;
        supportGroundWeight += 1.15;
        if (pen > maxPen) maxPen = pen;
        torqueAcc += (wp.x - comWorld.x) * pen * 0.00055;
      }
    }
    if (bodySupported) supportUnits += 1;
    for (let ai = 0; ai < rig.attachments.length; ai += 1) {
      const a = rig.attachments[ai];
      const state = sim.attachStates[ai] || {
        angle: 0,
        omega: 0,
        spinAngle: 0,
        spinOmega: 0,
        plantedX: null,
        plantedY: null,
        plantedFor: 0,
        grabFor: 0,
        grabCooldown: 0,
        grabLength: 0,
        lastGroundX: null,
      };
      sim.attachStates[ai] = state;
      state.grabCooldown = Math.max(0, (state.grabCooldown || 0) - dt);
      const targetSwing = a.type === "loop" || a.type === "structure" ? 0 : Math.sin(phase * a.swingFreq + a.phaseOffset) * a.swingAmp;
      const springTorque = (targetSwing - state.angle) * a.stiffness - state.omega * (a.type === "loop" || a.type === "structure" ? a.damping * 0.4 : a.damping);
      state.omega += springTorque * dt;
      state.omega = clamp(state.omega, -7.5, 7.5);
      state.angle += state.omega * dt;
      state.angle = clamp(state.angle, -1.45, 1.45);
      if (a.type === "loop") {
        const hub = worldPointAround({ x: 0, y: 0 }, a.anchor, 0);
        wheelCandidates.push({ x: hub.x, y: hub.y, ai, radius: Math.max(8, a.wheelRadius || 12) });
      } else if (a.type === "leg") {
        const footRel = a.relPoints[a.relPoints.length - 1];
        const footPoint = attachmentWorldPoint(a, state, footRel, phase);
        legCandidates.push({ x: footPoint.x, y: footPoint.y, ai });
      }

      let localContacts = 0;
      let avgX = 0;
      let avgY = 0;
      const contactPoints = a.contactRelPoints && a.contactRelPoints.length ? a.contactRelPoints : a.relPoints;
      for (const rel of contactPoints) {
        const wp = attachmentWorldPoint(a, state, rel, phase);
        const groundY = getGroundY(wp.x);
        const pen = wp.y - groundY;
        const contactTolerance =
          a.type === "loop" ? 7
          : a.type === "leg" ? 10
          : a.type === "arm" ? 6
          : 4;
        if (pen > -contactTolerance) {
          localContacts += 1;
          contacts += 1;
          const contactY = Math.min(wp.y, groundY);
          allGroundContacts.push({ x: wp.x, y: contactY, source: a.type, ai });
          supportGroundY += groundY * (a.type === "loop" ? 1.3 : a.type === "leg" ? 1.2 : 0.9);
          supportGroundWeight += a.type === "loop" ? 1.3 : a.type === "leg" ? 1.2 : 0.9;
          avgX += wp.x;
          avgY += contactY;
          if (pen > maxPen) maxPen = pen;
          torqueAcc += (wp.x - comWorld.x) * Math.max(0, pen) * 0.00045;
        }
      }
      if (localContacts > 0) {
        supportUnits += 1;
        avgX /= localContacts;
        avgY /= localContacts;
        attachmentDriveBoost += a.driveGain * Math.min(1.7, localContacts / Math.max(3, contactPoints.length));
        if (a.type === "leg") {
          footContacts.push({ x: avgX, y: avgY, ai });
          legSupports.push({ x: avgX, y: avgY, ai });
          if (state.plantedX == null) {
            state.plantedX = avgX;
            state.plantedY = avgY;
            state.plantedFor = 0;
          }
          state.plantedFor += dt;
          const stickErr = clamp(state.plantedX - avgX, -40, 40);
          sim.vx += stickErr * (2.5 * a.stickiness * tune.legPlant) * dt;
          sim.omega += ((avgX - comWorld.x) * stickErr) * 0.00012;
          const gaitPhase = Math.sin(phase * a.swingFreq + a.phaseOffset);
          if (gaitPhase > 0.38) {
            state.plantedX = null;
            state.plantedY = null;
            state.plantedFor = 0;
          }
          if (gaitPhase < -0.1) {
            sim.vx += a.driveGain * 22 * tune.legDrive * dt;
          }
        } else if (a.type === "loop") {
          const radius = Math.max(8, a.wheelRadius || 12);
          // One attachment is one wheel. Raw rim samples still feed collision,
          // but locomotion must not mistake a single wheel for an axle.
          wheelContacts.push({ x: avgX, y: avgY, ai, radius });
          wheelSupports.push({ x: avgX, y: avgY, ai, radius });
          if (state.lastGroundX != null) {
            const rollDx = avgX - state.lastGroundX;
            state.spinOmega = clamp(rollDx / Math.max(dt * radius, 1e-4), -16, 16);
            state.spinAngle += rollDx / Math.max(6, radius);
          } else {
            state.spinOmega = clamp(sim.vx / Math.max(6, radius), -16, 16);
            state.spinAngle += state.spinOmega * dt;
          }
          state.lastGroundX = avgX;
          attachmentSpinBoost += a.driveGain * Math.min(2, localContacts / 7);
          sim.vx += a.driveGain * (7 + 11 * profile.rollBias) * tune.wheelDrive * dt;
          sim.omega -= a.driveGain * 0.012 * Math.sign(slope || 1);
        } else if (a.type === "arm") {
          const handRel = a.relPoints[a.relPoints.length - 1];
          const handPoint = attachmentWorldPoint(a, state, handRel, phase);
          const handGroundY = getGroundY(handPoint.x);
          const handNearGround = handPoint.y >= handGroundY - 9;
          const anchorWorld = worldPointAround({ x: 0, y: 0 }, a.anchor, 0);
          const reachingForward = handPoint.x > anchorWorld.x + 10;
          const canGrab = handNearGround && reachingForward && state.plantedX == null && state.grabCooldown <= 0;
          if (canGrab) {
            state.plantedX = avgX;
            state.plantedY = avgY;
            state.grabFor = 0;
            state.grabLength = Math.hypot(state.plantedX - handPoint.x, state.plantedY - handPoint.y);
          }
          if (state.plantedX != null) {
            state.grabFor += dt;
            const contractPhase = Math.sin(clamp(state.grabFor / 0.42, 0, 1) * Math.PI);
            const currentLength = Math.hypot(state.plantedX - handPoint.x, state.plantedY - handPoint.y);
            const targetLength = Math.max(6, (state.grabLength || currentLength) * (1 - 0.32 * contractPhase));
            const pullMag = clamp(currentLength - targetLength, -12, 22);
            const dirX = currentLength > 1e-4 ? (state.plantedX - handPoint.x) / currentLength : 0;
            const dirY = currentLength > 1e-4 ? (state.plantedY - handPoint.y) / currentLength : 0;
            const supportFactor = profile.locomotionMode === "climber" ? 1.05 : 0.72;
            const forceX = (-dirX) * pullMag * profile.grabStrength * 3.4 * tune.armPull * supportFactor;
            const forceY = (-dirY) * pullMag * profile.grabStrength * 1.8 * tune.armPull * supportFactor;
            sim.vx += forceX * dt;
            sim.vy += forceY * dt;
            sim.omega += ((avgX - comWorld.x) * forceY - (avgY - comWorld.y) * forceX) * 0.00008;
            if (state.grabFor > 0.46 || currentLength < targetLength + 2) {
              state.plantedX = null;
              state.plantedY = null;
              state.grabFor = 0;
              state.grabLength = 0;
              state.grabCooldown = 0.16;
            }
          }
        } else if (a.type === "structure") {
          sim.omega += (-state.angle * 0.18 - state.omega * 0.05) * dt;
        } else if (a.type === "fin") {
          if (Math.abs(sim.vx) > 18) {
            sim.vy -= Math.abs(sim.vx) * 0.018 * a.driveGain * dt;
          }
          sim.omega += (-sim.angle * 0.22 - sim.omega * 0.04) * dt;
        } else if (a.type === "tail") {
          sim.omega += (-sim.angle * 0.16 - sim.omega * 0.1) * dt;
        } else {
          sim.vx += a.driveGain * 0.6 * dt;
        }
      } else {
        state.plantedX = null;
        state.plantedY = null;
        state.plantedFor = 0;
        state.grabFor = 0;
        state.grabLength = 0;
        state.lastGroundX = null;
        // Stabilizers work while airborne; grounding a fin or tail should not be
        // required before it can counter pitch or soften a landing.
        if (a.type === "fin") {
          const airSpeed = Math.max(0, Math.abs(sim.vx) - 18);
          sim.vy -= airSpeed * 0.012 * profile.airControl * dt;
          sim.omega += (-sim.angle * 0.34 - sim.omega * 0.045) * profile.airControl * dt;
        } else if (a.type === "tail") {
          sim.omega += (-sim.angle * 0.24 - sim.omega * 0.07) * profile.airControl * dt;
        }
      }
    }

    if ((profile.locomotionMode === "cart" || profile.locomotionMode === "trike") && wheelCandidates.length >= 2) {
      for (const wheel of wheelCandidates) {
        const groundY = getGroundY(wheel.x);
        const wheelPen = wheel.y + wheel.radius - groundY;
        if (wheelPen > -28 && !wheelSupports.some(function (support) { return support.ai === wheel.ai; })) {
          wheelSupports.push({ x: wheel.x, y: groundY, ai: wheel.ai, radius: wheel.radius });
          allGroundContacts.push({ x: wheel.x, y: groundY, source: "loop", ai: wheel.ai });
          supportGroundY += groundY * 1.18;
          supportGroundWeight += 1.18;
        }
      }
      if (wheelSupports.length >= 2) {
        supportUnits = Math.max(supportUnits, 2);
      }
    }
    if ((profile.locomotionMode === "walker" || profile.locomotionMode === "crawler" || profile.locomotionMode === "climber") && legCandidates.length >= 2) {
      for (const foot of legCandidates) {
        const groundY = getGroundY(foot.x);
        const footPen = foot.y - groundY;
        if (footPen > -18) {
          legSupports.push({ x: foot.x, y: groundY, ai: foot.ai });
          footContacts.push({ x: foot.x, y: groundY, ai: foot.ai });
          allGroundContacts.push({ x: foot.x, y: groundY, source: "leg", ai: foot.ai });
          supportGroundY += groundY * 1.16;
          supportGroundWeight += 1.16;
          const state = sim.attachStates[foot.ai];
          if (state && state.plantedX == null) {
            state.plantedX = foot.x;
            state.plantedY = groundY;
            state.plantedFor = 0;
          }
        }
      }
      if (legSupports.length >= 2) {
        supportUnits = Math.max(supportUnits, 2);
      }
    }

    if (profile.locomotionMode === "hybrid" && supportUnits === 0 && rig.massPoints && rig.massPoints.length) {
      const bottomCandidates = rig.massPoints
        .map(function (p) {
          const wp = massPointWorld(p);
          return {
            x: wp.x,
            y: wp.y,
            w: p.w,
            delta: wp.y - getGroundY(wp.x),
          };
        })
        .filter(function (p) { return p.delta > -14; })
        .sort(function (a, b) {
          if (b.y !== a.y) return b.y - a.y;
          return b.w - a.w;
        });
      const supportFallback = [];
      for (let i = 0; i < bottomCandidates.length; i += 1) {
        const c = bottomCandidates[i];
        if (!supportFallback.length || Math.abs(c.x - supportFallback[supportFallback.length - 1].x) > 18) {
          supportFallback.push(c);
        }
        if (supportFallback.length >= 2) break;
      }
      if (supportFallback.length >= 2) {
        for (const c of supportFallback) {
          const gy = getGroundY(c.x);
          allGroundContacts.push({ x: c.x, y: gy, source: "body" });
          supportGroundY += gy * 1.08;
          supportGroundWeight += 1.08;
        }
        supportUnits = Math.max(supportUnits, 2);
        const span = Math.abs(supportFallback[1].x - supportFallback[0].x);
        if (span > Math.max(18, rig.width * 0.22)) {
          const fallbackAngle = Math.atan2(supportFallback[1].y - supportFallback[0].y, supportFallback[1].x - supportFallback[0].x) * 0.22;
          sim.omega += (fallbackAngle - sim.angle) * 0.48 * dt;
          if (requiresGroundDrive) sim.vx += (8 + rig.enginePotential * 0.025) * dt;
        }
      }
    }

    // Two-support gait logic: usually two contacts share load.
    if (footContacts.length >= 2) {
      footContacts.sort((a, b) => a.x - b.x);
      const left = footContacts[0];
      const right = footContacts[footContacts.length - 1];
      const supportDx = Math.max(1, right.x - left.x);
      const supportDy = right.y - left.y;
      const supportAngle = Math.atan2(supportDy, supportDx) * 0.35;
      sim.omega += (supportAngle - sim.angle) * 0.42 * dt;

      sim.gaitTimer -= dt;
      if (sim.gaitTimer <= 0) {
        sim.swingRight = !sim.swingRight;
        sim.gaitTimer = (0.28 + 0.18 / Math.max(0.45, gripNorm)) / profile.cadence * 2.2;
        sim.stanceX = null;
      }
      const stance = sim.swingRight ? left : right;
      const swing = sim.swingRight ? right : left;
      const stanceState = sim.attachStates[stance.ai];
      const swingState = sim.attachStates[swing.ai];
      if (swingState) {
        swingState.plantedX = null;
        swingState.plantedY = null;
        swingState.plantedFor = 0;
      }
      if (sim.stanceX == null) sim.stanceX = stance.x;
      const stanceSlip = clamp(sim.stanceX - stance.x, -38, 38);
      sim.vx += stanceSlip * (2.5 + profile.supportBias * 0.95) * tune.legPlant * dt;
      sim.vx += clamp(swing.x - stance.x, -80, 80) * 0.055 * dt;
      const desiredWalkSpeed = clamp(38 + rig.enginePotential * 0.12 + profile.supportBias * 18, 28, 94) * tune.legCruise;
      sim.stanceTargetVx = clamp(Math.max((swing.x - stance.x) * 0.4, desiredWalkSpeed * 0.72), -60, 120);
      sim.vx += (desiredWalkSpeed - sim.vx) * (0.52 + profile.supportBias * 0.08) * dt;
      sim.vy -= 4 * tune.legLift * dt;
      if (Math.abs(stanceSlip) < 7) {
        sim.vy -= 6 * tune.legLift * dt; // small unload while stance is anchored and opposite leg swings
      }
      if (stanceState && stanceState.plantedFor > 0.55) {
        stanceState.plantedX = null;
        stanceState.plantedY = null;
        stanceState.plantedFor = 0;
      }
    } else if (footContacts.length === 1) {
      const only = footContacts[0];
      const onlyState = sim.attachStates[only.ai];
      if (onlyState && onlyState.plantedFor > 0.45) {
        onlyState.plantedX = null;
        onlyState.plantedY = null;
        onlyState.plantedFor = 0;
      }
      sim.vx *= 0.96;
      sim.vy += 26 * dt;
      sim.stanceTargetVx = 0;
      sim.stanceX = null;
      sim.gaitTimer = 0.12;
    } else {
      sim.stanceX = null;
      sim.stanceTargetVx = 0;
      sim.gaitTimer = Math.max(0, sim.gaitTimer - dt);
    }

    if (wheelContacts.length >= 2) {
      wheelContacts.sort((a, b) => a.x - b.x);
      const frontWheel = wheelContacts[wheelContacts.length - 1];
      const backWheel = wheelContacts[0];
      const wheelSpan = Math.max(18, frontWheel.x - backWheel.x);
      const desiredWheelSpeed = clamp(48 + rig.enginePotential * 0.14 + profile.rollBias * 18 - rig.mass * 0.05, 34, 112) * tune.wheelCruise;
      sim.stanceTargetVx = Math.max(sim.stanceTargetVx, desiredWheelSpeed);
      const wheelGrip = clamp((profile.staticFriction + profile.rollBias * 0.35) * tune.wheelTraction, 0.8, 1.9);
      sim.vx += (desiredWheelSpeed - sim.vx) * (0.42 + wheelGrip * 0.16) * dt;
      const axleAngle = Math.atan2(frontWheel.y - backWheel.y, wheelSpan) * 0.5;
      sim.omega += (axleAngle - sim.angle) * (0.45 + wheelGrip * 0.12) * dt;
      if (wheelSpan > rig.width * 0.32) {
        sim.singleSupportTime = Math.max(0, sim.singleSupportTime - dt * 4);
      }
      for (const wc of wheelContacts) {
        const state = sim.attachStates[wc.ai];
        if (!state) continue;
        if (state.lastGroundX != null) {
          const rollDx = wc.x - state.lastGroundX;
          state.spinOmega = clamp(rollDx / Math.max(dt * Math.max(8, wc.radius), 1e-4), -18, 18);
          state.spinAngle += rollDx / Math.max(8, wc.radius);
        } else {
          const targetSpin = clamp(sim.vx / Math.max(8, wc.radius), -12, 12);
          state.spinOmega += (targetSpin - state.spinOmega) * (0.3 + wheelGrip * 0.04);
          state.spinAngle += state.spinOmega * dt;
        }
        state.lastGroundX = wc.x;
      }
    }
    if (wheelSupports.length >= 2) {
      wheelSupports.sort((a, b) => a.x - b.x);
      const leftWheel = wheelSupports[0];
      const rightWheel = wheelSupports[wheelSupports.length - 1];
      const leftAnchor = rig.attachments[leftWheel.ai].anchor;
      const rightAnchor = rig.attachments[rightWheel.ai].anchor;
      const targetLeftCenterY = leftWheel.y - leftWheel.radius;
      const targetRightCenterY = rightWheel.y - rightWheel.radius;
      const targetAngle = solveSupportAngle(
        { x: leftWheel.x, y: targetLeftCenterY },
        { x: rightWheel.x, y: targetRightCenterY },
        leftAnchor,
        rightAnchor,
        -0.55,
        0.55
      );
      const targetBodyY = (
        targetLeftCenterY - (leftAnchor.x * Math.sin(targetAngle) + leftAnchor.y * Math.cos(targetAngle))
        + targetRightCenterY - (rightAnchor.x * Math.sin(targetAngle) + rightAnchor.y * Math.cos(targetAngle))
      ) * 0.5;
      const liftError = targetBodyY - sim.y;
      const boundedWheelLift = clamp(liftError, -10, 16);
      sim.y += boundedWheelLift * 0.74;
      sim.vy += boundedWheelLift * 13.4 * dt;
      sim.omega += (targetAngle - sim.angle) * (2.4 + profile.rollBias * 0.55) * dt;
      sim.omega *= 0.78;
      sim.angle = clamp(sim.angle + (targetAngle - sim.angle) * 0.34, -0.32, 0.32);
      const cartCruise = profile.locomotionMode === "trike" ? 88 : 80;
      sim.vx += (cartCruise - sim.vx) * 0.46 * dt;
    }
    if (legSupports.length >= 2) {
      legSupports.sort((a, b) => a.x - b.x);
      const leftLeg = legSupports[0];
      const rightLeg = legSupports[legSupports.length - 1];
      const supportDx = Math.max(12, rightLeg.x - leftLeg.x);
      const supportDy = rightLeg.y - leftLeg.y;
      const legPlaneAngle = Math.atan2(supportDy, supportDx) * 0.26;
      const legBodyTargetY = ((leftLeg.y + rightLeg.y) * 0.5) - (rig.bodyOval.ry + 28);
      const legLiftError = legBodyTargetY - sim.y;
      const boundedLegLift = clamp(legLiftError, -10, 14);
      sim.y += boundedLegLift * 0.16;
      sim.vy += boundedLegLift * 4.8 * dt;
      sim.omega += (legPlaneAngle - sim.angle) * (0.9 + profile.supportBias * 0.18) * dt;
      sim.omega *= 0.9;
      sim.angle = clamp(sim.angle + (legPlaneAngle - sim.angle) * 0.16, -0.58, 0.58);
      const gaitCruise =
        profile.locomotionMode === "crawler" ? 82
        : profile.locomotionMode === "climber" ? 82
        : 68;
      sim.vx += (gaitCruise - sim.vx) * 0.4 * dt;
      if (rough > 1.05) {
        const roughBoost =
          profile.locomotionMode === "crawler" ? 20
          : profile.locomotionMode === "climber" ? 22
          : 8;
        sim.vx += roughBoost * dt;
      }
    }
    if (profile.locomotionMode === "glider") {
      const aeroSpeed = Math.max(0, sim.vx);
      const lift = clamp((aeroSpeed - 52) * 0.08, 0, 7);
      sim.vy -= lift * dt;
      sim.omega += (-sim.angle * 0.42 - sim.omega * 0.08) * dt;
      sim.angle = clamp(sim.angle, -0.42, 0.42);
      sim.vx *= 0.998;
    }

    if (upcoming && upcoming.challenge) {
      const ch = upcoming.challenge;
      const proximity = 1 - clamp(upcoming.dx / 160, 0, 1);
      if (ch.type === "step" && supportUnits >= 1) {
        const liftAssist =
          profile.locomotionMode === "cart" || profile.locomotionMode === "trike" ? 66
          : profile.locomotionMode === "glider" ? 20
          : 84;
        sim.vy -= liftAssist * 0.42 * proximity * dt;
        sim.vx += (18 + ch.height * 0.25) * proximity * dt;
        sim.omega += (-sim.angle * 0.35) * proximity * dt;
      } else if (ch.type === "gap") {
        if (profile.locomotionMode === "glider") {
          sim.vy -= 18 * proximity * dt;
          sim.vx += 18 * proximity * dt;
        } else if (supportUnits >= 1) {
          sim.vy -= 16 * proximity * dt;
          sim.vx += 12 * proximity * dt;
        }
      } else if (ch.type === "ceiling") {
        const ceilingY = getCeilingY(sim.x + Math.max(0, upcoming.dx));
        const desiredBodyY = ceilingY + Math.max(14, rig.height * 0.18);
        if (sim.y > desiredBodyY) {
          sim.y += (desiredBodyY - sim.y) * 0.08 * proximity;
          sim.vy -= 8 * proximity * dt;
        }
        sim.omega += (-sim.angle * 0.4) * proximity * dt;
      } else if (ch.type === "rough" && supportUnits >= 1) {
        sim.vx += (10 + (ch.roughness || 1) * 4) * proximity * dt;
        sim.omega *= 0.995;
      }
    }

    // Component 1 (easy): support polygon + center-of-pressure stabilization.
    let supportMinX = Infinity;
    let supportMaxX = -Infinity;
    let copX = sim.x;
    let supportSpan = 0;
    if (allGroundContacts.length) {
      let weighted = 0;
      let weightSum = 0;
      for (const c of allGroundContacts) {
        if (c.x < supportMinX) supportMinX = c.x;
        if (c.x > supportMaxX) supportMaxX = c.x;
        const wgt = c.source === "body" ? 1.25 : c.source === "leg" ? 1.15 : 0.95;
        weighted += c.x * wgt;
        weightSum += wgt;
      }
      copX = weighted / Math.max(1e-6, weightSum);
      supportSpan = Math.max(0, supportMaxX - supportMinX);
    }
    const comOffsetFromSupport = allGroundContacts.length ? clamp(comWorld.x - copX, -120, 120) : 0;

    // Component 2 (medium): stick-slip friction from traction demand.
    const tractionDemand = Math.abs(sim.vx - sim.stanceTargetVx) * 0.016 + Math.abs(slope) * 0.7;
    const staticFriction = profile.staticFriction * tune.frictionGrip * clamp(1 + (supportUnits - 2) * 0.1, 0.7, 1.35);
    const dynamicFriction = profile.dynamicFriction * clamp(0.85 + tune.frictionGrip * 0.15, 0.72, 1.18);
    const frictionModeStatic = supportUnits >= 1 && tractionDemand < staticFriction;
    const frictionCoef = frictionModeStatic ? staticFriction : dynamicFriction;

    // Component 3 (hard): balance recovery when COM leaves support polygon.
    if (supportUnits >= 2 && Number.isFinite(supportMinX) && Number.isFinite(supportMaxX)) {
      const margin = 6 + profile.stanceWidth * 0.06;
      const leftBound = supportMinX - margin;
      const rightBound = supportMaxX + margin;
      if (comWorld.x < leftBound) {
        sim.omega += profile.recoveryTorque * 0.18;
        sim.vx += 12 * dt;
        sim.vy += 10 * dt;
      } else if (comWorld.x > rightBound) {
        sim.omega -= profile.recoveryTorque * 0.18;
        sim.vx -= 12 * dt;
        sim.vy += 10 * dt;
      } else {
        const targetAngle = clamp((copX - comWorld.x) * 0.012, -0.24, 0.24);
        sim.omega += (targetAngle - sim.angle) * profile.recoveryTorque * dt;
      }
    }
    if (supportUnits <= 1 && allGroundContacts.length) {
      sim.singleSupportTime += dt;
      const contactX = copX;
      const comOffset = clamp(comWorld.x - contactX, -90, 90);
      const instability = clamp(Math.abs(comOffset) / Math.max(10, rig.width * 0.18) + sim.singleSupportTime * 0.9, 0, 3.2);
      sim.omega += Math.sign(comOffset || (sim.vx >= 0 ? 1 : -1)) * instability * 0.22 * dt;
      sim.vx *= clamp(0.992 - instability * 0.012, 0.9, 0.992);
      sim.vy += (16 + instability * 26) * dt;
      if (footContacts.length === 1) {
        const onlyState = sim.attachStates[footContacts[0].ai];
        if (onlyState && sim.singleSupportTime > 0.22) {
          onlyState.plantedX = null;
          onlyState.plantedY = null;
          onlyState.plantedFor = 0;
        }
      }
    } else {
      sim.singleSupportTime = Math.max(0, sim.singleSupportTime - dt * 3);
    }
    const supportMeanGroundY = supportGroundWeight > 0 ? supportGroundY / supportGroundWeight : null;
    if (maxPen > 0) {
      const supportFactor = supportUnits >= 2 ? 1 : 0.42;
      const rideHeight = rig.bodyOval ? rig.bodyOval.ry + 4 + Math.max(0, rig.comLocal ? rig.comLocal.y * 0.06 : 0) : rig.height * 0.28;
      if (supportMeanGroundY != null) {
        const targetY = supportMeanGroundY - rideHeight;
        const rideError = clamp(targetY - sim.y, -16, 20);
        const upwardRideError = Math.min(0, rideError);
        const downwardRideError = Math.max(0, rideError);
        sim.vy += downwardRideError * (5.8 * profile.suspension * tune.suspensionSnap) * dt;
        sim.vy += upwardRideError * (3.1 * profile.suspension * tune.suspensionSnap) * dt;
        sim.y += downwardRideError * (0.1 + profile.suspension * 0.04) * tune.suspensionRide;
        sim.y += upwardRideError * (0.04 + profile.suspension * 0.02) * tune.suspensionRide;
      }
      sim.y -= Math.min(maxPen, 18) * 0.36 * supportFactor + 0.12 * supportFactor;
      if (sim.vy > 0) sim.vy *= supportUnits >= 2 ? 0.22 : 0.35;
      if (supportUnits <= 1) {
        sim.vy += 18 * dt;
      }
      sim.onGround = true; sim.contacts = supportUnits;
      const normal = groundNormal(copX);
      const slopeAngle = Math.atan2(normal.x, normal.y);
      sim.omega += (slopeAngle - sim.angle) * (0.55 + profile.suspension * 0.25) * tune.suspensionRide * dt;
      sim.omega += clamp(comOffsetFromSupport / Math.max(18, rig.width * 0.32), -2.2, 2.2) * (gravity / 760) * 0.18 * dt / inertiaNorm;
      if (supportUnits >= 2 && supportSpan < Math.max(14, rig.width * 0.12)) {
        sim.omega += Math.sign(sim.angle || (sim.vx >= 0 ? 1 : -1)) * 0.14 * dt;
        sim.vy += 10 * dt;
      }
      sim.omega += (rig.centroidX * 0.0009 + Math.sin(phase) * 0.0018 + slope * 0.006) * p.spinGain * (1.2 / massNorm) + torqueAcc;
      sim.omega = clamp(sim.omega, -3.2, 3.2);
      sim.vx += attachmentDriveBoost * 12 * dt;
      if (wheelContacts.length >= 2 && frictionModeStatic) {
        sim.vx += (8 + profile.rollBias * 8) * tune.wheelTraction * dt;
      }
      if (footContacts.length >= 2 && frictionModeStatic) {
        sim.vx += (6 + profile.supportBias * 7) * tune.legStride * dt;
      }
      if (supportUnits >= 2 && frictionModeStatic && sim.vx < 26) {
        sim.vx += (5 + profile.supportBias * 4) * dt;
      }
      sim.omega += attachmentSpinBoost * 0.022;
      sim.vx *= clamp(0.99 - rough * 0.006 - frictionCoef * 0.012 + gripNorm * 0.003, 0.88, 0.998);
    } else {
      sim.onGround = false;
      sim.contacts = 0;
      sim.omega += slope * 0.004 * dt;
      sim.omega += clamp(-(rig.comLocal ? rig.comLocal.x : 0) * 0.0008 - sim.angle * 0.04, -0.18, 0.18) * dt / inertiaNorm;
      sim.omega += (-sim.angle * (0.08 + profile.airControl * 0.18) - sim.omega * 0.018) * tune.airBalance * dt;
      sim.vx *= 0.998 + profile.airControl * 0.001 * tune.airBalance;
      sim.vy += Math.abs(sim.angle) * profile.airControl * 0.3 * tune.airBalance * dt;
    }
    comWorld = worldCenterOfMass();

    let ceilPen = 0;
    for (const lp of rig.bodySamplePoints) {
      const wp = worldPoint(lp);
      const cy = getCeilingY(wp.x);
      if (cy !== -Infinity && wp.y < cy) { const pen = cy - wp.y; if (pen > ceilPen) ceilPen = pen; }
    }
    for (let ai = 0; ai < rig.attachments.length; ai += 1) {
      const a = rig.attachments[ai];
      const state = sim.attachStates[ai] || { angle: 0, grabFor: 0 };
      for (const rel of a.relPoints) {
        const wp = attachmentWorldPoint(a, state, rel, phase);
        const cy = getCeilingY(wp.x);
        if (cy !== -Infinity && wp.y < cy) {
          const pen = cy - wp.y;
          if (pen > ceilPen) ceilPen = pen;
        }
      }
    }
    if (ceilPen > 0) { sim.y += ceilPen + 0.35; sim.vy = Math.max(30, sim.vy * 0.3); sim.vx *= 0.82; sim.omega *= 0.5; }

    for (const ch of currentLevel().challenges) if (!ch.done && sim.x > ch.x + (ch.width || 0)) ch.done = true;
    if (sim.y > worldHeight + 220) { failRun("You fell out."); return; }
    if (sim.x > bestProgress + 6) { bestProgress = sim.x; stuckTimer = 0; } else { stuckTimer += dt; if (stuckTimer > 3.8) { failRun("Stuck. Redraw with better ground contact."); return; } }
    if (sim.x >= currentLevel().finishX) { winRun(); return; }
    cameraX = clamp(sim.x - worldWidth * 0.24, 0, Math.max(0, currentLevel().finishX - worldWidth * 0.56));
  }

  function drawWorld() {
    worldCtx.imageSmoothingEnabled = false;
    const theme = levelThemes[levelIndex % levelThemes.length];
    const g = worldCtx.createLinearGradient(0, 0, 0, worldHeight);
    g.addColorStop(0, theme.skyTop);
    g.addColorStop(0.58, theme.skyMid);
    g.addColorStop(1, theme.skyBottom);
    worldCtx.fillStyle = g;
    worldCtx.fillRect(0, 0, worldWidth, worldHeight);

    const hillOffset = -(cameraX * 0.16) % (worldWidth + 160);
    worldCtx.fillStyle = theme.farHill;
    for (let i = -2; i < 7; i += 1) {
      const x = hillOffset + i * 240;
      worldCtx.beginPath();
      worldCtx.moveTo(x, worldHeight);
      worldCtx.quadraticCurveTo(x + 110, worldHeight - 220, x + 220, worldHeight);
      worldCtx.fill();
    }

    worldCtx.fillStyle = theme.nearHill;
    for (let i = -2; i < 7; i += 1) {
      const x = hillOffset + i * 214;
      worldCtx.beginPath();
      worldCtx.moveTo(x, worldHeight);
      worldCtx.quadraticCurveTo(x + 94, worldHeight - 154, x + 188, worldHeight);
      worldCtx.fill();
    }

    const sunX = worldWidth - 110;
    const sunY = 88;
    const sunGlow = worldCtx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 126);
    sunGlow.addColorStop(0, theme.sunCore);
    sunGlow.addColorStop(0.28, theme.sunMid);
    sunGlow.addColorStop(1, theme.sunOuter);
    worldCtx.fillStyle = sunGlow;
    worldCtx.beginPath();
    worldCtx.arc(sunX, sunY, 84 + Math.sin(phase * 0.28) * 2, 0, Math.PI * 2);
    worldCtx.fill();

    worldCtx.fillStyle = theme.cloud;
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 250 - cameraX * 0.33) % (worldWidth + 220)) - 80;
      const y = 58 + (i % 2) * 34 + Math.sin(phase * 0.35 + i) * 3;
      worldCtx.beginPath();
      worldCtx.arc(x, y, 22, 0, Math.PI * 2);
      worldCtx.arc(x + 26, y + 1, 18, 0, Math.PI * 2);
      worldCtx.arc(x - 24, y + 4, 16, 0, Math.PI * 2);
      worldCtx.fill();
    }

    worldCtx.fillStyle = "rgba(255,255,255,0.14)";
    for (let i = 0; i < 24; i += 1) {
      const x = ((i * 127 - cameraX * 0.24) % (worldWidth + 80)) - 30;
      const y = 36 + (i * 31) % 170;
      worldCtx.fillRect(x, y, 2, 2);
    }

    const groundFill = worldCtx.createLinearGradient(0, worldHeight - 180, 0, worldHeight);
    groundFill.addColorStop(0, "rgba(22,34,58,0.94)");
    groundFill.addColorStop(0.55, "rgba(15,23,42,0.98)");
    groundFill.addColorStop(1, "rgba(7,12,22,1)");
    worldCtx.fillStyle = groundFill;
    worldCtx.beginPath();
    worldCtx.moveTo(0, worldHeight);
    traceGroundPath(worldCtx, 0, worldWidth, cameraX, 1);
    worldCtx.lineTo(worldWidth, worldHeight);
    worldCtx.closePath();
    worldCtx.fill();

    worldCtx.save();
    worldCtx.beginPath();
    worldCtx.moveTo(0, worldHeight);
    traceGroundPath(worldCtx, 0, worldWidth, cameraX, 1);
    worldCtx.lineTo(worldWidth, worldHeight);
    worldCtx.closePath();
    worldCtx.clip();

    worldCtx.strokeStyle = "rgba(125,211,252,0.08)";
    worldCtx.lineWidth = 10;
    for (let sx = -140; sx <= worldWidth + 140; sx += 48) {
      worldCtx.beginPath();
      worldCtx.moveTo(sx, worldHeight - 4);
      worldCtx.lineTo(sx + 120, worldHeight - 160);
      worldCtx.stroke();
    }

    worldCtx.fillStyle = "rgba(56,189,248,0.08)";
    for (let sx = -40; sx <= worldWidth + 40; sx += 64) {
      const y = getGroundY(sx + cameraX);
      worldCtx.fillRect(sx - 14, y - 12, 28, 7);
    }
    worldCtx.restore();

    worldCtx.strokeStyle = "rgba(34,211,238,0.55)";
    worldCtx.lineWidth = 2;
    worldCtx.beginPath();
    traceGroundPath(worldCtx, 0, worldWidth, cameraX, 1);
    worldCtx.stroke();

    for (const ch of currentLevel().challenges) {
      const x = ch.x - cameraX;
      if (x > worldWidth + 30 || x + (ch.width || 0) < -30) continue;
      if (ch.type === "gap") {
        const baseY = getGroundY(ch.x - 2);
        worldCtx.fillStyle = "rgba(8,12,20,0.95)";
        worldCtx.fillRect(x, baseY - 2, ch.width, worldHeight - baseY + 10);
        worldCtx.fillStyle = "rgba(15,23,42,0.95)";
        worldCtx.fillRect(x, baseY - 10, ch.width, 12);
        drawArt("tires", x - 18, baseY - 26, 42, 28);
        drawArt("tires", x + ch.width - 24, baseY - 26, 42, 28);
        drawArt("arrow", x + ch.width * 0.5 - 18, baseY - 56, 36, 26, { alpha: 0.95 });
      } else if (ch.type === "ceiling") {
        const y = getGroundY(ch.x) - ch.clearance;
        worldCtx.fillStyle = ch.done ? "rgba(34,197,94,0.22)" : "rgba(250,204,21,0.16)";
        worldCtx.fillRect(x, y - 28, ch.width, 28);
        for (let bx = 0; bx < ch.width; bx += 52) {
          if (!drawArt("barrier", x + bx, y - 26, Math.min(56, ch.width - bx + 8), 22, { alpha: ch.done ? 0.52 : 0.95 })) {
            worldCtx.fillStyle = ch.done ? "rgba(34,197,94,0.72)" : "rgba(250,204,21,0.82)";
            worldCtx.fillRect(x + bx, y - 12, Math.min(52, ch.width - bx), 12);
          }
        }
        drawArt("light", x + 10, y - 46, 20, 36, { alpha: 0.85 });
        drawArt("light", x + ch.width - 30, y - 46, 20, 36, { alpha: 0.85 });
      } else if (ch.type === "step") {
        const y = getGroundY(ch.x + 1);
        worldCtx.fillStyle = ch.done ? "rgba(34,197,94,0.18)" : "rgba(251,113,133,0.22)";
        worldCtx.fillRect(x, y - ch.height, ch.width, ch.height);
        for (let bx = 0; bx < ch.width; bx += 34) {
          drawArt(bx % 68 === 0 ? "barrel" : "tires", x + bx, y - ch.height - 4, 30, 30, { alpha: ch.done ? 0.72 : 1 });
        }
      } else if (ch.type === "rough") {
        const y = getGroundY(ch.x);
        worldCtx.fillStyle = ch.done ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)";
        worldCtx.fillRect(x, y - 14, ch.width, 26);
        for (let bx = 0; bx < ch.width; bx += 28) {
          const sprite = bx % 84 === 0 ? "rock1" : bx % 56 === 0 ? "rock2" : "rock3";
          drawArt(sprite, x + bx, y - 24 - (bx % 2) * 4, 22, 20, { alpha: ch.done ? 0.62 : 0.96 });
        }
      }
      worldCtx.fillStyle = "rgba(226,232,240,0.95)"; worldCtx.font = "600 12px Space Grotesk, sans-serif"; worldCtx.fillText(ch.label || ch.type, x + 6, 28);
    }

    const gx = currentLevel().finishX - cameraX, gy = getGroundY(currentLevel().finishX) - 86;
    worldCtx.fillStyle = "rgba(59,130,246,0.9)"; worldCtx.fillRect(gx, gy, 8, 86);
    drawArt("light", gx - 16, gy - 2, 20, 40, { alpha: 0.9 });
    drawArt("light", gx + 12, gy - 2, 20, 40, { alpha: 0.9 });
    worldCtx.fillStyle = "rgba(14,165,233,0.95)";
    worldCtx.beginPath(); worldCtx.moveTo(gx + 8, gy + 6); worldCtx.lineTo(gx + 45, gy + 20); worldCtx.lineTo(gx + 8, gy + 34); worldCtx.closePath(); worldCtx.fill();
    drawArt("cone", gx - 16, getGroundY(currentLevel().finishX) - 18, 14, 20);
    drawArt("cone", gx + 20, getGroundY(currentLevel().finishX) - 18, 14, 20);

    if (rig) {
      if (messageFlash > 0) { const a = messageFlash / 0.5; worldCtx.fillStyle = `rgba(34,197,94,${0.11 * a})`; worldCtx.fillRect(0, 0, worldWidth, worldHeight); }
      const c = Math.cos(sim.angle), s = Math.sin(sim.angle), x = sim.x - cameraX, y = sim.y;
      const com = worldCenterOfMass();
      worldCtx.fillStyle = "rgba(15,23,42,0.35)"; worldCtx.beginPath(); worldCtx.ellipse(x, getGroundY(sim.x) + 3, rig.width * 0.32, 9, 0, 0, Math.PI * 2); worldCtx.fill();
      worldCtx.lineCap = "round"; worldCtx.lineJoin = "round";

      // Main body: fitted oval chassis derived from the first stroke.
      worldCtx.strokeStyle = "rgba(14,165,233,0.98)";
      worldCtx.lineWidth = 4.4;
      if (rig.bodyStroke && rig.bodyStroke.length) {
        const stroke = rig.bodyStroke;
        worldCtx.beginPath();
        worldCtx.moveTo(x + stroke[0].x * c - stroke[0].y * s, y + stroke[0].x * s + stroke[0].y * c);
        for (let i = 1; i < stroke.length; i += 1) {
          worldCtx.lineTo(x + stroke[i].x * c - stroke[i].y * s, y + stroke[i].x * s + stroke[i].y * c);
        }
        worldCtx.stroke();
      }

      // Attachments: articulated around body anchors.
      for (let ai = 0; ai < rig.attachments.length; ai += 1) {
        const a = rig.attachments[ai];
        const state = sim.attachStates[ai] || { angle: 0 };
        if (a.type === "loop" && a.wheelRadius > 0) {
          const planckWheel = sim.backend === "planck" && sim.planck
            ? sim.planck.wheels.find(function (wheel) { return wheel.ai === ai; })
            : null;
          const hub = planckWheel
            ? { x: mToPx(planckWheel.body.getPosition().x), y: mToPx(planckWheel.body.getPosition().y) }
            : worldPointAround({ x: 0, y: 0 }, a.anchor, 0);
          const spinAngle = planckWheel ? planckWheel.body.getAngle() : (state.spinAngle || 0);
          const hubX = hub.x - cameraX;
          const hubY = hub.y;
          worldCtx.strokeStyle = "rgba(251,191,36,0.98)";
          worldCtx.lineWidth = 3;
          worldCtx.beginPath();
          worldCtx.arc(hubX, hubY, a.wheelRadius, 0, Math.PI * 2);
          worldCtx.stroke();
          worldCtx.fillStyle = "rgba(251,191,36,0.95)";
          worldCtx.beginPath();
          worldCtx.arc(hubX, hubY, Math.max(3, a.wheelRadius * 0.18), 0, Math.PI * 2);
          worldCtx.fill();
          worldCtx.strokeStyle = "rgba(255,255,255,0.95)";
          worldCtx.lineWidth = 2.4;
          worldCtx.beginPath();
          worldCtx.moveTo(hubX, hubY);
          worldCtx.lineTo(
            hubX + Math.cos(spinAngle) * a.wheelRadius * 0.98,
            hubY + Math.sin(spinAngle) * a.wheelRadius * 0.98
          );
          worldCtx.stroke();
          worldCtx.strokeStyle = "rgba(255,244,200,0.92)";
          worldCtx.lineWidth = 2;
          for (let si = 0; si < 4; si += 1) {
            const spokeAngle = spinAngle + si * (Math.PI * 0.5);
            worldCtx.beginPath();
            worldCtx.moveTo(hubX, hubY);
            worldCtx.lineTo(
              hubX + Math.cos(spokeAngle) * a.wheelRadius * 0.92,
              hubY + Math.sin(spokeAngle) * a.wheelRadius * 0.92
            );
            worldCtx.stroke();
          }
          for (let mi = 0; mi < 2; mi += 1) {
            const markerAngle = spinAngle + mi * Math.PI;
            worldCtx.fillStyle = mi === 0 ? "rgba(239,68,68,0.98)" : "rgba(34,211,238,0.98)";
            worldCtx.beginPath();
            worldCtx.arc(
              hubX + Math.cos(markerAngle) * a.wheelRadius * 0.84,
              hubY + Math.sin(markerAngle) * a.wheelRadius * 0.84,
              Math.max(2.2, a.wheelRadius * 0.1),
              0,
              Math.PI * 2
            );
            worldCtx.fill();
          }
          continue;
        }
        worldCtx.strokeStyle =
          a.type === "structure"
            ? "rgba(148,163,184,0.96)"
            :
          a.type === "leg"
            ? "rgba(74,222,128,0.98)"
            : a.type === "loop"
            ? "rgba(251,191,36,0.95)"
            : a.type === "arm"
            ? "rgba(244,114,182,0.95)"
            : "rgba(167,139,250,0.95)";
        worldCtx.lineWidth = a.type === "leg" ? 3.8 : a.type === "structure" ? 4.4 : 3.2;
        if (!a.relPoints.length) continue;
        worldCtx.beginPath();
        const p0 = attachmentWorldPoint(a, state, a.relPoints[0], phase);
        worldCtx.moveTo(p0.x - cameraX, p0.y);
        for (let i = 1; i < a.relPoints.length; i += 1) {
          const p = attachmentWorldPoint(a, state, a.relPoints[i], phase);
          worldCtx.lineTo(p.x - cameraX, p.y);
        }
        worldCtx.stroke();
      }
      worldCtx.strokeStyle = "rgba(239,68,68,0.96)";
      worldCtx.lineWidth = 2;
      worldCtx.beginPath();
      worldCtx.moveTo(com.x - cameraX - 6, com.y);
      worldCtx.lineTo(com.x - cameraX + 6, com.y);
      worldCtx.moveTo(com.x - cameraX, com.y - 6);
      worldCtx.lineTo(com.x - cameraX, com.y + 6);
      worldCtx.stroke();
    }

    worldCtx.fillStyle = "rgba(2,6,23,0.55)"; worldCtx.fillRect(12, 12, 324, 82);
    worldCtx.strokeStyle = "rgba(148,163,184,0.45)"; worldCtx.strokeRect(12, 12, 324, 82);
    worldCtx.fillStyle = "rgba(226,232,240,0.96)"; worldCtx.font = "700 14px Space Grotesk, sans-serif"; worldCtx.fillText(currentLevel().name, 22, 34);
    worldCtx.font = "600 12px Space Grotesk, sans-serif"; worldCtx.fillText(`Finish: ${Math.round(currentLevel().finishX)}m`, 22, 56); worldCtx.fillText(`Time left: ${timer.toFixed(1)}s`, 22, 74);
    if (sim.contacts > 0) worldCtx.fillText(`Contacts: ${sim.contacts}`, 180, 74);
  }

  function syncHud() {
    levelEl.textContent = `${levelIndex + 1} / ${levels.length}`;
    hintEl.textContent = currentLevel().hint;
    timerEl.textContent = running ? `${timer.toFixed(1)}s` : `${currentLevel().timeLimit}s`;
    partsEl.textContent = rig ? rig.partText : "none";
    massEl.textContent = rig ? String(Math.round(rig.physicalMass || rig.mass)) : "0";
    gripEl.textContent = rig ? String(Math.round(rig.grip)) : "0";
    stabilityEl.textContent = rig ? String(Math.round(rig.stability)) : "0";
    engineEl.textContent = rig ? String(Math.round(rig.enginePotential)) : "0";
    heightEl.textContent = rig ? `${Math.round(rig.height)}px` : "0px";
    root.classList.toggle("is-running", running && !paused);
    root.classList.toggle("is-paused", running && paused);
    syncRunControls();
  }

  function runVirtualTrial(desc, coeff, course) {
    let x = 0, v = 0, t = 0;
    const dt = 0.08;
    while (t < 9) {
      const pulse = 0.68 + 0.32 * Math.sin(t * (2 + desc.compactness * 0.11));
      const engine = desc.engine * coeff.driveGain * (0.48 + pulse) * (0.52 + coeff.shapeGain * clamp(desc.compactness / 3, 0.2, 1.9));
      v += (engine * clamp(desc.grip / 120, 0.25, 2)) / (28 * clamp(desc.mass / 80, 0.5, 2.2)) * dt;
      v *= Math.exp(-(0.034 + coeff.dampingGain * 0.02 + course.rough * 0.012) * dt * 9);
      v = clamp(v, 0, 220); x += v * dt;
      if (!course.a && x >= course.stepX) { if (desc.grip * 0.35 + desc.stability * 0.28 + desc.engine * 0.26 + coeff.spinGain * 11 < course.stepNeed) return false; course.a = true; }
      if (!course.b && x >= course.gapX) { if (desc.width * 0.55 + desc.engine * 0.42 + desc.stability * 0.16 + coeff.shapeGain * 10 < course.gapNeed) return false; course.b = true; }
      if (!course.c && x >= course.ceilX) { if (desc.height > course.ceilMax + coeff.shapeGain * 5) return false; course.c = true; }
      if (x >= course.finish) return true;
      t += dt;
    }
    return false;
  }

  function calibrateModelFast() {
    const rand = createRng("sketch-rig-calibration-01");
    const descs = [];
    for (let i = 0; i < 90; i += 1) {
      descs.push({
        width: 52 + rand() * 92,
        height: 28 + rand() * 84,
        compactness: 0.8 + rand() * 3.8,
        grip: 26 + rand() * 140,
        stability: 24 + rand() * 140,
        mass: 24 + rand() * 120,
        engine: 32 + rand() * 205,
      });
    }
    const candidates = [];
    for (const d of [1.0, 1.12, 1.24]) {
      for (const s of [0.46, 0.58, 0.7]) {
        for (const sp of [0.7, 0.86, 1.02]) {
          for (const da of [0.34, 0.45]) {
            candidates.push({
              driveGain: d,
              gripGain: 0.54,
              shapeGain: s,
              spinGain: sp,
              dampingGain: da,
            });
          }
        }
      }
    }
    const courses = [
      { finish: 920, stepX: 300, stepNeed: 98, gapX: 9999, gapNeed: 9999, ceilX: 9999, ceilMax: 9999, rough: 1.1 },
      { finish: 980, stepX: 330, stepNeed: 115, gapX: 620, gapNeed: 120, ceilX: 9999, ceilMax: 9999, rough: 1.2 },
      { finish: 1040, stepX: 9999, stepNeed: 9999, gapX: 520, gapNeed: 138, ceilX: 840, ceilMax: 72, rough: 1.3 },
      { finish: 1120, stepX: 360, stepNeed: 128, gapX: 700, gapNeed: 142, ceilX: 910, ceilMax: 66, rough: 1.35 },
    ];
    let best = candidates[0], bestScore = -1;
    const scoreCandidate = function (cand) {
      let score = 0;
      for (const d of descs) for (let i = 0; i < courses.length; i += 1) if (runVirtualTrial(d, cand, { ...courses[i], a: false, b: false, c: false })) score += i + 1;
      return score;
    };
    for (const c of candidates) {
      const score = scoreCandidate(c);
      if (score > bestScore) { bestScore = score; best = c; }
    }

    const refined = [];
    const deltas = [-0.05, 0, 0.05];
    for (const d of deltas) {
      for (const s of deltas) {
        for (const sp of deltas) {
          for (const da of deltas) {
            refined.push({
              driveGain: clamp(best.driveGain + d, 0.82, 1.38),
              gripGain: 0.54,
              shapeGain: clamp(best.shapeGain + s, 0.3, 0.92),
              spinGain: clamp(best.spinGain + sp, 0.46, 1.18),
              dampingGain: clamp(best.dampingGain + da, 0.22, 0.64),
            });
          }
        }
      }
    }
    for (const c of refined) {
      const score = scoreCandidate(c);
      if (score > bestScore) { bestScore = score; best = c; }
    }

    const result = {
      ...best,
      trialShapes: descs.length,
      coarseModels: candidates.length,
      refinedModels: refined.length,
      score: bestScore,
    };
    try {
      window.localStorage.setItem(calibrationStorageKey, JSON.stringify(result));
    } catch (_) {}
    return result;
  }

  function loadCachedCalibration() {
    try {
      const raw = window.localStorage.getItem(calibrationStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.driveGain !== "number") return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function loadCachedPhysicsTuning() {
    try {
      const raw = window.localStorage.getItem(physicsTuningStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.wheelDrive !== "number") return null;
      return { ...defaultPhysicsTuning(), ...parsed };
    } catch (_) {
      return null;
    }
  }

  function storePhysicsTuning(next) {
    physicsTuning = { ...defaultPhysicsTuning(), ...next };
    try {
      window.localStorage.setItem(physicsTuningStorageKey, JSON.stringify(physicsTuning));
    } catch (_) {}
  }

  function cloneStrokes(list) {
    return list.map(function (stroke) {
      return stroke.map(function (p) { return { x: p.x, y: p.y }; });
    });
  }

  function clonePlacedParts(list) {
    return list.map(function (part) {
      return { type: part.type, x: part.x, y: part.y, scale: placedPartScale(part) };
    });
  }

  function cloneSimState() {
    return {
      x: sim.x,
      y: sim.y,
      vx: sim.vx,
      vy: sim.vy,
      angle: sim.angle,
      omega: sim.omega,
      onGround: sim.onGround,
      contacts: sim.contacts,
      attachStates: sim.attachStates.map(function (s) {
        return {
          angle: s.angle,
          omega: s.omega,
          spinAngle: s.spinAngle || 0,
          spinOmega: s.spinOmega || 0,
          plantedX: s.plantedX,
          plantedY: s.plantedY,
          plantedFor: s.plantedFor,
          grabFor: s.grabFor || 0,
          grabCooldown: s.grabCooldown || 0,
          grabLength: s.grabLength || 0,
          lastGroundX: s.lastGroundX,
        };
      }),
      gaitTimer: sim.gaitTimer,
      swingRight: sim.swingRight,
      stanceX: sim.stanceX,
      stanceTargetVx: sim.stanceTargetVx,
      singleSupportTime: sim.singleSupportTime,
      backend: sim.backend,
    };
  }

  function restoreSimState(saved) {
    sim.x = saved.x;
    sim.y = saved.y;
    sim.vx = saved.vx;
    sim.vy = saved.vy;
    sim.angle = saved.angle;
    sim.omega = saved.omega;
    sim.onGround = saved.onGround;
    sim.contacts = saved.contacts;
    sim.attachStates = saved.attachStates.map(function (s) {
      return {
        angle: s.angle,
        omega: s.omega,
        spinAngle: s.spinAngle || 0,
        spinOmega: s.spinOmega || 0,
        plantedX: s.plantedX,
        plantedY: s.plantedY,
        plantedFor: s.plantedFor,
        grabFor: s.grabFor || 0,
        grabCooldown: s.grabCooldown || 0,
        grabLength: s.grabLength || 0,
        lastGroundX: s.lastGroundX,
      };
    });
    sim.gaitTimer = saved.gaitTimer;
    sim.swingRight = saved.swingRight;
    sim.stanceX = saved.stanceX;
    sim.stanceTargetVx = saved.stanceTargetVx;
    sim.singleSupportTime = saved.singleSupportTime || 0;
    sim.backend = saved.backend || "custom";
    sim.planck = null;
  }

  function sampleCurrentSupportState() {
    if (!rig) {
      return {
        groundedByType: { loop: 0, leg: 0, arm: 0, fin: 0, tail: 0 },
        totalSupports: 0,
        avgWheelOmega: 0,
      };
    }
    const groundedByType = { loop: 0, leg: 0, arm: 0, fin: 0, tail: 0 };
    let totalSupports = 0;
    let wheelOmegaSum = 0;
    let wheelOmegaCount = 0;
    for (let ai = 0; ai < rig.attachments.length; ai += 1) {
      const a = rig.attachments[ai];
      const state = sim.attachStates[ai] || { angle: 0, omega: 0 };
      if (a.type === "loop") {
        wheelOmegaSum += Math.abs(state.spinOmega || 0);
        wheelOmegaCount += 1;
        const planckWheel = sim.backend === "planck" && sim.planck
          ? sim.planck.wheels.find(function (wheel) { return wheel.ai === ai; })
          : null;
        const hub = planckWheel
          ? { x: mToPx(planckWheel.body.getPosition().x), y: mToPx(planckWheel.body.getPosition().y) }
          : worldPointAround({ x: 0, y: 0 }, a.anchor, 0);
        const grounded = hub.y + Math.max(8, a.wheelRadius || 12) - getGroundY(hub.x) > -28;
        if (grounded) {
          groundedByType.loop += 1;
          totalSupports += 1;
        }
        continue;
      }
      if (a.type === "leg") {
        const foot = attachmentWorldPoint(a, state, a.relPoints[a.relPoints.length - 1], phase);
        const grounded = foot.y - getGroundY(foot.x) > -18;
        if (grounded) {
          groundedByType.leg += 1;
          totalSupports += 1;
        }
        continue;
      }
      const contactPoints = a.contactRelPoints && a.contactRelPoints.length ? a.contactRelPoints : a.relPoints;
      let grounded = false;
      for (const rel of contactPoints) {
        const wp = attachmentWorldPoint(a, state, rel, phase);
        const pen = wp.y - getGroundY(wp.x);
        const tolerance = a.type === "loop" ? 7 : a.type === "leg" ? 10 : 4;
        if (pen > -tolerance) {
          grounded = true;
          break;
        }
      }
      if (grounded) {
        groundedByType[a.type] = (groundedByType[a.type] || 0) + 1;
        totalSupports += 1;
      }
    }
    return {
      groundedByType,
      totalSupports,
      avgWheelOmega: wheelOmegaCount ? wheelOmegaSum / wheelOmegaCount : 0,
    };
  }

  function snapshotGameState() {
    return {
      strokes: cloneStrokes(strokes),
      placedParts: clonePlacedParts(placedParts),
      rig: rig ? JSON.parse(JSON.stringify(rig)) : null,
      baseLocked,
      levelIndex,
      running,
      paused,
      timer,
      cameraX,
      phase,
      frameAccumulator,
      messageFlash,
      stuckTimer,
      bestProgress,
      statusText: statusEl.textContent,
      sim: cloneSimState(),
    };
  }

  function restoreGameState(saved, rerender) {
    strokes = cloneStrokes(saved.strokes);
    placedParts = clonePlacedParts(saved.placedParts || []);
    rig = saved.rig ? JSON.parse(JSON.stringify(saved.rig)) : null;
    baseLocked = saved.baseLocked;
    levelIndex = saved.levelIndex;
    running = saved.running;
    paused = saved.paused;
    timer = saved.timer;
    cameraX = saved.cameraX;
    phase = saved.phase;
    frameAccumulator = saved.frameAccumulator || 0;
    messageFlash = saved.messageFlash;
    stuckTimer = saved.stuckTimer;
    bestProgress = saved.bestProgress;
    restoreSimState(saved.sim);
    statusEl.textContent = saved.statusText;
    if (rerender !== false) {
      renderDrawing();
      drawWorld();
      syncHud();
    }
  }

  function clampPoint(x, y) {
    return { x: clamp(x, 8, drawWidth - 8), y: clamp(y, 8, drawHeight - 8) };
  }

  function generateRandomDrawing(rand) {
    const centerX = 168 + (rand() - 0.5) * 42;
    const centerY = 122 + (rand() - 0.5) * 34;
    const radiusX = 32 + rand() * 54;
    const radiusY = 20 + rand() * 44;
    const bodyCount = 18 + Math.floor(rand() * 14);
    const body = [];
    for (let i = 0; i <= bodyCount; i += 1) {
      const t = (i / bodyCount) * Math.PI * 2;
      const ripple = 1 + Math.sin(t * (2 + Math.floor(rand() * 3)) + rand() * Math.PI * 2) * 0.12 + (rand() - 0.5) * 0.08;
      const x = centerX + Math.cos(t) * radiusX * ripple;
      const y = centerY + Math.sin(t) * radiusY * (0.86 + rand() * 0.26);
      body.push(clampPoint(x, y));
    }
    const out = [body];
    const attachmentCount = 1 + Math.floor(rand() * 5);
    for (let i = 0; i < attachmentCount; i += 1) {
      const anchor = body[Math.floor(rand() * body.length)];
      const pick = rand();
      const stroke = [clampPoint(anchor.x, anchor.y)];
      if (pick < 0.45) {
        const segs = 3 + Math.floor(rand() * 3);
        const len = 26 + rand() * 66;
        for (let j = 1; j <= segs; j += 1) {
          const t = j / segs;
          const x = anchor.x + (rand() - 0.5) * 14 + Math.sin(t * Math.PI * 1.2) * (8 + rand() * 8);
          const y = anchor.y + len * t + rand() * 6;
          stroke.push(clampPoint(x, y));
        }
      } else if (pick < 0.72) {
        const rr = 8 + rand() * 20;
        const loops = 8 + Math.floor(rand() * 6);
        for (let j = 1; j <= loops; j += 1) {
          const t = (j / loops) * Math.PI * 2;
          const x = anchor.x + Math.cos(t) * rr;
          const y = anchor.y + Math.sin(t) * rr;
          stroke.push(clampPoint(x, y));
        }
      } else if (pick < 0.88) {
        const span = 24 + rand() * 58;
        const dir = rand() < 0.5 ? -1 : 1;
        stroke.push(clampPoint(anchor.x + span * 0.5 * dir, anchor.y - 4 - rand() * 12));
        stroke.push(clampPoint(anchor.x + span * dir, anchor.y - 1 + rand() * 8));
      } else {
        const len = 24 + rand() * 52;
        stroke.push(clampPoint(anchor.x + (rand() - 0.5) * 28, anchor.y + len * 0.42));
        stroke.push(clampPoint(anchor.x + (rand() - 0.5) * 36, anchor.y + len));
      }
      if (stroke.length > 1) out.push(stroke);
    }
    return out;
  }

  function makeOvalStroke(cx, cy, rx, ry, points) {
    const out = [];
    const count = Math.max(12, points || 24);
    for (let i = 0; i <= count; i += 1) {
      const t = (i / count) * Math.PI * 2;
      out.push(clampPoint(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry));
    }
    return out;
  }

  function makeLineStroke(points) {
    return points.map(function (p) { return clampPoint(p.x, p.y); });
  }

  function buildFixtureBlueprint(name) {
    const cx = 180;
    const cy = 112;
    if (name === "wheel-cart") {
      return {
        body: makeOvalStroke(cx, cy, 54, 28, 26),
        parts: [
          { type: "wheel", x: cx - 34, y: cy + 34, stroke: makeOvalStroke(cx - 34, cy + 34, 17, 17, 18) },
          { type: "wheel", x: cx + 34, y: cy + 34, stroke: makeOvalStroke(cx + 34, cy + 34, 17, 17, 18) },
        ],
      };
    }
    if (name === "uneven-cart") {
      return {
        body: makeOvalStroke(cx, cy, 54, 28, 26),
        parts: [
          { type: "wheel", x: cx - 38, y: cy + 40, scale: 1.26, stroke: makeOvalStroke(cx - 38, cy + 40, 21, 21, 18) },
          { type: "wheel", x: cx + 34, y: cy + 30, scale: 0.84, stroke: makeOvalStroke(cx + 34, cy + 30, 14, 14, 18) },
          { type: "structure", x: cx - 4, y: cy + 18, scale: 1.2, stroke: makeLineStroke([{ x: cx - 42, y: cy + 18 }, { x: cx + 40, y: cy + 18 }]) },
        ],
      };
    }
    if (name === "walker") {
      return {
        body: makeOvalStroke(cx, cy, 50, 26, 24),
        parts: [
          { type: "leg", x: cx - 28, y: cy + 64, stroke: makeLineStroke([{ x: cx - 22, y: cy + 10 }, { x: cx - 26, y: cy + 48 }, { x: cx - 30, y: cy + 84 }]) },
          { type: "leg", x: cx + 30, y: cy + 62, stroke: makeLineStroke([{ x: cx + 18, y: cy + 8 }, { x: cx + 26, y: cy + 46 }, { x: cx + 34, y: cy + 82 }]) },
        ],
      };
    }
    if (name === "trike") {
      return {
        body: makeOvalStroke(cx, cy, 56, 28, 26),
        parts: [
          { type: "wheel", x: cx - 40, y: cy + 35, stroke: makeOvalStroke(cx - 40, cy + 35, 15, 15, 18) },
          { type: "wheel", x: cx + 40, y: cy + 35, stroke: makeOvalStroke(cx + 40, cy + 35, 15, 15, 18) },
          { type: "wheel", x: cx + 4, y: cy + 38, stroke: makeOvalStroke(cx + 4, cy + 38, 13, 13, 18) },
        ],
      };
    }
    if (name === "crawler") {
      return {
        body: makeOvalStroke(cx, cy, 58, 24, 26),
        parts: [
          { type: "leg", x: cx - 56, y: cy + 62, stroke: makeLineStroke([{ x: cx - 42, y: cy + 8 }, { x: cx - 52, y: cy + 38 }, { x: cx - 58, y: cy + 74 }]) },
          { type: "leg", x: cx - 6, y: cy + 62, stroke: makeLineStroke([{ x: cx - 12, y: cy + 8 }, { x: cx - 10, y: cy + 40 }, { x: cx - 4, y: cy + 76 }]) },
          { type: "leg", x: cx + 28, y: cy + 62, stroke: makeLineStroke([{ x: cx + 18, y: cy + 8 }, { x: cx + 24, y: cy + 40 }, { x: cx + 32, y: cy + 76 }]) },
        ],
      };
    }
    if (name === "glider") {
      return {
        body: makeOvalStroke(cx, cy, 48, 24, 24),
        parts: [
          { type: "fin", x: cx - 66, y: cy - 12, stroke: makeLineStroke([{ x: cx - 12, y: cy - 4 }, { x: cx - 66, y: cy - 18 }, { x: cx - 96, y: cy - 8 }]) },
          { type: "fin", x: cx + 66, y: cy - 12, stroke: makeLineStroke([{ x: cx + 8, y: cy - 4 }, { x: cx + 66, y: cy - 18 }, { x: cx + 96, y: cy - 8 }]) },
          { type: "tail", x: cx + 74, y: cy + 8, stroke: makeLineStroke([{ x: cx + 46, y: cy + 2 }, { x: cx + 86, y: cy + 8 }]) },
        ],
      };
    }
    if (name === "climber") {
      return {
        body: makeOvalStroke(cx, cy, 46, 25, 24),
        parts: [
          { type: "arm", x: cx - 54, y: cy - 6, stroke: makeLineStroke([{ x: cx - 10, y: cy + 2 }, { x: cx - 34, y: cy - 18 }, { x: cx - 60, y: cy - 8 }]) },
          { type: "arm", x: cx + 56, y: cy - 8, stroke: makeLineStroke([{ x: cx + 12, y: cy + 2 }, { x: cx + 40, y: cy - 16 }, { x: cx + 68, y: cy - 2 }]) },
          { type: "leg", x: cx - 18, y: cy + 62, stroke: makeLineStroke([{ x: cx - 16, y: cy + 10 }, { x: cx - 18, y: cy + 44 }, { x: cx - 18, y: cy + 80 }]) },
          { type: "leg", x: cx + 20, y: cy + 62, stroke: makeLineStroke([{ x: cx + 14, y: cy + 10 }, { x: cx + 18, y: cy + 44 }, { x: cx + 22, y: cy + 80 }]) },
        ],
      };
    }
    return {
      body: makeOvalStroke(cx, cy, 52, 26, 24),
      parts: [
        { type: "leg", x: cx - 18, y: cy + 56, stroke: makeLineStroke([{ x: cx - 18, y: cy + 10 }, { x: cx - 18, y: cy + 56 }]) },
        { type: "leg", x: cx + 18, y: cy + 56, stroke: makeLineStroke([{ x: cx + 18, y: cy + 10 }, { x: cx + 18, y: cy + 56 }]) },
      ],
    };
  }

  function buildFixtureDrawing(name) {
    const blueprint = buildFixtureBlueprint(name);
    return [blueprint.body].concat(blueprint.parts.map(function (part) { return part.stroke; }));
  }

  function loadFixtureIntoCanvas(name, autoRun) {
    const blueprint = buildFixtureBlueprint(name);
    strokes = [blueprint.body];
    placedParts = [];
    for (const part of blueprint.parts) placedParts.push({ type: part.type, x: part.x, y: part.y, scale: typeof part.scale === "number" ? part.scale : 1 });
    currentStroke = null;
    rig = null;
    baseLocked = false;
    running = false;
    paused = false;
    selectedPartType = null;
    selectedElement = null;
    hideRunResult();
    analyzeDrawing();
    renderDrawing();
    syncDrawCursor();
    drawWorld();
    syncHud();
    syncPartSelection();
    syncElementInspector();
    setStatus(`Loaded fixture: ${name}.`, true);
    if (autoRun) startRun();
  }

  function runSingleFixtureTrial(strokeSet, trialLevel, meta) {
    const saved = snapshotGameState();
    let analyzed = false;
    let cleared = false;
    let progress = 0;
    let reason = "analyze-failed";
    let singleSupportPeak = 0;
    try {
      levelIndex = trialLevel;
      running = false;
      paused = false;
      rig = null;
      baseLocked = false;
      const blueprint = buildFixtureBlueprint(meta.fixture);
      strokes = [cloneStrokes([blueprint.body])[0]];
      placedParts = [];
      for (const part of blueprint.parts) placedParts.push({ type: part.type, x: part.x, y: part.y, scale: typeof part.scale === "number" ? part.scale : 1 });
      analyzeDrawing();
      analyzed = !!rig;
      if (analyzed && resetSim()) {
        running = true;
        paused = false;
        const dt = 1 / 60;
        const maxSteps = Math.ceil((currentLevel().timeLimit + 6) / dt);
        let steps = 0;
        while (running && steps < maxSteps) {
          updateSimulation(dt);
          singleSupportPeak = Math.max(singleSupportPeak, sim.singleSupportTime || 0);
          steps += 1;
        }
        progress = clamp(sim.x / Math.max(1, currentLevel().finishX), 0, 2);
        cleared = sim.x >= currentLevel().finishX;
        if (cleared) reason = "clear";
        else if (timer <= 0.01) reason = "timeout";
        else if (sim.y > worldHeight + 200) reason = "fall";
        else reason = "stuck";
      }
    } finally {
      restoreGameState(saved, false);
    }
    return {
      fixture: meta.fixture,
      level: trialLevel + 1,
      analyzed,
      cleared,
      progress,
      reason,
      singleSupportPeak,
    };
  }

  function evaluateFixtureExpectation(expectation, metrics) {
    const failures = [];
    if (expectation.minProgress != null && metrics.progress < expectation.minProgress) failures.push(`progress ${metrics.progress.toFixed(2)} < ${expectation.minProgress}`);
    if (expectation.maxProgress != null && metrics.progress > expectation.maxProgress) failures.push(`progress ${metrics.progress.toFixed(2)} > ${expectation.maxProgress}`);
    if (expectation.maxAbsAngleDeg != null && metrics.maxAbsAngleDeg > expectation.maxAbsAngleDeg) failures.push(`angle ${metrics.maxAbsAngleDeg.toFixed(1)} > ${expectation.maxAbsAngleDeg}`);
    if (expectation.minGroundedWheelRatio != null && metrics.avgGroundedWheels < expectation.minGroundedWheelRatio) failures.push(`grounded wheels ${metrics.avgGroundedWheels.toFixed(2)} < ${expectation.minGroundedWheelRatio}`);
    if (expectation.minFramesWithTwoWheels != null && metrics.framesWithTwoWheelsRatio < expectation.minFramesWithTwoWheels) failures.push(`two-wheel frames ${metrics.framesWithTwoWheelsRatio.toFixed(2)} < ${expectation.minFramesWithTwoWheels}`);
    if (expectation.minGroundedLegRatio != null && metrics.avgGroundedLegs < expectation.minGroundedLegRatio) failures.push(`grounded legs ${metrics.avgGroundedLegs.toFixed(2)} < ${expectation.minGroundedLegRatio}`);
    if (expectation.minFramesWithTwoLegs != null && metrics.framesWithTwoLegsRatio < expectation.minFramesWithTwoLegs) failures.push(`two-leg frames ${metrics.framesWithTwoLegsRatio.toFixed(2)} < ${expectation.minFramesWithTwoLegs}`);
    if (expectation.minGroundedSupportRatio != null && metrics.avgGroundedSupports < expectation.minGroundedSupportRatio) failures.push(`supports ${metrics.avgGroundedSupports.toFixed(2)} < ${expectation.minGroundedSupportRatio}`);
    if (expectation.minAvgSpeed != null && metrics.avgSpeed < expectation.minAvgSpeed) failures.push(`speed ${metrics.avgSpeed.toFixed(1)} < ${expectation.minAvgSpeed}`);
    if (expectation.maxAvgSpeed != null && metrics.avgSpeed > expectation.maxAvgSpeed) failures.push(`speed ${metrics.avgSpeed.toFixed(1)} > ${expectation.maxAvgSpeed}`);
    if (expectation.maxSingleSupportPeak != null && metrics.singleSupportPeak > expectation.maxSingleSupportPeak) failures.push(`single support ${metrics.singleSupportPeak.toFixed(2)} > ${expectation.maxSingleSupportPeak}`);
    return {
      ok: failures.length === 0,
      failures,
    };
  }

  function fixtureRequiresWarmupClear(fixtureId) {
    const expectation = fixtureExpectations[fixtureId];
    return !expectation || expectation.requiresWarmupClear !== false;
  }

  function runSingleFixtureAudit(fixtureId, trialLevel) {
    const saved = snapshotGameState();
    let metrics = null;
    try {
      levelIndex = trialLevel;
      running = false;
      paused = false;
      rig = null;
      baseLocked = false;
      const blueprint = buildFixtureBlueprint(fixtureId);
      strokes = [cloneStrokes([blueprint.body])[0]];
      placedParts = blueprint.parts.map(function (part) { return { type: part.type, x: part.x, y: part.y, scale: typeof part.scale === "number" ? part.scale : 1 }; });
      analyzeDrawing();
      if (!rig || !resetSim()) {
        return {
          fixture: fixtureId,
          level: trialLevel + 1,
          ok: false,
          failures: ["analysis failed"],
          metrics: null,
          expectation: fixtureExpectations[fixtureId] || null,
        };
      }
      running = true;
      paused = false;
      const dt = 1 / 60;
      const maxSteps = Math.ceil((currentLevel().timeLimit + 6) / dt);
      let steps = 0;
      let wheelGroundedSum = 0;
      let legGroundedSum = 0;
      let supportSum = 0;
      let framesWithTwoWheels = 0;
      let framesWithTwoLegs = 0;
      let speedSum = 0;
      let maxAbsAngle = 0;
      let singleSupportPeak = 0;
      while (running && steps < maxSteps) {
        updateSimulation(dt);
        const supportState = sampleCurrentSupportState();
        const groundedWheels = supportState.groundedByType.loop || 0;
        const groundedLegs = supportState.groundedByType.leg || 0;
        wheelGroundedSum += groundedWheels;
        legGroundedSum += groundedLegs;
        supportSum += supportState.totalSupports;
        if (groundedWheels >= 2) framesWithTwoWheels += 1;
        if (groundedLegs >= 2) framesWithTwoLegs += 1;
        speedSum += Math.max(0, sim.vx);
        maxAbsAngle = Math.max(maxAbsAngle, Math.abs(sim.angle) * 180 / Math.PI);
        singleSupportPeak = Math.max(singleSupportPeak, sim.singleSupportTime || 0);
        steps += 1;
      }
      metrics = {
        cleared: sim.x >= currentLevel().finishX,
        progress: clamp(sim.x / Math.max(1, currentLevel().finishX), 0, 2),
        avgGroundedWheels: wheelGroundedSum / Math.max(1, steps),
        avgGroundedLegs: legGroundedSum / Math.max(1, steps),
        avgGroundedSupports: supportSum / Math.max(1, steps),
        framesWithTwoWheelsRatio: framesWithTwoWheels / Math.max(1, steps),
        framesWithTwoLegsRatio: framesWithTwoLegs / Math.max(1, steps),
        avgSpeed: speedSum / Math.max(1, steps),
        maxAbsAngleDeg: maxAbsAngle,
        singleSupportPeak,
        steps,
      };
      const expectation = fixtureExpectations[fixtureId] || { minProgress: 1 };
      const evaluation = evaluateFixtureExpectation(expectation, metrics);
      return {
        fixture: fixtureId,
        level: trialLevel + 1,
        expectation,
        metrics,
        ok: evaluation.ok,
        failures: evaluation.failures,
      };
    } finally {
      restoreGameState(saved, false);
    }
  }

  function runFixtureExpectationSuite() {
    const fixtures = fixtureCatalog.map(function (fixture) { return fixture.id; });
    const audits = fixtures.map(function (fixtureId) {
      return runSingleFixtureAudit(fixtureId, 0);
    });
    const passed = audits.filter(function (audit) { return audit.ok; }).length;
    const payload = {
      at: new Date().toISOString(),
      passed,
      total: audits.length,
      ok: passed === audits.length,
      audits,
    };
    window.__sketchRigFixtureExpectations = payload;
    return payload;
  }

  const freehandRecognitionExpectations = {
    "wheel-cart": { loop: 2, mode: "cart" },
    "uneven-cart": { loop: 2, structure: 1, mode: "cart" },
    walker: { leg: 2, mode: "walker" },
    trike: { loop: 3, mode: "trike" },
    crawler: { leg: 3, mode: "crawler" },
    glider: { fin: 2, tail: 1, mode: "glider" },
    climber: { arm: 2, leg: 2, mode: "climber" },
  };

  function runFreehandRecognitionSuite() {
    const saved = snapshotGameState();
    const audits = [];
    const edgeCases = [];
    try {
      inSelfTest = true;
      for (const fixture of fixtureCatalog) {
        const expected = freehandRecognitionExpectations[fixture.id];
        levelIndex = 0;
        strokes = cloneStrokes(buildFixtureDrawing(fixture.id));
        placedParts = [];
        rig = null;
        baseLocked = false;
        analyzeDrawing();
        const detected = rig ? (rig.detectedAttachments || rig.attachments || []) : [];
        const counts = detected.reduce(function (acc, attachment) {
          acc[attachment.type] = (acc[attachment.type] || 0) + 1;
          return acc;
        }, {});
        const failures = [];
        Object.keys(expected).forEach(function (key) {
          if (key === "mode") return;
          if ((counts[key] || 0) < expected[key]) failures.push(`${key} ${counts[key] || 0} < ${expected[key]}`);
        });
        const mode = rig && rig.physicsProfile ? rig.physicsProfile.locomotionMode : "none";
        if (mode !== expected.mode) failures.push(`mode ${mode} !== ${expected.mode}`);
        const smallWheelOkay = fixture.id !== "trike" || detected.filter(function (attachment) { return attachment.type === "loop"; }).every(function (attachment) { return attachment.wheelRadius >= 5; });
        if (!smallWheelOkay) failures.push("small wheel collapsed during sampling");
        audits.push({
          fixture: fixture.id,
          counts,
          mode,
          detected: detected.map(function (attachment) {
            return {
              type: attachment.type,
              prototype: attachment.features && attachment.features.prototypeType,
              confidence: attachment.classification && attachment.classification.confidence,
              connected: attachment.classification && attachment.classification.connected,
              width: attachment.features && Number(attachment.features.relativeWidth.toFixed(2)),
              height: attachment.features && Number(attachment.features.relativeHeight.toFixed(2)),
              up: attachment.features && Number(attachment.features.upwardReach.toFixed(2)),
              down: attachment.features && Number(attachment.features.downwardReach.toFixed(2)),
              bend: attachment.features && Number(attachment.features.bend.toFixed(2)),
            };
          }),
          ok: failures.length === 0,
          failures,
        });
      }
      strokes = [makeOvalStroke(132, 158, 48, 25, 24), makeOvalStroke(320, 34, 16, 16, 16)];
      placedParts = [];
      rig = null;
      baseLocked = false;
      analyzeDrawing();
      const disconnectedWheel = rig && (rig.detectedAttachments || []).find(function (attachment) { return attachment.type === "loop"; });
      const disconnectedInactive = !!(disconnectedWheel && disconnectedWheel.classification && disconnectedWheel.classification.connected === false);
      const doesNotDrive = !!rig && !(rig.attachments || []).some(function (attachment) { return attachment.type === "loop"; });
      edgeCases.push({
        name: "disconnected-wheel",
        ok: disconnectedInactive && doesNotDrive,
        failures: [
          ...(disconnectedInactive ? [] : ["disconnected wheel was not marked inactive"]),
          ...(doesNotDrive ? [] : ["disconnected wheel affected the physics rig"]),
        ],
      });
    } finally {
      restoreGameState(saved, false);
      inSelfTest = false;
      syncElementInspector();
    }
    const passed = audits.filter(function (audit) { return audit.ok; }).length + edgeCases.filter(function (edgeCase) { return edgeCase.ok; }).length;
    const total = audits.length + edgeCases.length;
    const payload = { at: new Date().toISOString(), passed, total, ok: passed === total, audits, edgeCases };
    window.__sketchRigFreehandRecognition = payload;
    return payload;
  }

  function buildRegressionCases() {
    const fixtures = fixtureCatalog.map(function (fixture) { return fixture.id; });
    const cases = [];
    for (const fixture of fixtures) {
      const strokesForFixture = buildFixtureDrawing(fixture);
      for (let li = 0; li < levels.length; li += 1) {
        cases.push({ fixture, levelIndex: li, strokes: strokesForFixture });
      }
    }
    return cases;
  }

  function scoreRegressionResults(results) {
    let score = 0;
    for (const r of results) {
      const expectsClear = r.level !== 1 || fixtureRequiresWarmupClear(r.fixture);
      score += r.progress * 100;
      if (r.cleared && expectsClear) score += 180;
      if (!expectsClear) score -= r.progress * 60;
      if (r.reason === "fall") score -= 28;
      if (r.reason === "stuck") score -= 18;
      score -= Math.min(40, (r.singleSupportPeak || 0) * 18);
      if (r.level === 1 && expectsClear) {
        if (r.cleared) score += 260;
        else score -= 900;
      }
      if (r.fixture === "wheel-cart" || r.fixture === "trike") {
        if (r.cleared) score += 24;
      }
      if (r.fixture === "walker" || r.fixture === "crawler" || r.fixture === "climber") {
        if (r.cleared) score += 26;
      }
    }
    return score;
  }

  function runRegressionCases(cases) {
    const results = [];
    for (let i = 0; i < cases.length; i += 1) {
      const c = cases[i];
      results.push(runSingleFixtureTrial(c.strokes, c.levelIndex, { fixture: c.fixture }));
    }
    return results;
  }

  function tunePhysicsFromFixtures() {
    const saved = snapshotGameState();
    const base = physicsTuning || defaultPhysicsTuning();
    const cases = buildRegressionCases();
    const warmupCases = cases.filter(function (c) { return c.levelIndex === 0; });
    const candidates = [];
    for (const wheelDrive of [0.94, 1.06, 1.14]) {
      for (const wheelTraction of [0.92, 1, 1.1]) {
        for (const wheelCruise of [0.94, 1, 1.08]) {
          for (const legDrive of [0.96, 1.08, 1.18]) {
            for (const legStride of [0.94, 1, 1.1]) {
              for (const legPlant of [0.94, 1, 1.08]) {
                for (const legCruise of [0.94, 1, 1.08]) {
                  candidates.push({
                    ...base,
                    wheelDrive: clamp(base.wheelDrive * wheelDrive, 0.7, 1.4),
                    wheelTraction: clamp(base.wheelTraction * wheelTraction, 0.75, 1.5),
                    wheelCruise: clamp(base.wheelCruise * wheelCruise, 0.75, 1.4),
                    legDrive: clamp(base.legDrive * legDrive, 0.75, 1.4),
                    legStride: clamp(base.legStride * legStride, 0.75, 1.45),
                    legPlant: clamp(base.legPlant * legPlant, 0.8, 1.4),
                    legCruise: clamp(base.legCruise * legCruise, 0.75, 1.35),
                  });
                }
              }
            }
          }
        }
      }
    }
    let best = base;
    let bestScore = -Infinity;
    let bestWarmupClears = -1;
    try {
      inSelfTest = true;
      const warmupRanked = [];
      for (let i = 0; i < candidates.length; i += 1) {
        physicsTuning = candidates[i];
        const warmupResults = runRegressionCases(warmupCases);
        const warmupScore = scoreRegressionResults(warmupResults);
        const warmupClears = warmupResults.filter(function (r) { return r.level === 1 && fixtureRequiresWarmupClear(r.fixture) && r.cleared; }).length;
        warmupRanked.push({ tuning: candidates[i], warmupScore, warmupClears });
      }
      warmupRanked.sort(function (a, b) {
        if (b.warmupClears !== a.warmupClears) return b.warmupClears - a.warmupClears;
        return b.warmupScore - a.warmupScore;
      });
      const finalists = warmupRanked.slice(0, 12);
      for (let i = 0; i < finalists.length; i += 1) {
        physicsTuning = finalists[i].tuning;
        const results = runRegressionCases(cases);
        const score = scoreRegressionResults(results);
        const warmupClears = results.filter(function (r) { return r.level === 1 && fixtureRequiresWarmupClear(r.fixture) && r.cleared; }).length;
        if (
          warmupClears > bestWarmupClears
          || (warmupClears === bestWarmupClears && score > bestScore)
        ) {
          bestWarmupClears = warmupClears;
          bestScore = score;
          best = finalists[i].tuning;
        }
      }
    } finally {
      restoreGameState(saved, false);
      inSelfTest = false;
    }
    storePhysicsTuning({ ...best, score: bestScore, warmupClears: bestWarmupClears, tunedAt: new Date().toISOString() });
    window.__sketchRigPhysicsTuning = physicsTuning;
    return physicsTuning;
  }

  function runSingleRandomTrial(rand) {
    const saved = snapshotGameState();
    const trialLevel = Math.floor(rand() * levels.length);
    let analyzed = false;
    let cleared = false;
    let progress = 0;
    let reason = "analyze-failed";
    try {
      levelIndex = trialLevel;
      running = false;
      paused = false;
      rig = null;
      baseLocked = false;
      strokes = generateRandomDrawing(rand);
      analyzeDrawing();
      analyzed = !!rig;
      if (analyzed && resetSim()) {
        running = true;
        paused = false;
        const dt = 1 / 60;
        const maxSteps = Math.ceil((currentLevel().timeLimit + 6) / dt);
        let steps = 0;
        while (running && steps < maxSteps) {
          updateSimulation(dt);
          steps += 1;
        }
        progress = clamp(sim.x / Math.max(1, currentLevel().finishX), 0, 2);
        cleared = sim.x >= currentLevel().finishX;
        if (cleared) reason = "clear";
        else if (timer <= 0.01) reason = "timeout";
        else if (sim.y > worldHeight + 200) reason = "fall";
        else reason = "stuck";
      }
    } finally {
      restoreGameState(saved, false);
    }
    return { level: trialLevel + 1, analyzed, cleared, progress, reason };
  }

  function runRandomDrawingSelfTest(trials, seedText) {
    if (inSelfTest) return;
    const savedAtStart = snapshotGameState();
    const rand = createRng(seedText || "sketch-rig-self-test-v1");
    const results = [];
    let done = 0;
    inSelfTest = true;
    statusEl.textContent = `Running self-test: ${trials} random drawings...`;
    const step = function () {
      const budgetMs = 14;
      const begin = performance.now();
      while (done < trials && performance.now() - begin < budgetMs) {
        results.push(runSingleRandomTrial(rand));
        done += 1;
      }
      if (done < trials) {
        window.setTimeout(step, 0);
        return;
      }
      restoreGameState(savedAtStart, true);
      inSelfTest = false;
      const analyzed = results.filter((r) => r.analyzed).length;
      const cleared = results.filter((r) => r.cleared).length;
      const avgProgress = results.reduce((acc, r) => acc + r.progress, 0) / Math.max(1, results.length);
      const byReason = {};
      for (const r of results) byReason[r.reason] = (byReason[r.reason] || 0) + 1;
      window.__sketchRigSelfTest = {
        at: new Date().toISOString(),
        trials,
        analyzed,
        cleared,
        clearRate: analyzed > 0 ? cleared / analyzed : 0,
        avgProgress,
        byReason,
        samples: results.slice(0, 16),
      };
      setStatus(`Self-test done: ${cleared}/${analyzed} clears, avg progress ${(avgProgress * 100).toFixed(0)}%.`, true);
    };
    window.setTimeout(step, 0);
  }

  function runRandomDrawingSelfTestAsync(trials, seedText) {
    return new Promise(function (resolve) {
      if (inSelfTest) { resolve(null); return; }
      const savedAtStart = snapshotGameState();
      const rand = createRng(seedText || "sketch-rig-self-test-v1");
      const results = [];
      let done = 0;
      inSelfTest = true;
      statusEl.textContent = `Running self-test: ${trials} random drawings...`;
      const step = function () {
        const budgetMs = 14;
        const begin = performance.now();
        while (done < trials && performance.now() - begin < budgetMs) {
          results.push(runSingleRandomTrial(rand));
          done += 1;
        }
        if (done < trials) {
          window.setTimeout(step, 0);
          return;
        }
        restoreGameState(savedAtStart, true);
        inSelfTest = false;
        const analyzed = results.filter((r) => r.analyzed).length;
        const cleared = results.filter((r) => r.cleared).length;
        const avgProgress = results.reduce((acc, r) => acc + r.progress, 0) / Math.max(1, results.length);
        const byReason = {};
        for (const r of results) byReason[r.reason] = (byReason[r.reason] || 0) + 1;
        const payload = {
          at: new Date().toISOString(),
          trials,
          analyzed,
          cleared,
          clearRate: analyzed > 0 ? cleared / analyzed : 0,
          avgProgress,
          byReason,
          samples: results.slice(0, 16),
        };
        window.__sketchRigSelfTest = payload;
        setStatus(`Self-test done: ${cleared}/${analyzed} clears, avg progress ${(avgProgress * 100).toFixed(0)}%.`, true);
        resolve(payload);
      };
      window.setTimeout(step, 0);
    });
  }

  function runFixtureRegressionSuite() {
    if (inSelfTest) return;
    const savedAtStart = snapshotGameState();
    const fixtures = fixtureCatalog.map(function (fixture) { return fixture.id; });
    const cases = buildRegressionCases();
    const results = [];
    let done = 0;
    inSelfTest = true;
    statusEl.textContent = `Running regression suite: ${cases.length} fixture simulations...`;
    const step = function () {
      const budgetMs = 14;
      const begin = performance.now();
      while (done < cases.length && performance.now() - begin < budgetMs) {
        const c = cases[done];
        results.push(runSingleFixtureTrial(c.strokes, c.levelIndex, { fixture: c.fixture }));
        done += 1;
      }
      if (done < cases.length) {
        window.setTimeout(step, 0);
        return;
      }
      restoreGameState(savedAtStart, true);
      inSelfTest = false;
      const analyzed = results.filter((r) => r.analyzed).length;
      const cleared = results.filter((r) => r.cleared).length;
      const warmupResults = results.filter((r) => r.level === 1 && fixtureRequiresWarmupClear(r.fixture));
      const warmupClears = warmupResults.filter((r) => r.cleared).length;
      const byFixture = {};
      const byReason = {};
      for (const r of results) {
        byReason[r.reason] = (byReason[r.reason] || 0) + 1;
        byFixture[r.fixture] = byFixture[r.fixture] || { trials: 0, clears: 0, avgProgress: 0 };
        byFixture[r.fixture].trials += 1;
        if (r.cleared) byFixture[r.fixture].clears += 1;
        byFixture[r.fixture].avgProgress += r.progress;
      }
      for (const key of Object.keys(byFixture)) {
        byFixture[key].avgProgress /= Math.max(1, byFixture[key].trials);
      }
      window.__sketchRigRegression = {
        at: new Date().toISOString(),
        cases: cases.length,
        analyzed,
        cleared,
        clearRate: analyzed > 0 ? cleared / analyzed : 0,
        warmup: {
          cases: warmupResults.length,
          clears: warmupClears,
          allPassed: warmupClears === warmupResults.length,
        },
        tuning: physicsTuning,
        byFixture,
        byReason,
        results,
      };
      setStatus(`Regression suite done: warmup ${warmupClears}/${warmupResults.length}, overall ${cleared}/${analyzed}.`, true);
    };
    window.setTimeout(step, 0);
  }

  function runFixtureRegressionSuiteAsync() {
    return new Promise(function (resolve) {
      if (inSelfTest) { resolve(null); return; }
      const savedAtStart = snapshotGameState();
      const fixtures = fixtureCatalog.map(function (fixture) { return fixture.id; });
      const cases = buildRegressionCases();
      const results = [];
      let done = 0;
      inSelfTest = true;
      statusEl.textContent = `Running regression suite: ${cases.length} fixture simulations...`;
      const step = function () {
        const budgetMs = 14;
        const begin = performance.now();
        while (done < cases.length && performance.now() - begin < budgetMs) {
          const c = cases[done];
          results.push(runSingleFixtureTrial(c.strokes, c.levelIndex, { fixture: c.fixture }));
          done += 1;
        }
        if (done < cases.length) {
          window.setTimeout(step, 0);
          return;
        }
        restoreGameState(savedAtStart, true);
        inSelfTest = false;
        const analyzed = results.filter((r) => r.analyzed).length;
        const cleared = results.filter((r) => r.cleared).length;
        const warmupResults = results.filter((r) => r.level === 1 && fixtureRequiresWarmupClear(r.fixture));
        const warmupClears = warmupResults.filter((r) => r.cleared).length;
        const byFixture = {};
        const byReason = {};
        for (const r of results) {
          byReason[r.reason] = (byReason[r.reason] || 0) + 1;
          byFixture[r.fixture] = byFixture[r.fixture] || { trials: 0, clears: 0, avgProgress: 0 };
          byFixture[r.fixture].trials += 1;
          if (r.cleared) byFixture[r.fixture].clears += 1;
          byFixture[r.fixture].avgProgress += r.progress;
        }
        for (const key of Object.keys(byFixture)) {
          byFixture[key].avgProgress /= Math.max(1, byFixture[key].trials);
        }
        const payload = {
          at: new Date().toISOString(),
          cases: cases.length,
          analyzed,
          cleared,
          clearRate: analyzed > 0 ? cleared / analyzed : 0,
          warmup: {
          cases: warmupResults.length,
          clears: warmupClears,
          allPassed: warmupClears === warmupResults.length,
        },
          tuning: physicsTuning,
          byFixture,
          byReason,
          results,
        };
        window.__sketchRigRegression = payload;
        setStatus(`Regression suite done: warmup ${warmupClears}/${warmupResults.length}, overall ${cleared}/${analyzed}.`, true);
        resolve(payload);
      };
      window.setTimeout(step, 0);
    });
  }

  function summarizeFixtureHealth(regression) {
    const fixtures = fixtureCatalog.map(function (fixture) { return fixture.id; });
    const warmupFailures = fixtures.filter(function (fixtureId) {
      if (!fixtureRequiresWarmupClear(fixtureId)) return false;
      return !regression.results.some(function (r) { return r.fixture === fixtureId && r.level === 1 && r.cleared; });
    });
    const fullFailures = fixtures.filter(function (fixtureId) {
      return regression.results.some(function (r) { return r.fixture === fixtureId && !r.cleared; });
    });
    return { warmupFailures, fullFailures };
  }

  function runWarmupFixtureSuite() {
    const saved = snapshotGameState();
    const fixtures = fixtureCatalog.map(function (fixture) { return fixture.id; });
    const requiredFixtures = fixtures.filter(function (fixtureId) { return fixtureRequiresWarmupClear(fixtureId); });
    const results = [];
    try {
      inSelfTest = true;
      for (const fixture of fixtures) {
        results.push(runSingleFixtureTrial(buildFixtureDrawing(fixture), 0, { fixture }));
      }
    } finally {
      restoreGameState(saved, false);
      inSelfTest = false;
    }
    return {
      fixtures: requiredFixtures.length,
      clears: results.filter(function (r) { return fixtureRequiresWarmupClear(r.fixture) && r.cleared; }).length,
      allPassed: results.filter(function (r) { return fixtureRequiresWarmupClear(r.fixture); }).every(function (r) { return r.cleared; }),
      results,
    };
  }

  function runSketchRigQualitySuite(options) {
    const opts = options || {};
    const seedList = Array.isArray(opts.randomSeeds) && opts.randomSeeds.length
      ? opts.randomSeeds
      : ["rig-quality-a", "rig-quality-b", "rig-quality-c"];
    const randomTrials = clamp(Math.round(opts.randomTrials || 24), 6, 120);
    setStatus("Running full quality suite...", true);
    calibration = calibrateModelFast();
    const tuned = tunePhysicsFromFixtures();
    const warmup = runWarmupFixtureSuite();
    const fixtureExpectationsResult = runFixtureExpectationSuite();
    const freehandRecognition = runFreehandRecognitionSuite();
    return runFixtureRegressionSuiteAsync().then(function (regression) {
      const batches = [];
      let chain = Promise.resolve();
      seedList.forEach(function (seed) {
        chain = chain.then(function () {
          return runRandomDrawingSelfTestAsync(randomTrials, seed).then(function (batch) {
            batches.push({ seed, ...batch });
          });
        });
      });
      return chain.then(function () {
        const avgRandomClearRate = batches.reduce(function (acc, batch) { return acc + (batch.clearRate || 0); }, 0) / Math.max(1, batches.length);
        const avgRandomProgress = batches.reduce(function (acc, batch) { return acc + (batch.avgProgress || 0); }, 0) / Math.max(1, batches.length);
        const fixtureHealth = summarizeFixtureHealth(regression);
        const ok = !!(
          warmup.allPassed
          && fixtureExpectationsResult.ok
          && freehandRecognition.ok
          && regression.warmup.allPassed
          && fixtureHealth.warmupFailures.length === 0
        );
        const payload = {
          at: new Date().toISOString(),
          calibration,
          tuning: tuned,
          warmup,
          fixtureExpectations: fixtureExpectationsResult,
          freehandRecognition,
          regression,
          randomBatches: batches,
          avgRandomClearRate,
          avgRandomProgress,
          fixtureHealth,
          ok,
        };
        window.__sketchRigQualitySuite = payload;
        setStatus(
          `Quality suite ${ok ? "passed" : "found failures"}: warmup ${warmup.clears}/${warmup.fixtures}, random ${(avgRandomProgress * 100).toFixed(0)}% avg progress.`,
          true
        );
        return payload;
      });
    });
  }

  function addPlacedPart(type, point) {
    placedParts.push({ type, x: point.x, y: point.y, scale: 1 });
    rig = null;
    baseLocked = false;
    running = false;
    paused = false;
    hideRunResult();
    selectedElement = { kind: "part", index: placedParts.length - 1 };
    selectedPartType = null;
    syncPartSelection();
    syncElementInspector();
    renderDrawing();
    setStatus(`${partDisplayName(type)} added. It is selected; drag it or use the elements list to reposition it.`, true);
  }
  function setLevel(next) {
    const bounded = clamp(next, 0, levels.length - 1);
    if (bounded === levelIndex && next !== levelIndex) return;
    levelIndex = bounded;
    running = false;
    paused = false;
    timer = currentLevel().timeLimit;
    hideRunResult();
    if (rig) {
      rig.readiness = assessRigReadiness(rig);
      resetSim();
    }
    syncHud();
    syncTrackGoal();
    syncElementInspector();
    setStatus(`Level changed to: ${currentLevel().name}. ${currentLevel().hint}`);
  }
  function clearDrawing() {
    strokes = [makeDefaultBodyStroke()];
    placedParts = [];
    currentStroke = null;
    rig = null;
    baseLocked = false;
    running = false;
    paused = false;
    selectedPartType = null;
    selectedElement = null;
    hideRunResult();
    syncPartSelection();
    syncHud();
    syncElementInspector();
    renderDrawing();
    syncDrawCursor();
    setStatus("Body reset. Draw connectors or add parts.", true);
  }
  function beginStroke(e) {
    e.preventDefault();
    const p = pointFromEvent(e);
    if (selectedPartType) {
      addPlacedPart(selectedPartType, p);
      return;
    }
    const hitPart = hitTestPlacedPart(p);
    if (hitPart) {
      selectedElement = { kind: "part", index: hitPart.index };
      syncElementInspector();
      if (hitPart.mode === "resize") {
        resizingPartIndex = hitPart.index;
        resizePartStart = {
          scale: placedPartScale(placedParts[hitPart.index]),
          distance: Math.max(1, Math.hypot(p.x - placedParts[hitPart.index].x, p.y - placedParts[hitPart.index].y)),
        };
        setStatus(`Resizing ${placedParts[hitPart.index].type}.`);
      } else {
        draggingPartIndex = hitPart.index;
        dragPartOffset = { x: p.x - placedParts[hitPart.index].x, y: p.y - placedParts[hitPart.index].y };
        setStatus(`Dragging ${placedParts[hitPart.index].type}.`);
      }
      syncDrawCursor(p);
      return;
    }
    if (!strokes.length) {
      strokes = [makeDefaultBodyStroke()];
    }
    if (strokes.length === 1 && !baseLocked) {
      setStatus("Draw a connector stroke from the body toward a part or another connector.");
    } else {
      setStatus("Connector mode: draw links between body and parts.");
    }
    currentStroke = [p];
    strokes.push(currentStroke);
    renderDrawing();
  }
  function moveStroke(e) {
    e.preventDefault();
    const p = pointFromEvent(e);
    if (resizingPartIndex >= 0) {
      const part = placedParts[resizingPartIndex];
      const dist = Math.max(1, Math.hypot(p.x - part.x, p.y - part.y));
      part.scale = clamp((resizePartStart.scale * dist) / Math.max(1, resizePartStart.distance), 0.65, 1.8);
      rig = null;
      hideRunResult();
      renderDrawing();
      syncDrawCursor(p);
      return;
    }
    if (draggingPartIndex >= 0) {
      placedParts[draggingPartIndex].x = clamp(p.x - dragPartOffset.x, 12, drawWidth - 12);
      placedParts[draggingPartIndex].y = clamp(p.y - dragPartOffset.y, 12, drawHeight - 12);
      rig = null;
      hideRunResult();
      renderDrawing();
      syncDrawCursor(p);
      return;
    }
    syncDrawCursor(p);
    if (!currentStroke) return;
    const last = currentStroke[currentStroke.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 1.1) { currentStroke.push(p); renderDrawing(); }
  }
  function endStroke() {
    if (resizingPartIndex >= 0) {
      resizingPartIndex = -1;
      resizePartStart = null;
      renderDrawing();
      syncDrawCursor();
      return;
    }
    if (draggingPartIndex >= 0) {
      draggingPartIndex = -1;
      renderDrawing();
      syncDrawCursor();
      return;
    }
    if (currentStroke && currentStroke.length > 1) {
      let len = 0;
      for (let i = 1; i < currentStroke.length; i += 1) len += Math.hypot(currentStroke[i].x - currentStroke[i - 1].x, currentStroke[i].y - currentStroke[i - 1].y);
      if (len < 8) {
        strokes.pop();
      } else {
        rig = null;
        baseLocked = false;
        hideRunResult();
        selectedElement = { kind: "stroke", index: strokes.length - 1 };
      }
    }
    currentStroke = null;
    syncElementInspector();
    renderDrawing();
    syncDrawCursor();
  }

  drawCanvas.addEventListener("mousedown", beginStroke);
  drawCanvas.addEventListener("mousemove", moveStroke);
  drawCanvas.addEventListener("mouseleave", function () {
    if (draggingPartIndex < 0 && resizingPartIndex < 0) syncDrawCursor();
  });
  window.addEventListener("mouseup", endStroke);
  drawCanvas.addEventListener("touchstart", beginStroke, { passive: false });
  drawCanvas.addEventListener("touchmove", moveStroke, { passive: false });
  drawCanvas.addEventListener("touchend", endStroke);
  drawCanvas.addEventListener("touchcancel", endStroke);
  drawCanvas.addEventListener("keydown", function (event) {
    const selected = selectedElementRecord();
    if (event.key === "Escape") {
      event.preventDefault();
      selectedPartType = null;
      selectedElement = null;
      syncPartSelection();
      syncElementInspector();
      renderDrawing();
      setStatus("Placement cancelled. Select an element or choose a new part.");
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && selected && selected.kind !== "chassis") {
      event.preventDefault();
      removeSelectedElement();
      return;
    }
    if (!selected || selected.kind !== "part" || !placedParts[selected.index]) return;
    const part = placedParts[selected.index];
    const step = event.shiftKey ? 12 : 4;
    if (event.key === "ArrowLeft") part.x = clamp(part.x - step, 12, drawWidth - 12);
    else if (event.key === "ArrowRight") part.x = clamp(part.x + step, 12, drawWidth - 12);
    else if (event.key === "ArrowUp") part.y = clamp(part.y - step, 12, drawHeight - 12);
    else if (event.key === "ArrowDown") part.y = clamp(part.y + step, 12, drawHeight - 12);
    else if (event.key === "[") part.scale = clamp(placedPartScale(part) - 0.08, 0.65, 1.8);
    else if (event.key === "]") part.scale = clamp(placedPartScale(part) + 0.08, 0.65, 1.8);
    else return;
    event.preventDefault();
    rig = null;
    baseLocked = false;
    hideRunResult();
    renderDrawing();
    syncElementInspector();
    setStatus(`${partDisplayName(part.type)} adjusted. Analyze again to update the rig model.`);
  });
  partPaletteEl.querySelectorAll(".src-part-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      selectPartType(chip.dataset.partType);
    });
    chip.addEventListener("dragstart", function (event) {
      event.dataTransfer.setData("text/src-part-type", chip.dataset.partType);
      event.dataTransfer.effectAllowed = "copy";
    });
  });
  drawCanvas.addEventListener("dragover", function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });
  drawCanvas.addEventListener("drop", function (event) {
    event.preventDefault();
    if (!strokes.length) {
      setStatus("Draw the body first, then drop parts onto it.", true);
      return;
    }
    const type = event.dataTransfer.getData("text/src-part-type");
    if (!type) return;
    const point = pointFromEvent(event);
    addPlacedPart(type, point);
  });

  root.querySelectorAll("[data-src-fixture]").forEach(function (button) {
    button.addEventListener("click", function () {
      loadFixtureIntoCanvas(button.dataset.srcFixture, button.dataset.srcRun === "true");
      selectedPartType = null;
      syncPartSelection();
    });
  });
  root.querySelector("#src-build-own").addEventListener("click", function () {
    clearDrawing();
    selectedPartType = "wheel";
    syncPartSelection();
    setStatus("Starter chassis ready. Place one wheel below the body, choose Wheel again for a second support, then Analyze and Run.", true);
  });

  root.querySelector("#src-prev").addEventListener("click", function () { setLevel(levelIndex - 1); });
  root.querySelector("#src-next").addEventListener("click", function () { setLevel(levelIndex + 1); });
  root.querySelector("#src-clear").addEventListener("click", clearDrawing);
  root.querySelector("#src-undo").addEventListener("click", function () {
    if (placedParts.length) {
      placedParts.pop();
    } else if (strokes.length > 1) {
      strokes.pop();
    } else {
      return;
    }
    rig = null;
    if (strokes.length <= 1) baseLocked = false;
    running = false;
    paused = false;
    selectedElement = null;
    hideRunResult();
    syncHud();
    syncElementInspector();
    renderDrawing();
    setStatus("Last edit removed.");
  });
  root.querySelector("#src-analyze").addEventListener("click", analyzeDrawing);
  root.querySelector("#src-run").addEventListener("click", function () {
    if (running) {
      paused = !paused;
      syncRunControls();
      setStatus(paused ? "Simulation paused. Use Resume test to continue." : "Simulation resumed.");
      return;
    }
    startRun();
  });
  root.querySelector("#src-retry").addEventListener("click", function () {
    if (!resetSim()) return;
    running = true;
    paused = false;
    hideRunResult();
    syncRunControls();
    setStatus("Retry started. Watch the highlighted support and course feedback.");
  });
  deleteSelectedEl.addEventListener("click", removeSelectedElement);
  duplicateSelectedEl.addEventListener("click", duplicateSelectedPart);
  root.querySelector("#src-result-retry").addEventListener("click", function () {
    if (!resetSim()) return;
    running = true;
    paused = false;
    hideRunResult();
    syncRunControls();
    setStatus("New test started.");
  });
  root.querySelector("#src-result-next").addEventListener("click", function () {
    if (levelIndex < levels.length - 1) setLevel(levelIndex + 1);
    else hideRunResult();
  });
  root.querySelector("#src-debug-toggle").addEventListener("click", function () {
    debugOpen = !debugOpen;
    syncDebugPanel();
    setStatus(debugOpen ? "Debug fixtures panel opened." : "Debug fixtures panel hidden.");
  });
  root.querySelector("#src-load-fixture").addEventListener("click", function () {
    loadFixtureIntoCanvas(fixtureSelectEl.value, false);
  });
  root.querySelector("#src-run-fixture").addEventListener("click", function () {
    loadFixtureIntoCanvas(fixtureSelectEl.value, true);
  });
  root.querySelector("#src-run-regression").addEventListener("click", function () {
    runFixtureRegressionSuite();
  });
  root.querySelector("#src-tune-physics").addEventListener("click", function () {
    setStatus("Running calibration and physics tuning...", true);
    window.setTimeout(function () {
      calibration = calibrateModelFast();
      const tuned = tunePhysicsFromFixtures();
      setStatus(
        `Tuning complete: ${calibration.trialShapes} calibration shapes, score ${Math.round(tuned.score || 0)}.`,
        true
      );
    }, 20);
  });

  function tick(ts) {
    const dt = Math.min(0.1, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;
    if (messageFlash > 0) messageFlash = Math.max(0, messageFlash - dt);
    // The browser can render at 30, 60, or 120Hz. Advance the solver in a
    // fixed cadence so traction, gait timing, and collision response stay
    // consistent instead of changing with the display refresh rate.
    frameAccumulator = Math.min(0.1, frameAccumulator + dt);
    let physicsSteps = 0;
    const fixedStep = 1 / 60;
    while (frameAccumulator >= fixedStep && physicsSteps < 5) {
      updateSimulation(fixedStep);
      frameAccumulator -= fixedStep;
      physicsSteps += 1;
    }
    renderDrawing();
    drawWorld();
    syncHud();
    rafId = window.requestAnimationFrame(tick);
  }

  strokes = [makeDefaultBodyStroke()];
  calibration = loadCachedCalibration() || { driveGain: 1.14, gripGain: 0.54, shapeGain: 0.56, spinGain: 0.82, dampingGain: 0.43, trialShapes: 0, coarseModels: 0, refinedModels: 0, score: 0 };
  physicsTuning = loadCachedPhysicsTuning() || defaultPhysicsTuning();
  syncDebugPanel();
  syncPartSelection();
  syncTrackGoal();
  renderDrawing();
  syncDrawCursor();
  loadArt();
  drawWorld();
  syncHud();
  syncElementInspector();
  syncRunControls();
  setStatus("Choose Starter Cart for a first run, or select a part and tap the blueprint to build your own.", true);
  window.runSketchRigSelfTest = function (trials, seedText) {
    runRandomDrawingSelfTest(clamp(Math.round(trials || 24), 6, 120), seedText || "sketch-rig-manual-self-test");
  };
  window.runSketchRigRegressionSuite = function () {
    runFixtureRegressionSuite();
  };
  window.runSketchRigPhysicsTune = function () {
    calibration = calibrateModelFast();
    return tunePhysicsFromFixtures();
  };
  window.runSketchRigFixtureExpectationSuite = function () {
    return runFixtureExpectationSuite();
  };
  window.runSketchRigFreehandRecognitionSuite = function () {
    return runFreehandRecognitionSuite();
  };
  window.runSketchRigQualitySuite = function (options) {
    return runSketchRigQualitySuite(options);
  };
  window.setSketchRigPlanckBackend = function (enabled) {
    window.__usePlanckRigBackend = !!enabled;
    setStatus(`Planck wheeled backend ${window.__usePlanckRigBackend ? "enabled" : "disabled"}.`, true);
    return window.__usePlanckRigBackend;
  };
  rafId = window.requestAnimationFrame(tick);

  return function cleanup() {
    if (rafId) window.cancelAnimationFrame(rafId);
    delete window.runSketchRigSelfTest;
    delete window.runSketchRigRegressionSuite;
    delete window.runSketchRigPhysicsTune;
    delete window.runSketchRigFixtureExpectationSuite;
    delete window.runSketchRigFreehandRecognitionSuite;
    delete window.runSketchRigQualitySuite;
    delete window.setSketchRigPlanckBackend;
    drawCanvas.removeEventListener("mousedown", beginStroke);
    drawCanvas.removeEventListener("mousemove", moveStroke);
    window.removeEventListener("mouseup", endStroke);
    drawCanvas.removeEventListener("touchstart", beginStroke);
    drawCanvas.removeEventListener("touchmove", moveStroke);
    drawCanvas.removeEventListener("touchend", endStroke);
    drawCanvas.removeEventListener("touchcancel", endStroke);
  };
}

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(sketchRigChallengeGame);
