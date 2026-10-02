---
stage: "build"
title: "build slice 9"
at: "2026-10-02T17:23:45.713Z"
cost: 1.4010594
turns: 54
session: "d543bdc7-f9fa-495f-98f3-e25adeb7f3c3"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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