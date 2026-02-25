(function () {
  const gameListEl = document.getElementById("game-list");
  const gameMetaEl = document.getElementById("game-meta");
  const gameMountEl = document.getElementById("game-mount");

  if (!gameListEl || !gameMetaEl || !gameMountEl) {
    return;
  }

  const gameRegistry = [
    {
      id: "target-rush",
      title: "Target Rush",
      description: "Click moving targets before the timer expires.",
      difficulty: "Speed and precision",
      setup: setupTargetRush,
    },
    {
      id: "cipher-memory",
      title: "Cipher Memory",
      description: "Memorize and replay an increasing symbol sequence.",
      difficulty: "Memory and focus",
      setup: setupCipherMemory,
    },
    {
      id: "packet-defender",
      title: "Packet Defender",
      description: "Place towers to stop hostile packets before they reach core systems.",
      difficulty: "Planning and timing",
      setup: setupPacketDefender,
    },
  ];

  let activeGameCleanup = null;
  let activeGameId = null;

  function renderGameList() {
    gameListEl.innerHTML = "";
    for (const game of gameRegistry) {
      const button = document.createElement("button");
      button.className = "game-option";
      button.type = "button";
      button.dataset.gameId = game.id;
      button.innerHTML = `<span class="title">${game.title}</span><span class="desc">${game.description}</span>`;
      button.addEventListener("click", function () {
        mountGame(game.id);
      });
      gameListEl.appendChild(button);
    }
  }

  function setActiveListItem(gameId) {
    const buttons = gameListEl.querySelectorAll(".game-option");
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.gameId === gameId);
    });
  }

  function mountGame(gameId) {
    const game = gameRegistry.find((g) => g.id === gameId);
    if (!game) {
      return;
    }
    if (activeGameCleanup) {
      activeGameCleanup();
      activeGameCleanup = null;
    }
    activeGameId = gameId;
    setActiveListItem(gameId);
    gameMetaEl.className = "game-meta";
    gameMetaEl.innerHTML = `<h3>${game.title}</h3><p>${game.description}</p><p><strong>Focus:</strong> ${game.difficulty}</p>`;
    gameMountEl.innerHTML = "";
    activeGameCleanup = game.setup(gameMountEl);
  }

  function setupTargetRush(container) {
    const root = document.createElement("div");
    root.className = "lab-game";
    root.innerHTML = `
      <div class="hud">
        <div class="hud-item"><strong>Time</strong><div id="tr-time">30</div></div>
        <div class="hud-item"><strong>Score</strong><div id="tr-score">0</div></div>
        <div class="hud-item"><strong>Best</strong><div id="tr-best">0</div></div>
      </div>
      <div class="action-row">
        <button type="button" id="tr-start" class="btn primary">Start Round</button>
        <button type="button" id="tr-reset" class="btn ghost">Reset Best</button>
      </div>
      <div class="board" id="tr-board"></div>
      <p class="status" id="tr-status">Press Start Round to begin.</p>
    `;
    container.appendChild(root);

    const timeEl = root.querySelector("#tr-time");
    const scoreEl = root.querySelector("#tr-score");
    const bestEl = root.querySelector("#tr-best");
    const startBtn = root.querySelector("#tr-start");
    const resetBtn = root.querySelector("#tr-reset");
    const board = root.querySelector("#tr-board");
    const status = root.querySelector("#tr-status");

    let timerId = null;
    let spawnTimeoutId = null;
    let seconds = 30;
    let score = 0;
    let running = false;
    let best = Number(window.localStorage.getItem("targetRushBest") || "0");

    bestEl.textContent = String(best);

    function clearBoard() {
      board.innerHTML = "";
    }

    function stopRound(message) {
      running = false;
      if (timerId) {
        window.clearInterval(timerId);
      }
      if (spawnTimeoutId) {
        window.clearTimeout(spawnTimeoutId);
      }
      timerId = null;
      spawnTimeoutId = null;
      clearBoard();
      startBtn.disabled = false;
      status.textContent = message;
      if (score > best) {
        best = score;
        window.localStorage.setItem("targetRushBest", String(best));
        bestEl.textContent = String(best);
      }
    }

    function spawnTarget() {
      if (!running) {
        return;
      }
      clearBoard();
      const target = document.createElement("button");
      target.className = "target";
      target.type = "button";
      const maxX = Math.max(board.clientWidth - 40, 0);
      const maxY = Math.max(board.clientHeight - 40, 0);
      target.style.left = `${Math.random() * maxX}px`;
      target.style.top = `${Math.random() * maxY}px`;
      target.addEventListener("click", function () {
        score += 1;
        scoreEl.textContent = String(score);
        status.textContent = "Nice hit. Keep going.";
        spawnTarget();
      });
      board.appendChild(target);
      spawnTimeoutId = window.setTimeout(function () {
        if (running) {
          status.textContent = "Too slow. New target.";
          spawnTarget();
        }
      }, 850);
    }

    startBtn.addEventListener("click", function () {
      if (running) {
        return;
      }
      running = true;
      startBtn.disabled = true;
      seconds = 30;
      score = 0;
      timeEl.textContent = String(seconds);
      scoreEl.textContent = String(score);
      status.textContent = "Round started.";
      spawnTarget();
      timerId = window.setInterval(function () {
        seconds -= 1;
        timeEl.textContent = String(seconds);
        if (seconds <= 0) {
          stopRound(`Round finished. Final score: ${score}.`);
        }
      }, 1000);
    });

    resetBtn.addEventListener("click", function () {
      best = 0;
      window.localStorage.setItem("targetRushBest", "0");
      bestEl.textContent = "0";
      status.textContent = "Best score reset.";
    });

    return function cleanup() {
      if (timerId) {
        window.clearInterval(timerId);
      }
      if (spawnTimeoutId) {
        window.clearTimeout(spawnTimeoutId);
      }
    };
  }

  function setupCipherMemory(container) {
    const symbols = ["A", "B", "C", "D"];
    const root = document.createElement("div");
    root.className = "lab-game";
    root.innerHTML = `
      <div class="hud">
        <div class="hud-item"><strong>Level</strong><div id="cm-level">1</div></div>
        <div class="hud-item"><strong>Best</strong><div id="cm-best">1</div></div>
      </div>
      <div class="action-row">
        <button type="button" id="cm-start" class="btn primary">Start Sequence</button>
      </div>
      <p class="status" id="cm-status">Watch the sequence, then repeat it.</p>
      <div class="choice-grid" id="cm-grid"></div>
    `;
    container.appendChild(root);

    const levelEl = root.querySelector("#cm-level");
    const bestEl = root.querySelector("#cm-best");
    const startBtn = root.querySelector("#cm-start");
    const status = root.querySelector("#cm-status");
    const grid = root.querySelector("#cm-grid");

    let sequence = [];
    let userIndex = 0;
    let level = 1;
    let locked = true;
    let playbackTimers = [];
    let best = Number(window.localStorage.getItem("cipherMemoryBest") || "1");
    bestEl.textContent = String(best);

    function clearTimers() {
      playbackTimers.forEach((id) => window.clearTimeout(id));
      playbackTimers = [];
    }

    function setButtonFlash(symbol) {
      const btn = grid.querySelector(`[data-symbol="${symbol}"]`);
      if (!btn) {
        return;
      }
      btn.classList.add("active");
      const t = window.setTimeout(function () {
        btn.classList.remove("active");
      }, 260);
      playbackTimers.push(t);
    }

    function appendRandomSymbol() {
      const value = symbols[Math.floor(Math.random() * symbols.length)];
      sequence.push(value);
    }

    function playbackSequence() {
      locked = true;
      status.textContent = "Memorize the sequence.";
      clearTimers();
      sequence.forEach((sym, idx) => {
        const t = window.setTimeout(function () {
          setButtonFlash(sym);
          if (idx === sequence.length - 1) {
            locked = false;
            userIndex = 0;
            status.textContent = "Now repeat it.";
          }
        }, 500 * (idx + 1));
        playbackTimers.push(t);
      });
    }

    function failRound() {
      locked = true;
      status.textContent = `Wrong symbol. You reached level ${level}. Restart to try again.`;
      if (level > best) {
        best = level;
        window.localStorage.setItem("cipherMemoryBest", String(best));
        bestEl.textContent = String(best);
      }
      level = 1;
      levelEl.textContent = "1";
      sequence = [];
      startBtn.disabled = false;
    }

    function succeedStep() {
      userIndex += 1;
      if (userIndex < sequence.length) {
        return;
      }
      level += 1;
      levelEl.textContent = String(level);
      appendRandomSymbol();
      const t = window.setTimeout(function () {
        playbackSequence();
      }, 700);
      playbackTimers.push(t);
    }

    function onSymbolClick(symbol) {
      if (locked) {
        return;
      }
      setButtonFlash(symbol);
      if (sequence[userIndex] !== symbol) {
        failRound();
        return;
      }
      succeedStep();
    }

    symbols.forEach((symbol) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.symbol = symbol;
      btn.textContent = symbol;
      btn.addEventListener("click", function () {
        onSymbolClick(symbol);
      });
      grid.appendChild(btn);
    });

    startBtn.addEventListener("click", function () {
      clearTimers();
      level = 1;
      levelEl.textContent = "1";
      sequence = [];
      appendRandomSymbol();
      appendRandomSymbol();
      startBtn.disabled = true;
      playbackSequence();
    });

    return function cleanup() {
      clearTimers();
    };
  }

  function setupPacketDefender(container) {
    const lanes = 3;
    const cols = 10;
    const startMoney = 18;
    const towerCost = 5;
    const towerDamage = 1;
    const startHealth = 8;
    const maxWaves = 8;

    const root = document.createElement("div");
    root.className = "lab-game";
    root.innerHTML = `
      <div class="hud">
        <div class="hud-item"><strong>Core</strong><div id="pd-health">${startHealth}</div></div>
        <div class="hud-item"><strong>Budget</strong><div id="pd-money">${startMoney}</div></div>
        <div class="hud-item"><strong>Wave</strong><div id="pd-wave">0 / ${maxWaves}</div></div>
        <div class="hud-item"><strong>Kills</strong><div id="pd-kills">0</div></div>
      </div>
      <div class="action-row">
        <button type="button" id="pd-start" class="btn primary">Start Defense</button>
        <button type="button" id="pd-reset" class="btn ghost">Reset Run</button>
      </div>
      <p class="status" id="pd-status">Place towers by clicking cells in columns 1 to 8. Towers cost 5.</p>
      <div class="td-grid-wrap">
        <div class="td-legend">
          <span><i class="legend tower"></i>Tower</span>
          <span><i class="legend enemy"></i>Hostile Packet</span>
          <span><i class="legend core"></i>Core</span>
        </div>
        <div class="td-grid" id="pd-grid"></div>
      </div>
    `;
    container.appendChild(root);

    const healthEl = root.querySelector("#pd-health");
    const moneyEl = root.querySelector("#pd-money");
    const waveEl = root.querySelector("#pd-wave");
    const killsEl = root.querySelector("#pd-kills");
    const startBtn = root.querySelector("#pd-start");
    const resetBtn = root.querySelector("#pd-reset");
    const status = root.querySelector("#pd-status");
    const gridEl = root.querySelector("#pd-grid");

    let money = startMoney;
    let health = startHealth;
    let wave = 0;
    let kills = 0;
    let running = false;
    let timerId = null;
    let idCounter = 0;
    const towers = new Set();
    let enemies = [];

    function cellKey(r, c) {
      return `${r}:${c}`;
    }

    function parseCellKey(key) {
      const parts = key.split(":");
      return { row: Number(parts[0]), col: Number(parts[1]) };
    }

    function renderGrid() {
      gridEl.innerHTML = "";
      for (let r = 0; r < lanes; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "td-cell";
          cell.dataset.row = String(r);
          cell.dataset.col = String(c);
          cell.disabled = running;
          if (c === cols - 1) {
            cell.classList.add("core");
            cell.textContent = "C";
          }
          const key = cellKey(r, c);
          if (towers.has(key)) {
            cell.classList.add("tower");
            cell.textContent = "T";
          }
          const enemy = enemies.find((e) => e.row === r && e.col === c);
          if (enemy) {
            cell.classList.add("enemy");
            cell.textContent = "!";
          }
          cell.addEventListener("click", function () {
            if (running) {
              return;
            }
            if (c <= 0 || c >= cols - 1) {
              status.textContent = "You can place towers only in columns 1 to 8.";
              return;
            }
            if (towers.has(key)) {
              towers.delete(key);
              money += towerCost - 1;
              status.textContent = "Tower removed. Partial refund applied.";
            } else {
              if (money < towerCost) {
                status.textContent = "Not enough budget to place a tower.";
                return;
              }
              towers.add(key);
              money -= towerCost;
              status.textContent = "Tower placed.";
            }
            syncHud();
            renderGrid();
          });
          gridEl.appendChild(cell);
        }
      }
    }

    function syncHud() {
      healthEl.textContent = String(health);
      moneyEl.textContent = String(money);
      waveEl.textContent = `${wave} / ${maxWaves}`;
      killsEl.textContent = String(kills);
    }

    function spawnWave() {
      wave += 1;
      const count = 2 + wave;
      for (let i = 0; i < count; i += 1) {
        enemies.push({
          id: idCounter++,
          row: Math.floor(Math.random() * lanes),
          col: 0,
          hp: 1 + Math.floor(wave / 3),
        });
      }
    }

    function towersAttack() {
      towers.forEach((key) => {
        const pos = parseCellKey(key);
        const targets = enemies
          .filter((e) => e.row === pos.row && e.col >= pos.col)
          .sort((a, b) => a.col - b.col);
        if (!targets.length) {
          return;
        }
        targets[0].hp -= towerDamage;
      });
      const before = enemies.length;
      enemies = enemies.filter((e) => e.hp > 0);
      const removed = before - enemies.length;
      if (removed > 0) {
        kills += removed;
        money += removed;
      }
    }

    function moveEnemies() {
      enemies.forEach((e) => {
        e.col += 1;
      });
      let breaches = 0;
      enemies = enemies.filter((e) => {
        if (e.col >= cols - 1) {
          breaches += 1;
          return false;
        }
        return true;
      });
      if (breaches > 0) {
        health -= breaches;
      }
    }

    function stopGame(message) {
      running = false;
      if (timerId) {
        window.clearInterval(timerId);
      }
      timerId = null;
      startBtn.disabled = false;
      status.textContent = message;
      renderGrid();
    }

    function tick() {
      if (health <= 0) {
        stopGame(`Core breached. Defense failed at wave ${wave}.`);
        return;
      }
      if (wave >= maxWaves && enemies.length === 0) {
        stopGame(`Defense successful. You cleared all ${maxWaves} waves.`);
        return;
      }
      if (enemies.length === 0) {
        spawnWave();
        status.textContent = `Wave ${wave} deployed.`;
      } else {
        status.textContent = `Wave ${wave} in progress.`;
      }
      towersAttack();
      moveEnemies();
      syncHud();
      renderGrid();
      if (health <= 0) {
        stopGame(`Core breached. Defense failed at wave ${wave}.`);
      }
    }

    function resetState() {
      money = startMoney;
      health = startHealth;
      wave = 0;
      kills = 0;
      idCounter = 0;
      enemies = [];
      towers.clear();
      running = false;
      if (timerId) {
        window.clearInterval(timerId);
      }
      timerId = null;
      startBtn.disabled = false;
      status.textContent = "Place towers by clicking cells in columns 1 to 8. Towers cost 5.";
      syncHud();
      renderGrid();
    }

    startBtn.addEventListener("click", function () {
      if (running) {
        return;
      }
      running = true;
      startBtn.disabled = true;
      status.textContent = "Defense started.";
      renderGrid();
      timerId = window.setInterval(tick, 900);
      tick();
    });

    resetBtn.addEventListener("click", function () {
      resetState();
    });

    resetState();

    return function cleanup() {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }

  renderGameList();
  mountGame(activeGameId || gameRegistry[0].id);
})();
