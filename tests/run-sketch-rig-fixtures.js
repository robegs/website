const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

function makeNoopContext() {
  const gradient = { addColorStop() {} };
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    lineCap: "round",
    lineJoin: "round",
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    clearRect() {},
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    arc() {},
    ellipse() {},
    fill() {},
    stroke() {},
    drawImage() {},
    fillText() {},
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; },
  };
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="mount"></div></body></html>`,
    {
      url: "http://localhost/experiments.html#rig",
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
    }
  );

  const { window } = dom;
  const { document } = window;

  window.HTMLCanvasElement.prototype.getContext = function getContext() {
    return makeNoopContext();
  };
  window.HTMLCanvasElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: Number(this.width) || 360,
      height: Number(this.height) || 240,
      right: Number(this.width) || 360,
      bottom: Number(this.height) || 240,
    };
  };
  window.requestAnimationFrame = function requestAnimationFrame() { return 0; };
  window.cancelAnimationFrame = function cancelAnimationFrame() {};
  window.Image = class FakeImage {
    constructor() {
      this.complete = false;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      this.onload = null;
      this.onerror = null;
    }
    set src(value) {
      this._src = value;
      this.complete = true;
      this.naturalWidth = 64;
      this.naturalHeight = 64;
      if (typeof this.onload === "function") {
        setTimeout(() => this.onload(), 0);
      }
    }
    get src() {
      return this._src;
    }
  };

  window.ExperimentsGames = [];

  const script = fs.readFileSync(path.join(repoRoot, "games", "sketch-rig-challenge.js"), "utf8");
  window.eval(script);

  const game = window.ExperimentsGames.find((entry) => entry.id === "sketch-rig-challenge");
  if (!game) {
    throw new Error("Sketch Rig Challenge game failed to register.");
  }

  const mount = document.getElementById("mount");
  game.setup(mount);

  if (typeof window.runSketchRigFixtureExpectationSuite !== "function") {
    throw new Error("Fixture expectation suite was not exposed.");
  }
  if (typeof window.runSketchRigQualitySuite !== "function") {
    throw new Error("Quality suite was not exposed.");
  }

  const fixtureExpectations = window.runSketchRigFixtureExpectationSuite();
  const quality = await window.runSketchRigQualitySuite({
    randomTrials: 12,
    randomSeeds: ["rig-node-a", "rig-node-b"],
  });

  const output = {
    fixtureExpectations,
    quality,
  };

  const outFile = path.join(repoRoot, "tests", "sketch-rig-results.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  console.log(JSON.stringify({
    expectationsOk: fixtureExpectations.ok,
    expectationsPassed: fixtureExpectations.passed,
    expectationsTotal: fixtureExpectations.total,
    qualityOk: quality.ok,
    warmupAllPassed: quality.warmup.allPassed,
    fixtureExpectationOk: quality.fixtureExpectations.ok,
    regressionWarmupAllPassed: quality.regression.warmup.allPassed,
    avgRandomProgress: quality.avgRandomProgress,
    fixtureFailures: fixtureExpectations.audits.filter((audit) => !audit.ok).map((audit) => ({
      fixture: audit.fixture,
      failures: audit.failures,
      metrics: audit.metrics,
    })),
  }, null, 2));

  if (!fixtureExpectations.ok || !quality.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
