# 0055 · Code With Us proposals: how they are kept, answered with and changed (slice 14)

- Status: accepted for the build (slice 14)
- Date: 2026-10-03

## Context

Slice 14 builds the Code With Us proposal's create and manage pages and the vendor's dashboard
(R-2.1–R-2.4, R-2.7, R-2.9, R-2.11–R-2.15, R-2.23–R-2.25, R-1.31), the read rule for files attached
to proposals (R-8.20, R-8.22, R-8.31), and answers for the proponent half of the addendum and
cancellation notices that slice 9 built (R-1.35, R-1.36). The contract describes
`/api/proposals/code-with-us[/{id}]` with untyped bodies and no answers or refusals. These are the
choices made.

## Decisions

**Where they are kept.** The kept tables `cwuProposals`, `cwuProponents` and `cwuProposalStatuses`
(migration `20260930000002`), and a new `cwuProposalAttachments (proposal, file)` (migration
`20261004000001`), the old application's table, cascading with its proposal. A proposal's state is
its newest history row; it is submitted at the newest `SUBMITTED` row. An individual proponent is a
`cwuProponents` row the proposal owns; an organization is named by identifier. The store is
`backend/src/proposals/prisma-cwu-proposal.store.ts`; the rules, shared with the screens, are
`backend/src/rules/proposals.ts`.

**What the service answers with.** Every route answers with the proposal: `id`, `program`,
`createdAt`, `updatedAt`, `createdBy` and `updatedBy` (`{ id, name }`), `status`, `submittedAt`,
`opportunity` (`{ id, title, status, proposalDeadline, reward }`), `proposalText`,
`additionalComments`, `proponent` (`{ tag: "individual", value: { legalName, email, phone, street1,
street2, city, region, mailCode, country } }` or `{ tag: "organization", value: { id, legalName }
}`), `attachments` (file records), `anonymousProponentName`, and `history` (newest first, to
everyone who may read the proposal, R-2.9). `score` is present to staff, and to the vendor only once
the proposal is awarded or not awarded (R-2.32's rule, which slice 16 relies on).

**What it takes.** `POST` takes `opportunity`, the content and a `status` of `DRAFT` (the default)
or `SUBMITTED` (R-2.7). `PUT` takes `edit` (the content, keeping whatever the value leaves out, so a
request naming only `attachments` saves the rest as it stands — surface `file-attach-by-identifier`),
`submit` and `withdraw`; `score`, `award` and `disqualify` are answered "not available" until slice
16. `DELETE` removes a draft. `GET` lists, for a vendor, the proposals they wrote and those of
organizations they own or administer (`?opportunity=` narrows it to one); for the opportunity's
author and administrators, with `?opportunity=`, its proposals once it has closed.

**Who may.** One rule, `mayReadProposal`, decides who reads a proposal in every program: its author,
a vendor who owns or administers its organization, an administrator once the opportunity has closed
(withdrawn included, drafts never), and the opportunity's author once it has closed (neither drafts
nor withdrawn). The same people manage it if they are vendors. **Closed** means the opportunity has
moved past publication, or its deadline (4:00 p.m. Pacific on the day) has passed while it is
published or cancelled: the application has no closing hook yet (slice 16), so the deadline itself
is what closes it for this purpose. A file attached to a proposal is readable by whoever may read
the proposal, through `ProposalAttachmentReadPath`, which applies `mayReadProposal` to Code With Us
and Team With Us attachments alike (R-8.20); nothing is recorded against the file.

**Refusals**, in decision record 0010's shape:

- `401` — starting a proposal as anyone but a vendor who has accepted the terms at some point
  (R-2.1); submitting without the current terms accepted (R-2.3, "Accept the Code With Us terms
  …"); changing a proposal one may read but not manage; an opportunity's proposals asked for
  before it has closed, or by staff who did not write it (R-1.31, R-2.25).
- `404` — a proposal the person may not read, answered as one that does not exist (R-2.24).
- `400` — a second proposal by the same vendor, `{ errors: ["You already have a proposal for this
  opportunity."], existingProposalId }` (R-2.2); a submission or a draft put forward after the
  deadline, or any proposal on an opportunity that is not published, "This opportunity is no longer
  accepting proposals." (R-2.15, R-2.23); an organization named on another proposal for the same
  opportunity, `{ errors: ["organization: Please select a different organization."],
  existingOrganizationProposal: { proposalId } }` (R-2.11); a file the person may not read,
  "attachments: You can only attach a file you are permitted to read." (R-8.22), checked in a draft
  too (R-2.12); content, each problem a line beginning with the field's name in the request
  (`legalName`, `email`, `phone`, `street1`, `street2`, `city`, `region`, `mailCode`, `country`,
  `organization`, `proposalText`, `additionalComments`) (R-2.13, R-2.14); an organization that does
  not exist, or is archived on a submission, "organization: Choose an organization that exists and
  is active" (R-2.14); deleting anything but a draft (R-2.4).

**Terms.** The terms dialog asks for both sets of terms; confirming it records the service's terms
on the person's account (`acceptTerms`) and then submits. The service checks only that the current
acceptance stands, since there is nowhere in the kept schema a Code With Us terms acceptance is
recorded.

**Detached files** (R-8.31). Taking a file off a proposal or deleting the proposal removes the pair,
and with it the way of reading the file. `FileStore.detached()` names every stored file no record
refers to any longer — no current opportunity version, proposal, history note, picture, logo or page
body — so its content can be disposed of under the retention rule. It is a query, not a view, so
that nothing that empties tables meets an object it cannot empty.

## Departures from the stories

- The withdraw dialog does not say "You and the administrators will be sent a withdrawal notice":
  that notice is R-2.36's, which slice 16 builds, and the dialog would otherwise promise mail that
  is not sent.
- Start a proposal reads "View your proposal" when the vendor already holds one, and leads there
  (R-2.2); the test id is the same.
- The manage page shows the action bar of the design's table and lets the service refuse what the
  moment does not allow (an edit of a proposal under review, a submission after the deadline), as
  the stories' refused states do.

## What would reverse it

A closing hook (slice 16) makes "closed" the opportunity's state alone; `hasClosedToProposals` is
the one place to change. A recovered record of Code With Us terms acceptance would add a second
`acceptTerms`-like step to the dialog's confirmation.
