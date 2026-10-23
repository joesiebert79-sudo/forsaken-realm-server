# Forsaken Realm v0.89

Map is restored as a visible, touchable HUD shortcut alongside Backpack and Menu. All control presets and screen sizes tested keep it reachable.

The six approved menu screens remain distinct: Main Menu, Play/Character Select, Character Creation, Store, Settings, and Credits. Play appears before creation for new survivors; creation returns to Play after confirmation. Background state refreshes no longer close the creation screen. Additional characters still follow the server's Character Master unlock rules and pricing, rather than resetting an existing character.

Characters now use finer 16-bit-style shading, facial detail, clothing seams, armor highlights and trim. The six classes share a bounded cache of 64 high-resolution frames (under 8 MB of raw pixels). Seven reference companions have distinct shaded models, movement/attack poses and facing: Wolf, Dire Wolf, Horse, War Bear, Raven, Lone Wolf and Familiar. Their separate cache is bounded to 48 frames. These visuals do not change collision, position, damage, riding or saved identities.

The local owner utility windows/Change-Player-Codes.cmd allows custom codes of 6–20 ASCII letters or numbers. Custom codes are case-insensitive and unique. Old generated codes continue working until replaced. Each change backs up the private mapping, keeps the same player ID, and is picked up by the running server. Enter the chosen code in that phone's connection settings. No code-management endpoint is exposed on the network.

Verified for this update: 1,200 character poses and 700 companion poses; transparent sprite bounds; bounded caches; Map touch targets across presets; separate Play/Create/back/confirm interactions; live code rotation through HTTP with the same saved character. Physical phone appearance and performance remain for the owner to test.

The realm menu contains Main Menu, Settings, Mission (active legendary expedition only), Companion, Clan & Kingdom, and Exit Game. Resume closes the overlay. Backpack remains a HUD shortcut. Crafting and building routes remain in the backpack/station screens; Map is directly available on the HUD.

New character selection offers only Melee, Ranged, Mage, Rogue, Paladin and Necromancer. Companion selection offers Wolf, Dire Wolf, Horse, War Bear, Raven, Lone Wolf and Familiar from the approved reference. Male/female appearance and confirmation remain.

Classes have usable starting weapons: sword/shield, bow/arrows, ember staff, dagger, mace/shield/mail, and grave staff. Staff attacks use existing target validation, stamina and cooldowns; ember and grave attacks deal fire and poison damage respectively. No separate spell tree or summoning system is claimed.

Existing pre-reference survivors can choose a reference class once from Play → Choose New Class, outdoors in a protected town, out of combat. Levels, XP, skills, identity, account, inventory and faction are retained. The previous companion is retained in the private account backup; the selected reference companion becomes active. The pack must have room for new gear. Older client creation commands remain accepted for compatibility but older classes are not offered in the new selection.

Crafting hall exterior and map service names are now explicit. Active mission view is read-only away from the board; reward claims remain at the Mission Master.
