# Coordination ledger

Canonical plan: [MASTER-DEVELOPMENT-PLAN.md](MASTER-DEVELOPMENT-PLAN.md).
Update this file through the owning branch/PR. Read the latest main and open PR versions before claiming shared files.

## Initial state — 2026-10-23

- Baseline: main at ac9ff0751724aac33553473e60668671f88a402a.
- Work 1 role: GitHub/backend/economy; branch work/backend-economy; chat assignment unconfirmed.
- Work 2 role: game development/UI/world; branch work/game-development; chat assignment unconfirmed.
- The two role branches were absent when inspected. This documentation PR creates neither branch nor chat.
- Related active chat: “Update menus and shrink map.” Ongoing menu/interior work and economy specification/catalog preparation are observed; implementation/PR status must be checked before integration.
- This chat's scope: shared documentation only on docs/shared-master-development-plan.
- No other chat was messaged or reassigned by this task.

## Task board

| Task | Owner | Status | Dependency / evidence |
| --- | --- | --- | --- |
| PLAN-1 Shared plan and reference index | Documentation author | Prepared for PR review | Markdown-only diff; master plan and reference register |
| SETUP-1 Confirm role-to-chat assignments and establish work branches | Joe / both roles | Pending | Merge plan; inspect existing branches and active changes |
| ECON-1 Reconcile economy spec/catalog handoff | Work 1 | Pending | Related active chat's PR; R1 and R5 |
| UI-1 Recover Backpack Display concepts and audit current states | Work 2 | Pending | R2; Day 4 status |
| HOME-1 Scope Day 4 next increment | Both roles | Pending | R3/R4 and housing contract |
| CONTRACT-1 Agree inventory/economy/housing interface | Work 1 lead; Work 2 review | Pending | H1; exact candidate commit and fixtures |

## File claims

No gameplay files are claimed by this documentation task. Before implementation, append a row:

| Task | Role / chat | Branch and base SHA | Claimed paths | Shared-file editor | Dependency PR | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Example (template only) | Work 1 or Work 2 | branch + SHA | exact paths | one named editor | URL or none | claimed / released |

## Decision record

| ID | Decision | Authority | Status |
| --- | --- | --- | --- |
| D1 | Preserve E1–E7 economy rules | Current user request | Approved policy; missing item details unresolved |
| D2 | Preserve 10:1 denomination conversion | Repository README and Day 4 status | Existing approved baseline |
| D3 | Preserve 24-hour rotation in economy handoff | Owner request observed in related chat | Required; anchor/stock semantics unresolved |
| D4 | Separate roles and use exact named work branches | Current user request | Plan defined; activation pending |
| D5 | Reserve existing economy task paths rather than duplicate catalog | Coordination choice in this plan | Proposed through this PR |

Further decisions must include date, source/PR, alternatives, affected contracts and explicit approver. Technical proposals are not owner approval.

## Handoff template

- Task / checkpoint:
- From role and chat:
- To role:
- Branch, commit SHA and PR:
- Changed files / released claims:
- Requirement IDs and contract version:
- Request/response or fixture examples:
- Validation procedure, results and evidence:
- Save/client compatibility and rollback:
- Missing decisions / blockers:
- Exact next action:
- Receiving acknowledgement, date and evidence:

## Merge / acceptance record

Pending. After each merge record PR URL, merged SHA, validation commit, both role reviews, owner acceptance where required, and which task/checkpoint is now unblocked. Do not mark physical-phone validation complete from a compiler or screenshot test.

## Stable chat identity

Chat titles can change and are never identifiers. Coordinate by stable thread/conversation ID, role (Work 1 or Work 2), repository and branch. Record the stable ID when Joe assigns a role; do not infer assignment from a title. Titles are optional display labels only. The related thread ID above identifies observed work, not an assigned Work 1/Work 2 role.
