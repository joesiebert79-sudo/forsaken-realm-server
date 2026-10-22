# The Forsaken Realm — server

This repository contains The Forsaken Realm v0.77 server, updated from the owner's v0.76 Windows server package.

## Current update

- World dimensions: **49,920 × 33,280**, one quarter of v0.76's width and height.
- Coin conversion: **10 copper = 1 silver; 10 silver = 1 gold**. All carried denominations combine automatically for payment and change.
- Store: offers for all 153 existing game items, with currency selected from item rarity, plus the existing cosmetics and service menus.
- Saved-world migration with a `before-v077.sqlite` database backup. Account IDs, inventories, player codes and balances are retained.
- Version information at `/version.json` and `/health`, and in gameplay snapshots. The server version appears in the shop menu.
- NPC traders can use neutral towns; unavailable destinations no longer interrupt simulation ticks.

The tested overwrite download is [Forsaken-Realm-v0.77-Server-Overwrite.zip](https://github.com/joesiebert79-sudo/forsaken-realm-server/releases/latest/download/Forsaken-Realm-v0.77-Server-Overwrite.zip). Extract its contents into the existing v0.76 server folder while the server is stopped. The ZIP intentionally contains no player data or bundled runtime; the existing installation supplies those.

## Verification

Use Node.js 24:

```sh
npm test
```

Tests cover currency conversion, payment/change, item offers, menus, duplicate purchases, map migration, database backup/reopen, authenticated HTTP requests and simulation startup. A separate migration check was also run against a world produced by the original v0.76 package using its bundled Windows runtime.

## Scope

This is the existing authenticated LAN development server, not an Internet-ready game host. Player identities come from the existing private `players.json`. Never commit player codes, databases, connection information or credentials.

The Android client and APK are not part of this update. Adding a server version endpoint does not add an update prompt to an existing Android client. No new APK is built. Server overwrite downloads are published as GitHub release assets. Share the latest-release download link for Discord.
