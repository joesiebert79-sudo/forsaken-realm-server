# Forsaken Realm: Blood & Iron — Phase 2 and 4 playtest status

Base: `80b2a6276b89481f475824f037762ac9b53e4196`. The owner confirmed Phase 1 passed, chose 100 copper = 1 silver and 100 silver = 1 gold, and approved the **look** of one Warrior idle pilot. The three user-uploaded class, companion, and wildlife references are copied unchanged and pinned by SHA-256 in `references/phase-2-approved/actors.json`.

## What is in gameplay code

- Server animation state records actual character and companion displacement, 16 headings, walk/run timing, and attack/hit/death events. Android class and companion renderers consume a production atlas when a complete reviewed entity exists. Existing visible game sprites remain the fallback. The production atlas index is empty.
- The approved wildlife sheet is bundled in the playtest APK. The Android world renderer shows exact crops from it at server-owned animal positions, interpolates their travel, and lets the player target them. These are **static approved-sheet crops with surrounding sheet background**, not approved animated wildlife sprites. The game menu exposes stalking, tracking, water collection, and carcass harvesting.
- The wildlife catalog accounts for all 55 distinct labeled species/variants and both Coyote occurrences. Server spawning, sight, hearing, wind/scent, fleeing, tracks, wounds, carcasses, fishing targets, and one-time species/quality harvest lots are implemented for authored forest, mountain, plains, wetland, and freshwater areas. Fawns and domestic species cannot be harvested as wild game. The eight desert-labeled species are cataloged but need an authored desert habitat before they can appear without changing the approved world map.
- The existing workshop now receives 53 new draft timed recipes and 101 draft field item definitions. Freshness, provenance, quality, ingredient substitution, species-locked trophies, safe/unsafe water, spoilage, and illness are server-owned. New lot IDs retain their metadata in backpack, chest, corpse, and saved state transfers. The UI leaves new item icons empty until approved item art exists.
- Existing traders show draft field goods in their own categories and process daily server stock, 100:1 coin payments, freshness-aware buyback, and quality-adjusted sales. No newly named proposal has been mislabeled approved. The approved 360-entry catalog remains a separate mapping task because the design document explicitly says its names have not been reconciled to canonical game IDs; `runtimeIntegration` remains false.
- All prior currency changes cover wallet arithmetic, offers, exchanges, merchant/depot funds, caravans, Android display, bank and mission gold denominations. Existing nominal mission/task rewards were preserved; the owner did not approve a reward rebalance.

## Animation and art still required

**Approved production coverage is 0 / 18,720 base character and companion frames.** The supplied plan calls for 13 entities × 16 directions × 90 frames, plus horse rider/mount and raven/dragon flight transitions. One Warrior idle pilot and one Warrior walk pilot are review drafts; only the idle pilot's appearance was approved. Their frame alignment, motion, and all remaining actions/directions require production and review. The new atlas loader does not treat these drafts as production art. Static wildlife sheet crops do not satisfy animal movement animation.

The source's sight radius remains 300 world units; the supplied prompt says 500 meters. No map, building, original menu image, or approved source reference was replaced.

## Verification and limits

- The full server package suite passed after the first wildlife/economy wiring, including update/HTTP flows, currency checks, animation checks, craft/market tests, and wildlife tests. Focused wildlife/field tests passed again after the last balance and market changes.
- All Android Java compiled against API 35. A signed Android 0.94 playtest APK was built with the repository's original art hashes and existing signing key; APK signature, alignment, and package metadata were verified.
- A server snapshot in the authored forest returned 36 spawned animals, 8 in view, 101 field definitions, and 53 recipes. This is a server/client data check, **not** a device playtest or an FPS measurement.
- The APK has not been installed on a device or emulator, and no live server was deployed. The local APK connects to a compatible server running this branch. Runtime visual alignment, full hunting loops, performance, and progression balance still need in-game playtesting.
- The playtest server launcher is `windows/Start-Phase-2-4-Playtest.cmd`; it disables automatic updates and starts the existing isolated development-world preparation. The packaged server bundle includes Node 24. Stop any other Forsaken Realm server before using the playtest launcher.
