# Forsaken Realm: Blood & Iron — Combat HUD and progression decisions

Status: **Approved design direction; not yet implemented.** Updated 2026-10-26.

## Combat HUD
- 16-bit dark fantasy / medieval MOBA-inspired HUD; original dark iron, worn leather, subtle ember accents.
- Movement joystick at bottom left. Curved combat-button cluster at bottom right, with large basic attack button. Permanent Map and Menu controls at top.
- Five combat controls: basic attack, Skill 1, Skill 2, Ultimate, directional Dodge/Dash.
- Remove the reference game's minion and tower targeting buttons. Keep battlefield visible and Android landscape touch targets comfortable.
- Dodge: hold dodge button, aim direction with movement input, release to dash; support diagonals. Short 16-bit motion trail.
- Show cooldown countdowns and overlays on skill buttons.

## Combat rules (provisional tuning values)
| Action | Cooldown | Resource |
| --- | --- | --- |
| Basic attack | None | Stamina |
| Skill 1 | 5 seconds | Stamina cost, TBD |
| Skill 2 | 15 seconds | Stamina cost, TBD |
| Ultimate | 30 seconds | Stamina cost, TBD |
| Directional dash | 2 seconds | Stamina cost, TBD |

- All five abilities available from level 1. Their power scales with level.
- Keep effects faithful to 16-bit style and performance-conscious.

## Recovery and progression
- Health and stamina regenerate slowly; regeneration rates improve through player-invested skill points.
- Stamina regenerates during combat, including while moving, subject to resource spending.
- Health regenerates during combat when the character is not being hit; damage temporarily interrupts recovery. A three-second recovery delay was suggested, **not yet finalized**.
- Players earn skill points as they level up and choose where to invest them, including separate health and stamina regeneration skills.
- Detailed skill tree and exact resource costs/rates to be revised later.

## Development order and checkpoints
1. Fix all seven approved menu screens and extend consistent visual treatment to game submenus; no overlapping/missing buttons.
2. Player reviews the Bandit Trader Town in-game: tree density, planter boxes, scenery, visual effects, lag; verify prior invisibility and performance fixes. Iterate if needed.
3. Add complete four-direction flat sprites for characters, companions, animals and wildlife (sliding movement acceptable initially).
4. Fully animate warrior first, then expand to remaining classes and companions.
5. Implement/polish the above combat HUD and systems when the current priorities permit.

This document is a shared design handoff for future ChatGPT Work sessions and contributors; it does not assert that the game code has been changed.
