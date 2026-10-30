# Approved reference register

Read [the master plan](MASTER-DEVELOPMENT-PLAN.md) first. Verified against main at ac9ff0751724aac33553473e60668671f88a402a on 2026-10-23. “Approved reference” describes provenance, not proof that current gameplay or every pixel matches it.

| Reference | Verified repository location | Meaning / limit |
| --- | --- | --- |
| Menu collection | [Main menu collection](../references/day8-approved/main-menu-collection.png) | Recovered original menu reference |
| Character screen | [Character selection](../references/day8-approved/character-selection.png) | Recovered original reference |
| Store | [Store reference](../references/day8-approved/store.png) | Visual guidance; example prices/text do not override live rules |
| Settings | [Settings reference](../references/day8-approved/settings.png) | Recovered original reference |
| Item atlas | [Item atlas](../references/items-approved/item-atlas.png) | Visual evidence; not the complete named/priced 360-item proposal |
| Provenance | [Reference README](../references/README.md), [checksums](../references/SHA256SUMS) | Existing recovery notes and original checksum manifest |
| Menu behavior | [Menu status](../MENU-STATUS.md) | Implemented scope and device-validation limits |
| Backpack / housing | [Day 4 status](../DAY4-STATUS.md) | Written implementation baseline and remaining concepts |
| Existing building assets | [House sheet](../android/assets/base-houses-v090-final.png), [outbuilding sheet](../android/assets/base-outbuildings-v090-final.png), [sprite index](../android/assets/base-sprite-index.json) | Assets exist; filenames alone do not prove approval of the complete Day 4 concept |

## Approval evidence and missing material

The current user request explicitly confirms Store and Trader Economy v1.0: 360 proposed items, 3 mixed items per General Store category, level-based specialized traders, Gold/Silver/Copper, 25% sellback, 15–40% Flash Deals and cosmetics-only Cash Store.

The retrieved conversation (stable ID 6adbdaa7-3d04-83e9-84cd-8fe46fc45030) contains the user's approval of the list/rules and correction to three mixed items per category with more level-based trader stock. Assistant replies resolve only to content-reference markers; no original price list or attachments were returned. Therefore the exact 360 entries and detailed visual concepts cannot be reconstructed from that retrieval.

The related active chat with stable thread ID `01a164f2-5301-74b3-a911-018f1ddb9e1a` contains an owner request for a permanent economy specification/catalog and 24-hour rotation. It is preparing the reserved economy paths listed in the master plan. Those files and additional restrictions proposed there require verification against their PR and source evidence; this register does not promote unrecovered details to approved policy.

## Recovery queue

| ID | Missing evidence | Owner | Completion requirement |
| --- | --- | --- | --- |
| R1 | Original 360-item proposal with names and prices | Work 1 | Reconcile all entries and source approval; preserve unresolved fields |
| R2 | Exact Backpack Display UI original concepts | Work 2 | Commit original image(s), provenance and checksums; map to acceptance screenshots |
| R3 | Full Day 4 modular/stronghold concept images | Work 2 | Recover originals; record stage/layout mapping and owner approval |
| R4 | Final stronghold upgrade costs and requirements | Work 1 with Joe | Approved schedule linked in spec before runtime changes |
| R5 | Economy spec/catalog PR from active chat | Work 1 | Verify paths, provenance, conflicts and merge SHA |

Do not substitute generated art or current runtime prices for missing originals. Preserve recovered originals unchanged; record variants separately. Each new reference needs repository path, source, approval scope, version/date and checksum. Work 2 maintains this register and Work 1 reviews economy references.

## Stable chat identity

Chat titles can change and are never identifiers. Coordinate by stable thread/conversation ID, role (Work 1 or Work 2), repository and branch. Record the stable ID when Joe assigns a role; do not infer assignment from a title. Titles are optional display labels only. The related thread ID above identifies observed work, not an assigned Work 1/Work 2 role.
