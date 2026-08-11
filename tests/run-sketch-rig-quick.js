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
    clip() {},
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = check();
    if (value) return value;
    await delay(20);
  }
  throw new Error(`Timeout waiting for ${label}`);
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
    return { left: 0, top: 0, width: Number(this.width) || 360, height: Number(this.height) || 240, right: 0, bottom: 0 };
  };
  window.requestAnimationFrame = function requestAnimationFrame() { return 0; };
  window.cancelAnimationFrame = function cancelAnimationFrame() {};
  window.Image = class FakeImage {
    set src(value) {
      this._src = value;
      this.complete = true;
      this.naturalWidth = 64;
      this.naturalHeight = 64;
      if (typeof this.onload === "function") setTimeout(() => this.onload(), 0);
    }
    get src() { return this._src; }
  };
  window.ExperimentsGames = [];

  const planckScript = fs.readFileSync(path.join(repoRoot, "vendor", "planck.min.js"), "utf8");
  window.eval(planckScript);
  const script = fs.readFileSync(path.join(repoRoot, "games", "sketch-rig-challenge.js"), "utf8");
  window.eval(script);
  const game = window.ExperimentsGames.find((entry) => entry.id === "sketch-rig-challenge");
  game.setup(document.getElementById("mount"));

  const wheelTool = document.querySelector('[data-part-type="wheel"]');
  const blueprint = document.getElementById("src-draw");
  wheelTool.click();
  blueprint.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 118, clientY: 164 }));
  window.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true, cancelable: true, clientX: 118, clientY: 164 }));
  blueprint.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 38, clientY: 34 }));
  window.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true, cancelable: true, clientX: 38, clientY: 34 }));
  const elementNames = Array.from(document.querySelectorAll("#src-elements-list .src-element-button strong")).map((node) => node.textContent);
  const interactionAudit = {
    oneShotPlacement: elementNames.filter((name) => name.indexOf("Wheel") === 0).length === 1,
    chassisListed: elementNames.includes("Chassis"),
    wheelListed: elementNames.includes("Wheel 1"),
  };
  interactionAudit.ok = interactionAudit.oneShotPlacement && interactionAudit.chassisListed && interactionAudit.wheelListed;

  const fixtureExpectations = window.runSketchRigFixtureExpectationSuite();
  const freehandRecognition = window.runSketchRigFreehandRecognitionSuite();

  window.runSketchRigRegressionSuite();
  const regression = await waitFor(() => window.__sketchRigRegression, 120000, "regression suite");

  window.runSketchRigSelfTest(4, "quick-random");
  const selfTest = await waitFor(() => window.__sketchRigSelfTest, 30000, "self test");

  const output = {
    fixtureExpectations,
    interactionAudit,
    freehandRecognition,
    regression,
    selfTest,
  };
  fs.writeFileSync(path.join(repoRoot, "tests", "sketch-rig-quick-results.json"), JSON.stringify(output, null, 2));

  console.log(JSON.stringify({
    expectationsOk: fixtureExpectations.ok,
    interactionAuditOk: interactionAudit.ok,
    freehandRecognitionOk: freehandRecognition.ok,
    freehandRecognition: freehandRecognition.audits.map((audit) => ({
      fixture: audit.fixture,
      ok: audit.ok,
      failures: audit.failures,
    })),
    freehandEdgeCases: freehandRecognition.edgeCases,
    regressionWarmup: regression.warmup,
    regressionClearRate: regression.clearRate,
    randomClearRate: selfTest.clearRate,
    randomAvgProgress: selfTest.avgProgress,
    byFixture: regression.byFixture,
  }, null, 2));

  if (!fixtureExpectations.ok || !freehandRecognition.ok || !interactionAudit.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
