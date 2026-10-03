---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-03T15:07:28.137Z"
cost: 1.7207539999999997
turns: 65
session: "be8ea487-e9fa-4530-9a06-14890ef2ac43"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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