| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T18:38:24.892Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I bound both missing observations.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I bound both missing observations. Each reads `"false"` on this target, because neither History tab offers any way to add a note. One caveat: I couldn't type-check the changes. The type checker needed a permission this session doesn't have, so I checked the edits only by reading them. A type check is the first thing to run.

**What's in place.** Both `opportunity-cwu-edit.note_control_offered` and `opportunity-swu-edit.note_control_offered` are now in `tests/adapters/new/index.ts` and listed as `bound` in `bindings.yaml`. Each one opens the management screen's History section and returns `"true"` if anything there could add a note: a text box, any button, or a control labelled for attaching or uploading a file. Otherwise it returns `"false"`.

**What the target showed.** I signed in through the sandbox identity provider:
- **As the opportunity's author**, I opened the History tab (`?tab=history`) of the seeded Code With Us opportunity with a private note and of the seeded open Sprint With Us opportunity with a submitted proposal.
- **As the administrator**, I opened that same Sprint With Us History tab.

Every one showed only a table headed "Every change of state and every event, newest first", with Date, Entry, By and Note columns. The seeded private note was listed with its attachment link, but there was no text box, no file chooser and no save button. Since I reached the place the contract describes and it really offers nothing, the answer is `"false"`, not `unbound`.

**How the edge cases behave:**
- **A refused reader** (someone the screen answers with "Page not found") gets `"false"` and the refusal is logged. That person is offered no control, and this matches how the other readers in the adapter treat refusals.
- **A screen with no History section** throws `unbound`, naming the sections the screen does offer.

**Changed existing code.** An older comment in the adapter said the Sprint With Us History tab carries an "Add a private note" form. I saw no such form as either the author or the administrator, so I rewrote the comment to match. The Team With Us screen shares the same internal helper and so picks up the new reader. Its page doesn't use it, and that page's bindings are unchanged.

Every route I visited resolved. I changed nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind `note_control_offered` on `opportunity-cwu-edit` and `opportunity-swu-edit` as the contract declares it, and nothing more? Mostly yes. Both members are navigation plus locator counts, with no assertion and no business logic. Nothing under `tests/acceptance` changed, and the runner's typecheck of `tests/adapters/new` passed with no diagnostics. The proposal also reports reaching the History tab as the author and as the administrator on the seeded opportunities that `not-testable.yaml` names for R-1.33. The ruling is a return because of how the shared helper `noteControlsIn` behaves in `tests/adapters/new/index.ts`. Once `toSection` finds a History link in the section navigation, the helper looks for the region named History and counts the controls inside it. If no such region is on the page, the count is zero and the helper returns `"false"`. If the table never appears, the 5-second wait's error is caught and the same thing happens. So this observation answers 'no control offered' even when the adapter never located the section it was asked about. R-1.33's last clause is a claim that something is absent, and the test still owed for it will expect `"false"`. A binding that falls back to `"false"` on a miss would let that test pass without checking anything, for example if the region's accessible name changes or a note form is rendered on the History tab outside that region. An answer of absence has to come from having reached the section. What would change the ruling: `noteControlsIn` (or each caller) reports `unbound`, naming the URL and acting persona, when the History region is not on the page after navigation, and returns `"false"` only after confirming the region (and its history table) is present. Everything else in the proposal can stand as it is.

**Conditions:**
- tests/adapters/new/index.ts noteControlsIn / noteControlOffered (cwu and swu): when the History region named /^history$/ is not present on the page after toSection succeeds, or its history table never becomes visible, return unbound with the URL and acting persona instead of "false"; return "false" only after the region has been confirmed present, so an absence is reported only from a section actually reached.

### Runner-owned typecheck evidence

Proposal revision: `0fe9dd2284775fcc9af4c5122700dabb01f2ed33`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
