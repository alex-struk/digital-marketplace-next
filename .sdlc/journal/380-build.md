---
stage: "build"
title: "build slice 8"
at: "2026-10-01T15:36:10.092Z"
cost: 8.173055399999999
turns: 137
session: "7159e660-4ef6-4161-ac89-1b57bc5e6631"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I made a fix aimed at all three returned criteria, but I couldn't start the sandbox or open a browser in this session, so it's reasoned from the code and not confirmed against the running application. Whether R-1.3, R-1.38 and R-1.39 now pass is something only the next acceptance run will show. `npm --prefix app run check` passes: 16 migration tests, 422 backend tests and 256 frontend tests.

**What I found.** The service checks and permissions were sound: the backend's end-to-end tests run against the real seed and pass. Comparing the screens with their design stories turned up two real departures.

- **The Sprint With Us and Team With Us create forms were only partly built.** The previous revision gave them just the fields every program shares. They left out about fourteen test ids their stories draw: skills, phases, team and resource questions, scoring weights, evaluation panel and attachments. Their date fields also had their own ids (`opp-proposalDeadline`) instead of the stories' (`opp-deadline`, `opp-assignment`, `opp-start`, `opp-completion`), which the Code With Us form already uses. Decision record 0031 shows the suite fills a form from what its story draws and can't save when something is missing. That fits "save_draft unbound" in R-1.39.
- **The service refused to create these opportunities under review or published.** It answered 501. The staff story's Unpublished group holds a Sprint With Us opportunity under review and a Team With Us draft. A check that creates such an opportunity got nothing kept. A staff member with nothing else unpublished then had no Unpublished group drawn at all. That fits the empty reads in R-1.3 and R-1.38, though I'm least sure of this link.

**What I changed.**
- **Both create forms now draw everything their stories draw**, with the stories' labels, ids and test ids:
  - the shared fields, and for Sprint With Us, Skills;
  - the key dates;
  - Sprint With Us phases: implementation always, with inception and prototype added and removed by `add-phase-button`;
  - Team With Us resources, one to start;
  - team or resource questions, one to start;
  - scoring weights, with a running total and `score-weight-error` while entered weights don't make 100%;
  - the evaluation panel editor, starting with the author as chair and evaluator;
  - each reason the service gives for a refusal, listed under `field-error`.

  Save draft, Submit for review and an administrator's Publish (after the confirmation) all send what the form holds.
- **The service now keeps all of it** in the existing tables (phases, questions, resources, panel members, weights, skills). It accepts creation as a draft or under review from any staff member, and published only from an administrator (R-1.48). Panel members who aren't active public sector staff are dropped, and a panel naming nobody becomes the author alone.
- **The list always draws the Unpublished group for staff and administrators**, with "There are no unpublished opportunities." when empty. Vendors and visitors still never see it.

The new decision record is `docs/decisions/0036-the-other-programs-create-forms-are-drawn-whole.md`; 0035 now points to it.

**Unit tests.**
- **Rules:** the creation rule for every state and role, what is kept (skills, phases and phase budgets, questions, resources, weights, panel), and the weight total.
- **Backend, against the seeded schema:** a Sprint With Us opportunity created under review with its content, a vendor left off its panel, and the list hiding it from another staff member; a Team With Us opportunity an administrator publishes, which a vendor and a visitor can then list.
- **Frontend:**
  - every story test id is present on both forms;
  - the body sent when submitting for review, and an administrator's publish after confirming;
  - the running weight total and its warning;
  - refusal reasons listed with what was typed kept;
  - no accessibility violations on either form;
  - the empty Unpublished group for staff.

**What this build doesn't do, and what slice 10 will find.**
- **No completeness checks.** Whether one of these opportunities is complete enough to submit or publish (R-1.13, R-1.15 to R-1.18 and the panel rules) belongs to slice 10, so the service keeps what is sent as it is and the screen says so.
- **No announcement.** Publishing in these two programs sends no message, because the only announcement messages that exist are written for Code With Us.
- **Attachments are disabled.** The kept schema has no attachment table for either program. The button is there but disabled, with a sentence saying why.
- **Panel choice for staff.** A staff member who isn't an administrator can only name themselves on the panel, because only administrators may list accounts (R-4.21). How staff choose other panel members is slice 10's to settle.
- **Slice 10 replaces these interim screens and endpoints**, keeping these test ids, the administrator-only publish rule (R-1.48) and the defaulted draft dates (R-1.9).

Nothing outside `app/` and `docs/decisions/` was changed. The dependencies and build output I created to run the checks have been removed from `app/`.