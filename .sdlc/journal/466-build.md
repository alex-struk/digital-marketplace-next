---
stage: "build"
title: "build slice 13"
at: "2026-10-03T19:26:34.141Z"
cost: 0.24276080000000003
turns: 8
session: "6e99a7ab-ca6c-49ea-9ce5-b623649d9894"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

This revision changes two decision records and no code. They now agree with each other and with the ruling that returned the slice.

**Decision record 0054** (`docs/decisions/0054-service-area-checkboxes-follow-the-catalogue.md`): I removed the claim that the label and value change fixes the R-3.26 and R-3.28 acceptance failures. The record now gives one reason for the change: the Team With Us service-area form follows the catalogue story `organization-edit · service-areas-editing`. That means kebab-case checkbox values (`full-stack-developer`) and sentence-case labels ("Full stack developer"), turned back into the service's keys only when the form saves. A new paragraph says what actually caused the earlier failures. The new target's test adapter reported every checkbox with its checked state, so every area name was always in the text it returned. That belongs to the adapter, and it has been referred to the stage that binds it.

**Decision record 0053** (`docs/decisions/0053-qualifying-for-sprint-with-us-and-team-with-us.md`): the Service areas paragraph used to say the screen uses the service's own title-case names and that the stories' sentence-case names are only illustrative. It now says the screen names each area in sentence case, as the catalogue does, with kebab-case checkbox values that become the service's keys on save, and it points to 0054.

Before editing, I checked the code against the records. `app/frontend/src/screens/organization-qualification.tsx` maps `FULL_STACK_DEVELOPER` to "Full stack developer", and the frontend unit tests check those labels and the `full-stack-developer` value, so the records now describe what the code does. I left the application as it was. The ruling did not ask for a code change, and it says the code is not the cause.

`npm --prefix app run check` failed at first because `tsc` was missing: the workspace had no `node_modules`. After `npm install` under `app/`, the check passes. It typechecks every package and runs all three unit-test suites: 16, 570 and 384 tests. The one error line in the output is a log about undelivered mail that an existing test triggers on purpose, not a failure.

The ruling's other condition belongs to the adapter-binding stage, and I did not touch it. On the new target, `organizationEdit.serviceAreaCheckbox` (in `tests/adapters/new/index.ts`) must return only the approved service areas, the way the old target's binding does. Until it does, R-3.26 and R-3.28 will keep failing whatever the application does.

Slice 13 still covers all four of its criteria, R-3.25 to R-3.28, as the earlier build of it did. This revision adds nothing the next slice depends on.