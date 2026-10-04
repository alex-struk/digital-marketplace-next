| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T19:12:12.858Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 20 (Staff can take away proposals and administrators can read an opportunity's full report) do what its criteria say?

**Recommendation.** I built slice 20: R-2.37, R-2.38 and R-1.40, for all three programs.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Slice 20 claims R-2.37, R-2.38 and R-1.40. The verify result is a current pass for this proposal (tree 16902be, 3 of 3 met), so the question is whether the code does what those criteria say and nothing more. It does. copyIsAnonymous in app/backend/src/rules/exports.ts names a Sprint With Us or Team With Us proponent anonymously to staff while the proposal is SUBMITTED, UNDER_REVIEW_QUESTIONS or EVALUATED_QUESTIONS and names the organization after that. The vendor always sees their own organization and Code With Us is never anonymised, which is R-2.37 read with R-1.24. The all-proposals document refuses a vendor or visitor before any request, drops DRAFT and WITHDRAWN as R-2.25 requires, and offers an anonymous variant kept in the address in a stable order (R-2.38). The full report is ADMIN-only, the author is refused, and it renders the opportunity, addenda, history and every proposal in one article (R-1.40). No new service operation was added, so access is still decided by the service's existing reads. Nothing was built that belongs to another slice. The only change outside the new screens is the proposal-export-link the SWU and TWU manage stories draw. Apart from pipeline records, all changes are under app/ and docs/decisions/. Test fixtures use placeholder identities and there are no secrets. The new rules and screens have unit tests, including axe checks. The open judgement calls (which statuses count as before the challenge, not-found rather than sign-in for visitors, existing status labels, the report's wording before closing) are recorded in decision record 0066 and are consistent with the criteria. The ruling would change if the verify result became stale against a newer tree, or if an anonymous copy were shown to reveal the organization other than through the name field.

**Conditions:**
none
