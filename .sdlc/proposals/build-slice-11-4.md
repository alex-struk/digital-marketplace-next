---
gate: G3
question: "Does slice 11 (A vendor can register and look after an organization) do what its criteria say?"
recommendation: "I fixed the two failures the ruling said were the app's to fix: R-3.18 (Archive missing from the tab) and R-3.22 (the vendor could never submit)."
opened: 2026-10-03T15:28:07.281Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 11 (A vendor can register and look after an organization) do what its criteria say?

**Recommendation.** I fixed the two failures the ruling said were the app's to fix: R-3.18 (Archive missing from the tab) and R-3.22 (the vendor could never submit).

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the two failures the ruling said were the app's to fix: R-3.18 (Archive missing from the tab) and R-3.22 (the vendor could never submit). `npm --prefix app run check` passes: typechecks plus 533 backend, 343 frontend and 16 other unit tests. Nothing ran in a browser, so the acceptance suite has not confirmed either fix yet.

**R-3.18, Archive in the Organization tab.** In `app/frontend/src/screens/organization-edit.tsx`, the "Archive this organization" section used to sit beside the tab's section. It is now inside it, below the profile, and its heading is level 3. The owner and service administrators now find both Edit organization and Archive organization when the tab is read. An organization administrator who is not the owner still gets neither, only the line saying the owner alone can change the details. Nothing changed in the confirmation dialog or the archiving itself.

**R-3.22, submitting an invalid form.** In `app/frontend/src/screens/organization-form.tsx`, "Create organization" and "Save changes" are now disabled only while a save is in progress. Submitting with a problem flags every field, so each offending field is reported both beside the field and in the "Fix N fields…" list. Focus moves to that list and nothing is sent to the service. Problems still appear as each field is left, as before.

**Unit tests.** I changed the tests in `app/frontend/tests/organizations.test.tsx` that had expected the button to be disabled:
- An empty registration form can be submitted. It then reports the legal name and contact email, moves focus to the list of problems, and sends nothing.
- A registration with no legal name and a malformed email reports both on submit and creates nothing.
- Saving the edit form with an invalid field moves focus to the list of problems and saves nothing.
- The owner's tab section contains both Edit and Archive.
- The organization administrator's tab section contains no Archive.

**Departure from the design catalogue.** The catalogue stories draw the submit button disabled and the archive section outside the tab. I followed the ruling instead, because R-3.22 is worded as a submission and R-3.18 places Archive on the tab. Decision record `docs/decisions/0049-the-organization-form-submits-while-invalid-and-archive-is-in-the-tab.md` explains why. Every test id is unchanged.

**Left for other stages.** The ruling sent four items elsewhere, and I did not touch them:
- **Plan:** R-3.6, R-3.15 and R-3.23 need the Team members tab, which still says "This section is not available yet". That tab is slice 12's.
- **Bind-adapter:** the image picker still needs binding to the organization logo, for R-8.13, R-8.21 and R-8.28.
- **Test derivation, R-3.18 tests 2 and 3:** they have an organization administrator press Edit and Archive, which the criterion says are not offered to that person.
- **Test derivation, R-3.2 staff test:** it fills in a registration form the app correctly withholds from staff.

Until those are answered, the criteria that depend on them will keep failing for reasons outside this slice. Slice 12 still has to build the Team members tab.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Should slice 11 be approved now that the two app fixes from build-slice-11-3 are in? Return. Verify escalated because three failed builds could not show what was at fault, and the result shows the fault is the test adapter, not the app. Both remaining failures are the same error, thrown before any request reached the service: R-3.2 'a registration sent by a vendor who has accepted the terms is accepted' and R-3.18 'a profile change sent by an organization administrator who is not the owner is refused'. In each, the new target's adapter (tests/adapters/new/index.ts, the accepted spellings for each organization field, around line 8251) rejects the input key 'addressLineTwo', because its list for streetAddress2 holds streetAddress2, street_address_2, street2 and addressLine2 but not addressLineTwo. The derived tests use addressLineTwo throughout the organizations suite, and the old target's adapter already maps it to the second street-address box, so the gap is in this one binding. Build cannot fix it, because build delivers only app/ and docs/decisions. Both of the app's owed fixes are shown working: R-3.22 passes all its invalid-submission tests, and R-3.18's UI tests pass, so a service administrator is offered Edit and Archive on the Organization tab and an organization administrator who is not the owner sees neither. The tests owed for R-3.2 and R-3.18 exist now but stopped at the adapter, so those missing-test items stay open. Would change: once the adapter accepts addressLineTwo and verify runs again, approve if the request tests pass; a failure against the service after that is the app's.

**Conditions:**
- addressed-to bind-adapter: in the new target's organization-request bindings (tests/adapters/new/index.ts, the accepted spellings for each organization profile field), accept the input key 'addressLineTwo' as streetAddress2, the second address line. The derived tests send it in every organization registration and profile-change input, and the old target's binding already maps it to the second street-address box. Shown by verify on build-slice-11-4: register_by_request (R-3.2) and change_profile_by_request (R-3.18) both threw 'the input key "addressLineTwo" names no field of an organization's profile' before sending anything, so neither test reached the service.
- condition-met build-slice-11-3#1: in app/frontend/src/screens/organization-edit.tsx the Archive section is now inside the Organization tab's section, below the profile; on verify for build-slice-11-4 the R-3.18 tests 'the Edit and Archive controls are offered to a service administrator' and 'an organization administrator who is not the owner sees the profile read-only, with no Edit and no Archive control' both pass.
- condition-met build-slice-11-3#2: in app/frontend/src/screens/organization-form.tsx the submit button is disabled only while a save is in progress; an invalid submission reports each field and sends nothing, and on verify for build-slice-11-4 R-3.22 passes both cases, the blank legal name and the contact email 'not-an-email'.
