# Forsaken Realm — Shared Master Development Plan

Status: Shared coordination specification. See [approved economy](APPROVED_STORE_TRADER_ECONOMY_V1.md). This is not a claim that features are implemented.

## Two Work streams
**Work 1 — GitHub/backend/economy**, proposed branch `work/backend-economy`: server systems, item catalog/IDs, economy, store stock rotation, trader level gating, persistence, tests.
**Work 2 — Game/world/UI**, proposed branch `work/game-development`: game UI, isometric environments, housing snapping points, crafting interfaces, 16-bit player character art, animation and interaction.

Branches are proposed ownership conventions, not evidence branches already exist.

## Shared approved art and gameplay constraints
- Environments and interiors use the approved consistent isometric reference angle; only player characters are 16-bit.
- Town building functions include Merchant, Missions, Blacksmith, Bank, Crafting & Cooking; character selection uses hunting-room theme.
- Bank interior includes Banker, Mission Giver on far left, and wall quest board.
- Castle: entrance door, stairs down to flat underground landing, visible stairs up to a landing without top door; maze below.
- House: bed and cooking area initially; front door must remain clear. Purchasable crafting/cooking benches snap to designated points; upgradeable tiers retain earlier-tier functionality and require skill/materials. Smokehouse, greenhouse and stable are outdoors.
- Six approved character models and approved companions are design constraints; don't substitute new models without approval.
- Economy requirements live in APPROVED_STORE_TRADER_ECONOMY_V1.md. Cash store is cosmetics-only.

## Coordination and merge rules
1. Each stream edits only its owned areas; agree on interfaces and shared schemas before editing common files.
2. Start from current main; use separate feature branches and pull requests; do not overwrite or force-push the other stream's work.
3. Keep approved design decisions in docs and implementation data in version control; reference exact paths and commit SHAs in handoffs.
4. Backend owns authoritative prices, eligibility, currency conversion and purchase validation; client UI only displays and requests transactions.
5. When blocked or approved data is missing, stop that task and report the exact missing item. Do not repeatedly rescan the repository.
6. Do not merge or deploy without review, tests and explicit approval.

## Handoff checklist
Each Work stream reports: task scope, changed paths, branch/PR, tests run and outcomes, screenshots if UI, known limitations, and next dependency. Mark items 'planned', 'in progress', or 'verified' accurately.

## First milestones
1. Reconcile the 360 proposed economy entries against canonical repository item IDs and resolve trader stock count ambiguity.
2. Commit machine-readable catalog and schema with tests.
3. Implement backend inventory eligibility, rotation and cosmetics-only purchase validation.
4. Connect game UI to backend contracts.
5. Test complete purchase/sell/Flash/Cash flows and house upgrade requirements.

Do not claim this document constitutes implementation.
