# Forsaken Realm: Blood & Iron — Shared Ideas Hub

**Purpose:** Canonical, cross-session place for agreed ideas, design decisions, questions, and priorities. All ChatGPT Chat and Work sessions and human collaborators should consult this page before proposing or changing related features.

> **Access note:** GitHub makes this file available to anyone with repository access, but a new ChatGPT conversation does **not** automatically read it. Ask the session to open this URL or connect to the GitHub repository. Never assume another chat has seen it.

## How to use this hub
1. Read this file and linked design notes before working on Forsaken Realm.
2. Add new ideas under **Proposed**, keeping the user's wording and intent. Mark decisions **Approved**, **Needs testing**, **Deferred**, or **Implemented** only with supporting evidence.
3. Record dates, links to issues/commits, and open questions. Do not silently replace approved art or decisions.
4. Keep the priority list current; don't treat ideas as implementation requests until the user authorizes the work.

## Current agreed priorities (2026-10-26)
1. Fix the **seven approved menu pictures/screens**, including missing or overlapping buttons, and style all in-game submenus consistently (map, backpack, settings, etc.).
2. **Review Bandit Trader Town in-game before expanding the plan.** Check density of trees, planter boxes, visual details, performance/lag, and whether previously reported invisible enemies/animals are fixed. Continue polishing if needed.
3. Build complete **four-direction flat character, companion, and wildlife models** (sliding is fine initially).
4. Animate the **warrior first**, then other classes and companions.
5. Develop the MOBA-inspired combat interface and effects as priorities allow.

## Approved direction: combat and HUD
See [Combat HUD and Progression](COMBAT_HUD_AND_PROGRESSION.md) for full detail.
- Original **16-bit medieval fantasy** visual style. Reference screenshot informs button placement, **not** copied artwork.
- Bottom-left joystick, bottom-right curved group: basic attack, two skills, ultimate, directional dodge; Map and Menu accessible at top.
- Remove minion/tower buttons from the reference layout.
- **Hold dodge, choose direction, release to dash**; support diagonal movement.
- Cooldowns: basic attack **none** (uses stamina); Skill 1 **5 seconds**; Skill 2 **15 seconds**; Ultimate **30 seconds**; dash **2 seconds**.
- Abilities available at level one, scaling in power with levels. Show cooldown overlays.
- Health and stamina regenerate slowly, with **separate regeneration skills** improved through **earned, player-invested skill points**. Health regeneration in combat requires avoiding hits; stamina can regenerate during combat.
- **Detailed skill tree deferred** until later.
- 16-bit effects: sword slash/sparks, arrows and impact, magic bursts, rogue flashes, paladin glow, necromancer wisps. Keep performance in mind.

## Needs testing / not confirmed
- Whether the last Work update fixed invisible enemies/animals, lag, and trader town density.
- Whether missing/transparent character segments are due to incomplete assets or shared rendering/animation issues.
- Exact stamina costs, regeneration rates, damage-interruption delay, and ability balance.

## Deferred / proposed
- Flesh out class-specific skills and complete skill tree later.
- Fully animate all models only after the flat four-direction foundation and warrior pipeline are working.

## Design source-of-truth rules
- The user's **seven approved menu images** and approved trader-town reference image control visual fidelity; do not replace them with generic designs.
- Keep unverified reports labeled as such.
- Add source links or image paths when confirmed. Never invent missing keys, files, or project assets.
- A chat cannot automatically retrieve other chat transcripts. Capture relevant decisions here so future sessions can find them.

## Change log
- **2026-10-26:** Established shared ideas hub from conversation decisions; linked combat specification.

## Suggested instruction for any new Chat or Work session
> Before doing Forsaken Realm work, read `docs/IDEAS_HUB.md` in `joesiebert79-sudo/forsaken-realm-server`, then follow its linked design notes and current priorities. Update the hub when we approve a new decision.

## Easy cross-chat retrieval phrase (approved 2026-10-26)
- The user should only need to say: **"Check the Forsaken Realm ideas."**
- Any Chat or Work session receiving that request should locate this GitHub repository (`joesiebert79-sudo/forsaken-realm-server`), read `docs/IDEAS_HUB.md`, and follow linked design notes before advising or editing.
- Do not require the user to memorize repository paths or filenames.
- **Important limitation:** This phrase is a convention, not an automatic global trigger; a new session may need GitHub access and must actually fetch the document rather than pretending it has read it.

## Approved: Forsaken Realm Chronicles — living lore book (2026-10-26)
- Create a **page-turning, in-game medieval fantasy book**, titled **Forsaken Realm Chronicles**, with a continuous novel rather than one page per chapter. Chapters should naturally span approximately **10–15 or more turnable pages**, with readable pagination, dialogue, scenes, and coherent chapter continuity.
- **Both reading and listening modes:** a thematic medieval speaker/play control integrated into the book, with **play, pause, resume, and replay**. Narration must follow the written text **word for word**.
- **Automatic page turning synchronized to narration** so listeners can hear an entire chapter hands-free; readers can also manually turn pages with audio off.
- **Remember reading/listening position** across closing and reopening the book, including page and audio progress when feasible.
- Atmospheric, restrained sound design: leather-bound book opening creak, parchment turns, and optional quiet environmental sounds (fire, wind, thunder, combat) that do not obscure narration. Original dark medieval styling consistent with the approved book art; no generic overlay controls.
- The user wants the assistant to **author the lore independently**, while the user occasionally supplies ideas and approves or changes direction; do not demand a choice at every page.
- **Established story foundation:** the realm was once beautiful and prosperous, with **seven kingdoms** and a long peace; magic nourished the land. A forgotten entity beneath an ancient mountain whispered to a king, beginning the downfall. This is developing narrative canon, subject to user revisions.
- **Working opening:** Book I, *The Age of Splendor*; Chapter One, *Before the World Was Forsaken*. Northern kingdom **Vaeloria**, **King Aldric**, royal archivist **Lady Seraphine**, the mountain **Hollow Crown**, and the **Festival of Seven Crowns** appear in the current draft. Preserve continuity when expanding; these details are draft lore, not yet separately ratified.
- **Status:** design and story direction approved; audio/book interaction features are specifications, not verified implementation. Continue writing the novel and later implement the reader as a distinct task.

## Change log addition
- **2026-10-26:** Approved multi-page Chronicles format, synchronized narration/audio controls, automatic page turns, save-place behavior, and opening lore premise.
