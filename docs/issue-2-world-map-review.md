# Issue #2 — world map replacement review

Status: **implementation candidate; visual approval pending**. Do not merge or
publish an Android APK until the owner has reviewed actual in-game screenshots.

The five authoritative, byte-preserved reference images are in
[`references/world-map-approved/`](../references/world-map-approved/README.md).
The map shown by the Android full-screen Map button uses the approved map image.
At map zoom, saved property and building markers still use live server
coordinates. Fog of war is disabled only on this full-screen map; gameplay and
minimap visibility are unchanged.

The active Day 4 server world now has 12 named villages, two neutral protected
trader towns, five castles, traced inter-settlement roads, connecting paths,
rivers, forests, marsh, mountains and coastal wilderness. It retains the existing
world database path. A one-time migration moves outdoor saves from the old
three-settlement layout and creates a `.before-world-v1.sqlite` backup before
modifying a saved database. The original IDs and relative positions of the 15
existing Stonehollow houses are retained, along with trader IDs and interiors.
Approved house, trader, castle, character and companion art and progression code
has not been changed. Existing crafting, home upgrades, banking, trading,
multiplayer and caravan logic remains in place.

The old rejected `android/assets/approved-world-map.png` has been replaced by
the approved map reference; the original is preserved in the repository's
reference folder. The Android map reads the new `approved-world` server profile.
The server streams local terrain, resources and encounters around the player to
avoid loading the entire expanded world during play.

Automated verification: 94 server tests pass, including new geography, path
clearance, save relocation and caravan routes; HTTP startup passes; Android Java
sources compile with the local Android SDK. Actual device/emulator play and
performance checks, and the required five in-game screenshots, are outstanding.
This workspace has no Android emulator or connected test device. A static image
of the approved reference must not be presented as an in-game screenshot.

Required visual review captures: full world map, one village, one trader town,
wilderness between settlements, and an approved house in the new environment.
After the owner approves those visuals, prepare and publish the signed Android
and server update together.
