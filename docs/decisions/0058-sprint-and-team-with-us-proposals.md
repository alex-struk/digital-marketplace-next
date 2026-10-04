# 0058 · Sprint With Us and Team With Us proposals, and attachments on those programs' opportunities (slice 15)

- Status: accepted for the build (slice 15)
- Date: 2026-10-03
- Builds on: 0055 (both records of that number), 0057

## Context

Slice 15 builds the Sprint With Us and Team With Us proposal create and manage pages and their
service (R-2.7, R-2.9, R-2.10, R-2.11, R-2.16 to R-2.22, R-2.24), the Proposals tab of those
programs' manage pages (R-1.31, R-2.25), and attachments on their opportunities with one read rule
for files on opportunities and proposals in all three programs (R-8.19, R-8.20, R-8.25; 0055,
"Attachments on Sprint With Us and Team With Us opportunities"). The contract describes
`/api/proposals/{sprint-with-us,team-with-us}[/{id}]` with untyped bodies and no answers. These are
the choices made, so a later reader need not work them out from the code.

## Decisions

**Where they are kept.** The kept tables: `swuProposals`, `swuProposalStatuses`,
`swuProposalPhases` with `swuProposalTeamMembers` (person, phase, scrum master),
`swuProposalReferences` and `swuTeamQuestionResponses` for Sprint With Us; `twuProposals`,
`twuProposalStatuses`, `twuProposalMember` (person, resource, hourly rate) and
`twuResourceQuestionResponses` for Team With Us. A proposal's state is its newest history row. Its
team, answers, references and attachments are written afresh on every save. The store is
`backend/src/proposals/prisma-team-proposal.store.ts`; the rules, shared with the screens, are
`backend/src/rules/team-proposals.ts`.

**One restored table besides 0055's two.** The surface puts `add_attachment` on
`proposal-swu-create`, and the slice delivers "attachments on both proposal forms", but the kept
baseline has no table for a Sprint With Us proposal's files (Team With Us's,
`twuProposalAttachments`, came with the seed in 0012). Migration
`20261005000001_sprint_and_team_attachments` restores `swuProposalAttachments (proposal, file)` beside
0055's `swuOpportunityAttachments` and `twuOpportunityAttachments (opportunityVersion, file)`, each
only where absent, keyed and cascading as their Code With Us counterparts are. The name follows the
old application's pattern for the other two programs' tables and is the rebuild's own under 0007's
rule, as 0055 says of its two.

**The request and the answer** use the old service's names. Sprint With Us: `organization`,
`inceptionPhase` / `prototypePhase` / `implementationPhase` each `{ members: [{ member, scrumMaster }],
proposedCost }` (a phase left out is absent), `teamQuestionResponses: [{ order, response }]`,
`references: [{ name, company, phone, email }]`, `attachments`. Team With Us: `organization`,
`team: [{ member, resource, hourlyRate }]`, `resourceQuestionResponses`, `attachments`. Creating takes
`opportunity` and a `status` of `DRAFT` (the default) or `SUBMITTED`, nothing else (R-2.7). `PUT`
takes `edit` (keeping what the value leaves out, so `file-attach-by-identifier` works), `submit` and
`withdraw`; evaluation's tags are answered "not available" until their slices. The answer carries
the same fields with each person as `{ id, name }`, each Team With Us resource as `{ id,
serviceArea, targetAllocation }`, the opportunity's `totalMaxBudget` or `maxBudget`,
`totalProposedCost`, attachments as file records, and the history, newest first, to everyone who may
read the proposal (R-2.9). No score is answered yet.

**Who may.** The same rules as Code With Us (0055, Code With Us proposals): `mayStartProposal`,
`mayReadProposal`, `mayManageProposal`, `mayListOpportunityProposals`, one per vendor and one per
organization per opportunity with a pointer to the existing proposal (R-2.2, R-2.11). Staff are
refused an opportunity's proposals until it has closed — its deadline passed, until slice 16's
closing hook — and never see a draft (R-1.31, R-2.25). A submitted proposal's organization stays
until it is withdrawn (R-2.22), refused as `organization: Organization cannot be changed once the
proposal has been submitted`.

**What a submission is judged by** (`swuProposalProblems`, `twuProposalProblems`), each problem a
line naming its field as the request names it (`implementationPhase.members`,
`prototypePhase.proposedCost`, `totalProposedCost`, `team.2.hourlyRate`,
`teamQuestionResponses.0.response`, `references.1.email`):

- No organization: only "An organization must be specified before submitting." (R-2.16). An
  organization that is not qualified for the program at that moment: only "This organization is not
  qualified to submit proposals to Sprint With Us opportunities." (or Team With Us). Qualification is
  computed afresh on every submission, by the same rules as the organization's own badges.
- Sprint With Us: "This opportunity requires this phase." / "does not require this phase."; "Please
  select at least one team member."; "You may only specify a single scrum master."; "Please select a
  scrum master for this phase." where nobody is; "User is not an active member of the organization.";
  a phase cost over its maximum "Please enter a Proposed Cost less than or equal to N."; the total over
  the opportunity's "The proposed cost exceeds the maximum budget for this opportunity."; capabilities
  compared across all phases and reported against `team` (R-2.18, R-2.19).
