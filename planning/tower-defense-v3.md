# Tower Defense v3 Plan

## Phase 1 - Tower Skill Trees
- Branch choice on first upgrade per tower.
- Branches implemented:
  - Power: stronger direct damage scaling.
  - Control: stronger utility/range/multi-target scaling.
Status: implemented

## Phase 2 - Active Abilities
- Added player-cast abilities with cooldowns:
  - EMP (area stun)
  - Meteor (area damage + burn)
  - Overclock (global tower fire-rate boost)
- Cast flow: select ability, click canvas target (except Overclock which is instant).
Status: implemented

## Phase 3 - Map Variety
- Added map selector with two maps:
  - Estuary
  - Canyon
- Added route-aware placement/path rendering and deterministic seeded runs.
Status: implemented

## Phase 4 - Enemy AI Expansion
- Added special archetypes and behaviors:
  - Warden (shield)
  - Mender (area heal)
  - Jammer (tower freeze pulse)
  - Splitter (spawns children on death)
  - Specter (temporary stealth)
  - Juggernaut (milestone wave boss unit)
- Added milestone wave compositions every 5 waves.
Status: implemented

## Phase 5 - Analytics & Replayability
- Added seeded runs + Daily seed shortcut.
- Added combat contribution summary (total damage + best tower).
- Added end-run summary overlay with wave/kills/gold/damage/best tower.
Status: implemented
