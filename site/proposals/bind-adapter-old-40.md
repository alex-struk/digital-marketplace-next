| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T08:18:48.540Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the Sprint With Us proposal Team step in `tests/adapters/old/index.ts` so it no longer gets stuck on "2.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the Sprint With Us proposal Team step in `tests/adapters/old/index.ts` so it no longer gets stuck on "2. Team". I checked the new logic in the browser, running the same page calls as the adapter on the live target. I couldn't compile it or run it through the Playwright suite: the workspace has no `node_modules`, and running `node` to check the syntax needed an approval nobody was here to give. I read the changed code over instead.

**What was wrong (R-2.7, R-2.19).** The adapter decided which phase a control belonged to by where things sat on the screen: everything between one phase's name and the next phase's name. That misread a one-phase opportunity whose "Implementation" was already open, so the adder was never found. On a two-phase opportunity it went wrong once opening the first phase pushed the second one down. The phase names also fold and unfold when pressed, so a wrong reading could fold a phase shut.

**How it works now.** A phase's section is found in the page's structure rather than by position. It is the nearest block around the phase's name that shows a "Phase Dates" before it takes in any other phase's name. On the live page, an open "Implementation" block holds its name, dates, team table and "Add Team Member(s)". Folded, the block holds the name alone and the rest is hidden. The adapter uses this for four things:
- deciding whether a phase is open, and pressing a folded name only once, then waiting until its "Phase Dates" shows;
- finding that phase's "Add Team Member(s)";
- checking whether a member is already in that phase's table;
- finding the member's row to tick Scrum Master.

The old position-based code is still used on the opportunity-creation phases step and the evaluator panel. Neither was in the findings, so I left them alone.

**Moving on to Pricing (R-2.11, R-2.37).** `set_phase_proposed_cost` now presses the form's own "Next" (plain pressable text, not a button) until a phase cost box shows. It only uses the step menu first when the form is already past step 3. Each press has a time limit, and a disabled or unpressable "Next" fails at once, naming the step, instead of waiting out the test. Ticking Scrum Master no longer clicks a radio that is already ticked. If the member is given with `scrumMaster: true`, `add_phase_team_member` ticks that member's radio after adding them and presses nothing else on the Team step. I could not see the test code, so I don't know exactly where the earlier run stopped. These changes cover every route I could find to it being left on "2. Team".

**What I checked live**, signed in through the organization-owner persona's session route:
- **One-phase opportunity** (the seeded open one): "Implementation" reads as open from the start, folded after one press and open again after a second. Its adder is found inside it. After adding Charlie Placeholder and ticking Scrum Master, one "Next" landed on "3. Pricing" with "Implementation Cost*".
- **Two-phase opportunity:** there is no seeded one, so I created one through the API as the administrator: "Two-phase SWU for adapter binding", a copy of the seeded open one with a Proof of Concept phase added.
  - Both names started folded, and each opened after one press.
  - Each phase's adder and each phase's own row for Charlie were found correctly: Charlie's radio was ticked in both tables, with Blake's left clear.
  - One "Next" showed "Proof of Concept Cost*", "Implementation Cost*" and "Total Proposed Cost".

Afterwards I cancelled that opportunity, since the administrator isn't allowed to delete it. It is still on the target at id `799340d3-9e63-46a7-894a-72b1af5db511`. Someone may want to remove it or reset the target if other stages count opportunities.

`bindings.yaml` needed no change: every member involved was already, and correctly, listed as `bound`. Every page route this work touched opened on the target. I changed nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every surface action and observation that R-2.7, R-2.11, R-2.19 and R-2.37 need on the Sprint With Us proposal flow, and nothing else? The runner escalated this because the rebind loop limit was passed, so I read its account first. That account decided the ruling. Over the numbered sends, each failure was further along the flow than the one before: no organization chooser, then no Implementation box, then the References tab, then the Submit Proposal dialog, then the empty closing dialog on the way to export, then the Team phase folding, then the Team-to-Pricing move. The last sends, R-2.7 sends 4-5, R-2.11 send 5, R-2.19 sends 6-7 and R-2.37 send 6, all describe the same two problems. First, the adapter found a phase's section by screen position (phaseBand/inBand), so it misread an open one-phase 'Implementation', and once an earlier phase opened on a two-phase opportunity the positions shifted. Second, the adapter never left '2. Team' once the member was on the phase with Scrum Master ticked. So the loop limit went past because the work kept making progress, not because a stage cannot produce what G3 asks for. That is not a reason to escalate to the pipeline owner. The diff does what those sends asked for, and no more. probePhaseSection finds a phase's section as the nearest ancestor of the phase-name leaf that holds a visible 'Phase Dates' before it takes in another phase's name, and does not use position. teamPhaseOpen, teamPhaseAdder, onSwuPhase and the Scrum Master row lookup all use it, so a phase name is pressed only while its own section shows no Phase Dates. add_phase_team_member ticks Scrum Master when the input sets scrumMaster: true, including when the member is already on the phase, and does not click a radio that is already ticked. After that it presses nothing more on the Team step. set_phase_proposed_cost moves forward with the form's own 'Next' until a phase cost box shows. It uses the step menu only from a step past 3, and a disabled or unpressable Next fails at once, naming the step, instead of running into the timeout. The change is limited to tests/adapters/old/index.ts. bindings.yaml does not change, and no gate, criterion or test is touched. The position-based helper stays on the opportunity-creation phases step and the evaluator panel, which none of these findings named. Leaving it there keeps the change within its evidence. The runner's typecheck exited 2, but it reported no errors under adapters/old/. The only errors were 2 in adapters/new/, which this proposal does not answer for. The author checked the new logic by hand against the live target on a one-phase and a two-phase opportunity. The Playwright suite was not run. It runs at verify, and verify is where these four criteria are confirmed or not. Note for whoever owns the target: the author created a two-phase opportunity through the API to check the adapter, then cancelled it because the administrator cannot delete it. It is still on the target at 799340d3-9e63-46a7-894a-72b1af5db511, and a reset will clear it if another stage counts opportunities. What would change this ruling: if verify fails again at '2. Team' or the Team-to-Pricing move, the problem is not position any more. It would point to the Team step's page structure, and would need archaeology evidence of that structure rather than another rebind, so the next ruling on it should address the request to archaeology.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `40be4714979fd24d0b936387a6934e4902df23b5`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
