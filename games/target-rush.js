const targetRushGame = {
  id: "target-rush",
  title: "Target Rush",
  description: "Click moving targets before the timer expires.",
  difficulty: "Speed and precision",
  setup: setupTargetRush,
};

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

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(targetRushGame);
