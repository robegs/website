const cipherMemoryGame = {
  id: "cipher-memory",
  title: "Cipher Memory",
  description: "Memorize and replay an increasing symbol sequence.",
  difficulty: "Memory and focus",
  setup: setupCipherMemory,
};

function setupCipherMemory(container) {
  const symbols = ["A", "B", "C", "D"];
  const goalLevel = 10;
  const root = document.createElement("div");
  root.className = "lab-game";
  root.innerHTML = `
    <div class="hud">
      <div class="hud-item"><strong>Level</strong><div id="cm-level">1</div></div>
      <div class="hud-item"><strong>Goal</strong><div id="cm-goal">${goalLevel}</div></div>
      <div class="hud-item"><strong>Best</strong><div id="cm-best">1</div></div>
    </div>
    <div class="action-row">
      <button type="button" id="cm-start" class="btn primary">Start Sequence</button>
    </div>
    <p class="status" id="cm-status">Watch the sequence, then repeat it.</p>
    <div class="cm-grid-wrap">
      <div class="choice-grid" id="cm-grid"></div>
      <div class="lab-finish-overlay" id="cm-finish" aria-live="polite">
        <div class="lab-finish-card">
          <p class="lab-finish-title">Congratulations!</p>
          <p class="lab-finish-text" id="cm-finish-text">Cipher sequence mastered.</p>
          <button type="button" id="cm-play-again" class="btn primary">Play Again</button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(root);

  const levelEl = root.querySelector("#cm-level");
  const bestEl = root.querySelector("#cm-best");
  const startBtn = root.querySelector("#cm-start");
  const status = root.querySelector("#cm-status");
  const grid = root.querySelector("#cm-grid");
  const finishEl = root.querySelector("#cm-finish");
  const finishTextEl = root.querySelector("#cm-finish-text");
  const playAgainBtn = root.querySelector("#cm-play-again");

  let sequence = [];
  let userIndex = 0;
  let level = 1;
  let locked = true;
  let playbackTimers = [];
  let best = Number(window.localStorage.getItem("cipherMemoryBest") || "1");
  bestEl.textContent = String(best);

  function hideFinishScreen() {
    finishEl.classList.remove("show");
  }

  function showFinishScreen(message) {
    finishTextEl.textContent = message;
    finishEl.classList.add("show");
  }

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

  function finishRun() {
    locked = true;
    clearTimers();
    if (goalLevel > best) {
      best = goalLevel;
      window.localStorage.setItem("cipherMemoryBest", String(best));
      bestEl.textContent = String(best);
    }
    status.textContent = `Challenge complete at level ${goalLevel}.`;
    startBtn.disabled = false;
    showFinishScreen(`You completed level ${goalLevel}.`);
  }

  function succeedStep() {
    userIndex += 1;
    if (userIndex < sequence.length) {
      return;
    }
    if (level >= goalLevel) {
      finishRun();
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
    hideFinishScreen();
    clearTimers();
    level = 1;
    levelEl.textContent = "1";
    sequence = [];
    appendRandomSymbol();
    appendRandomSymbol();
    startBtn.disabled = true;
    playbackSequence();
  });

  playAgainBtn.addEventListener("click", function () {
    if (!startBtn.disabled) {
      startBtn.click();
    }
  });

  return function cleanup() {
    clearTimers();
  };
}

window.ExperimentsGames = window.ExperimentsGames || [];
window.ExperimentsGames.push(cipherMemoryGame);
