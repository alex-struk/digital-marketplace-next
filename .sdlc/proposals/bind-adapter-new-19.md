---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I bound all seven members of `notification-terms-broadcast` against the running target."
opened: 2026-10-01T05:03:49.561Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I bound all seven members of `notification-terms-broadcast` against the running target.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I bound all seven members of `notification-terms-broadcast` against the running target. That takes the five listed criteria (R-7.13, R-6.18, R-6.23, R-6.24, R-4.16) off unbound. I couldn't run the type checker, and the new code has not been run as a test.

**What the target shows now.** Signed in through the identity provider as the administrator (`test-admin`), I opened `/content/terms-and-conditions/edit`. Below "Current wording" there is now a region headed "Notify vendors of updated terms" with a button of the same name. The earlier pass recorded no such control. This time it was on the page itself, not behind "Edit page".
- **The button** opens an unnamed confirmation dialog, "Notify vendors that the terms have changed?", with "Cancel" and "Notify vendors".
- **Cancel** closed the dialog.
- **Confirming** showed a status in the region: "Vendors have been notified". This was on the sandbox target, so it withdrew the seeded vendors' acceptance of the terms and sent the emails.
- **Failure:** the service never refused on its own, so to see the failure state I had the browser answer the announcement request with a 400 once. The region then showed an alert, "Vendors have not been notified — The service could not complete the announcement. Try again." The failure reader was checked only against that faked answer.
- **Non-administrator:** signed in as the public sector employee (`test-gov`), the same address shows "Page not found" and no notify control.

**How the members are bound** (in `tests/adapters/new/index.ts`), all by role and accessible name:
- **`open`** goes to the route.
- **`notify_vendors_of_updated_terms`** presses the button inside the named region. It throws `unbound:` if the management screen was refused or the control is missing, and fails at once, without waiting, if the button is disabled.
- **`confirm_notify_vendors` and `cancel_notify_vendors`** press "Notify vendors" and "Cancel" in the open dialog.
- **`notify_vendors_control`** returns the button's label, or empty when the page loaded without it. That includes the "Page not found" a non-administrator sees, because some of these criteria are about the control not being offered to other people.
- **`notify_vendors_confirmation`** returns the dialog's text, or empty when no dialog is open.
- **`notify_vendors_success` and `notify_vendors_failure`** read the region's status ("have been notified") and its alert. Each returns empty when there is none.

I removed the old shared "not announced" reason and the generic unbound stub. In `tests/adapters/new/bindings.yaml`, all seven members (three actions, four observations) are now marked `bound`, spelled as the contract spells them. No other page's bindings changed, and every route I opened this run resolved.

**Not checked.** Running the TypeScript type checker needed approval this unattended session couldn't get. I checked by hand that every helper and type the new code uses exists in the file and is in scope. I wrote nothing outside `tests/adapters/new/`, and no password or environment value appears in the adapter or the bindings file.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the adapter binds every action and observation on notification-terms-broadcast and nothing else. Approve. All seven members (three actions, four observations) are bound by role and accessible name. Actions find a control and press it. Observations return the control's label, the dialog text, or the region's status or alert, or empty when none is there. There is no assertion or business logic, and the only throws are an `unbound:` when the screen was refused or the control is missing, and a fast failure when the control is disabled. Nothing under tests/acceptance changed. The runner's typecheck on this revision passed with no diagnostics in adapters/new/. Every member the acceptance specs call (R-7.13, R-6.18, R-6.23, R-6.24, R-4.16 and the other specs that drive the page) has a binding. The empty readings for an absent control or dialog let the 'not offered to anyone else' clauses be observed. The failure state was seen only by faking a 400 answer while exploring. That stub is not in the adapter, so the failure reader is a plain locator on the region's alert. The ruling would change if verify showed a binding reading something other than what its member names, for example the success reader picking up text outside the announcement region, or if a test called a member this adapter leaves out.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `ea992e1d3adb03612904c03a470ec60f6d4bb82d`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
