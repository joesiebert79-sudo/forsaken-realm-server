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

## Approved trader town names — Chronicles canon (2026-10-26)
- **Trader Town A → Thornhaven.** Historic crossroads trading settlement with stone gates and a blackthorn tree in the central square. Represents the prosperity of the old realm. Saying: *“All roads lead to Thornhaven, but not all travelers return.”*
- **Trader Town B → Ravenshollow.** Trading settlement near dark woods and ruins, known for rare treasures, secret dealings, and whispered ancient magic. Reflects the darkness spreading through the realm. Saying: *“Gold buys passage. Secrets buy survival.”*
- These are the approved narrative names for the two existing trader towns; retain the underlying map locations and all other user-established village/castle names. Use these names consistently in Forsaken Realm Chronicles and future town-label proposals. No game map or asset change is implied by this lore documentation update.

## Approved trader town faction identities (2026-10-26)
- **Thornhaven — Allied Trader Town:** Lawful, good-aligned trading sanctuary protected by peaceful factions and allied kingdoms. Honest merchants, travelers, guards, provisions, weapons, armor and healing supplies. A surviving beacon of the old realm's prosperity.
- **Ravenshollow — Bandit Trader Town:** Bandit-controlled marketplace of outlaws, smugglers, stolen goods, forbidden weapons, and rare artifacts. Rival bandit leaders preserve an uneasy market truce because all factions need trade.
- **Historical connection:** Ravenshollow was once a prosperous, legitimate settlement. When the Seven Kingdoms fell, royal armies abandoned it; outlaws took control over generations. Thornhaven represents what survived; Ravenshollow represents the scar left by the collapse.
- These faction identities are approved lore and should be used consistently in the Chronicles and game planning. Keep existing map placements and previously established names for other locations.

## Approved concept: Fifty Spires of Remembrance — lore-driven map discovery (2026-10-26)
- Place **50 ancient spire-like towers** throughout the game world. Each is activated by answering a question drawn from the actual *Forsaken Realm Chronicles* lore.
- Every activated spire permanently reveals its assigned section of the world map; activating all **50** reveals **100%** of the map. Partition coverage to avoid gaps or unintended full-map discovery before all fifty are completed.
- **Narrative connection:** The spires form an ancient magical signal network from the era of the Seven Kingdoms. A strange blue warning fire from allied **Thornhaven** can propagate across the network; a spire near bandit-held **Ravenshollow** responds with a crimson glow. This ties the current Chapter One signal scene to map exploration.
- **Working lore name:** *Spires of Remembrance*. Each preserves a fragment of history and requires knowledge of that history to awaken. The network fell silent during the kingdoms' collapse and begins stirring again.
- Design intent: link reading/listening to the Chronicles with exploration and progression. Questions should be answerable from accessible lore; allow retry without permanently locking players out. Exact placement, question bank, reveal regions, visual effects and implementation remain to be designed.
- **Status:** user-approved game/lore concept, **not implemented**. Continue authoring the story without repeatedly requesting creative choices.

## Shared Chronicles manuscript (2026-10-26)
- **[Forsaken Realm Chronicles manuscript](FORSAKEN_REALM_CHRONICLES.md)** is the living story text in this same repository, with the opening pages and Spires of Remembrance scene.
- Keep complete prose and page continuity in the manuscript; keep approved decisions and design notes in this Ideas Hub. Future Chat and Work sessions should read both before extending the lore or writing spire questions.
- Draft prose, editorial bridges, and proposed plot threads are labeled distinctly. Update the manuscript as the story develops.

## Chronicles writing rules — chapter-length revision (2026-10-26)
- **[Formal Chronicles Writing Rules](CHRONICLES_WRITING_RULES.md)** govern all future chapters and revisions.
- **Approved chapter length: 4–7 pages per chapter.** This explicitly supersedes the older 10–15+ page target in the initial book concept above.
- Preserve canon, connect the story to the game, save prose in the manuscript, let the assistant lead creative writing, and plan coherent answers to major mysteries.

