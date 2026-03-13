const gameListEl = document.getElementById("game-list");
const gameMetaEl = document.getElementById("game-meta");
const gameMountEl = document.getElementById("game-mount");

if (!gameListEl || !gameMetaEl || !gameMountEl) {
  throw new Error("Experiments page mount points not found.");
}

const gameRegistry = Array.isArray(window.ExperimentsGames) ? window.ExperimentsGames.slice() : [];
if (!gameRegistry.length) {
  gameMetaEl.innerHTML = "<p>No games could be loaded.</p>";
}

let activeGameCleanup = null;
let activeGameId = null;

function slugifyFragment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildGameHashIndex() {
  const index = new Map();
  for (const game of gameRegistry) {
    const candidates = new Set();
    candidates.add(slugifyFragment(game.id));
    candidates.add(slugifyFragment(game.title));
    String(game.id || "").split("-").forEach((part) => candidates.add(slugifyFragment(part)));
    String(game.title || "").split(/\s+/).forEach((part) => candidates.add(slugifyFragment(part)));
    candidates.forEach((candidate) => {
      if (candidate && !index.has(candidate)) {
        index.set(candidate, game.id);
      }
    });
  }
  return index;
}

const gameHashIndex = buildGameHashIndex();

function preferredHashForGame(game) {
  const preferred = {
    "brick-breaker": "brick",
    "packet-defender": "defender",
    "target-rush": "rush",
    "cipher-memory": "memory",
    "pixel-platformer": "platformer",
    "neon-rift-rally": "rally",
    "sketch-rig-challenge": "rig",
  };
  return preferred[game.id] || slugifyFragment(game.id);
}

function resolveGameIdFromHash() {
  const rawHash = window.location.hash.replace(/^#/, "");
  const fragment = slugifyFragment(rawHash);
  if (!fragment) return null;
  return gameHashIndex.get(fragment) || null;
}

function updateHashForGame(gameId) {
  const game = gameRegistry.find((entry) => entry.id === gameId);
  if (!game) return;
  const preferredHash = preferredHashForGame(game);
  if (window.location.hash === `#${preferredHash}`) return;
  window.history.replaceState(null, "", `#${preferredHash}`);
}

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
  updateHashForGame(gameId);
  setActiveListItem(gameId);
  gameMetaEl.className = "game-meta";
  gameMetaEl.innerHTML = `<h3>${game.title}</h3><p>${game.description}</p><p><strong>Focus:</strong> ${game.difficulty}</p>`;
  gameMountEl.innerHTML = "";
  activeGameCleanup = game.setup(gameMountEl);
}

renderGameList();
if (gameRegistry.length) {
  mountGame(resolveGameIdFromHash() || activeGameId || gameRegistry[0].id);
}

window.addEventListener("hashchange", function () {
  const nextGameId = resolveGameIdFromHash();
  if (nextGameId && nextGameId !== activeGameId) {
    mountGame(nextGameId);
  }
});
