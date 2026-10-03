| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T16:38:18.733Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 12 (An organization can build its team) do what its criteria say?

**Recommendation.** I built slice 12 — the organization's team — and `npm --prefix app run check` passes: typecheck plus 16 migration tests, 563 backend tests and 360 frontend tests.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I built slice 12 — the organization's team — and `npm --prefix app run check` passes: typecheck plus 16 migration tests, 563 backend tests and 360 frontend tests. All 19 criteria on the slice's list are built. I couldn't start the sandbox or open a page, so none of this has been seen in a browser; what I know comes from unit tests and from end-to-end tests that run the service in-process over the real migrations, the seed and the contract boundary.

**What I built and how each criterion is reached**

- **Changelog table (R-3.33).** A new migration, `20261003000001_affiliation_events.cjs`, adds the kept `affiliationEvents` table. I refreshed the Prisma schema with a real `prisma db pull` against a migrated in-process database; the only change is the new model and its two relations.
- **Service.** A new `TeamService` sits behind `/api/affiliations`, and its rules live in the shared `rules/organizations.ts`, so the screens and the service decide the same way:
  - **Team list (R-3.14):** `GET ?organization=` is answered to a service administrator and to the owner and organization administrators. An ordinary member or an outsider is refused 401.
  - **Inviting (R-3.7, R-3.8, R-3.17, R-3.30):** `POST` creates a pending membership. The type must be member or owner, and only an active vendor without an existing membership there can be invited. An address nobody has registered gets an invitation to sign up, and no membership is made.
  - **Accept, rights, ownership (R-3.9, R-3.12, R-3.13):** `PUT` takes `approve`, `updateAdminStatus` or `changeOwner`. The owner cannot accept on the invited person's behalf, and accepting twice is refused with "Membership is not pending." Nobody can change their own rights or the owner's. Only a service administrator can transfer ownership, and only to an active member.
  - **Ending a membership (R-3.10, R-3.11):** `DELETE` covers leaving, removal and declining. The membership becomes inactive rather than being erased, and the sole owner cannot be removed.
  - **Changelog:** each change of rights or ownership is recorded in the same transaction. It is returned as `changelog` on the organization's full record, newest first.
- **Messages (R-3.31, R-3.32, R-3.35, R-6.16).** The invitation email links to `/users/me?tab=organizations&invitation=<id>&answer=accept` or `…&answer=decline`. The owner and the new member are told when someone accepts. Only a decline by the invited person emails the owner. None of these messages offers to unsubscribe; each ends with the existing link to notification settings.
- **Screens.** The Team members and Changelog tabs are in the new `organization-team.tsx`, built from their stories with every test ID. They include the invite dialog, the administrator-rights confirmation with its statement checkbox, the remove and change-owner dialogs, the owner and pending badges, and the capability summary, which counts active members only (R-3.34). The profile's organizations section now offers Accept, Decline and Leave, each with a confirmation. Arriving from the email opens the matching confirmation.
- **R-3.6, R-3.15, R-3.23** were built in slice 11; I checked them again here through the team flows.

**What I tested**

- **Rules and service:** the in-memory store now lives in a shared test helper. `team-service.test.ts` covers every rule and every message.
- **End to end:** I added a team block to the existing organizations end-to-end test, run against the seeded accounts and the contract boundary.
- **Screens:** `team.test.tsx` covers the tabs, dialogs, invitation outcomes, the email arrival and an axe accessibility pass.

**Choices a reviewer should know.** All are recorded in `docs/decisions/0050`, and I updated the README.
- The spec gives no refusal wording, so the messages are mine. Invitation refusals are filed under the field they concern (`membershipType`, `userEmail`, `inviteeNotRegistered`), as the old service did; other refusals use `errors`, and permission refusals use `permissions` with a 401.
- A transfer of ownership is labelled "Ownership Transferred" (design gap 9), and the administrator-rights statement text is the design's own (gap 8).
- A service administrator may approve a pending invitation, as the design's matrix shows.

**What I could not settle (design gaps 10 and 11)**

