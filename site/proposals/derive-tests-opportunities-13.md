| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T10:52:58.006Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I made the one change the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the ruling asked for. In `tests/acceptance/opportunities/R-1.36.spec.ts`, the author test ("— its author is told separately that the cancellation was actioned") now passes only if a message is visibly addressed to the author, names the opportunity's title, and mentions the cancellation in its subject or body. That is the same "cancel" check the watcher-and-proponent test already uses. A message to the author that names the opportunity for some other reason, such as a late notice about the proposal submitted during setup, no longer satisfies it. I also changed the comment at the top of the file so it describes this check for the author's message.

Nothing else changed. The header lines stay as they were: the "derived" date was already today's date, so it needed no rewrite. The R-1.35 file, the watcher-and-proponent test and `tests/acceptance/not-testable.yaml` are untouched, and no criterion needed a new not-testable entry.

I could not run the typecheck: running the compiler needed an approval this unattended session cannot get. The change adds one more condition of the same form as the one beside it, using the same field and string, so I don't expect it to break the typecheck. Even so, the runner's typecheck is the first real check of it.

No surface action or observation was missing for this change.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the revised opportunities tests now follow from R-1.35 and R-1.36 and from nothing else. Approved. The last ruling, derive-tests-opportunities-stale-16, returned this for one reason: the R-1.36 author test never asserted the clause 'that the cancellation was actioned'. The fix is in the diff. In tests/acceptance/opportunities/R-1.36.spec.ts, noticeFound in the test '— its author is told separately that the cancellation was actioned' now passes only on a message that is visibly addressed to the author, names the opportunity's title, and mentions the cancellation in its subject or body. It uses the shared readMessage and the same 'cancel' check as the watcher-and-proponent test, so a message to the author that names the opportunity for some other reason, such as a late notice about the proposal submitted during setup, no longer satisfies it. Everything else on the branch is what the earlier ruling already judged sound. The R-1.35 edit and addendum tests each assert that the watcher, the proponent and the author are reached exactly once, which is what the criterion says. The R-1.36 watcher-and-proponent test asserts the title and the cancellation. Neither file reads the proposal listing, the watcher count or the opportunity's status. The service's sending address comes from the contract's email notes, not from the application. No criterion clause is left unasserted, and the tests need no not-testable entries. The writer said they could not run the typecheck. The runner ran it on this revision and it passed with no diagnostics. A failing typecheck, or a test that asserts something its criterion does not say, would change this ruling.

**Conditions:**
- condition-met derive-tests-opportunities-stale-16#1: tests/acceptance/opportunities/R-1.36.spec.ts, noticeFound in the test '— its author is told separately that the cancellation was actioned', now requires message.about to include 'cancel' alongside visible addressing to the author and the opportunity's title, the same check the watcher-and-proponent test makes.

### Runner-owned typecheck evidence

Proposal revision: `dbdc71bd16937093a3e735aef19e427475dc66d0`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
