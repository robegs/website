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

renderGameList();
if (gameRegistry.length) {
  mountGame(activeGameId || gameRegistry[0].id);
}
