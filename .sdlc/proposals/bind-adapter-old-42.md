---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I added the three missing Sprint With Us proposal-form observations to the `old` adapter: `phase_team_sections`, `phase_requirements` and `cost_errors`."
opened: 2026-09-29T11:29:06.387Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the three missing Sprint With Us proposal-form observations to the `old` adapter: `phase_team_sections`, `phase_requirements` and `cost_errors`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the three missing Sprint With Us proposal-form observations to the `old` adapter: `phase_team_sections`, `phase_requirements` and `cost_errors`. All three are listed as bound in `tests/adapters/old/bindings.yaml`. I kept every earlier binding as it was and changed nothing outside `tests/adapters/old/`. I couldn't run the TypeScript type checker because the session wasn't allowed to execute it, so the new code has not been compiled. I checked the new code by running its page-side logic by hand in the browser. The adapter itself has not been run through a test.

**How I reached the form.** I signed in through the session route as the organization owner and opened the create route for the seeded open opportunity, `swuOpenWithSubmittedProposal`. It resolved, and I pressed "Next" to reach "2. Team", then chose Northern Pines Digital Ltd. That opportunity has only an Implementation phase. To check the case with several phases, I signed in as the administrator and used the target's own API to create one throwaway published opportunity, "Adapter probe two-phase SWU", with Proof of Concept and Implementation phases. It is still on the running target, and nothing in the adapter depends on it. The seed is reapplied before every test, which should remove it.

**`phase_team_sections`** goes to the Team step and lists each phase that has a section, one per line in the form's order, calling "Proof of Concept" "Prototype" as the contract asks. The sections only appear once an organization is chosen. So if none has been chosen, it picks the first one the chooser offers, which is what the existing team actions already do. If the chooser offers the vendor no organization, it returns empty: the step was reached and shows no section. On the probe opportunity it read "Prototype" then "Implementation".

**`phase_requirements`** unfolds every phase and returns one line per phase: `<phase> | complete|incomplete | <missing capabilities, comma-separated>`. The page gives these states no text or accessible name, so the binding reads them from what is drawn:
- **A phase:** its icon turns orange when the phase is incomplete and stays the same colour as the phase name when it is complete. I confirmed both: nobody named, or a pending member named, gives the orange icon; the one confirmed member alone, who holds both capabilities, gives the plain one.
- **A capability:** one the team doesn't hold has a grey hollow circle, the same grey as its words. One it holds has a green check beside darker words.

So the rule is: a mark in a different colour from its words is the one that means something. On the probe opportunity, with one member on Implementation only, it read Prototype as incomplete and missing Frontend Development, and Implementation as complete with nothing missing.

**`cost_errors`** goes to "3. Pricing" if it isn't already there and reads the message printed directly under each cost box. Each line is `<phase>: <message>`, or `total: <message>` for the "Total Proposed Cost" box, and it returns empty when no message is showing. Both wordings match the contract: "Please enter a Proposed Cost less than or equal to 100,000." and "The proposed cost exceeds the maximum budget for this opportunity."

When I filled two cost boxes back to back with no pause, the first box's message didn't appear. With a pause after each box, it did. The existing cost action already pauses after every fill, so tests that use it should see the message. A test that enters costs some other way may miss the first one.

Every route I opened resolved on the target.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every action and observation the contract names on the Sprint With Us proposal form, and nothing else? Ruling: approve. The three added observations, phase_team_sections, phase_requirements and cost_errors, are the ones spec/contract/surface.yaml names for proposal-swu-create, and each binding returns what the contract describes. phase_team_sections gives the offered phases in form order, with the form's 'Proof of Concept' mapped to the contract's 'Prototype'. phase_requirements gives each phase as complete or incomplete plus the required capabilities the team does not hold. cost_errors gives each message against its phase or 'total'. The bindings only navigate and read. Inferring complete or incomplete from icon colour is still observation: the contract says the form shows this state only with a warning icon and checked capabilities, and gives it no text. No binding decides whether a test passes. The diff touches only tests/adapters/old/, and nothing under tests/acceptance changed. The runner's typecheck failed, but it reported no diagnostics under adapters/old/; both are in adapters/new/, which this proposal does not answer for. The narrowing of 'read' after nothing() is sound because nothing() returns never. No acceptance test calls these observations yet, since their test_id is null, and the clause of R-2.19 they serve is already recorded as owed by derive-tests, so no condition is needed. What would change the ruling: a calibration showing a binding misreads the page, such as the colour rule inverting a phase's state, or the first cost message not appearing when a test enters costs without a pause. That would come back as an adapter-wrong finding.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `628d233b4a33ac8621924494175821d5b4637d9f`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
