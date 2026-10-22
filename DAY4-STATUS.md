# Day 4 playtest — v0.79

This increment combines combat fixes with backpack and base menus. It is not completion of every later stronghold concept.

Implemented: larger persistent health display; UTF-8 source compilation to fix garbled damage text; visible combat feedback; fresh melee selection; deferred taps re-evaluate targets after network requests finish. Original artwork, app identity and signing certificate from v0.78 are retained.

Backpack: individual stack keys, large items and gear occupy separate stacks, bread 4, apples 6, waterskins 3, arrows 20; other small items default to 10. Large nonstackables occupy one grid slot; other stack footprints remain. Construction can consume nearby owned chest supplies. Drag/rotate moves the selected stack; double-tap transfer/drop acts on that stack. Legacy overflow is preserved and can be stored or dropped. Coins stay in the belt pouch and combine at the owner's approved 10:1 ratio; money is removed from the gameplay HUD.

Home & Base is available from the gameplay menu and backpack. It links property information, deed placement, bank/deeds, flag restoration, workbenches, storage and defenses. Existing five house styles, atomic banker deeds, placement preview/rotation, one-property restriction, clan ownership and property-bound basement transitions remain. New homes include a bed and cooking hearth. Resting beside an owned bed takes 10 seconds, restores 10 health and 25 stamina, and cancels on movement, room change, death or damage.

Verification: 29 focused Day 4 and full-map tests, plus currency/save/HTTP checks and signed APK compilation. Actual phone visuals and touch acceptance remain for playtesting.

Still planned: five-stage fortified compounds, climbing/firing platforms and four-tower stronghold; modular approved concept art; transported/snap-placed furniture, wagons/locks, greenhouse/husbandry outbuildings, editable trophy displays and guild upper-floor features. Approved reference images are absent from the recovered source. Existing home prices and building costs remain; no final stronghold upgrade pricing is claimed.
