| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T18:33:42.347Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I bound both new observations, `opportunity-cwu-edit.note_control_offered` and `opportunity-swu-edit.note_control_offered`, against the running target, and both read "false" there.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I bound both new observations, `opportunity-cwu-edit.note_control_offered` and `opportunity-swu-edit.note_control_offered`, against the running target, and both read "false" there. Both are now listed as `bound` in `tests/adapters/old/bindings.yaml`. I left all the existing bindings as they were.

**What the target shows.** The contract says to read each History tab as an administrator or as the opportunity's author:

- **Code With Us:** I signed in as public-sector staff, the seeded author of the opportunity with a private note. On its management screen the History tab shows a "History" heading and a table with three rows: "Note Added", "Published" and "Draft".
- **Sprint With Us:** I signed in as an administrator and opened the seeded open opportunity with a submitted proposal. Its History tab is the same heading and a two-row table.

Neither tab has a text box, a file control, or any button or link for adding or saving a note. The only way the target offers to add a note is by request, not on a screen.

**How the adapter reads it.** Both pages share one builder in `tests/adapters/old/index.ts`, so I added a single `noteControlOffered` reader that both use. It opens the History tab, waits for the heading, and returns "true" if the main area holds any of these, otherwise "false":
- a text box
- a field whose label mentions a note, attaching, or a file
- a button named for a note, attaching, uploading, a file or saving
- a link named for adding a note, attaching, uploading or saving a note

If the History tab isn't offered to the signed-in reader, it throws `unbound:` instead of returning "false". That reader never reached the place the contract describes, and the contract says to read this as an administrator or the author.

**Verification.** I ran the same checks in the browser against both seeded opportunities, and every one found nothing, which gives "false" on both pages. I couldn't type-check the edited file: the compiler command needed approval and none was available in this session, so that check is still to be done. I didn't test the "true" case, because neither History tab on this target offers a note control.

Every route I opened resolved on the target. I wrote nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-old-62 adapter bind every surface action and observation on old, and nothing else? Approve. The change binds exactly the two observations the generated surface declares (opportunity-cwu-edit.note_control_offered and opportunity-swu-edit.note_control_offered, the observation not-testable.yaml names as missing for R-1.33) through one shared reader that only navigates and locates: it opens the History tab via openTab, waits for the heading, and counts visible textbox/labelled-field/button/link locators scoped to main, returning 'true' or 'false' for the test to judge, with no assertion or business logic. A reader not offered the History tab is reported unbound rather than read as 'false', which matches the contract's instruction to read the tab as an administrator or the author. bindings.yaml marks just the two new keys bound; nothing under tests/acceptance changed and no existing binding was altered. The runner's typecheck reports no diagnostics under adapters/old/ (the failures are in adapters/new/, outside this proposal). The 'true' branch was not exercised because the old target offers no note control, which is the expected observation there. The existing missing-test R-1.33 clause stays owed by derive-tests, which can now write the test against this observation; it is not this stage's work. What would change the ruling: a typecheck diagnostic under adapters/old/, evidence that the locators match an unrelated History-tab element such as a filter box and so read 'true' falsely, or a change reaching outside tests/adapters/old/.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `4f8ac907079d36176100ad2de19657d9a0166995`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
