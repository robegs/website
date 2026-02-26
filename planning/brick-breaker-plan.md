# Brick Breaker Plan (Completed v1)

## Scope
Deliver a polished, browser-playable Brick Breaker experience for `experiments.html` with:
- Strong visuals and responsive controls
- Stable game loop and collision handling
- Progression and replay value
- Mobile and desktop playability

## Architecture
- Game file: `games/brick-breaker.js`
- Integration: game self-registers into `window.ExperimentsGames`
- Rendering: `Canvas 2D`
- Loop: `requestAnimationFrame` with delta-time updates
- Systems:
  - Input (`keyboard`, `mouse`, `touch`)
  - Physics and collisions
  - Gameplay state and progression
  - Effects (particles, shake)
  - Audio (WebAudio lightweight tones)

## Completed Features (v1)
- Core gameplay:
  - Paddle, ball, brick collisions
  - Multi-ball support
  - Life system and game-over flow
  - Pause and resume
  - Reset run
- Progression:
  - Level-based brick patterns
  - Boss level every 5 levels
  - Full campaign completion at level 10
- Scoring:
  - Score with combo multiplier
  - Combo decay window
  - Persistent best score in `localStorage`
- Power-ups:
  - `expand` (wider paddle)
  - `slow` (reduced ball speed)
  - `multiball`
  - `life` (+1 life, capped)
- Visual polish:
  - Particle bursts on collisions and pickups
  - Boss health bar rendering
  - Dynamic background lines
  - Screen shake on heavy impact/life loss
- UX:
  - Click/tap or `Space` to launch
  - `P` key and button for pause
  - On-screen status messaging
  - Sound toggle button

## Acceptance Checklist
- Stable frame loop with no blocking calls
- Brick collision side resolution implemented
- Game remains playable on desktop keyboard + mouse
- Game remains playable on touch devices
- Pause/resume does not corrupt state
- Multi-ball lifecycle handled correctly
- Campaign can be completed and replayed

## QA Scenarios
1. Launch game by click and by `Space`.
2. Pause/resume using button and `P`.
3. Trigger each power-up and confirm expiration behavior.
4. Reach boss level 5 and defeat boss.
5. Continue to level 10 and verify campaign completion message.
6. Lose all lives and restart without page refresh.
7. Verify best score persistence after reload.

## Known Tradeoffs
- Audio uses generated tones (no external assets) for low overhead.
- Collision system is pragmatic and robust for normal speeds, not a full continuous collision solver.

## Improvement Plan (v1.1) - Implemented

### Phase 1 - Power-up Readability
Actions:
- Replace text-like markers with icon-style symbols drawn on canvas.
- Increase power-up capsule size and visual contrast.
- Differentiate rarity with both shape and aura.
Status: completed

### Phase 2 - Boss Rework
Actions:
- Replace static boss brick with animated boss entity.
- Add moving weak points and dynamic boss body movement.
- Keep clear HP feedback and stronger impact effects.
Status: completed

### Phase 3 - Debug UX
Actions:
- Add on-screen level selector to jump to any campaign level.
- Restart game immediately on selection for faster balancing/testing.
- Keep selector visible in control row at all times.
Status: completed

### Phase 4 - Pause UX
Actions:
- Move resume action into in-game overlay.
- Disable external pause button while paused.
- Keep keyboard resume path (`P`) intact.
Status: completed

## Improvement Plan (v1.2) - Implemented

### Phase 1 - Clarity of Power-Ups
Actions:
- Replace text-heavy power-up markers with iconographic drawings.
- Enlarge power-up capsules for readability.
- Preserve tier cues using shape + aura + color.
Status: completed

### Phase 2 - Boss Gameplay Rework
Actions:
- Replace static boss brick with animated boss entity.
- Add moving weak points as explicit damage targets.
- Keep body collision defensive while weak points are offensive targets.
Status: completed

### Phase 3 - Debug Instrumentation
Actions:
- Add level selector in the top controls for direct level jumps.
- Reset/restart from selected level instantly to speed up balancing.
Status: completed

## Improvement Plan (v1.3) - Implemented

### Phase 1 - Boss Identity and Variety
Actions:
- Define distinct boss archetypes at different boss levels.
- Add unique movement signatures and visual signatures for each archetype.
- Keep explicit weak-point targeting loops.
Status: completed

### Phase 2 - Weak-Point Damage Clarity
Actions:
- Enforce lateral-hit damage rule for boss weak points.
- Make top/bottom contacts defensive bounces only.
- Add on-screen guidance text in boss stages and visuals.
Status: completed

### Phase 3 - Dynamic Wave Pressure
Actions:
- Add delayed reinforcement brick waves in higher levels.
- Spawn reinforcement bricks during active gameplay in timed batches.
- Provide feedback when reinforcements arrive.
Status: completed

### Phase 4 - Tactical Wall Stage
Actions:
- Add a dedicated level with indestructible wall bricks.
- Keep the stage difficult but solvable via intentional lane gaps.
- Ensure stage clear condition ignores indestructible blocks.
Status: completed

## Next Version Backlog (v2)
1. Add pre-run countdown and ready animation.
2. Add difficulty presets (`Normal`, `Hard`).
3. Add achievements and post-run stats panel.
4. Add optional controller support.
5. Add richer SFX/music pack with preload management.
