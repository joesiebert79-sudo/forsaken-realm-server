# Store and Trader Economy v1.0

Status: owner-approved policy, incomplete item proposal awaiting review. These documents do not activate or change any gameplay system.

## Approved rules

- Target proposal: 360 items. Do not claim the complete proposal exists until all names and entries are recovered and reconciled.
- Currency: 10 Copper = 1 Silver; 10 Silver = 1 Gold. All purchases combine denominations, and change preserves exact total value in Copper.
- Sell-back: 25%. The payout basis and fractional-Copper rounding still require review.
- General Store: 3 mixed-rarity items per category, rotating every 24 hours.
- Specialized traders: level-based stock. Thresholds require review.
- Flash Deals: 15–40% discounts.
- Cash Store: cosmetics only; no stats, progression, capacity, currency, resources or other gameplay advantage.
- Existing trader hubs remain neutral.
- Earlier approved Legendary/Mythic/Unique restriction remains: Flash Deals, dangerous exploration or bosses only.

## Catalog and provenance

[Machine-readable catalog](../economy/store-trader-v1.catalog.json) contains 165 existing progression entries as reference material. Each current price is explicitly marked as a runtime reference, not an approved v1 final price. Proposed prices remain null pending reconciliation/review. No unnamed items were fabricated to reach 360.

The approved item atlas is visual evidence, not a complete named 360-item pricing proposal. The original user item-list image has the same SHA-256 as the retained item atlas.

[Review issues](../economy/store-trader-v1.review.json) records missing data and conflicts. Its blocking issues must be resolved before runtime integration.

## Implementation boundary

Do not import this catalog into runtime trading, crafting, loot, progression, wallets or Cash Store code before review. Preserve existing player data and receipts. This economy review does not prevent the separately authorized menu/interior visual corrections.

## Required acceptance checks after review

Validate all 360 unique item IDs, price units, trader/level assignments, three-per-category rarity mix, stable 24-hour rotation across restart, exact mixed-currency payments/change, 25% sell-back/rounding, 15–40% discounts, restricted loot sources and cosmetics-only cash effects. Test insufficient funds, replay protection, fractional pricing, integer overflow and arbitrage.
