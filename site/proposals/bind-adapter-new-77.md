| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T07:33:34.105Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether this revision of opportunity-swu-create.add_phase binds what build-slice-15 asked and nothing more. It was escalated only because the request loop passed policy.loops.request, not because of a defect in the diff. The diff answers the one ask still owed, the sixth in the runner's account. addPhase now fills a phase's maximum budget and ticks each named required capability, both looked up by label inside that phase's own group each time the action runs. Where the group has no field for a key, it throws unbound:, naming the key, value, phase and the fields the group does offer, rather than dropping the key. A disabled capability box throws at once. No other adapter code or bindings.yaml entry changed, and the runner's typecheck of adapters/new passed with no diagnostics. The author's walk of /opportunities/sprint-with-us/create as administrator found each phase group offering only start and completion dates. So R-2.19's two form cases now end at a named unbound: instead of passing on a half-filled form, which is what the ask required, and a later build that adds the fields will be filled without rebinding. This does not settle build-slice-15-3#2, which belongs to build: the Sprint With Us form must offer per-phase budget and capabilities. It stays open, and those two R-2.19 cases cannot be judged on the application's merits until it is met. This ruling would change if the adapter refused keys the form does offer, filled the opportunity-wide Total maximum budget instead of a box inside the phase group, or changed anything beyond addPhase.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `89db465ab9fd8fa18e069e3caf5983fc5cab5555`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
