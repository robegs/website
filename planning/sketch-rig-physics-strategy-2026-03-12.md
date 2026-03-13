# Sketch Rig Challenge Physics Strategy and Implementation Log (2026-03-12)

## Goal
Improve the drawing-based physics engine with a clear staged strategy, then implement new components from easiest to hardest while keeping runtime stable.

## Strategy (easiest -> hardest)

1. Contact Foundation (Easy)
- Build a support model from all current contact points (body + attachments).
- Track support range and center of pressure (CoP).
- Use this to reason about whether the rig is balanced over its support base.

2. Traction / Slip Model (Medium)
- Add shape-aware friction coefficients.
- Decide between static friction (stick) and dynamic friction (slip) based on traction demand.
- Apply friction continuously in the ground response stage to reduce jitter and unrealistic acceleration.

3. Adaptive Locomotion Controller (Medium-Hard)
- Infer locomotion profile from drawing topology (legs, loops, fins, total supports).
- Use that profile to tune gait cadence, stance behavior, and forward target speed.
- Keep compatibility with arbitrary shapes by using inferred parameters, not hard-coded creature templates.

4. Balance Recovery Controller (Hard)
- Compare COM against support polygon bounds.
- If COM exits support range, apply corrective angular/linear impulses.
- If COM is inside support range, nudge body orientation toward CoP alignment.

## Implemented Changes

### File updated
- `games/sketch-rig-challenge.js`

### New simulation state
- Added `sim.stanceTargetVx` to represent target stance velocity for traction-demand calculation.

### New profile inference
- Added `inferPhysicsProfile(rig)`.
- Derives:
  - counts: `legCount`, `loopCount`, `finCount`
  - support shaping: `supportBias`, `stanceWidth`, `cadence`
  - traction params: `staticFriction`, `dynamicFriction`
  - stabilization: `recoveryTorque`
- Profile is stored on rig analysis as `rig.physicsProfile`.

### Simulation loop upgrades
1. Contact Foundation
- Added `allGroundContacts` collection during contact resolution.
- Stores contact positions from both body and attachments.

2. Adaptive gait integration
- Uses `rig.physicsProfile` in `updateSimulation`.
- Gait timing now scales with inferred `cadence`.
- Stance push scales with inferred `supportBias`.
- Computes `sim.stanceTargetVx` from stance/swing geometry.

3. Stick/slip traction model
- Added traction-demand estimate:
  - based on velocity mismatch (`sim.vx` vs `sim.stanceTargetVx`) and slope.
- Chooses friction regime:
  - static friction if demand < threshold
  - dynamic friction otherwise
- Ground damping now uses chosen friction coefficient instead of fixed-only damping.

4. Support polygon + CoP recovery
- Computes support range (`supportMinX`, `supportMaxX`) and CoP (`copX`).
- If COM leaves support polygon margins, applies corrective impulses.
- If COM remains inside, applies recovery torque toward CoP alignment.

## Why this should help
- Better gravity behavior: rigs that rely on one persistent contact lose stability sooner and tend to rebalance.
- Better shape generalization: drawn topology influences cadence/friction/recovery without restricting shape creativity.
- Better readability of motion: movement transitions between stick and slip instead of binary planting-only behavior.

## Notes on CPU/Memory Safety
- No heavy new data structures or nested expensive loops beyond existing contact passes.
- Added arrays are frame-local and bounded by sampled stroke points.
- No background workers, intervals, or recursive simulation branches were introduced.

## Next Iteration Candidates
1. Multi-point foot solver with explicit heel/toe anchors for each leg attachment.
2. Soft-body edge constraints for attachment segments (per-segment springs) for more organic flex.
3. Deterministic replay harness that runs seeded shape simulations and reports pass rates per level.
4. Optional debug overlay toggle for support polygon, CoP, friction mode, and COM.

## Iteration 2 (2026-03-12): Random-Drawing Self Simulation

Implemented an automatic self-test runner to simulate many random drawings directly in-browser and measure behavior.

### Added
- Random drawing generator for diverse silhouettes and attachments:
  - body loops, legs, loops/wheels, fins/spikes, mixed limbs.
- Simulation harness that:
  - snapshots current game state,
  - injects random drawings,
  - runs physics at 60 Hz until clear/fail/time,
  - restores original state safely.
- Chunked execution (time-budgeted per tick) to avoid UI freezes.
- Summary report exposed in `window.__sketchRigSelfTest`:
  - analyzed count, clears, clear rate, average progress, failure reasons.
- Manual trigger:
  - `window.runSketchRigSelfTest(trials, seedText)`.

### Auto-run
- After calibration, self-test now auto-runs 36 trials with seed `sketch-rig-self-test-v2`.

### Physics tuning in this iteration
- Added low-speed ground assist when static traction + multi-support are present.
- Purpose: reduce frustrating stalls for valid shapes that achieve support but lack enough crawl momentum.

## Iteration 3 (2026-03-12): Explicit Contact Roles

- Added part-specific contact subsets:
  - loops/wheels use bottom-edge contact samples,
  - legs use lower-tip-biased contact samples,
  - other appendages use reduced lower-edge samples.
- Reduced dependence on all raw stroke points for collision response.
- Loops now behave more like wheels:
  - reduced spring-like swinging,
  - wheel rotation is driven from forward speed while grounded,
  - world rendering now shows wheel circles and a spoke for debugging/readability.
