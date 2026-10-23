# Forsaken Realm v0.88

The six reference classes now use lightweight pixel characters in actual gameplay and in selection previews. Male and female variants, four facing directions, walking and attack poses, equipped weapons, shields, and blocking are supported. Character art is rendered into small transparent frames with a shared cache bounded to 128 frames (under 4 MB of raw pixel data). Nearby player snapshots include the actual class, so other clients render the same character. Fire and venom staff attacks have visible projectile effects. This rendering does not change server movement, damage, collision, inventory or progression rules.

Verified: 1,200 rendered class/sex/facing/walk/attack combinations, transparent frame bounds, distinct silhouettes, facing changes, bounded cache, menu confirmation and companion selection, and server-authoritative attacks replicated to another player. Desktop render checks are not physical-phone performance measurements.

The realm menu contains Main Menu, Settings, Mission (active legendary expedition only), Companion, Clan & Kingdom, and Exit Game. Resume closes the overlay. Backpack remains a HUD shortcut. Crafting, building and map routes remain in the backpack/station screens.

New character selection offers only Melee, Ranged, Mage, Rogue, Paladin and Necromancer. Companion selection offers Wolf, Dire Wolf, Horse, War Bear, Raven, Lone Wolf and Familiar from the approved reference. Male/female appearance and confirmation remain. Companion models remain unchanged in this character-rendering update.

Classes have usable starting weapons: sword/shield, bow/arrows, ember staff, dagger, mace/shield/mail, and grave staff. Staff attacks use existing target validation, stamina and cooldowns; ember and grave attacks deal fire and poison damage respectively. No separate spell tree or summoning system is claimed.

Existing pre-reference survivors can choose a reference class once from Play → Choose New Class, outdoors in a protected town, out of combat. Levels, XP, skills, identity, account, inventory and faction are retained. The previous companion is retained in the private account backup; the selected reference companion becomes active. The pack must have room for new gear. Older client creation commands remain accepted for compatibility but older classes are not offered in the new selection.

Crafting hall exterior and map service names are now explicit. Active mission view is read-only away from the board; reward claims remain at the Mission Master.
