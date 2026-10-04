---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "That answers both conditions from the build of Slice 17, and I deferred neither."
opened: 2026-10-04T12:33:33.462Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** That answers both conditions from the build of Slice 17, and I deferred neither.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've moved both criteria, R-5.28 and R-5.36, from Slice 17 to Slice 18 in `plan/tasks.md`. That answers both conditions from the build of Slice 17, and I deferred neither. There are still 21 slices in the same order and with the same dependencies. No other criterion changed slice, and I did not touch any decision record.

**R-5.28.** This criterion says that before consensus only the evaluator who wrote an individual evaluation can read it, and that an administrator off the panel can read them only after the question stages. The ruling found that its test opens the chair's per-proponent consensus create page, and Slice 18 is where that page gets built.

**R-5.36.** This criterion says the two programs run one evaluation that differs only in names, how many proponents go forward, and what the next stage is called. The ruling found that both its cases open the Sprint With Us and Team With Us consensus create pages and go on through finalising. Slice 18 delivers both of those.

**Where the work is built.** Slice 18's description now says it answers for both criteria and why. It also says where the work is actually built. The read rules are built in Slice 17 with the individual evaluation screens. The shared two-program implementation spans Slices 17 and 18. This is the same note the plan already uses for R-1.24, R-2.5, R-5.16 and R-6.15.

**Changes to `plan/plan.md`.** I made two changes and left the rest as I found it:
- **New placement note.** I added a paragraph next to the existing ones. It records that both criteria were first placed in Slice 17, and that a G3 ruling found them unbound there because of the consensus create pages. It explains that they now sit in Slice 18, since everything up to Slice 18 includes every screen they walk through. It also states the cost: for one slice, rules built in Slice 17 are in force but no slice answers for them.
- **Revised conflict note.** I rewrote the existing reservation about R-5.11 against R-5.28. It used to say both were in Slice 17. It now says R-5.11 is answered for in Slice 17 and R-5.28 in Slice 18. Both rules are still built in Slice 17's read checks, so the Slice 17 builder has to reconcile them in a way Slice 18's test will not refuse. The underlying conflict is unchanged and still needs someone to rule on it: as written, R-5.11 and R-5.28 cannot both hold for an administrator during individual evaluation.

**Checks.** By search, each of the two IDs now appears only in Slice 18's criteria line and its description, and no longer in Slice 17. I could not run the full script that checks every accepted criterion sits in exactly one slice, because running Python needed approval and none was available in this unattended session. Since the only change was moving these two IDs, I expect coverage to be the same as in the approved plan, but no full check was run.

The constitution rules that bear on the plan, and how the plan meets each, are as before. I added no new assumptions about the stack or the platform. Neither condition was addressed to a person, and neither asked for changes outside `plan/` or `docs/decisions/`.
