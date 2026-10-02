---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-02T20:11:21.566Z"
cost: 0.9097347999999998
turns: 32
session: "9a827309-9812-4b1a-9da5-221b1046aea2"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've made both changes the ruling asked for, and nothing else. The runner's typecheck still has to confirm them: the session wasn't allowed to run `tsc`, so I couldn't compile the edit myself.

**1. The panel member chooser no longer decides the test's outcome.** In `evaluationPanelPage`, `pick()` used to throw an Error when the named person was not public sector staff. Now, when the chooser doesn't offer the person (a vendor, or any account it doesn't list), it logs a `noteRefusal` naming who the chooser does offer and the person's account type, chooses nobody, and returns `false`. `add_panel_member` then moves on to the next person in its input without ticking a Chair box for the one refused. That leaves `non_public_sector_member_error`, `panel_member_row` or the save to decide the result, the same way the file already treats a locked panel. `unbound` is still thrown, but only when the input names nobody the adapter can resolve to a person (the existing `nameOf` path). I checked the edit against the surrounding types by eye only.

**2. `opportunity-twu-edit.publish` is checked and stays bound.** Signed in as the administrator through the identity provider, I saved a Team With Us draft from `/opportunities/team-with-us/create` with only a title. Its management screen offered "Edit", "Publish" and "Delete" in its "Opportunity actions". Pressing "Publish" opened a dialog headed "Publish this opportunity?" with "Cancel" and "Publish opportunity". The adapter's existing confirm pattern already matches "Publish opportunity". I cancelled the dialog and deleted the draft, so nothing was left on the target. What I saw is now in the page's comment in `bindings.yaml`, and `index.ts` is unchanged for this member.

**The criteria the calibration couldn't test:**
- **R-7.17, R-1.13, R-1.15:** these unbound reasons came from an older version of the adapter. `opportunity-swu-view.scope_section` and `opportunity-twu-create.add_resource` are already bound in the accepted version, so I didn't rebind them.
- **R-5.16:** `evaluation-panel-swu.add_panel_member` is already bound. The `opportunity-swu-create.set_evaluation_panel` failure it quoted came from input whose second panel member has no name the chooser could offer. That case correctly stays unbound.
- **`enter_question_score` (also cited under R-5.16):** still unbound. Signed in as the administrator, I opened `/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create` with the seeded opportunity whose evaluation has already begun and its untouched proposal. It answers "Page not found". That opportunity's management screen offers only Summary, Opportunity, Addenda, History and Evaluation panel, and `?tab=evaluation` falls back to the Summary.

The routes that don't resolve are unchanged from the accepted version: the proposal, organization and evaluation screens, `/proposals` and `/organizations` all answer "Page not found" on this build. I wrote no secret or environment value into any file or into this entry.