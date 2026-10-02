---
stage: "plan"
title: "plan"
at: "2026-10-02T02:28:56.717Z"
cost: 0.4502328
turns: 15
session: "ffe774ba-577f-445f-a57b-7595885fd695"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I took up the one condition sent to this stage: build-slice-8-3, ruled at G3 by the tech lead. I moved R-1.39 from Slice 8 to Slice 10. Nothing else in the slice list changed.

**Why it moved.** R-1.39 says the opportunity list can be narrowed by program, by state, to remote-friendly opportunities, and by free text. But its test saves a Sprint With Us draft on `/opportunities/sprint-with-us/create`, and only Slice 10 serves that screen. Slice 10 already depends on Slices 9, 8 and 7, so it has both the create screen and the list. No dependency changes. The plan still has 21 slices and all 248 accepted criteria are placed. Slice 8 still builds every list filter; only the slice that answers for the criterion moved, so Slice 8's "delivers" line is unchanged.

**What I changed:**
- **`plan/tasks.md`:** R-1.39 is off Slice 8's criteria line and on Slice 10's.
- **"Criteria that sit awkwardly" in `plan/plan.md`:** a new entry for R-1.39. It is the most uneasy placement in the plan, because the criterion's wording and its test are about different things. A rule about filtering the list is now answered for by the Sprint With Us creation slice, only because its test creates a draft to look for.
- **"For ruling" in `plan/plan.md`:** a new item 11 asks for that mismatch to be settled. Either the test is changed to filter the list using a Code With Us opportunity, and R-1.39 goes back to Slice 8 with nothing else moving, or the spec gives the draft step its own criterion. Neither is this stage's to do: the test belongs to the acceptance suite's owner, and new criteria are the spec's to write.
- **Coverage note in `plan/plan.md`:** it records the move. The per-domain counts don't change; the opportunities row still lists both slices.

**Not verified by script.** I couldn't run `plan/check-coverage.mjs` because the command needed an approval this session couldn't get. By hand, I searched `plan/tasks.md` and R-1.39 now appears on exactly one criteria line, Slice 10's. Whoever next has a shell should run `node plan/check-coverage.mjs .` from the workspace root.

**Constitution rules.** The two this change touches are P5 (spec as source of truth) and P7 (test integrity). Under P7, a criterion goes in the slice whose screens can actually reach its test; when that conflicts with the criterion's wording, the plan records the conflict for ruling instead of quietly re-cutting a slice around the test.

**Other notes.** I wrote no new decision record, because this is a placement correction rather than a design choice. I made no new assumptions about the stack or the platform. No conditions were addressed to a person, so I left none for anyone. I deferred nothing, and touched nothing under spec, design, constitution.md or `.claude/skills`.