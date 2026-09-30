---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "The slice count, order and every other placement are unchanged."
opened: 2026-09-30T23:14:18.145Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** The slice count, order and every other placement are unchanged.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've moved R-6.28 into Slice 6 and rewritten its entry in `plan/plan.md` as the ruling asked. The slice count, order and every other placement are unchanged. I couldn't run the full coverage check: the script that compares every accepted criterion against the slices needed an approval this session couldn't get. What I did confirm by search is that R-6.28 now appears on exactly one criteria line, Slice 6's.

**What changed in `plan/tasks.md`**
- **Slice 6** ("An administrator can announce changed terms, and vendors accept them again") now lists R-6.28 in its criteria. Its delivers line now says the broadcast to active vendors skips a vendor with no address and carries on past one it cannot reach.
- **Slice 8** no longer lists R-6.28, and its delivers line has lost the broadcast wording that came with it. R-6.20 stays in Slice 8 with its "not sent it until it asks" wording.
- **Slice 2** has one follow-on fix the ruling didn't name. Its delivers line lists the slices that answer for criteria it builds on but doesn't own. That list said "slices 3, 7, 8 and 14"; it now says "slices 3, 6, 7, 8 and 14". Without this, the line would have kept pointing R-6.28 at the wrong slice.

**What changed in `plan/plan.md`**
The R-6.20/R-6.28 entry among the awkward placements is now two separate explanations:
- **R-6.20** stays in Slice 8, for the same reason as before. Its test publishes a Code With Us opportunity through the Slice 7 screen. Slice 8's dependency closure (Slices 7, 3, 2, 1) holds that screen, and Slice 8 carries the notice control (R-6.21) that "until they ask" is shown against.
- **R-6.28** now sits in Slice 6, placed by what its test does. It signs in as an administrator, reads vendor profiles at `/users/:userId` (Slice 3), sends the announce-changed-terms broadcast (Slice 6), and checks that every vendor with an address received it. Slice 6's closure (Slices 5, 3, 2, 1) holds both screens.
- The entry also records why the previous placement was returned. It had tied R-6.28 to the new-opportunity announcement to subscribers, which its test never uses. It had also put it in Slice 8, whose closure doesn't include Slice 6.
- It keeps the note that the skip-no-address behaviour is built in Slice 2's mail path. It also keeps the admission that the fit is uneasy, the same way it is for R-6.3 to R-6.5: a service-wide mail rule is answered for where its test can first run.

I took the ruling's statement that Slice 6's closure is Slices 5, 3, 2, 1 as given; the Slice 5 and Slice 3 entries weren't reopened in this revision. The other mentions of R-6.28 in `plan/plan.md` (the logging rule and the behaviour changes) don't depend on which slice it sits in, so I left them alone.

I didn't write or change any decision record: this revision made no new choice of framework, data store or boundary. The stack assumptions in the earlier plan stand as they were.

The ruling leaves item build-slice-2-12#3 open and addressed to the build stage. It isn't this stage's to settle, so I left it for the build stage. I changed nothing outside `plan/`.

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the right cut of the work, and does each slice stand on its own? Ruling: approve. The revision does what plan-6 asked. On the criteria lines in plan/tasks.md, R-6.28 now appears only in Slice 6 ('An administrator can announce changed terms'). Its test reads vendor profiles at /users/:userId (Slice 3) and sends the changed-terms broadcast to active vendors (Slice 6). Slice 6 depends on Slice 5, Slice 5 on Slice 3, Slice 3 on Slice 2 and Slice 2 on Slice 1, checked against the depends-on lines on the branch, so Slice 6's dependency closure holds both screens. The broadcast wording moved from Slice 8's delivers line to Slice 6's. R-6.20 stays in Slice 8 with its reasoning intact: its test publishes through the Slice 7 screen, which Slice 8's closure (7, 3, 2, 1) holds, and it sits beside the notice control R-6.21. The Slice 2 follow-on change, adding 6 to the list of slices that answer for criteria Slice 2 builds on, is a correct consequence of the move. No criterion is left unassigned, there is no schema change and no new dependency, and the tier is STANDARD, so nothing calls for escalation. One minor point: the new plan.md entry includes drafting history ('An earlier revision put it in Slice 8 ... so it was returned'). That does not affect the cut of the work, but a later plan revision could remove it. What would change this ruling: R-6.28's test turning out to need a screen outside Slice 6's closure, or a slice left with a criterion no test in its closure can exercise.

**Conditions:**
- condition-met plan-6#1: R-6.28 moved from Slice 8's criteria line to Slice 6's in plan/tasks.md, and its broadcast wording (skip a vendor with no address, carry on past one it cannot reach) moved from Slice 8's delivers line to Slice 6's. Slice 2's answered-for list now names slice 6.
- condition-met plan-6#2: the R-6.20/R-6.28 entry among the awkward placements in plan/plan.md now places R-6.28 with the changed-terms broadcast in Slice 6 and gives the reason from its test (vendor profiles from Slice 3, the broadcast from Slice 6), and keeps R-6.20 in Slice 8 with its reasoning about the Slice 7 publishing screen and R-6.21.
