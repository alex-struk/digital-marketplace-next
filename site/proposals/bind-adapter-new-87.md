| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T18:16:08.454Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound the Sprint With Us and Team With Us proposal screens on the `new` target.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rebound the Sprint With Us and Team With Us proposal screens on the `new` target. Five of the six listed criteria now have bindings. The export page for R-2.30 is still not served by the application, so it is now reported `absent:` instead of `unbound:`. I couldn't type-check the adapter: TypeScript isn't installed here and fetching it wasn't permitted. I checked the members against `tests/generated/surface.d.ts` by hand and ran the same locator logic live on the target, but I did not run the acceptance suite.

**What changed on the target.** The old "unbound" reasons said the proposal screen had no stage tab or score control. The current build does have them. Under "Proposal sections" there is now a section for each stage:
- **Sprint With Us:** Team questions, Code challenge and Team scenario.
- **Team With Us:** Resource questions and Challenge.

Each section opens at its own address, shows the stage's score, and has an "Enter <stage> score" button under "<Stage> actions". The button is there while the opportunity is at that stage and the proposal is in it, and its label stays the same once a score is held.
- A stage not yet reached says "This proposal can be scored once the opportunity has reached …" and has no button.
- A stage already finished says "… is over."

The button opens a dialog with one score box, then "Cancel" and "Enter score". I drove it end to end as the administrator:
- A score of 150 kept the dialog open with a range message; 85 was accepted on the other staff member's code-challenge proposal (…a021…101).
- On the scored proposal …a032…101, I re-entered its existing 80%.
- Once a code challenge is scored, "Screen in to team scenario" appears. Screening in and out happen at once, with no dialog. I screened that proposal in and back out, so it ends as it started.

**Now bound:**
- **Sprint With Us proposal screen:** `score_code_challenge`, `score_team_scenario`, `screen_in_to_team_scenario`, `screen_out_from_team_scenario`, the three stage-tab readers, `wrong_stage_error` and `offered_score_actions`.
- **Team With Us proposal screen:** `score_challenge`, both stage-tab readers, `wrong_stage_error` and `offered_score_actions`.

They behave like the old target's binding:
- **Score actions:** they fill the dialog from the input. When the stage hasn't been reached they return without scoring and keep the notice for `wrong_stage_error`.
- **`offered_score_actions`:** returns the contract's action names one per line, or empty. It matched the contract's own examples live: …a030…101 offers none, …a030…102 offers `score_code_challenge`, …a038…101 none, …a032…102 `score_challenge`, and …a018…101 (past the team scenario) none.

**Still unbound on Team With Us:** `score_resource_questions`, `screen_in_to_challenge` and `screen_out_from_challenge`. I opened the seeded proposals at the questions consensus and at the challenge (a032, a033, a034, a035, a038) and went through their Resource questions and Challenge sections. Resource questions sends the reader to the opportunity's Consensus tab, where the panel agrees the scores. No section has a control for these three. Each reason says what was opened.

**Export pages, now `absent:`:**
- **Pages:** the proposal export pages (one proposal, and all proposals) for all three programs.
- **What I saw:** as the administrator, every one answers "Page not found". On Sprint With Us I also followed the proposal screen's own "Printable copy" link, and it lands on the same "Page not found".
- **Not walked this run:** walks as staff, vendors and signed out come from earlier runs' recorded reasons; I did not repeat them.
- **Run-time check:** the adapter decides when it runs. It throws `absent:` while the address answers "Page not found", and `unbound:` once it answers anything else.

**Decision for you:** the brief says a page is absent when nothing in the application leads to it. Here the application's own "Printable copy" link leads to it. I read that broken link as the application's gap, not something a binding could reach. Whoever rules the build should know that call was made here.

**Other routes:** every route I opened resolved, except those export routes. I didn't re-check the "complete" pages and the other pages that still use the older `unbound:` helper.

Both files are in `tests/adapters/new/`: `index.ts` and `bindings.yaml`. I changed nothing outside that folder. The bindings name only surface spellings, and no password or environment value is written anywhere.

## Ruling

**Verdict:** approve
**By:** runner:checks

Approved by the runner's checks, which policy.gates.G3.auto_approve lets settle bind-adapter proposals: the acceptance typecheck of cc0534291 is clean; no condition is open against it; no escalation stands on it; nothing outside tests/adapters changed.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `cc053429110580d8ffeb2b3047ea98c468687901`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
