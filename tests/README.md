# Test Execution Guide

Date verified: 2026-03-17

This repo currently has automated test coverage centered on the `Sketch Rig Challenge` game.

## Scope

Automated checks currently cover:

- fixture expectation audits,
- warmup regression for all configured fixtures,
- full multi-level regression,
- random drawing self-test batches,
- browser-compatible quality runner wiring.

Automated checks do **not** currently cover the other games in `experiments.html`. Those still need manual browser verification.

## Prerequisites

This repo uses a local portable Node toolchain already stored in:

- `tools/node-v22.22.0-win-x64`

The Node-based test runners require `jsdom` and `planck` in local `node_modules`.

Install them with:

```powershell
.\tools\node-v22.22.0-win-x64\npm.cmd install jsdom planck --no-save
```

## Automated Commands

### 1. Quick Rig Suite

Purpose:

- fast health check for the current game logic,
- runs fixture expectations,
- runs the fixture regression suite,
- runs a small random self-test batch.

Command:

```powershell
.\tools\node-v22.22.0-win-x64\node.exe tests\run-sketch-rig-quick.js
```

Output artifact:

- `tests/sketch-rig-quick-results.json`

Typical runtime:

- a few seconds

Latest verified result on 2026-03-17:

- `expectationsOk: true`
- `regressionWarmup.cases: 6`
- `regressionWarmup.clears: 6`
- `regressionWarmup.allPassed: true`
- `regressionClearRate: 0.4`
- `randomClearRate: 0`
- `randomAvgProgress: 0.1593284771607177`

### 2. Full Rig Quality Suite

Purpose:

- full deterministic fixture expectations,
- full quality suite from the game itself,
- warmup validation,
- fixture expectation validation,
- full regression summary,
- random-drawing quality batch summary.

Command:

```powershell
.\tools\node-v22.22.0-win-x64\node.exe tests\run-sketch-rig-fixtures.js
```

Output artifact:

- `tests/sketch-rig-results.json`

Typical runtime:

- several minutes

Latest verified result on 2026-03-17:

- `expectationsOk: true`
- `expectationsPassed: 7`
- `expectationsTotal: 7`
- `qualityOk: true`
- `warmupAllPassed: true`
- `fixtureExpectationOk: true`
- `regressionWarmupAllPassed: true`
- `avgRandomProgress: 0.32111274377561033`
- `fixtureFailures: []`

## Browser Runner

There is also a browser-runner page for manual / visual execution of the full quality suite:

- `tests/sketch-rig-quality-runner.html`

Open it in a browser and wait for the output panel to populate.

This is useful when you want:

- the in-browser code path,
- a visible page-level runner,
- a sanity check outside the Node + jsdom harness.

## In-Page Manual Commands

From `experiments.html#rig`, the following globals are available in the browser console:

```js
window.runSketchRigSelfTest(trials, seedText)
window.runSketchRigRegressionSuite()
window.runSketchRigPhysicsTune()
window.runSketchRigFixtureExpectationSuite()
window.runSketchRigQualitySuite(options)
window.setSketchRigPlanckBackend(true)   // opt-in experimental wheeled backend
window.setSketchRigPlanckBackend(false)
```

## Files Produced By The Test Runs

- `tests/sketch-rig-quick-results.json`
- `tests/sketch-rig-results.json`

These are useful for:

- comparing runs before/after physics changes,
- checking fixture-specific regressions,
- preserving the exact result payload from the latest execution.

## What Was Actually Executed On 2026-03-17

The following commands were executed successfully during validation:

```powershell
.\tools\node-v22.22.0-win-x64\node.exe tests\run-sketch-rig-quick.js
.\tools\node-v22.22.0-win-x64\node.exe tests\run-sketch-rig-fixtures.js
```

## Current Gaps

- No automated test suite exists yet for:
  - `brick-breaker`
  - `packet-defender`
  - `target-rush`
  - `cipher-memory`
  - `pixel-platformer`
  - `neon-rift-rally`
- Manual browser verification is still required for visual correctness and interaction feel.
- The experimental Planck-backed wheeled solver is present but opt-in only, so the default passing suite still validates the current production backend.
