| Field | Value |
| --- | --- |
| gate | G2 |
| opened | 2026-10-04T09:15:22.443Z |
| holder | agent:architect |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I answered both conditions from the G3 ruling on the build of Slice 16 by moving three criteria.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I answered both conditions from the G3 ruling on the build of Slice 16 by moving three criteria. All 21 slices and every decision record are unchanged.

**Condition 1 (R-1.24 and R-2.5).** These now sit in Slice 17. Their tests read the anonymous proponent names ("Proponent 1", "Proponent 2" and so on) on the individual evaluation lists for Sprint With Us and Team With Us, and Slice 17 builds those lists. This is the same reason R-5.16 already sits there. The deadline hook that assigns the names, and moves each submitted proposal to the first review stage, stays built in Slice 16, which the condition asked for. Slice 16's description now says these two are answered for in Slice 17, and Slice 17's description says why they are there.

**Condition 2 (R-2.35).** This now sits in Slice 19. Its test enters a code challenge score on the Sprint With Us proposal view, and Slice 19 is the first slice that offers that score. The proposal history itself (every state change and score, with who, when and any note) is still built in Slice 16 with the Code With Us proposal view. Each later stage writes to it. Both slice descriptions now say this.

**What changed in the files.** In `plan/tasks.md`:
- Slice 16 drops three criteria and now has 12.
- Slice 17 gains two and now has 17.
- Slice 19 gains one and now has 7.

No slice's dependencies changed: Slice 17 already depends on 16, and Slice 19's chain of dependencies reaches back through every slice before it. In `plan/plan.md` I added two items to the list of criteria that sit awkwardly, next to the existing R-1.1 and R-1.25 items. Each says where the rule is built, where it is now answered for, and how long it is in force with no slice answering for it: one slice for the anonymous names, three for the history. The Constitution check is unchanged, because moving where a criterion is answered for touches none of its rules. No new decision record was needed.

**Checking.** I could not run `plan/check-coverage.mjs`, because running it needed an approval nobody was here to give. Instead I searched the criteria lines of `plan/tasks.md`: R-1.24 and R-2.5 now appear only in Slice 17, and R-2.35 only in Slice 19. Nothing else in the file was touched, so the total of 248 accepted criteria should be unchanged. Still, the script itself has not confirmed that this run, so it is worth running at the gate.

No condition was deferred, none was addressed to a person, and nothing asked for a change outside `plan/` or `docs/decisions/`. I made no new assumptions about the stack or the platform.

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: is this the right cut of the work, and does each slice stand on its own? Approve. The proposal does what both G3 revision requests from the build of Slice 16 asked. R-1.24 and R-2.5 move to Slice 17, whose individual evaluation lists (evaluation-individual-list-swu/-twu) are where their tests read the anonymous proponent names; this is the same placement already accepted for R-5.16, and the deadline hook that assigns the names stays built in Slice 16. R-2.35 moves to Slice 19, the first slice offering the code challenge score its test enters (proposal-swu-view.score_code_challenge), while the proposal history stays built in Slice 16. A search of plan/tasks.md confirms each moved criterion now appears on exactly one slice's criteria line (17 for R-1.24 and R-2.5, 19 for R-2.35), so no criterion is left unassigned. Slice dependencies are unchanged and still sound: 17 depends on 16, and 19's chain reaches 16. There is no schema change, no new dependency and no stack departure, and the tier is STANDARD, so there are no grounds to escalate. plan.md records the interval during which each rule is in force but answered for by no slice (one slice for the names, three for the history), stated as a property of the plan. The six owed build-slice-16 conditions concern the application, not the plan; this proposal does not settle them and they stay open for build. What would change this ruling: plan/check-coverage.mjs at the gate showing any criterion unassigned or double-assigned, Slice 17's lists turning out not to show proponent names, or an earlier slice offering a score R-2.35's test could use.

**Conditions:**
none
