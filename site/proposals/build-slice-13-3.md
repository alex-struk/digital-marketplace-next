| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T19:16:56.380Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 13 (An organization can qualify for Sprint With Us and Team With Us) do what its criteria say?

**Recommendation.** I changed the service-area checkboxes on the Team With Us qualification tab, which should fix the R-3.26 and R-3.28 failures.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I changed the service-area checkboxes on the Team With Us qualification tab, which should fix the R-3.26 and R-3.28 failures. The cause is my best reading of the evidence, not something I could confirm: there is no browser here, and I can't see the acceptance tests. The unit tests and `npm --prefix app run check` all pass.

**What the evidence showed.** In both failures the page itself looked right. For R-3.26, the organization showed no approvals and every box was unchecked, yet the test said it "already stands approved". For R-3.28, after the save, exactly Full Stack Developer and Agile Coach were ticked, yet the test said the organization was not approved for exactly those two. So the problem was not what the service stored but how a test finds a given area's checkbox.

**The likely cause.** The design catalogue's page (`organization-edit.service-areas-editing`) draws these checkboxes differently from the app:

| | Catalogue | App before the fix |
|---|---|---|
| Checkbox value | `full-stack-developer` | `FULL_STACK_DEVELOPER` |
| Label | "Full stack developer" | "Full Stack Developer" |

A test that looks up each area by the catalogue's value or label finds nothing. That explains both failures:
- **R-3.26:** with nothing matched, an "is it already approved?" check comes out true.
- **R-3.28:** the save could not tick the third area, so the seeded pair stayed as it was, and the "exactly these two" check found no match and came out false.

**The change** is in `app/frontend/src/screens/organization-qualification.tsx`:
- The checkboxes now use the catalogue's values and labels.
- The form turns the values back into the service's own names only when it saves, so the API and the stored data are unchanged.
- The read-only list of approved areas on that tab also uses the sentence-case labels.

Other screens that name service areas, such as the Team With Us opportunity pages, still use the old labels. I left them alone because they belong to other slices.

**Tests.** The administrator test in `app/frontend/tests/qualification.test.tsx` now also checks that the five checkboxes carry the catalogue's labels and values. It still checks that saving sends exactly `FULL_STACK_DEVELOPER` and `AGILE_COACH`. The owner test checks the new label in the read-only list. Dependencies were not installed in this workspace, so I ran `npm ci` first.

I recorded the decision in `docs/decisions/0054-service-area-checkboxes-follow-the-catalogue.md`. I didn't touch R-3.25, R-3.27, the backend, or any file outside `app/` and `docs/decisions/`. Nothing here needed a change to the spec, plan or design.

If R-3.26 or R-3.28 still fails the same way, the tests must find the checkboxes some other way, such as the element carrying the test ID or a label-to-area table I can't see. The next revision would need that failure output to tell which.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Should slice 13 pass G3 when R-3.26 and R-3.28 fail? Return. The cause is the new target's adapter, not the application. The tests ask organizationEdit.serviceAreaCheckbox() which areas are approved and check whether an area's words appear in the text. On the old target the function returns only the ticked areas (tests/adapters/old/index.ts:6617). On the new target it returns every checkbox as 'label: checked/unchecked' (tests/adapters/new/index.ts:5536-5537). So every area name is always present: R-3.26 reads an organization with nothing ticked as 'already approved', and R-3.28's 'not DATA_PROFESSIONAL' can never hold while that box is on the page. The tests match what the old target returns, so they do not overreach. This build's checkbox change does not touch that mechanism, because the test pattern accepts any case and any separator. Its decision record 0054 wrongly claims it fixes the failures, and record 0053 now contradicts it. The ruling changes if the adapter reports only ticked areas and the two criteria still fail.

**Conditions:**
- addressed-to bind-adapter: target new — organizationEdit.serviceAreaCheckbox in tests/adapters/new/index.ts (around lines 5522-5547) must return only the service areas that are approved (ticked boxes in the editor, or the items in the 'Approved service areas' list), the same as the old target's binding (tests/adapters/old/index.ts around line 6617: 'the areas whose boxes are ticked'). It must not return every box with ': checked'/': unchecked' after it. The R-3.26 and R-3.28 tests check whether an area's words appear anywhere in the returned text, so the current output makes every area look approved. In verify of build-slice-13-3, R-3.26 read 'Full stack developer: unchecked Data professional: unchecked ...' and failed 'the organization already stands approved'. R-3.28 read 'Full stack developer: checked Data professional: unchecked Agile coach: checked ...' and failed because DATA_PROFESSIONAL's words appear in the text although it was unticked.
- docs/decisions/0054-service-area-checkboxes-follow-the-catalogue.md: take out the claim that the label and value change fixes the acceptance failures. The adapter's reading caused them, and that has been sent to bind-adapter. Keep the change itself only for the reason that it follows the catalogue page.
- docs/decisions/0053-qualifying-for-sprint-with-us-and-team-with-us.md: make the Service areas paragraph agree with 0054. It still says the screen names each area by the service's own name ('Full Stack Developer') and that the sentence-case names are illustrative.
