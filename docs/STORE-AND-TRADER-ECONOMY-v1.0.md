# Store and Trader Economy v1.0

The owner authorized completion of missing item proposals, fair pricing and trader levels. The catalog now contains 360 named entries: 165 existing items and 195 explicitly marked new proposals. New proposals are not claimed as implemented gameplay.

## Currency and pricing

10 Copper = 1 Silver; 10 Silver = 1 Gold. Mixed wallets pay any denomination and receive exact change. Prices are stored as whole Copper with an equivalent display denomination. Starter food and materials remain accessible at level 1. Specialist tiers unlock at levels 1, 5, 10, 18 and 28 and retain earlier stock. Restricted Legendary, Mythic and Unique equipment remains outside ordinary shops.

Sell-back pays 25% of base catalog Copper value, rounded down once for the entire stack. Regional scarcity cannot inflate resale. A 3-Copper item pays 0 for one or 3 Copper for four; a 3-Silver item pays 7 Copper for one or 3 Silver for four. Splitting stacks never increases payout. This authorized pricing correction is implemented separately from the proposed catalog.

## Stores

General Store: three distinct mixed-rarity eligible items per category, shared 24-hour rotation at midnight UTC, deterministic across restart, with purchased quantities persisted. Common/Uncommon/Rare is the preferred mix. Restricted equipment cannot enter the fallback pool. Categories lacking three eligible items must be reported rather than filled with invented live items.

Specialists carry relevant stock only. Both trader hubs remain neutral. Flash Deals use 15–40% discounts in Copper, with rounded effective discount checked. Legendary/Mythic/Unique equipment comes only from Flash Deals, dangerous exploration or bosses. Cash Store is cosmetics only and remains disabled until payment and SKU review.

## Review boundary

[Catalog](../economy/store-trader-v1.catalog.json) includes proposed prices and level assignments for every entry. [Remaining review issues](../economy/store-trader-v1.review.json) distinguishes missing recipes/effects/artwork from completed naming and pricing. No catalog import into live crafting, loot, progression or store rotation occurs before review. Existing names, statistics and saves are preserved.
