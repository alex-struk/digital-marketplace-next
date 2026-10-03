---
gate: G3
question: "Does slice 11 (A vendor can register and look after an organization) do what its criteria say?"
recommendation: "## Slice 11: organizations\n\nAll 16 criteria assigned to this slice are built."
opened: 2026-10-03T04:33:52.562Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 11 (A vendor can register and look after an organization) do what its criteria say?

**Recommendation.** ## Slice 11: organizations

All 16 criteria assigned to this slice are built.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

## Slice 11: organizations

All 16 criteria assigned to this slice are built. `npm --prefix app run check` passes: backend 533 tests, frontend 339, migrations 16. Nothing ran in a browser or in the compose sandbox, so the acceptance suite has not been run against this work. When I finished, I deleted the `node_modules` folders I had installed and a stray `backend/dist` build output, so `app/` is as I found it apart from my changes. The runner will need to install dependencies itself.

### Criteria and where to find them
- **R-3.1 and R-3.21 (the list).** `/organizations` shows every organization that isn't archived, sorted by legal name, 50 to a page. A page number past the last one shows page 1. The API takes no paging parameters, so `GET /api/organizations` returns everything and the screen does the paging.
  - Visitors and public sector staff see one column: the name.
  - Vendors and administrators also see owner, team size and both qualification marks. Administrators get these on every row. Vendors get them only on rows they own or administer, and only those rows link to the organization's management page.
- **R-3.2, R-3.22, R-3.23 (registering).** `/organizations/create` is open only to a vendor who has accepted the terms; everyone else gets the not-found page, and the service refuses them with 401.
  - The form uses the same validation rules as the service. "Create organization" stays disabled until the whole form is valid, and the reason is shown above it.
  - Creating makes the vendor the owner and opens the new organization's management page.
- **R-3.3 and R-3.18 (management page).** `/organizations/:orgId/edit` opens for an administrator and for the organization's owner and organization administrators. Anyone else, and any archived or unknown organization, gets the not-found page.
  - Edit and Archive are offered only to the owner and administrators. An organization administrator who isn't the owner sees the profile read-only, and the service refuses their changes.
- **R-3.19.** The phone number is saved with every other field, and clearing it removes the stored number.
- **R-3.6 and R-3.24 (archiving).** The archive dialog asks before acting. Archiving keeps the record, marked inactive with the date and who did it, and removes the organization from the list and from members' organization lists. When an administrator archives an organization, its owner is emailed; an owner archiving their own sends no email.
- **R-3.15 and R-3.20.** `/api/ownedOrganizations` returns the active organizations a vendor owns or administers. Anyone who isn't a signed-in vendor, administrators included, is refused with 401.
- **R-8.13, R-8.21, R-8.28, R-8.30 (logo).** The logo goes through the same `/api/avatars` route slice 3 built for profile pictures. I reused the slice 3 image picker with the organization page's test IDs. A refused logo (wrong file ending, or content that isn't an image) keeps the form open and saves nothing. The stored logo shows on the Organization tab and on the public list.

### Two things I added beyond the slice description
- **The profile's Organizations section** now lists the organizations a person owns (with team size) and the ones they belong to or are invited to. R-3.23 and R-3.6 are observed there. It is backed by `GET /api/affiliations`, which for now returns only the person's own memberships; asking for an organization's team with `?organization=` is refused with 400.
- **The qualification marks** are calculated now, because R-3.21 is about who gets to see them.

### Where I departed from the stories
- **Logo on the list.** The list stories show no logo, but R-8.28's own example is a visitor seeing one there. I put it in the name cell, above the name.
- **When form errors appear.** A field shows its error when the person leaves it, and also once they touch a later field. This way a required field that was skipped is still reported, even though the disabled button means nobody can submit to find out.

Both are recorded with the other choices in `docs/decisions/0047`, and `app/README.md` has a new Organizations section.

### Tests
- **Rules:** validation, who may do what, which organizations a vendor may act for, paging, qualification.
- **Service:** over an in-memory store, including the archive email being sent or not.
- **End to end:** against the real migrated schema with the acceptance seed. This covers list visibility by role, the 401 refusals, create, phone save and clear, archiving, and a 2000×300 logo stored at 500×75 that a visitor can download. A `.gif` name and a non-image `.png` are refused.
- **Frontend screens:** 28 tests, including accessibility (axe) checks.

