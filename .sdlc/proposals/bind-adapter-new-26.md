---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "**What I was asked to do.** Calibration could not test R-1.9 and R-1.48 because this adapter reported two pages unbound: `opportunity-swu-create` (route `/opportunities/sprint-with-us/create`) and `op…"
opened: 2026-10-01T08:45:13.744Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** **What I was asked to do.** Calibration could not test R-1.9 and R-1.48 because this adapter reported two pages unbound: `opportunity-swu-create` (route `/opportunities/sprint-with-us/create`) and `op…

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

## Journal: re-checking the Sprint With Us and Team With Us create screens on target "new"

**What I was asked to do.** Calibration could not test R-1.9 and R-1.48 because this adapter reported two pages unbound: `opportunity-swu-create` (route `/opportunities/sprint-with-us/create`) and `opportunity-twu-create` (`/opportunities/team-with-us/create`). I was asked to look for both again on the running target at http://localhost:4300 and bind them wherever the application offers them.

**Finding: the running build does not offer either screen, so both pages stay unbound.** I searched in these ways:

- **Signed in as the administrator, then as a public sector employee.** I used the real identity-provider form both times. `/opportunities/create` loads and offers three links: Code With Us, "Create a Sprint With Us opportunity" and "Create a Team With Us opportunity". I clicked each link inside the page rather than typing its address, in case the page loaded on its own behaved differently. Both clicks land on "Page not found", the same as opening the addresses directly.
- **Nearby addresses.** `/opportunities/sprint-with-us`, `/opportunities/team-with-us`, `/opportunities` and some guessed spellings (`/opportunities/swu/create`, `/opportunities/twu/create`, `/sprint-with-us/create`, `/team-with-us/create`) all answer "Page not found". `/opportunities/create?type=swu` only shows the same three-way chooser again.
- **Another way in through the Code With Us form.** The Code With Us create form loads, but nothing on it lets you choose a program, and it never mentions Sprint With Us or Team With Us.
- **The seeded Sprint With Us record.** As the public sector employee, I opened the view and edit screens of the seeded Sprint With Us opportunity that is at the consensus stage. Both answer "Page not found".
- **The header menu.** For a signed-in public sector employee it offers only Dashboard, Users, Content, My profile, Sign out and Create an opportunity. None of those leads to either screen.

**What I changed.** In `tests/adapters/new/index.ts` I made one kind of change. The unbound reasons for `opportunitySwuCreate` and `opportunityTwuCreate` now also list this round's checks, so the next reader can see what was tried and not only that nothing was found. Nothing else in the adapter changed. I left `tests/adapters/new/bindings.yaml` alone: it still lists every member of both pages as unbound with the "Page not found" reason, and that is still accurate.

**Not done.** I could not run the TypeScript typecheck because running the compiler was not approved in this session. My only edits added plain text inside two existing quoted strings, with no new quote or substitution characters, so I don't expect them to break compilation, but that has not been checked.

**Routes in `surface.yaml` that do not resolve on the target.** `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create` both answer "Page not found" when signed in and when signed out. The other Sprint With Us and Team With Us screens behave the same way, as the earlier reasons already record. R-1.9 and R-1.48 can only be tested once the build actually serves these screens. That is a gap in the application, not something a binding can fix.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the adapter for target 'new' bind every surface action and observation it can, and nothing else? Approve. The only change is longer text in the unbound reasons for opportunitySwuCreate and opportunityTwuCreate in tests/adapters/new/index.ts. No locator, assertion or business logic is touched, and nothing under tests/acceptance changed. The reasons are real: they name the missing surface (/opportunities/sprint-with-us/create and /opportunities/team-with-us/create answer 'Page not found' for an administrator and for a public sector employee, including when the link on /opportunities/create is followed). That matches the application, whose frontend has no route or screen for either path (sprint-with-us and team-with-us appear only in the API types, the learn-more pages and the terms links). It is also consistent with the tech lead's earlier finding that these screens belong to Slice 10. The runner's typecheck on this revision passed with no diagnostics under adapters/new, so the binder's unchecked compile risk is settled. R-1.9 and R-1.48 stay unexercised because of a gap in the application or the slice plan, not in the adapter. This proposal settles none of the open instructions (build-slice-7-3#1, build-slice-7-3#2, build-slice-7-4#3), so they stay open. The ruling would change if a binding added an assertion, if a test file were touched, or if either screen proved to be served by the build.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `144f7473d46e3abcfe2e6ec21a28c49d271e89eb`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
