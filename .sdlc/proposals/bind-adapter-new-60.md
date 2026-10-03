---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I added the `organization-request` page to the existing \"new\" adapter, and all ten of its actions and observations are now bound."
opened: 2026-10-03T15:07:28.177Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I added the `organization-request` page to the existing "new" adapter, and all ten of its actions and observations are now bound.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the `organization-request` page to the existing "new" adapter, and all ten of its actions and observations are now bound. One gap: I couldn't run the type-checker or the script that compares the bindings file with the contract, because neither command was approved here. I checked both by reading them; the next stage should run them.

**What I added.** The page is a set of direct requests to the service's organization API, not a screen. I worked out how the running target behaves by sending the requests myself while signed in through the identity provider:
- **Signed out:** registering, changing a profile and archiving are all refused with 401, each with its own message.
- **As the organization owner** (`test-vendor-2`):
  - A registration with missing or badly formed fields is refused with 400. Each error comes back in one `errors` list as a "Label: message" line.
  - A complete registration is accepted with 201 and returns the new identifier. A profile change is accepted with 200.
  - Archiving returns 200 with `active` set to false. A second archive is refused with 400.
- **As the organization's admin member** (`test-vendor-3`), on the seeded qualified organization: both a profile change and an archive are refused with 401, "Only the organization's owner or an administrator may change or archive it." That admin can still read the organization, and it is unchanged afterwards.

To test the accepted path I registered, changed and then archived one throwaway organization of my own, "Adapter Probe Org". It now sits archived on the target. I didn't change or archive any seeded organization.

**How the new page reports things:**
- **Matching input to fields:** registering and changing a profile match each input key to a profile field under several spellings. A key that matches no field throws `unbound:` naming that key, rather than being dropped.
- **Profile changes keep unchanged fields:** the adapter first reads the stored record, if the person may read it, and fills in any fields the test left out.
- **Accepted, refusal status and messages:** these use the same helpers as the adapter's other request pages.
- **`refusal_reason`:** gives each field's label for field errors, and otherwise the key the refusal is filed under. On this target that is `errors`, not the `permissions` or `notFound` names the contract describes. That is how the target behaves, not something I invented.
- **`organization_identifier`:** filled only after an accepted registration, empty otherwise.
- **`stored_active` and `stored_legal_name`:** read the organization again after the request. If the signed-in person is not allowed to read it, they throw `unbound:`.

**The four criteria from the earlier run:**
- **R-3.2:** `organization-create.create_organization` is already bound on this target. The failure quoted came from a different address (port 4500). The refusal and acceptance cases R-3.2 needs are now reachable through the new request page.
- **R-3.6, R-3.15 and R-3.23** (`add_team_members` and `owner_badge`) stay unbound. The Team members section of the organization's edit screen shows only "This section is not available yet." for the owner, for the organization's admin member and for the service administrator. The organizations list gives only a "Team size" count. The organization's own page and guessed `/team` and `/members` addresses answer "Page not found". I added this to both reasons in the bindings file.

Every route in the contract that this run looked at resolved on the target. Apart from these additions I left the earlier bindings as they were, and I wrote nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-new-60 adapter bind every surface action and observation on new, and nothing else? Ruling: approve. The new organization-request page in spec/contract/surface.yaml (route /api/organizations/:orgId) defines three actions (register_by_request, change_profile_by_request, archive_by_request) and seven observations (request_accepted, refusal_status, refusal_reason, refusal_messages, organization_identifier, stored_active, stored_legal_name). bindings.yaml binds exactly those ten and adds nothing more, and index.ts adds matching members on S.OrganizationRequestPage. The runner's own typecheck on 34172b387 passed with no diagnostics under adapters/new/, which covers the check the author could not run. The adapter stays an adapter. It only sends requests and reads answers: it matches input keys to the service's field names, and it fills unchanged profile fields from the stored record so the update operation receives a whole profile. It throws unbound: on any input key it cannot match, rather than dropping it. Nothing in it decides whether a test passes. refusal_reason reports what the target actually files a refusal under: the field's label taken from a 'Label: message' line, otherwise the body key, which on this target is 'errors'. The contract instead names permissions, notFound or a field name. The adapter is right not to invent those names. If a test fails on that difference, it is a question about how the application reports refusals, not about the binding. The add_team_members and owner_badge unbound reasons are real. The Team members section says only 'This section is not available yet.' for the owner, for the organization's admin member and for the service administrator, and the guessed /organizations/<id>, /team and /members addresses answer 'Page not found'. The surface is genuinely missing. It is not a binding the adapter could have made, and the open plan revision request (request/build-slice-11-3#1) already tracks it. Nothing under tests/acceptance changed, and nothing outside tests/adapters/new/ changed apart from pipeline records. Tier is STANDARD and no residual risk is marked unaccepted, so there is no escalation. The author left one throwaway organization, 'Adapter Probe Org', archived on the new target, and no seeded record was changed; I accept that. Still open, and this proposal does not settle them: build-slice-11-3#1 and #2 (asked of build), and the missing-test entries for R-3.2 and R-3.18 (owed by derive-tests, which can now write those tests against this page). What would change the ruling: a member that decides pass or fail, a binding the contract does not name, an unbound reason the Team members section turns out to contradict, or a failed typecheck on this revision.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `34172b387fac72ae3ad26e3ec65bc328a2e7cd51`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
