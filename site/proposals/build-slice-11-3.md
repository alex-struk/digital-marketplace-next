| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T05:25:13.041Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 11 (A vendor can register and look after an organization) do what its criteria say?

**Recommendation.** I fixed the two causes behind the four returned failures.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the two causes behind the four returned failures. `npm --prefix app run check` passes: typecheck and all unit-test suites (533 tests in the largest, 342 in the frontend, 16 in the third). Nothing ran in a browser, so whether the acceptance tests now pass is only known once they run again. The R-3.3, R-3.18 and R-3.19 fix is direct; the R-3.21 fix rests on my reading of evidence that isn't conclusive.

**R-3.3, R-3.18, R-3.19 (the Organization tab).** The saved pictures and outlines showed what was wrong. The read-only profile was drawn as read-only text boxes, following the stories. A text box's value is not part of the text around it, so the tab read as labels with no values: no legal name, no city, no phone number. In R-3.19 the saved phone number was in the box (the outline shows "250-555-0177"), but it was missing from the tab's text that the test checks. The same problem caused the owner case of R-3.3 and the owner step of R-3.18. Read-only, each field is now a label and its value as plain text, in three lists under the same headings as the story (profile, Address, Contact). Each field keeps its `data-testid` on the value, and an empty optional field reads "Not entered". Editing still opens the same form. Who sees Edit and Archive is unchanged: the owner and service administrators, not an organization administrator.

**R-3.21 (the organization list).** The test failed on a value made only of whitespace: Jest shows trailing whitespace as "·", hence the "······". It came right after two reads that returned nothing. I think the blank cells caused it: for a vendor, every row they neither own nor administer had four empty cells after the name, so reading a row or a column gave whitespace instead of nothing. Those rows are now one cell across all five columns, holding just the logo and legal name. The name is no longer wrapped in a layout box when there is no logo, so the row reads as the legal name alone. It looks the same as before. Rows the vendor owns or administers, and an administrator's view, still have all five cells. If R-3.21 fails again, this guess was wrong and the cause is elsewhere.

**Unit tests.** I updated the frontend tests in `app/frontend/tests/organizations.test.tsx`:
- **Owner:** the read-only tab has no text boxes, and its text contains the legal name, city and phone number.
- **Organization administrator:** they see those values with no Edit or Archive.
- **Phone change (R-3.19):** a saved phone change shows in the tab text, and clearing it removes the old number and shows "Not entered".
- **Cancel:** cancelling an edit shows the stored value again.
- **Vendor's list view:** somebody else's row is one cell spanning 5 columns whose text is exactly the legal name, while the vendor's own row keeps five cells.

The existing accessibility checks on the tab still pass.

**Departures from the design.** Two choices differ from the catalogue: plain text instead of the stories' read-only text boxes, and one spanning cell instead of the story's empty cells. Both are recorded in `docs/decisions/0048-read-only-profile-as-text-and-list-rows-without-blank-cells.md`. I changed nothing outside `app/` and `docs/decisions/`. Other cases of these criteria that the ruling didn't name were left as they were.

**For the next slice.** The other tabs (Team members, the two qualification tabs and Changelog) still show "This section is not available yet". They belong to slices 12 and 13. Any later screen that shows a read-only organization profile should use plain text the same way.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 11 do what its criteria say? It does not yet, though R-3.3, R-3.19 and R-3.21 now pass. runner:verify escalated after three failed builds because a failure might be the test's, the adapter's or the plan's rather than the app's. Reading each failure against its evidence settles who owns it, so none of this is a pipeline defect and escalation is not warranted. The app owns two. R-3.18: the owner's organizationTab read (the tab section) has 'Edit organization' and no 'Archive', because ArchiveSection is rendered as a sibling after the tab's section in organization-edit.tsx. R-3.22: the outline shows the legal-name field marked invalid and 'Create organization' [disabled], so the vendor can never submit, while the criterion's when-clause is a submission. Plan owns another: R-3.6, R-3.15 and R-3.23 are claimed by slice 11, but their tests drive organization-edit.add_team_members and owner_badge on the Team members tab, which this slice leaves as 'This section is not available yet' for slice 12. bind-adapter owns another: R-8.13, R-8.21 and R-8.28 drive file-image-picker on the organization edit screen, and the adapter binds that picker only to the profile picture. Two tests overreach. R-3.18 tests 2 and 3 have an organization administrator press Edit and Archive, which the criterion says are not offered to them. R-3.2's staff test fills in a registration form that the app correctly withholds from staff. What would change this ruling: a current verify result with every claimed criterion passing, after plan and bind-adapter have answered and the regenerated tests bind.

**Conditions:**
- R-3.18: on the Organization tab of app/frontend/src/screens/organization-edit.tsx, render the Archive control inside the same tab section as 'Edit organization', so that an owner's or service administrator's reading of the tab contains it. An organization administrator still sees neither. Shown by verify: the owner's organizationTab read contained 'Edit organization' but not 'Archive', because ArchiveSection sits outside the section.
- R-3.22: in app/frontend/src/screens/organization-form.tsx, stop disabling the 'Create organization' (and save) button while a field is invalid. Let the person submit, then report each offending field and create nothing. Shown by verify: both invalid-submission cases threw 'the control named create organization is disabled', and the criterion's when-clause is a submission.
- addressed-to plan: slice 11 claims R-3.6, R-3.15 and R-3.23, but their acceptance tests set up or read team members through the organization's Team members tab (organization-edit.add_team_members, organization-edit.owner_badge), which slice 11 does not build and slice 12 does. Verify found the tab showing only 'This section is not available yet.' Either move these criteria to the slice that builds the team tab, or add the team tab to slice 11.
- addressed-to bind-adapter: file-image-picker.choose_image (and its stored-image width and height reads) is bound only to the signed-in person's profile picture. The R-8.13, R-8.21 and R-8.28 tests use it on /organizations/<id>/edit after Edit organization, where the picker is the organization's logo ('Logo (optional)', trigger test id organization-logo-button, refusal organization-logo-refused-error, stored logo organization-current-logo). Verify reported all three as unbound there. Bind the picker on organization-create and organization-edit to the logo.
- test-overreaches R-3.18: tests 2 and 3 have an organization administrator press organizationEdit.editOrganization / saveChanges and archiveOrganization, but the criterion says that person is offered no Edit and no Archive control. The test demands driving controls the criterion requires to be absent, rather than showing the service's refusal some way the UI allows.
- test-overreaches R-3.2: the public-sector-staff test demands that staff open the registration form and submit it, but the criterion only requires their request to be refused. The app refuses by not offering the screen to staff (it shows 'Page not found'), and the test cannot bind because it insists the form be filled in.
