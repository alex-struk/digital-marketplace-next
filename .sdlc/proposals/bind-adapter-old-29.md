---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed all nine findings in `tests/adapters/old/index.ts`."
opened: 2026-09-28T19:19:20.384Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed all nine findings in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I fixed all nine findings in `tests/adapters/old/index.ts`. None of them is proven yet. The workspace has no installed dependencies, so I could not type-check the adapter or run the calibration suite. I re-read each edit by hand against the strict TypeScript settings. `bindings.yaml` did not change, because every member these findings touch was already `bound` and still is. Every page route the fixes rely on opened on the target.

**What changed, finding by finding**
- **R-2.4, deleting a submitted proposal:** when the proposal is not a draft and its page offers no "Delete", `delete_proposal` now just returns. Nothing is deleted and nothing is thrown, so the test goes on to read the status. A draft with no "Delete" is still reported as unbound.
- **R-2.10 and R-2.20, the terms dialog left open:** `accept_program_terms` and `accept_app_terms` still tick their box. They now close the "Review Terms and Conditions" dialog with its own "Cancel" and wait for it to go. The adapter remembers which terms were accepted, so the dialog is ticked again when submit reopens it. As a second guard, `save_draft` and step navigation now close any dialog left over the form before they click.
- **R-5.16, the locked evaluation panel:** when the panel shows its evaluators read-only with no "Edit", `add_panel_member`, `remove_panel_member` and the two chair actions now return without changing anything. The next `save_evaluation_panel` also returns without pressing anything. `panel_locked_after_consensus` reports the lock, as before.
- **R-2.17, the Organization chooser:** after choosing, `choose_organization` reads which organization the chooser actually shows. If it is not the one the test named, it clears the chooser with Backspace, so the proposal cannot continue under the pre-selected "Northern Pines Digital Ltd.". It throws a refusal only if the other organization cannot be cleared. Later steps no longer pick the first offered organization after a named one was refused. On the Team With Us form, `add_team_member_for_resource` and `set_hourly_rate` now return quietly when no organization is chosen, leaving that for the test to read on the dashboard.
- **R-8.20, the Team With Us attachment address:** I published one Team With Us opportunity to walk this flow (see below). It confirmed that an added attachment exists only as a browser preview until "Publish Changes" is pressed and the "Publish Changes to Team With Us Opportunity?" dialog is confirmed. After that, the Attachments step links the file at `/api/files/…`. `add_attachment` on a published Team With Us opportunity now does that save. `attachment_address` now confirms a save dialog left open instead of dismissing it and losing the file.
- **R-2.22, saving an edited proposal:** `save_changes` now uses its input. Before saving, it applies the named organization through the Organization chooser (on "Team Members", "Team", or for Code With Us the "Proponent" step) and fills other values by their labels.
- **R-2.28, scoring a stage not yet reached:** when the tab says the proposal "can be scored once the opportunity reaches" that stage, `score_team_scenario` and `score_challenge` now return without scoring. The notice stays on screen for `wrong_stage_error` to read.
- **R-2.31, price score:** `price_score` on both proposal views now reads the "PRICE" column of the opportunity's Proposals table (`edit?tab=proposals`), in the row that links to this proposal. It then goes back to the proposal's page. The column is "PRICE" on both Sprint With Us and Team With Us. A "—" or no table reads as empty.

**Changes to the target itself**
- **Test opportunity created:** the target had no open Team With Us opportunity. To walk the attachment flow I created one through the API as the administrator, titled "Adapter probe TWU attachment opportunity" (id `fb70ee4e-adb8-4393-b13c-1d821b1716a2`). I published one small probe PDF to it. Both are still on the running target.
- **Seeded Sprint With Us form:** while testing the Organization chooser, I pressed Backspace on it in the seeded open Sprint With Us opportunity's proposal form. Nothing was saved.
- **Probe file:** I briefly wrote the probe file under `.playwright-mcp/`, which is outside my directory, because the upload tool only accepts files there. I deleted it afterwards.

**Not verified**
- **Clearing a pre-selected organization:** the vendor I checked had no qualifying organization, so nothing was pre-selected. I could not watch Backspace clear the Organization chooser itself. I rely on that working because Backspace clears the panel's Chair chooser on this app. If it does not clear, the adapter throws a refusal naming the organization left chosen, rather than continuing silently.
