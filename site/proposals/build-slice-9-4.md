| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T17:23:45.819Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 9 (An opportunity's author and administrators can run it after publication) do what its criteria say?

**Recommendation.** `npm --prefix app run check` passes: typecheck plus 16, 456 and 290 unit tests across the packages.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've done the one thing the ruling asked of this stage: neither manage page offers a way to add a private note any more. `npm --prefix app run check` passes: typecheck plus 16, 456 and 290 unit tests across the packages. I didn't bring the application up with compose this round, and the acceptance tests haven't been run against this change.

**What changed**
- **The two manage pages:** the Code With Us page (`opportunity-cwu-edit.tsx`) and the Sprint With Us and Team With Us page (`opportunity-other-manage.tsx`) now show only the history table on the History tab. That table still shows every entry, including private notes and links to their files, to the author and administrators only. The add-note permission check, the note form, the "note has been added" message and the `run` call that sent the note are all gone from both pages.
- **The shared component file** (`opportunity-running.tsx`): I deleted the note form itself and the imports only it used. The addenda tab, the cancel dialog, the history table and the reporting figures are unchanged.
- **The client's request code** (`api/opportunities.ts`): I took `addNote` out of the actions it can send. The ruling asked to remove the `addNote` action the forms wired up, and since no screen offers a note any more, nothing should be able to send one.
- **The backend:** as the ruling said, the service still accepts `addNote`, the store still saves notes, and the backend end-to-end tests for both are unchanged.
- **Unit tests:** the old test that added a note with a file now checks something else. It loads an opportunity whose history already holds a note with a file, and checks that the History tab shows the note and the file link but offers no note field or "Add note" button. The Sprint With Us and Team With Us test now checks that neither program's History tab offers the form.
- **Documentation:** `app/README.md` and decision record 0043 now say the History tab shows notes but no screen adds one, and that the service still takes `addNote` but the client never sends it.

**Not changed:** R-1.20, R-1.28, R-1.30, R-1.32 and R-6.17 (cancellation, the addenda tab, the reporting figures, full history, the permitted-transition refusals, and the mailer's rule against messaging a deactivated account). The ruling found R-1.28, R-1.30 and R-1.32 passing and blamed the R-6.17 and R-1.20 failures on their tests.

**Left to other stages** (the ruling filed these elsewhere; I didn't touch them):
- **R-6.17's test** has to wait for the account-deactivated notice before it clears the mail catcher.
- **R-1.20's test** has to ask for the refused change without needing the screen to offer a Publish or Submit for review control.
- **R-1.35 and R-1.36** need to move into or after the slice that builds the Code With Us proposal screen, because their tests submit a proposal first.
- **The `add_note` control** is still declared in the Code With Us and Sprint With Us edit pages in `surface.yaml`. Design needs to remove it there.
- **R-1.33 can't be tested yet** until the seed holds an opportunity whose history has a private note with a file.

Until those land, R-1.33 has nothing to check against. The next slice will find no note-adding screen, by design.

To run the check I installed dependencies under `app/`, then deleted the `node_modules` folders so the workspace is back as I found it.

## Fix turn

`npm --prefix app run check` now passes. I ran it twice in full and got the same result both times: 16 migration tests, 456 backend tests in 31 files, and 290 frontend tests in 18 files.

The "Could not parse CSS stylesheet" and "Not implemented: …" lines in the failure output were only warnings from the frontend test environment, and those suites passed. The real failure was one backend test file, `tests/content-over-the-kept-schema.test.ts`, which crashed on start-up with "EADDRINUSE: address already in use 127.0.0.1:39100". Each backend test file starts its own in-process database on a port from `app/backend/tests/free-port.ts`. That helper used to ask the system for any free port, release it, and hand the number back. The test files run in parallel, and between the release and the database starting, another file's server or outgoing connection could be given the same port, since all of those come from the same range (32768 and up on Linux). I rewrote that one helper to pick a random port between 20000 and 32000 instead, below the range the system hands out, and to check it is free before returning it. No test file and no application code changed.

I also confirmed that the earlier revision's removal of the private-note form (`NoteForm`) from the History tab screens is still in place: it no longer appears anywhere in the frontend.

**Journal addition:** The check failed because one backend suite could not start its in-process database: the port it had been handed was taken by another suite running in parallel. The helper in `app/backend/tests/free-port.ts` used to take a port from the range the system uses for automatic assignments, so another suite's server or outgoing connection could be given the same port before the database bound it. It now picks a random port between 20000 and 32000, outside that range, and checks it is free before returning it. Nothing else changed. Two full runs of `npm --prefix app run check` passed with no failures.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Does slice 9 do what its criteria say? Approve. The verify result for this proposal is current (application tree f1cc08d) and reads pass-unasserted. R-1.20, R-1.28, R-1.30, R-1.32 and R-6.17 were run against the application and passed. The code matches them: cancellation is an administrator's alone and is checked against the program's path; addenda are 1 to 5,000 characters, are never removable and are announced unless the opportunity is a draft or cancelled; history and reporting figures go only to the author and administrators, and the figures only after publication; counters are read only by public sector staff and administrators; and the mailer drops addresses held only by deactivated accounts at the moment of sending, except the deactivation notices. Unit and end-to-end tests cover these seams. The owed instruction build-slice-9-3#6 is carried out: no NoteForm or addNote remains in app/frontend/src outside the generated contract types, and the README and decision record 0043 say the History tab shows notes but no screen adds one. R-1.33 v2 is accepted unasserted because its not-testable reason is real. The surface still declares add_note, which the criterion says does not exist, and no seeded opportunity has a private note with a file in its history, so there is nothing to observe. The backend end-to-end tests exercise the service path and who can read it, and the missing pieces are recorded below as owed by design and contract. The owed tests for R-1.20 and R-6.17 were recorded as 'a test for v1 exists and has not run'. Both have now run at v1 on this tree and passed, so they are withdrawn. This ruling would change if a current verify result showed any of the five claimed criteria failing, or if a note-adding control reappeared on a screen.

**Conditions:**
- condition-met build-slice-9-3#6: NoteForm and the client's addNote action are removed from app/frontend/src/screens/opportunity-cwu-edit.tsx, opportunity-other-manage.tsx, opportunity-running.tsx and app/frontend/src/api/opportunities.ts (a search of app/frontend/src finds addNote only in the generated contract.d.ts); the service's addNote and the History tab's display of notes and their files are kept; app/README.md and docs/decisions/0043 describe the History tab as showing notes with no screen adding one.
- condition-withdrawn missing-test/R-1.20: tests/acceptance/opportunities/R-1.20.spec.ts ran at v1 against application tree f1cc08d and passed in every case (tests/results/new/slice-9.json).
- condition-withdrawn missing-test/R-6.17: tests/acceptance/notifications/R-6.17.spec.ts ran at v1 against application tree f1cc08d and passed in every case (tests/results/new/slice-9.json).
- missing-test R-1.33: the note and its attachments appear in the opportunity's history, which only the author and administrators can see — owed by contract: a seeded Code With Us or Sprint With Us opportunity whose history holds a private note carrying a file, so a test can observe it as author or administrator and see it withheld from a vendor.
- missing-test R-1.33: no screen of the application offers a way to add a private note — owed by design: the surface still declares add_note on opportunity-cwu-edit and opportunity-swu-edit, which contradicts the criterion and has to be removed before this clause can be asserted.
