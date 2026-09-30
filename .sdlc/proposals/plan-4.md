---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I moved the eight criteria the ruling named out of Slice 2, each to the slice that delivers the screen its test goes through."
opened: 2026-09-30T18:33:34.157Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I moved the eight criteria the ruling named out of Slice 2, each to the slice that delivers the screen its test goes through.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I moved the eight criteria the ruling named out of Slice 2, each to the slice that delivers the screen its test goes through. The mail path, account creation and the post-sign-in redirect are still built in Slice 2. The criteria that describe them are now answered for in later slices. The plan still has twenty-one slices in the same order, their dependencies are unchanged, and no other slice's criteria moved.

**Where each criterion went:**
- **Slice 3 (profile editing and `/users/:userId`)** gets R-4.6 (one account per identity and kind, and no shared email), R-4.27 (profile field rules) and R-4.28 (job title only for public sector staff). All three tests go through the profile edit form.
- **Slice 7 (the Code With Us create screen)** gets R-6.2. Its given is publishing an opportunity while the mail server is unreachable.
- **Slice 8 (the dashboard with its own-opportunities table)** gets R-4.22. A returning person lands on the dashboard, and that screen first exists in Slice 8.
- **Slice 11 (organization editing)** gets R-6.3, R-6.4 and R-6.5. These are the hardest placement.

**Why R-6.3 to R-6.5 are uncertain:** they are about "any message", and the ruling named four screens for the eight criteria as a group without saying which of these three used which. Nothing in the workspace records the tests or the verify findings, so I couldn't find out. I put them in Slice 11 because it delivers the one named screen no other criterion accounts for. It is also the first slice in the linear build order after which all four named screens exist, so the placement holds whichever screen a test sends its message from. `plan/plan.md`, in its section on criteria that sit awkwardly, says this openly: a mail rule sits in an organizations slice only because that is where its test was found to run. It also says that if the Slice 11 builder finds the tests going through an earlier screen, moving them earlier changes nothing else. I left Slice 11's "depends on" line as Slice 3, because the ruling did not name it. Whoever rules may want Slice 7 added there, to make explicit what the build order already guarantees.

**Other edits:**
- **Slice 2's "delivers" line** now says these behaviours are built there but answered for in slices 3, 7, 8 and 11.
- **The older note about R-6.1 and R-6.3** in `plan/plan.md` now gives R-6.3's new slice.
- **The constitution check and the decision records** are unchanged. Moving criteria between slices bears on no constitution rule differently, and no new choice needed a record.

**Coverage check:** I couldn't run `plan/check-coverage.mjs`, because the command needed an approval that nobody in this session could give. I checked by hand instead: each of the eight criteria now appears on exactly one criteria line, and nothing was added or removed, so the total is still 248. The script should still be run before the gate relies on the count.

**Assumption:** I read "the opportunity dashboard's own-opportunities table" as the screen for R-4.22. I also read "profile editing and /users/:userId" as the screen for R-4.6, R-4.27 and R-4.28, working from what each criterion describes rather than from the tests themselves.

No condition in the ruling was addressed to a person, so I left nothing for the runner or the tech lead. Nothing asked me to change spec, design, the constitution or the skills, and I wrote nothing outside `plan/`.
