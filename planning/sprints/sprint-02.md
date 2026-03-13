# Sprint 02 Plan - Sketch Rig Challenge

## Sprint Goal
Ship a playable prototype where the user draws a character, the game analyzes shape features, and those features affect level traversal.

## Committed Backlog
- Integrate new game into `experiments.html`.
- Implement drawing canvas with undo/clear controls.
- Implement draw-to-rig analysis (wheels, legs, body size).
- Implement first physics-driven simulation loop.
- Implement level progression with shape-gated challenges.
- Add readable HUD and status feedback.

## Execution Status
- Done:
  - New game added: `games/sketch-rig-challenge.js`
  - Wired in `experiments.html`
  - Added dedicated styles in `experiments.css`
  - Implemented 5 prototype levels and challenge system
  - Added run/retry/analyze loop and trait HUD
  - Replaced box proxy with true drawn-shape rendering in simulation
  - Added point-contact rigid-body style movement (translation + rotation + terrain contacts)
  - Added iterative auto-calibration pass:
    - 420 random shape simulations
    - coarse grid search + refinement search for motor coefficients
- Next:
  - Replace heuristic collisions with stronger rigid-body constraints
  - Add rig preview diagnostics (why a shape was detected/not detected)
  - Add level completion overlay and star scoring
  - Add sprite/asset pass for richer visuals

## Demo Checklist
- Player can draw strokes and analyze rig traits.
- Player can run a simulation and fail/pass based on rig shape.
- At least 3 challenge types require different designs.
- Player can switch levels and iterate quickly without page reload.
