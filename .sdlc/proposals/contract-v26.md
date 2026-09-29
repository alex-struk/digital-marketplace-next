---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I couldn't prove the oracle starts: this session's shell refused the `oracle up` command."
opened: 2026-09-29T11:22:10.234Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I couldn't prove the oracle starts: this session's shell refused the `oracle up` command.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've added what the Sprint With Us proposal criterion (R-2.19) was missing to `spec/contract/surface.yaml`. I couldn't prove the oracle starts: this session's shell refused the `oracle up` command.

The contract was already mature from earlier runs. So this run only did the one owed item: R-2.19's test writer couldn't read which phases the proposal form offers, or which phase or cost an error belongs to. I changed nothing else. `personas.yaml`, `openapi.yaml`, `observables.yaml`, the seed files, the seed manifest and `.sdlc/oracle/compose.yml` are all untouched. The pages, sign-in methods and seed are as the last approved contract left them: the application's own session sign-in route for the oracle, a sandbox identity provider for the new target, and seeds 000 to 015 with their manifest.

**Three observations added to the Sprint With Us proposal create page (`proposal-swu-create`).** They are read from the old application's form and phase components.
- **`phase_team_sections`**: the phases the form offers a team section for, in order. The form shows a section for each phase the opportunity has and no other, and Implementation is always there.
- **`phase_requirements`**: for each offered phase, whether the form counts its team as complete, plus the required capabilities the team doesn't yet hold. A section is incomplete when it names nobody, names someone whose membership is still pending, or leaves a required capability unheld. The form marks it with a warning icon and keeps Submit disabled. The description also records two things the form doesn't check:
  - It ignores the scrum master, so a phase with no scrum master reads complete here and is refused only by the service.
  - The scrum master is a single choice per phase, so a test can't pick two on this screen.
- **`cost_errors`**: each message shown against a phase's cost or the total, with the field it belongs to. A phase over budget reads "Please enter a Proposed Cost less than or equal to N." (N like "200,000"). A total over budget reads "The proposed cost exceeds the maximum budget for this opportunity." These appear as soon as a cost is entered, and Submit stays disabled while any is shown.

**Phase names.** The observations name phases Inception, Prototype and Implementation, as the criteria do. The old screen labels Prototype "Proof of Concept", on its section and on its cost field, so the old adapter has to translate that label. The contract says so.

**The service's own refusals.** I also filled in the optional part of the item, on the team-proposal request page (`proposal-team-request`):
- A request now sends exactly the phases the test gives. A phase the opportunity lacks is refused with "This opportunity does not require this phase." A missing phase is refused with "This opportunity requires this phase."
- The refusal description now says where each Sprint With Us message lands: the phase itself, its members, its cost, or the total cost.
- The service doesn't check capabilities per phase. It pools the capabilities of everyone named across all phases, compares them with everything any phase requires, and reports a shortfall against the team as a whole. That differs from the form's per-phase check, and the contract now says so in both places.

**One limit on "the form shows which phase is incomplete".** The old form never displays the service's phase messages. Its phase components drop them: the error-setting function returns the state unchanged. On the screen, "which phase" shows up only as the phase's incomplete mark and the cost messages under the cost fields. Service wording for phase problems can be read only through the request page.

**What I couldn't do:**
- **The oracle.** Every command using the pipeline tool's path was refused as "Contains simple_expansion", the variable couldn't be read by other means, and I found no copy of the CLI to call by its path. So `oracle up` never ran, and neither did `oracle down`. Nothing was started, so no container is left running. The files the oracle is built from are exactly what the last approved contract run left.
- **YAML check.** Python and Node weren't permitted either, so I couldn't parse `surface.yaml` after editing. The additions are comment lines and three `{ test_id: null }` entries at their neighbours' indentation.
- **Test IDs.** The three new observations carry `test_id: null` for the design gate to fill in, like the other recently added observations.

re-address missing-test/R-2.19 to derive-tests: proposal-swu-create now has phase_team_sections (the phases the form offers a team section for), phase_requirements (per-phase complete or incomplete, and the capabilities not yet held) and cost_errors (messages located by phase cost or total); proposal-team-request now sends a phase the opportunity lacks as given, and its refusal_by_field locates Sprint With Us messages by phase part and total cost, with capability shortfalls against the team as a whole.