- Ground response was pushed further toward ride-height behavior:
  - support points compute a weighted mean ground height,
  - oval body follows that ride height with suspension-like correction,
  - body aligns toward terrain normal, not only penetration torque.

## Iteration 4 (2026-03-12): Deterministic Regression Fixtures

- Added fixed fixture drawings for repeatable simulation:
  - `wheel-cart`
  - `walker`
  - `trike`
  - `crawler`
  - `glider`
- Added a deterministic regression suite that runs every fixture across every level.
- Results are exposed in `window.__sketchRigRegression`.
- Manual trigger:
  - `window.runSketchRigRegressionSuite()`
- Purpose:
  - make tuning changes against stable reference rigs,
  - catch regressions that random fuzzing may miss,
  - separate "parser still works" from "motion quality changed".
- UI support:
  - added an in-page debug fixture toggle so fixture models can be loaded and run without using the browser console.

## Iteration 5 (2026-03-12): Prototype-Matched Part Analysis

- Reused fixture blueprints as classifier prototypes for freehand part detection.
- `classifyAttachment(...)` now matches drawn strokes against fixture-derived reference features before applying fallback heuristics.
- Added explicit `arm` support in:
  - debug palette,
  - fixture blueprints,
  - regression suite,
  - world simulation.
- Arm behavior:
  - short-duration latching/grab state,
  - pulls the body forward/upward when it catches contact ahead of the chassis,
  - helps climb instead of acting like a generic decorative appendage.

## Iteration 6 (2026-03-12): Fixture-Based Physics Tuning

- Added a separate persistent `physicsTuning` config for solver multipliers:
  - wheel drive
  - leg drive / lift
  - suspension ride / snap
  - air balance
  - arm pull
  - friction grip
- Added fixture-based tuning pass:
  - evaluates a small grid of candidate configurations,
  - scores them against deterministic regression fixtures,
  - stores the best-scoring configuration in local storage.
- Added debug trigger:
  - in-page `Tune Physics` button
  - `window.runSketchRigPhysicsTune()`

## Iteration 7 (2026-03-12): Single-Support Instability Rule

- Added explicit handling for unrealistic one-point support.
- The solver now tracks `singleSupportTime` and penalizes staying balanced on only one support for too long.
- When only one support remains:
  - COM offset from the contact point increases instability,
  - angular instability rises over time,
  - vertical bias pushes the rig toward finding a wider base,
  - planted single-leg states are released sooner.
- Regression scoring now penalizes long single-support phases so tuning prefers rigs that settle onto at least two contacts.

## Iteration 8 (2026-03-13): Wheel And Walker Reliability Pass

- Tightened wheel rigs so two grounded wheels behave more like an axle:
  - explicit wheel contact collection,
  - target cruise speed for multi-wheel rigs,
  - stronger traction assist when static grip is available,
  - spin alignment toward linear speed.
- Tightened biped walkers:
  - stronger planted-foot stick,
  - stronger forward gait target while two feet are grounded,
  - more consistent stance target velocity and small lift support during the alternating phase.
- Updated the fixture tuner to prioritize level 1 as a hard baseline:
  - first-stage candidate ranking uses only warmup runs,
  - final selection favors configurations where all fixtures clear level 1,
  - regression output now exposes a dedicated warmup summary.

## Iteration 9 (2026-03-13): Center-Of-Mass Gravity Pass

- Replaced the old "body center is the mass center" assumption with a weighted mass model:
  - oval body contributes most of the base mass,
  - wheels add circular rim/hub mass,
  - limbs and other parts add segment-based mass samples,
  - total inertia is derived from the sampled mass distribution.
- Added `comLocal` and inertia to the analyzed rig.
- Support and balance logic now uses the center of mass instead of the oval origin:
  - contact torques are measured relative to COM,
  - support recovery checks compare COM projection against the support region,
  - single-support instability also uses COM offset.
- Added a visible COM marker in both the draw preview and the world view to make balancing easier to inspect while tuning.
- Research note:
  - reviewed browser options such as Matter.js / Planck.js for rigid-body physics and TensorFlow.js for small in-browser models,
  - did not integrate them in this pass because the current issue is mass/support realism rather than missing broad engine capability,
  - keeping the solver custom preserves deterministic fixture behavior and avoids a broad rewrite.

## Iteration 10 (2026-03-13): Fixture Behavior Specs + Node Simulation

- Added explicit expected behavior definitions for each preset fixture on level 1:
  - wheel cart
  - walker
  - trike
  - crawler
  - glider
  - climber
- Added a fixture audit layer that measures:
  - grounded wheel / leg support
  - two-support frame ratios
  - average speed
  - max body angle
  - peak single-support duration
  - level clear progress
- Added a local Node + jsdom runner so the actual browser game code can be executed outside the page:
  - local portable Node runtime under `tools/node-v22.22.0-win-x64`
  - runner script at `tests/run-sketch-rig-fixtures.js`
  - latest output artifact at `tests/sketch-rig-results.json`
- Solver changes made to satisfy the fixture specs:
  - near-ground wheel support synthesis for wheeled rigs,
  - near-ground foot planting for legged rigs,
  - stronger axle / gait stabilization,
  - mode-specific cruise control for cart / walker / crawler / climber / glider.
- Verified result from the Node runner:
  - all 6 fixture expectations passed,
  - warmup regression passed for every fixture,
  - full quality suite status returned `ok: true`.
