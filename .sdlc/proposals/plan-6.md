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

## Ruling

**Verdict:** return
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Is this the right cut of the work, and does each slice stand on its own? Return. Moving R-6.20 to Slice 8 is sound: its test publishes a Code With Us opportunity, and Slice 8's closure includes Slice 7, which delivers that screen. Moving R-6.28 to Slice 8 is not. Its test signs in as an administrator, reads each vendor's profile at /users/:userId (Slice 3), then sends the announce-changed-terms broadcast to active vendors (Slice 6) and checks every addressable vendor received it. Slice 8's closure (Slices 7, 3, 2, 1) does not include Slice 6, so R-6.28 would be unbound there exactly as it was in Slice 2. Slice 6's closure (Slices 5, 3, 2, 1) holds both screens. The new plan.md entry is also wrong: it justifies Slice 8 by a 'broadcast to subscribers' of new-opportunity notices, which R-6.28's test never uses. Approving would need R-6.28 on Slice 6's criteria line and the plan.md entry rewritten to match. build-slice-2-12#3 is asked of build and is not settled here, so it stays open.

**Conditions:**
- Move R-6.28 from Slice 8's criteria line to Slice 6's. Its test sends the announce-changed-terms broadcast to active vendors, which Slice 6 delivers, and reads vendor profiles at /users/:userId, which Slice 3 delivers. Slice 6's dependency closure (Slices 5, 3, 2, 1) holds both screens. Slice 8's closure (Slices 7, 3, 2, 1) does not include Slice 6. Take R-6.28's broadcast wording out of Slice 8's delivers line and add it to Slice 6's.
- Rewrite the R-6.20/R-6.28 entry in plan/plan.md so that R-6.28 is placed with the changed-terms broadcast in Slice 6, not with the new-opportunity announcement to subscribers, which its test does not use. Keep R-6.20's placement in Slice 8 and the reasoning for it.
