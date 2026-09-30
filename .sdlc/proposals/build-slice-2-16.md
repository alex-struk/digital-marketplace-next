---
gate: G3
question: "Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?"
recommendation: "I made no changes to the application or the decision records in this revision."
opened: 2026-09-30T23:48:23.718Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?

**Recommendation.** I made no changes to the application or the decision records in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes to the application or the decision records in this revision.

**Why nothing changed.** The ruling sent slice 2 back because it claimed R-4.23, and the tests for that criterion confirm arrival by reading the dashboard's contents. Those dashboards belong to later slices. The ruling was addressed to plan, not build, and plan has already acted on it. In the current `plan/tasks.md`, slice 2 answers for R-4.1, R-4.2, R-4.3, R-4.17, R-4.24 and R-6.1. R-4.23 appears only in the list of criteria slice 2 builds on but does not answer for. It now sits in the Code With Us proposals slice, whose deliverables state it: that slice shows the redirect slice 2 built landing a vendor who has agreed before on the vendor dashboard, and landing a public sector employee on slice 8's opportunities dashboard.

The ruling itself found that the redirect works: in both failing cases the terms checkbox was absent, so the person left the profile-completion page. It also found R-4.1 and R-4.3 passing, and it didn't ask for the cookie change in decision record 0020 to be undone. So nothing in the ruling pointed at code for this stage to correct. Adding the dashboards' empty states or proposal and opportunity listings here would build criteria another slice now owns, so I left them alone.

**Verification.** `npm --prefix app run check` passes: the typecheck plus 15, 199 and 105 unit tests across the three test runs. The first attempt failed with `tsc: not found` only because the workspace had no installed dependencies. I installed them with `npm ci` to run the check and then deleted every `node_modules` directory. They weren't there before and `app/` has no ignore file, so they would otherwise have gone into the proposal. I didn't start the compose sandbox, since no code or configuration changed after the previous build.

**Criteria on the current list and where they stand.** These were built in the earlier builds of this slice and are unchanged:
- R-4.1, R-4.2 and R-4.3: sign-in, sign-up, and the account created on first sign-in through `/api/sessions/current`.
- R-4.17: profile completion with terms agreement.
- R-4.24: returning to the page sign-in began from, and sign-out from both the service and the identity provider.
- R-6.1: the welcome message sent through the shared mail path.

**Left for other stages.** The two filed conditions on the ruling were addressed to plan, and plan appears to have carried out the substantive one. Two things are still missing:
- **The dashboards:** the vendor's proposals list and its empty message, and the staff opportunities list and its empty message. Their slices will find slice 2's dashboard route rendering only a heading.
- **The egress failure the ruling mentions:** it is in the `.sdlc/site` records from build-slice-2-11, which this stage can't write, and it doesn't bear on the ruling.
