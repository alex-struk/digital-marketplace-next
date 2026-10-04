# The Code With Us Proposals tab and read-only proposal page

`opportunity-cwu-edit` names a `proposals_tab` and `proposal-cwu-view` names its own route, but
the design catalogue draws only the tab's link (design/DESIGN.md, gap 14) and not what the tab
holds. This record covers the choices that fill that gap. A later reader would otherwise have to
work them out from the code.

**When the tab appears.** It appears on every opportunity that is no longer a draft, the same
stage at which the Addenda tab appears. It does not appear only once the opportunity has closed.
R-1.31 and R-2.25 say the opportunity's author and administrators are *refused* until closure,
so the tab is there to be opened, and it says why it shows nothing.

**What it shows.** The tab asks the service, `GET /api/proposals/code-with-us?opportunity=`,
and shows whichever of these the answer calls for:

- Before closure the service refuses (401). The tab shows an info alert,
  `opportunity-proposals-withheld-message`, that names the moment proposals close. It shows no
  proponent.
- After closure it shows a table, `opportunity-proposals-table`, with one
  `opportunity-proposal-row` for each proposal put forward. Each row gives the proponent's name
  (`proposal-proponent-name`, as DESIGN.md asks other domains to reuse), its status
  (`proposal-status`) and when it was submitted. The name links (`opportunity-proposal-link`) to
  the proposal's read-only page.
- If nothing was put forward, it says so in words (`opportunity-proposals-empty`).

The service already leaves drafts out, and the screen also drops any draft it is sent.
Withdrawn proposals are shown to administrators because the service sends them (the R-2.25
note).

**The read-only page.** `/opportunities/code-with-us/:opportunityId/proposals/:proposalId`
follows the `proposal-cwu-view` default story: the proponent's name as the heading, then the
opportunity, the status, the submission time, the proposal ID, the score, the printable-copy
link, and the Proposal and History tabs. The service decides who may read the proposal, under
the one rule `mayReadProposal`. A refusal looks the same as a proposal that is not there, and so
does a proposal reached through another opportunity's address: both show the missing page. The
score is shown only when the service includes it. A vendor also gets a link to the proposal's
manage page.

Entering a score, awarding and disqualifying belong to the evaluation criteria (R-2.26 to
R-2.33), so this page does not offer them yet.
