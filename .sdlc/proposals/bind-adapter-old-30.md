---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I bound all 16 new date observations in `tests/adapters/old/index.ts` and named each one `bound` in `tests/adapters/old/bindings.yaml`."
opened: 2026-09-28T19:48:19.815Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I bound all 16 new date observations in `tests/adapters/old/index.ts` and named each one `bound` in `tests/adapters/old/bindings.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I bound all 16 new date observations in `tests/adapters/old/index.ts` and named each one `bound` in `tests/adapters/old/bindings.yaml`. For the nine calibration findings, the fixes were already in the adapter when I opened it, so I checked them rather than rewriting them. Nothing was type-checked or run: `tests/` has no `node_modules`, and the commands to install or syntax-check it weren't approved in this session.

**New date observations.** I read each one off the running target, signed in as the administrator, using the seeded published Code With Us opportunity and the seeded closed Sprint With Us and Team With Us ones.
- **Public pages (`opportunity-*-view`)** show each date above its label, as the page writes it (for example "Jun 14, 2030"). The labels are "Assignment Date" and "Work Start Date" on Code With Us, "Assignment Date" on Sprint With Us, and "Contract Award Date" and "Contract Start Date" on Team With Us. Team With Us shows its completion date only in the "Key Dates" list on its Details tab ("Contract Completion Date (Anticipated) Jan 26, 2027"). That list is the fallback for all three of its dates, and the reader reopens the Details tab if an earlier action left another tab open.
- **Management pages (`opportunity-*-edit`)** hold the dates in the Opportunity tab's wizard, as YYYY-MM-DD in date boxes. They are on step "3. Details" for Code With Us and "2. Overview" for the other two. The Code With Us labels are "Proposal Deadline", "Assignment Date", "Proposed Start Date" and "Completion Date"; Team With Us uses the "Contract …" labels. Sprint With Us only holds a deadline and an assignment date; its start and completion dates belong to its phases, which the contract doesn't ask for here.
- The reader walks the wizard until it finds the labelled box. It returns empty for a record shown as "Not Found" or a reader not offered the Opportunity tab. It reports unbound only if the tab opens with no wizard on it. I matched the labels exactly, so "Phase Completion Date" isn't mistaken for "Completion Date", and confirmed on the target that they resolve to the seeded values.

**Calibration findings.** The line numbers in the findings point to an earlier version of the file. In the current one, each point is already handled:
- **R-2.4:** `delete_proposal` with no "Delete" on a proposal that isn't a draft returns without throwing. I confirmed on the target that a submitted proposal's page carries "Proposal Status", which is the value the adapter uses to tell a draft from a submitted proposal.
- **R-2.10 / R-2.20:** the terms actions close the dialog with its own "Cancel", and `save_draft` and step navigation close any dialog left open first. On the open seeded Code With Us opportunity, as a vendor, I opened "Review Terms and Conditions", ticked both boxes and pressed "Cancel". The dialog left nothing on the page. Nothing was saved or submitted.
- **R-5.16:** a read-only panel with no "Edit" makes `add_panel_member` and `save_evaluation_panel` return without changing anything, and `panel_locked_after_consensus` reports the lock.
- **R-2.17:** `choose_organization` reads back which organization is chosen. If the named one isn't offered, it clears the pre-selected one so the proposal doesn't go ahead under another organization. When no organization can be chosen, `add_team_member_for_resource` returns instead of throwing.
- **R-8.20:** the Team With Us `add_attachment` saves through "Publish Changes" and confirms the dialog. `attachment_address` confirms any save dialog still open instead of discarding it.
- **R-2.22:** `save_changes` enters the organization it is given through the Organization chooser before saving.
- **R-2.28:** both scoring actions return without scoring when the tab says the proposal can be scored once the opportunity reaches that stage. `wrong_stage_error` returns that notice.
- **R-2.31:** `price_score` reads the "Price" column of the opportunity's Proposals table, in the row that links to the proposal.

I couldn't walk the Team With Us proposal-creation flow end to end: the target has no open Team With Us opportunity, and I didn't create one. The Team With Us terms-dialog behaviour is inferred from the Code With Us dialog, since all three programmes use the same code for it.

Every route in `surface.yaml` that I opened resolved on the target, and nothing was left unbound. I changed only `tests/adapters/old/index.ts` and `tests/adapters/old/bindings.yaml`.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether this adapter binds every surface action and observation on old, and nothing else, now that bind-adapter has hit its rebind loop limit on R-2.4, R-2.10, R-2.17, R-2.20, R-2.22, R-2.28, R-2.31 and R-5.16. I approve. What decided it is that the escalation's account is about the loop count, not about something the adapter still gets wrong. Each third send asked for a specific behaviour, and the current adapter has each one. On a submitted proposal, deleteProposal returns without error once 'Proposal Status' is not a draft (index.ts:4270-4281). saveChanges now applies the named organization through the Organization chooser before saving, instead of discarding its input (index.ts:4244-4246). chooseProposalOrganization reads back which organization is chosen and clears a pre-selected one the test did not name (index.ts:3693-3712). priceScore and wrongStageError are bound to their own readers. The new diff is small and matches its purpose. It adds 16 date observations across the public and management pages of the three programmes, each with the label seen on the target, and names each one `bound` in bindings.yaml. It changes nothing else, and it supplies the observations the open R-1.9 missing-test condition names. The runner's type check reports no diagnostics under adapters/old/. The two it does report are in adapters/new/, which this proposal does not answer for. The authoring agent could not run the suite, and it inferred the Team With Us terms-dialog behaviour from the Code With Us dialog. calibrate's next run tests both of those, so neither needs a further round here. I would return this if calibration shows that any of the eight escalated criteria still fails on an adapter fault: a thrown refusal, a dialog left open, or a wrong organization chosen. I would also return it if the new date readers resolve to values other than the seeded ones.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `3849ea28a91934d1ea9a78c1934c5c632bb1ed7d`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
