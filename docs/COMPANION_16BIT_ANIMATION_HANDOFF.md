# Forsaken Realm — 16-bit companion motion handoff for Work

Status: **Implementation specification; motion frames NOT yet created.** This file is the authoritative handoff for Work to produce actual animation assets and integrate them into the game. Do not substitute the static seven-companion concept sheet for a sprite atlas.

## Approved visual reference
Seven companions in the newly generated 16-bit reference sheet: Wolf, Dire Wolf, War Bear, Raven, Lone Wolf, Dragon Familiar, Horse (rideable mount). Maintain their distinct appearances. The concept sheet was generated in ChatGPT; it is not yet confirmed to exist in this repository. Obtain its actual image file from the conversation and commit the source/reference asset before extracting or redrawing sprites. Do not invent a repository image path.

## Proposed frame counts
| Companion | Idle | Walk | Run | Attack | Hit | Death | Special |
|---|---:|---:|---:|---:|---:|---:|---|
| Wolf | 4 | 6 | 8 | 6 | 3 | 6 | Howl |
| Dire Wolf | 4 | 6 | 8 | 6 | 3 | 6 | Rending Bite |
| War Bear | 4 | 6 | 8 | 6 | 3 | 6 | Crushing Maul |
| Raven | 4 | 6 | 8 | 6 | 3 | 6 | Fly/land |
| Lone Wolf | 4 | 6 | 8 | 6 | 3 | 6 | Rending Bite |
| Dragon Familiar | 4 | 6 | 8 | 6 | 3 | 6 | Ember Bite |
| Horse | 4 | 6 | 8 | 4 | 3 | 6 | Mount/dismount, ridden idle/walk/run |

Counts are proposals, not completed frames. Animate in 8 directions (N, NE, E, SE, S, SW, W, NW), unless existing engine supports fewer directions; if so document adaptation. Avoid simple horizontal flipping for asymmetrical equipment or wings when visually incorrect.

## Motion timing (starting targets; tune in engine)
- Idle: 4 FPS loop
- Walk: 8 FPS loop
- Run: 12 FPS loop
- Attack: 10 FPS one-shot, with damage event on contact frame (not every frame)
- Hit: 10 FPS one-shot, return to prior valid state
- Death: 8 FPS one-shot, freeze on final frame until removal/respawn
- Specials: 8–12 FPS one-shot, game-event synchronized
- Raven and familiar flying: 10–12 FPS looping wing cycle; landing/takeoff as transitions
- Horse mounted locomotion: match server speed and rider position, no rider clipping

## Data contract
For each companion, provide sprite atlas PNG(s) with transparent backgrounds and machine-readable atlas metadata (JSON). Each animation entry should include `companionId`, `state`, `direction`, `fps`, `loop`, `frames[]` (x,y,w,h,durationMs), `anchor` (ground-contact origin), `collisionBounds`, `visualBounds`, and optional `events[]` (hit, skill, footfall, mount/dismount). Use consistent pixel scale and nearest-neighbor filtering; avoid blurry resampling. Derive final pixel dimensions from existing `CompanionSprites.java` and asset pipeline, not invented values.

## State transitions
Idle ↔ Walk ↔ Run from actual movement velocity. Attack/special interrupt locomotion only when allowed by combat rules. Hit interrupts or blends per engine rules. Death overrides all states. Flying companions keep altitude and ground-shadow anchors separate. Horse mount/dismount requires validated server ride state and player/horse alignment; player sprite rides above horse without changing the approved 16-bit character style.

## Existing implementation touchpoints
- `android/src/com/morongaming/forsakenrealm/CompanionSprites.java`
- `android/src/com/morongaming/forsakenrealm/ClassSprites.java`
- `server/companions.mjs` (includes `REFERENCE_COMPANIONS`, `rideCompanion`, `dismount`)
- `server/companion-progression.mjs`

The code currently uses `familiar` for the dragon familiar, and `horse` for the rideable mount. Verify all other canonical IDs in code; do not rename network IDs based on display labels.

## Work deliverables and acceptance tests
1. Commit the concept art reference, properly licensed/owned, in a discoverable repository asset path.
2. Create actual drawn animation frames for all seven companions and required directions/states, with consistent style and transparent backgrounds.
3. Add machine-readable atlas metadata and runtime animation state selection in Android client.
4. Wire attack/hit/death/special events to existing authoritative server logic; avoid client-side damage decisions.
5. Wire horse mount/dismount and rider anchoring to the existing server state; test movement, turning and dismounting.
6. Validate atlas bounds, frame counts, no missing direction/state keys, correct animation loops, and no clipping; capture in-game screenshots/video.
7. Deliver PR link, changed paths, tests run, and known gaps for owner approval. **Do not claim implementation complete until these tests pass.**

Do not merge or deploy without owner approval.
