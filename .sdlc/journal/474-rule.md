---
stage: "rule"
title: "build-slice-14-2 refused at G3"
at: "2026-10-04T04:03:33.622Z"
cost: 1.9759526
turns: 14
session: "4e0ca2de-4502-4be1-a539-7a404aeaead5"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

## Nothing was ruled

The ruling was refused, so no gate file was written and the proposal is still open at G3.

rule build-slice-14-2: "app/frontend/src/router.tsx: serve the proposal-cwu-view screen drawn in design/catalogue/proposal-cwu-view.*.stories.tsx at /opportunities/code-with-us/:opportunityId/proposals/:proposalId. A vendor opening a proposal they may not read (another vendor's) must get the screen's not-found state, as GET /api/proposals/code-with-us/:id already refuses it. Verify reported proposal-cwu-view.open unbound for R-2.24 'a vendor never sees another vendor's proposal'." asks for design/catalogue/proposal-cwu-view, which build cannot deliver — build delivers app, docs/decisions, and everything else its workspace carries is there to be read. A condition it cannot carry out is one it either fails at or finds a way round, and the second is reported as done. design delivers it. Address the condition there instead:
  addressed-to design: <what that stage has to change, and what showed it>

Nothing is recorded — the guard refuses before anything is written. What this ruling produced:
  verdict: return
  conditions:
  - "addressed-to design: draw the Proposals tab on opportunity-cwu-edit that the contract surface names as opportunity-cwu-edit.proposals_tab (test id opportunity-tab-proposals), reachable at ?tab=proposals. While the opportunity is published and before its deadline it tells the opportunity's author and an administrator that proposals cannot be seen yet. Once the opportunity has closed it lists the submitted proposals and never a draft (R-1.31, R-2.25). Verify for slice 14 reported the management screen offers only Summary, Opportunity, Addenda and History, and design/catalogue holds no opportunity-cwu-edit proposals story to build it from."
  - "app/frontend/src/router.tsx: serve the proposal-cwu-view screen drawn in design/catalogue/proposal-cwu-view.*.stories.tsx at /opportunities/code-with-us/:opportunityId/proposals/:proposalId. A vendor opening a proposal they may not read (another vendor's) must get the screen's not-found state, as GET /api/proposals/code-with-us/:id already refuses it. Verify reported proposal-cwu-view.open unbound for R-2.24 'a vendor never sees another vendor's proposal'."
  - "addressed-to plan: slice 14 (Code With Us proposals) claims R-2.7, R-2.9, R-2.11, R-2.24 and R-8.20, whose tests need Sprint With Us and Team With Us proposal screens (proposal-swu-create, proposal-twu-create) and attachments on Sprint With Us and Team With Us opportunities. The same holds for the Sprint With Us cases of R-1.31 and R-2.25 (opportunity-swu-edit.proposals_tab). None of these are in this slice: the backend proposals module says Sprint With Us and Team With Us proposals arrive in slice 15, and the SWU/TWU opportunity create screens say files cannot be attached in this version. Verify reported each as unbound for that reason. Move these claims to the slice that delivers those screens, or split the criteria's CWU cases from the rest."

## What the ruling produced

**Verdict:** return
**By:** agent:reviewer

Question: does slice 14 (a vendor can propose on a Code With Us opportunity) do what its criteria say? Ruling: return. Verify is unbound against the current tree 80f368e: 18 of 25 claimed criteria pass and 7 are unbound, so nothing is established about those 7 and an approval is refused. The unbound rows have three causes. (1) The CWU opportunity management screen has no Proposals tab, and the design catalogue never drew one for opportunity-cwu-edit (its stories are default, draft, editing, incomplete, under-review, addenda-tab, history-tab and the confirms), so R-1.31 and R-2.25 cannot be exercised; that is design's to supply. (2) proposal-cwu-view is drawn in the catalogue, but the branch serves no route at /opportunities/code-with-us/:opportunityId/proposals/:proposalId, so R-2.24's 'never sees another vendor's proposal' case is unbound; that is build's. (3) R-2.7, R-2.9, R-2.11, R-2.24's organization-heading case and R-8.20 require Sprint With Us and Team With Us proposal screens or SWU/TWU opportunity attachments, which the branch's proposals module defers to slice 15. The same applies to the SWU cases of R-1.31 and R-2.25. Slice 14 claims criteria it was never planned to deliver; that is plan's. The CWU-specific work that was exercised looks sound: create/submit/withdraw/delete rules, the per-vendor and per-organization uniqueness, the deadline and terms checks, and one read rule for proposal attachments across programs. What would change the ruling: a current verify result with no unbound or failing rows for the criteria the slice claims, after plan re-scopes the claims, design adds the tab, and build serves the view route.

**Conditions:**
- addressed-to design: draw the Proposals tab on opportunity-cwu-edit that the contract surface names as opportunity-cwu-edit.proposals_tab (test id opportunity-tab-proposals), reachable at ?tab=proposals. While the opportunity is published and before its deadline it tells the opportunity's author and an administrator that proposals cannot be seen yet. Once the opportunity has closed it lists the submitted proposals and never a draft (R-1.31, R-2.25). Verify for slice 14 reported the management screen offers only Summary, Opportunity, Addenda and History, and design/catalogue holds no opportunity-cwu-edit proposals story to build it from.
- app/frontend/src/router.tsx: serve the proposal-cwu-view screen drawn in design/catalogue/proposal-cwu-view.*.stories.tsx at /opportunities/code-with-us/:opportunityId/proposals/:proposalId. A vendor opening a proposal they may not read (another vendor's) must get the screen's not-found state, as GET /api/proposals/code-with-us/:id already refuses it. Verify reported proposal-cwu-view.open unbound for R-2.24 'a vendor never sees another vendor's proposal'.
- addressed-to plan: slice 14 (Code With Us proposals) claims R-2.7, R-2.9, R-2.11, R-2.24 and R-8.20, whose tests need Sprint With Us and Team With Us proposal screens (proposal-swu-create, proposal-twu-create) and attachments on Sprint With Us and Team With Us opportunities. The same holds for the Sprint With Us cases of R-1.31 and R-2.25 (opportunity-swu-edit.proposals_tab). None of these are in this slice: the backend proposals module says Sprint With Us and Team With Us proposals arrive in slice 15, and the SWU/TWU opportunity create screens say files cannot be attached in this version. Verify reported each as unbound for that reason. Move these claims to the slice that delivers those screens, or split the criteria's CWU cases from the rest.
