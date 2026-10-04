---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I answered both conditions from the G3 ruling on the build of Slice 16 by moving three criteria."
opened: 2026-10-04T09:15:22.443Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

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
