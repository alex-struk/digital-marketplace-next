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
