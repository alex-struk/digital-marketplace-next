---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I made both changes the ruling asked for in `tests/adapters/old/index.ts`."
opened: 2026-09-28T03:34:07.259Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

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
