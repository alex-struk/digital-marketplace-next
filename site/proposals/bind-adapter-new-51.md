| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T20:11:21.608Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** The runner's typecheck still has to confirm them: the session wasn't allowed to run `tsc`, so I couldn't compile the edit myself.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've made both changes the ruling asked for, and nothing else. The runner's typecheck still has to confirm them: the session wasn't allowed to run `tsc`, so I couldn't compile the edit myself.

**1. The panel member chooser no longer decides the test's outcome.** In `evaluationPanelPage`, `pick()` used to throw an Error when the named person was not public sector staff. Now, when the chooser doesn't offer the person (a vendor, or any account it doesn't list), it logs a `noteRefusal` naming who the chooser does offer and the person's account type, chooses nobody, and returns `false`. `add_panel_member` then moves on to the next person in its input without ticking a Chair box for the one refused. That leaves `non_public_sector_member_error`, `panel_member_row` or the save to decide the result, the same way the file already treats a locked panel. `unbound` is still thrown, but only when the input names nobody the adapter can resolve to a person (the existing `nameOf` path). I checked the edit against the surrounding types by eye only.

**2. `opportunity-twu-edit.publish` is checked and stays bound.** Signed in as the administrator through the identity provider, I saved a Team With Us draft from `/opportunities/team-with-us/create` with only a title. Its management screen offered "Edit", "Publish" and "Delete" in its "Opportunity actions". Pressing "Publish" opened a dialog headed "Publish this opportunity?" with "Cancel" and "Publish opportunity". The adapter's existing confirm pattern already matches "Publish opportunity". I cancelled the dialog and deleted the draft, so nothing was left on the target. What I saw is now in the page's comment in `bindings.yaml`, and `index.ts` is unchanged for this member.

**The criteria the calibration couldn't test:**
- **R-7.17, R-1.13, R-1.15:** these unbound reasons came from an older version of the adapter. `opportunity-swu-view.scope_section` and `opportunity-twu-create.add_resource` are already bound in the accepted version, so I didn't rebind them.
- **R-5.16:** `evaluation-panel-swu.add_panel_member` is already bound. The `opportunity-swu-create.set_evaluation_panel` failure it quoted came from input whose second panel member has no name the chooser could offer. That case correctly stays unbound.
- **`enter_question_score` (also cited under R-5.16):** still unbound. Signed in as the administrator, I opened `/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create` with the seeded opportunity whose evaluation has already begun and its untouched proposal. It answers "Page not found". That opportunity's management screen offers only Summary, Opportunity, Addenda, History and Evaluation panel, and `?tab=evaluation` falls back to the Summary.

The routes that don't resolve are unchanged from the accepted version: the proposal, organization and evaluation screens, `/proposals` and `/organizations` all answer "Page not found" on this build. I wrote no secret or environment value into any file or into this entry.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new adapter bind every surface action and observation it can, and nothing else? Approve. The runner's own typecheck passed on this revision (exit 0, no diagnostics under adapters/new/), and nothing under tests/acceptance or any protected path changed. Both instructions owed from bind-adapter-new-50 are carried out. evaluationPanelPage pick() now logs a refusal through noteRefusal, naming the chooser's offered names and the person's account type, and returns false instead of throwing. add_panel_member then moves on to the next person, so non_public_sector_member_error, panel_member_row or the save decides the result. Unbound is still raised only when the input names nobody nameOf can resolve. opportunity-twu-edit.publish was walked on a Team With Us draft as the administrator, and the 'Publish this opportunity?' / 'Publish opportunity' dialog it saw is recorded in the bindings.yaml page comment. The newly bound members (edit_details, submit_for_review, publish, delete_opportunity, edit_evaluation_panel, opportunity_tab, evaluation_panel_tab, start_date, completion_date, evaluation_question_fields, and the evaluation-panel-swu/twu pages) are navigation, form entry and text reads. A control that is not offered is logged as a refusal rather than turned into a verdict. rows() only puts what the screen shows into the locked table's wording, and the throw on a disabled control matches an established pattern in the file. The remaining unbound reasons name a section or route the running build does not offer, which is a real reason. An assertion inside the adapter, or any change to the acceptance tests, would change this ruling.

**Conditions:**
- condition-met bind-adapter-new-50#1: tests/adapters/new/index.ts evaluationPanelPage pick() calls noteRefusal with the chooser's offered names and the seeded account type, chooses nobody and returns false; addPanelMember skips to the next person on false, and unbound is kept only in nameOf for input that resolves to no person
- condition-met bind-adapter-new-50#2: a Team With Us draft walked as the administrator offers 'Publish', which opens 'Publish this opportunity?' with 'Publish opportunity'; recorded in the opportunity-twu-edit page comment in tests/adapters/new/bindings.yaml, where publish stays bound and is driven by twuManage.act with PROGRAM_CONFIRM

### Runner-owned typecheck evidence

Proposal revision: `989bfdd40e8876a0ffbcee6044935ef1521e54cb`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