### What the next slice will find
- The Team, both qualification and Changelog tabs are in the page's navigation but each shows "not available yet".
- Accept, decline and leave controls are missing from the Organizations section.
- The service refuses the other update actions on an organization (accepting the two programs' terms, setting service areas) with 400 until slice 13 builds them.
- The list's "refused" state is built but nothing triggers it; the design leaves open who would be refused the list (its gap 1).

I didn't need to change anything outside `app/` and `docs/decisions/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 11 do what its 16 criteria say? Verify recorded fail: 2 pass, 4 failed on an empty read, 10 unbound. Approval is refused on that result, so this is a return. Sorting each failure against the evidence and tests/adapters/new/index.ts puts every one on the adapter. (1) R-3.1 and R-3.21: the page outline (.sdlc/evidence/slice-11/R-3.1.txt) shows the list table with column header "Organization" and the seeded names in its cells, which is the column name design/DESIGN.md:1215 gives. organizationList.organizationName calls columnValues(/^(organization name|legal name)$/i), matches no header and returns "". (2) R-3.3 and R-3.18 (empty reads), and R-3.19, R-8.13, R-8.21, R-8.28, R-8.30 (unbound): R-3.3.txt shows the management page rendering the Organization panel, the read-only profile and the Edit and Archive buttons. The section switchers are links in navigation "Organization sections" (Organization, Team members, Sprint With Us qualification, Team With Us qualification, Changelog), as DESIGN.md:1008 specifies (the management tabs are Links). orgEdit.tab and orgTabOpen only look for role=tab, so they read "" or throw unbound. (3) R-3.2, R-3.6, R-3.15 and R-3.23 are unbound because organizationCreate is bound as absent(...). R-3.22 is unbound through owned_organizations_table. Both recorded reasons describe the application before this slice (create sent people to /dashboard; the profile showed a placeholder line), and this branch builds /organizations/create and the profile's Organizations section. Nothing in the evidence points at the application, so build owes nothing yet. The code read well on its own terms: shared rules, a refusal for each role, archive email only when an administrator archives, and unit and end-to-end coverage. What would change the ruling: a fresh verify run, after the adapter is rebound, with every criterion passing or failing on the application's own behaviour.

**Conditions:**
- addressed-to bind-adapter: R-3.1, R-3.21: organizationList.organizationName reads columnValues(/^(organization name|legal name)$/i) and returns "". On /organizations the page draws a table captioned "Registered organizations by legal name." whose name column header is "Organization" (design/DESIGN.md organization list: "Organization only" for a visitor; "Organization, Owner, Team size, ..." for a vendor). The cells hold the legal names. Match the "Organization" header. The owner and qualification column readers should be checked against the same design table.
- addressed-to bind-adapter: R-3.3, R-3.18: organizationEdit.organizationTab (orgEdit.tab) looks only for role=tab and returns "". On /organizations/<id>/edit the sections are links inside navigation "Organization sections" (link "Organization" -> ?tab=organization, "Team members" -> ?tab=team, "Sprint With Us qualification", "Team With Us qualification", "Changelog"), which is what the design specifies for the management tabs. The Organization section's content sits in region "Organization" (heading level 2, button "Edit organization", read-only profile fields), and region "Archive this organization" holds button "Archive organization". Bind the tabs to those links and read the matching region.
- addressed-to bind-adapter: R-3.19, R-8.13, R-8.21, R-8.28, R-8.30: organization-edit.edit_organization (orgTabOpen) reports unbound with "no tab named /^\s*organization\s*$/i", although its own message lists link "Organization" and button "Edit organization" on the page. Open the Organization section through that link, or stay on the default tab, then press "Edit organization". ORG_TAB.team (/^\s*team\s*$/i) and ORG_TAB.changelog likewise need to match the page's link labels "Team members" and "Changelog".
- addressed-to bind-adapter: R-3.2, R-3.6, R-3.15, R-3.23: organizationCreate is bound as absent, with a reason recorded against an earlier build where /organizations/create sent people to /dashboard. This branch serves /organizations/create to a signed-in vendor who has accepted the terms: heading "Create Organization", the profile form, a logo picker whose trigger is data-testid organization-logo-button, and a "Create organization" button that stays disabled until the form is valid. On success it goes to /organizations/<id>/edit. Bind create_organization, cancel, change_logo, field_error and submit_disabled_until_valid against the running build.
- addressed-to bind-adapter: R-3.22: organization-user-memberships.owned_organizations_table is unbound, with a reason describing the profile's Organizations section as a placeholder line. This branch renders that section at /users/<id>?tab=organizations with the organizations the person owns (with team size) and the ones they belong to or are invited to. Rebind it against the running build.
