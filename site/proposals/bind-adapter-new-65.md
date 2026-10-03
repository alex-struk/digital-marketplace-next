| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T19:03:40.168Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't run the type checker: the session wouldn't let `tsc` (or a helper script) run without approval, so I checked the changed code by hand against the helpers it calls.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've answered all four conditions in this run and deferred none. I couldn't run the type checker: the session wouldn't let `tsc` (or a helper script) run without approval, so I checked the changed code by hand against the helpers it calls. The adapter hasn't been compiled or run against the target, and that is the first thing to watch for at the gate.

**What the target shows now.** I signed in through the identity provider, first as the seeded organization owner and then as the service administrator, and opened the seeded qualified organization (…301) and the unqualified one (…302). Both qualification tabs are fully drawn now. Each has a requirement list ("Sprint With Us requirements" or "Team With Us requirements") whose items read "Met …" or "Not met …", plus a "Terms and conditions" region with "Accepted on <date>" and a link to the terms page. The Team With Us tab also lists the "Approved service areas" ("Agile Coach", "Full Stack Developer"). Only the administrator gets an "Edit service areas" button under that list. It opens a group of five service-area checkboxes with "Save service areas" and "Cancel", and the page notes that saving replaces the approvals with exactly the areas ticked. I opened the editor and cancelled it.

Both terms pages open for the owner. On …301, which has accepted, the page shows the legal name over the heading, the paragraph "Northern Pines Digital Ltd. accepted these terms on January 5, 2026 at 5:00 p.m.", the "Terms and conditions" region, and only "Back to the organization". The administrator viewing …302, which has not accepted, sees "Cedar Hollow Systems Inc. has not accepted these terms. Only the organization's own people can accept them." I did not press "Accept terms and conditions", so the seed is unchanged. That button, "Cancel", and accepting returning to the qualification tab are bound from the reviewer's evidence rather than seen directly.

**Changes, by condition:**

1. **R-3.25:** the three Sprint With Us requirement readers now return the whole list item from the list named "Sprint With Us requirements", status included ("Met …" / "Not met …").
2. **R-3.28:**
   - `serviceAreaCheckbox`:
     - If the editor is already open, it reads the checkboxes as `<area>: checked` or `<area>: unchecked`.
     - If "Edit service areas" is offered (the administrator), it opens the editor, reads every box the same way, then presses "Cancel".
     - Otherwise (the owner), it reads the "Approved service areas" list as `<area>: checked`, and returns empty if the list isn't there.
   - `saveServiceAreas` opens the editor if needed and checks that every named area has a box (an unknown name throws `unbound:`). It then ticks exactly the named areas, clears all the others, and presses "Save service areas".
3. **R-3.26:** the two Team With Us requirement readers use the same whole-item reading on the "Team With Us requirements" list. The service-area fix above should also let `establishApproval` build its starting state.
4. **R-3.27:**
   - Both terms pages are bound for real now, replacing the earlier "Page not found" stub.
   - `termsBody` returns the "Terms and conditions" region.
   - `acceptedOnNotice` returns the "… accepted these terms on <date>" paragraph, or empty while unaccepted. The "has not accepted" paragraph does not match.
   - `acceptTerms` presses "Accept terms and conditions", and `cancel` presses "Cancel".

In `bindings.yaml` I marked these members bound: the five requirement readers, `service_area_checkbox`, `save_service_areas`, and every action and observation on `organization-swu-terms` and `organization-twu-terms`. I also marked `edit_service_areas` bound, since the button it presses is the one condition 2 names. I updated the comment above `organization-edit` that still said both qualification tabs read "This section is not available yet." Nothing else changed.

One thing outside these conditions: `view_swu_terms` and `view_twu_terms` are still listed as unbound with the old "not available yet" reason, even though each qualification tab now links to its terms page. I left them as they were because no condition names them. They should be revisited in a later round.

Every page route in the surface that I opened in this run resolved on the target.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether bind-adapter-new-65 binds what the four build-slice-13 revision requests asked for on the new target, and nothing else. It does. The Sprint With Us and Team With Us requirement readers now return the whole item from the list named for each requirement set ('Met …' / 'Not met …'), so met and unmet no longer read the same (R-3.25, R-3.26). serviceAreaCheckbox reads the 'Approved service areas' list for the owner and opens then cancels the editor for the administrator. saveServiceAreas ticks exactly the named areas, clears all others and presses 'Save service areas', which matches the replace-entirely behaviour R-3.28 describes. Both terms pages replace the 'Page not found' stub with real bindings for termsBody, acceptedOnNotice, acceptTerms and cancel (R-3.27). Every addition is navigation, locators or form-driving; nothing decides pass or fail. Nothing under tests/acceptance changed. The runner's type check on this revision passed with no diagnostics under adapters/new. Three bindings.yaml entries still carry a stale unbound reason ('This section is not available yet.') that the agent's own walk contradicts: view_swu_terms, view_twu_terms and not_qualified_notice. No test calls the first two, and notQualifiedNotice already has a live implementation in index.ts, so none of them blocks these criteria from being exercised. The ruling would change if verify showed one of the new bindings reading the wrong element, or if a test came to depend on one of the stale entries.

**Conditions:**
- Note for a later bind-adapter round: organization-edit's view_swu_terms, view_twu_terms and not_qualified_notice still carry the stale 'This section is not available yet.' unbound reason in tests/adapters/new/bindings.yaml, which the agent's own walk of the qualification tabs contradicts

### Runner-owned typecheck evidence

Proposal revision: `de5501ce18172ae07af3b9d48f1885b8bac6b08b`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
