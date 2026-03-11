# Neon Rift Rally - Implementation Plan

## Goal
Build a visually impressive browser game with fast iteration cycles, strong atmosphere, and a clear finish state.

## Vision
Neon Rift Rally is a pseudo-3D hover-racing survival sprint through a shifting canyon. The player dodges hazards, collects energy, and uses boost windows to complete all sectors.

## Core Experience
- Immediate control response (left/right + boost).
- Strong visual motion: perspective canyon, neon lane lines, starfield, particles, screen flash.
- Escalating pacing through sectors.
- Clear end states: `CONGRATULATIONS` on completion, `GAME OVER` on failure.

## Controls
- `A/D` or `Left/Right`: steer.
- `Shift` or `Space`: boost (consumes energy).
- `P`: pause.
- `R`: restart.

## Milestones
1. MVP
- Canvas scene with pseudo-3D depth.
- Player movement and collision.
- Obstacles and pickups.
- Distance progression and sector transitions.

2. Visual Pass
- Dynamic sky gradients and pulse effects.
- Neon canyon strip shading and lane markers.
- Particle trails and hit sparks.
- Camera shake and vignette overlay feedback.

3. Gameplay Pass
- Procedural hazard patterns.
- Near-miss scoring and combo multiplier.
- Sector-based difficulty scaling.
- Tuned boost economy.

4. Polish Pass
- HUD refinement.
- End overlays and summary stats.
- Best run persistence via localStorage.
- Cleanup and lifecycle safety.

## Iteration Criteria
- Each pass must change both feel and output (not just refactor).
- Keep frame update deterministic and stable under tab throttling.
- Keep one-file game module for easy experimentation.

## Acceptance Criteria
- Game is selectable in `experiments.html`.
- Starts, pauses, restarts, and cleans up reliably.
- Completion path triggers a clear congratulations screen.
- Failure path triggers game over screen.
- Local best score updates only when surpassed.
