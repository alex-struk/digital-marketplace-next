# 0053 · Qualifying for Sprint With Us and Team With Us (slice 13)

- Status: accepted for the build (slice 13)
- Date: 2026-10-03

## Context

Slice 13 builds the management page's two qualification tabs, the two program terms pages and
their one-time acceptance, and the administrator's service-area approvals (R-3.25–R-3.28). The
qualified marks on the organization list and the person's organizations section were already
computed and shown by slice 11 (decision record 0047). The contract names the three update tags
(`acceptSWUTerms`, `acceptTWUTerms`, `qualifyServiceAreas`) on `PUT /api/organizations/{id}`, and
says nothing about their values, answers or refusals. These are the choices made.

## Decisions

**What is met is the service's answer.** The full record now carries `swuRequirements`
(`{ twoMembers, allCapabilities, termsAccepted }`), computed over active members only by
`sprintWithUsRequirements` in `backend/src/rules/organizations.ts`; `qualifiesForSprintWithUs` is
that rule with all three met. The Team With Us tab reads `serviceAreas` and `acceptedTWUTerms`
from the same record. The tabs never compute qualification themselves, so they cannot disagree
with the badges and the list's marks.

**Accepting terms** (`{ tag: "acceptSWUTerms" }` or `"acceptTWUTerms"`, no value) is allowed to
the owner and to a service administrator, as the contract's 401 says of the route (`401 {
permissions }` to anyone else). It records the moment once. A second acceptance is `400 { errors:
["The Sprint With Us terms and conditions have already been accepted for this organization."] }`
(or Team With Us), and the first moment stands. An archived organization is refused `400`. The
terms page offers Accept to the owner alone, and only while the terms are unaccepted
(`offersProgramTermsAcceptance`). An administrator reads the terms with no Accept (R-3.27's note).
An organization administrator who is not the owner sees the same, with "Only the organization’s
owner can accept them." The qualification tab's link reads "Read and accept …" exactly where the
terms page will offer Accept.

**After accepting**, the terms page goes to the management page's matching qualification tab,
where the date is shown (`organization-swu-terms-accepted-on`, and the twu equivalent). A refusal,
which happens when a page was opened before another acceptance, is shown on the terms page in an
alert, worded as the service gave it.

**The terms text** is the body of the service's fixed page at the same slug
(`/content/sprint-with-us-terms-and-conditions`, `/content/team-with-us-terms-and-conditions`). It
is rendered by the one formatted-text renderer inside `organization-terms-body`. While it is being
read, or if it cannot be, the panel holds only its heading. The terms page is shown to whoever may
read the organization (R-3.3). Everyone else, and anyone at an archived organization, gets the
missing page, as the management page does.

**Service areas** (`{ tag: "qualifyServiceAreas", value: [<key>, …] }`) are set by a service
administrator alone (`401 { permissions }` otherwise, the owner included). The value is a list of
the five kept keys (`FULL_STACK_DEVELOPER`, …). It is taken once each, in the service's order, and
an empty list approves none. Anything else is `400`, and nothing changes. The kept
`twuOrganizationServiceAreas` rows for the organization are deleted and the selection written in
one transaction, so saving replaces the earlier approvals entirely (R-3.28). The screen names each
area as the catalogue story does, in sentence case ("Full stack developer"), and values each
checkbox with a kebab-case id (`full-stack-developer`) that becomes the service's key only when
the selection is saved (decision record 0054).

**The editing state** follows the service-areas-editing story: the tab shows only the heading and
the checkbox group, with Save and Cancel. Saving returns to the tab with the new approvals listed.
A refusal keeps the form open and shows the reason.

## What would reverse it

- The old application's own refusal wording, if recovered: it is one function,
  `termsAlreadyAccepted`.
- A ruling that organization administrators may accept program terms: widen
  `mayAcceptProgramTerms` and `offersProgramTermsAcceptance` together.
