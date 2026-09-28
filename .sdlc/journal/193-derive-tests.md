---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T19:23:58.881Z"
cost: 1.8731814000000002
turns: 36
session: "8a75938a-e94e-4e8d-9a87-46693354d0ca"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

I rewrote all four criteria in the opportunities domain as tests. Three of them also have their own `.spec.ts` rewritten against the ruling. R-1.9 has one partial-clause entry in `not-testable.yaml`. Nothing has been run: the workspace has no application, and I was not allowed to run the TypeScript type check (`tsc --noEmit`), so the four files have only been checked by reading them.

**R-1.9 (v2).** A member of public sector staff saves a Code With Us draft with only a title. The test checks that the draft is stored: it has an identifier, the form shows no error, and it appears in the author's own dashboard list. It then checks the proposal deadline shown on the opportunity's page.
- **What the ruling fixed:** the expected day is now worked out in Pacific time (America/Vancouver), not in the test runner's own time zone. It is taken both just before and just after saving, so a save that crosses midnight Pacific accepts either day. The check looks for that day of the month as a whole number, plus the year.
- **Partial entry:** it names the clause about the assignment date, the start date, the completion date being left empty, and the "invalid" half of the rule. The reason starts with `blocked:`. No page shows an assignment, start or completion date; only `proposal_deadline` is observable. Nothing says how to hand `save_draft` a date that is present but invalid. Owner is `contract`.

**R-1.16 (v1).** Two tests, one for each half of the statement.
- **Implementation phase (what the ruling fixed):** an administrator publishes a Sprint With Us opportunity that names only a prototype phase, and the test no longer demands a refusal message. If the publish produced an opportunity, its phases must include an implementation phase. If it did not, the title must be absent from the administrator's dashboard. Either way, no Sprint With Us opportunity ended up published without one.
- **Inception without prototype:** kept as before — inception plus implementation, no prototype, is refused. The dates now use Pacific days.

**R-1.27 (v1).** Uses the seeded awarded opportunities for Code With Us and Sprint With Us, looked at by a visitor and by an administrator. In both cases the award is established by the winner, Northern Pines, being named.
- **Visitor:** the winner is named. No contact details and no score appear anywhere the visitor can reach: the opportunity page, the award summary tab on the management screen, or the winning proposal.
- **Administrator (what the ruling fixed):** contact details and score no longer have to be on the opportunity's own page. It is enough that each appears somewhere the administrator sees the award: the opportunity page, the award summary tab, or the winning proposal (its proponent, its proposal tab and its score).
- **How contact details are recognised:** off the opportunity page they are matched by the owner's email from the seed. I took that address from the seeded organization's own row. It is the organization's contact email, but the handle list names it only as the owner's email.
- **How the score is recognised:** by the proposal's score observation, or, for Code With Us, by the seeded score of 91 appearing in the summary.

**R-1.29 (v2).** The old file was at v1. The criterion now states only what is withheld, so the single test checks that a signed-out visitor and a vendor see neither name on the seeded published Code With Us opportunity. It asserts nothing about what administrators or the authors see, since the criterion does not promise that. It first confirms the page actually opened, so empty names cannot come from a page that never loaded.

**What the contract should add:**
- `assignment_date`, `start_date` and `completion_date` observations on the three opportunity view (or edit) screens.
- A stated input shape for `save_draft` that can carry an invalid date.
- A single observation on the edit screens for the award summary's contact details and score. `summary_tab` is free text, which is why the R-1.27 test has to match seeded values in it.

Nothing asked me to change any read-only path, and I changed none.