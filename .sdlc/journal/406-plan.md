---
stage: "plan"
title: "plan"
at: "2026-10-02T16:38:57.533Z"
cost: 0.5395449999999999
turns: 19
session: "72950ef2-5f40-4286-9514-e96ad23f60d5"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I took up the one request addressed to this stage, from the G3 ruling on the Slice 9 build (build-slice-9-3), and moved R-1.35 and R-1.36 out of Slice 9 into Slice 14. Slice 14 builds the Code With Us proposal screen (proposal-cwu-create). I couldn't run the coverage check, so placement was confirmed by searching the files instead.

**Why they moved.** R-1.35 says adding or changing an addendum notifies watchers, everyone who has submitted a proposal, and the author. R-1.36 says the same of cancelling. Slice 9 still builds the addenda tab, cancellation and both notices; only the slice that answers for the two criteria changes. Both tests start by submitting a Code With Us proposal on a page only Slice 14 serves. In the Slice 9 build anyone signed in who goes there is sent to `/dashboard`, so both criteria were unbound there.

**What changed:**
- **Slice 9** no longer lists the two criteria. A note in its description says the notices are still built there and checked in Slice 14.
- **Slice 14** lists both criteria and says it checks the notices reaching vendors who have proposed.
- **Slice 14 dependencies:** Slice 14 now depends on Slice 9 as well as Slices 8 and 11, because the tests also need the addendum and cancel actions. Build order is unchanged, since Slice 9 already comes earlier.
- **Why Slice 14:** it is the first slice where someone who has proposed exists to be notified, so I didn't place them any later.

**Plan text.** `plan/plan.md` has a new entry under "Criteria that sit awkwardly where they are". It names the cost: a rule about running an opportunity is now answered for by the proposal slice, and until Slice 14 lands the half of each notice that goes to proposers is built but reaches nobody. The coverage check section also records the move; no domain row or count changes. Nothing else changed: no other slice, no constitution-check text, and no decision record, because a move like this is a placement, not a new choice. There are still 21 slices and 248 criteria, each placed once.

**Not verified by running anything.** Running the Python edit script or `node plan/check-coverage.mjs .` needed an approval this session couldn't get. I made the edits by hand and confirmed by search that R-1.35 and R-1.36 now appear on Slice 14's criteria line only; Slice 9 mentions them only in its description, which the check doesn't read. Whoever next has a shell should run the coverage script.

**Left alone.** In the coverage check table, the notifications row's list of slices was already stale (it leaves out Slices 12, 14 and 18, which hold R-6.16, R-6.2 to R-6.5 and R-6.15). It is untouched by this move and outside what the ruling named, so it is worth fixing in a later revision. No conditions were addressed to a person, and nothing asked me to change spec, design, the constitution or the skills.

No assumptions about the stack or platform were added in this revision.