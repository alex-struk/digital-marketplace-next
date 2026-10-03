| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T15:10:38.955Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I wrote tests for both criteria that were handed back, R-3.2 and R-3.18.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-3.2 and R-3.18 tests follow from those two criteria and from nothing else? Ruling: approve. Both clauses that had been recorded as untestable now have tests. They drive the organization-request page that the contract added (register_by_request, change_profile_by_request, archive_by_request) and read only the observations that page names. R-3.2 sends a registration as public sector staff and as a vendor who never accepted the terms, and expects a refusal as not permitted. R-3.18 sends a profile change and an archive as an organization administrator who is not the owner, and expects each to be refused with the organization left unchanged. Matching the refusal reason against 'permission' follows from the criteria: R-3.2's then-clause says the request is 'refused as not permitted', and R-3.18 refuses on who is asking, which the contract files under 'permissions'. Checking that a refusal status is present only restates that the request was refused. No literal status code, route, selector or table appears in any test. The accepted counterparts (owner changes the profile, service administrator archives) assert the permitted half of R-3.18's 'only to a person permitted'. They are what shows that the refusals depend on who asked. The archive and rename tests do not leak state into other tests, because the fixtures reset each worker's target to its seed before every test. Leaving persona.vendorWithTermsReset unasserted is correct: the criterion says 'has already accepted the service's terms', not the current terms, so expecting a refusal would assert something the criterion does not say. The runner's typecheck passed with no diagnostics in acceptance/organizations. One part of 'anyone else is refused' is still unasserted: a visitor who is not signed in. The contract does not say what a registration request with no session observes, so I am recording that clause as owed by contract rather than returning the tests. This proposal does not settle build-slice-11-3#1 or #2, which ask the build stage for changes to the application, so both stay open. The missing-test rows for R-3.2 and R-3.18 close when these tests run. What would change the ruling: a first run on which any of these tests reports unbound, which would mean the assumed input field names do not match the request page, or a restatement of R-3.2 to require the current terms.

**Conditions:**
- missing-test R-3.2: a request from anyone else is refused — for a visitor who is not signed in — owed by contract: organization-request does not say what register_by_request sends or observes when there is no signed-in session, so no test can send a registration as a signed-out visitor and read its refusal

### Runner-owned typecheck evidence

Proposal revision: `fa082194fa939da8322553df74a587a9988d60ab`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    No diagnostics.
