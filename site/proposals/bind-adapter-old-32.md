| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T22:42:08.929Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I brought the "old" adapter up to the current contract.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I brought the "old" adapter up to the current contract. All 8 members it was missing are now bound. The nine calibration findings were already fixed in the file you gave me, so I changed no code for them. I could not type-check the adapter or run any tests: there is no `node_modules` in the workspace and I wasn't allowed to run Node. I checked the new code by reading it and by trying the same requests and screens by hand in the browser.

**What I added** (in `tests/adapters/old/index.ts`, named in `bindings.yaml` exactly as the contract spells them):
- **`create_evaluation_by_request`, `evaluation_created`, `creation_refusal_message`** (both the Sprint With Us and Team With Us request pages). The action sends a new draft evaluation to the proponent's list of evaluations. The service decides the evaluator from whoever is signed in, so the `:userId` in the route is not sent. I tried this signed in as the staff account on the seeded proposals that already have an evaluation begun. The service refused with 409 and the messages the contract expects ("You already have a team question evaluation for this proposal." / "…resource question…"). `evaluation_created` returns the service's reply when it accepts and nothing when it refuses. `creation_refusal_message` returns the refusal's text and nothing when the request went through.
- **`history_entries`** (proposal-swu-view and proposal-twu-view). Signed in as the administrator, I opened the History tab on the seeded proposals past consensus. It is a table of entry type, note and created (a date and time with the person's name underneath). Each row becomes one line: kind, note ("—" becomes empty), who, when, newest first. Before the opportunity reaches the stage after consensus, the tab only says the history "will be available once the opportunity reaches the Code Challenge" and has no table. In that case it returns nothing rather than reporting unbound, because the tab was reached and genuinely has no entries.

**The calibration findings.** The line numbers they cite (for example `index.ts:4067` for delete) point to an older version of the file. The current file already handles each one:
- **R-2.4:** `delete_proposal` returns quietly when a non-draft proposal offers no "Delete". I confirmed a submitted proposal shows only "Proposal Status: Under Review" and no controls.
- **R-2.10 and R-2.20:** the terms actions close the "Review Terms and Conditions" dialog with its own Cancel. Save Draft and step navigation also close any dialog still open. I filled a real Team With Us proposal, ticked both boxes and pressed Cancel: the dialog closed completely and nothing was left covering the form.
- **R-2.17:**
  - The organization chooser reads back what it selected. If the named organization isn't offered, it clears the selection instead of carrying on under another organization.
  - When no organization is selected, adding a team member returns without throwing.
  - On the probe form the chooser started empty, not pre-set to Northern Pines.
- **R-2.22:** `save_changes` enters the given organization through the chooser before saving.
- **R-2.28:** a scoring action refused because the opportunity hasn't reached that stage returns without scoring and keeps the notice for `wrong_stage_error`.
- **R-2.31:** `price_score` reads the "Price" column of the opportunity's Proposals table, or the exported proposal for readers who can't see that table.
- **R-5.16:** a read-only panel is left for `panel_locked_after_consensus` to report; adding a member and saving return without changing anything.
- **R-8.20:** the Team With Us attachment is saved by confirming the save dialog, not discarding it. I did it by hand as the administrator: Actions → Edit, step 7 Attachments, add a file, Publish Changes, confirm. The step then linked the file under `/api/files/`.

**Routes:** every route I opened resolved on the target. Nothing is reported unbound.

**Left behind on the target:** to reach an open Team With Us form I created and published a throwaway opportunity as the administrator, titled "Probe open TWU for adapter binding" (id fd827652-daa5-48e7-b879-bc0ce10a8342), and attached a small probe PDF to it. I did not submit the Team With Us proposal I filled in. The service refused my test evaluation requests, so the seeded evaluations are unchanged. If the target isn't reset between runs, that opportunity will show among open opportunities.

I changed nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every surface action and observation, and nothing else, after bind-adapter hit its rebind limit on R-2.4, R-2.10, R-2.17, R-2.20, R-2.22, R-2.28, R-2.31 and R-5.16? Ruling: approve. The part of runner:bind-adapter's account that decided it is each item's third send. The first two sends were about controls the adapter could not find. By the third send, each criterion was asking for one specific behaviour change, and each of those behaviours is present in tests/adapters/old/index.ts on this branch. I read the code rather than taking the proposal's word for it. delete_proposal (4524-4535) catches a missing Delete and returns without error when Proposal Status is not draft. chooseProposalOrganization (3797-3839) reads back which organization the chooser shows, clears a wrong pre-selected one, and records organizationWithheld instead of letting the proposal go ahead under another organization. proposal-twu-edit save_changes (4493-4496) calls applyProposalEdits before saving, so the organization it is given is applied. addPanelMember (2913-2914) returns early when the panel is not editable, which leaves the lock for panel_locked_after_consensus to report. wrongStageError (807-812) falls back to the stored stage refusal. price_score uses proposalPrice (4732 onward), which falls back to the Price column of the opportunity's Proposals table. The line numbers the calibration findings cite point to an older layout of the file, as the proposal says. The new code in the diff is additions only and stays inside tests/adapters/old: history_entries on both proposal views, and create_evaluation_by_request, evaluation_created and creation_refusal_message on both individual-evaluation request pages. bindings.yaml marks exactly those eight members bound, and those are the members that the open missing-test conditions on R-5.3 and R-5.32 name. The runner's typecheck found no diagnostics under adapters/old; the failing exit comes from 2 diagnostics in adapters/new, which this proposal does not answer for. This escalation is about how many rounds it took, not about the pipeline, so there is nothing to send to the pipeline owner. The adapter itself creates only a draft evaluation over the API, and in the proposal's own trials the service refused it with 409. What would change the ruling: a verify run in which one of these eight criteria fails on old because an adapter member throws or reads the wrong screen, rather than because the old application behaved differently. That would reopen the member in question. Housekeeping, owed by nobody: while working by hand, the agent created and published a probe Team With Us opportunity on the oracle ('Probe open TWU for adapter binding', fd827652-daa5-48e7-b879-bc0ce10a8342). If the oracle is not reset between runs, it will appear among open opportunities.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `aa0f8416df2e3d8e8977c1aa6fcc6b30ebfc3df1`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
