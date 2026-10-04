| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T04:27:49.096Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 14 (A vendor can propose on a Code With Us opportunity) do what its criteria say?

**Recommendation.** I made the three changes the ruling asked for: the read-only proposal page, the Proposals tab and the store fix.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made the three changes the ruling asked for: the read-only proposal page, the Proposals tab and the store fix. `npm --prefix app run check` passes for every package under `app/`. The two plan conditions were left alone, as instructed.

**The read-only proposal page.** The router now has `/opportunities/code-with-us/:opportunityId/proposals/:proposalId`, drawn by the new `app/frontend/src/screens/proposal-cwu-view.tsx` and following the catalogue's default story:
- **Heading:** the proponent's name (`proposal-proponent-name`), which is the organization's name for an organization proposal.
- **Facts:** the opportunity, the status, when it was submitted, and the proposal ID (`proposal-identifier`).
- **Score:** shown only when the service includes one.
- **Links and tabs:** the printable-copy link, and the Proposal and History tabs. A vendor also gets a link to the proposal's manage page.

The service decides who may read a proposal: its author, anyone who owns or administers its organization, and staff once the opportunity has closed. Any other reader gets the missing page, and so does a proposal opened through a different opportunity's address. That second case is what R-2.24 asks for when one vendor opens another's proposal. I didn't build entering a score, awarding or disqualifying, because those belong to the evaluation criteria (R-2.26 to R-2.33). The read-only details and history parts are now shared with the manage page.

**The Proposals tab** on the opportunity management screen (`?tab=proposals`). It appears on any opportunity that is no longer a draft, and its contents are in the new `opportunity-cwu-proposals-tab.tsx`. It uses the existing `GET /api/proposals/code-with-us?opportunity=`.
- **Before closing:** the service refuses staff and administrators, and the tab shows a message (`opportunity-proposals-withheld-message`) saying when proposals close. It shows no proponent.
- **After closing:** it lists the submitted proposals, each with its proponent's name, status and submission time, linked to the new read-only page. Drafts are never shown.
- **None submitted:** it says so in words.

The proposal list API can now return a refusal as its own result, so the tab can show the message instead of an error.

**The store fix.** In both create and update, `prisma-cwu-proposal.store.ts` now writes null to the organization column when "An organization" was chosen but none picked. Before, it wrote an empty string into that uuid column and the service failed with a 500. A new end-to-end test saves such a draft, reopens it, picks an organization, removes it again and reopens. I checked that it fails without the fix (500 instead of 201) and passes with it.

**Tests.** Frontend unit tests cover the new screens:
- **Proposal page:** shown to its author, with an individual or an organization proponent; staff see the score or "Not yet scored"; the History tab works; another vendor gets the missing page; so does a wrong opportunity address.
- **Proposals tab:** absent on a draft; withheld from the author and from an administrator while the opportunity is open; lists submitted proposals and never drafts once it has closed; shows the empty message.
- **Accessibility:** an automated accessibility check of both screens.

The design catalogue doesn't show what goes inside the Proposals tab, so I recorded what I chose in `docs/decisions/0057-…`.

**Left for others.** The plan still needs to move R-2.7, R-2.9, R-2.11, R-2.24 and the Sprint With Us and Team With Us cases of R-1.31 and R-2.25 to slice 15. R-8.20 also needs to go to a slice that builds attachments on Sprint With Us and Team With Us opportunities. Until then, those criteria's tests will still reach screens this slice doesn't build.

**What the next slice will find missing:**
- the Sprint With Us and Team With Us proposal screens and their management Proposals tabs;
- scoring, awarding and disqualifying on the proposal page;
- the printable-copy pages the page links to, which return the missing page for now.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether slice 14 (a vendor can propose on a Code With Us opportunity) does what its criteria say. Approve. Verify's result is current for build-slice-14-3 (application tree 2bf1e3d) and all 18 criteria the slice claims pass. That includes R-2.2 at version 2, where both of its tests ran: being taken to the proposal the vendor already holds, and a direct request for a second proposal being refused with 'You already have a proposal for this opportunity.' All three conditions from the build-slice-14-2 ruling were carried out. The read-only proposal page is routed at app/frontend/src/router.tsx and drawn by proposal-cwu-view.tsx; the service lets the proposal's author and its organization's owners or administrators read it and gives any other vendor the missing page. The Proposals tab is in opportunity-cwu-proposals-tab.tsx: before the opportunity closes it shows a message instead of proposals, and after it closes it lists only proposals that are not drafts. The store's organizationOf() now writes null for an organization proponent left unpicked, and an end-to-end test saves such a draft, picks an organization, removes it and reopens it. The diff stays inside slice 14: scoring, awarding and disqualifying are not built, and neither are the Sprint With Us or Team With Us screens. Database access goes through bound parameters and fixed table names, and no secrets are added. The R-2.2 missing-test entry is withdrawn because the request it said could not be sent is now sent by tests/acceptance/proposals/R-2.2.spec.ts, which ran and passed at version 2. This ruling would change if any criterion the slice claims stopped passing, or if verify's result were recorded against an earlier version of the application.

**Conditions:**
- condition-met build-slice-14-2#1: the read-only proposal page is routed at /opportunities/code-with-us/$opportunityId/proposals/$proposalId (app/frontend/src/router.tsx:191) and drawn by app/frontend/src/screens/proposal-cwu-view.tsx; CwuProposalsService.readable gives any other vendor, or a different opportunity's address, the missing page; the frontend unit tests in app/frontend/tests/proposals.test.tsx cover both
- condition-met build-slice-14-2#2: app/frontend/src/screens/opportunity-cwu-proposals-tab.tsx (?tab=proposals) uses GET /api/proposals/code-with-us?opportunity=; before the opportunity closes it shows opportunity-proposals-withheld-message instead of proposals, after it closes it lists submitted proposals and filters out drafts (putForward), and with none it says so in words
- condition-met build-slice-14-2#3: organizationOf() in app/backend/src/proposals/prisma-cwu-proposal.store.ts writes null for an organization proponent with no organization picked, in both create and update; app/backend/tests/code-with-us-proposals-end-to-end.test.ts 'keeps a draft with an organization chosen but none picked' saves, reopens, picks, removes and reopens it
- condition-withdrawn missing-test/R-2.2: the clause it named (a direct create request for an opportunity the vendor already holds a proposal on is refused with a message) is now asserted by tests/acceptance/proposals/R-2.2.spec.ts 'a request to create a second proposal ... is refused', which ran and passed at version 2 in tests/results/new/slice-14.json
