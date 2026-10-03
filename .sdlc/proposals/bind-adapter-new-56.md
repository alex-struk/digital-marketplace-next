---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I answered all five conditions."
opened: 2026-10-03T04:48:00.089Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I answered all five conditions.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I answered all five conditions. Every change is in `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`. I checked each one on the running target at http://localhost:4300, signed in through the identity provider as the seeded organization owner (test-vendor-2). The adapter could not be type-checked: the workspace has no installed toolchain, and running the compiler needed an approval this session couldn't get. Instead I ran the new locators directly in the live browser, and they resolved as written.

**1. Organization list columns.** Signed out, /organizations shows one column, "Organization". Signed in as a vendor, it shows "Organization", "Owner", "Team size", "Sprint With Us qualified" and "Team With Us qualified". The last four are filled ("Yes"/"No") only for organizations that vendor owns, and those names link to the organization's screen. The name reader now matches "Organization" (the old "Organization name" and "Legal name" headers still match too). The qualification readers now accept "Sprint With Us qualified" and "Team With Us qualified" as well as the old SWU/TWU spellings. The owner reader's "Owner" header was already right, so I left it alone.

**2. Organization screen sections.** On /organizations/<id>/edit the sections are links under the navigation "Organization sections": "Organization", "Team members", "Sprint With Us qualification", "Team With Us qualification" and "Changelog". Each section's content is a region with the same name as its link. The adapter now opens a section through its link (falling back to a role=tab if one ever appears) and returns that region's text. I marked all five section readers bound. I also marked `archive_organization` bound: it already pressed "Archive organization", and that button is in the "Archive this organization" region. I didn't press it, so the seeded organization isn't archived.

**3. Edit organization.** `edit_organization` and the helpers that depend on opening a section now go through those links. "Team" now also matches "Team members"; the changelog pattern already matched "Changelog". I confirmed that pressing "Edit organization" turns the region into the form, with "Save changes" and "Cancel". One thing for whoever reads results next: the "Team members" and "Changelog" sections currently say only "This section is not available yet." So the team and changelog section readers will return that text, and the team-member controls will still come back unbound with what the screen offers.

**4. Create organization.** /organizations/create is now served to the signed-in vendor, so it is a real page object instead of the old "absent" stub. It has the heading "Create Organization", a "Choose a logo (optional)" button that I confirmed opens a file chooser, the required and optional profile fields, and a "Create organization" button that is disabled until every required field is filled. "Cancel" goes back to /organizations, which I confirmed.
- **`create_organization`** fills every input key into its field by label (the contract's names like `legalName`, `streetAddress1`, `region`, `mailCode` and `contactEmail` map to the visible labels), offers any logo through the chooser, then presses the button. If the button is still disabled it fails at once, saying so. Afterwards it waits for /organizations/<id>/edit.
- **`field_error`** returns the message of each field marked invalid, leaving out the hint that comes before it.
- **`submit_disabled_until_valid`** reads "disabled" or "enabled", the same convention as the other "until valid" readers.

I did not submit a real organization, so that the seeded list stays as the tests expect it.

**5. Owned organizations.** /users/<id>?tab=organizations now has a region "Organizations you own". It holds a table with columns Organization, Team members and Sprint With Us qualified; for the owner it lists Northern Pines Digital Ltd. (3, Yes) and Salt Marsh Labs Ltd. (1, No). There is also a region "Organizations you belong to". `owned_organizations_table` now reads that table's rows. It returns nothing when the region is there but holds no table, and reports unbound only when the region itself is missing.

**What I deliberately didn't touch.** I changed only the members the conditions name, so some recorded reasons are now out of date even though I left them as they were:
- The other 13 members of organization-user-memberships, and all of organization-user-memberships-self, still carry the old reason that this section is a placeholder line. The section is now real, and these deserve a rebind in a later round.
- The other organization-edit members are still recorded in `bindings.yaml` as "Page not found", though the screen now opens.
- The shared "nobody signs in" reason in the adapter still describes the earlier build.

Every page in the surface still appears in `bindings.yaml` exactly once. Every route I opened this run resolved on the target, and I deferred none of the five requests.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? The new code is navigation and locators only. Nothing under tests/acceptance changed. The runner's typecheck on this revision passed. The changes answer all five build-slice-11 requests: organization list headers, section links and regions on the edit screen, edit_organization, a real organization-create page object, and the owned-organizations table. They are recorded as met below. Return anyway, because bindings.yaml now records unbound reasons the proposal itself says are false. save_changes and cancel_editing remain unbound as 'Page not found', yet the proposal saw 'Save changes' and 'Cancel' appear after 'Edit organization' on the same screen, and index.ts already drives both. The other organization-edit members carry the same stale reason. At run time, 13 organization-user-memberships members still go through the absent stub with the 'placeholder line' reason, so verify will tell the application it lacks a surface the proposal saw rendered. affiliated_organizations_table is an example: the 'Organizations you belong to' region is on the page. An unbound reason has to describe the build as it is, so these cannot be approved as they stand. Separately, orgSection falls back to the whole main text when the named region is missing, which can answer a section-specific test with text from another section. What would change the ruling: a revision that rechecks every remaining organization-edit and organization-user-memberships member against the running build, so each is bound or unbound with a current reason, and that makes orgSection return empty when its region is absent.

**Conditions:**
- organization-edit in tests/adapters/new/bindings.yaml: save_changes and cancel_editing are recorded unbound because the edit screen 'shows Page not found', but the proposal confirmed that pressing 'Edit organization' shows 'Save changes' and 'Cancel', and index.ts already drives both. Recheck them against the running build and mark them bound, or unbound with a reason describing the current screen. Do the same for every other organization-edit member still carrying the 'Page not found' reason: add_team_members, approve_pending_member, remove_team_member, change_logo, organization_identifier, swu_qualified_badge, twu_qualified_badge, owner_badge and the rest.
- organization-user-memberships in tests/adapters/new/index.ts and bindings.yaml: the 13 members still routed through absent(...sectionRedrawn...) report at run time that /users/<id>?tab=organizations is a placeholder line. The proposal saw that section rendered with the regions 'Organizations you own' and 'Organizations you belong to'. Rebind each member against the running build, starting with affiliated_organizations_table from the 'Organizations you belong to' region, or give each an unbound reason that names what the current page lacks. Do the same for organization-user-memberships-self.
- tests/adapters/new/index.ts orgSection: when the region named after the section link is not found, it falls back to the first tabpanel and then to mainText(). That can answer a section-specific observation with text that is not that section. Return "" or report unbound naming what the screen offers, instead of falling back to the main text.
- tests/adapters/new/index.ts: update the shared 'nobody signs in' reason, which the proposal says still describes an earlier build, so that no unbound report quotes it against the current build.

### Runner-owned typecheck evidence

Proposal revision: `476fb2f062af5251458c9b9451d5352b5643ba59`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
