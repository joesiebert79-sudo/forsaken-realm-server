# The Forsaken Realm: Blood & Iron — Shared Master Development Plan

Version 1.0 • 2026-10-23 • Documentation and coordination baseline
Owner: Joe • Repository: joesiebert79-sudo/forsaken-realm-server

## Start here

This is the shared entry point for two parallel Work chats. Read this file, [approved reference register](APPROVED-REFERENCE-REGISTER.md), and [coordination ledger](COORDINATION-LEDGER.md) before editing. The owner-approved economy requirements below are binding; implementation proposals and missing details are explicitly identified. This PR changes documentation only. It does not activate economy rules, complete housing, create Work chats, or change gameplay.

Baseline inspected: main at ac9ff0751724aac33553473e60668671f88a402a. Existing README/status version labels describe different increments; do not infer a release's completion from a label. Another active chat, “Update menus and shrink map,” has ongoing menu/interior work and an economy-specification task. Its uncommitted work is not part of this baseline. Check its eventual PR before duplicating those changes. No chat-to-role assignment has been confirmed.

## Ownership boundaries

| Area | Work 1: GitHub/backend/economy | Work 2: game development/UI/world |
| --- | --- | --- |
| Working branch | work/backend-economy | work/game-development |
| Primary responsibility | Server behavior, economy data/specification, validation, persistence, server tests, GitHub integration | Android game screens, controls, rendering, visual assets, world presentation, client validation |
| Typical paths | server/, economy/, backend tests in tests/ | android/src/, android/assets/, android/res/, visual reference inventory |
| Shared areas requiring a named editor | Protocols, server/world.mjs, housing/world server modules, progression data, asset indexes, root status files, shared tests, release metadata | Same shared areas; request backend behavior through a documented contract |
| Review responsibility | Check server authority, pricing, persistence, compatibility and data loss | Check player flow, visual match, touch behavior and world integration |
| Must not do alone | Redesign approved visuals or overwrite client work | Change authoritative prices, level gates, stock, collision/ownership rules or save formats |

Work 1 owns authoritative world/housing behavior even when Work 2 designs the world experience. Assign one editor per shared file for each increment. Work 2 can implement against agreed fixtures while Work 1 implements the server contract. Work 1 coordinates PR integration; Joe resolves approval and design conflicts. These are role responsibilities, not GitHub account assignments.

## Branch and PR workflow

1. Merge this documentation PR through normal review, then create each named work branch from current main if absent. Do not reset an existing branch. At inspection only main existed; this plan does not claim the two work branches are active.
2. Use separate checkouts for the two chats. Begin each increment by recording branch, base SHA, scope, files claimed and dependencies in the ledger. Inspect existing changes before editing.
3. Keep each PR focused. Open Work 1 PRs from work/backend-economy and Work 2 PRs from work/game-development into main. Include requirement IDs, changed paths, dependencies, test evidence, screenshots where relevant, unresolved decisions and save compatibility.
4. Agree the shared contract before either side changes it. Prefer a small contract/data PR first; dependent PRs name the prerequisite PR and commit. Fixtures must be visibly marked as fixtures.
5. Update from main before final validation. Prefer merging main into a shared work branch; never force-push or rewrite another chat's commits. Resolve conflicts with the file owner and retain both intended behaviors.
6. Both roles review cross-boundary changes. Joe decides changes to approved rules and final player-facing acceptance. A role acknowledgement in the ledger must contain evidence; silence is not approval.
7. Merge prerequisite PRs first, then dependent PRs after validation against the merged version. Record merge SHA and tell the next chat where to resume through the ledger. Deployment, release packages and production save migrations are separate tasks.
8. No direct gameplay edits to main, automatic merges, or runtime import of the proposed economy catalog before review. Keep private player data and signing keys out of GitHub.

## Shared source of truth

