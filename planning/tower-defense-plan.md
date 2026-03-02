# Tower Defense Plan (Canvas Rebuild)

## Goal
Build a new canvas-based tower defense game for `experiments.html` where the player places different tower types and defends a path from incoming enemies.

## Phase 1 - Core Architecture
- Create a dedicated game module in `games/packet-defender.js`.
- Use a fixed-size canvas with responsive display scaling.
- Define a waypoint path system so enemies follow a curved route from spawn to exit.
- Implement a robust main loop with `requestAnimationFrame` and delta time.
Status: completed

## Phase 2 - Gameplay Systems
- Add economy (`gold`), base health (`lives`), wave progression, and kill rewards.
- Add wave spawning queue with increasing enemy count, HP, and speed.
- Add game states: active, paused, game over, and victory.
Status: completed

## Phase 3 - Tower Strategy Layer
- Add multiple tower classes with distinct roles:
  - Arrow Tower: fast, single-target DPS.
  - Cannon Tower: slower shots with splash damage.
  - Frost Tower: damage plus slowing effect.
- Add build pads and placement logic with affordability checks.
- Add upgrade-free but tactical placement design for early replayability.
Status: completed

## Phase 4 - Combat and Rendering
- Add projectile simulation and hit detection.
- Add enemy movement interpolation and path progression tracking.
- Add targeting priority (closest-to-exit in range).
- Render path, towers, enemies, HP bars, and impact feedback on canvas.
Status: completed

## Phase 5 - UX and Controls
- Add tower selector UI and clear costs.
- Add controls: start wave, pause/resume, reset.
- Add live HUD for lives, gold, wave, enemies, and kills.
- Add status messaging for player feedback.
Status: completed

## Validation Checklist
- Game loads from experiments list and mounts correctly.
- Enemies follow the path to exit.
- Towers can be placed and fire automatically.
- Waves increase difficulty over time.
- Win/lose states trigger correctly.
- Reset returns game to clean initial state.
Status: completed
