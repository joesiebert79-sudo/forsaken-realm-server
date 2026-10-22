# Forsaken Realm

[Download the latest Android app and Windows server](https://github.com/joesiebert79-sudo/forsaken-realm-server/releases/latest).

v0.81 fixes app update checks when returning to the app, retries temporary connection failures, and adds Settings > General > Check for app updates. Android still asks you to approve installation. It uses the same v0.80 server.

v0.80 adds the approved dark-and-gold menu layouts, stocked market categories, portable base furnishing kits, and exact-value coin exchange. Combat readability, backpack stacks and Home & Base menus are included. See [Day 4 status](DAY4-STATUS.md) for implemented features and remaining stronghold work.

World: 49,920 × 33,280. Coins: 10 copper = 1 silver; 10 silver = 1 gold. Old saves migrate with a backup; player codes and inventories are preserved.

The Android app keeps the original picture and name Forsaken Realm. v0.81 updates the v0.78/v0.79/v0.80 app in place using the same signing key. Update prompts check app-release.json at launch. Android requires installation approval. Pairing and gameplay use the same local network as the Windows server.

Stop the Windows server before extracting the server ZIP over its folder. It includes Node.js; it contains no private player data or signing keys.

Use Node.js 24 and npm test for the supported regression suite. Android source compilation must explicitly use javac -encoding UTF-8. Signing keys are private and must never be committed.
