| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-03T14:54:16.783Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** I added one page to the contract, which gives both owed organization items what their tests need.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added one page to the contract, which gives both owed organization items what their tests need. I could not bring the oracle up, because this session refused every way of calling the pipeline CLI.

**What changed.** `spec/contract/surface.yaml` has a new page, `organization-request`, in the organizations domain, at route `/api/organizations/:orgId`. It sends a request straight to the old service as whoever is signed in, and reads the answer.
- **Actions:**
  - `register_by_request` sends a new organization's registration. It goes to `/api/organizations` and ignores `:orgId`.
  - `change_profile_by_request` sends a profile change for `:orgId`.
  - `archive_by_request` asks the service to archive `:orgId`.
- **Observations:**
  - `request_accepted`, plus `refusal_status`, `refusal_reason` and `refusal_messages` when the service refuses.
  - `organization_identifier`, so a test can address an organization it has just registered.
  - `stored_active` and `stored_legal_name`, read again after the request, so a test can show a refused request left the organization unchanged.

Its test IDs are `null` like every other new entry, for the design gate to fill in. `:orgId` comes from a seed handle or from `organization_identifier`. It is one page for both items, following the pattern `content-request` and `opportunity-status-request` already use. In `spec/contract/openapi.yaml` I added the refusal answers to the create, update and archive operations: 400 for a missing or invalid field, 401 for "not permitted", and 404 when the organization does not exist.

**Things a test writer needs to know from the old source:**
- **Refusals:** every refusal for who is asking comes back as status 401, filed under `permissions`, with "You do not have permission to perform this action."
- **Registration checks fields first.** The service checks the fields before it checks who is asking. A test about who may register has to send a complete, valid registration; otherwise it gets field errors (400) whoever sends it. The page lists the required fields: legal name, first street line, city, region, mail code, country, contact name and contact email.
- **Profile changes and archives check the person first,** so their refusal doesn't depend on what was sent. Only the owner or a service administrator is accepted.
- **The terms-reset vendor's registration is accepted on the old service.** It only asks whether the vendor has *ever* agreed to the terms (`hasAcceptedPreviousTerms`), and `users.vendorWithTermsReset` has. I worked this out from the code, not by running the oracle, and the page says so. If the test expects a refusal for that vendor, calibrate will report the old target failing it; that is about what the criterion intends, not a gap in the contract.

**Nothing else changed.** The personas already cover every role these tests use. The seed already holds what they need: `organizations.qualified`, owned by `users.organizationOwner`, with `users.organizationAdmin` as an active ADMIN member; plus `users.staffOne`, `users.vendorOne` and `users.vendorWithTermsReset`. Observables, the oracle's Compose override and the seed are unchanged.

**What I could not do.**
- **Bring the oracle up or take it down.** This session refused every command that expands `$SDLC_BIN`, including the exact `node $SDLC_BIN oracle up`, and it would not let me list folders outside the repo to find the CLI's literal path. So I could not start the oracle with this run's contract, and `oracle down` was not run either. Nothing was started, so nothing was left running. The run logs show the oracle came up repeatedly on 2026-09-29 with the same override and seed, which this run did not touch.
- **Parse the YAML by machine.** Ruby and Python were refused too, so I checked the new entry's indentation and structure by eye against the entries around it.

re-address missing-test/R-3.2 to derive-tests: added page organization-request, whose action register_by_request sends a registration as the signed-in person and whose observations request_accepted, refusal_status, refusal_reason and refusal_messages report the refusal, for persona.staff and persona.vendorWithTermsReset (the old service accepts the latter, as the page notes)

re-address missing-test/R-3.18 to derive-tests: added page organization-request (route /api/organizations/:orgId), with actions change_profile_by_request and archive_by_request and observations request_accepted, refusal_status, refusal_reason, refusal_messages, stored_active and stored_legal_name, so a test can send each as persona.organizationAdmin against seed.organizations.qualified, read the refusal, and confirm the organization is unchanged

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is the new organization-request page (with the added 401/400/404 answers in openapi.yaml) the contract that the tests for R-3.2 and R-3.18 will act through? Ruling: approve. Reason: the page sends a registration, a profile change and an archive as the signed-in person, and lets a test read whether the service refused and why. It can also re-read stored_active and stored_legal_name afterwards to show a refused request changed nothing. That covers both owed clauses: 'a request from anyone else is refused' for R-3.2, and 'the service continues to refuse a profile change or an archive request' for R-3.18. It follows the pattern of content-request and opportunity-status-request, which are already in the contract. The access rules the page states match the old source: createOrganization in src/back-end/lib/permissions.ts accepts only isVendor plus hasAcceptedPreviousTerms, and deleteOrganization accepts only isAdmin or the organization's owner. The seed handles it names are in tests/seed/manifest.yaml. The page says plainly that the terms-reset vendor's registration is accepted on the old service, and that this was read off the source and not seen on a running oracle. That is a caveat about the data, not an assumption presented as fact. R-3.2's statement ('already accepted the service's terms') could mean ever-accepted or currently-accepted. That is a question about the criterion, not about the contract, and calibrate is the right place to settle it if a test for that vendor fails. The oracle could not be brought up in this session, but the override and seed are unchanged from runs that came up on 2026-09-29, so nothing here depends on an unverified service. This ruling settles no owed instruction. missing-test/R-3.2 and missing-test/R-3.18 stay open until derive-tests writes the tests and they run. build-slice-11-3#1 and #2 are build work this proposal does not touch. What would change the ruling: the old service checking who is asking before the fields on registration (that would invalidate the page's guidance on sending a complete registration), or an observation the tests need that the page does not provide.

**Conditions:**
none