| Document/data | Purpose and owner |
| --- | --- |
| This master plan | Scope, ownership, gates and approved policy summary; Work 1 maintains with Work 2 review |
| APPROVED-REFERENCE-REGISTER.md | Approval provenance, exact asset locations and missing evidence; Work 2 maintains |
| COORDINATION-LEDGER.md | Task claims, contract decisions, blockers and handoffs; each role updates its own entries |
| ../DAY4-STATUS.md | Existing Day 4 implementation versus remaining concepts |
| ../MENU-STATUS.md | Existing menu implementation and device-validation limits |
| ../references/README.md and ../references/SHA256SUMS | Recovered reference provenance and checksums |
| docs/STORE-AND-TRADER-ECONOMY-v1.0.md; economy/store-trader-v1.catalog.json; economy/store-trader-v1.review.json | Intended economy spec/catalog/review paths being prepared in the other active chat; not verified present on this baseline |

The last row is a reserved handoff destination, not proof of merged files. Work 1 verifies that PR and links it in the ledger. Until then, this plan records the confirmed policy; existing runtime catalogs are implementation references, not the missing approved 360-item proposal. Do not create competing catalogs. Later changes update the canonical file and decision record in the same PR. Chat summaries never silently override approved repository documents.

## Store and Trader Economy v1.0

| ID | Approved requirement | Acceptance evidence |
| --- | --- | --- |
| E1 | 360 proposed items | Reconcile the actual approved proposal to 360 unique stable IDs with names, categories, rarity, prices, sources, trader eligibility and approval provenance; no invented filler |
| E2 | General Store has exactly 3 mixed items per category, using a mixture of rarity | Validate every eligible category has exactly 3 distinct offers with the approved rarity policy; never expose the full catalog as general stock |
| E3 | Specialized traders carry broader, level-based selections | Document each specialty, stock pool and level gate; test below/at/above every threshold; the General Store's three-item cap does not apply |
| E4 | Gold, Silver and Copper | Preserve existing approved conversion: 10 Copper = 1 Silver; 10 Silver = 1 Gold. Test mixed payment and exact change without loss |
| E5 | 25% sellback | Agree payout basis and fractional-Copper rounding, then test server payout and displayed quote agree; do not infer the basis from “25%” |
| E6 | Flash Deals discount 15–40% | Test both bounds, quotes, expiry/revalidation and rounding; displayed and charged prices agree |
| E7 | Cash Store sells cosmetics only | Audit every SKU and effect: no paid gameplay advantages, currency, materials, capacity or progression |

The related active chat records an owner request for a 24-hour General Store rotation. Preserve that requirement in the economy handoff; settle rotation anchor/timezone, shared versus player stock, quantities and restart behavior in review. Do not silently interpret “mixed” as permission to sell every restricted rarity.

Missing economy details: the original complete named 360-item price list, category set, exact rarity mix, specialist counts and level thresholds, sellback basis/rounding, deal scheduling/distribution and cosmetic SKUs/prices. Policies are approved; these unresolved fields are not approved values. Existing runtime pricing, catalog size or a proposed catalog cannot substitute for the missing item proposal.

Known baseline gap: server/item-commerce.mjs uses a fixed approximately 25% Flash Deal helper with denomination rounding; that alone does not prove full 15–40% support. Existing trading/stock/sellback behavior must be audited against E1–E7. Record discrepancies in the economy review file rather than changing gameplay in this documentation PR.

## Backpack Display UI concepts

Carry forward the documented dark-and-gold menu direction and Day 4 backpack behavior. The exact original “Backpack Display UI” concept image was not recovered in this read; visual fidelity remains an evidence gap.

- Backpack remains directly accessible from the HUD. Keep the belt coin pouch in its header, with Gold/Silver/Copper balances; money is removed from the gameplay HUD.
- Show distinct stack identity and quantities. Documented stack limits: bread 4, apples 6, waterskins 3, arrows 20; other small items default to 10. Gear/large items use separate stacks; large nonstackables occupy one grid slot. Preserve other footprints.
- Drag/rotate affects the selected stack. Double-tap transfer/drop affects that stack, not every copy of an item.
- Preserve legacy overflow and allow storage/drop recovery. Display authoritative capacity and errors; do not silently discard items.
- Home & Base is reachable from the backpack and gameplay menu. Construction can consume nearby owned chest supplies under server validation.

Work 1 supplies stable stack IDs, dimensions/rotation, quantities, capacity/overflow, wallet values, allowed actions and rejection responses. Work 2 renders these states and proves selection, rotation, transfers, full-pack errors and pouch visibility on the target phone. Exact layout, additional controls and any undocumented concept must be recovered or reviewed before claiming a visual match.

