---
stage: "plan"
title: "plan"
at: "2026-10-01T08:53:55.787Z"
cost: 0.5017896000000001
turns: 18
session: "8cbe934f-6cd6-47af-bd78-23a12ca0ed0a"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I moved the four criteria the ruling named out of Slice 7, each into a slice that serves the screen its test opens. I couldn't run the plan's coverage script (`plan/check-coverage.mjs`) because it needed approval that wasn't given here. Instead I searched the criteria lines by hand: each of the four now appears in exactly one slice, and none is still in Slice 7.

The plan still has 21 slices in the same order with the same dependencies. Only three of them changed:

- **Slice 7** (staff draft, submit and publish a Code With Us opportunity) no longer lists R-1.9, R-1.53, R-1.56 or R-8.22. Its description still says it builds what those four describe. It now names each of them among the rules that are built in Slice 7 but answered for in a later slice.
- **Slice 10** (Sprint With Us and Team With Us creation with an evaluation panel) now holds three of them:
  - R-1.9: a draft is saved with incomplete content and its missing dates set to fourteen days ahead.
  - R-1.53: an opportunity can be deleted only while it is a draft or under review.
  - R-1.56: once an opportunity is published, only an administrator may change it.

  Their tests open `/opportunities/sprint-with-us/create`, which Slice 10 builds. Slice 10 already depends on Slices 9 and 7, so the Code With Us screens are there too. R-1.8 and R-1.48 had already been moved to Slice 10 for the same reason.
- **Slice 14** (a vendor proposes on a Code With Us opportunity) now holds R-8.22: a file may be attached only by someone allowed to read it. Its test opens `/opportunities/code-with-us/:opportunityId/proposals/create`, which Slice 14 builds. Slice 14 depends on Slice 8, which depends on Slice 7, so the opportunity attachment control is already in place.

In `plan/plan.md`, I added one item under "Criteria that sit awkwardly where they are" explaining these moves. They fit awkwardly in the same way as the earlier R-1.8 group:
- The behaviour is still built in Slice 7, and only where it is answered for has moved.
- R-1.53 and R-1.56 cover all three programs, but they are answered for in the Sprint With Us slice, because that is where their tests first run.
- R-8.22 covers attaching files to opportunities as well as proposals, but it is answered for in the proposal slice for the same reason.

The constitution check is unchanged, because moving where criteria are answered for brings in no new constitution rule. I wrote no new decision record, since this changes no framework, data store or boundary. Nothing was assumed about the stack or the platform beyond what the existing plan and decision records already state.

I deferred nothing, the ruling contained nothing addressed to a person rather than this stage, and I did not touch spec, design, the constitution or the skills.