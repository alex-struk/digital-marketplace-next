| Field | Value |
| --- | --- |
| gate | G2 |
| opened | 2026-10-02T23:09:04.732Z |
| holder | agent:architect |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I took up the one condition: R-5.16 has moved out of Slice 10 and into Slice 17.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I took up the one condition: R-5.16 has moved out of Slice 10 and into Slice 17. Nothing else in the plan changed. I couldn't run the coverage script because the command needed approval. A search of `plan/tasks.md` shows R-5.16 on exactly one criteria line, Slice 17's. Slice 10's description still mentions it, but only in prose, which the check doesn't count.

**The condition.** A G3 ruling on the build of Slice 10 found R-5.16's test unbound there. The criterion says the evaluation panel may change during individual question evaluation and is fixed from consensus onwards. Its second clause can only be reached through the individual evaluation screens (`evaluation-individual-create-swu` and its Team With Us counterpart), which no slice up to 10 builds. The ruling offered two remedies: move the clause to the slice that delivers individual evaluation, or name a seeded opportunity already at consensus as Slice 10's starting state.

**What I chose.** I took the first remedy and moved the whole criterion, because one criterion ID can't be split across two slices. It now sits in Slice 17 ("Panel evaluators score proponents individually"). That slice's closure, Slices 16 back through 7, holds three things the test needs:
- the panel tab, from Slice 10;
- the deadline hook that puts an opportunity into individual evaluation, from Slice 16;
- the individual evaluation screens and the automatic move to consensus, from Slice 17 itself.

**Why I rejected the seed.** It would cover only the second clause. The first clause also starts from an opportunity whose questions are being evaluated individually, and nothing before Slice 16 can produce one. A seed would also test the rule against data the service could not have made itself at that point.

**Edits made:**
- **`plan/tasks.md`:** R-5.16 is off Slice 10's criteria line and on Slice 17's. Slice 10's description now says it builds the panel-change window and that Slice 17 answers for it. Slice 17's description now says why the criterion sits there.
- **`plan/plan.md`:** a new passage under "Criteria that sit awkwardly where they are" records the move, the rejected seed option and the gap it leaves. The window is built and enforced from Slice 10, but no slice answers for it until Slice 17, seven slices later. This is the same kind of gap the section already records for R-1.19 and R-6.15.

**What stays the same.** There are still 21 slices in the same order. No dependencies changed, since Slice 17 already depended (indirectly) on Slice 10. The Constitution check section is unchanged, because the move brings no new constitution rule to bear. I wrote no decision record: the choice is recorded beside the earlier moves of the same kind, and it changes no framework, data store or boundary.

**Assumptions.** I made no new assumption about the stack or the platform.

No condition was addressed to a person, so I left none for anyone. I touched nothing outside `plan/` and `docs/decisions/`.

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the right cut of the work, and does each slice stand on its own, now that R-5.16 has moved from Slice 10 to Slice 17? Ruling: approve. R-5.16's given (an opportunity whose questions are being evaluated individually) and its refused second change (after the move to consensus) are both only reachable through the individual evaluation screens and the automatic move to consensus, which Slice 17 delivers; its closure (Slices 16 back to 7) holds the panel tab from Slice 10 and the deadline hook from Slice 16, so the slice can walk the test end to end. The criterion appears on exactly one criteria line (Slice 17), so nothing is left unassigned, and Slice 10's description still says the window is built there. Rejecting the seed alternative is sound: a seed at consensus would answer only the second clause, and the first clause needs a live transition into and out of individual evaluation. That contrasts correctly with R-1.43, which stays in Slice 10 because its test starts from a seeded consensus opportunity (tests/seed/manifest.yaml) and asserts only the refusal. The seven-slice gap, where the rule is enforced but no slice answers for it, is recorded in plan.md beside the R-1.19 and R-6.15 cases of the same kind. There is no schema change, no new dependency, no stack departure and no constitution impact, and the tier is STANDARD, so nothing escalates. The owed build conditions build-slice-10-3#1 (R-1.17 question cap) and #2 (R-1.53 admin delete of a Sprint With Us draft) belong to build and are not settled by a plan change, so they stay open. What would change the ruling: R-5.16 appearing on a second criteria line, Slice 17's closure turning out not to include Slice 10 or Slice 16, or evidence that R-1.43's seeded consensus start is itself unbound in Slice 10, which would mean that criterion needs the same move.

**Conditions:**
none