- Team With Us: "The selected organization does not satisfy this opportunity's service areas.";
  "Name at least one team member."; per member "User is not an active member of the organization.",
  "Please select unique team members.", "Please enter an hourly rate of at least $1.", "The specified
  resource could not be found." — a resource anywhere, not necessarily this opportunity's (R-2.17,
  R-2.18, R-2.20).
- Answers: "No matching opportunity question." against an answer's numbering, and "Response must be
  between 1 and N words long." against its wording; an unanswered question counts as empty (R-2.21).

A draft is judged by none of this (R-2.12), except what could not be stored: files the person may
not read (R-8.22), people with no account, Team With Us resources that do not exist or a person
named twice — and the Team With Us budget ceiling, which R-2.10 asks for on every create and edit.

**A Sprint With Us phase naming one person twice** is not refused by validation: the kept schema
keys a phase's team by person, and the old service answered such a request with its storage error
(surface proposal-team-request). The service answers it `503` with "The proposal could not be saved:
a phase names the same person more than once." The form never offers a person twice in a phase.

**The Team With Us ceiling (R-2.10).** Each person's hourly rate, at their resource's target
allocation, for 7.5 hours of every working day (Monday to Friday) from the contract's start date to
its completion date, both included, added up and compared with the maximum budget. With no
completion date nothing can be counted and nothing is refused. The 7.5-hour day is this build's
reading; the criterion says only "across the opportunity's contract period". `HOURS_PER_DAY` is the
one place to change it.

**A phase with no recorded maximum.** The Sprint With Us opportunity form asks only for a total
maximum budget (slice 10, 0045); an inception or prototype phase made through it is kept with a
maximum of 0 and the implementation phase with the rest. A maximum of 0 is read as none recorded:
that phase's cost is held to the opportunity's total alone. A phase that carries a real maximum —
the seeded ones — is held to it. Phase capabilities (`swuPhaseCapabilities`) are likewise only what
the seed or a request records; the opportunity form does not ask for them, and an edit through the
form now keeps the ones a phase had instead of dropping them.

**One read rule for attachments (R-8.20).** `OpportunityAttachmentReadPath` replaces the Code With
Us-only read path: a file on the current version of an opportunity in any program is readable by
whoever `mayReadOpportunity` allows — anyone once published, its author and administrators before
(R-8.25, applied to Team With Us as the plan rules). `ProposalAttachmentReadPath` now covers Sprint
With Us proposals beside the other two, by `mayReadProposal`. Uploads record no read access on the
file itself (R-8.19). A Sprint With Us or Team With Us opportunity carries attachments on create and
on every edit as Code With Us's does, and `FileStore.detached()` counts the three new tables.

## The screens

- **Create** (`/opportunities/<program>/:id/proposals/create`): a vendor who already holds a
  proposal is sent to it (R-2.2). The organization is pre-chosen when the vendor acts for exactly
  one, as the story draws a chosen one; choosing another empties the team. Its qualification is said
  at once (`proposal-unqualified-organization-notice`), and for Team With Us the service areas it
  lacks (`proposal-service-area-error`).
- **Sprint With Us team.** One section for each of the opportunity's phases and no other, in phase
  order. **Departure from the stories:** the scrum master is a radio choice per phase
  (`proposal-scrum-master` on each radio), not a checkbox per person, because R-2.19 says "chosen as
  a single choice among that phase's members" and the surface says two cannot be chosen on the form.
  Each section says whether its team meets its requirements and lists each required capability as
  held or not; a pending member is marked (`proposal-pending-team-member`). Cost errors and the total
  are shown as they are typed; Submit proposal is unavailable while any phase is incomplete or any
  cost is over its budget, and a sentence beside it says why.
- **Team With Us team.** One section per resource; each person offered is an active member not
  already named anywhere on the proposal; each has an hourly rate field; the cost over the contract
  and any excess over the maximum budget are shown as they are typed.
- **Submission** checks the form by the service's own rules first, then asks for both sets of terms
  in the dialog, worded for the program, and records the service's terms on the account.
- **Manage** (`…/proposals/:proposalId/edit`): Proposal and History tabs, the action bar by state,
  the organization shown as text (`proposal-organization`), and while editing a submitted proposal
  the organization field says it cannot change until the proposal is withdrawn — but stays open, as
  the surface says, so the service's refusal is shown against it. There is no Scoresheet tab yet:
  scores are slice 16's onward.
- **Proposals tab** on both programs' manage pages, once the opportunity is no longer a draft, as on
  Code With Us (0057). Rows name the organization and are not links: those programs' read-only
  proposal pages are the evaluation slices'.
- **Start a proposal** on both programs' public pages, for a vendor while proposals are accepted.
- **The vendor's dashboard** lists all three programs' proposals together, each row naming its
  program and leading to its own manage page.
- **Opportunity forms.** The attachment control is enabled on both programs' create pages and
  Opportunity tabs (on a saved opportunity a chosen file is attached at once, 0033); the public
  pages list the attachments.

## What would reverse it

- The old application's own formula for the Team With Us ceiling, if recovered: change
  `twuContractCost`.
- A ruling that a Sprint With Us phase twice-named should be refused or quietly de-duplicated:
  `phaseNamesSomeoneTwice` is the one place.
- The opportunity form gaining per-phase budgets and required capabilities (a design change, not
  this stage's): the 0-means-none reading then stops mattering.
