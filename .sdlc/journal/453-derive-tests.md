---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-03T15:10:38.919Z"
cost: 0.7496146
turns: 24
session: "b403ba1c-f124-4128-8ffb-4aa611ea889c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I wrote tests for both criteria that were handed back, R-3.2 and R-3.18. Each has a spec file under `tests/acceptance/organizations/`, and I removed both entries from `tests/acceptance/not-testable.yaml`, so each criterion is now a test file only. No new not-testable entries were needed. I could not type-check or run the files: running `tsc` needed an approval this session could not get. The first test run will be the first check that they compile and pass.

**R-3.2.** The contract added an `organization-request` page, and its `register_by_request` action sends a complete, valid registration as whoever is signed in. The file keeps the existing test, in which a vendor who has accepted the terms creates an organization through the create screen. It adds three tests:
- **Acceptance:** `persona.vendor` sends a registration through the request page. The test expects it to be accepted and to return an organization identifier.
- **Staff refusal:** `persona.publicSectorStaff` sends one. The test expects it to be refused with a status, a reason under "permissions", and no organization identifier.
- **Never-accepted refusal:** `persona.vendorCompletingProfile` sends one. The test expects the same refusal. The seed records that this vendor has never accepted the terms, so it is the plainest case of "anyone else" among vendors.

I did not assert a refusal for `persona.vendorWithTermsReset`, and that was a choice. The contract says the old service accepts that vendor, because they did accept the terms once and the service does not check whether that acceptance covers the current version. The criterion says "has already accepted the service's terms", not "the current terms", so on its own wording this vendor is allowed. A test expecting a refusal would contradict both the criterion and the old service. If the rule is meant to require the current terms, the criterion needs restating, and that belongs to the ratify stage.

I also left out a refusal for a visitor who is not signed in. The contract only says requests go out "as whoever is signed in", and does not say what happens with no session, so I did not guess.

**R-3.18.** The two existing tests stay as they were:
- an organization administrator who is not the owner sees the profile read-only, with no Edit and no Archive control (the owner's view is read first for contrast);
- a service administrator is offered both controls.

I added four tests on `seed.organizations.qualified`:
- **Profile change refused:** `persona.organizationAdmin` sends a profile change. The test expects a refusal with a status and a "permissions" reason. It then reads the stored legal name (still the seeded one) and the stored active flag (still active).
- **Archive refused:** the same administrator sends an archive request, with the same refusal and unchanged-state checks.
- **Profile change accepted:** the owner sends the same profile change, and the stored legal name changes.
- **Archive accepted:** a service administrator sends an archive request, and the organization becomes inactive.

The two accepted cases show that the refusals depend on who asked, not on what was asked.

**Assumptions to check on the first run:**
- The registration and profile inputs use the same field names as the existing `createOrganization` call in R-3.2's screen test.
- `register_by_request` addresses the organization collection and ignores the organization the page is opened on. The page's `open()` still requires one, so the test passes `seed.organizations.qualified.id`.
- The "yes" values from `request_accepted` and `stored_active` are read loosely: anything other than empty, "false", "no" or "0" counts as yes.

Nothing I needed was missing from the surface, so nothing is owed back to the contract stage. I changed no files outside `tests/acceptance`.