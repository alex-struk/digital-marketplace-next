---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "The two new observations on `opportunity-counters` (`view_count` and `refused_when_not_permitted`) are now bound in `tests/adapters/old/index.ts` and listed as `bound` in `tests/adapters/old/bindings.…"
opened: 2026-10-01T13:54:36.376Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** The two new observations on `opportunity-counters` (`view_count` and `refused_when_not_permitted`) are now bound in `tests/adapters/old/index.ts` and listed as `bound` in `tests/adapters/old/bindings.…

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've brought the old adapter up to the current contract. The two new observations on `opportunity-counters` (`view_count` and `refused_when_not_permitted`) are now bound in `tests/adapters/old/index.ts` and listed as `bound` in `tests/adapters/old/bindings.yaml`. I didn't touch any other page's existing bindings. I could not type-check or run the file, because this session wasn't allowed to run the TypeScript compiler. The binding has only been checked by reading it, so calibrate will be the first thing to run it.

**What the target does.** The page's route is a request, not a screen, and it does resolve on the target. I checked it in the browser against the seeded published Code With Us opportunity, using the counter name `opportunity.code-with-us.<id>.views`:
- **Administrator, before the opportunity's public page was opened:** the service answered 200 with an empty object, so a counter that has never been counted is simply missing.
- **Administrator, after opening the public page:** the answer gave that counter a count of 1.
- **Public sector staff:** read the same count.
- **Vendor:** refused with 401 and "You do not have permission to perform this action."
- **Signed out:** my attempt to sign out mid-check didn't clearly take effect. The second request also got 401, so a request with no session is probably refused too, but that wasn't shown on its own.

**How it's bound.**
- **Opening the page:** `open` accepts a seed opportunity handle or a raw identifier. It takes the programme from the parameters, or from the seed record if none is given, builds the counter name, and sends the request once.
- **`view_count`:** sends the request again every time it is read, so a test polling for a change sees the current figure. It returns the number, or "0" when the counter is missing from the answer. When the request is refused there is no count, so it returns an empty string rather than a number.
- **`refused_when_not_permitted`:** returns the status and body when the answer is 401 or 403, and an empty string otherwise.
- **When there's nothing to read:** both observations throw `unbound:` only if no opportunity was ever opened. A page that was reached and refused, or reached and empty, is reported as it is.

Nothing in this run was reported unbound, and I made no changes outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether bind-adapter-old-59 binds the contract's new opportunity-counters page (view_count, refused_when_not_permitted) on old, and nothing else. It does. The diff touches only tests/adapters/old/index.ts and bindings.yaml plus pipeline records, with nothing under tests/acceptance, the contract or tests/generated. The runner's typecheck failed with exit 2 but reports no diagnostics under adapters/old/; its only diagnostic is in adapters/new/, which this proposal does not answer for. open builds the counter name opportunity.<program>.<id>.views from params, or from the seed record's program, and requests the route surface.yaml:2474 declares. view_count returns the count or '0' for an absent counter, which observables.yaml:321-322 states explicitly, and returns empty on a refused request. refused_when_not_permitted reports status and body on 401/403, the same pattern every existing refusal binding in the file uses. Neither observation decides an outcome, and unbound: is thrown only when no opportunity was ever opened. The author's browser check against the seeded Code With Us opportunity matches the bindings for administrator, staff and vendor; the unshown signed-out case is a question about the application, not the binding. The test for R-1.6 is already tracked as owed by derive-tests, so no condition is needed. What would change this ruling: a diagnostic under adapters/old/ in the runner's typecheck, or a calibration showing the adapter reads a counter other than the one the criterion names.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `7e6aa4d33a2b68be0ff76f8f4fb8b7e3a0f275fb`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
