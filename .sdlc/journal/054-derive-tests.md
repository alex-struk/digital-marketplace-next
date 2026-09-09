---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-09T00:13:14.336Z"
cost: 11.489380999999998
turns: 80
session: "cbccf32c-1009-4ee6-ac4d-9ccbe45794bb"
---

I wrote the proposals acceptance suite: 25 spec files holding 52 tests, plus 11 new entries in `not-testable.yaml`, covering all 36 criteria in the list.

**What is not testable, and why.** Eleven criteria all fail on the same wall. An opportunity leaves the published state only by closing at its proposal deadline, a published opportunity cannot be given a deadline in the past, and nothing in the surface makes the request that runs the closing hook. The opportunities stage already recorded this against R-1.1. Everything downstream of a closure goes with it: proposals moving to review and being given anonymous proponent names, the deadline guards on submission, scoring in all three programs, the automatic move to processing, stage ordering, screening and ranking, price and total scores, withholding scores from a vendor, awarding, and disqualification. Each entry names its own missing piece rather than pointing at R-1.1 alone.

**What I covered partially, and said so in the file.** Several criteria have one half on the far side of that wall and one half in reach. I wrote the reachable half with a comment naming what was left. Staff being refused a sight of proposals is testable while the opportunity is open, but not the drafts staying hidden after it closes. A vendor can take away a printable copy of their own proposal, but the staff copy with its anonymous proponent name cannot be reached. Submission confirmations and withdrawal notices arrive in the mail catcher, but award and decision notices need an award. Three other criteria lose a half for a different reason: an attachment that does not exist cannot be named, a resource belonging to another opportunity cannot be named, and a question the opportunity does not ask cannot be answered, because in each case the only action available offers the real thing and nothing else.

**Surface gaps worth closing.** Two are worth the contract's attention.

- **No action names an organization on a proposal management screen.** The Sprint With Us and Team With Us edit screens carry `start_editing`, `save_changes` and the state actions, but no `choose_organization`. R-2.22 is entirely about changing that organization after submission, and R-2.11 has a second route through the same edit path. I wrote R-2.22 by passing the organization through `save_changes`, on the reading that it submits the whole edited form, and said so in the file. A `choose_organization` on `proposal-swu-edit` and `proposal-twu-edit` would make it explicit rather than assumed.
- **No proposal surface names a refusal.** The three create screens offer `field_error` and a few specific notices; the management and view screens offer none at all. So a permission refusal is only ever read as the screen being empty, which cannot be told from the record not being there. R-2.1, R-2.24 and R-2.25 all rest on that reading. An observation such as `refused_when_not_permitted` on the proposal view and management screens would separate the two.

Two smaller things I worked around rather than flagged as gaps. No account the suite can sign in as has never accepted the service's terms, so that clause of R-2.1 has no actor. And no person in the seed carries a display name, so the "who did it" half of a proposal's history has nothing to match against; I asserted the state changes and left the actor alone.

**One judgement call worth reviewing.** Every test builds its own opportunity rather than bidding on the seeded one. The suite runs serially against a database that is not reset between tests, and a vendor may hold only one proposal per opportunity, so sharing an opportunity would make the order tests run in matter. This costs an opportunity build per test and buys independence. Two tests also register an organization of their own, because the seed carries only one qualified supplier and both criteria need a second.

I could not run `tsc` or the suite: `tests/node_modules` is not installed in this workspace, so the types and the assertions are reviewed by hand and unverified by a tool.