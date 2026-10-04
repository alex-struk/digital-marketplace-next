| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T07:00:00.236Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I bound `proposal-twu-edit: set_hourly_rate`, the one action the contract declared that the old target's adapter did not yet name.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I bound `proposal-twu-edit: set_hourly_rate`, the one action the contract declared that the old target's adapter did not yet name. I couldn't run the type-checker: running `tsc` needed approval, and nobody was there to give it. The new code has the same shape as the create page's binding of this action, but it has not been compiled or run in a test.

**How I reached the field.** The seed has no Team With Us opportunity that is still open. Its only Team With Us proposals belong to closed opportunities that are already being evaluated. For their own vendor, the edit route for those proposals (for example the first seeded one) answers the application's "Not Found" page. To see the edit form in the state the contract describes, I did three things:
- As the administrator, I published an opportunity through the service by copying the seeded closed Team With Us opportunity with future dates.
- As the first seeded vendor, I created a draft proposal on it, with one team member at an hourly rate of 120.
- On that draft's edit route I opened the Proposal tab, chose Edit from the Actions menu, and went to step "2. Team Members".

That step shows an "Hourly Rate*" number box for the resource, already holding 120. The top bar then offers "Submit Proposal", "Save Changes" and "Cancel". The contract says the edit screen uses the create screen's form, and that is what the running page shows.

**What the binding does.** In `index.ts`, `proposalTwuEdit.setHourlyRate` first starts editing, then calls the same code the create page's `set_hourly_rate` already uses. It goes to "Team Members" and makes sure an organization is chosen. It picks the resource by number, order or service area, then fills the "Hourly Rate" number box from the input's `hourlyRate` / `hourly_rate` / `rate` / `value` / `amount`, or from the input itself if that is a bare value. So it accepts exactly the input spellings the create binding accepts. It sends nothing to the service on its own; the test's later Save Changes or Save Changes and Submit does that. In `bindings.yaml`, `set_hourly_rate` is listed as `bound` under `proposal-twu-edit`. Every other binding is unchanged.

**Records left on the target.** The opportunity "Binding check TWU opportunity" and the first vendor's draft proposal on it are still there. They show up in the opportunity list, so an exact count of open Team With Us opportunities would include them.

**Notes for the reviewer:**
- The draft I created used organization …0301 ("Northern Pines Digital Ltd."). The running page warns that this organization "has been archived", while the vendor's current memberships list only "Cedar Hollow Systems Inc.". That does not affect the hourly-rate field, but it may matter to criteria about which organizations can be chosen.
- Every route in `surface.yaml` that I touched resolved, apart from the Not Found answer described above, which is the application gating editing during evaluation and not a missing page.
- Nothing outside `tests/adapters/old/` was changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does this adapter bind every surface action and observation on old, and nothing else? Ruling: approve. The contract declares `set_hourly_rate` under `proposal-twu-edit` (`spec/contract/surface.yaml:780`), and this proposal adds the binding the adapter was missing. `proposalTwuEdit.setHourlyRate` uses the existing `editingControl` wrapper to start editing, then runs the same `setTwuHourlyRate` the create page uses (`tests/adapters/old/index.ts:5458`). That function goes to the Team Members step, waits for the "Hourly Rate" box and fills it for the chosen resource, so it only navigates and finds fields: it checks nothing and decides no outcome. `bindings.yaml` gains only `set_hourly_rate: bound`, and nothing under `tests/acceptance` changed. The runner's own typecheck on this commit shows no errors under `adapters/old/`; the failing exit code comes from the one error under `adapters/new/`, which this proposal is not responsible for. The author couldn't run `tsc` themselves and said so, and the runner's check covers that. The two items the earlier rulings left open are not settled by this proposal and stay open. build-slice-15-2#1 asks build to add a Company box to the new app's Sprint With Us references. The missing-test on R-2.10 (the check must run on the edit path too) waits for a derive-tests test that uses this binding. The records the binding check left on the old target ("Binding check TWU opportunity" and a vendor draft proposal on it) would change any exact count of open Team With Us opportunities. That matters to whoever reads calibration results; it doesn't make the binding wrong. The ruling would change if a calibration showed this binding failing to reach the edit form's Hourly Rate box, or if the contract dropped the action.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `3901f10f8295cf542f0e6ac8d4d2498e87a9c350`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
