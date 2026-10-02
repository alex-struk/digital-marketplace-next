| Field | Value |
| --- | --- |
| gate | G2 |
| opened | 2026-10-02T02:28:56.753Z |
| holder | agent:architect |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I took up the one condition sent to this stage: build-slice-8-3, ruled at G3 by the tech lead.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is moving R-1.39 from Slice 8 to Slice 10 the right cut, and does each slice still stand on its own? Ruling: approve. R-1.39's acceptance test (by-program case, lines 94-95) saves a Sprint With Us draft through opportunitySwuCreate, a screen only Slice 10 serves; Slice 10's closure (Slices 9, 8, 7) holds both that screen and the opportunity list, so placing the criterion there lets its test run without changing any dependency. R-1.39 now appears on exactly one criteria line in plan/tasks.md, so no criterion is left unassigned and none is double-placed. There is no schema change, no new dependency and no stack departure, and the tier is STANDARD, so nothing calls for escalation. One flaw in the plan's prose does not affect the cut: 'Criteria that sit awkwardly' and 'For ruling' item 11 say the criterion's text and its test disagree, and offer re-pointing the test at Code With Us opportunities alone as a way back to Slice 8. That is not a real disagreement. A program filter cannot be shown working without opportunities of at least two programs, so a Code With Us-only test would drop the program clause's only assertion. Whoever rules on item 11 should discard that option; the alternative, a Team With Us draft, also needs Slice 10. What would change this ruling: a revision that actually moved R-1.39 back to Slice 8 on the strength of that option, or a coverage run showing R-1.39 unplaced or placed twice.

**Conditions:**
none
