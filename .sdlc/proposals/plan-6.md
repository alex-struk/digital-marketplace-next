---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "Nothing else in the plan changed: there are still twenty-one slices, all 248 accepted criteria are still placed, and no decision records were added or edited."
opened: 2026-09-30T23:11:59.448Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** Nothing else in the plan changed: there are still twenty-one slices, all 248 accepted criteria are still placed, and no decision records were added or edited.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've moved both criteria the ruling named out of Slice 2 and into Slice 8. Nothing else in the plan changed: there are still twenty-one slices, all 248 accepted criteria are still placed, and no decision records were added or edited.

**The finding.** Verification on build-slice-2-12 found R-6.20 and R-6.28 unbound in Slice 2. Each one's test goes through a screen a later slice delivers:
- R-6.20 (a new account has new-opportunity notices off) is tested by publishing a Code With Us opportunity at `/opportunities/code-with-us/create`, which Slice 7 delivers.
- R-6.28 (skip a recipient with no email address, and keep a broadcast going past anyone it can't address or reach) is tested by reading another person's profile at `/users/:userId`, which Slice 3 delivers.

**Why Slice 8.** Slice 8 depends on Slices 7, 3, 2 and 1, so both screens exist before it is verified. It also carries the control that turns new-opportunity notices on and off (R-6.21), and both criteria fit next to it. R-6.20 is about notices staying off until the person asks for them. R-6.28 is about the announcement broadcast to people who turned notices on.

I considered putting R-6.28 in Slice 3, which delivers its screen. I rejected it because Slice 3 sends no message to many recipients, so the "broadcast continues past a recipient" half of the criterion could not be shown there. That reason is my own reading of the criterion; I have not seen R-6.28's test. The actual behaviour (skipping recipients with no address) is still built in Slice 2's mail path; only where it is tested and signed off has moved.

**Edits:**
- **`plan/tasks.md`:** both criteria are off Slice 2's criteria line and on Slice 8's.
    - Slice 2's delivers line now says it builds what the two criteria describe, while they are signed off later.
    - Slice 8's delivers line now says the notice control is shown against the announcement that Slice 7's publishing sends.
- **`plan/plan.md`:** the section on criteria that sit awkwardly has a new entry explaining the move. It says R-6.28 fits the same uneasy way as R-6.3 to R-6.5: a mail rule for the whole service, signed off in the first slice where its test can run.

**Not verified.** I could not run `plan/check-coverage.mjs`, because running it needed an approval nobody was here to give. Searching the file by hand shows each criterion on exactly one criteria line, in Slice 8; the only other mentions are in Slice 2's delivers text, which the check does not read.

The ruling asked nothing of a person, and I changed nothing under spec, design, `constitution.md` or `.claude/skills`. The one request was taken up, and none is deferred.
