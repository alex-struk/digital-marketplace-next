---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "On the running target, though, those fields don't exist yet, so the two R-2.19 form cases will now stop at `unbound:` instead of passing silently."
opened: 2026-10-04T07:33:34.105Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** On the running target, though, those fields don't exist yet, so the two R-2.19 form cases will now stop at `unbound:` instead of passing silently.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've fixed `opportunity-swu-create.add_phase` so it no longer drops a phase's maximum budget or required capabilities. On the running target, though, those fields don't exist yet, so the two R-2.19 form cases will now stop at `unbound:` instead of passing silently. The change is only in `addPhase` in `tests/adapters/new/index.ts` (around line 4856). Nothing else in the adapter changed, and neither did `bindings.yaml`.

**What the action does now.** It still fills the phase's start and completion dates as before. After that it looks inside that phase's own group, by label, each time it runs:
- **Budget:** if the input gives a budget (`maxBudget` and similar keys), it finds a box labelled "maximum budget" in the group and fills it.
- **Capabilities:** for each capability the input names, it finds the checkbox with that name in the group and ticks it if it isn't already ticked.
- **No box for a key:** it throws `unbound: opportunity-swu-create.add_phase — …`, naming the key, the value, the phase and the fields the group does offer. It never skips the key.
- **Disabled capability box:** it throws at once rather than retrying.

Because the lookup happens when the action runs, a later build that adds these fields with matching labels will be filled with no new binding run. This follows the old binding: it filled a phase's budget and capabilities, and refused any key it had no field for.

**What the target shows.** I signed in as the administrator through the identity provider and opened `/opportunities/sprint-with-us/create`. I added the prototype and inception phases. Each of the three phase groups (inception, prototype, implementation) has only "Start date (required)", "Completion date (required)" and, for the added phases, a "Remove … phase" button. None has a phase budget box or capability checkboxes. The only budget is the opportunity-wide "Total maximum budget" under "Budget and skills". I ran the new lookups against the live prototype-phase group: they found no budget box and no "Frontend Development" checkbox, and they listed the group's fields as just the two dates. So until the application adds these fields, R-2.19's "phase incomplete for a missing capability" and "phase cost over its budget" cases end at an `unbound:` naming what is missing. They can't pass or fail on the application's merits yet, but they no longer pass or fail on a half-filled form.

I left `add_phase` as `bound` in `bindings.yaml` because the action itself is reachable and fills its dates. Only the budget and capability keys are refused, and only while the form doesn't offer them.

**Not verified:** the workspace has no TypeScript compiler, so I couldn't type-check the file. The new code reuses helpers that are already in the file and follows the same patterns as the code around it.

All of the requested change is done; none of it is deferred. No page's route failed to resolve during this revision.
