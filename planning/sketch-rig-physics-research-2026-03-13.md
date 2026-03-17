# Sketch Rig Physics Research

Date: 2026-03-13

## Summary

The current custom solver is still based on post-correcting pose, support height, and locomotion velocity. That is useful for prototyping, but it is not the expected architecture for a robust 2D vehicle / walker physics game.

The common baseline in production and engine literature is:

- rigid bodies with mass and inertia derived from attached shapes,
- fixed-timestep simulation,
- constraint solving for contacts and joints,
- motorized joints for wheels and articulated limbs,
- friction and restitution handled by the engine contact solver rather than by custom velocity hacks,
- sub-stepping / solver iterations to improve stability.

## Primary Sources Reviewed

- Planck.js official package / docs:
  - `https://github.com/piqnt/planck.js`
  - package docs include:
    - `docs/pages/world/simulation.md`
    - `docs/pages/body.md`
    - `docs/pages/joint/revolute-joint.md`
    - `docs/pages/joint/wheel-joint.md`
- Box2D official documentation:
  - `https://box2d.org/documentation/`
  - simulation notes:
    - fixed timestep
    - substeps
    - contact / joint solver expectations
- Matter.js official docs:
  - `https://brm.io/matter-js/`
  - useful for comparison, but Planck/Box2D is the stronger match for joint-driven vehicles and walkers.

## Expected Design For This Game

### Wheels

- each wheel should be its own dynamic rigid body,
- the body/chassis should be another rigid body,
- wheels should be connected to the chassis with joints,
- motor torque should act on the wheel joint or wheel body,
- contact with the ground should determine whether the vehicle moves, not direct velocity injection.

### Legs / Arms

- each limb should be a rigid segment chain or a small set of linked bodies,
- movement should come from joint motors / target angles,
- grabbing should be a constraint state, not a direct position pull.

### Structure Pieces

- structure pieces should become rigid parts of the chassis or welded bodies,
- they should affect mass, inertia, and collision shape,
- they should not generate drive by themselves.

## Implementation Direction Started

This repo now includes:

- local Planck.js browser bundle:
  - `vendor/planck.min.js`
- script loading in:
  - `experiments.html`
  - `live_experiments.html`
  - `tests/sketch-rig-quality-runner.html`
- Node test runners updated to load Planck before the game script.

In `games/sketch-rig-challenge.js`, a first migration scaffold now exists:

- Planck backend detection,
- pixel/meter conversion helpers,
- world-ground builder,
- Planck wheeled-rig initialization,
- Planck stepping path for wheeled rigs,
- hidden runtime toggle:
  - `window.setSketchRigPlanckBackend(true)`

## Current State

The Planck backend is intentionally opt-in only.

Reason:

- the first rigid-body wheeled path is structurally correct,
- but it is not tuned enough yet to replace the current solver for carts/trikes in production,
- keeping it disabled by default preserves the existing passing fixture baseline while allowing incremental migration.

## Recommended Next Migration Steps

1. Make wheel carts fully pass on the Planck backend.
2. Replace synthetic wheel support logic with wheel-body contacts when Planck is active.
3. Convert `structure` parts into welded chassis fixtures on the Planck path.
4. Add prismatic / wheel-joint suspension for carts and trikes.
5. Convert arms and legs to real joint graphs instead of procedural swing offsets.
