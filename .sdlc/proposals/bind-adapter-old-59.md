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
