# 0047 · Organizations: registered, listed, changed and archived (slice 11)

- Status: accepted for the build (slice 11)
- Date: 2026-10-02

## Context

Slice 11 builds the organization list, registration with a logo, the management page's
Organization tab, archiving with the owner's notice, and the organizations a vendor may act
for (R-3.1–R-3.3, R-3.6, R-3.15, R-3.18–R-3.24), and answers for the four image rules on the
logo half (R-8.13, R-8.21, R-8.28, R-8.30). The contract names the routes but no response
shapes and no paging parameters, and the stories leave a few things open. These are the
choices made, so the next slice does not have to reverse-engineer them.

## Decisions

**The list is one answer, paged by the screen.** `GET /api/organizations` takes no parameters
in the contract, and the boundary refuses any it does not name, so the service answers with
every organization that is not archived and the screen shows fifty to a page at
`/organizations?page=N`. A page that is not a whole number or lies past the last shows the
first (R-3.1's note). The rule is `pageOf` in `backend/src/rules/organizations.ts`.

**What a list row carries depends on who asks (R-3.21).** Every row is `id`, `legalName`,
`logoImageFile`, `active` and `serviceAreas`. To an administrator, and to a vendor for the rows
they own or administer, it also carries `owner` (`{ id, name }`), `numTeamMembers`,
`swuQualified` and `twuQualified`. The screen reads the presence of those fields as "this
person may open it", so the name links to the management page exactly where the service would
let the person in. The qualified marks are computed now (R-3.25, R-3.26 as rules only) because
R-3.21 is about who sees them; the qualification tabs themselves remain slice 13's.

**The full record** (`GET /api/organizations/<id>`, and the answer to create, update and
archive) is the kept row with `owner`, `numTeamMembers` (active members, owner included),
both qualified flags, `serviceAreas`, and `viewerMembership` — the requester's own membership
or null — so the screen decides what to offer with the same rule the service applies
(`mayChangeOrganization`, R-3.18).

**Refusals are 401 in the one shape (decision record 0010).** Registering by anyone but a
vendor who has accepted the terms, reading by anyone but an administrator or the owner or an
organization administrator, changing or archiving by anyone but the owner or an
administrator, and asking `/api/ownedOrganizations` as anyone but a signed-in vendor — an
administrator included — are each `401 { "errors": [...] }`. An identifier no organization
carries is 404 to an administrator and 401 to everyone else, as files are (R-8.12). An invalid
profile is `400` with one line per field, each beginning with the field's label (R-3.22).

**An archived organization** is kept, marked `active: false` with `deactivatedOn` and
`deactivatedBy` (R-3.6). Its record can still be read through the API by those who could read
it before, which is where that marking is observable; the management page shows it as the
missing page, as the design says. After archiving, the screen goes to the organization list.
Only the owner of an organization an administrator archived is emailed (R-3.24); the mailer's
own rules (no address, deactivated account) still apply.

**The logo** is the image picker of slice 3, given the organization page's own test IDs
(`organization-logo-button`, `organization-logo-refused-error`) and words. It checks the name
and first bytes when a file is chosen, the service checks them again when the form is saved,
and either refusal keeps the form open and saves nothing. Its message includes the oracle's
"Please select a different logo image." On the list, a logo is shown in the Organization cell
above the name (`alt` "<legal name> logo"), contained by `max-width: 100%`; the list stories
show no logo, but R-8.28's example is a visitor seeing it on the list.

**When a form field is checked.** As the design says, when the person leaves it — and also once
a later field has been touched, so a required field skipped over is reported as well. Never on
each keystroke. The submit button stays unavailable until the whole form is valid.

**`GET /api/affiliations` answers only the requester's own memberships** — active or pending,
in organizations that are not archived — for the profile's Organizations section, which now
lists owned organizations (team size, Sprint With Us mark) and those the person belongs to or
is invited to. With `?organization=` it is refused `400` until slice 12 builds the team list
(R-3.14); accepting, declining and leaving are slice 12's too.

**The other management tabs** (team, both qualifications, changelog) are in the navigation, so
their test IDs are present, and each shows a sentence saying it is not available yet. The
update tags other than `updateProfile` are refused `400` until slice 13.

## What would reverse it

- A contract that names paging parameters: the paging moves into the service, same rule.
- A ruling on the design's organizations gap 1 (who is refused the list): the refused state is
  built and unreached.
