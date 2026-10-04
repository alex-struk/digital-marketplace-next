---
stage: "build"
title: "build slice 20"
at: "2026-10-04T19:12:12.778Z"
cost: 4.298679600000001
turns: 67
session: "10a367a9-67b3-4a51-a3c1-782ad1eda16b"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I built slice 20: R-2.37, R-2.38 and R-1.40, for all three programs. `npm --prefix app run check` passes: typecheck plus 16 + 845 + 524 unit tests across the three workspaces. I couldn't run the sandbox or look at a page here, so all of this is proven by unit tests only. Nothing outside `app/` and `docs/decisions/` was touched, and nothing on the list needed a change to the plan, spec, catalogue or seed.

**No new service work.** The contract has no export or report operation, so all nine new pages are built in the browser from reads the service already answers. That means the service's existing rules decide who can read what, and where it refuses or has nothing, the page shows the shared not-found page. The routes are in `app/frontend/src/router.tsx`. The yes/no rules live in a new `app/backend/src/rules/exports.ts`, which the pages import through `@rules`. Decision record 0066 explains all the choices.

- **R-2.37, printable copy of one proposal** (`/opportunities/<program>/:opportunityId/proposals/:proposalId/export`): built from the stories, with the document under `proposal-export-document` and the proponent's name under `proposal-proponent-name`.
  - For Sprint With Us and Team With Us, staff see the anonymous name ("Proponent 1") plus a sentence saying the name is withheld, while the proposal is still submitted or at its questions stage (`SUBMITTED`, `UNDER_REVIEW_QUESTIONS`, `EVALUATED_QUESTIONS`). From the code challenge (or the challenge) on, they see the organization.
  - The vendor always sees their own organization's name. Code With Us is never made anonymous.
  - "Back to the proposal" goes to the manage page for the vendor and to the read-only page for staff. "Print" calls the browser's print.
  - The Sprint With Us and Team With Us manage pages lacked the "Printable copy" link (`proposal-export-link`) that their stories draw, so I added it.
- **R-2.38, every proposal in one document** (`.../proposals/export`):
  - A vendor or a visitor gets the not-found page without the page asking the service anything.
  - Staff get the list the service gives the opportunity's author and administrators once the opportunity has closed. Drafts and withdrawn proposals are left out.
  - The "Name proponents anonymously" checkbox (`proposal-export-anonymous-toggle`) is kept in the address as `?anonymous=true`. Sprint With Us and Team With Us proposals then use their anonymous names. Code With Us proposals have none, so they are named by their place in the list ("Proponent 1", "Proponent 2"), and their contact details are withheld.
  - The order stays the same whichever way the document names proponents.
- **R-1.40, full report** (`/opportunities/<program>/:opportunityId/complete`): only an administrator gets it. Anyone else, the opportunity's own author included, gets the not-found page with nothing asked of the service. The report (`opportunity-full-report`) shows the opportunity and its terms, the addenda, the history one line per entry, and every proposal with its status, scores and full content.

**Tests.** `backend/tests/export-rules.test.ts` covers the rules: when a copy is anonymous, who may export or read the report, the order and the draft filtering, and reading the address. `frontend/tests/exports.test.tsx` runs the screens against a stand-in service:
- staff see "Proponent 1" while the vendor sees the organization, and staff see the organization once the proposal reaches the code challenge;
- vendors and visitors are refused without any request being made;
- the toggle renames the proponents and updates the address, and opening an address with `?anonymous=true` starts anonymous;
- the Code With Us anonymous document withholds contact details;
- the report is refused to the author and shown whole to an administrator;
- accessibility (axe) checks pass on a copy and on a report.

**Choices the acceptance tests might read differently:**
- The spec says only "until the proposal reaches the challenge stage", so I chose which statuses count as before the challenge. A proposal that is disqualified or withdrawn while still at the questions stage is treated as past them.
- A signed-out visitor gets the not-found page rather than being sent to sign in, because the not-found stories say a visitor is refused. The ordinary proposal pages send visitors to sign in instead.
- Status wording uses the app's existing labels ("Under review: questions") rather than the stories' "Under review: team questions".
- On the report, before an opportunity has closed, the service lists no proposals, so the report says they appear once it has.

**For the next slice.** Nothing in the app links to the all-proposals export or to the full report; they are reached by their addresses only, because no story draws a link to them. If links are wanted, a manage page's story would need to draw them first. `compose.yaml` and the seed are unchanged.