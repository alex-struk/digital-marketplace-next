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
