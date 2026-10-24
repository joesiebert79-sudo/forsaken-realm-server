# APPROVED — Forsaken Realm: Blood & Iron — Store & Trader Economy v1.0

Status: **Approved by project owner in ChatGPT conversation.** This document records design decisions; it is not proof of implementation.

## Currency
100 copper = 1 silver; 100 silver = 1 gold. Store and trader regular buy prices use the approved proposed catalog; sell-back is 25% of normal buy price, rounded to whole copper.

## Catalog
360 proposed item definitions: 20 categories × 6 rarities × 3 items per rarity. Categories: Swords; Axes & Maces; Bows & Crossbows; Daggers & Spears; Helmets; Chest Armor; Gloves & Boots; Shields; Mining & Logging Tools; Fishing & Farming Tools; Crafting Materials; Ores & Ingots; Wood & Stone; Leather & Cloth; Herbs & Alchemy; Food & Cooking; Potions & Consumables; Furniture & Decorations; Building Supplies; Crafting Station Upgrades.

Rarities: Common (×1), Uncommon (×3), Rare (×9), Epic (×27), Legendary (×81), Mythic (×243).
Category base prices in copper, in category order above: 120, 110, 115, 95, 90, 160, 70, 105, 80, 65, 12, 20, 8, 14, 10, 18, 45, 75, 35, 130.
Three items in each category/rarity have base multipliers ×1, ×1.3, ×1.6. Price = round(category base × rarity multiplier × item multiplier) copper. Sell price = round(buy price × 0.25). These are proposed prices approved for design, not evidence of existing server values.

**Important limitation:** The 360 named item definitions were authored in the conversation, not yet validated against game asset IDs. The canonical item list and exact IDs must be reconciled before gameplay implementation. Do not invent mappings.

## General Store
Exactly **3 mixed-rarity items per category** displayed at any time (not 3 per rarity). Rotate every 24 hours. Do not allow an extra Flash Deal slot to circumvent this cap. Item availability may be restricted by progression.

## Level-based specialist traders
Stock expands with player level, preserving access to lower tiers:
- Level 1–10: Common, 6 items/category
- Level 11–20: Common–Uncommon, 8 items/category
- Level 21–30: Common–Rare, 10 items/category
- Level 31–40: Common–Epic, 12 items/category
- Level 41–50: Common–Legendary, 14 items/category
- Level 51+: Common–Mythic, 16 items/category

Traders specialize by profession (e.g., blacksmith, carpenter, alchemist). Item level, skill, and crafting material requirements remain enforced. Legendary/Mythic equipment should be gated by specialist traders or progression; not universally available. **Open implementation issue:** only 3 items exist per rarity/category; the 6-item Common stock and some later targets exceed unique eligible definitions. Resolve by approved broader trader categories or additional catalog entries, not by silently duplicating stock.

## Flash Deals
15–40% discount on eligible normal items using in-game currency. Rotate every 24 hours. Discounted items count toward the 3-slot category cap.

## Cash Store
**Cosmetics only**. Permitted: outfit/armor skins, weapon/shield skins, mount appearances, hairstyles, housing decorations, banners, emotes, cosmetic pets. No stats, progression advantages, resources, currency, equipment, skill boosts, crafting speed boosts, or pay-to-win mechanics. Cosmetic rarity is visual only.

## Implementation handoff
This is the shared approved design source of truth. Backend Work should map item names to canonical IDs, validate stock constraints and price math, then implement in an isolated branch and submit a PR with tests. Game Work should consume the same schema and render store/trader UI without independently changing economy rules. Do not claim implementation complete until commit, tests and running behavior are verified.
