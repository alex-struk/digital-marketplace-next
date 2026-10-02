---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-02T16:31:41.314Z"
cost: 1.8813605999999998
turns: 55
session: "616abca9-ff2a-4817-896a-a07c3ded7e7c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I added the two new request pages to the adapter at `tests/adapters/new/` and named all 11 new members as bound in `bindings.yaml`. The Code With Us proposal form (R-1.35, R-1.36) is still unbound: the running target does not offer it. I could not typecheck or run anything: both `tsc` calls and plain `curl` were refused permission in this session, so I checked the new code by hand against the helpers it uses. No test has driven these two pages yet.

**How I bound them.** Both pages share the route `/api/opportunities/:program/:opportunityId`. I worked out what they do by sending requests from the browser, signed in through the identity provider as the administrator and signed out. I did the changing requests on a Code With Us draft I created myself (it is now cancelled), and only sent requests the service refuses to the seeded opportunities.
- **Reading the opportunity:** the administrator gets the opportunity with a `history` list, newest first. Each entry gives a status or an event (`NOTE_ADDED`), the note, who made it and when, and the attached files with names and identifiers. Signed out, the same answer comes back with no `history` key at all.
- **Updating it:** changes go through `PUT` with a `{ tag, value }` body. The service tells you which tags it allows if you send one it doesn't know:
  - Code With Us: edit, submitForReview, publish, cancel, addAddendum, addNote.
  - Sprint With Us: the same, plus startCodeChallenge, startTeamScenario and the evaluation and panel tags.
  - Team With Us: startChallenge, but no addNote at all.

**`opportunity-history-request`**
- `add_note_by_request` sends `addNote { note, attachments }`, with file identifiers or seed handles turned into ids.
- `history_shown` and `history_entries` re-read the opportunity each time. A shown history comes out one row per entry as `kind | note | name | when | file (id), …`.
- What I saw the service answer:
  - A note was accepted and showed up with its attached file.
  - An empty note was refused 400 with "note: Enter the note."
  - A note of 1,001 characters was refused 400 with "Enter a note of up to 1,000 characters."
  - A file the person cannot read was refused 400.
  - Signed out, adding a note was refused 401: "Only an administrator or the opportunity's author may add a note."

**`opportunity-status-request`**
- `request_status_change` turns the requested status into its own operation: UNDER_REVIEW→submitForReview, PUBLISHED→publish, CANCELED→cancel, EVAL_CC→startCodeChallenge, EVAL_SCENARIO→startTeamScenario, EVAL_C→startChallenge. Any other status throws `unbound:`.
- `stored_status` re-reads the opportunity as the signed-in person.
- What I saw the service answer:
  - Publish and cancel of my draft were accepted.
  - Publishing or submitting after cancelling was refused 400: "An opportunity that is cancelled cannot be made published."
  - The seeded awarded Code With Us opportunity asked to publish was refused 400: "…awarded cannot be made published."
  - The seeded awarded Sprint With Us opportunity asked to submit, publish or start a stage was refused 400: "That action is not yet available on this opportunity."

**Empty versus unbound.** On both pages, if the opportunity reads 404 ("No opportunity is held at that address."), the history and status readers throw `unbound:`, because the record was never reached. A reader the service merely keeps the history from gets `false` and an empty list. The three request readers on each page throw `unbound:` if no request has been sent yet.

**A problem with the target's data.** `seed.opportunities.cwuWithPrivateNote` and `seed.opportunities.cwuCancelled` both answer 404 here, signed in as the administrator and signed out. These are the starting points for R-1.33 (history) and R-1.20 (status). With the new rules, those criteria will report unbound on this target until those records exist. That is a seeding gap for whoever loads the target, not something the adapter can work around. The route itself resolved for both pages.

**Code With Us proposal form (R-1.35, R-1.36).** I looked again, signed in as the seeded vendor through the identity provider:
- `/opportunities/code-with-us/<seeded published id>/proposals/create` still answers "Page not found".
- That opportunity's public page has no button or link in its main content, only the "Watch this opportunity" tick box.
- The header offers only Dashboard, My profile and Sign out.

I added this recheck to the existing unbound reason in `index.ts`, and the page stays unbound.

I changed nothing outside `tests/adapters/new/`, and no password or environment value was written anywhere.