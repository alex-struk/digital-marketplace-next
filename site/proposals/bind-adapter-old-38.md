| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T05:18:04.929Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed both R-2.22 findings in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed both R-2.22 findings in `tests/adapters/old/index.ts`. `bindings.yaml` needed no change, because all four members involved were already `bound`. I could not run the type check or a calibration test: there is no TypeScript compiler or `node_modules` in this workspace, and running the node syntax check needed an approval that nobody was here to give. I did check the new logic by hand in the browser on the running target, as described below.

**Sprint With Us, `proposal-swu-edit.add_phase_team_member`.** I opened a new proposal on the seeded open Sprint With Us opportunity as the organization owner. I added two members to the Implementation phase, then opened "Add Team Member(s)" again. The dialog then listed only the people not yet on the phase, and the two added people each sat in their own row of the phase's team table, with a "Remove" beside them. The action now checks that table first, within the phase's own section when there are several phases. Anyone already in a row counts as added and is not looked for in the dialog. If everyone named is already there, the dialog is not opened at all. It still reports a refusal when a person is in neither the dialog nor the table, and the message now says both places were checked.

**Team With Us, `proposal-twu-edit.save_changes`.** The seed has no open Team With Us opportunity, and the organization owner's second organization (Salt Marsh Labs) was not qualified for Team With Us. To reach the state the finding describes, I changed the target through its own API:
- As the administrator, I created and published an opportunity titled "Probe TWU for adapter", with a deadline 20 days out.
- As the administrator, I qualified Salt Marsh Labs for Full Stack Developer.
- As its owner, I accepted the Team With Us and Sprint With Us terms for Salt Marsh Labs.

I then submitted a proposal under Northern Pines with a named member and an hourly rate. When I changed the organization to Salt Marsh Labs, the form emptied both "Resource Name*" and "Hourly Rate*" and disabled "Submit Changes". The form shows no message against either empty field. With the same member and rate put back, "Submit Changes" re-enabled. Submitting then raised "Unable to Submit Proposal Changes", with "Organization cannot be changed on…" under the Organization field. That is the service refusal the criterion is about.

The adapter now does four things here:
- **Before an organization change:** it remembers each resource's member and rate.
- **In `save_changes`:** it puts back any member or rate that is now empty, provided the member's name is offered by the new organization's list.
- **When "Save Changes" or "Submit Changes" is disabled:** it walks every step of the form and throws an error naming each empty required field by step, plus any message a step shows. It no longer says "the page shows no message".
- **`add_team_member_for_resource`:** a resource whose chooser already shows the named person counts as done.

**A change I added on my own.** After a refused "Submit Changes", the old code waited up to 30 seconds for the control to disappear, which never happens on a refusal. The wait now also ends as soon as the refusal notice appears.

The probe opportunity, the probe proposal and the Salt Marsh Labs qualification are still on the target. The seed notes say it is reapplied before every test, so they should not carry into a calibration run.

No page route failed to resolve during this work, and I touched nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old-site adapter, after four rounds on R-2.22, now bind the two actions the fourth send named, and nothing else? Approved. The escalation came from the rebind loop limit, not from a defect, and the diff answers the fourth send clause by clause, which is the part of runner:bind-adapter's account that decided this. proposal-swu-edit.add_phase_team_member now counts a person already in the phase's team table as added and refuses only when the person is in neither the dialog nor the table. proposal-twu-edit.save_changes remembers each resource's member and rate before an organization change and puts them back only when the new organization's list offers that member, so the service still decides the change R-2.22 is about. A disabled Save Changes or Submit Changes now walks every step and names each empty required field. The change the author added on its own keeps the old meaning: saved() (index.ts:1514) only waited up to 30 seconds for the control to disappear, and the new loop does the same wait but stops early when a REFUSED_SUBMISSION notice appears. The runner's typecheck of revision 3b574404 found no diagnostics under adapters/old/; its failures are only in adapters/new/. The diff stays inside tests/adapters/old/, the tier is STANDARD, and no platform article or gate is touched. Not yet proven: nobody has run the adapter, and calibration is where it is exercised. onSwuPhase is broad with a single phase (any table row with the name counts), but R-2.22 does not depend on that. This would change if calibration shows the restore step choosing a member the test did not name, or hiding the service's refusal; the proposal would then return to bind-adapter with that run as evidence.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `3b574404e0394aff86670788571e4e1d0292db0b`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
