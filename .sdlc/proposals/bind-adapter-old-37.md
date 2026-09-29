---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "It's written but not run: there's no `node_modules` here to run the suite, and Node wasn't allowed to run, so I couldn't even syntax-check the file."
opened: 2026-09-29T04:21:08.711Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** It's written but not run: there's no `node_modules` here to run the suite, and Node wasn't allowed to run, so I couldn't even syntax-check the file.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've rewritten `add_phase_team_member` on the Sprint With Us proposal create page so it opens every phase section before looking for the adder. It's written but not run: there's no `node_modules` here to run the suite, and Node wasn't allowed to run, so I couldn't even syntax-check the file. I did replay the core logic by hand in the browser against the live target, and it worked.

**What was wrong.** With only one phase, its section is open and "Add Team Member(s)" is visible, which is the only case the old code had been checked against. With two or more phases, each phase shows only as its bare name, folded. The team table, "Phase Dates" and the adder appear only after you click the name. The old code looked for exact visible text straight away, found nothing, and threw `unbound`. The finding was right.

**How I confirmed it.** None of the seeded opportunities has more than one phase. So I published a throwaway Sprint With Us opportunity as the administrator ("Probe multi-phase SWU for team step", Proof of Concept then Implementation). I then signed in as the organization owner, opened its proposal create page, went to the Team step and chose Northern Pines.
- Both phases showed only their names.
- Clicking each name revealed its own "Add Team Member(s)".
- The Implementation adder opened the member dialog (Blake, Charlie, Dana, and Quinn marked Pending). Adding Blake put Blake in the Implementation table.
- The adder has no button or link role; it's clickable text. So the adapter finds it by any visible text containing "Add Team Member", limited to the part of the step between that phase's name and the next phase's name.

That opportunity is still published on the target at http://localhost:4300. Whoever manages the target may want to remove it.

**What changed in `tests/adapters/old/index.ts`:**
- **Opening the phases.** The adapter waits for the phase sections to render and clicks each folded phase name. It clicks only while that phase's adder isn't showing, because the name toggles the section open and shut. It then takes the adder inside the section for the requested phase, or the first phase if none is given.
- **When the phase doesn't exist.** A phase the opportunity doesn't have is still reported as refused.
- **The new unbound message.** It now says the adapter reached the Team step with an organization chosen and opened each phase by name (listing them), and still found no adder in that phase.
- **Scrum master and member choices.** Setting the scrum master and reading who can be added had the same blind spot, since a folded phase hides its table and adder. Both now open every phase first. The scrum master pick finds the member's row inside the named phase's section instead of guessing by position. The member-choices read remembers the last phase by name rather than by position.
- **A bug in a shared helper.** It works out where a phase's section starts and ends, but ignored phase names scrolled above the window when the page has no "Which phase do you want to start with?" chooser. On the Team step the first phase's name does scroll off (measured at -98px), which would have hidden that whole section. I changed only the no-chooser case. The opportunity create form, which has the chooser, behaves as before.

The same fix reaches `proposal-swu-edit.add_phase_team_member`, which goes through the same code once editing has started.

`bindings.yaml` needed no change: every member involved was already `bound`. No route in the surface failed to resolve this run. I didn't touch anything outside `tests/adapters/old/`, including the `tests/adapters/rebind.yaml` file next to it.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the rewritten proposal-swu-create.add_phase_team_member (with the scrum-master and team-member-choice reads) bind the Team step on old for opportunities with more than one phase, and nothing beyond it? Ruling: approve. The escalation was triggered only by R-2.19 being sent to bind-adapter 5 times against a rebind limit of 2. The five sends were successive, distinct layers of one long flow (capability chip, phase fields, publish landing, phase dates, and now the Team step's adder), each uncovered only once the previous one was fixed. That is progress, not a pipeline defect, so there is nothing here to stop the run for. The diff answers send 5 exactly: it opens every folded phase section (pressing a phase name only while its adder is hidden, because the name toggles the section), looks for the adder by partial text within the named phase's part of the page (the author confirmed on a published Proof of Concept + Implementation opportunity that the adder has no button or link role), and reports unbound only after every section is open. The scrum-master and member-choice reads had the same blind spot and get the same treatment, and the last-phase record is now kept by name instead of by index. The phaseBand change (below = -Infinity when no starting-phase chooser exists) only affects pages without that chooser. The opportunity Phases step, its other caller, requires the chooser (addPhase throws without it), so that path is unchanged. bindings.yaml is untouched, and nothing outside tests/adapters/old/ moves. The author could not syntax-check the file, but the runner's typecheck reports zero diagnostics under adapters/old/; its exit code 2 comes from two diagnostics in adapters/new/, which this proposal does not answer for. STANDARD tier, no platform article touched. What would change the ruling: a verify run in which add_phase_team_member still throws unbound on a multi-phase opportunity, or a regression in opportunity-swu-create.add_phase traceable to the phaseBand change. Either comes back as an ordinary return. The throwaway 'Probe multi-phase SWU for team step' opportunity left published on the old target at localhost:4300 should be removed by whoever manages the target; it is not this stage's work.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `fe012faf47377282d68003bad4f2535974e9e922`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
