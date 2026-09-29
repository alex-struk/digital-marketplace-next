---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "R-2.19 (v3) now has a full test file, and its entry is gone from `tests/acceptance/not-testable.yaml`."
opened: 2026-09-29T11:32:41.233Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** R-2.19 (v3) now has a full test file, and its entry is gone from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-2.19 (v3) now has a full test file, and its entry is gone from `tests/acceptance/not-testable.yaml`. That was the only criterion in this run, and nothing was left untestable. I couldn't run the type check: running `tsc` needed an approval this unattended session couldn't get. Nothing has been run against a target either, so the file is unchecked by compiler or runner.

**What changed.** The contract came back with the observations the earlier entry asked for:
- on the create form, `phase_team_sections`, `phase_requirements` and `cost_errors`;
- on the team request, a statement that it sends a phase the opportunity lacks exactly as given, and a `refusal_by_field` that says which phase a message is about.

I rewrote `tests/acceptance/proposals/R-2.19.spec.ts` to use them. It is now twelve tests, all titled with the criterion's statement plus the case they cover. They all use one opportunity with a Prototype phase needing Frontend Development and an Implementation phase needing Backend Development, each with its own budget, and no Inception phase.

New or tightened assertions:
- **Form sections:** the form offers team sections for exactly Prototype and then Implementation.
- **Extra phase:** a team sent by request for Inception is refused with "does not require this phase" against Inception.
- **Missing phase:** a request that leaves out Prototype is refused with "requires this phase" against Prototype.
- **Empty phase team:** the form shows Prototype incomplete and Implementation complete, and no proposal is created.
- **Capabilities in the wrong phases:** the form shows both phases incomplete. Prototype names Frontend Development as missing and Implementation names Backend Development.
- **Phase cost over budget:** the Prototype cost carries "less than or equal to 200,000", and nothing is shown against Implementation or the total.
- **Total cost over budget:** the total carries "exceeds the maximum budget for this opportunity", and nothing is shown against either phase.
- **Two scrum masters:** the refusal is now checked to say "single scrum master" against Implementation.
- **Complete proposal:** the form shows both phases complete and no cost errors before it submits.

The single-choice scrum master, no-scrum-master and unconfirmed-member tests are the same as before.

**Two design choices:**
- The contract says the form's submit control stays unavailable while any phase or cost is at fault. So refusal tests fill the form, read what it shows, try to submit (tolerating the control being unavailable), and then check that no proposal identifier appeared.
- The contract doesn't say whether these list observations come back as JSON or as text. The test reads either: a JSON array or object, or one entry per line. It decides "incomplete" from the words "incomplete" or "not complete", or from a complete flag set to false. If an adapter reports completeness some other way, those checks will fail even though the form behaves correctly.

**Still missing from the surface:** nothing blocks this criterion. The contract gives no exact wording, and no guarantee of a phase in the refusal, for a phase with no scrum master or with an unconfirmed member. Those two tests therefore only assert that the service refused, not where it located the refusal. If the contract later states those messages, the tests can be tightened.

I changed nothing outside `tests/acceptance`.
