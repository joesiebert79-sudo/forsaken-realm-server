# Phase 2 and Phase 4 implementation progress

This is a partial implementation, not a completed release. Base inspected: `80b2a6276b89481f475824f037762ac9b53e4196` (main). The owner confirmed Phase 1 passed and selected 100 copper = 1 silver, 100 silver = 1 gold on 2026-10-25.

## Phase 2: characters and companions

- Verified and copied the exact three user-uploaded class, companion and wildlife references unchanged. Their SHA-256 fingerprints are pinned in `references/phase-2-approved/actors.json` and tested.
- Recorded all six classes and seven companions, including the existing `melee` → Warrior, `ranged` → Archer, and `familiar` → Dragon Familiar ID mappings. These mappings do not rename saved characters.
- Added deterministic Java animation timing: 16 directions; idle 12, walk 12, run 16, attack 12, hit 6, death 12, special 16, turn 4; per-action FPS, one-shot replay protection, death hold/respawn, shortest-angle turning. These are presentation helpers, not a new combat or movement simulation.
- Added an optional Android atlas loader with complete-entity validation, feet anchors, RGBA pages, a 2048px page-size cap, and a 32 MiB cache-held bitmap budget. Android may retain evicted bitmap allocations until garbage collection; this is not a measured total-process memory limit. The loader is not connected to the live renderer yet. Its production index is deliberately empty.
- Added a build-time audit which rejects incomplete or unreviewed production entities and detects changes to the exact reference files.
- Produced a 12-cell Warrior idle pilot using the built-in image-generation tool and the exact approved class sheet. The owner approved its **appearance only**. Alignment, temporal consistency and motion remain unapproved. The draft sheet is in `references/phase-2-review/`, never in runtime assets.

**Approved production animation coverage: 0 / 18,720 base frames.** The pilot requests 12 frames in one direction for one action; it is not evidence that any entity's 1,440-frame target is complete. Horse rider/mount transitions and raven/dragon flight transitions are additional work. Existing procedural class and companion renderers have not been replaced. No new companion movement, mount, flight or combat behavior is claimed.

## Currency supporting Phase 4

- Server coin arithmetic, mixed payments, change, resale, item bundles, flash deals, exchange rolls, Android affordability checks, displayed conversion text, and release response now use 100:1 denominations.
- Existing nominal wallet and bank coin counts, named gold prices, mission/task gold rewards, and historical receipts stay intact. One gold now has a 10,000-copper exchange value. This is a denomination change, not approval of new item prices or a reward rebalance.
- Corrected caravan procurement to debit the actual merchant denomination, and merchant-to-depot proceeds to credit that denomination without an unrelated divide-by-ten.
- Saved basic exchange offers and existing item flash quotes update once without resetting remaining stock or financial history. Old saves get a `before-currency-100.sqlite` checkpoint before upgrade.
- Re-expressed all 360 proposed catalog prices using the new denominations while preserving their proposed total-copper amounts. Updated current-reference copper equivalents. `runtimeIntegration` remains false; new proposals and draft balance are not activated.

## Remaining Phase 4 work

Existing code has generic resource harvesting, immediate recipes, hunger/thirst depletion, merchants, inventory quantities and SQLite transaction rollback. These are not the complete requested hunting/survival/economy systems. Still required: full approved wildlife/biome catalog; wildlife sensing, schedules and tracking; species/quality harvest lots; freshness and spoilage across all storage/transfer paths; safe/unsafe water and boiling; the complete named recipe and crafting catalog; merchant specialties and approved stocks; progression, arbitrage analysis, and Android interfaces. No new values have been silently labeled approved.

## Preservation and validation

No existing image, building, map layout, fog implementation or menu layout changed. The source's sight radius is 300 world units; the supplied prompt says 500m. That discrepancy is recorded, not silently changed during character work.

- All supported package test stages passed: menu policy, update policy, update/migration, HTTP integration, and 102 Node tests after the currency changes.
- Three additional animation/reference tests passed: exact source fingerprints and honest coverage, rejection of unreviewed/incomplete atlases, and compiled Java timing/state behavior. Total Node test cases verified: 105.
- The compiled Android currency test compares 1,080 denomination/amount combinations with server results and checks overflow/invalid-input boundaries.
- All Android Java source compiled against Android API 35 using UTF-8, Java source/target 8. Compiler emitted the existing bootstrap/deprecation warnings. No signed APK was produced.
- No device FPS, frame-time, texture streaming, memory or draw-call measurements were performed. No Android emulator or device playtest was performed. No live server was changed, merged or deployed.

Next character milestone: finish reviewing and aligning the Warrior idle pilot, then produce the remaining Warrior action/direction frames against the same approved appearance before activating a production atlas. The other five classes and seven companions remain explicitly in the production queue.