- The screens never offer controls the service would refuse: removing the sole owner, changing one's own or the owner's rights, accepting for someone else. Those refusals can only be seen by sending the request directly. If a test expects to see them on a screen, the surface needs observations for them; that change belongs to the contract and spec stages, not here.
- The surface names one action where the screen needs two steps — open the dialog, then confirm. The extra confirm test IDs are in the markup but not in `surface.yaml`.

**For slice 13:** the two qualification tabs still say "not available yet". Qualification is already computed from active members, so the capability rule it needs is in place.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Does slice 12 (An organization can build its team) do what its criteria say? Return. Verify is a current fail: 4 of 19 criteria passed. I read each failing page's outline and the adapter under tests/adapters/new/. Most of the failures are the adapter's. It reads badges as whole text lines, but a table row arrives as one line of tab-separated cells, so 'Pending' and 'Owner' cells never match (R-3.8, R-3.23, R-3.32). On the self page it wants a row ending in 'pending', and that row ends with its Accept and Decline buttons (R-3.9). Its capabilities read keeps only lines containing 'capabilit' (R-3.34). It looks only for a combo box in the Change owner dialog, which draws a 'New owner' select (R-3.13). It looks for the admin-rights checkbox before opening the dialog that holds it (R-3.12, R-3.15, R-3.33). It treats the not-found page shown to a refused viewer as unbound instead of as the refusal (R-3.14). It compares the team rows against an email the rows never show (R-3.10). It returns any open dialog as the decline confirmation (R-3.35). Two failures are the application's. The R-3.30 page shows no warning naming the unregistered address, and the R-3.7 page lists only one of the two invited people. The likeliest cause is the invitation outcome being lost when the tab refreshes after sending, which I did not confirm. R-3.11 cannot be observed through the screen, because the sole owner's row has no Remove control by design, so the contract needs an observation for that refusal. The backend, its unit and end-to-end tests, and the migration look sound, and I found no secret or personal data. A current verify pass, after the adapter is re-bound and the two application faults are fixed, would change this ruling.

