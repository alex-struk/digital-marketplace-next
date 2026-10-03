| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T00:17:56.392Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I added the one observation the contract was missing, `page_messages` on the Sprint With Us opportunity page (`opportunity-swu-view`).

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the one observation the contract was missing, `page_messages` on the Sprint With Us opportunity page (`opportunity-swu-view`). It is bound in `tests/adapters/new/index.ts` and listed as `bound` in `tests/adapters/new/bindings.yaml`. I left every other binding as it was. I couldn't type-check the file because the session wasn't allowed to run `tsc`, so the change hasn't been compiled.

**What I found on the target.** Every Sprint With Us page I opened loaded, so no route failed to resolve. I opened three seeded opportunities while signed out, after their brief "Loading opportunity…" spinner had cleared:
- **The closed one** (`…000000000701`): this is the pairing the contract describes, though the contract has the vendor persona signed in and I was signed out.
- **The awarded one** (`…a020…`).
- **An open one that is taking proposals** (`…a025…`).

None of the three showed an alert, status message or pop-up anywhere on the page. The contract expects the running app to post a notice when an opportunity is awarded or open to a signed-out visitor, but this build posts none in either case. The page lists its status ("Awarded", "Published") and then its sections: Description, Phases, Skills, Key dates, Scope and Addenda. The page loads and has nothing to report, so the correct answer is empty, not `unbound`.

**How it's bound.** A new helper, `pageNotices`, sits next to the other opportunity-page readers:
1. It refuses with `unbound:` if the page shows "Page not found" or sends the browser to sign-in, the same check the other observations on this page use.
2. It waits for the loading spinner to go away.
3. It collects the text of every visible alert, status message and dialog on the page, finding them by their accessibility role.
4. It drops two kinds: anything inside one of the page's own sections (the Scope, Addenda and other regions under their headings, which the contract counts separately) and the loading message itself.
5. It returns one notice per line, in page order, with nested notices counted once.

On the default seed it returns empty for all three opportunities above. On an instance where the scope service page is missing, any notice the page raises outside its sections will be returned.

**Not checked.**
- I did not sign in as the vendor persona to look at the closed opportunity. The contract says nothing should show for that persona on that opportunity, and the existing notes say a signed-in vendor still sees the public page.
- I did not open an instance started with the scope service page missing, so I haven't seen what this build shows in that case.

I edited nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new adapter bind every surface action and observation and nothing else? Ruling: approve. The diff adds one observation, opportunity-swu-view.page_messages, in tests/adapters/new/index.ts and bindings.yaml and touches nothing under tests/acceptance. The new pageNotices helper only navigates and locates: it reuses the not-found/sign-in unbound refusal, waits out the loading progressbar, reads visible alert/status/alertdialog/dialog text by role, leaves out notices inside the page's sections and the loading status, and returns one notice per line in page order. It asserts nothing and decides no outcome. That matches the contract text at spec/contract/surface.yaml:265-276. Reading empty on the seeded closed, awarded and open Sprint With Us opportunities follows from the page loading and showing nothing, so empty is correct rather than unbound. That the new build does not post the awarded and open-signed-out notices the contract describes is a product fact for calibrate, not an adapter defect. The runner's typecheck on this revision passed with no diagnostics under adapters/new. What would change this: evidence that the new build renders a notice without an ARIA role, which this role-based binding would miss and read as empty. That would surface at calibration as adapter-wrong. The open R-7.29 missing-test stays owed by derive-tests, which can now be served by this observation.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `66a46c188b995aa3d9d9d00e7895cf492395ef9f`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