## Day 4 housing/building plan

The existing Day 4 status is a partial implementation baseline, not completion of the full stronghold plan.

| Track | Preserve documented baseline | Remaining planned work |
| --- | --- | --- |
| Property and placement | Five house styles; atomic banker deeds; preview/rotation; one-property restriction; clan ownership; property-bound basement transitions | Approved modular concept references and staged compound layout |
| Home interaction | Home & Base routes to property, bank/deeds, flag restoration, workbenches, storage and defenses; bed and cooking hearth in new homes | Transported/snap-placed furniture, wagons/locks, editable trophy displays |
| Rest | 10-second rest beside owned bed restores 10 health and 25 stamina; movement, room change, death or damage cancels | Verify client feedback and server interruption behavior |
| Strongholds/outbuildings | Existing costs and home prices remain the baseline | Five-stage fortified compounds; climbing/firing platforms; four-tower stronghold; greenhouse/husbandry buildings; guild upper floors |

Work 2 prepares layouts, modular visuals, placement/interior flows and phone evidence. Work 1 handles authoritative deeds, permissions, resource consumption, placement validation and save migration. Neither invents final stronghold upgrade costs, stage requirements or missing approved art. Review these before implementation of the affected feature.

## Handoff checkpoints

| Gate | Work 1 delivers | Work 2 delivers | Exit condition |
| --- | --- | --- | --- |
| H0: establish baseline | Current main SHA, economy source audit, branch/file claims | Current client/reference audit and file claims | No overlapping editor claims; missing evidence logged |
| H1: approve contract | Versioned commands/state/errors, IDs, pricing units and fixtures | Screen/state mapping and required fields | Both roles acknowledge contract; unresolved product choices isolated |
| H2: economy review | E1–E7 reconciliation, proposed catalog, conflict list | Store/trader/deal/pouch presentation using fixtures | Owner resolves missing values before runtime integration |
| H3: backpack integration | Stack/wallet/overflow transaction evidence | Rendered states and touch-flow evidence | Selected-stack actions, exact balances and recovery pass |
| H4: Day 4 integration | Property/deed/resource/persistence checks | Placement, Home & Base and interior-flow evidence | Baseline preserved; new scoped housing criteria pass |
| H5: merge readiness | Server checks and compatibility evidence at candidate SHA | Client compilation and device/screenshot evidence at candidate SHA | Dependencies merged; both reviews recorded; owner acceptance recorded where needed |

Each handoff includes task ID, source branch/commit, PR, changed files, contract version, test procedure/results, remaining limitations and the exact next action. “Done” without evidence is not a handoff. Milestones are dependency gates, not promised calendar dates.

## Coordination rules

- Read the ledger at session start, before touching shared files and before PR completion. Record progress when scope or dependencies change and at every handoff.
- Claim work before editing; keep one editor for each shared file. If blocked, continue independent work in the owned area.
- A protocol change must document request/response examples, validation errors, authorization, replay behavior and compatibility. Do not guess another role's payload.
- The server remains authoritative for currency, stock, inventory, ownership and building costs. UI estimates cannot authorize a transaction.
- Preserve player IDs, inventory, coins, ownership and saves. Schema changes require explicit migration, backup and rollback evidence in a later implementation PR.
- Log conflicts with source links and competing interpretations. Joe resolves design/economy approval conflicts; technical owners resolve implementation conflicts through review.
- Neither chat's uncommitted directory is a shared source of truth. Use committed docs and PRs; do not copy over active work or assume another chat has received a message.
- This documentation task does not send instructions to other chats. Role assignment and chat activation remain unconfirmed.

## Acceptance criteria for this plan

- Two named roles, exact branches, boundaries, shared-file ownership and PR sequencing are documented.
- E1–E7 are retained without inventing the absent 360-item list or unapproved pricing.
- Backpack and Day 4 requirements are traceable to available status documents, with missing visual evidence identified.
- Reference paths are discoverable; reserved economy paths are clearly distinguished from verified files.
- The PR contains only Markdown documentation, with relative links checked and the base/head diff inspected.
- Gameplay implementation and physical-phone acceptance remain separate and are never claimed by this plan.