**Conditions:**
- R-3.7: Error: expect(received).toContain(expected) // indexOf — Received string:    "Alex Placeholder (you) | Owner | 0 |· — at tests/acceptance/organizations/R-3.7.spec.ts:60 — its last steps: …field | Pending | 0 | Remove" → organizationEdit.teamMemberRow() at /organizations/00000000-0000-4000-8000-000000000302/edit?tab=team read "Alex Placeholder (you) | Owner | 0 | Perpetua Wrenfield | Pending | 0 | Remove" — the page as it failed: .sdlc/evidence/slice-12/R-3.7.png, .sdlc/evidence/slice-12/R-3.7.txt
- R-3.30: Error: expect(received).toContain(expected) // indexOf — Received string:    "" — at tests/acceptance/organizations/R-3.30.spec.ts:20 — its last steps: organizationEdit.open({orgId}) at /organizations/00000000-0000-4000-8000-000000000304/edit → organizationEdit.addTeamMembers({emails}) at /organizations/00000000-0000-4000-8000-000000000304/edit?tab=team → organizationEdit.teamMemberRow() at /organizations/00000000-0000-4000-8000-000000000304/edit?tab=team read "Blake Placeholder (you) | Owner | 3 | Indigo Placeholder | Pending | 0 | Remove" → organizationEdit.fieldError() at /organizations/00000000-0000-4000-8000-000000000304/edit?tab=team read "" — the page as it failed: .sdlc/evidence/slice-12/R-3.30.png, .sdlc/evidence/slice-12/R-3.30.txt
- addressed-to bind-adapter: R-3.8: organizationEdit.pendingBadge read "" because it matches /^pending$/ against main-text lines, and a table row's text is one line of tab-separated cells; the team table on /organizations/<id>/edit?tab=team draws a cell reading "Pending" in the Membership column of the invitee's row (Isolde Brackwater), so read that column's cell rather than whole lines
- addressed-to bind-adapter: R-3.32: organizationEdit.pendingBadge read "" for the same reason as R-3.8; the team table on /organizations/00000000-0000-4000-8000-000000000304/edit?tab=team shows Rosalind Fenwhistle's Membership cell as "Pending", so read the Membership column cell
- addressed-to bind-adapter: R-3.23: organizationEdit.ownerBadge read "" because it matches /^owner$/ against whole main-text lines; the team table on the newly registered organization's ?tab=team shows the registrant's row "Blake Placeholder (you)" with the Membership cell "Owner", so read that column's cell
- addressed-to bind-adapter: R-3.9: organizationUserMembershipsSelf.pendingBadge filters rows with /(^| \| )pending$/, but the row in "Organizations you belong to" on /users/me?tab=organizations reads "Salt Marsh Labs Ltd. | Pending | Accept … Decline …", with the action buttons after the Membership cell; read the Membership column instead of requiring the row to end in 'pending'
- addressed-to bind-adapter: R-3.34: organizationEdit.teamCapabilities keeps only lines matching /capabilit/i, which drops the capability list items; the "Team capabilities" region on ?tab=team lists each capability as "<name>: held" or "<name>: not held" (for example "Technical Architecture: not held"), so return that region's list items
- addressed-to bind-adapter: R-3.13: organizationEdit.changeOwner reports "offers no chooser of people" because it looks only for role combobox; after "Change owner" is pressed on ?tab=team, the open dialog "Change owner" draws a select rendered as a button ("Select an item" / "New owner") that opens a listbox of eligible members — bind that
- addressed-to bind-adapter: R-3.12: organizationEdit.acceptOrgAdminTerms reports no terms box on ?tab=team because it searches before the box exists; the statement checkbox is inside the confirmation dialog that the row button "Give administrator rights to <name>" opens, and toggleMemberAdminStatus looks for a checkbox or switch in the row when the row offers that button (and "Remove administrator rights from <name>") instead
- addressed-to bind-adapter: R-3.15: the same acceptOrgAdminTerms and toggleMemberAdminStatus binding as R-3.12 — the terms checkbox lives in the dialog opened by "Give administrator rights to Dana Placeholder" on /organizations/00000000-0000-4000-8000-000000000304/edit?tab=team
- addressed-to bind-adapter: R-3.33: the same acceptOrgAdminTerms and toggleMemberAdminStatus binding as R-3.12 — the terms checkbox lives in the dialog opened by the row's "Give administrator rights to <name>" button on ?tab=team
- addressed-to bind-adapter: R-3.14: organizationEdit.teamMemberRow reported unbound because /organizations/:orgId/edit drew "Page not found" for the viewer it walked as; that screen is how this target refuses a person who may not see the organization (R-3.3), so for the ordinary member and the outsider the refusal is the not-found page and should be read as refused, not as an unbound screen
- addressed-to bind-adapter: R-3.10: organizationEdit.teamMemberRow returned rows that name people ("Dana Placeholder | Member | 3 | …"), and the test compares them with the leaving member's email "org.member@example.test"; the member is on the list by name, so the binding must report the rows in terms the test's persona can be matched against (the persona's name for that email)
- addressed-to bind-adapter: R-3.35: organizationUserMembershipsSelf.declineConfirmation returned the open dialog "Join Northern Pines Digital Ltd.?…" at ?answer=accept; answerDialog returns whichever dialog is open, so it must return the dialog only when it is the decline confirmation (and acceptConfirmation only for the accept one)
- addressed-to bind-adapter: R-3.30: organizationEdit.fieldError reads only aria-invalid textboxes, but the team screen reports an unregistered address after the invite dialog closes as a warning alert above the team table titled "<address> is not registered with the Digital Marketplace"; bind the R-3.30 read to that alert
- addressed-to contract: R-3.11: the surface's only way to try ending an owner's membership is the team row's Remove control, and the team screen does not offer Remove on the sole owner's row (the screens deliberately omit controls the service would refuse), so the remove_team_member binding cannot reach the refusal the criterion asks to observe (verify: no row offers removal of Blake Placeholder, the sole owner); the surface needs an action or observation through which the refused removal and its message can be seen
