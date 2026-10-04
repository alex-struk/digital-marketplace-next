---
stage: "build"
title: "build slice 14"
at: "2026-10-04T04:27:49.025Z"
cost: 2.9988634000000007
turns: 68
session: "28e4c6a2-a2c8-47f4-9447-88a89e9b2711"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

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