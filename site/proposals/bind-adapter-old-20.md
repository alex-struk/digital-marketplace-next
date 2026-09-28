| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T03:34:07.259Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I made both changes the ruling asked for in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I made both changes the ruling asked for in `tests/adapters/old/index.ts`. I could not run the typecheck: both attempts needed an approval I don't have. Both edits are small and self-contained, but that check has not been done.

**R-4.4: sign-in for the deactivated vendor.** `signIn` no longer sends this persona through the session route. It now throws right away with `unbound: signIn.deactivated-vendor — …`. The reason given is that vendor sign-in on this target goes to github.com, where no sandbox account exists. It also says that `/auth/createsessionvendor/:id` creates a session without the account-status check the real sign-in applies, so it cannot show the refusal. The error names the persona by its contract id, `deactivated-vendor`, as the error format requires. The ruling wrote it as `deactivatedVendor`; the `unbound:` prefix, which is what calibration reads, is the same either way. Every other persona still signs in through the session route, signing out first, as before.

**R-5.1 and R-1.55: the panel's error readers.** `panelRefusal` no longer falls back to the general "Unable to Publish Changes … Please fix the errors in the form" alert. `duplicateMemberError`, `minimumMembersError` and `missingChairError` now each return only an alert or field error whose own wording names their fault, and an empty string when the page names none. Field errors were already limited to wording that reads as a validation message, so a plain "Panel Chair" label beside a slot cannot be read as the missing-chair message. The same readers on the request-level panel surface read the service's own refusal status and body, not the general alert, so I left them alone.

**The calibration findings.** I checked the rest of the list against the adapter as it now stands. The ones I looked at had already been fixed in the previous revision, which the ruling accepted as narrowed navigation, locators and readers:
- adding a vendor to a panel now throws instead of returning quietly;
- no implementation phase is added unless the input names one;
- `fullReport` and `notFoundForUnknownAddress` check for the Not Found screen;
- the history tabs read only the table rows;
- the user list is read across every page;
- a disabled Publish or Submit control makes the action throw.

I did not re-check every other item line by line. Following the instruction not to redo accepted work, I left those areas unchanged and did not walk the target again.

`bindings.yaml` did not need changing. Sign-in is not a page member, and the three panel readers are still bound, now reporting only their own fault. No page route was found to be unresolvable in this revision, and I wrote nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does bind-adapter-old-20 bind every surface action and observation on old, and nothing else, and does it carry out the two instructions bind-adapter-old-19 left owed? Ruling: approve. Reason: both owed instructions are done in tests/adapters/old/index.ts. First, signIn no longer sends the deactivated-vendor persona through /auth/createsessionvendor/:id. It throws `unbound: signIn.deactivated-vendor — …` and gives both real reasons the refusal cannot be shown on this target: vendor sign-in goes to github.com, where no sandbox account exists, and the session route skips the account-status check. The id matches spec/contract/personas.yaml, and the calibration-read `unbound:` prefix is the same as the one the ruling asked for. Second, panelRefusal now returns only alerts and field errors whose own words match the fault asked about. None of the patterns for duplicateMemberError, minimumMembersError or missingChairError matches the general 'Unable to Publish Changes … Please fix the errors in the form and try again' alert, so a refusal that gives no reason reads as empty rather than as the message R-5.1 and R-1.55 require. The other changes are navigation, locators and narrowed readers. Some throw to report a refusal: a disabled Publish or Submit, a vendor the panel chooser does not offer, an owner the Change Owner dialog does not offer. None of them decides whether a test passes. Nothing under tests/acceptance changed and bindings.yaml did not need to. The runner's typecheck reports no diagnostics under adapters/old/; its only failures are two in adapters/new/, which this proposal does not answer for. What would change the ruling: a typecheck diagnostic in adapters/old, or a calibration showing a panel reader still returning the general alert.

**Conditions:**
- condition-met bind-adapter-old-19#1: signIn in tests/adapters/old/index.ts throws 'unbound: signIn.deactivated-vendor — …' for the deactivated-vendor persona instead of driving the session route, naming github.com vendor sign-in with no sandbox account and the session route's missing account-status check
- condition-met bind-adapter-old-19#2: panelRefusal in tests/adapters/old/index.ts returns only alerts and field errors matching the asked fault's own pattern, with no fallback to the general 'Unable to Publish Changes' alert; duplicateMemberError, minimumMembersError and missingChairError each use it and read empty when the page names no such fault

### Runner-owned typecheck evidence

Proposal revision: `d46ee50cd3098dc28feef1cc562f2db4585882b6`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
