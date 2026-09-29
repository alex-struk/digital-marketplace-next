---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I made the one change this revision asked for: the R-6.1 note in `spec/contract/observables.yaml`."
opened: 2026-09-29T00:24:30.289Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I made the one change this revision asked for: the R-6.1 note in `spec/contract/observables.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change this revision asked for: the R-6.1 note in `spec/contract/observables.yaml`. I did not try to start the oracle. The shell would not run the command that starts it.

**The change.** The notes under `configurations.notifications_disabled` used to tell a test for R-6.1 to read `SDLC_ORACLE_DISABLE_NOTIFICATIONS` and to skip when it was missing. A later calibration ruling found that behaviour useless, because the skipping test never produced a result, and it was overturned. The note now says a test for R-6.1 assumes it is running against an instance started with notifications switched off, and never skips itself. If it runs against an instance with notifications on, it fails, because the message it says must not be sent does get sent.

To say how that test is picked out, I added one field to the same entry: `tag: "@notifications_disabled"`. A new note explains how the tag is used:
- The tagged test runs only against a separate instance started with `SDLC_ORACLE_DISABLE_NOTIFICATIONS=1`, in a run limited to that tag (`--grep @notifications_disabled`).
- The default run leaves it out (`--grep-invert @notifications_disabled`). The test clears the mail catcher and then acts, so on the shared catcher it would remove and add messages that other tests are reading.

The tag matches the one on the R-6.1 test in the `derive-tests-notifications-stale-7` proposal branch, which carries `{ tag: "@notifications_disabled" }` and no longer skips. The note that such an instance serves R-6.1 alone and is never shared is unchanged.

The contract only states this selection rule. Nothing in `tests/playwright.config.ts` or the runner splits the runs by tag yet. Until the harness does, the default run will include the R-6.1 test and it will fail against the notifications-on oracle. That runner change belongs to whoever owns the harness, not to this stage.

**Unchanged from the last approved contract:** the pages in `surface.yaml`, how each persona signs in (`personas.yaml`), the seed files `000`–`014` with their manifest, `openapi.yaml`, and the Compose override. Everything described in earlier contract journals still holds.

**What I could not do.**
- **Starting the oracle.** Both `node $SDLC_BIN oracle up` and `printenv SDLC_BIN` were refused by this session's permission settings. The override itself did not change, but it was not re-proven this run, and no `oracle down` was needed because nothing started.
- **Checking the YAML parses.** The Python parse check was also refused. I checked the edit by reading the diff: the new `tag:` key sits at the same indentation as its neighbours and the notes stay a plain list.

**Missing tests.** None of the six owed items were supplied, because this revision is limited to the change the ruling names. They stay owed by this stage, and I wrote no re-address lines. What each still needs, as the test writer recorded it:
- **R-2.22:** a `choose_organization` action on the proposal edit pages, plus an observation reporting the service's own refusal wording.
- **R-2.31:** a rank observation readable while an opportunity is still being evaluated, or a seeded awarded opportunity with a proposal left behind before the last stage.
- **R-2.21:** a refusal observation that locates the error on the specific question response it concerns.
- **R-2.28:** a way to send an evaluation score to the service at the wrong stage, such as a request surface for scoring.
- **R-4.24:** an observation of the date and time new-opportunity notices were turned on.
- **R-8.30:** a `change_logo` action on `organization-edit`, with observations for the current logo and a logo refused for its file ending.

A contract run without the "change only what it names" restriction should take these up.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether this revision of the contract is the one the tests act through. It makes exactly the change the derive-tests-notifications-stale-7 revision request asked for. The note under configurations.notifications_disabled no longer tells the R-6.1 test to skip on a missing environment variable, the behaviour the calibrate-old-11 ruling overturned. It now says the test assumes an instance started with notifications off, never skips itself, and fails if run with notifications on. It also states the selection rule: a `tag: "@notifications_disabled"` field, a run limited to that tag against a dedicated SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 instance, and a --grep-invert on the default run, because the test clears the shared mail catcher. I read the edited entry on the branch (observables.yaml lines 167-194). The new key sits at the same indentation as its neighbours and the notes remain a plain list. The R-6.1 test currently on the branch still skips, which is expected, because its rewrite is in the separate derive-tests proposal that carries the same tag. Nothing else in the contract changed, and no criterion's statement or confidence is touched. Two items remain open and do not block this ruling. First, the runner does not yet split runs by tag, so the default run will include the tagged test and fail until the harness owner adds the grep and grep-invert split; the stage disclosed this honestly. Second, the six owed contract observations (R-2.22, R-2.31, R-2.21, R-2.28, R-4.24, R-8.30) remain owed, because this revision was correctly limited to the named change. What would change the ruling: the note still permitting a self-skip, the tag disagreeing with the one on the R-6.1 test, or the entry failing to parse.

**Conditions:**
none
