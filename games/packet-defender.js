const packetDefenderGame = {
  id: "packet-defender",
  title: "Packet Defender",
  description: "Place towers to stop hostile packets before they reach core systems.",
  difficulty: "Planning and timing",
  setup: setupPacketDefender,
};

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

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(packetDefenderGame);
