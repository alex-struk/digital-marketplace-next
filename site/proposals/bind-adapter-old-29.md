| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T19:19:20.384Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether tests/adapters/old/index.ts now binds every surface action and observation on old for the nine criteria sent back past the rebind limit, and nothing else. I approve. Each edit carries out the third send from runner:bind-adapter's account, which is what decided this ruling. R-2.4: delete_proposal on a non-draft proposal with no Delete now returns instead of throwing, so the test reaches its status check. R-5.16: add, remove, chair and save on a locked panel now return and leave the lock for panel_locked_after_consensus. R-2.28: the scoring actions return when the tab shows the wrong-stage notice, and the notice stays on screen for wrong_stage_error. R-2.10 and R-2.20: the terms actions now close the 'Review Terms and Conditions' dialog, and save_draft and step navigation clear any dialog left open first. R-2.17: choose_organization reads back which organization is chosen, clears a pre-selected one it was not asked for, and throws a refusal if that one cannot be cleared. add_team_member_for_resource and set_hourly_rate now return when no organization is chosen, leaving that for the test to read, instead of throwing. R-2.22: save_changes applies the named organization before saving. R-2.31: price_score reads the PRICE column of the opportunity's Proposals table, as send 3 asked. Nothing outside the adapter moves, and bindings.yaml is unchanged. The runner's typecheck exits 2, but it lists no diagnostics under adapters/old/; both errors are in adapters/new/, which this proposal does not answer for. The new per-test state is safe because tests/fixtures/index.ts creates the adapter fresh for each test after resetting the target to its seed, which also wipes the probe Team With Us opportunity the agent created. Two points are noted and do not block. First, Backspace clearing the Organization chooser was never observed on old; if it fails, the adapter throws a refusal naming the organization left chosen, so the failure would be visible rather than silent. Second, attachment_address can now confirm a save dialog left open, which gives an observation a side effect. It is scoped to a publish the test's own add_attachment started, and add_attachment now completes that save itself, so the fallback should rarely fire. Calibration against old decides whether these hold. Any of these would change the ruling: calibration shows the chooser is not cleared, the proposal proceeding under 'Northern Pines Digital Ltd.' again, or attachment_address publishing changes the test never asked for.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `c80173efdb3ea8e2a42bc0740ee883342d6848f5`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
