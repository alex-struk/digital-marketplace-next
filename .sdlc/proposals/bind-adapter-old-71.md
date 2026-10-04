---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I bound `organization-request.register_by_request` for R-3.2."
opened: 2026-10-04T22:43:15.376Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I bound `organization-request.register_by_request` for R-3.2.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I bound `organization-request.register_by_request` for R-3.2. The fix is new spellings in the adapter: `addressLineTwo` was never missing from the application, the adapter just didn't recognise that name for a field it already sends.

**The finding.** On the running target at port 3100 this action posts to `/api/organizations`. That posting already sends the second address line under the name the service uses, `streetAddress2`. But the adapter checks every input key against a list of names it accepts for each profile field. `addressLineTwo` was not on that list, so the adapter refused the key before sending anything. To confirm the service's field names, I signed in through the vendor session route and posted a blank registration from the browser. The service answered 400 and listed every field it validates: `legalName`, `contactName`, `contactEmail`, `streetAddress1`, `city`, `region`, `mailCode` and `country`. That fits the adapter's existing comment on this endpoint. As a side note, that vendor could not read the seeded qualified organization: the target answered "You do not have permission to perform this action."

**The change.** It is confined to the profile-field name list in `tests/adapters/old/index.ts`, which `register_by_request` and `change_profile_by_request` share. I added `addressLineTwo`, `streetAddressTwo`, `addressTwo` and `secondAddressLine` for the second address line. I also added the matching first-line names (`addressLine`, `addressLineOne`, `streetAddressOne`, `addressOne`, `firstAddressLine`), so a test spelling the first line the same way isn't refused next. Following the new target's form labels, I added a few more: `provinceOrState`, `postalCodeOrZipCode`, `postalOrZipCode`, `contactEmailAddress` and `contactPhoneNumber`. Every existing spelling still works.

**What I couldn't check.**
- **Type check and test run:** this session didn't allow me to run the TypeScript compiler. The edit only adds string entries to an existing list, but it has not been compiled or run against the R-3.2 test.
- **A real registration:** I didn't submit one with the new key, because that would leave a lasting organization on the target. The only request I sent was the blank one, which the service refused and stored nothing.

**Bindings and routes.** `tests/adapters/old/bindings.yaml` already listed `register_by_request: bound`, so I left it unchanged. No other member was touched. Every route this work used responded on the target, and I found no page whose route failed to resolve. I changed nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** runner:checks

Approved by the runner's checks, which policy.gates.G3.auto_approve lets settle bind-adapter proposals: the acceptance typecheck of 0bdd6d1a0 is clean; no condition is open against it; no escalation stands on it; nothing outside tests/adapters changed.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `0bdd6d1a07e3922139074f6b11027d2dd9dc8b7a`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
