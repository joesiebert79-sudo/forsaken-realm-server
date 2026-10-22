# Forsaken Realm

Matched Android app and Windows server, v0.78.

[Download the current release](https://github.com/joesiebert79-sudo/forsaken-realm-server/releases/latest). Both the Android APK and Windows server ZIP are published together. The Source ZIP contains the complete Android artwork and source, plus the server source.

The app keeps the original picture and uses the name Forsaken Realm. After initial pairing with your permanent player code, it reconnects on launch. Local server discovery uses UDP 8789. App updates are checked at launch; verified downloads open Android’s installer with your approval. The new app identity is com.morongaming.forsakenrealm.app; its private signing key is kept outside this repository for future updates.

Gameplay, minimap and world map use server terrain coordinates. World dimensions are 49,920 × 33,280. The server migrates old maps once and creates a before-v077.sqlite backup. Coins combine for payment and change: 10 copper = 1 silver; 10 silver = 1 gold. Stores include all 153 existing items with rarity-based prices.

For an existing Windows server, stop it and extract the server ZIP into its folder, allowing replacement. It includes Node.js. Existing player data and player codes are retained. The phone and server must be on the same local network; this release does not provision public Internet hosting.

Verification: Android compilation, APK signature and alignment checks; server currency, menus, migration, authenticated HTTP and persistent simulation tests. A physical Android device has not been tested.

Use Node.js 24 to run node test-update.mjs and node test-http.mjs. No player identities, databases, signing keys or credentials belong in source control.
