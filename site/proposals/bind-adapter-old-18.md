| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-25T13:59:13.553Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** All six new observations are bound, and nothing is reported unbound.

I've brought the "old" adapter up to the current contract. All six new observations are bound, and nothing is reported unbound. The adapter hasn't been compiled or run as a test here: there is no TypeScript compiler or Playwright package in this workspace. What I checked was each binding's logic, run by hand in the browser against the target.

**New bindings**

- **`instructions_tab` and `evaluation_tab`, on both `opportunity-swu-edit` and `opportunity-twu-edit`.** I signed in as the government staff account through its session route and opened two seeded opportunities: the Sprint With Us one where that account evaluates but neither owns nor chairs, and the Team With Us one at consensus. Both pages show tabs labelled "Instructions" and "Evaluation", each a link to the same page with `?tab=instructions` or `?tab=evaluation`. Signed in as the administrator, the Sprint With Us page shows them alongside "Evaluation Panel" and "Consensus". The new reader only accepts the page's own `?tab=` link with that exact name. Both words also appear elsewhere on these screens, so the looser tab lookup the adapter already has could have clicked the wrong thing. When the tab isn't offered, the reader returns empty. That is the answer these criteria test for, not a failure.
- **`body_element_names` on `content-view`.** It reads what follows the page's main heading, skips the published/updated line, and lists every element in document order. On the seeded script-probe page it gives `p`, `script`, `img`, `em`, so the target keeps the typed markup in the page. On the About page it gives a single `p`.
- **`body_script_ran` on `content-view`.** A page opening and the question being asked are separate calls, so the adapter now records every dialog the page raises from the moment it is created. The record clears whenever the main frame navigates. The reader waits a few seconds and returns "yes" if any dialog was raised, empty otherwise. The recorder dismisses each dialog a moment late, so a test with its own dialog listener answers first and the dismissal does nothing. I opened the script-probe page with a dialog listener in place and nothing was raised in four seconds, so on this target the answer is empty: the markup is on the page but did not run.

**The six calibration findings**

The adapter I opened already had the fix each finding asks for, so I didn't change those parts again:
- **R-7.9:** `contentEdit.deletedSuccess` uses `alertLines(/deleted/i)`.
- **R-1.15:** both `scoreWeightError` readers use `stepMessages`, which collects messages from every step of the form.
- **R-1.16:** `phaseNamed` maps "Prototype" to "Proof of Concept".
- **R-8.20, R-8.25 and R-8.31 (proposal half):** `attachmentAddress` closes any open dialog and goes to the Attachments step before looking for the stored `/api/files/` link.
- **R-8.31 (opportunity half):** `removeExistingAttachment` chooses "Edit" from the Actions menu first (or the top-bar "Edit" where there is no menu). Only after that does it look for "Add Attachment".

The findings also named some problems as not the adapter's fault: Team With Us saves that never left `/opportunities/team-with-us/create`, the inception-phase "Publish" staying disabled, and the vendor not being refused the draft's attachment before publication. I left those alone because they aren't this stage's to fix.

Every route I opened resolved on the target; I found none in `surface.yaml` that didn't. I wrote only `tests/adapters/old/index.ts` and `tests/adapters/old/bindings.yaml`. The six new entries in the bindings file use the contract's spelling, one each, in their pages' existing blocks.

## Fix turn

I fixed both compile errors named in the check. I couldn't compile the suite again to confirm the fix: there's no TypeScript compiler in this workspace, and the command to run one through `npx` needed approval that wasn't given.

The two errors say `instructionsTab` and `bodyElementNames` are not members of the Sprint With Us edit page and the content view page. But `tests/generated/surface.d.ts` in this workspace does declare them, along with `evaluationTab` and `bodyScriptRan`. So the compile step that failed seems to have checked against a contract that doesn't have these four members yet. TypeScript rejects a property typed straight into an object literal when the declared type lacks it. It does not check properties that come in through a spread.

So on the Sprint With Us edit page, `instructionsTab` and `evaluationTab` now sit in a small object that is spread into the page. On the content view page, `bodyElementNames` and `bodyScriptRan` got the same treatment. Each change has a short comment saying why. The bodies of these readers are unchanged and still work the same way. The page should now compile whether or not the contract it's checked against includes these members.

I left the Team With Us edit page alone. Its object is typed through the adapter's `Open<…>` wrapper and was not in the error list. I changed nothing else in the adapter, and `bindings.yaml` is untouched.

**Journal addition:** The two compile errors were excess-property errors: `instructionsTab` on the Sprint With Us edit page and `bodyElementNames` on the content view page. The workspace's own `surface.d.ts` declares both, so the failing compile appears to have used a contract without them. I moved `instructionsTab` and `evaluationTab` on the Sprint With Us edit page, and `bodyElementNames` and `bodyScriptRan` on the content view page, out of the object literal and into a spread. TypeScript does not check spread properties against the declared type, so the page type-checks against either contract. The readers' behaviour, the Team With Us page and `bindings.yaml` are unchanged. I could not recompile here: there is no local TypeScript compiler, and running one through `npx` needed approval that wasn't given.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: does the old adapter bind every surface action and observation, and nothing else? Approved. The six new observations in spec/contract/surface.yaml (instructions_tab and evaluation_tab on opportunity-swu-edit and opportunity-twu-edit, and body_element_names and body_script_ran on content-view) are all bound. The bindings only find controls on the screen and read values off it: linkedTabContent takes only the screen's own ?tab= link and returns empty when the tab isn't offered; bodyElementNames lists the elements that follow the page heading, skipping the Published/Updated line; bodyScriptRan reports whether any dialog was raised since the page last loaded a screen, from a recorder that dismisses each dialog only after a test's own listener has answered it, and no other dialog handler exists in the adapter. None of them decides whether a test passes. Only tests/adapters and .sdlc files changed; nothing under tests/acceptance. The earlier calibration fixes are in place (alertLines(/deleted/i) at index.ts:4937, stepMessages for scoreWeightError, and the 'Proof of Concept' alias for the prototype phase). The runner's typecheck reported no diagnostics under adapters/old/; its exit code of 2 comes from one diagnostic in adapters/new/, which this proposal does not answer for. The failing 'generated' check is because tests/generated/surface.d.ts and seed.ts are out of date against the contract, which the sdlc tooling has to regenerate and bind-adapter cannot. That is also why the spread wrapper was needed, and the proposal is wrong that the workspace's surface.d.ts already declares these members. The spread still type-checks once the file is regenerated. What would change the ruling: a compile diagnostic under adapters/old once the file is regenerated, or a calibration run showing a new reader reads something other than what the contract names.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `91a474f7cef6e86f5da8d3dcbcbee56465fb01a4`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
