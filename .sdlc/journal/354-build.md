---
stage: "build"
title: "build slice 7"
at: "2026-10-01T07:49:40.831Z"
cost: 1.2051983999999998
turns: 41
session: "7fac260e-1b8b-4bec-a866-67bdbba580d7"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed the Code With Us form so the suite can fill it in again. The full `npm --prefix app run check` passes: typecheck plus 632 unit tests (16 migrations, 394 backend, 222 frontend). I did not run the acceptance suite or the compose stack, so whether the six criteria now pass is still to be confirmed.

**What I found.** All six failures had one cause. The last revision (decision record 0030) replaced the remote-work question in the design stories ("Is remote work acceptable?", a Yes / No radio group) with a single "Remote OK" checkbox. The acceptance suite fills the form by that question. It found no such choice, so it could not save a draft, submit or publish on the create page. Every check that depends on creating an opportunity then read an empty result:
- R-1.9: a draft with blanks is accepted.
- R-1.48: only an administrator may create one as published.
- R-1.53: who may delete, and when.
- R-8.17, R-8.19 and R-8.25: an attachment uploaded through the form.

I checked the service code behind these criteria and the attachment control, and none of it was at fault. The size limit was already stated before a file is chosen.

**What I changed.**
- **The form:** in `app/frontend/src/screens/opportunity-cwu-form.tsx`, remote work is the stories' Yes / No question again, with its test id and anchor on the group. This one form serves both the create page and the manage page's Opportunity tab.
- **Default answer:** the question starts on No, as one of the Team With Us stories draws it. A person can never be refused for leaving it unanswered, while the service still refuses a request that doesn't say (R-1.11).
- **Error label:** a remote-work problem in the error summary now begins "Remote work:" instead of "Remote OK:" (`app/backend/src/rules/opportunities.ts`).
- **Unit test:** the create-form test now finds the question by its name, checks it starts on No, chooses Yes, and checks the draft sent says remote work is acceptable. The design system adds "(required)" to a required field's name, so the test matches on the start of the name.

**Records.** New decision record 0031 explains the reversal. I marked 0030's remote-work part as replaced. Its other part stands: creating a Sprint With Us or Team With Us opportunity already enforces R-1.48 ahead of slice 10.

**One judgement call.** The Code With Us create story draws the question with nothing chosen, but I start it on No. If the stories' empty start is required, change the starting value in the form; record 0031 names this as what would reverse it.

**Not done.** One backend test file failed once in the full run and passed when run alone; I take it to be timing-dependent, but it may fail again. I installed dependencies and built the frontend only to verify, then removed both, since nothing in `app/` ignores them. Nothing outside `app/` and `docs/decisions/` was touched. What the next slice will find missing is unchanged from the first build of this slice: watching, proposals, cancelling, addenda, notes, reporting, and the other two programs' own create paths.