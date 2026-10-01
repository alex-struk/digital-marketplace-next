| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T10:02:32.138Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I made the one change the ruling asked for, which was condition 5.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the ruling asked for, which was condition 5. In `uploadGiven` (`tests/adapters/new/index.ts`, around line 2948), the file's `content` is now passed to `fileGiven` when it is a `Uint8Array` as well as when it is a string. A `Buffer` is a kind of `Uint8Array`, so the R-8.17 test's `Buffer.alloc(just over 10 MiB)` now reaches the service as the oversized file it is, instead of being swapped for a small default file. `fileGiven`'s signature and the harness's `uploadFile` already accepted `Uint8Array` content, so no other code had to change. `offerFile` was left alone, as the ruling said. `bindings.yaml` is unchanged, because nothing moved between bound and unbound.

I have not confirmed the fix by running anything. This session would not let me run the type check, and I did not run R-8.17 against the target. The next calibration will be the first to show whether `fileUpload.refusedForSize` now reads the refusal. For the same reason, the open request from build-slice-7-7, about which step of R-8.17 read '', is still unanswered. It belongs to whichever run takes it up.

I looked again at what R-1.48 and R-1.9 need, without redoing the full walk. I signed in through the sandbox identity provider as the public sector employee (`test-gov`), which landed on /dashboard. I then opened `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create`. Both answer "Page not found", with the signed-in account menu showing, and they did the same when I was signed out. The earlier finding stands: the running build offers neither create screen, so `opportunity-swu-create.open` and `opportunity-twu-create.open` stay unbound with the reasons they already had.

No other page's route was checked again in this run. Nothing outside `tests/adapters/new/` was touched, and no password or environment value was written anywhere.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new adapter bind every surface action and observation, and nothing else, now that the last owed condition is addressed? Ruling: approve. Condition bind-adapter-new-28#1 is carried out: uploadGiven in tests/adapters/new/index.ts now forwards 'content' to fileGiven when it is a Uint8Array (which includes Buffer) as well as a string, and fileGiven (line 2916) already takes string | Uint8Array and passes it to uploadFile, so R-8.17's oversized Buffer now reaches the service as the oversized file. The rest of the diff is the work for conditions 1-4 carried from bind-adapter-new-28, which that ruling found matched what was asked: stored-row detection by /api/files/ link, refusal-versus-unbound for publish and the create screen keyed on the acting persona, and in-place editing of a draft. All of it is navigation, locating elements and reporting refusals, with no assertion of its own. Nothing under tests/acceptance changed, and the runner's typecheck passed with no diagnostics under adapters/new. The unbound reasons for opportunity-swu-create.open and opportunity-twu-create.open are real: both routes answer 'Page not found' signed in and signed out, which is the application lacking those screens. The fix has not been run against the target, and the next calibration is the first evidence for fileUpload.refusedForSize. What would change this ruling: a calibration showing R-8.17 still sends a small file, or still reads '' because of the binding, would bring it back to bind-adapter. The separate build-slice-7-7 request about which step of R-8.17 read '' remains open for its own run.

**Conditions:**
- condition-met bind-adapter-new-28#1: uploadGiven in tests/adapters/new/index.ts (around line 2948) now passes 'content' to fileGiven when it is a string or a Uint8Array (Buffer included), so R-8.17's Buffer.alloc(just over 10 MiB) is uploaded as given instead of a default file; offerFile is unchanged; the runner typecheck on 4aadbd4eb passed.

### Runner-owned typecheck evidence

Proposal revision: `4aadbd4ebe9a971e04ef9bd0504d363be278d697`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
