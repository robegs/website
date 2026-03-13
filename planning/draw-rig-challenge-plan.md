# Sketch Rig Challenge Plan

## Goal
Build a browser game where the player draws a custom vehicle/creature on canvas, and physics-based behavior emerges from that shape to solve obstacle levels.

## Core Fantasy
- "I draw it, it moves."
- Different levels require different designs.
- Iteration loop: draw -> test -> fail -> redesign -> pass.

## Core Loop
1. Level goal and hazards are shown.
2. Player draws a character in a constrained drawing zone.
3. Game analyzes drawing and builds a physics rig.
4. Simulation starts.
5. Player reaches goal or fails.
6. Player redraws or tweaks and retries.

## Scope (v1)
- Single-screen puzzle levels (10-15).
- 2D physics simulation.
- Draw-to-rig conversion with clear heuristics.
- Three movement archetypes from shape:
  - Wheels: circles roll with torque.
  - Legs: long lower protrusions become stepping limbs.
  - Sled/Body: no clear locomotion parts, slides with weak thrust.
- Win condition: reach goal area before timeout.
- In-level restart + redraw.

## Draw-To-Rig Rules (v1)
- Input:
  - Freehand stroke(s) in draw area.
  - Eraser + undo + clear.
- Processing pipeline:
  - Raster to contour.
  - Simplify contour.
  - Segment into body + appendages.
  - Detect primitive shapes:
    - Circular regions -> wheels.
    - Thin downward protrusions -> legs.
    - Tall rear spike -> stabilizer/tail.
- Rig generation:
  - Main body: convex hull body.
  - Wheels: circular bodies + axle constraints + motor torque.
  - Legs: 2-segment limbs + hinge joints + periodic motor gait.

## Parser Reset (2026-03-12)
- Short-term direction:
  - Stop using the exact first stroke as the rigid body.
  - Treat the first stroke as a body sketch region only.
  - Fit a fixed oval chassis inside that region.
  - Stop relying on drawn appendage recognition for core parts like wheels.
  - Add explicit draggable part tokens for wheels, legs, fins, and tails.
- Why:
  - The old parser mixed body shape recognition and locomotion recognition in one step.
  - A fixed body makes part identification more stable and easier to explain visually.
  - Wheel detection from freehand loops was not reliable enough for core gameplay.
- ML direction:
  - A real ML model is still a valid future step, but only after collecting labeled drawings.
  - Current implementation should stay "ML-ready":
    - extract per-part feature vectors,
    - classify parts through a replaceable `classifyAttachment(...)` stage,
    - keep physics downstream independent from the classifier source.
- Efficient drawing UX:
  - Start with a body already present on the grid.
  - Draw connector/structure strokes after the body.
  - Drag/drop explicit parts onto the canvas and reposition them directly.
  - Analyze both connector strokes and explicit parts together.

## Level Mechanics
- Terrain types:
  - Flat track
  - Stairs
  - Gaps
  - Ramps
  - Small moving platforms (late v1)
- Hazards:
  - Spikes
  - Crushing ceiling
  - Sticky mud zone (high friction)
- Goals:
  - Reach endpoint
  - Optional stars (time + stability bonus)

## Why This Is Interesting
- Shape meaning is emergent, not cosmetic.
- Same level can be solved by multiple designs.
- New level constraints force creative redesign:
  - "Low ceiling" punishes tall rigs.
  - "Bridge with gaps" rewards wheelbase tuning.
  - "Mud climb" rewards legged rigs.

## Technical Architecture
- Game file:
  - `games/sketch-rig-challenge.js`
- Integration:
  - Register in `window.ExperimentsGames` for `experiments.html`.
- Rendering:
  - `Canvas 2D`
- Physics engine:
  - Prefer `Matter.js` for rapid iteration and joints.
  - Keep abstraction layer so engine can be swapped later.
- Systems:
  - Draw editor system
  - Shape parser and rig builder
  - Physics world adapter
  - Level loader
  - HUD/tutorial/status system

## UX Requirements
- Very explicit pre-sim hints:
  - "Need speed? Draw 2 circles under body."
  - "Need climbing? Draw long legs."
- Immediate rig preview overlay:
  - Show detected wheels/legs before run.
- Fast iteration:
  - One-click retry.
  - Keep previous drawing as ghost template.

## Milestones
1. Prototype Foundation
- Draw canvas and stroke tools.
- Physics world bootstrapped.
- Manual spawn of test rigid body.

2. Shape Parsing + Rig Build
- Contour extraction and simplification.
- Heuristic detectors for wheels/legs.
- Auto-build rig from drawing.

3. Puzzle Loop
- Level loading.
- Goal detection, fail/win, restart/redraw flow.
- 5 pilot levels.

4. Readability + Tuning
- Rig preview overlays.
- Better feedback and hints.
- Balance friction, motor torque, gait cadence.

5. Content Pass
- Expand to 10-15 levels.
- Add optional challenge stars.

## Acceptance Criteria (v1)
- Player can draw and spawn a rig in under 3 seconds.
- At least 3 distinct rig behaviors are reliably produced from shape.
- At least 10 levels are completable with intended redesign loop.
- Retry/redraw cycle is under 2 clicks and feels immediate.

## Risks and Mitigations
- Risk: Shape detection feels random.
- Mitigation: deterministic heuristics + clear rig preview + textual reason labels.

- Risk: Physics instability from complex drawings.
- Mitigation: vertex simplification, part-count caps, and fallback to simplified body.

- Risk: Too much player confusion.
- Mitigation: tight tutorial level sequence and contextual hints per failure type.

## v2 Backlog
1. Joint editor for advanced players.
2. Material painting (rubber, metal, wood) affecting friction and density.
3. Multiplayer ghost replays and shared blueprint seeds.
4. Community level editor with draw constraints.
5. Boss-style levels requiring transform across checkpoints.
