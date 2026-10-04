| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T05:59:54.764Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** Two caveats first: I couldn't type-check or run the adapter, and I couldn't parse `bindings.yaml`, because `tsc`, `node`, `python` and in-place `sed` all needed approval in this session.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've answered all three conditions. Two caveats first: I couldn't type-check or run the adapter, and I couldn't parse `bindings.yaml`, because `tsc`, `node`, `python` and in-place `sed` all needed approval in this session. Everything below was checked against the running target in the browser, not by running the suite.

**Condition 1 (R-1.31, R-2.25): Code With Us Proposals section.** I opened `/opportunities/code-with-us/<id>/edit?tab=proposals` as the administrator on two seeded opportunities:
- On the published one, the section shows only "Proposals are not shown until the opportunity closes …" and has no rows.
- On the lapsed one with three proposals, it lists them in a table.

`opportunityCwuEdit.proposalsTab()` now returns empty when the section shows that message and lists nothing; otherwise it returns the section text as before. Its entry in `bindings.yaml` was an outdated `unbound` saying the section did not exist; I changed it to `bound`.

**Condition 2 (R-2.19): Sprint With Us publish wrote into a phase.** As the administrator I confirmed the Sprint With Us opportunity form has no start or completion date of its own. "Key dates" holds only the proposal deadline and assignment date, and every Start/Completion date box sits inside a phase group. That is why the old code put the opportunity's `completionDate` into the Prototype phase's box. For Sprint With Us, `publish` (and save draft / submit for review) now skips top-level `startDate`, `completionDate` and `endDate`, logs that it did so, and leaves the dates to `addPhase`. The Team With Us form does have its own dates and is unchanged.

**Condition 3 (R-2.7 to R-2.24): the Sprint With Us and Team With Us proposal pages.** All four pages are served on this build. I walked them as the organization owner on the seeded open Sprint With Us opportunity, and as the owner of the unqualified organization on the seeded closed Team With Us opportunity. No Team With Us opportunity is seeded open, but the form is fully drawn on the closed one. A vendor who already holds a proposal is sent to it instead.
- **Bound:** every member of `proposal-swu-create` and `proposal-twu-create`, and every member of both edit pages except `scoresheet_tab`. Controls are found by their visible labels: the "Organization (required)" chooser, "Team member to add to the <phase> phase" / "to resource N", "Scrum master: <name>, <phase> phase", "Proposed cost for the <phase> phase", "Hourly rate for <name>", "Response to question N", references, attachments, and the "Proposal actions" and "Save choices" groups. Return formats follow the old binding, e.g. `<name> — Pending`, `<Phase> | complete|incomplete | <missing capabilities>`, and `<Phase>: <msg>` / `total: <msg>`.
- **Still unbound:** `scoresheet_tab` on both edit pages. The vendor's proposal screen has only "Proposal" and "History" sections on the awarded Sprint With Us proposal, a Team With Us proposal under review, the closed Team With Us proposal and a fresh draft.
- **Empty rather than unbound:** score, rank and anonymous name, because the vendor's screen shows none of them in any state I walked.
- **Departure from the brief:** a disabled Submit on these forms is recorded as a refusal, with the reasons the page gives, rather than thrown. The contract says submit stays unavailable while a phase is incomplete or a cost is over budget, so tests read that outcome. The reasons appear in `fieldError`, `capabilityGapError` and `submissionRefusal`.
- **References:** each reference has Name, Email address and Phone number. A `company` key throws `unbound` because there is no box for it.
- `proposal-cwu-view.open` now simply navigates and leaves the reading to the test. The administrator sees the proposal there. The R-2.24 failure quoted a "Page not found" from a different address (port 4800). I did not bind that page's other members, since the condition named only `open`.

**What I changed on the target while walking:**
- I saved a draft on the open Sprint With Us opportunity, edited it, had its submit refused, then deleted it, so that opportunity is back to how it was seeded.
- I opened Edit on the seeded Team With Us proposal and switched it to the other organization. Saving was refused, and a reload showed the proposal unchanged.
- I opened Withdraw's confirmation and pressed "Keep proposal".

**`bindings.yaml`:** each superseded `unbound` reason on these four pages is now a comment under its `bound` value. The file is too large to rewrite without running a script, and comments don't change what it means.

**Left unchanged:** the shared "walked signed in" reason text, and the comment at the top of the adapter, still say the Sprint With Us and Team With Us proposal forms answer "Page not found". That is no longer true, and the text is still quoted by members on other pages: the proposal view and export pages, and the other `proposal-cwu-view` members. I left them because no condition named them. They are worth looking at in the next binding run.

Every route these conditions name resolved on the target. Nothing was deferred, and I wrote only under `tests/adapters/new/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does this adapter bind every action and observation on new, and nothing else, with every unbound reason true? Ruling: return. The three earlier requests are answered. opportunityCwuEdit.proposalsTab() reads empty while the section withholds proposals. Sprint With Us publish no longer writes opportunity-level dates into a phase group. The four Sprint With Us / Team With Us proposal pages are bound to visible labels, with navigation and locators only. Nothing under tests/acceptance changed, and the runner's typecheck passed. It goes back because some unbound reasons are not true and the author knows it. The author opened /opportunities/code-with-us/:opportunityId/proposals/:proposalId as the administrator and recorded that it shows the proponent, Status, Submitted, Proposal ID, Score, 'Printable copy' and the sections Proposal and History. Yet proposal-cwu-view's proposal_identifier, proposal_tab, history_tab, proponent, score, rank and export_link stay unbound with a reason saying the page answers 'Page not found'. The shared signed-in reason (index.ts around line 300, NOBODY_SIGNS_IN and the comment above it) still says the proposal screens answer 'Page not found', and other pages' unbound members quote it. Unbound reasons have to describe what the target serves now. Binding those members, or giving each a true reason, and correcting the shared text would turn this into an approval. build-slice-15#4 (the read-only Sprint With Us / Team With Us proposal pages) belongs to build and is not settled here.

**Conditions:**
- proposal-cwu-view: bind proposal_identifier, proposal_tab, history_tab, proponent, score, rank and export_link against /opportunities/code-with-us/:opportunityId/proposals/:proposalId, which the walk recorded as showing the administrator the proponent, Status, Submitted, Proposal ID, Score, 'Printable copy' and the Proposal and History sections. Leave a member unbound only with a reason that names what that screen actually lacks for it (enter_score, award_proposal and disqualify_proposal included). Update tests/adapters/new/bindings.yaml to match.
- tests/adapters/new/index.ts: rewrite the shared signed-in reason (NOBODY_SIGNS_IN and its comment around line 300) and the comment near line 8244, so they no longer say the Sprint With Us / Team With Us proposal forms or the Code With Us proposal view answer 'Page not found'. Re-walk every page whose unbound members quote that text (the Sprint With Us / Team With Us proposal view and export pages, among others) and give each member a reason that is true on the current build.
- tests/adapters/new/bindings.yaml: on proposal-swu-create and proposal-twu-create, record that submit_proposal and the terms actions fill any empty 'Response to question N' with placeholder text, and that the team actions choose the first offered organization when the test names none. Those defaults change what is submitted and should be visible to whoever reads the bindings.

### Runner-owned typecheck evidence

Proposal revision: `ba4a365610ae0804e4eff474b002ea2624dd4412`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
