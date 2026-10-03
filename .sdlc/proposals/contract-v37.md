---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added one page to the contract, which gives both owed organization items what their tests need."
opened: 2026-10-03T14:54:16.783Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
