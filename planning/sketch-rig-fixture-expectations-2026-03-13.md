# Sketch Rig Fixture Expectations

Date: 2026-03-13

This file defines the intended flat-ground behavior for the preconfigured fixtures on level 1 (`Warmup`). These are not vague design goals; they are the expected mechanical baseline for the solver and are used to drive automated audits.

## Wheel Cart

- Primary behavior:
  - both wheels should stay in contact with the ground on normal flat terrain almost all the time,
  - the wheels should rotate and propel the cart forward,
  - the body should not bounce enough to unload one wheel for long periods.
- Failure signs:
  - one wheel frequently lifts on plain ground,
  - the body rocks excessively,
  - forward speed is low despite both wheels existing.

## Walker

- Primary behavior:
  - both legs should alternate support,
  - there should be regular double-support moments,
  - the walker should progress steadily without hopping like a pogo stick.
- Failure signs:
  - one leg stays airborne too often,
  - the body tips too far forward/backward,
  - walking stalls on flat ground.

## Trike

- Primary behavior:
  - at least two wheels should remain grounded nearly all the time,
  - the extra wheel should improve stability over the basic cart,
  - it should roll faster than the walker on level 1.
- Failure signs:
  - repeated two-wheel loss on flat ground,
  - large chassis pitch,
  - unstable turning/rocking despite three wheels.

## Crawler

- Primary behavior:
  - multiple legs should maintain broad support,
  - the body should stay low and stable,
  - it should crawl through the level without long unstable single-support phases.
- Failure signs:
  - repeated toppling,
  - long single-leg balancing on flat terrain,
  - no clear traction advantage from the extra legs.

## Glider

- Primary behavior:
  - the body should stay relatively level,
  - it may skim or lighten contact, but should not pitch wildly,
  - it still needs to reach the end of level 1 consistently.
- Failure signs:
  - nose-up or nose-down oscillation,
  - long stalls with little forward speed,
  - unstable landing behavior on flat terrain.

## Climber

- Primary behavior:
  - on flat ground the legs should provide the main locomotion,
  - the arms should not destabilize the chassis,
  - it should still progress like a controlled walking/climbing hybrid.
- Failure signs:
  - arms repeatedly pulling the body off the ground on plain terrain,
  - stalled gait because the arms interfere with leg support,
  - excessive tilt or body drag.

## Automated Audit Thresholds

The code audit currently checks:

- level clear on warmup
- average grounded wheel count for wheeled rigs
- average grounded leg count for legged rigs
- share of frames with at least two grounded wheels / legs where relevant
- average forward speed
- max absolute body angle
- peak single-support duration

These thresholds are intentionally strict on flat ground. If a preset fixture fails here, the solver should be improved rather than weakening the expectation.
