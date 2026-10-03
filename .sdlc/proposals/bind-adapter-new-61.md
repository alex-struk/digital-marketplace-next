---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I made the one change this condition asked for."
opened: 2026-10-03T15:35:56.606Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I made the one change this condition asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change this condition asked for. In `tests/adapters/new/index.ts`, the organization profile field table now accepts the input key `addressLineTwo` as `streetAddress2`, the second street-address line. It sits alongside the spellings already accepted there (`streetAddress2`, `street_address_2`, `street2`, `addressLine2`). Nothing else in the adapter or in `bindings.yaml` changed.

**Why this fixes the failure.** Before building a request, the adapter checks every input key against that table, and any key it doesn't recognise makes it throw `unbound`. That check is why `register_by_request` (R-3.2) and `change_profile_by_request` (R-3.18) both threw on `addressLineTwo` before sending anything. Both the check and the code that copies values into the request read the same table, so the key is now accepted and its value goes out as `streetAddress2`, matching how the old target's binding handles it. The adapter's form-based organization paths already took `addressLineTwo`; only the request path was missing it.

**Bindings file.** `bindings.yaml` already lists both actions as `bound` under `organization-request`, so it needed no edit.

**What I did not do.** I didn't open the running target again. The condition was about a missing input key, not a missing control, and the target's handling of the second address line had already been bound and accepted. I also couldn't run a type-check: the sandbox needed an approval for it, and there's nobody here to give one. The edit only adds one string to an existing array, so it shouldn't change any types.

Nothing in this request is deferred.
