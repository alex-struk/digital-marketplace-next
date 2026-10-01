---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I made only the two changes the ruling asked for and left every other slice as it was."
opened: 2026-10-01T08:19:46.929Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I made only the two changes the ruling asked for and left every other slice as it was.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've finished the revision. I made only the two changes the ruling asked for and left every other slice as it was.

**What changed**

- **R-6.15** (multi-recipient notices hide every recipient, including notices to the panel and the owner) moved from Slice 10 to Slice 18, the slice where the chair agrees a consensus. Its test reaches the owner's notice by walking Team With Us individual evaluation (built in Slice 17) and the chair's consensus submission (built in Slice 18). Slice 18 depends on Slice 17, so every screen the test walks exists by then. I updated the Slice 7 entry ("answered for in slices 9, 10, 14 and 18"), took R-6.15 out of Slice 10's entry, and extended Slice 18's entry to cover it. The blind-copy batching itself is still built in Slice 7.
- **R-1.19** (the state values of every program) stays in Slice 10, and Slice 10 now depends on Slice 9 as well as Slice 7. Its test's third example ("an opportunity finally reaches cancelled") uses the cancel action, and only Slice 9 builds that. I chose the added dependency over moving the criterion later. Build order doesn't change, because Slice 10 already came after Slice 9. And the state values of all three programs belong in the first slice where opportunities of all three programs exist. The cost is that Slice 10 can no longer be built or shown before cancellation exists.

**Where the reasoning is recorded**

Both reservations are written under "Criteria that sit awkwardly where they are" in `plan/plan.md`, as the ruling asked. The R-6.15 entry also states one consequence plainly: from Slice 7 to Slice 18, a blind-copy rule is in force that no slice answers for yet.

**Placements I didn't revisit**

The four moves the ruling upheld are unchanged: R-1.20 in Slice 9, R-1.8 and R-1.48 in Slice 10, and R-6.2 in Slice 14.

**Shape of the plan**

There are still 21 slices. No schema change, no new library or service, and no new decision records; nothing about the stack or the platform changed. Decision record 0013 (the mail path) mentions the shape R-6.15 requires but not which slice answers for it, so it needed no edit.

**Checks**

I couldn't run the coverage script `plan/check-coverage.mjs`, because running it needs approval nobody was here to give. Instead I searched `plan/tasks.md` and confirmed that R-6.15 and R-1.19 each appear on exactly one criteria line. Since this revision only moved one ID from one slice to another, the 248-criterion coverage should be unchanged, but the next stage should run the script to confirm it.

**Left open**

The owed build conditions build-slice-7-3 #1 and #2 can't be settled by changing the plan. They belong to whoever builds and rules on Slice 7 (the build stage and its gate), and I did nothing about them.
