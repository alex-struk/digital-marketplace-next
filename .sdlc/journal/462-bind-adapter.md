---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-03T18:15:13.010Z"
cost: 0.32109139999999997
turns: 11
session: "274e3ba1-e069-486a-923f-62ca49a498ec"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I've changed `removeTeamMember` so it now waits for the server to answer the removal before it returns, which should stop R-3.11 from reading an empty refusal. I couldn't type-check the changed file, and the fix has not been run against the target.

**The problem.** R-3.11 removes the organization's sole owner and expects the refusal. The adapter clicked Remove, answered the confirmation and returned straight away. The refusal is only drawn after the server answers the delete request for that membership. So whether `organizationEdit.fieldError` saw it depended on timing, which is why R-3.11 failed, passed and failed again with nothing changed in the application.

**The change.** It is in the shared row helper `orgInRow` in `tests/adapters/new/index.ts`, which `removeTeamMember` and `approvePendingMember` both use:
- Before pressing the row's control, it starts listening for the next request to `/api/affiliations` that isn't a plain read (GET).
- After the confirmation, it waits up to 15 seconds for that answer.
- Once the answer arrives, it waits for the page to go quiet. It then gives an alert in the Team members section up to 2 seconds to appear.
- If no answer comes, it carries on as before rather than failing, because the action itself didn't fail.

I chose to fix the action rather than make `fieldError` wait for an alert. `fieldError` is also used where the right answer is that nothing is shown. Making it wait would slow every one of those reads and risk deciding those tests. The cost is that a successful removal or approval now takes up to about 2 extra seconds, spent waiting for an alert that never comes.

**Unverified assumption.** I matched the request by the `/api/affiliations` path the ruling gave, and did not watch it in the browser this run. I also assumed approving a pending member goes to the same endpoint; if it doesn't, that action just behaves as before.

**Not checked.** The tool permissions in this session blocked the TypeScript compiler. I did confirm that the two helpers the new code uses are defined at the top of the adapter, where `orgInRow` can reach them.

Nothing else in the adapter changed. `tests/adapters/new/bindings.yaml` is untouched, because no member moved between bound and unbound. I wrote nothing outside `tests/adapters/new/`, and no page's route was rechecked this run.