# Pixel Platformer Plan (Mario-Style)

## Goal
Build a browser-playable side-scrolling platformer inspired by Super Mario Bros. for `experiments.html`, using the existing modular game architecture (`window.ExperimentsGames`).

## Scope (v1)
- Core loop:
  - Run, jump, gravity, collision resolution on tile map
  - Side-scrolling camera that follows player
- Progression:
  - Multi-level campaign (3 levels in v1)
  - Goal flag to complete each level
- Gameplay systems:
  - Collectible coins
  - Hazards (spikes and pits)
  - Patrolling enemies with stomp-to-defeat behavior
  - Lives and respawn/checkpoint start positions per level
- UX:
  - Keyboard controls (A/D or arrows + Space/W/Up)
  - Touch controls for mobile (left/right/jump)
  - Pause, reset, and status messaging
  - HUD for lives, coins, level, and timer
  - SFX/music toggles in HUD
  - Live settings panel with SFX/music volume sliders
- Audio:
  - Procedural retro SFX via WebAudio
  - Procedural looped chiptune-style background music

## Technical Architecture
- Game file: `games/pixel-platformer.js`
- Integration: append script in `experiments.html`; self-register game object
- Rendering: `Canvas 2D` tile/sprite rendering
- Assets:
  - Terrain sprites: `assets/games/platformer/kenney_pixel-platformer/Tilemap/tilemap.png`
  - Character/enemy sprites: `assets/games/platformer/kenney_pixel-platformer/Tilemap/tilemap-characters.png`
- Loop: `requestAnimationFrame` with delta-time updates
- Systems:
  - Input manager (keyboard + touch)
  - Physics/collision manager (axis-separated AABB against tile solids)
  - Level parser (ASCII layout -> world entities)
  - Camera and renderer
  - Game state and progression

## Asset Plan
- Source pack: Kenney Pixel Platformer (CC0)
- Acquisition: download and unpack into `assets/games/platformer/`
- License handling:
  - Keep upstream `License.txt`
  - Add local attribution/manifest markdown for provenance and direct URL
- Optional future assets:
  - External CC0 music packs if replacing procedural audio in future versions

## Milestones
1. Foundation
- Level parser, physics, camera, render loop
- One playable level with terrain and win/lose states

2. Gameplay Depth
- Coins, enemies, hazards, lives/respawn
- Multi-level flow and clear transition

3. UX & Mobile
- HUD polish, pause/reset flows
- Touch controls and responsive canvas behavior

4. QA Pass
- Keyboard, touch, level progression, death/respawn, and edge-case collisions

## Acceptance Criteria (v1)
- Player can complete all v1 levels without page reload
- Collision feels stable (no frequent clipping through ground/walls)
- Enemy stomp defeats enemy; side collision damages player
- Coins are collectible and counted in HUD
- Lives decrement on damage; game-over and restart flow work
- Touch controls are functional on mobile viewport
- Game mounts/cleans up cleanly inside experiments framework
- Audio can be toggled independently for SFX and music

## Risks and Mitigations
- Risk: Collision jitter or corner snagging
- Mitigation: axis-separated resolution + epsilon thresholds + capped dt

- Risk: Sprite-sheet index mismatch
- Mitigation: centralize sprite index map constants for fast remapping

- Risk: Mobile control latency
- Mitigation: persistent touch-state buttons instead of one-shot taps

## v2 Backlog
1. Add moving platforms and one-way platforms
2. Add checkpoint flags mid-level
3. Add richer enemy variety and projectiles
4. Add simple level editor JSON format replacing ASCII maps
5. Add optional external soundtrack selection

## v1.1 Tuning Pass (Implemented)
- Movement:
  - Added acceleration/friction tuning for smoother control.
  - Added jump buffering, coyote time, and variable jump height.
- Difficulty curve:
  - Reduced hazards in early levels.
  - Reduced enemy density in early levels and scaled patrol speed by level.
- Audio UX:
  - Added persistent SFX/music volume sliders with `localStorage` save.

## v1.2 Mechanics Pass (Implemented)
- Tutorialized level flow:
  - Level 1 now introduces mechanics in sequence with explicit in-game hint messages.
- New mechanics:
  - Breakable crate blocks (`X`) when hit from below.
  - Spring blocks (`J`) that launch the player higher.
  - Vault drone enemies (`v`) defeated by jumping over them (not stomping).
- Clarity:
  - Distinct enemy visuals for normal walkers vs vault drones.

## v1.3 Progression Pass (Implemented)
- Added score system with rewards for:
  - coins, enemy takedowns, checkpoints, breakable blocks, and level completion time bonus.
- Added dash mechanic:
  - Keyboard: `Shift`
  - Touch: `Dash` button
  - Includes cooldown and HUD state (`Ready`, cooldown, `Active`).
- Added richer HUD feedback:
  - Score and dash status indicators.

## v1.4 Visual Polish Pass (Implemented)
- In-game visuals:
  - Added ambient sparkles, deeper parallax atmosphere, and vignette pass.
  - Added coin glow pulses and improved terrain highlights.
- Impact feedback:
  - Added particle bursts for pickups, combat, checkpoints, boosts, springs, and block breaks.
  - Added context-sensitive screen shake for dash, impacts, and damage events.
- UI polish:
  - Enhanced platformer HUD styling and subtle animated sheen effects.

## v1.5 Visual Identity Pass (Implemented)
- Established a unified art direction: **Sunset Dunes**.
- Applied consistent warm palette across:
  - sky, hills, cloud lighting, coin glow, vignette, and movement trails.
- Updated platformer UI language to match world palette:
  - themed HUD cards, controls, sliders, and scene badge.

## v1.6 Data + Tooling Pass (Implemented)
- Externalized levels into configuration file:
  - `games/pixel-platformer-levels.js`
- Game now reads levels from config (with fallback).
- Added integrated level editor:
  - editor mode toggle
  - visual tile palette and canvas paint workflow
  - whole-level editing via horizontal pan (slider, buttons, wheel, keyboard)
  - level navigation + clone/delete actions
  - JSON export/import panel (advanced section)
  - shareable level links via URL hash encoding for friend-to-friend play