## Spire distribution by region (2026-10-26)
- **Approved layout principle:** Place **three Spires of Remembrance in each distinct map area/region**, including mountain areas, wilderness areas, and the other established regions. Each spire has its own lore question and reveals its assigned portion of that region's map.
- **Total spire count is derived from the number of regions (3 × region count)**, not a fixed 24 or 50. If there are eight areas, that would be 24 spires; do not assume eight areas until the actual map is confirmed. The earlier 50 and proposed 24 totals are superseded as fixed design targets by the three-per-area rule.
- Activating every spire reveals 100% of the world map. Preserve actual existing map geography and area names; do not invent regions merely to reach a tower count.

## Rotating, non-repeating spire lore questions (2026-10-26)
- **Approved design direction:** Spires draw questions from a large, evolving pool grounded in the published/accessible Chronicles. Do not give every player the same fixed question at a particular spire.
- Select a question at random from the relevant region's pool, excluding questions that player has already been shown **at any spire**. Track question IDs per player across the whole spire network so no question repeats for that player until the pool is exhausted. For multiplayer, each player's question selection and completion are independent.
- Grow the pool as new chapters and historical lore are written. Create multiple genuinely distinct questions per historical fact, with varied phrasing and answer order, but don't rely on cosmetic shuffling as the only anti-sharing measure. Questions must have unambiguous, verifiable answers and references to lore players can access.
- **Practical limit:** A finite question bank cannot guarantee a unique question forever or for every player globally. Guarantee no repeats within a player's run **while unused questions remain**; if exhausted, add questions or clearly defined fallback behavior. Do not make unanswerable or procedurally invented canon.
- Keep the three-spires-per-region rule, permanent reveal on successful activation, and ability to retry failed questions. This is a documented game design, not implemented functionality.

## Latest chapter-length rule (2026-10-26)
**6–9 pages per chapter** is the current approved rule and supersedes every earlier page-count statement in this file. Keep the saga extremely long overall.

## Approved Spires art and multiplayer behavior (2026-10-26)
Creator approved the dark-gothic spire concepts adapted to the game's elevated three-quarter camera. Twelve spire types, each dormant and activated; three spires per map region. Spires become visually lit for everyone after awakening, but lore challenges and map unlocks remain personal. See [Spires of Remembrance design handoff](SPIRES_OF_REMEMBRANCE_DESIGN.md). **Work implements later; concept art image binaries still require upload to repository.**


## Approved faction-selection screen — replaces Character Review (2026-10-26)
- **APPROVED visual design:** the newly generated **Choose Your Allegiance** screen based on the creator's original **Character Review / Step 5 of 6** reference. Preserve its exact gothic Forsaken Realm: Blood & Iron artwork and overall composition; no redesign or generic substitutes.
- Header: **CHOOSE YOUR ALLEGIANCE — STEP 5 OF 6**. Center: display the player's **actual selected character and companion**, not a fixed sample; preserve character/class/gender/companion appearance.
- Left blue-and-gold panel: **ALLIES**, heraldic lion/castle imagery, with protection, kingdom support and allied trading access. Right crimson-and-black panel: **BANDITS**, outlaw camp/skull imagery, with outlaw freedom, bandit settlements and black-market access.
- Interactive selection: selecting either panel highlights that faction, then **CONFIRM ALLEGIANCE** saves the selected faction to the character profile; **BACK** returns to previous creation step. Confirm should not silently choose a default. Ensure responsive landscape Android layout, touch targets and no overlapping/clipped buttons.
- Faction canon: **Thornhaven = allied trader town; Ravenshollow = bandit trader town**. Do not assume every proposed perk is implemented; connect faction mechanics to actual gameplay systems.
- **Original approved generated image:** saved in the 2026-10-26 conversation; the creator has explicitly approved it. **Image binary is not yet confirmed committed to GitHub**. Work must obtain the exact approved image from the creator/conversation and commit it to the approved reference-assets directory, then implement/test the screen. Do not replace it with a newly generated approximation.
- **Status:** APPROVED DESIGN / PENDING ART ASSET COMMIT AND IMPLEMENTATION. Add to the seven-menu repair scope (GitHub issue #6). This entry is the cross-session source of truth.
