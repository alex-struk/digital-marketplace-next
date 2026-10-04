| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T20:16:17.262Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 14 (A vendor can propose on a Code With Us opportunity) do what its criteria say?

**Recommendation.** I built slice 14: a vendor can now propose on a Code With Us opportunity, and all 25 criteria the plan assigns to it are built.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built slice 14: a vendor can now propose on a Code With Us opportunity, and all 25 criteria the plan assigns to it are built. `npm --prefix app run check` passes: 16 migration tests, 654 backend tests and 407 frontend tests. I could not run the sandbox or open a page here, so the screens are proven by unit tests, not by sight.

**The service** (`app/backend/src/proposals/`, rules in `app/backend/src/rules/proposals.ts`, which the screens also use):
- **Starting a proposal (R-2.1, R-2.7):** only a vendor who has accepted the terms at some point may start one, and only as a draft or a submission.
- **One proposal each (R-2.2, R-2.11):** a vendor's second proposal on the same opportunity is refused with "You already have a proposal for this opportunity." and the identifier of the one they hold. An organization already named on another proposal is refused with "Please select a different organization." and that proposal's identifier.
- **Drafts and submissions (R-2.12, R-2.13, R-2.14):** a draft is kept however incomplete, but its attachments are always checked. A submission is checked in full, and each problem is named against its field. An organization is checked only for existing and being active, not for whether the vendor belongs to it.
- **Terms (R-2.3):** submitting needs the service's current terms accepted.
- **Deadline, withdrawing and deleting (R-2.15, R-2.23, R-2.4):** nothing is put forward after the deadline. A vendor can withdraw at any time, and resubmit only while the opportunity is still open. Only a draft can be deleted.
- **Who sees what (R-2.24, R-2.25, R-1.31, R-2.9):** a vendor sees their own proposals and those of organizations they own or administer. Staff see none until the opportunity has closed, and never a draft; the opportunity's author also never sees a withdrawn one. History goes to everyone who may read the proposal.

**Files (R-8.20, R-8.22, R-8.31):**
- A new table holds Code With Us proposal attachments.
- One rule decides who may read a file attached to a proposal. It applies to Code With Us and Team With Us proposals alike (Sprint With Us proposals carry no attachments).
- Attaching a file the person may not read is refused.
- Removing an attachment, or deleting the proposal, ends that way of reading the file. A new file-store query lists files nothing refers to any more.

**The screens:**
- The create page at `/opportunities/code-with-us/<id>/proposals/create`.
- The manage page at `.../proposals/<proposalId>/edit`, with Proposal and History tabs.
- A vendor's `/dashboard`, with their own proposals and their organizations' proposals, and an empty message for each list.
- "Start a proposal" on the opportunity page, which takes a vendor who already holds one to it.

Every submission goes through the terms dialog, which records the acceptance before submitting. Every test id from the stories and `surface.yaml` for these pages is on the matching element, except two left for slice 16: `proposal-rank` and the printable copy behind `proposal-export-link`.

**Answered for here but built earlier:**
- **R-4.23:** the profile-completion redirect from slice 2 now lands a returning vendor on this dashboard.
- **R-1.35, R-1.36:** the addendum and cancellation notices from slice 9 reach vendors who submitted a proposal, and not vendors who only hold a draft.
- **R-6.2–R-6.5:** checked against every message the service can send so far: one sender with no separate reply-to, marked as a test, a plain-text form rendered from the formatted one, and a failed delivery logged once and never retried.

**Tests:** a backend end-to-end suite runs over the real migrations and seed, with mail caught. There are unit tests for the proposal rules and for every message, and frontend tests for all three screens, including automated accessibility checks.

**Decisions** (recorded in `docs/decisions/0055-code-with-us-proposals.md`):
- **When an opportunity counts as closed:** there is no hook yet that closes an opportunity at its deadline (slice 16). For now an opportunity counts as closed once its deadline has passed, even while its status still reads published.
- **Withdraw dialog wording:** it does not promise the withdrawal notice the story mentions. That notice is R-2.36, which this slice doesn't own, so the dialog would otherwise promise mail that is never sent.
- **Start a proposal label:** the button reads "View your proposal" when the vendor already has one.
- **Refusals the screen can't prevent:** the manage page offers the actions the design's table lists and lets the service refuse what the moment doesn't allow.

I changed one test from an earlier slice: two sign-up tests listed every request exactly, and the vendor dashboard now loads data after landing. They now check only the account changes they were about. I changed nothing outside `app/` and `docs/decisions/`.

**What the next slices will find missing:**
- The staff view of a proposal, the export pages, scoring, awarding, disqualifying, and the submit, withdraw and award notices (slice 16).
- Sprint With Us and Team With Us proposals on the dashboard, which lists Code With Us proposals only for now (slice 15).
- The closing hook; when it arrives, `hasClosedToProposals` in `app/backend/src/rules/proposals.ts` is the one place to change.

_Ruled: return by runner:verify_
