---
stage: "contract"
title: "contract"
at: "2026-09-28T19:36:56.214Z"
cost: 2.0889022
turns: 61
session: "2efb6260-4d89-4c09-82f6-ea8a017893bd"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Contract journal: dates for missing-test R-1.9

This run supplied what missing-test R-1.9 lacked, and the oracle was restarted from scratch and confirmed working. The only file changed is `spec/contract/surface.yaml`.

## What R-1.9 was missing, and what I added

R-1.9 says: when a draft opportunity is saved, a missing or invalid proposal deadline, assignment date or start date is set to fourteen days from the day of saving, and the completion date is left empty. The existing test could only check a missing proposal deadline, for two reasons:
- **Nothing on the surface returned the other three dates.** No page offered an observation for the assignment, start or completion date.
- **No stated way to enter an invalid date.** The `save_draft` action had no documented input, so a test could not hand it a bad date.

**The dates on the view screens.** Each view screen now returns the dates the old page actually displays:
- `opportunity-cwu-view` returns `assignment_date` and `start_date`. The old page shows no completion date.
- `opportunity-swu-view` returns `assignment_date`.
- `opportunity-twu-view` returns `assignment_date`, `start_date` and `completion_date`, all under its "Key Dates" section.

**The dates on the manage screens.** Each of the three manage screens (`opportunity-*-edit`) now returns the dates as its opportunity tab (`?tab=opportunity`) shows them in its form, empty when the opportunity has none:
- For Code With Us and Team With Us: `proposal_deadline`, `assignment_date`, `start_date` and `completion_date`. This is the only place a Code With Us completion date can be read.
- For Sprint With Us: `proposal_deadline` and `assignment_date`.

**The input shape for `save_draft`.** Each of the three create screens now has an `# Input:` comment on `save_draft`. The keys are `title`, `proposal_deadline`, `assignment_date`, `start_date` and `completion_date`. Every key is optional, and each date is written `YYYY-MM-DD`.

The test writer asked for an impossible calendar day, such as 30 February. The old form cannot send one, because its date field is an HTML `type="date"` input that only holds real days. In the old code (`code-with-us.ts:238–255`, and the same in the other two programs), "invalid" instead means a well-formed date earlier than its minimum:
- a proposal deadline before today;
- an assignment date before the proposal deadline;
- a start date before the assignment date;
- a completion date before the start date.

"Save Draft" stays clickable whatever the form holds (`create.tsx:369–377`), so such a date is sent to the server as entered. The comment says that a day long past, such as `2000-01-01`, is invalid for all four dates whatever else is entered.

All the new observations have `test_id: null`, the file's existing convention for observations the design gate has not bound yet.

## Things the next stages should know

- **Team With Us may not match the criterion.** On a Team With Us draft, the old code sets a missing or invalid completion date to fourteen days out (`team-with-us/index.ts:388`), not empty. The criterion says the completion date is left empty, and it cites only the Code With Us and Sprint With Us code. A Team With Us test of the "left empty" clause will likely fail against the oracle. That is a question about the criterion, not a gap in the contract.
- **Sprint With Us has no start or completion date of its own.** Those dates belong to its phases, entered through `add_phase` and shown in `phases`. The surface comments say so.
- **Adapter behaviour I did not check.** The old-application adapter's `enter` routine calls a "fill in required fields" step (`completeRequired`) before pressing Save Draft. I did not check whether that step fills blank date fields. If it does, a "missing date" test would be undermined. That belongs to the adapter-binding stage, which also has to bind the new observations.

## Whether the oracle started

The first `oracle up` reported success but started nothing. Four copies left by an earlier stage had been running for three hours, and it reused them. I took them down and brought the oracle up again from nothing, without changing `.sdlc/oracle/compose.yml`:
- **Migration:** a new volume was created, and the `migrate` service ran 78 migrations.
- **Seed:** the seeded record `opportunities.publishedCodeWithUs` (id `…0601`, "Seeded published Code With Us opportunity") came back through the application's own API on port 4300. A second copy on port 3101 also answered 200.
- **Sign-in:** the public sector test sign-in route `/auth/createsessiongov` answered 302, redirecting to `/dashboard`.

I ran `oracle down` afterwards.

## Existing contract, unchanged this run

Earlier contract runs built everything below; this run changed none of it.
- **Pages:** 91 in total, covering all eight domains.
- **Personas:** each signs in through a test session route on the oracle and through the sandbox identity provider on the rebuilt target. Staff-side roles beyond the one public sector session route are marked `unavailable` or stood in for, as `personas.yaml` explains. The anonymous visitor has `sign_in: null`.
- **Seed:** 14 SQL files (`000` to `013`). They hold synthetic `example.test` users for each persona, organizations, content pages, files, and opportunities at each evaluation stage for all three programs. The manifest names each record by handle.

## Tool limits

The shell refused `$SDLC_BIN` because the permission layer blocks variable expansion. I ran the CLI by its resolved path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`. A scripted YAML parse also needed an approval nobody was there to give. I checked the edited pages by reading them back instead: no duplicate keys, correct indentation.

re-address missing-test/R-1.9 to derive-tests: `assignment_date` and `start_date` on `opportunity-cwu-view` and `opportunity-twu-view`, `completion_date` on `opportunity-twu-view`, `assignment_date` on `opportunity-swu-view`, and `proposal_deadline`, `assignment_date`, `start_date` and `completion_date` on `opportunity-cwu-edit` and `opportunity-twu-edit` (the first two only on `opportunity-swu-edit`), plus a stated `save_draft` input on the three create screens where an out-of-range date such as `2000-01-01` is the invalid value the form will send