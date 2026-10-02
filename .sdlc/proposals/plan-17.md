---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I took up the one request addressed to this stage, from the G3 ruling on the Slice 9 build (build-slice-9-3), and moved R-1.35 and R-1.36 out of Slice 9 into Slice 14."
opened: 2026-10-02T16:38:57.577Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I took up the one request addressed to this stage, from the G3 ruling on the Slice 9 build (build-slice-9-3), and moved R-1.35 and R-1.36 out of Slice 9 into Slice 14.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether moving R-1.35 and R-1.36 from Slice 9 to Slice 14 is the right cut and leaves each slice standing on its own. I approve. In plan/tasks.md both criteria now appear only on Slice 14's criteria line; Slice 9 names them only in its delivers text, which the coverage check does not read, so each is still placed exactly once. Slice 14 now depends on Slices 8, 9 and 11, and Slice 9 depends only on Slice 8, so the dependency graph has no cycle and build order does not change. Slice 14's closure now holds the addendum tab, the cancel action and the Code With Us proposal create screen, which together are what both tests need to arrange their given. Slice 9 keeps six criteria it can verify by itself. Slice 14 is the earliest slice where a proposer exists to be notified, which justifies placing the criteria there and no later, and plan.md states the cost: the proposer half of both notices is unshown until Slice 14 lands. No schema change, no new dependency, no stack departure, and the tier is STANDARD, so nothing triggers escalation. Neither the proposal nor this ruling could run plan/check-coverage.mjs, because the session's permissions refused it, so placement is confirmed by search only. The ruling would change to return if that script finds R-1.35 or R-1.36 placed twice or not at all, or if Slice 14's dependencies turn out to miss something the R-1.35/R-1.36 tests arrange. build-slice-9-3#6 belongs to build and stays open. The stale notifications row in plan.md's coverage table is minor and not grounds to return.

**Conditions:**
none
